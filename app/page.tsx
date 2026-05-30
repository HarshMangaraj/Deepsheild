"use client";

import Link from "next/link";
import ImageUploader from "../components/ImageUploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">DeepShield</span>
        </div>
        <div className="flex items-center gap-4">
          {/* ── NEW in Phase 5: Resources link ── */}
          <Link
            href="/resources"
            className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-violet-400 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Legal Resources
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PHASE 5 · COMPLETE
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl w-full mx-auto flex flex-col items-center gap-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono tracking-widest uppercase">
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
            AI Deepfake Detection
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-5xl font-black tracking-tight leading-[1.05]">
              Is this image{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                  real?
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0" />
              </span>
            </h1>
            <p className="text-white/45 text-lg font-light max-w-md mx-auto leading-relaxed">
              Upload any photo. DeepShield analyzes it for AI generation,
              manipulation, and deepfake artifacts.
            </p>
          </div>

          <ImageUploader />

          <div className="flex items-center gap-6 text-white/25 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Images never stored
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Free to use
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Supports JPG, PNG, WEBP
            </span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-white/5 px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest text-center mb-8">How it works</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step: "01", title: "Upload",   desc: "Drop any photo — portrait, screenshot, news image, anything." },
              { step: "02", title: "Analyze",  desc: "Our model scans for GAN artifacts, frequency anomalies, and inconsistencies." },
              { step: "03", title: "Report",   desc: "Get a confidence score and a breakdown of what signals were found." },
            ].map((item) => (
              <div key={item.step} className="group relative p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className="font-mono text-xs text-cyan-500/60 mb-3">{item.step}</div>
                <div className="font-semibold text-sm text-white/80 mb-1.5">{item.title}</div>
                <div className="text-xs text-white/35 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Victim support banner ── */}
      <section className="border-t border-white/5 px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/resources"
            className="flex items-center justify-between p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white/75">Victim of a deepfake?</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Indian laws, reporting steps, NGO contacts, and a step-by-step guide for victims.
                </p>
              </div>
            </div>
            <svg className="text-violet-400 group-hover:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-8 py-4 flex items-center justify-between text-white/20 text-xs font-mono">
        <span>DeepShield · Portfolio Project</span>
        <span>Built with Next.js · Tailwind · Python</span>
      </footer>
    </main>
  );
}