#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── IBM Granite API configuration ────────────────────────────────────────────
const GRANITE_API_BASE = process.env.GRANITE_API_URL ?? "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation";
const GRANITE_API_VERSION = process.env.GRANITE_API_VERSION ?? "2023-05-29";
const GRANITE_API_URL = `${GRANITE_API_BASE}?version=${GRANITE_API_VERSION}`;
const GRANITE_API_KEY = process.env.GRANITE_API_KEY ?? "";
const WATSON_PROJECT_ID = process.env.WATSON_PROJECT_ID ?? "";
const GRANITE_MODEL_ID = process.env.GRANITE_MODEL_ID ?? "meta-llama/llama-3-3-70b-instruct";

if (!GRANITE_API_KEY) {
  console.error("[latex-diagram-mcp] WARNING: GRANITE_API_KEY not set. API calls will fail.");
}

// ── IBM IAM token cache ───────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getIAMToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: GRANITE_API_KEY,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IAM token fetch failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

// ── Core Granite inference call ───────────────────────────────────────────────
function buildPrompt(systemPrompt: string, userMessage: string): string {
  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}

async function callGranite(systemPrompt: string, userMessage: string, maxTokens = 1200): Promise<string> {
  const token = await getIAMToken();

  const body = {
    model_id: GRANITE_MODEL_ID,
    project_id: WATSON_PROJECT_ID,
    input: buildPrompt(systemPrompt, userMessage),
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: maxTokens,
      stop_sequences: ["<|eot_id|>", "<|start_header_id|>"],
      temperature: 0.2,
    },
  };

  const response = await fetch(GRANITE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Granite API error (${response.status}): ${text}`);
  }

  const result = (await response.json()) as {
    results: { generated_text: string }[];
  };
  return result.results?.[0]?.generated_text?.trim() ?? "";
}

// ── Shared system prompt ──────────────────────────────────────────────────────
const TIKZ_SYSTEM_PROMPT = `You are an expert LaTeX/TikZ diagram engineer.

STRICT OUTPUT FORMAT — you MUST follow this exactly:
Output a COMPLETE, standalone LaTeX document that compiles without errors.
The output MUST start with \\documentclass and end with \\end{document}.
Never output just a tikzpicture block alone. Never put packages in comments.

Required structure:

\\documentclass[tikz,border=8pt]{standalone}
\\usepackage{tikz}
\\usepackage{amsmath,amssymb}
\\usetikzlibrary{arrows.meta,shapes,shapes.geometric,positioning,calc,fit,decorations.pathreplacing}
\\begin{document}
\\begin{tikzpicture}[...]
  % your diagram nodes and edges here
\\end{tikzpicture}
\\end{document}

Additional rules:
- Use the positioning library and relative placement (above of, below of, right of, left of).
- For flowcharts use rectangle for process, diamond for decision, rounded rectangle for start/end.
- Use descriptive node names (no spaces).
- Do NOT wrap in markdown fences.
- Do NOT put \\usepackage or \\usetikzlibrary in comments.
- Add any extra \\usetikzlibrary calls needed for the specific diagram type.`;

// ── MCP Server setup ──────────────────────────────────────────────────────────
const server = new McpServer({ name: "latex-diagram-generator", version: "0.1.0" });

// ── Tool: generate_tikz ───────────────────────────────────────────────────────
server.registerTool(
  "generate_tikz",
  {
    description:
      "Generate a complete TikZ diagram from a natural language description. Returns compilable LaTeX/TikZ source code ready for insertion into academic documents.",
    inputSchema: z.object({
      description: z
        .string()
        .describe(
          "Natural language description of the diagram. Be specific about shape, flow, labels, and connections."
        ),
      diagram_type: z
        .enum([
          "flowchart",
          "neural_network",
          "block_diagram",
          "state_machine",
          "sequence_diagram",
          "tree",
          "graph",
          "circuit",
          "timeline",
          "mindmap",
          "auto",
        ])
        .default("auto")
        .describe("Type of diagram to generate. Use 'auto' to let the AI decide."),
      style: z
        .enum(["minimal", "standard", "detailed"])
        .default("standard")
        .describe("Visual complexity level — minimal (clean, few decorations), standard, or detailed (rich styling)."),
    }),
  },
  async ({ description, diagram_type, style }) => {
    try {
      const typeHint = diagram_type === "auto" ? "Determine the most appropriate diagram type." : `Generate a ${diagram_type.replace("_", " ")} diagram.`;
      const styleHint =
        style === "minimal"
          ? "Use a clean, minimal aesthetic with thin lines and no fills."
          : style === "detailed"
          ? "Use rich styling: gradient-like fills with gray shades, thick lines, shadows via drop shadow library where appropriate."
          : "Use standard academic styling.";

      const userMessage = `${typeHint} ${styleHint}\n\nDiagram description:\n${description}`;
      const tikzCode = await callGranite(TIKZ_SYSTEM_PROMPT, userMessage, 1400);

      return {
        content: [
          {
            type: "text" as const,
            text: tikzCode,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error generating TikZ: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: refine_tikz ─────────────────────────────────────────────────────────
server.registerTool(
  "refine_tikz",
  {
    description:
      "Refine or modify existing TikZ code based on a plain-English instruction. Preserves the overall structure while applying targeted changes.",
    inputSchema: z.object({
      current_code: z.string().describe("The existing TikZ code to refine."),
      instruction: z
        .string()
        .describe(
          "Plain-English refinement instruction, e.g. 'Make the decision diamond red', 'Add a dashed arrow from node A to node C', 'Increase font size of all labels'."
        ),
    }),
  },
  async ({ current_code, instruction }) => {
    try {
      const refineSystem = `${TIKZ_SYSTEM_PROMPT}

Additional rule for refinement tasks:
- You are given existing TikZ code and a change request.
- Make ONLY the changes requested. Preserve everything else exactly.
- Return the complete updated TikZ code.`;

      const userMessage = `Existing TikZ code:\n${current_code}\n\nRefinement instruction:\n${instruction}`;
      const refined = await callGranite(refineSystem, userMessage, 1500);

      return {
        content: [{ type: "text" as const, text: refined }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error refining TikZ: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: explain_tikz ────────────────────────────────────────────────────────
server.registerTool(
  "explain_tikz",
  {
    description: "Explain what a TikZ code block renders and provide improvement suggestions.",
    inputSchema: z.object({
      tikz_code: z.string().describe("TikZ code to explain."),
    }),
  },
  async ({ tikz_code }) => {
    try {
      const explainSystem = `You are a TikZ expert and LaTeX educator. Analyze provided TikZ code and:
1. Describe what diagram it renders in plain English (2-3 sentences).
2. List each major structural element (nodes, edges, styles).
3. Point out any potential compilation issues or non-standard patterns.
4. Suggest 2-3 specific improvements for academic publication quality.
Keep your response concise and structured.`;

      const explanation = await callGranite(explainSystem, tikz_code, 700);

      return {
        content: [{ type: "text" as const, text: explanation }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: generate_latex_document ─────────────────────────────────────────────
server.registerTool(
  "generate_latex_document",
  {
    description:
      "Wrap TikZ code in a complete, compilable LaTeX document with appropriate packages. Useful for standalone previewing.",
    inputSchema: z.object({
      tikz_code: z.string().describe("TikZ code to embed (the \\begin{tikzpicture}...\\end{tikzpicture} block)."),
      caption: z.string().optional().describe("Figure caption for the diagram."),
      label: z.string().optional().describe("LaTeX label for cross-referencing, e.g. 'fig:architecture'."),
      document_class: z
        .enum(["article", "standalone", "beamer"])
        .default("standalone")
        .describe("LaTeX document class. Use standalone for quick previews."),
    }),
  },
  async ({ tikz_code, caption, label, document_class }) => {
    const figureEnv =
      document_class === "standalone"
        ? tikz_code
        : `\\begin{figure}[htbp]\n  \\centering\n  ${tikz_code.replace(/\n/g, "\n  ")}\n${caption ? `  \\caption{${caption}}\n` : ""}${label ? `  \\label{${label}}\n` : ""}\\end{figure}`;

    const doc =
      document_class === "standalone"
        ? `\\documentclass[tikz,border=4pt]{standalone}\n\\usepackage{tikz}\n\\usepackage{amsmath,amssymb}\n\\usetikzlibrary{arrows.meta,shapes,positioning,fit,calc,decorations.pathreplacing,shadows}\n\\begin{document}\n${figureEnv}\n\\end{document}`
        : `\\documentclass{${document_class}}\n\\usepackage{tikz}\n\\usepackage{amsmath,amssymb}\n\\usetikzlibrary{arrows.meta,shapes,positioning,fit,calc,decorations.pathreplacing,shadows}\n\\begin{document}\n${figureEnv}\n\\end{document}`;

    return {
      content: [{ type: "text" as const, text: doc }],
    };
  }
);

// ── Tool: list_diagram_templates ─────────────────────────────────────────────
server.registerTool(
  "list_diagram_templates",
  {
    description: "List available TikZ diagram templates with example prompts for common academic diagram types.",
    inputSchema: z.object({}),
  },
  async () => {
    const templates = [
      { type: "flowchart", example: "A flowchart showing a 4-step data preprocessing pipeline with a decision node for data quality check" },
      { type: "neural_network", example: "A 3-layer neural network with 4 input nodes, 6 hidden nodes, and 2 output nodes" },
      { type: "block_diagram", example: "A system architecture block diagram with three subsystems: data ingestion, processing, and visualization" },
      { type: "state_machine", example: "A finite state machine with states: idle, processing, error, and done, with labeled transitions" },
      { type: "sequence_diagram", example: "A sequence diagram showing client-server-database interaction for a login request" },
      { type: "tree", example: "A binary decision tree with 3 levels and labeled edges" },
      { type: "graph", example: "An undirected graph with 6 nodes representing a social network with weighted edges" },
      { type: "circuit", example: "A simple digital circuit with AND and OR gates" },
      { type: "timeline", example: "A horizontal timeline showing 5 project milestones from Q1 to Q4" },
      { type: "mindmap", example: "A mindmap of machine learning with branches for supervised, unsupervised, and reinforcement learning" },
    ];

    const text = templates
      .map((t) => `• ${t.type.toUpperCase()}\n  Example: "${t.example}"`)
      .join("\n\n");

    return {
      content: [{ type: "text" as const, text: `Available diagram templates:\n\n${text}` }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[latex-diagram-mcp] Server running on stdio");
}

main().catch((error) => {
  console.error("[latex-diagram-mcp] Fatal error:", error);
  process.exit(1);
});
