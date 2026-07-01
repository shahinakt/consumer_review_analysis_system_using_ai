import React from "react";

const colorMap = {
  accent: "#7C5CFF",
  positive: "#34D399",
  negative: "#FB7185",
  neutral: "#FBBF24",
};

export default function KPICard({ label, value, suffix = "", tone = "accent", icon: Icon }) {
  const color = colorMap[tone] || colorMap.accent;

  return (
    <div
      className="glass pulse-bar p-5 pl-6 flex flex-col gap-2"
      style={{ "--pulse-color": color }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-muted font-medium">
          {label}
        </span>
        {Icon && (
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <div className="font-mono text-3xl font-semibold text-ink-primary">
        {value}
        <span className="text-lg text-ink-muted ml-1">{suffix}</span>
      </div>
    </div>
  );
}
