"use client";

import { useState } from "react";
import Link from "next/link";

// ── DATA ──
// All legal and resource data is defined here as constants.
// In a real app you might fetch this from a CMS, but for a portfolio
// project keeping it co-located with the page is clean and simple.

const STEPS = [
  {
    number: "01",
    title: "Stay calm and document everything",
    body: "Before doing anything else, take screenshots of where the image appears — the URL, the post, the username, timestamps. Save them to a folder. This evidence is critical for any complaint. Do not contact the person who posted it yet.",
    urgency: "Do this first",
    color: "cyan",
  },
  {
    number: "02",
    title: "Report to the platform immediately",
    body: "Every major platform (Instagram, Twitter/X, Telegram, YouTube, Reddit) has a 'Report > Non-consensual intimate images' option. Use it. Under India's IT Act, platforms must take down reported content within 24 hours or face liability. Report from multiple accounts if possible to escalate.",
    urgency: "Within 24 hours",
    color: "blue",
  },
  {
    number: "03",
    title: "File a complaint with the Cyber Crime Portal",
    body: "Go to cybercrime.gov.in and file under 'Report Women/Child Related Crime'. You can report anonymously. Mention Section 66E and Section 67A of the IT Act in your complaint. You will receive a complaint ID — save it.",
    urgency: "Within 48 hours",
    color: "violet",
  },
  {
    number: "04",
    title: "File an FIR at your local police station",
    body: "Visit your nearest police station and request an FIR under BNS (Bharatiya Nyaya Sanhita) Section 95 (voyeurism) and Section 96 (stalking/image-based abuse). If the officer refuses to register an FIR, you can escalate to the Superintendent of Police or approach a magistrate directly.",
    urgency: "Within 72 hours",
    color: "purple",
  },
  {
    number: "05",
    title: "Contact an NGO for legal and emotional support",
    body: "You do not have to do this alone. iCall, iDiva Legal Help, and the Cyber Peace Foundation offer free legal guidance and emotional support specifically for image-based abuse victims. They can help you navigate the complaint process and connect you with pro-bono lawyers.",
    urgency: "Anytime",
    color: "pink",
  },
];

const LAWS = [
  {
    act: "IT Act, 2000",
    section: "Section 66E",
    title: "Violation of Privacy",
    description: "Captures, publishes or transmits the image of a private area of any person without their consent. Covers deepfakes that sexualise a real person's likeness.",
    punishment: "Up to 3 years imprisonment or ₹2 lakh fine",
    applicability: "Directly applicable to deepfake NCII",
    strength: "high",
  },
  {
    act: "IT Act, 2000",
    section: "Section 67A",
    title: "Publishing Sexually Explicit Material",
    description: "Punishes publishing or transmitting material containing sexually explicit acts in electronic form. AI-generated explicit content using someone's likeness falls under this.",
    punishment: "Up to 5 years imprisonment + ₹10 lakh fine (first offence)",
    applicability: "Applies to explicit deepfakes",
    strength: "high",
  },
  {
    act: "IT Act, 2000",
    section: "Section 67",
    title: "Publishing Obscene Material",
    description: "Covers publishing obscene content electronically. Broader than 67A — applies to non-explicit but harmful deepfake content.",
    punishment: "Up to 3 years + ₹5 lakh fine (first offence)",
    applicability: "Non-explicit but obscene deepfakes",
    strength: "medium",
  },
  {
    act: "BNS, 2023",
    section: "Section 95",
    title: "Voyeurism",
    description: "The Bharatiya Nyaya Sanhita (which replaced IPC) covers capturing or disseminating images of a person engaged in a private act without consent. Modernised to cover digital offences.",
    punishment: "1–3 years imprisonment (first offence), up to 7 years (repeat)",
    applicability: "Image-based abuse including deepfakes",
    strength: "high",
  },
  {
    act: "BNS, 2023",
    section: "Section 96",
    title: "Stalking (Online Harassment)",
    description: "Covers persistent online monitoring, contacting, or publishing content about a person that causes distress. Applicable when deepfakes are used to harass or intimidate.",
    punishment: "Up to 3 years (first offence), up to 5 years (repeat)",
    applicability: "Harassment campaigns using deepfakes",
    strength: "medium",
  },
  {
    act: "IT (Intermediary Guidelines) Rules, 2021",
    section: "Rule 3(1)(b)",
    title: "Platform Takedown Obligation",
    description: "Social media platforms must acknowledge complaints within 24 hours and resolve within 15 days. For non-consensual intimate images, the timeline is stricter. Platforms that don't act face liability.",
    punishment: "Platform loses safe harbour protection under IT Act",
    applicability: "Forcing platforms to act",
    strength: "medium",
  },
];

