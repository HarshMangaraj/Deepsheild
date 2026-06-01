"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import VideoUploader from "@/components/VideoUploader";
import gsap from "gsap";

const LocomotiveWrapper = dynamic(() => import("@/components/LocomotiveWrapper"), { ssr: false });

export default function VideoPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          opacity: 0, y: 30, duration: 0.8,
          stagger: 0.1, ease: "power3.out",
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <LocomotiveWrapper>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-8 md:px-16 py-5 border-b" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--charcoal)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-base tracking-tight group-hover:opacity-70 transition-opacity" style={{ color: "var(--charcoal)" }}>
              DeepShield
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--graphite)" }}>Image</Link>
            <span className="label-sm" style={{ color: "var(--brass)" }}>Video</span>
            <Link href="/resources" className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--graphite)" }}>Legal Resources</Link>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section data-scroll-section className="flex-1 flex flex-col items-center justify-center px-6 md:px-16 py-20 relative overflow-hidden">
          {/* Decorative lines */}
          <div className="absolute top-0 left-16 w-px h-24 opacity-20" style={{ background: "var(--brass)" }} />
          <div className="absolute top-0 right-24 w-px h-16 opacity-10" style={{ background: "var(--mist)" }} />

          <div ref={heroRef} className="max-w-2xl w-full mx-auto flex flex-col items-center gap-10">
            {/* Badge */}
            <div className="flex items-center gap-2.5">
              <div className="rule-strong w-8" />
              <span className="label-sm">Forensic video analysis</span>
              <div className="rule-strong w-8" />
            </div>

            {/* Title */}
            <h1 className="display-xl text-center" style={{ color: "var(--charcoal)" }}>
              <span className="block">Is this</span>
              <span className="block italic" style={{ color: "var(--brass)" }}>video real?</span>
            </h1>

            {/* Subtitle */}
            <p className="text-center text-lg font-light max-w-md leading-relaxed" style={{ color: "var(--graphite)", fontFamily: "var(--font-display)" }}>
              Upload a video clip or record from your webcam. DeepShield samples one frame per second and analyses each for deepfake artifacts.
            </p>

            {/* Uploader */}
            <div className="w-full">
              <VideoUploader />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5" style={{ color: "var(--stone)" }}>
              {["1 frame/sec sampling", "Max 30 seconds", "MP4 · MOV · WEBM"].map((item, i) => (
                <span key={item} className="flex items-center gap-5">
                  {i > 0 && <span className="w-px h-3" style={{ background: "var(--mist)" }} />}
                  <span className="label-sm">{item}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How video detection works ── */}
        <section data-scroll-section className="border-t px-8 md:px-16 py-16" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <span className="label-md">How video detection works</span>
              <div className="rule flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: "01", title: "Upload",   desc: "Drop any MP4, MOV, or WEBM file up to 100MB, or record directly from your webcam." },
                { n: "02", title: "Sample",   desc: "The backend extracts one frame every second using OpenCV, up to 30 frames total." },
                { n: "03", title: "Analyse",  desc: "Each frame runs through the same ViT detection model used for image analysis." },
                { n: "04", title: "Timeline", desc: "Results show per-frame verdicts on a colour-coded timeline — red dots are flagged frames." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="label-sm" style={{ color: "var(--brass)" }}>{s.n}</span>
                    <div className="rule flex-1" />
                  </div>
                  <h3 className="text-base font-light mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t px-8 md:px-16 py-5 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="label-sm">DeepShield · Portfolio Project</span>
          <span className="label-sm">Next.js · FastAPI · OpenCV · PyTorch</span>
        </footer>
      </div>
    </LocomotiveWrapper>
  );
}