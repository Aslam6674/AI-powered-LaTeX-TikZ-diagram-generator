import { NextRequest, NextResponse } from "next/server";

function buildStandaloneDoc(tikzCode: string): string {
  const clean = tikzCode
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  if (clean.includes("\\documentclass")) return clean;

  const libMatches = clean.match(/\\usetikzlibrary\{([^}]+)\}/g) ?? [];
  const commentLibMatches = clean.match(/%[^\n]*\\usetikzlibrary\{([^}]+)\}/g) ?? [];
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
  const defaultLibs = [
    "arrows.meta", "shapes", "shapes.geometric", "positioning",
    "fit", "calc", "decorations.pathreplacing", "shadows",
  ];
  const finalLibs = Array.from(new Set([...defaultLibs, ...uniqueLibs])).join(",");

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

// Returns the wrapped .tex source so the client can:
//  a) download it as diagram.tex
//  b) POST it to Overleaf's "open in Overleaf" form
export async function POST(req: NextRequest) {
  try {
    const { tikzCode } = (await req.json()) as { tikzCode?: string };

    if (!tikzCode?.trim()) {
      return NextResponse.json({ error: "No TikZ code provided" }, { status: 400 });
    }

    const latexSource = buildStandaloneDoc(tikzCode);

    // Return the .tex source — client will handle download + Overleaf redirect
    return NextResponse.json({ latexSource });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
