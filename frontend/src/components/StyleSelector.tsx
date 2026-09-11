"use client";

import { StyleOption } from "@/app/page";

const STYLES: { value: StyleOption; label: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", desc: "Clean lines, no fills" },
  { value: "standard", label: "Standard", desc: "Academic default" },
  { value: "detailed", label: "Detailed", desc: "Rich styling, shading" },
];

interface Props {
  value: StyleOption;
  onChange: (v: StyleOption) => void;
  disabled?: boolean;
}

export function StyleSelector({ value, onChange, disabled }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-ibm-gray60 mb-1 uppercase tracking-wide">
        Style
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StyleOption)}
        disabled={disabled}
        className="w-full border border-ibm-gray30 bg-white text-sm text-ibm-gray100 px-3 py-2 focus:outline-none focus:border-ibm-blue disabled:bg-ibm-gray10 disabled:text-ibm-gray60 transition-colors rounded-sm"
      >
        {STYLES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label} — {s.desc}
          </option>
        ))}
      </select>
    </div>
  );
}
