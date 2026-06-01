"use client";

import { useEffect, useRef, useState } from "react";
import { VideoDetectionResult, FrameResult } from "@/lib/api";
import gsap from "gsap";

interface Props {
  result: VideoDetectionResult;
  onReset: () => void;
}

export default function VideoResultCard({ result, onReset }: Props) {
  const isFake      = result.verdict === "FAKE";
  const barRef      = useRef<HTMLDivElement>(null);
  const scoreRef    = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<FrameResult | null>(null);

  const accentColor  = isFake ? "var(--blush)"  : "var(--sage)";
  const accentBg     = isFake ? "#FDF0EC"        : "#EEF4EC";
  const accentBorder = isFake ? "#EAC4B8"        : "#C4D0BC";

  useEffect(() => {
    // Animate confidence bar
    if (barRef.current) {
      gsap.fromTo(barRef.current,
        { width: "0%" },
        { width: `${result.confidence_pct}%`, duration: 1.2, ease: "power3.out", delay: 0.3 }
      );
    }
    // Count-up score
    if (scoreRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: result.confidence_pct, duration: 1.2, ease: "power3.out", delay: 0.3,
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = obj.val.toFixed(1) + "%";
        }
      });
    }
    // Stagger timeline dots in
    if (timelineRef.current) {
      gsap.from(timelineRef.current.querySelectorAll(".frame-dot"), {
        scale: 0, opacity: 0, duration: 0.4,
        stagger: 0.03, ease: "back.out(1.7)", delay: 0.6,
      });
    }
  }, [result]);

  return (
    <div className="w-full space-y-3">

      {/* ── Summary card ── */}
      <div className="rounded-sm border overflow-hidden" style={{ borderColor: accentBorder, background: accentBg }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: accentBorder }}>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: isFake ? "#F7D4C8" : "#C8DCC8" }}>
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
              <p className="label-sm mb-0.5">Video verdict</p>
              <p className="text-2xl font-light" style={{ color: accentColor, fontFamily: "var(--font-display)" }}>
                {isFake ? "Likely Deepfake" : "Likely Authentic"}
              </p>
            </div>
          </div>
          <button onClick={onReset} className="label-sm hover:opacity-60 transition-opacity" style={{ color: "var(--graphite)" }}>
            ← New video
          </button>
        </div>

        {/* Confidence bar */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-sm">{isFake ? "Fake" : "Real"} confidence</span>
            <span ref={scoreRef} className="text-sm font-medium" style={{ color: accentColor, fontFamily: "var(--font-mono)" }}>
              {result.confidence_pct}%
            </span>
          </div>
          <div className="bar-track">
            <div ref={barRef} className="bar-fill" style={{ background: accentColor, width: 0 }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-6 pb-5 grid grid-cols-4 gap-4 border-t" style={{ borderColor: accentBorder }}>
          {[
            { label: "Frames analyzed", value: result.frames_analyzed },
            { label: "Frames flagged",  value: result.frames_flagged,  color: result.frames_flagged > 0 ? "var(--blush)" : "var(--sage)" },
            { label: "Flagged ratio",   value: `${result.fake_ratio_pct}%` },
            { label: "Processed in",    value: `${(result.processing_time_ms / 1000).toFixed(1)}s` },
          ].map((m) => (
            <div key={m.label} className="pt-4 space-y-0.5">
              <p className="label-sm">{m.label}</p>
              <p className="text-sm font-medium" style={{ color: (m as any).color ?? "var(--charcoal)", fontFamily: "var(--font-mono)" }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mx-6 mb-5 px-4 py-3 rounded-sm border" style={{ borderColor: accentBorder, background: "rgba(255,255,255,0.4)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--stone)" }}>
            <span style={{ color: "var(--graphite)", fontWeight: 500 }}>Note: </span>
            Video analysis samples 1 frame per second (max 30 frames). Short clips or highly compressed videos may produce less accurate results.
          </p>
        </div>
      </div>

      {/* ── Frame timeline ── */}
      <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--sand)" }}>
          <span className="text-sm font-light" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
            Frame-by-frame timeline
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 label-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--blush)" }} />
              Fake
            </span>
            <span className="flex items-center gap-1.5 label-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--sage)" }} />
              Real
            </span>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Dot timeline */}
          <div ref={timelineRef} className="flex flex-wrap gap-2 mb-4">
            {result.frames.map((frame) => (
              <div
                key={frame.frame_index}
                className="frame-dot relative cursor-pointer"
                onMouseEnter={() => setHovered(frame)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className="w-6 h-6 rounded-sm transition-transform hover:scale-125"
                  style={{
                    background: frame.verdict === "FAKE" ? "var(--blush)" : "var(--sage)",
                    opacity: 0.4 + frame.fake_probability * 0.6,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Timestamp axis */}
          <div className="flex items-center justify-between">
            <span className="label-sm">0s</span>
            {result.frames.length > 1 && (
              <span className="label-sm">{result.frames[result.frames.length - 1].timestamp_sec}s</span>
            )}
          </div>

          {/* Hover tooltip */}
          {hovered && (
            <div
              className="mt-4 px-4 py-3 rounded-sm border text-xs space-y-1"
              style={{ borderColor: "var(--sand)", background: "var(--cream)" }}
            >
              <div className="flex items-center justify-between">
                <span className="label-sm">t = {hovered.timestamp_sec}s · Frame {hovered.frame_index + 1}</span>
                <span
                  className="label-sm font-medium"
                  style={{ color: hovered.verdict === "FAKE" ? "var(--blush)" : "var(--sage)" }}
                >
                  {hovered.verdict} · {hovered.confidence_pct}%
                </span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    background: hovered.verdict === "FAKE" ? "var(--blush)" : "var(--sage)",
                    width: `${hovered.confidence_pct}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Fake frame list */}
          {result.frames_flagged > 0 && (
            <div className="mt-4 space-y-1">
              <p className="label-sm mb-2">Flagged frames</p>
              {result.frames
                .filter(f => f.verdict === "FAKE")
                .map(f => (
                  <div
                    key={f.frame_index}
                    className="flex items-center justify-between px-3 py-1.5 rounded-sm"
                    style={{ background: "#FDF0EC", border: "1px solid #EAC4B8" }}
                  >
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>
                      t = {f.timestamp_sec}s
                    </span>
                    <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--blush)" }}>
                      {f.confidence_pct}% fake
                    </span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}