"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ImageUploader from "../components/ImageUploader";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Dynamic import for Locomotive — browser only
const LocomotiveWrapper = dynamic(
  () => import("../components/LocomotiveWrapper"),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef   = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);
  const subRef    = useRef<HTMLParagraphElement>(null);
  const badgeRef  = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const howRef    = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── GSAP entrance timeline ──
    // WHY GSAP OVER CSS ANIMATIONS?
    // GSAP gives us precise sequencing — "after A finishes, start B at 50%
    // through A". CSS animations are parallel by default. For orchestrated
    // reveals, GSAP timelines are much cleaner.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(badgeRef.current, { opacity: 0, y: 12, duration: 0.6 })
        .from(titleRef.current?.children ?? [], {
          opacity: 0, y: 40, duration: 0.9, stagger: 0.12
        }, "-=0.3")
        .from(subRef.current, { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
        .from(uploaderRef.current, { opacity: 0, y: 30, duration: 0.8 }, "-=0.4");

      // Scroll-triggered reveals for "how it works"
      if (howRef.current) {
        gsap.from(howRef.current.querySelectorAll(".how-card"), {
          scrollTrigger: {
            trigger: howRef.current,
            start: "top 80%",
          },
          opacity: 0,
          y: 32,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
        });
      }

      // Banner fade
      if (bannerRef.current) {
        gsap.from(bannerRef.current, {
          scrollTrigger: {
            trigger: bannerRef.current,
            start: "top 85%",
          },
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <LocomotiveWrapper>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--cream)" }}>

        {/* ── Header ── */}
        <header
          data-scroll
          data-scroll-sticky
          data-scroll-target="[data-scroll-container]"
          className="flex items-center justify-between px-8 md:px-16 py-5 border-b"
          style={{ borderColor: "var(--border)", background: "var(--cream)", zIndex: 100 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--charcoal)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-display font-semibold text-base tracking-tight" style={{ color: "var(--charcoal)" }}>
              DeepShield
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/resources" className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--graphite)" }}>
              Legal Resources
            </Link>
            <div className="label-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sage)" }} />
              <span style={{ color: "var(--stone)" }}>System online</span>
            </div>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section
          ref={heroRef}
          data-scroll-section
          className="flex-1 flex flex-col items-center justify-center px-6 md:px-16 py-24 md:py-32 relative overflow-hidden"
        >
          {/* Decorative thin rules */}
          <div className="absolute top-0 left-16 w-px h-32 opacity-20" style={{ background: "var(--brass)" }} />
          <div className="absolute top-0 right-16 w-px h-24 opacity-10" style={{ background: "var(--mist)" }} />

          <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-10">
            {/* Badge */}
            <div ref={badgeRef} className="flex items-center gap-2.5">
              <div className="rule-strong w-8" />
              <span className="label-sm">Forensic image analysis</span>
              <div className="rule-strong w-8" />
            </div>

            {/* Title */}
            <h1
              ref={titleRef}
              className="display-xl text-center"
              style={{ color: "var(--charcoal)" }}
            >
              <span className="block">Is this</span>
              <span className="block italic" style={{ color: "var(--brass)" }}>image real?</span>
            </h1>

            {/* Subtitle */}
            <p
              ref={subRef}
              className="text-center text-lg font-light max-w-md leading-relaxed"
              style={{ color: "var(--graphite)", fontFamily: "var(--font-display)" }}
            >
              Upload any photograph. DeepShield analyses it for AI generation,
              facial manipulation, and synthetic artifacts using forensic-grade detection.
            </p>

            {/* Uploader */}
            <div ref={uploaderRef} className="w-full">
              <ImageUploader />
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-5" style={{ color: "var(--stone)" }}>
              {["Images never stored", "Free to use", "JPG · PNG · WEBP · MP4"].map((item, i) => (
                <span key={item} className="flex items-center gap-5">
                  {i > 0 && <span className="w-px h-3" style={{ background: "var(--mist)" }} />}
                  <span className="label-sm">{item}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Thin rule ── */}
        <div className="rule mx-8 md:mx-16" />

        {/* ── How it works ── */}
        <section
          ref={howRef}
          data-scroll-section
          className="px-8 md:px-16 py-20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <span className="label-md">How it works</span>
              <div className="rule flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: "01", title: "Upload",   desc: "Drop any photo or short video clip. We accept JPEG, PNG, WEBP, and MP4 up to 50MB." },
                { n: "02", title: "Analyse",  desc: "EfficientNet-B4 scans for GAN artifacts, frequency anomalies, and facial inconsistencies across frames." },
                { n: "03", title: "Interpret",desc: "Receive a confidence score, per-signal breakdown, and plain-English explanation of every finding." },
              ].map((step) => (
                <div key={step.n} className="how-card group">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="label-sm pt-1" style={{ color: "var(--brass)" }}>{step.n}</span>
                    <div className="rule flex-1 mt-3" />
                  </div>
                  <h3 className="text-xl font-light mb-3" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Rule ── */}
        <div className="rule mx-8 md:mx-16" />

        {/* ── Victim support banner ── */}
        <section
          ref={bannerRef}
          data-scroll-section
          className="px-8 md:px-16 py-12"
        >
          <div className="max-w-4xl mx-auto">
            <Link
              href="/resources"
              className="card-hover flex items-center justify-between p-6 md:p-8 rounded-sm border group"
              style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}
            >
              <div className="flex items-start gap-6">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--charcoal)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium mb-1" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                    Have you been a victim of a deepfake?
                  </p>
                  <p className="text-sm" style={{ color: "var(--graphite)" }}>
                    Indian laws, step-by-step reporting guide, NGO contacts, and legal resources — all in one place.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-6 label-sm group-hover:translate-x-1 transition-transform" style={{ color: "var(--brass)" }}>
                View resources →
              </div>
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          data-scroll-section
          className="border-t px-8 md:px-16 py-5 flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="label-sm">DeepShield · Portfolio Project</span>
          <span className="label-sm">Next.js · FastAPI · PyTorch</span>
        </footer>

      </div>
    </LocomotiveWrapper>
  );
}