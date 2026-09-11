"use client";

export function TopBar() {
  return (
    <header className="bg-ibm-gray100 text-white flex items-center justify-between px-6 py-0 h-12 shrink-0 border-b border-[#2a2a2a]">
      <div className="flex items-center gap-3">
        {/* IBM logo mark */}
        <svg width="32" height="13" viewBox="0 0 32 13" fill="white" aria-label="IBM">
          <path d="M0 0h32v2H0zM0 3.5h32v2H0zM0 7h32v2H0zM0 10.5h32v2H0z" opacity=".3"/>
          <rect x="0" y="0" width="4" height="2"/>
          <rect x="0" y="3.5" width="4" height="2"/>
          <rect x="0" y="7" width="4" height="2"/>
          <rect x="0" y="10.5" width="4" height="2"/>
          <rect x="6" y="0" width="20" height="2"/>
          <rect x="6" y="10.5" width="20" height="2"/>
          <rect x="6" y="3.5" width="8" height="2"/>
          <rect x="6" y="7" width="8" height="2"/>
          <rect x="18" y="3.5" width="8" height="2"/>
          <rect x="18" y="7" width="8" height="2"/>
          <rect x="28" y="0" width="4" height="2"/>
          <rect x="28" y="3.5" width="4" height="2"/>
          <rect x="28" y="7" width="4" height="2"/>
          <rect x="28" y="10.5" width="4" height="2"/>
        </svg>
        <span className="text-sm font-semibold tracking-wide">LaTeX Diagram Generator</span>
        <span className="text-xs text-[#8d8d8d] border border-[#393939] px-1.5 py-0.5 rounded-sm">
          Granite · Watson Studio
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#8d8d8d]">
        <span className="w-2 h-2 rounded-full bg-ibm-green inline-block" />
        IBM Granite 3.3
      </div>
    </header>
  );
}
