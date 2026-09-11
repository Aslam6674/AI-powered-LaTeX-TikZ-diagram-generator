"use client";

const EXAMPLES = [
  "A 4-step machine learning pipeline flowchart: data ingestion → preprocessing → training → evaluation, with a decision diamond for model accuracy threshold",
  "A 3-layer neural network with 4 input nodes, 6 hidden nodes, and 2 output nodes with labeled connections",
  "A system architecture block diagram with three subsystems: data ingestion, processing engine, and visualization dashboard",
  "A finite state machine with states: idle, authenticating, authenticated, error — with labeled transitions",
  "A horizontal timeline showing 5 research milestones from Q1 2023 to Q1 2024",
];

interface Props {
  onExample: (text: string) => void;
}

export function WelcomeBanner({ onExample }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-ibm-gray100">
          AI-Powered TikZ Generator
        </h2>
        <p className="text-sm text-ibm-gray60 leading-relaxed">
          Describe any academic diagram in plain English. IBM Granite will generate publication-ready
          TikZ code for your LaTeX documents — flowcharts, neural networks, state machines,
          timelines, and more.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-ibm-gray60 uppercase tracking-wider">
          Try an example
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => onExample(ex)}
              className="w-full text-left text-xs text-ibm-gray80 bg-ibm-gray10 hover:bg-ibm-gray20 border border-ibm-gray20 hover:border-ibm-gray30 px-3 py-2.5 transition-colors rounded-sm leading-relaxed"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-ibm-gray20 bg-ibm-gray10 p-3 rounded-sm space-y-1">
        <p className="text-xs font-semibold text-ibm-gray60 uppercase tracking-wider">
          Workflow
        </p>
        <ol className="text-xs text-ibm-gray60 space-y-1 list-decimal list-inside">
          <li>Select diagram type and style</li>
          <li>Type your description and click Generate</li>
          <li>TikZ code appears on the right with syntax highlighting</li>
          <li>Refine with plain-English commands (e.g. "make node A red")</li>
          <li>Copy, download, or wrap in a full LaTeX document</li>
        </ol>
      </div>
    </div>
  );
}
