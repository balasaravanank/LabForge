"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileDown, FileText, Eye, Link2, History, Sparkles } from "lucide-react";

const DURATION = 10;

const features = [
  {
    icon: <FileDown size={20} strokeWidth={2} />,
    title: "PDF Export",
    desc: "Print-ready PDFs in one click.",
    color: "#e11d48",
    colorBg: "rgba(225,29,72,0.12)",
  },
  {
    icon: <FileText size={20} strokeWidth={2} />,
    title: "DOCX Export",
    desc: "Editable Word docs, institution format.",
    color: "#6366f1",
    colorBg: "rgba(99,102,241,0.12)",
  },
  {
    icon: <Eye size={20} strokeWidth={2} />,
    title: "Live Preview",
    desc: "See the final look before exporting.",
    color: "#0ea5e9",
    colorBg: "rgba(14,165,233,0.12)",
  },
  {
    icon: <Link2 size={20} strokeWidth={2} />,
    title: "Shareable Links",
    desc: "Compressed URLs — no backend.",
    color: "#10b981",
    colorBg: "rgba(16,185,129,0.12)",
  },
  {
    icon: <History size={20} strokeWidth={2} />,
    title: "History",
    desc: "Restore any past record in one tap.",
    color: "#f59e0b",
    colorBg: "rgba(245,158,11,0.12)",
  },
  {
    icon: <Sparkles size={20} strokeWidth={2} />,
    title: "Auto Profile",
    desc: "Name & reg. number remembered.",
    color: "#ec4899",
    colorBg: "rgba(236,72,153,0.12)",
  },
];

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handleEnter();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEnter() {
    setExiting(true);
    setTimeout(onEnter, 450);
  }

  const progress = ((DURATION - secondsLeft) / DURATION) * 100;

  return (
    <div className={`sp-root${exiting ? " sp-exit" : ""}`}>
      {/* Mesh gradient background */}
      <div className="sp-bg-mesh" />
      <div className="sp-orb sp-orb-a" />
      <div className="sp-orb sp-orb-b" />
      <div className="sp-orb sp-orb-c" />

      <div className="sp-shell">
        {/* ── Hero ── */}
        <div className="sp-hero">
          <div className="sp-logo-wrap">
            <Image
              src="/logo.png"
              alt="LabForge logo"
              width={64}
              height={64}
              className="sp-logo-img"
              priority
            />
          </div>

          <div className="sp-hero-text">
            <h1 className="sp-app-name">LabForge</h1>
            <p className="sp-tagline">Professional lab records, effortlessly.</p>
          </div>

          <a
            href="https://www.linkedin.com/in/bala-saravanan-k/"
            target="_blank"
            rel="noopener noreferrer"
            className="sp-creator"
          >
            <div className="sp-creator-av">
              <Image src="/avatar.png" alt="Avatar" width={32} height={32} priority style={{ objectFit: "cover", borderRadius: "50%" }} />
            </div>
            <div className="sp-creator-info">
              <span className="sp-creator-name">Bala Saravanan K</span>
              <span className="sp-creator-role">Kitzo CEO</span>
            </div>
            <div className="sp-li-badge" aria-label="LinkedIn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
          </a>
        </div>

        {/* ── Feature grid ── */}
        <div className="sp-grid">
          {features.map((f, i) => (
            <div
              className="sp-card"
              key={f.title}
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <div className="sp-card-icon" style={{ background: f.colorBg, color: f.color }}>
                {f.icon}
              </div>
              <p className="sp-card-title">{f.title}</p>
              <p className="sp-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="sp-footer">
          <div className="sp-progress-track">
            <div className="sp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="sp-footer-row">
            <span className="sp-timer">
              Entering in <strong>{secondsLeft}s</strong>
            </span>
            <button className="sp-cta" onClick={handleEnter}>
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
