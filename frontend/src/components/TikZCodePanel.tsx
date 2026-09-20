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
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            disabled={!tikzCode || isGenerating}
            className="text-xs bg-[#0f62fe] hover:bg-[#0353e9] disabled:bg-[#2a2a2a] disabled:text-[#4a4a4a] text-white px-3 py-1 transition-colors font-mono font-semibold"
          >
            ▶ Preview
          </button>
          <button
            onClick={onExplain}
            disabled={isGenerating}
            className="text-xs text-[#9cdcfe] hover:text-white disabled:text-[#4a4a4a] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 transition-colors font-mono"
          >
            Explain
          </button>
          <button
            onClick={onWrap}
            disabled={isGenerating}
            className="text-xs text-[#9cdcfe] hover:text-white disabled:text-[#4a4a4a] border border-[#3c3c3c] hover:border-[#6c6c6c] px-3 py-1 transition-colors font-mono"
          >
            Wrap Doc
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
            className="text-xs bg-ibm-blue text-white hover:bg-ibm-blue-hover disabled:bg-[#3a3a3a] disabled:text-[#6a6a6a] px-3 py-1 transition-colors font-mono"
          >
            {downloaded ? "✓ Saved" : "Download"}
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