const NGOS = [
  {
    name: "National Cyber Crime Reporting Portal",
    type: "Government",
    description: "Official government portal to report cybercrime including image-based abuse, deepfakes, and online harassment. Anonymous reporting available.",
    contact: "cybercrime.gov.in",
    phone: "1930",
    url: "https://cybercrime.gov.in",
    tags: ["FIR", "Anonymous", "24/7"],
  },
  {
    name: "iCall — TISS",
    type: "NGO · Counselling",
    description: "Free psychological counselling and support from Tata Institute of Social Sciences. Specialises in trauma from online abuse and image-based violence.",
    contact: "icallhelpline.org",
    phone: "9152987821",
    url: "https://icallhelpline.org",
    tags: ["Free", "Confidential", "Counselling"],
  },
  {
    name: "Cyber Peace Foundation",
    type: "NGO · Legal + Tech",
    description: "India's leading cybersecurity NGO. Offers free legal guidance for deepfake victims, platform escalation support, and policy advocacy.",
    contact: "cyberpeace.net.in",
    phone: null,
    url: "https://cyberpeace.net.in",
    tags: ["Free Legal Aid", "Escalation", "Policy"],
  },
  {
    name: "iDiva Legal Help",
    type: "NGO · Women's Rights",
    description: "Legal aid specifically for women facing online harassment, non-consensual image sharing, and digital abuse. Connects victims with pro-bono lawyers.",
    contact: "Via website",
    phone: null,
    url: "https://idiva.com",
    tags: ["Women-focused", "Pro-bono", "Legal"],
  },
  {
    name: "Majlis Legal Centre",
    type: "NGO · Legal",
    description: "Mumbai-based legal resource centre for women. Provides representation and counselling for cases involving image-based abuse and digital violence.",
    contact: "majlislaw.com",
    phone: "022-23792192",
    url: "https://majlislaw.com",
    tags: ["Legal Aid", "Mumbai", "Representation"],
  },
  {
    name: "National Commission for Women",
    type: "Government Body",
    description: "Statutory body that can take up complaints and direct police action. Useful when local police are unresponsive. File complaints online.",
    contact: "ncw.nic.in",
    phone: "7827170170",
    url: "https://ncw.nic.in",
    tags: ["Government", "Police Escalation", "Complaints"],
  },
];

const STRENGTH_CONFIG = {
  high:   { label: "Strong protection", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { label: "Partial protection", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
};

const STEP_COLORS: Record<string, string> = {
  cyan:   "border-cyan-500/20   bg-cyan-500/5   text-cyan-400",
  blue:   "border-blue-500/20   bg-blue-500/5   text-blue-400",
  violet: "border-violet-500/20 bg-violet-500/5 text-violet-400",
  purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  pink:   "border-pink-500/20   bg-pink-500/5   text-pink-400",
};

type Tab = "steps" | "laws" | "ngos";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("steps");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "steps", label: "Step-by-step guide" },
    { id: "laws",  label: "Indian laws",  count: LAWS.length  },
    { id: "ngos",  label: "Get help",     count: NGOS.length  },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight group-hover:text-cyan-400 transition-colors">DeepShield</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5"
        >
          ← Back to detector
        </Link>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 space-y-10">

        {/* ── Hero ── */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-mono tracking-widest uppercase">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            India · Legal Resources
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Your rights if you're a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              victim of deepfakes
            </span>
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-2xl">
            If your image has been used without consent — in a deepfake, AI-generated content,
            or manipulated photo — you have legal protections in India. This page explains
            what to do, which laws apply, and where to get help.
          </p>
          {/* Crisis banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-sm text-white/60">
              <span className="text-red-400 font-semibold">Emergency helpline: </span>
              Call <span className="text-white font-mono font-bold">1930</span> (National Cyber Crime) or{" "}
              <span className="text-white font-mono font-bold">1091</span> (Women in distress) — available 24/7.
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white/60"}
              `}
            >
              {tab.label}
              {tab.count && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? "bg-white/10 text-white/60" : "bg-white/5 text-white/25"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── STEP BY STEP TAB ── */}
        {activeTab === "steps" && (
          <div className="space-y-4">
            <p className="text-sm text-white/40">
              Follow these steps in order. Each one builds on the last.
            </p>
            {STEPS.map((step) => {
              const colorClass = STEP_COLORS[step.color];
              return (
                <div key={step.number} className={`rounded-2xl border p-5 space-y-3 ${colorClass}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black opacity-40 font-mono">{step.number}</span>
                      <h3 className="text-sm font-bold text-white/80">{step.title}</h3>
                    </div>
                    <span className="flex-shrink-0 text-xs font-mono px-2.5 py-1 rounded-full border opacity-80" style={{borderColor: "currentColor"}}>
                      {step.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed pl-10">{step.body}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LAWS TAB ── */}
        {activeTab === "laws" && (
          <div className="space-y-4">
            <p className="text-sm text-white/40">
              These are the primary Indian laws applicable to deepfake abuse as of 2024.
            </p>
            {LAWS.map((law) => {
              const cfg = STRENGTH_CONFIG[law.strength as keyof typeof STRENGTH_CONFIG];
              return (
                <div key={law.section} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/30">{law.act}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs font-mono font-bold text-cyan-400">{law.section}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white/80">{law.title}</h3>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-mono ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{law.description}</p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-white/25 font-mono uppercase tracking-widest mb-1">Punishment</p>
                      <p className="text-xs text-white/60">{law.punishment}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-white/25 font-mono uppercase tracking-widest mb-1">Applies to</p>
                      <p className="text-xs text-white/60">{law.applicability}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-white/25 leading-relaxed">
                <span className="text-white/40 font-semibold">Note:</span>{" "}
                This is general information, not legal advice. Laws are evolving — India's
                IT Amendment Bill (2023) is expected to add specific deepfake provisions.
                Consult a lawyer for advice on your specific situation.
              </p>
            </div>
          </div>
        )}

        {/* ── NGOs / GET HELP TAB ── */}
        {activeTab === "ngos" && (
          <div className="space-y-4">
            <p className="text-sm text-white/40">
              These organisations offer free support — legal, emotional, or both.
            </p>
            {NGOS.map((org) => (
              <div key={org.name} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white/80">{org.name}</h3>
                    <p className="text-xs text-white/30 font-mono mt-0.5">{org.type}</p>
                  </div>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                  >
                    Visit
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{org.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {org.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/40 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {org.phone && (
                    <a
                      href={`tel:${org.phone}`}
                      className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {org.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-8 py-4 flex items-center justify-between text-white/20 text-xs font-mono">
        <span>DeepShield · Portfolio Project</span>
        <span>Information current as of 2024 · Not legal advice</span>
      </footer>
    </main>
  );
}