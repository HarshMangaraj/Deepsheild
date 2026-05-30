"use client";

import { DetectionResult } from "../lib/api";

interface ResultCardProps {
  result: DetectionResult;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const isFake = result.verdict === "FAKE";

  // Color scheme switches entirely based on verdict
  const accent = isFake
    ? { text: "text-red-400",   border: "border-red-500/20",  bg: "bg-red-500/10",  bar: "bg-red-500",   glow: "shadow-red-500/20"  }
    : { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10", bar: "bg-emerald-500", glow: "shadow-emerald-500/20" };

  return (
    <div className={`w-full rounded-2xl border ${accent.border} ${accent.bg} overflow-hidden fade-in`}>

      {/* ── Verdict header ── */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isFake ? (
            // Warning icon for FAKE
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          ) : (
            // Check icon for REAL
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          )}

          <div>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Verdict</p>
            <p className={`text-2xl font-black tracking-tight ${accent.text}`}>
              {isFake ? "Likely Deepfake" : "Likely Authentic"}
            </p>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5"
        >
          ← New image
        </button>
      </div>

      {/* ── Confidence bar ── */}
      <div className="px-6 pb-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
            {isFake ? "Fake" : "Real"} confidence
          </span>
          <span className={`text-sm font-bold font-mono ${accent.text}`}>
            {result.confidence_pct}%
          </span>
        </div>

        {/* Track */}
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          {/* Fill — width animates from 0 to confidence_pct via CSS */}
          <div
            className={`h-full rounded-full ${accent.bar} transition-all duration-700 ease-out`}
            style={{ width: `${result.confidence_pct}%` }}
          />
        </div>

        {/* Confidence label */}
        <p className="text-xs text-white/30">
          {result.confidence_pct >= 90
            ? "Very high confidence — strong manipulation signals detected."
            : result.confidence_pct >= 70
            ? "High confidence — several anomalies found."
            : result.confidence_pct >= 55
            ? "Moderate confidence — some signals present, treat with caution."
            : "Low confidence — image is close to the decision boundary."}
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-white/5 mx-6" />

      {/* ── Metadata grid ── */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4">
        {[
          {
            label: "Raw score",
            value: result.fake_probability.toFixed(3),
            hint: "Model output before threshold",
          },
          {
            label: "Processed in",
            value: `${result.processing_time_ms}ms`,
            hint: "Server-side inference time",
          },
          {
            label: "Image size",
            value: `${result.image_size.width}×${result.image_size.height}`,
            hint: "Original dimensions",
          },
        ].map((item) => (
          <div key={item.label} className="space-y-0.5">
            <p className="text-white/25 text-xs font-mono uppercase tracking-widest">{item.label}</p>
            <p className="text-white/70 text-sm font-semibold font-mono">{item.value}</p>
            <p className="text-white/20 text-xs">{item.hint}</p>
          </div>
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <div className="mx-6 mb-5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-white/25 text-xs leading-relaxed">
          <span className="text-white/40 font-semibold">Disclaimer:</span>{" "}
          DeepShield is a portfolio ML project. Results should not be used as sole
          evidence in legal or professional contexts. Phase 4 will add detailed
          signal explanations.
        </p>
      </div>
    </div>
  );
}