"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const LocomotiveWrapper = dynamic(
  () => import("../../components/LocomotiveWrapper"),
  { ssr: false }
);

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: "01", title: "Document everything first",    urgency: "Immediately",  color: "var(--brass)",    body: "Before doing anything else, take screenshots of where the image appears — the URL, post, username, and timestamps. Save them to a dedicated folder. Do not contact the perpetrator yet. This evidence is critical for any formal complaint." },
  { n: "02", title: "Report to the platform",       urgency: "Within 24 hrs", color: "var(--graphite)", body: "Every major platform (Instagram, Twitter/X, Telegram, YouTube, Reddit) has a 'Report → Non-consensual intimate images' option. Under India's IT Act, platforms must act within 24 hours or face liability. Report from multiple accounts if possible to escalate." },
  { n: "03", title: "File on Cyber Crime Portal",   urgency: "Within 48 hrs", color: "var(--graphite)", body: "Visit cybercrime.gov.in and file under 'Report Women/Child Related Crime'. You can report anonymously. Mention Section 66E and Section 67A of the IT Act. You will receive a complaint ID — save it for all future correspondence." },
  { n: "04", title: "File an FIR",                  urgency: "Within 72 hrs", color: "var(--graphite)", body: "Visit your nearest police station and request an FIR under BNS Section 95 (voyeurism) and Section 96 (stalking/image-based abuse). If refused, escalate to the Superintendent of Police or approach a magistrate directly." },
  { n: "05", title: "Contact an NGO",               urgency: "Anytime",       color: "var(--sage)",     body: "You do not have to navigate this alone. iCall, Cyber Peace Foundation, and Majlis Legal Centre offer free legal guidance and emotional support specifically for image-based abuse victims." },
];

const LAWS = [
  { act: "IT Act, 2000",   section: "§ 66E",  title: "Violation of Privacy",          strength: "high",   punishment: "3 yrs · ₹2L fine",     desc: "Captures, publishes or transmits the image of a private area without consent. Directly covers deepfakes that sexualise a real person's likeness." },
  { act: "IT Act, 2000",   section: "§ 67A",  title: "Sexually Explicit Material",     strength: "high",   punishment: "5 yrs · ₹10L fine",    desc: "Punishes publishing or transmitting material containing sexually explicit acts electronically. AI-generated explicit content using someone's likeness falls under this." },
  { act: "IT Act, 2000",   section: "§ 67",   title: "Publishing Obscene Material",    strength: "medium", punishment: "3 yrs · ₹5L fine",     desc: "Broader than 67A — applies to non-explicit but harmful deepfake content published electronically." },
  { act: "BNS, 2023",      section: "§ 95",   title: "Voyeurism",                      strength: "high",   punishment: "1–7 yrs",              desc: "The modernised Bharatiya Nyaya Sanhita provision covering capture or dissemination of private images without consent, updated for digital offences." },
  { act: "BNS, 2023",      section: "§ 96",   title: "Stalking / Online Harassment",   strength: "medium", punishment: "3–5 yrs",              desc: "Covers persistent online harassment using image-based content. Applicable when deepfakes are used to intimidate or coerce." },
  { act: "IT Rules, 2021", section: "R. 3(1)(b)", title: "Platform Takedown Obligation", strength: "medium", punishment: "Loss of safe harbour", desc: "Platforms must acknowledge complaints within 24 hrs and resolve within 15 days. Non-compliance removes their liability protection under the IT Act." },
];

const NGOS = [
  { name: "National Cyber Crime Portal",  type: "Government",        phone: "1930",        url: "https://cybercrime.gov.in",    tags: ["FIR", "Anonymous", "24/7"],           desc: "Official portal to report cybercrime including deepfakes. Anonymous reporting available. Helpline 1930 is 24/7." },
  { name: "iCall — TISS",                 type: "NGO · Counselling", phone: "9152987821",  url: "https://icallhelpline.org",    tags: ["Free", "Confidential", "Counselling"], desc: "Free psychological counselling from Tata Institute of Social Sciences, specialising in trauma from online abuse." },
  { name: "Cyber Peace Foundation",       type: "NGO · Legal + Tech",phone: null,           url: "https://cyberpeace.net.in",   tags: ["Free Legal Aid", "Escalation"],        desc: "India's leading cybersecurity NGO offering free legal guidance, platform escalation support, and policy advocacy." },
  { name: "Majlis Legal Centre",          type: "NGO · Legal",       phone: "022-23792192", url: "https://majlislaw.com",       tags: ["Legal Aid", "Representation"],         desc: "Mumbai-based legal resource centre providing representation and counselling for image-based abuse cases." },
  { name: "National Commission for Women",type: "Government Body",   phone: "7827170170",  url: "https://ncw.nic.in",          tags: ["Government", "Police Escalation"],     desc: "Statutory body that can direct police action. Useful when local police are unresponsive. File complaints online." },
];

type Tab = "steps" | "laws" | "ngos";

