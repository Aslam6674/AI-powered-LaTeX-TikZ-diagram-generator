"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  tikzCode: string;
  onExplain: () => void;
  onWrap: () => void;
  onPreview: () => void;
  isGenerating: boolean;
}

export function TikZCodePanel({ tikzCode, onExplain, onWrap, onPreview, isGenerating }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [texLoading, setTexLoading] = useState(false);
  const [overleafLoading, setOverleafLoading] = useState(false);

  const handleCopy = async () => {
    if (!tikzCode) return;
    await navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!tikzCode) return;
    const blob = new Blob([tikzCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.tikz";
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // Download a complete standalone .tex file ready for pdflatex
  const handleDownloadTex = async () => {
    if (!tikzCode || texLoading) return;
    setTexLoading(true);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tikzCode }),
      });
      const data = (await res.json()) as { latexSource?: string; error?: string };
      if (!data.latexSource) return;
      const blob = new Blob([data.latexSource], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.tex";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTexLoading(false);
    }
  };

  // Open in Overleaf — submits the full .tex directly; Overleaf compiles it instantly
  const handleOpenOverleaf = async () => {
    if (!tikzCode || overleafLoading) return;
    setOverleafLoading(true);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tikzCode }),
      });
      const data = (await res.json()) as { latexSource?: string; error?: string };
      if (!data.latexSource) return;

      // Overleaf's "open in Overleaf" accepts a form POST with snip_uri or snip
      // The simplest approach: encode as a URL and open Overleaf's /docs endpoint
      const encoded = encodeURIComponent(data.latexSource);
      const overleafUrl = `https://www.overleaf.com/docs?snip=${encoded}`;

      // If URL is too long (>8000 chars), fall back to downloading .tex
      if (overleafUrl.length > 8000) {
        const blob = new Blob([data.latexSource], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "diagram.tex";
        a.click();
        URL.revokeObjectURL(url);
        alert("Diagram is large — downloaded as diagram.tex. Upload it to Overleaf manually.");
        return;
      }

      window.open(overleafUrl, "_blank");
    } finally {
      setOverleafLoading(false);
    }
  };

  if (!tikzCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="text-[#4a4a4a] space-y-3">
          <div className="text-5xl font-mono font-light text-[#3a3a3a]">{"{ }"}</div>
          <p className="text-sm text-[#6f6f6f]">
            Generated TikZ code will appear here
          </p>
          <p className="text-xs text-[#4a4a4a] max-w-sm leading-relaxed">
            Describe your diagram on the left and click{" "}
            <span className="text-ibm-blue font-medium">Generate</span>. Use IBM Granite to produce
            publication-ready TikZ for your LaTeX documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a] bg-[#1e1e1e]">
        <span className="text-xs font-mono text-[#9cdcfe] uppercase tracking-wider font-semibold">
          TikZ Output
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onPreview}
            disabled={!tikzCode || isGenerating}
            className="text-xs bg-[#0f62fe] hover:bg-[#0353e9] disabled:bg-[#2a2a2a] disabled:text-[#4a4a4a] text-white px-3 py-1 transition-colors font-mono font-semibold"
          >
            ▶ Preview
          </button>
          <button
            onClick={handleOpenOverleaf}
            disabled={!tikzCode || overleafLoading}
            className="text-xs bg-[#24a148] hover:bg-[#1e8a3c] disabled:bg-[#2a2a2a] disabled:text-[#4a4a4a] text-white px-3 py-1 transition-colors font-mono font-semibold"
          >
            {overleafLoading ? "⏳…" : "▷ Overleaf"}
          </button>
          <button
            onClick={handleDownloadTex}
            disabled={!tikzCode || texLoading}
            className="text-xs bg-[#6e40c9] hover:bg-[#5a32a8] disabled:bg-[#2a2a2a] disabled:text-[#4a4a4a] text-white px-3 py-1 transition-colors font-mono font-semibold"
          >
            {texLoading ? "⏳…" : "⬇ .tex"}
          </button>
          <button
            onClick={onExplain}
            disabled={isGenerating}
            className="text-xs text-[#9cdcfe] hover:text-white disabled:text-[#4a4a4a] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 transition-colors font-mono"
          >
            Explain
          </button>
          <button
            onClick={handleCopy}
            disabled={!tikzCode}
            className="text-xs text-[#9cdcfe] hover:text-white disabled:text-[#4a4a4a] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 transition-colors font-mono"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!tikzCode}
            className="text-xs text-[#9cdcfe] hover:text-white disabled:text-[#4a4a4a] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 transition-colors font-mono"
          >
            {downloaded ? "✓ Saved" : ".tikz"}
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language="latex"
          style={vscDarkPlus}
          showLineNumbers
          lineNumberStyle={{ color: "#4a4a4a", fontSize: "11px", minWidth: "2.5em" }}
          customStyle={{
            margin: 0,
            padding: "1.25rem 1rem",
            fontSize: "12.5px",
            lineHeight: 1.65,
            background: "transparent",
            height: "100%",
          }}
        >
          {tikzCode}
        </SyntaxHighlighter>
      </div>

      {/* Footer stats */}
      <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 py-1.5 flex items-center gap-4 text-[11px] font-mono text-[#6f6f6f]">
        <span>{tikzCode.split("\n").length} lines</span>
        <span>{tikzCode.length} chars</span>
        <span className="text-[#4ec9b0]">LaTeX/TikZ</span>
      </div>
    </div>
  );
}
