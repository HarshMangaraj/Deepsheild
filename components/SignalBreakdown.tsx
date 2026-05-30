"use client";

import { DetectionSignal } from "../lib/api";

interface SignalBreakdownProps {
  signals: DetectionSignal[];
  summary: { high: number; medium: number; total: number };
}

const SEVERITY: Record<string, { chip: string; bar: string; label: string }> = {
  high:   { chip: "chip-high",   bar: "var(--blush)",    label: "High"   },
  medium: { chip: "chip-medium", bar: "#C4A050",         label: "Medium" },
  low:    { chip: "chip-low",    bar: "var(--sage)",     label: "Low"    },
  clean:  { chip: "chip-clean",  bar: "#5A8C6E",         label: "Clean"  },
};

const CAT: Record<string, string> = {
  model: "Model", frequency: "Frequency", statistical: "Statistical", spatial: "Spatial",
};

export default function SignalBreakdown({ signals }: SignalBreakdownProps) {
  return (
    <div className="space-y-3">
      {signals.map((s) => {
        const cfg = SEVERITY[s.severity];
        return (
          <div
            key={s.id}
            className="card-hover rounded-sm border px-4 py-4 space-y-3"
            style={{ borderColor: "var(--sand)", background: "var(--cream)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium mb-0.5 truncate" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                  {s.name}
                </p>
                <p className="label-sm">{CAT[s.category] ?? s.category}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="label-sm" style={{ fontFamily: "var(--font-mono)" }}>
                  {Math.round(s.score * 100)}%
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-sm font-mono ${cfg.chip}`}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ background: cfg.bar, width: `${s.score * 100}%` }}
              />
            </div>

            <p className="text-xs leading-relaxed" style={{ color: "var(--graphite)" }}>
              {s.description}
            </p>
          </div>
        );
      })}

      <div
        className="px-4 py-3 rounded-sm border"
        style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--stone)" }}>
          <span style={{ color: "var(--graphite)", fontWeight: 500 }}>Reading signals: </span>
          Each signal is an independent analysis method. High severity means that method found strong evidence of manipulation. A genuine image can trigger low signals — the final verdict weighs all signals through the model's learned decision boundary.
        </p>
      </div>
    </div>
  );
}