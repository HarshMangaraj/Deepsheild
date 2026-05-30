"use client";

import { useState, useEffect, useRef } from "react";
import { DetectionResult } from "../lib/api";
import SignalBreakdown from "./SignalBreakdown";
import gsap from "gsap";

interface ResultCardProps {
  result: DetectionResult;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const isFake       = result.verdict === "FAKE";
  const [open, setOpen] = useState(true);
  const barRef       = useRef<HTMLDivElement>(null);
  const scoreRef     = useRef<HTMLSpanElement>(null);

  // Animate confidence bar on mount
  useEffect(() => {
    if (barRef.current) {
      gsap.fromTo(
        barRef.current,
        { width: "0%" },
        { width: `${result.confidence_pct}%`, duration: 1.2, ease: "power3.out", delay: 0.3 }
      );
    }
    // Count-up animation for score
    if (scoreRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: result.confidence_pct,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3,
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = obj.val.toFixed(1) + "%";
        },
      });
    }
  }, [result]);

  const accentColor = isFake ? "var(--blush)" : "var(--sage)";
  const accentBg    = isFake ? "#FDF0EC" : "#EEF4EC";
  const accentBorder= isFake ? "#EAC4B8" : "#C4D0BC";

  return (
    <div className="w-full space-y-3">
      {/* ── Verdict card ── */}
      <div
        className="rounded-sm border overflow-hidden"
        style={{ borderColor: accentBorder, background: accentBg }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: accentBorder }}>
          <div className="flex items-center gap-4">
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
              style={{ background: isFake ? "#F7D4C8" : "#C8DCC8", }}
            >
              {isFake ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              )}
            </div>
            <div>
              <p className="label-sm mb-0.5">Verdict</p>
              <p className="text-2xl font-light" style={{ color: accentColor, fontFamily: "var(--font-display)" }}>
                {isFake ? "Likely Deepfake" : "Likely Authentic"}
              </p>
            </div>
          </div>
          <button onClick={onReset} className="label-sm hover:opacity-60 transition-opacity" style={{ color: "var(--graphite)" }}>
            ← New image
          </button>
        </div>

        {/* Confidence */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-sm">{isFake ? "Fake" : "Real"} confidence</span>
            <span ref={scoreRef} className="text-sm font-medium" style={{ color: accentColor, fontFamily: "var(--font-mono)" }}>
              {result.confidence_pct}%
            </span>
          </div>
          <div className="bar-track">
            <div
              ref={barRef}
              className="bar-fill"
              style={{ background: accentColor, width: 0 }}
            />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--graphite)" }}>
            {result.confidence_pct >= 90
              ? "Very high confidence — strong manipulation signals detected."
              : result.confidence_pct >= 70
              ? "High confidence — several anomalies found."
              : result.confidence_pct >= 55
              ? "Moderate confidence — some signals present, treat with caution."
              : "Low confidence — image is near the decision boundary."}
          </p>
        </div>

        {/* Metadata */}
        <div className="px-6 pb-5 grid grid-cols-3 gap-4 border-t" style={{ borderColor: accentBorder }}>
          {[
            { label: "Raw score",    value: result.fake_probability.toFixed(3) },
            { label: "Processed in", value: `${result.processing_time_ms}ms`   },
            { label: "Dimensions",   value: `${result.image_size.width}×${result.image_size.height}` },
          ].map((m) => (
            <div key={m.label} className="pt-4 space-y-0.5">
              <p className="label-sm">{m.label}</p>
              <p className="text-sm font-medium" style={{ color: "var(--charcoal)", fontFamily: "var(--font-mono)" }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mx-6 mb-5 px-4 py-3 rounded-sm border" style={{ borderColor: accentBorder, background: "rgba(255,255,255,0.4)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--stone)" }}>
            <span style={{ color: "var(--graphite)", fontWeight: 500 }}>Note: </span>
            DeepShield is a portfolio ML project. Results should not be used as sole evidence in legal or professional contexts.
          </p>
        </div>
      </div>

      {/* ── Signals toggle ── */}
      {result.signals?.length > 0 && (
        <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
          <button
            onClick={() => setOpen(!open)}
            className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-light" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                Why was this flagged?
              </span>
              <span className="label-sm">
                {result.signal_summary?.high ?? 0} high · {result.signal_summary?.medium ?? 0} medium
              </span>
            </div>
            <svg
              className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="var(--stone)" strokeWidth="2.5" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className="px-6 pb-6 border-t" style={{ borderColor: "var(--sand)" }}>
              <div className="pt-4">
                <SignalBreakdown
                  signals={result.signals}
                  summary={result.signal_summary ?? { high: 0, medium: 0, total: result.signals.length }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}