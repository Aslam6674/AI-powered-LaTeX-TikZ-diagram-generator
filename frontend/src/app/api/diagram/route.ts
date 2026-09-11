import { NextRequest, NextResponse } from "next/server";

const GRANITE_API_BASE =
  process.env.GRANITE_API_URL ??
  "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation";
const GRANITE_API_VERSION = process.env.GRANITE_API_VERSION ?? "2023-05-29";
const GRANITE_API_URL = `${GRANITE_API_BASE}?version=${GRANITE_API_VERSION}`;
const GRANITE_API_KEY = process.env.GRANITE_API_KEY ?? "";
const WATSON_PROJECT_ID = process.env.WATSON_PROJECT_ID ?? "";
const GRANITE_MODEL_ID = process.env.GRANITE_MODEL_ID ?? "meta-llama/llama-3-3-70b-instruct";

// IAM token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getIAMToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: GRANITE_API_KEY,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

const TIKZ_SYSTEM_PROMPT = `You are an expert LaTeX/TikZ diagram engineer with deep knowledge of:
- TikZ and PGF libraries (arrows, shapes, positioning, fit, matrix, calc, decorations, mindmap, graphs)
- Academic diagram conventions (flowcharts, neural networks, circuit diagrams, block diagrams, sequence diagrams, graphs, trees, state machines)
- Publication-quality typesetting for IEEE, ACM, Springer journals

Rules:
1. Always produce complete, compilable TikZ code wrapped in \\begin{tikzpicture}...\\end{tikzpicture}.
2. Include required \\usetikzlibrary{} calls as a comment block at the top.
3. Use descriptive node names. Align nodes using the positioning library.
4. Prefer relative positioning (above of, below of, right of) over absolute coordinates.
5. For flowcharts: use standard ANSI/ISO flowchart symbols.
6. Return ONLY the TikZ code block — no markdown fences, no prose outside code comments.
7. Add a comment block at top listing required packages and libraries.`;

function buildPrompt(systemPrompt: string, userMessage: string): string {
  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}

async function callGranite(systemPrompt: string, userMessage: string, maxTokens = 1200): Promise<string> {
  const token = await getIAMToken();

  const res = await fetch(GRANITE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_id: GRANITE_MODEL_ID,
      project_id: WATSON_PROJECT_ID,
      input: buildPrompt(systemPrompt, userMessage),
      parameters: {
        decoding_method: "greedy",
        max_new_tokens: maxTokens,
        stop_sequences: ["<|eot_id|>", "<|start_header_id|>"],
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Granite API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { results: { generated_text: string }[] };
  return data.results?.[0]?.generated_text?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: "generate" | "refine" | "explain" | "wrap";
      description?: string;
      diagramType?: string;
      style?: string;
      currentCode?: string;
      instruction?: string;
      tikzCode?: string;
      caption?: string;
      label?: string;
    };

    if (!GRANITE_API_KEY || !WATSON_PROJECT_ID) {
      return NextResponse.json(
        { error: "IBM Watson credentials not configured. Set GRANITE_API_KEY and WATSON_PROJECT_ID environment variables." },
        { status: 503 }
      );
    }

    let result = "";

    if (body.action === "generate") {
      const typeHint =
        !body.diagramType || body.diagramType === "auto"
          ? "Determine the most appropriate diagram type."
          : `Generate a ${body.diagramType.replace("_", " ")} diagram.`;
      const styleHint =
        body.style === "minimal"
          ? "Use a clean, minimal aesthetic with thin lines and no fills."
          : body.style === "detailed"
          ? "Use rich styling: shaded fills, thick lines, and drop shadows where appropriate."
          : "Use standard academic styling.";

      result = await callGranite(
        TIKZ_SYSTEM_PROMPT,
        `${typeHint} ${styleHint}\n\nDiagram description:\n${body.description}`,
        1400
      );
    } else if (body.action === "refine") {
      const refineSystem = `${TIKZ_SYSTEM_PROMPT}\n\nAdditional rule: You are given existing TikZ code and a change request. Make ONLY the changes requested. Preserve everything else exactly. Return the complete updated TikZ code.`;
      result = await callGranite(
        refineSystem,
        `Existing TikZ code:\n${body.currentCode}\n\nRefinement instruction:\n${body.instruction}`,
        1500
      );
    } else if (body.action === "explain") {
      const explainSystem = `You are a TikZ expert. Analyze TikZ code and:
1. Describe what diagram it renders (2-3 sentences).
2. List major structural elements (nodes, edges, styles).
3. Note any potential compilation issues.
4. Suggest 2-3 improvements for academic publication quality.
Be concise and structured.`;
      result = await callGranite(explainSystem, body.tikzCode ?? "", 700);
    } else if (body.action === "wrap") {
      const tikz = body.tikzCode ?? "";
      result = `\\documentclass[tikz,border=4pt]{standalone}\n\\usepackage{tikz}\n\\usepackage{amsmath,amssymb}\n\\usetikzlibrary{arrows.meta,shapes,positioning,fit,calc,decorations.pathreplacing,shadows}\n\\begin{document}\n${tikz}\n\\end{document}`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
