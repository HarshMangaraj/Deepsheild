"use client";

import { DetectionSignal } from "../lib/api";

interface SignalBreakdownProps {
  signals: DetectionSignal[];
  summary: { high: number; medium: number; total: number };
}

const SEVERITY_CONFIG: Record<DetectionSignal["severity"], {
  label: string;
  dot: string;
  text: string;
  bar: string;
  border: string;
  bg: string;
}> = {
  high:   { label: "High",   dot: "bg-red-500",    text: "text-red-400",    bar: "bg-red-500",    border: "border-red-500/20",   bg: "bg-red-500/5"   },
  medium: { label: "Medium", dot: "bg-amber-500",  text: "text-amber-400",  bar: "bg-amber-500",  border: "border-amber-500/20", bg: "bg-amber-500/5" },
  low:    { label: "Low",    dot: "bg-blue-400",   text: "text-blue-400",   bar: "bg-blue-400",   border: "border-blue-500/20",  bg: "bg-blue-500/5"  },
  clean:  { label: "Clean",  dot: "bg-emerald-500",text: "text-emerald-400",bar: "bg-emerald-500",border: "border-emerald-500/20",bg: "bg-emerald-500/5"},
};

const CATEGORY_LABELS: Record<string, string> = {
  model:       "Model",
  frequency:   "Frequency",
  statistical: "Statistical",
  spatial:     "Spatial",
};

export default function SignalBreakdown({ signals, summary }: SignalBreakdownProps) {
  return (
    <div className="w-full space-y-3 fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white/80">Signal Breakdown</h3>
          <p className="text-xs text-white/30 mt-0.5">
            Why the model made this decision
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex items-center gap-2">
          {summary.high > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {summary.high} high
            </span>
          )}
          {summary.medium > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {summary.medium} medium
            </span>
          )}
        </div>
      </div>

      {/* ── Signal list ── */}
      <div className="space-y-2">
        {signals.map((signal) => {
          const cfg = SEVERITY_CONFIG[signal.severity];
          return (
            <div
              key={signal.id}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}
            >
              {/* Signal header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/75 truncate">
                      {signal.name}
                    </p>
                    <p className="text-xs text-white/30 font-mono mt-0.5">
                      {CATEGORY_LABELS[signal.category] ?? signal.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-mono font-bold ${cfg.text}`}>
                    {Math.round(signal.score * 100)}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text} font-mono`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${signal.score * 100}%` }}
                />
              </div>

              {/* Description */}
              <p className="text-xs text-white/35 leading-relaxed">
                {signal.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Educational footer ── */}
      <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-xs text-white/25 leading-relaxed">
          <span className="text-white/40 font-semibold">How to read this:</span>{" "}
          Each signal is an independent analysis method. High severity means that
          method found strong evidence of manipulation. A real image can trigger
          low signals — the final verdict weighs all signals together through the
          neural network's learned decision boundary.
        </p>
      </div>
    </div>
  );
}