export default function ResourcesPage() {
  const [tab, setTab] = useState<Tab>("steps");
  const heroRef    = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          opacity: 0, y: 30, duration: 0.8,
          stagger: 0.12, ease: "power3.out",
        });
      }
    });
    return () => ctx.revert();
  }, []);

  // Animate content when tab changes
  useEffect(() => {
    if (contentRef.current) {
      gsap.from(contentRef.current.children, {
        opacity: 0, y: 16, duration: 0.5,
        stagger: 0.07, ease: "power3.out",
      });
    }
  }, [tab]);

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
            <span className="font-display font-semibold text-base tracking-tight group-hover:opacity-70 transition-opacity" style={{ color: "var(--charcoal)" }}>DeepShield</span>
          </Link>
          <Link href="/" className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--graphite)" }}>
            ← Back to detector
          </Link>
        </header>

        <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-16 space-y-12 flex-1">

          {/* ── Hero ── */}
          <div ref={heroRef} className="space-y-5" data-scroll-section>
            <div className="flex items-center gap-4">
              <span className="label-md">India · Legal Resources</span>
              <div className="rule flex-1" />
            </div>
            <h1 className="display-lg" style={{ color: "var(--charcoal)" }}>
              Your rights as a<br />
              <span className="italic" style={{ color: "var(--brass)" }}>deepfake victim</span>
            </h1>
            <p className="text-base font-light leading-relaxed max-w-xl" style={{ color: "var(--graphite)", fontFamily: "var(--font-display)" }}>
              If your image has been used without consent, you have legal protections in India. This page explains what to do, which laws apply, and where to get help.
            </p>
            {/* Emergency */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-sm border" style={{ borderColor: "#EAC4B8", background: "#FDF0EC" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blush)" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm" style={{ color: "var(--graphite)" }}>
                Emergency: Call{" "}
                <span className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--charcoal)" }}>1930</span>
                {" "}(National Cyber Crime) or{" "}
                <span className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--charcoal)" }}>1091</span>
                {" "}(Women in distress) — 24/7
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-end gap-0 border-b" style={{ borderColor: "var(--border)" }}>
            {([
              { id: "steps", label: "Step-by-step guide" },
              { id: "laws",  label: `Laws (${LAWS.length})` },
              { id: "ngos",  label: `Get help (${NGOS.length})` },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-5 py-3 text-sm transition-opacity"
                style={{
                  color: tab === t.id ? "var(--charcoal)" : "var(--stone)",
                  fontFamily: "var(--font-display)",
                  fontWeight: tab === t.id ? 500 : 400,
                  borderBottom: tab === t.id ? "1.5px solid var(--brass)" : "1.5px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div ref={contentRef} className="space-y-4" data-scroll-section>

            {/* Steps */}
            {tab === "steps" && STEPS.map((s) => (
              <div key={s.n} className="card-hover rounded-sm border px-6 py-5 space-y-3" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl font-light opacity-30 leading-none mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--charcoal)" }}>{s.n}</span>
                    <h3 className="text-base font-medium" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  </div>
                  <span className="label-sm flex-shrink-0 px-2.5 py-1 rounded-sm border" style={{ borderColor: "var(--mist)", color: s.color }}>
                    {s.urgency}
                  </span>
                </div>
                <p className="text-sm leading-relaxed pl-10" style={{ color: "var(--graphite)" }}>{s.body}</p>
              </div>
            ))}

            {/* Laws */}
            {tab === "laws" && (
              <>
                {LAWS.map((l) => (
                  <div key={l.section} className="card-hover rounded-sm border px-5 py-5 space-y-3" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="label-sm" style={{ color: "var(--stone)" }}>{l.act}</span>
                          <span className="w-px h-3" style={{ background: "var(--mist)" }} />
                          <span className="label-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--brass)" }}>{l.section}</span>
                        </div>
                        <h3 className="text-base font-medium" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>{l.title}</h3>
                      </div>
                      <span
                        className="flex-shrink-0 text-xs px-2.5 py-1 rounded-sm font-mono"
                        style={{
                          background: l.strength === "high" ? "#EEF4EC" : "#FDF8EC",
                          color: l.strength === "high" ? "var(--sage)" : "#A0823A",
                          border: `1px solid ${l.strength === "high" ? "#C4D0BC" : "#E8D4A0"}`,
                        }}
                      >
                        {l.strength === "high" ? "Strong" : "Partial"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>{l.desc}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="label-sm">Punishment:</span>
                      <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--charcoal)" }}>{l.punishment}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 rounded-sm border" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--stone)" }}>
                    General information only, not legal advice. India's IT Amendment Bill (2023) is expected to add specific deepfake provisions. Consult a lawyer for your specific situation.
                  </p>
                </div>
              </>
            )}

            {/* NGOs */}
            {tab === "ngos" && NGOS.map((o) => (
              <div key={o.name} className="card-hover rounded-sm border px-5 py-5 space-y-3" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>{o.name}</h3>
                    <p className="label-sm mt-0.5">{o.type}</p>
                  </div>
                  <a
                    href={o.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-sm border transition-opacity hover:opacity-70"
                    style={{ borderColor: "var(--mist)", color: "var(--brass)", fontFamily: "var(--font-mono)" }}
                  >
                    Visit ↗
                  </a>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>{o.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-sm border" style={{ borderColor: "var(--mist)", color: "var(--stone)", fontFamily: "var(--font-mono)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  {o.phone && (
                    <a href={`tel:${o.phone}`} className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--sage)" }}>
                      ☏ {o.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t px-8 md:px-16 py-5 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="label-sm">DeepShield · Portfolio Project</span>
          <span className="label-sm">Information current as of 2024 · Not legal advice</span>
        </footer>
      </div>
    </LocomotiveWrapper>
  );
}