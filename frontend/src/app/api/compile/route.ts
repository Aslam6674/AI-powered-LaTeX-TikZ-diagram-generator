import { NextRequest, NextResponse } from "next/server";

// LaTeX.Online free compilation API
const LATEX_ONLINE_URL = "https://latexonline.cc/compile";

function buildStandaloneDoc(tikzCode: string): string {
  // Strip markdown fences if present
  const clean = tikzCode
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  // Extract usetikzlibrary calls from code or comments
  const libMatches = clean.match(/\\usetikzlibrary\{([^}]+)\}/g) ?? [];
  const commentLibMatches = clean.match(/%.*\\usetikzlibrary\{([^}]+)\}/g) ?? [];
  const allLibLines = [
    ...libMatches,
    ...commentLibMatches.map((l) => l.replace(/^%\s*/, "")),
  ];
  const uniqueLibs = Array.from(
    new Set(
      allLibLines.flatMap((l) => {
        const m = l.match(/\\usetikzlibrary\{([^}]+)\}/);
        return m ? m[1].split(",").map((s) => s.trim()) : [];
      })
    )
  );

  // Always include essential libs
  const defaultLibs = ["arrows.meta", "shapes", "positioning", "fit", "calc", "decorations.pathreplacing"];
  const finalLibs = Array.from(new Set([...defaultLibs, ...uniqueLibs])).join(",");

  // Extract just the tikzpicture block if full doc not present
  const hasDocClass = clean.includes("\\documentclass");
  if (hasDocClass) return clean;

  const tikzBlock = clean.includes("\\begin{tikzpicture}")
    ? clean
    : `\\begin{tikzpicture}\n${clean}\n\\end{tikzpicture}`;

  return `\\documentclass[tikz,border=8pt]{standalone}
\\usepackage{tikz}
\\usepackage{amsmath,amssymb}
\\usetikzlibrary{${finalLibs}}
\\begin{document}
${tikzBlock}
\\end{document}`;
}

export async function POST(req: NextRequest) {
  try {
    const { tikzCode } = (await req.json()) as { tikzCode?: string };

    if (!tikzCode?.trim()) {
      return NextResponse.json({ error: "No TikZ code provided" }, { status: 400 });
    }

    const latexSource = buildStandaloneDoc(tikzCode);

    // Send to LaTeX.Online — multipart form with the .tex file
    const formData = new FormData();
    const texBlob = new Blob([latexSource], { type: "text/plain" });
    formData.append("file", texBlob, "diagram.tex");

    const response = await fetch(LATEX_ONLINE_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      // Try to extract useful error from LaTeX log
      const logMatch = errText.match(/!(.*?)(\n|$)/);
      const latexError = logMatch ? logMatch[1].trim() : `HTTP ${response.status}`;
      return NextResponse.json(
        { error: `LaTeX compilation failed: ${latexError}` },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf")) {
      // Server returned an error log instead of PDF
      const errText = await response.text();
      const logMatch = errText.match(/!(.*?)(\n|$)/);
      const latexError = logMatch ? logMatch[1].trim() : "Unknown compilation error";
      return NextResponse.json(
        { error: `LaTeX compilation failed: ${latexError}` },
        { status: 422 }
      );
    }

    // Stream the PDF back to the client
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="diagram.pdf"',
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
