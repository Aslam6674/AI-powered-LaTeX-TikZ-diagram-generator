"use client";

import { DiagramType } from "@/app/page";

const DIAGRAM_TYPES: { value: DiagramType; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "flowchart", label: "Flowchart" },
  { value: "neural_network", label: "Neural Network" },
  { value: "block_diagram", label: "Block Diagram" },
  { value: "state_machine", label: "State Machine" },
  { value: "sequence_diagram", label: "Sequence Diagram" },
  { value: "tree", label: "Tree" },
  { value: "graph", label: "Graph" },
  { value: "circuit", label: "Circuit" },
  { value: "timeline", label: "Timeline" },
  { value: "mindmap", label: "Mindmap" },
];

interface Props {
  value: DiagramType;
  onChange: (v: DiagramType) => void;
  disabled?: boolean;
}

export function DiagramTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-ibm-gray60 mb-1 uppercase tracking-wide">
        Diagram Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DiagramType)}
        disabled={disabled}
        className="w-full border border-ibm-gray30 bg-white text-sm text-ibm-gray100 px-3 py-2 focus:outline-none focus:border-ibm-blue disabled:bg-ibm-gray10 disabled:text-ibm-gray60 transition-colors rounded-sm"
      >
        {DIAGRAM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
