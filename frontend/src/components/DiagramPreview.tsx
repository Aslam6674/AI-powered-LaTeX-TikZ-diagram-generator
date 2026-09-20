"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  tikzCode: string;
  onClose: () => void;
}

export function DiagramPreview({ tikzCode, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Strip any markdown fences if present
  const cleanCode = tikzCode
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  // Extract only the tikzpicture block (TikZJax needs just the environment)
  const tikzPictureMatch = cleanCode.match(
    /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/
  );
  const tikzBody = tikzPictureMatch ? tikzPictureMatch[0] : cleanCode;

  // Extract usetikzlibrary declarations from comments or actual calls
  const libMatches = cleanCode.match(/\\usetikzlibrary\{([^}]+)\}/g) ?? [];
  const commentLibMatches =
    cleanCode.match(/%.*\\usetikzlibrary\{([^}]+)\}/g) ?? [];
  const allLibLines = [...libMatches, ...commentLibMatches.map((l) =>
    l.replace(/^%\s*/, "")
  )];
  const uniqueLibs = Array.from(
    new Set(
      allLibLines.flatMap((l) => {
        const m = l.match(/\\usetikzlibrary\{([^}]+)\}/);
        return m ? m[1].split(",").map((s) => s.trim()) : [];
      })
    )
  ).join(",");

  useEffect(() => {
    if (!containerRef.current) return;

    setStatus("loading");

    // Inject TikZJax script if not already present
    const scriptId = "tikzjax-script";
    const injectAndRender = () => {
      if (!containerRef.current) return;

      // Build the tikzjax script element
      const scriptEl = document.createElement("script");
      scriptEl.type = "text/tikz";
      scriptEl.setAttribute("data-tikz-options", JSON.stringify({
        "tikz libraries": uniqueLibs || "arrows.meta,shapes,positioning,calc",
      }));
      scriptEl.textContent = tikzBody;

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(scriptEl);

      // TikZJax replaces the script tag with an SVG — poll for it
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        const svg = containerRef.current?.querySelector("svg");
        if (svg) {
          setStatus("ready");
          clearInterval(poll);
        } else if (attempts > 60) {
          setStatus("error");
          clearInterval(poll);
        }
      }, 500);
    };

    if (document.getElementById(scriptId)) {
      injectAndRender();
    } else {
      const js = document.createElement("script");
      js.id = scriptId;
      js.src = "https://tikzjax.com/v1/tikzjax.js";
      js.async = true;
      js.onload = injectAndRender;
      js.onerror = () => setStatus("error");
      document.head.appendChild(js);
    }
  }, [tikzBody, uniqueLibs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-sm w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-[#9cdcfe] uppercase tracking-wider">
              Diagram Preview
            </span>
            {status === "loading" && (
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#9cdcfe] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#9cdcfe] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#9cdcfe] rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="text-xs text-[#6f6f6f] font-mono ml-1">Compiling TikZ…</span>
              </span>
            )}
            {status === "ready" && (
              <span className="text-xs text-[#24a148] font-mono">✓ Rendered</span>
            )}
            {status === "error" && (
              <span className="text-xs text-[#da1e28] font-mono">⚠ Render failed — check TikZ syntax</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#6f6f6f] hover:text-white text-lg leading-none font-mono transition-colors px-1"
          >
            ✕
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-white flex items-center justify-center p-8 min-h-[400px]">
          {status === "error" ? (
            <div className="text-center space-y-3">
              <p className="text-[#da1e28] text-sm font-medium">Could not render diagram in browser.</p>
              <p className="text-[#6f6f6f] text-xs max-w-sm leading-relaxed">
                TikZJax supports most standard TikZ diagrams. For complex diagrams with
                custom packages, use <strong>Wrap Doc</strong> and compile locally with
                pdflatex, or paste into{" "}
                <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 underline">Overleaf</a>.
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="flex items-center justify-center w-full h-full [&_svg]:max-w-full [&_svg]:max-h-[60vh] [&_svg]:h-auto"
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2a2a] px-4 py-2 flex items-center justify-between">
          <p className="text-[11px] text-[#6f6f6f] font-mono">
            Rendered in-browser via TikZJax · For full fidelity use pdflatex or Overleaf
          </p>
          <div className="flex gap-2">
            <a
              href="https://www.overleaf.com/project"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9cdcfe] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 font-mono transition-colors hover:text-white"
            >
              Open Overleaf ↗
            </a>
            <button
              onClick={onClose}
              className="text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#9cdcfe] px-3 py-1 font-mono transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
