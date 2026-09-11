"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  code: string;
  compact?: boolean;
}

export function TikZCodeBlock({ code, compact }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group border border-ibm-gray20 rounded-sm overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <span className="text-[11px] font-mono text-[#9cdcfe] uppercase tracking-wider">
          TikZ
        </span>
        <button
          onClick={handleCopy}
          className="text-[11px] text-[#9cdcfe] hover:text-white transition-colors font-mono"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language="latex"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: compact ? "0.75rem" : "1rem",
          fontSize: compact ? "11px" : "12px",
          lineHeight: 1.5,
          background: "transparent",
          maxHeight: compact ? "220px" : "auto",
          overflowY: compact ? "auto" : "visible",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
