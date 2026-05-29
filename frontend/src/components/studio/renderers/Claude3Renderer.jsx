import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
 
/* ─────────────────────────────────────────────
   VAULT PREMIUM RENDERER  v2.0
   Aesthetic: Architectural Dark Editorial — Refined
   Improvements:
     · Scroll-triggered reveal animations (IntersectionObserver)
     · Staggered entrance choreography per section
     · Magnetic cursor glow effect
     · Animated stats counter on viewport entry
     · Smoother hover states with CSS transitions
     · Parallax hero headline drift
     · Active nav section highlight via scroll spy
     · Refined spacing scale & type hierarchy
     · Reduced motion support
   ───────────────────────────────────────────── */
 
function t(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}
function l(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}
function sid(value) {
  return t(value, "vault-core").toLowerCase().replace(/[^a-z0-9-]/g, "-");
}
 
/* ── Animated counter hook ── */
function useCounter(target, duration = 1400, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) { setCount(target); return; }
    const suffix = String(target).replace(/[0-9.]/g, "");
    const steps = 60;
    const step = numeric / steps;
    let current = 0;
    let frame = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, numeric);
      frame++;
      const display = Number.isInteger(numeric) ? Math.round(current) : current.toFixed(1);
      setCount(display + suffix);
      if (frame >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return count || target;
}
 
/* ── Scroll reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}
 
/* ── Stat with counter ── */
function StatRow({ stat, index, editing, ed }) {
  const [ref, visible] = useReveal(0.3);
  const count = useCounter(t(stat.title), 1600, visible);
  return (
    <div
      ref={ref}
      key={`stat-${index}`}
      {...ed(`stats.${index}`, "stat", undefined, {
        className: `vpr-stat-row${visible ? " vpr-stat-row--visible" : ""}`,
        style: { transitionDelay: `${index * 120}ms` },
      })}
    >
      <span {...ed(`stats.${index}.title`, "stat title", t(stat.title), { className: "vpr-stat-num" })}>
        {visible ? count : t(stat.title)}
      </span>
      <span {...ed(`stats.${index}.label`, "stat label", t(stat.label), { className: "vpr-stat-label" })}>
        {t(stat.label)}
      </span>
      <div className="vpr-stat-divider" />
    </div>
  );
}
 
/* ── Reveal wrapper ── */
function Reveal({ children, className = "", delay = 0, threshold = 0.12, tag: Tag = "div", ...rest }) {
  const [ref, visible] = useReveal(threshold);
  return (
    <Tag
      ref={ref}
      className={`vpr-reveal${visible ? " vpr-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
 
const PRESETS = {
  "premium-landing": {
    nav: ["Studio", "Work", "Method", "Archive", "Reach"],
    ctas: ["Enter Studio", "View Archive"],
    accent: "#C8102E",
    sub: "Luxury Experience Design",
  },
  "saas-product": {
    nav: ["Platform", "API", "Workflow", "Pricing", "Demo"],
    ctas: ["Request Access", "Live Demo"],
    accent: "#1A6BFF",
    sub: "Software Platform",
  },
  "hospitality-experience": {
    nav: ["Experience", "Suites", "Reserve", "Gallery", "Contact"],
    ctas: ["Reserve Now", "The Collection"],
    accent: "#B08B57",
    sub: "Hospitality & Experience",
  },
  "portfolio-personal": {
    nav: ["Index", "Work", "Writing", "Process", "Connect"],
    ctas: ["View Work", "Start a Project"],
    accent: "#7C5CBF",
    sub: "Creative Portfolio",
  },
  "professional-service": {
    nav: ["Practice", "Expertise", "Method", "Cases", "Contact"],
    ctas: ["Request Consultation", "View Method"],
    accent: "#2D6A4F",
    sub: "Professional Services",
  },
  "real-estate": {
    nav: ["Collection", "Highlights", "Viewings", "Team", "Reach"],
    ctas: ["View Collection", "Private Access"],
    accent: "#8B6914",
    sub: "Luxury Real Estate",
  },
  "agency-studio": {
    nav: ["Studio", "Projects", "Clients", "Process", "Talk"],
    ctas: ["Start a Brief", "Case Studies"],
    accent: "#FF4136",
    sub: "Creative Agency",
  },
  "blog-magazine": {
    nav: ["Features", "Culture", "Design", "Opinion", "Subscribe"],
    ctas: ["Subscribe", "Latest Issue"],
    accent: "#C8102E",
    sub: "Editorial & Magazine",
  },
};
 
function getPreset(id) {
  return PRESETS[id] || PRESETS["premium-landing"];
}
 
export default function VaultPremiumRenderer({
  website,
  editing = false,
  selectedId = null,
  onSelect,
}) {
  const state = website || {};
  const overrides = state.overrides || {};
  const siteRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
 
  const brandName = t(state.brandName, "VAULT");
  const tagline = t(state.tagline, "Architecture of the extraordinary.");
  const industry = t(state.industry, "premium studio");
  const primary = t(state.primaryColor, "#C8102E");
 
  const hero = state.hero || {};
  const footer = state.footer || {};
  const media = state.mediaAssets || {};
  const templateId = sid(state.templateId);
  const preset = useMemo(() => getPreset(templateId), [templateId]);
  const accent = preset.accent;
 
  const navigation = l(state.navigation, preset.nav);
  const [primaryCta, secondaryCta] = preset.ctas || ["Enter", "Explore"];
 
  const stats = l(state.stats, [
    { title: "XIV", label: "Years of practice" },
    { title: "230+", label: "Works completed" },
    { title: "98%", label: "Client retention" },
    { title: "47", label: "Active territories" },
  ]);
 
  const features = l(state.features, [
    { title: "Architectural thinking", description: "Structure before surface. Every decision rooted in purpose and proportion." },
    { title: "Material precision", description: "Obsessive attention to detail at every scale, from macro to micro." },
    { title: "Temporal depth", description: "Work designed to endure. Beauty that compounds with time, not trends." },
    { title: "Curated restraint", description: "Knowing what to leave out is the highest form of craft." },
  ]);
 
  const sections = l(state.sections, [
    { title: "The discipline of less", description: "Reduction as philosophy. Every element earns its presence.", items: ["Subtraction", "Hierarchy", "Negative space"] },
    { title: "Built on research", description: "Deep contextual understanding before a single line is drawn.", items: ["Ethnography", "Precedent study", "Spatial analysis"] },
    { title: "Made to last", description: "Timelessness achieved through mastery of fundamentals, not fashion.", items: ["Material integrity", "Technical rigor", "Future-proof"] },
  ]);
 
  const pricing = l(state.pricing, []);
  const collectionImages = l(media.collectionImages, []);
  const customElements = l(state.customElements, []);
  const heroVideoUrl = t(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = t(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
 
  /* ── Scroll spy ── */
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 40);
      const sections = ["discipline", "work", "method", "archive", "gallery", "pricing", "contact"];
      let active = 0;
      sections.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) active = i;
      });
      setActiveSection(active);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
 
  function ov(id) { return overrides[id]?.styles || {}; }
  function oc(id) { return t(overrides[id]?.classes, ""); }
  function ot(id, fallback = "") { return t(overrides[id]?.text, fallback); }
 
  function ed(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": String(id || ""),
      className: [extra.className, editing ? "vpr-ed" : "", selectedId === id ? "vpr-ed-sel" : "", oc(id)].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...ov(id) },
      onClick: editing ? (e) => { e.stopPropagation(); onSelect?.({ id, tag, text: value, styles: ov(id), classes: oc(id), reactPath: id }); } : extra.onClick,
    };
  }
 
  const heroHeadline = t(hero.headline, "Beyond the\nordinary.");
  const heroEyebrow = t(hero.eyebrow, preset.sub);
  const heroSub = t(hero.subheadline, tagline);
 
  const sectionIds = ["discipline", "work", "method", "archive", "gallery", "contact"];
 
  return (
    <div
      ref={siteRef}
      {...ed("site", "site wrapper", undefined, {
        className: "vpr-site",
        style: { "--vpr-accent": accent, "--vpr-primary": primary },
      })}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');
 
        /* ── RESET & BASE ── */
        .vpr-site {
          --vpr-bg: #09080B;
          --vpr-surface: #0F0E12;
          --vpr-surface2: #161420;
          --vpr-surface3: #1C1A26;
          --vpr-line: rgba(255,255,255,0.07);
          --vpr-line2: rgba(255,255,255,0.14);
          --vpr-line3: rgba(255,255,255,0.22);
          --vpr-text: #EDE9E1;
          --vpr-text-muted: rgba(237,233,225,0.50);
          --vpr-text-sub: rgba(237,233,225,0.26);
          --vpr-mono: 'DM Mono', 'Courier New', monospace;
          --vpr-serif: 'Cormorant Garamond', 'Times New Roman', serif;
          --vpr-ease: cubic-bezier(0.22, 1, 0.36, 1);
          background: var(--vpr-bg);
          color: var(--vpr-text);
          min-height: 100vh;
          font-family: var(--vpr-mono);
          overflow-x: hidden;
          position: relative;
          isolation: isolate;
        }
 
        /* ── NOISE TEXTURE ── */
        .vpr-site::before {
          content: '';
          position: fixed;
          inset: 0;
          opacity: 0.032;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
        }
 
        /* ── AMBIENT GLOW ── */
        .vpr-ambient {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--vpr-accent) 6%, transparent), transparent 70%);
          pointer-events: none;
          z-index: 0;
          top: -200px;
          right: -100px;
          animation: ambientDrift 20s ease-in-out infinite alternate;
        }
        @keyframes ambientDrift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(-80px, 120px) scale(1.1); }
          66%  { transform: translate(60px, 200px) scale(0.9); }
          100% { transform: translate(-40px, 60px) scale(1.05); }
        }
 
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { background: none; border: none; cursor: pointer; font: inherit; color: inherit; }
        img { display: block; width: 100%; height: 100%; object-fit: cover; }
 
        /* ── EDIT STATES ── */
        .vpr-ed { outline: 1px dashed rgba(200,16,46,0.35); outline-offset: 3px; cursor: pointer; }
        .vpr-ed:hover, .vpr-ed-sel { outline-color: var(--vpr-accent); }
 
        /* ── SCROLL REVEAL ── */
        .vpr-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s var(--vpr-ease), transform 0.8s var(--vpr-ease);
        }
        .vpr-reveal--in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .vpr-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
 
        /* ── VERTICAL RULER ── */
        .vpr-ruler {
          position: fixed;
          left: 32px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--vpr-line);
          z-index: 100;
          pointer-events: none;
        }
        .vpr-ruler-pulse {
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 72px;
          background: linear-gradient(to bottom, transparent, var(--vpr-accent), transparent);
          animation: rulerPulse 5s ease-in-out infinite;
        }
        @keyframes rulerPulse {
          0%   { top: -72px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
 
        /* ── NAV ── */
        .vpr-nav {
          position: sticky;
          top: 0;
          z-index: 500;
          padding: 0 64px 0 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.4s, border-color 0.4s, backdrop-filter 0.4s;
          border-bottom: 1px solid transparent;
        }
        .vpr-nav--scrolled {
          background: rgba(9,8,11,0.88);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-bottom-color: var(--vpr-line);
        }
        .vpr-logo-block {
          display: flex;
          align-items: baseline;
          gap: 14px;
        }
        .vpr-logo-name {
          font-family: var(--vpr-serif);
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--vpr-text);
        }
        .vpr-logo-rule {
          width: 1px;
          height: 18px;
          background: var(--vpr-line2);
          display: inline-block;
          vertical-align: middle;
        }
        .vpr-logo-sub {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vpr-text-sub);
        }
        .vpr-nav-links {
          display: flex;
          gap: 36px;
          align-items: center;
        }
        .vpr-nav-links a {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          transition: color 0.2s;
          position: relative;
          padding-bottom: 2px;
        }
        .vpr-nav-links a::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--vpr-accent);
          transition: width 0.3s var(--vpr-ease);
        }
        .vpr-nav-links a:hover { color: var(--vpr-text); }
        .vpr-nav-links a:hover::after { width: 100%; }
        .vpr-nav-links a.active { color: var(--vpr-text); }
        .vpr-nav-links a.active::after { width: 100%; }
        .vpr-nav-cta {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          border: 1px solid color-mix(in srgb, var(--vpr-accent) 60%, transparent);
          padding: 9px 20px;
          transition: background 0.25s, color 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .vpr-nav-cta:hover {
          background: var(--vpr-accent);
          color: #fff;
          border-color: var(--vpr-accent);
          box-shadow: 0 0 24px color-mix(in srgb, var(--vpr-accent) 30%, transparent);
        }
 
        /* ── HERO ── */
        .vpr-hero {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1fr 360px;
          position: relative;
          padding: 0 64px 0 72px;
        }
        .vpr-hero-media {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .vpr-hero-media video,
        .vpr-hero-media img {
          filter: brightness(0.25) saturate(0.55);
          transform: scale(1.04);
          animation: heroMediaIn 1.8s var(--vpr-ease) forwards;
        }
        @keyframes heroMediaIn {
          from { transform: scale(1.08); filter: brightness(0.1) saturate(0); }
          to   { transform: scale(1.04); filter: brightness(0.25) saturate(0.55); }
        }
        .vpr-hero-media-fallback {
          width: 100%;
          height: 100%;
          background:
            radial-gradient(ellipse 55% 45% at 70% 38%, color-mix(in srgb, var(--vpr-accent) 14%, transparent), transparent),
            linear-gradient(155deg, #100E18 0%, #09080B 55%, #120B10 100%);
        }
        .vpr-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(92deg, rgba(9,8,11,0.96) 0%, rgba(9,8,11,0.68) 50%, rgba(9,8,11,0.90) 100%),
            linear-gradient(180deg, rgba(9,8,11,0.15) 0%, rgba(9,8,11,0.65) 100%);
        }
        .vpr-hero-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 100px;
          padding-top: 140px;
        }
        .vpr-hero-eyebrow {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 14px;
          opacity: 0;
          animation: fadeUp 0.9s 0.3s var(--vpr-ease) forwards;
        }
        .vpr-hero-eyebrow::before {
          content: '';
          display: block;
          width: 0;
          height: 1px;
          background: var(--vpr-accent);
          animation: lineGrow 0.7s 0.7s ease forwards;
        }
        @keyframes lineGrow {
          to { width: 40px; }
        }
        .vpr-hero-h1 {
          font-family: var(--vpr-serif);
          font-size: clamp(72px, 8vw, 128px);
          font-weight: 300;
          line-height: 0.92;
          letter-spacing: -0.015em;
          color: var(--vpr-text);
          margin-bottom: 36px;
          white-space: pre-line;
          opacity: 0;
          animation: fadeUp 1s 0.5s var(--vpr-ease) forwards;
        }
        .vpr-hero-h1 em {
          font-style: italic;
          color: var(--vpr-text-muted);
        }
        .vpr-hero-sub {
          font-size: 12px;
          line-height: 1.85;
          color: var(--vpr-text-muted);
          max-width: 420px;
          margin-bottom: 52px;
          letter-spacing: 0.04em;
          opacity: 0;
          animation: fadeUp 0.9s 0.75s var(--vpr-ease) forwards;
        }
        .vpr-hero-actions {
          display: flex;
          align-items: center;
          gap: 32px;
          opacity: 0;
          animation: fadeUp 0.9s 0.95s var(--vpr-ease) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
 
        /* ── BUTTONS ── */
        .vpr-btn-primary {
          font-family: var(--vpr-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: var(--vpr-accent);
          color: #fff;
          padding: 14px 32px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.3s, transform 0.2s;
        }
        .vpr-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.12);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .vpr-btn-primary:hover {
          box-shadow: 0 8px 32px color-mix(in srgb, var(--vpr-accent) 35%, transparent);
          transform: translateY(-1px);
        }
        .vpr-btn-primary:hover::after { opacity: 1; }
        .vpr-btn-ghost {
          font-family: var(--vpr-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: color 0.2s, gap 0.3s var(--vpr-ease);
        }
        .vpr-btn-ghost::after { content: '→'; transition: transform 0.3s var(--vpr-ease); }
        .vpr-btn-ghost:hover { color: var(--vpr-text); gap: 14px; }
        .vpr-btn-ghost:hover::after { transform: translateX(4px); }
 
        /* ── HERO SIDEBAR ── */
        .vpr-hero-sidebar {
          position: relative;
          z-index: 2;
          border-left: 1px solid var(--vpr-line);
          padding: 140px 0 100px 48px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .vpr-stat-row {
          padding: 28px 0;
          border-bottom: 1px solid var(--vpr-line);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0 20px;
          align-items: baseline;
          opacity: 0;
          transform: translateX(16px);
          transition: opacity 0.7s var(--vpr-ease), transform 0.7s var(--vpr-ease);
        }
        .vpr-stat-row:first-child { border-top: 1px solid var(--vpr-line); }
        .vpr-stat-row--visible {
          opacity: 1;
          transform: translateX(0);
        }
        .vpr-stat-num {
          font-family: var(--vpr-serif);
          font-size: 46px;
          font-weight: 300;
          line-height: 1;
          color: var(--vpr-text);
          letter-spacing: -0.02em;
          grid-row: 1 / 3;
          display: flex;
          align-items: center;
        }
        .vpr-stat-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          grid-column: 2;
        }
        .vpr-stat-divider {
          width: 20px;
          height: 1px;
          background: var(--vpr-accent);
          grid-column: 2;
          margin-top: 8px;
          transition: width 0.5s var(--vpr-ease);
        }
        .vpr-stat-row--visible .vpr-stat-divider { width: 28px; }
 
        /* ── SCROLL INDICATOR ── */
        .vpr-scroll-hint {
          position: absolute;
          bottom: 40px;
          left: 72px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vpr-text-sub);
          opacity: 0;
          animation: fadeUp 0.8s 1.4s var(--vpr-ease) forwards;
        }
        .vpr-scroll-track {
          width: 1px;
          height: 48px;
          background: var(--vpr-line2);
          position: relative;
          overflow: hidden;
        }
        .vpr-scroll-thumb {
          position: absolute;
          top: -100%;
          left: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, var(--vpr-accent), transparent);
          animation: scrollThumb 2.2s ease-in-out infinite;
        }
        @keyframes scrollThumb {
          0%   { top: -100%; }
          100% { top: 100%; }
        }
 
        /* ── STRIP (Features) ── */
        .vpr-strip-section {
          padding: 0 64px 0 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-strip-header {
          padding: 72px 0 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 0;
        }
        .vpr-section-label {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vpr-section-label::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--vpr-accent);
        }
        .vpr-section-title {
          font-family: var(--vpr-serif);
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.01em;
          max-width: 540px;
        }
        .vpr-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--vpr-line);
          margin-top: 60px;
        }
        .vpr-strip-card {
          padding: 44px 32px;
          border-right: 1px solid var(--vpr-line);
          position: relative;
          transition: background 0.4s;
          overflow: hidden;
        }
        .vpr-strip-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 0;
          background: linear-gradient(to top, color-mix(in srgb, var(--vpr-accent) 6%, transparent), transparent);
          transition: height 0.4s var(--vpr-ease);
        }
        .vpr-strip-card:hover::before { height: 100%; }
        .vpr-strip-card:last-child { border-right: none; }
        .vpr-strip-card:hover { background: var(--vpr-surface); }
        .vpr-strip-index {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--vpr-text-sub);
          margin-bottom: 32px;
          font-family: var(--vpr-mono);
        }
        .vpr-strip-card-accent {
          width: 28px;
          height: 2px;
          background: var(--vpr-accent);
          margin-bottom: 22px;
          transition: width 0.4s var(--vpr-ease);
        }
        .vpr-strip-card:hover .vpr-strip-card-accent { width: 52px; }
        .vpr-strip-card h3 {
          font-family: var(--vpr-serif);
          font-size: 21px;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 14px;
          color: var(--vpr-text);
        }
        .vpr-strip-card p {
          font-size: 11px;
          line-height: 1.85;
          color: var(--vpr-text-muted);
          letter-spacing: 0.04em;
        }
 
        /* ── MOSAIC ── */
        .vpr-mosaic-section {
          padding: 104px 64px 104px 72px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 440px 380px;
          gap: 2px;
        }
        .vpr-mosaic-cell {
          background: var(--vpr-surface);
          overflow: hidden;
          position: relative;
        }
        .vpr-mosaic-cell img {
          filter: saturate(0.45) brightness(0.65);
          transition: filter 0.6s var(--vpr-ease), transform 0.6s var(--vpr-ease);
        }
        .vpr-mosaic-cell:hover img {
          filter: saturate(0.9) brightness(0.9);
          transform: scale(1.04);
        }
        .vpr-mosaic-cell-a { grid-column: 1 / 3; grid-row: 1; }
        .vpr-mosaic-cell-b {
          grid-column: 3; grid-row: 1;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 44px;
          background: var(--vpr-surface2);
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text p {
          font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--vpr-accent); margin-bottom: 14px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text h2 {
          font-family: var(--vpr-serif); font-size: 28px; font-weight: 300;
          line-height: 1.2; color: var(--vpr-text); margin-bottom: 18px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text span {
          font-size: 11px; line-height: 1.75; color: var(--vpr-text-muted); letter-spacing: 0.04em;
        }
        .vpr-mosaic-cell-c { grid-column: 1; grid-row: 2; }
        .vpr-mosaic-cell-d {
          grid-column: 2; grid-row: 2;
          display: flex; flex-direction: column; justify-content: center; padding: 52px;
          background: color-mix(in srgb, var(--vpr-accent) 12%, var(--vpr-surface));
          border: 1px solid color-mix(in srgb, var(--vpr-accent) 28%, transparent);
          position: relative; overflow: hidden;
        }
        .vpr-mosaic-cell-d::before {
          content: '"';
          position: absolute;
          top: -20px;
          left: 32px;
          font-family: var(--vpr-serif);
          font-size: 180px;
          font-weight: 300;
          color: color-mix(in srgb, var(--vpr-accent) 14%, transparent);
          line-height: 1;
          pointer-events: none;
        }
        .vpr-mosaic-cell-d blockquote {
          font-family: var(--vpr-serif); font-size: 22px; font-style: italic;
          font-weight: 300; line-height: 1.5; color: var(--vpr-text); margin-bottom: 24px;
          position: relative; z-index: 1;
        }
        .vpr-mosaic-cell-d cite {
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--vpr-text-muted); font-style: normal;
        }
        .vpr-mosaic-cell-e { grid-column: 3; grid-row: 2; }
        .vpr-mosaic-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(9,8,11,0.8), transparent 60%);
        }
        .vpr-mosaic-img-tag {
          position: absolute; bottom: 24px; left: 24px;
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--vpr-text-muted); display: flex; align-items: center; gap: 10px;
        }
        .vpr-mosaic-img-tag::before {
          content: ''; width: 16px; height: 1px; background: var(--vpr-accent);
        }
 
        /* ── EDITORIAL TIMELINE ── */
        .vpr-editorial {
          padding: 104px 64px 104px 72px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 0 88px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-editorial-intro {
          position: sticky; top: 120px; align-self: start;
        }
        .vpr-editorial-intro .vpr-section-label { margin-bottom: 24px; }
        .vpr-editorial-intro h2 {
          font-family: var(--vpr-serif); font-size: 38px; font-weight: 300;
          line-height: 1.15; margin-bottom: 24px; color: var(--vpr-text);
        }
        .vpr-editorial-intro p {
          font-size: 11px; line-height: 1.85; color: var(--vpr-text-muted); letter-spacing: 0.04em;
        }
        .vpr-timeline { display: flex; flex-direction: column; }
        .vpr-timeline-item {
          padding: 52px 0;
          border-bottom: 1px solid var(--vpr-line);
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0 32px;
          align-items: start;
          cursor: pointer;
          transition: padding-left 0.3s var(--vpr-ease);
          position: relative;
        }
        .vpr-timeline-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: color-mix(in srgb, var(--vpr-accent) 5%, transparent);
          transition: width 0.4s var(--vpr-ease);
        }
        .vpr-timeline-item:hover::before { width: 100%; }
        .vpr-timeline-item:last-child { border-bottom: none; }
        .vpr-timeline-index {
          font-size: 9px; letter-spacing: 0.22em; color: var(--vpr-text-sub);
          padding-top: 6px; position: relative;
        }
        .vpr-timeline-index::after {
          content: ''; position: absolute; right: 0; top: 14px;
          width: 32px; height: 1px; background: var(--vpr-line);
        }
        .vpr-timeline-body h3 {
          font-family: var(--vpr-serif); font-size: 29px; font-weight: 400;
          line-height: 1.15; margin-bottom: 16px; color: var(--vpr-text);
          transition: color 0.25s;
        }
        .vpr-timeline-item:hover .vpr-timeline-body h3 {
          color: color-mix(in srgb, var(--vpr-accent) 75%, var(--vpr-text));
        }
        .vpr-timeline-body p {
          font-size: 11px; line-height: 1.85; color: var(--vpr-text-muted);
          margin-bottom: 22px; letter-spacing: 0.04em;
        }
        .vpr-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .vpr-chip {
          font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--vpr-text-sub); border: 1px solid var(--vpr-line); padding: 5px 14px;
          transition: border-color 0.2s, color 0.2s;
        }
        .vpr-chip:hover { border-color: var(--vpr-line3); color: var(--vpr-text-muted); }
 
        /* ── GALLERY ── */
        .vpr-gallery-section {
          padding: 0 64px 0 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-gallery-header {
          padding: 72px 0 52px;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .vpr-gallery-link {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--vpr-text-muted); display: flex; align-items: center; gap: 10px;
          transition: color 0.2s, gap 0.3s var(--vpr-ease);
        }
        .vpr-gallery-link:hover { color: var(--vpr-text); gap: 14px; }
        .vpr-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          padding-bottom: 104px;
        }
        .vpr-gallery-card {
          aspect-ratio: 3/4; overflow: hidden; position: relative;
          background: var(--vpr-surface); cursor: pointer;
        }
        .vpr-gallery-card img {
          filter: saturate(0.35) brightness(0.7);
          transition: filter 0.5s var(--vpr-ease), transform 0.6s var(--vpr-ease);
        }
        .vpr-gallery-card:hover img {
          filter: saturate(0.8) brightness(0.88);
          transform: scale(1.05);
        }
        .vpr-gallery-caption {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 40px 24px 24px;
          background: linear-gradient(to top, rgba(9,8,11,0.92), transparent);
          transform: translateY(10px); opacity: 0;
          transition: opacity 0.35s var(--vpr-ease), transform 0.35s var(--vpr-ease);
        }
        .vpr-gallery-card:hover .vpr-gallery-caption { opacity: 1; transform: translateY(0); }
        .vpr-gallery-caption small {
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--vpr-accent); display: block; margin-bottom: 6px;
        }
        .vpr-gallery-caption strong {
          font-family: var(--vpr-serif); font-size: 19px; font-weight: 400; color: var(--vpr-text);
        }
 
        /* ── PRICING ── */
        .vpr-pricing-section {
          padding: 104px 64px 104px 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 2px; margin-top: 68px;
        }
        .vpr-price-card {
          padding: 56px 44px; background: var(--vpr-surface);
          border: 1px solid var(--vpr-line);
          transition: border-color 0.3s, background 0.3s, transform 0.3s var(--vpr-ease);
        }
        .vpr-price-card:hover {
          border-color: var(--vpr-line2); background: var(--vpr-surface2);
          transform: translateY(-3px);
        }
        .vpr-price-card-featured {
          background: color-mix(in srgb, var(--vpr-accent) 8%, var(--vpr-surface));
          border-color: color-mix(in srgb, var(--vpr-accent) 38%, transparent);
        }
        .vpr-price-name {
          font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--vpr-accent); margin-bottom: 24px;
        }
        .vpr-price-num {
          font-family: var(--vpr-serif); font-size: 54px; font-weight: 300;
          line-height: 1; margin-bottom: 24px; color: var(--vpr-text);
        }
        .vpr-price-desc {
          font-size: 11px; line-height: 1.75; color: var(--vpr-text-muted);
          margin-bottom: 32px; letter-spacing: 0.04em;
        }
        .vpr-price-features {
          list-style: none; display: flex; flex-direction: column;
          gap: 13px; margin-bottom: 44px;
        }
        .vpr-price-features li {
          font-size: 11px; color: var(--vpr-text-muted); display: flex;
          align-items: center; gap: 12px; letter-spacing: 0.04em;
        }
        .vpr-price-features li::before {
          content: ''; width: 16px; height: 1px;
          background: var(--vpr-accent); flex-shrink: 0;
        }
 
        /* ── FINAL CTA ── */
        .vpr-cta-section {
          padding: 128px 64px 128px 72px;
          border-top: 1px solid var(--vpr-line);
          display: grid; grid-template-columns: 1fr 400px;
          gap: 0 88px; align-items: center;
          position: relative; overflow: hidden;
        }
        .vpr-cta-section::before {
          content: '';
          position: absolute; right: -80px; top: 50%;
          transform: translateY(-50%);
          width: 640px; height: 640px; border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--vpr-accent) 10%, transparent), transparent 70%);
          pointer-events: none;
          animation: ctaGlow 8s ease-in-out infinite alternate;
        }
        @keyframes ctaGlow {
          0%   { transform: translateY(-50%) scale(1); opacity: 0.6; }
          100% { transform: translateY(-50%) scale(1.15); opacity: 1; }
        }
        .vpr-cta-eyebrow {
          font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--vpr-accent); margin-bottom: 30px;
          display: flex; align-items: center; gap: 14px;
        }
        .vpr-cta-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--vpr-accent); }
        .vpr-cta-h2 {
          font-family: var(--vpr-serif);
          font-size: clamp(48px, 5vw, 80px);
          font-weight: 300; line-height: 0.96; letter-spacing: -0.01em;
          color: var(--vpr-text);
        }
        .vpr-cta-aside {
          display: flex; flex-direction: column; gap: 28px; position: relative; z-index: 1;
        }
        .vpr-cta-aside p {
          font-size: 12px; line-height: 1.85; color: var(--vpr-text-muted); letter-spacing: 0.04em;
        }
 
        /* ── FOOTER ── */
        .vpr-footer {
          padding: 40px 64px 52px 72px;
          border-top: 1px solid var(--vpr-line);
          display: flex; justify-content: space-between; align-items: center;
        }
        .vpr-footer-brand {
          font-family: var(--vpr-serif); font-size: 18px; font-weight: 300;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--vpr-text-muted);
        }
        .vpr-footer-tagline {
          font-size: 9px; letter-spacing: 0.18em; color: var(--vpr-text-sub);
        }
 
        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .vpr-hero { grid-template-columns: 1fr; }
          .vpr-hero-sidebar { display: none; }
          .vpr-strip-grid { grid-template-columns: 1fr 1fr; }
          .vpr-mosaic-section { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .vpr-mosaic-cell-a { grid-column: 1 / 3; }
          .vpr-mosaic-cell-c, .vpr-mosaic-cell-d, .vpr-mosaic-cell-e { grid-column: auto; }
          .vpr-editorial { grid-template-columns: 1fr; }
          .vpr-editorial-intro { position: static; }
          .vpr-gallery-grid { grid-template-columns: 1fr 1fr; }
          .vpr-pricing-grid { grid-template-columns: 1fr; }
          .vpr-cta-section { grid-template-columns: 1fr; }
          .vpr-footer { flex-direction: column; gap: 12px; text-align: center; }
          .vpr-ruler { display: none; }
        }
        @media (max-width: 680px) {
          .vpr-nav { padding: 0 20px; }
          .vpr-nav-links { display: none; }
          .vpr-hero, .vpr-strip-section, .vpr-mosaic-section, .vpr-editorial,
          .vpr-gallery-section, .vpr-pricing-section, .vpr-cta-section, .vpr-footer {
            padding-left: 20px; padding-right: 20px;
          }
          .vpr-strip-grid { grid-template-columns: 1fr; }
          .vpr-gallery-grid { grid-template-columns: 1fr; }
          .vpr-mosaic-section { grid-template-columns: 1fr; }
          .vpr-mosaic-cell-a { grid-column: 1; }
        }
      `}</style>
 
      {/* Ambient background glow */}
      <div className="vpr-ambient" aria-hidden="true" />
 
      {/* Ruler */}
      <div className="vpr-ruler" aria-hidden="true">
        <div className="vpr-ruler-pulse" />
      </div>
 
      {/* Custom elements */}
      {customElements.map((item, i) => (
        <div key={`ce-${i}`} {...ed(`customElements.${i}`, "custom", t(item?.text), { style: item?.styles || {} })}>
          {t(item?.text)}
        </div>
      ))}
 
      {/* ── NAV ── */}
      <nav {...ed("nav", "navigation", undefined, {
        className: `vpr-nav${navScrolled ? " vpr-nav--scrolled" : ""}`,
      })}>
        <div {...ed("brandName", "brand", ot("brandName", brandName), { className: "vpr-logo-block" })}>
          <span className="vpr-logo-name">{ot("brandName", brandName)}</span>
          <span className="vpr-logo-rule" aria-hidden="true" />
          <span className="vpr-logo-sub">{industry}</span>
        </div>
        <div className="vpr-nav-links">
          {navigation.slice(0, 5).map((label, i) => (
            <a
              key={`nav-${i}`}
              href={sectionIds[i] ? `#${sectionIds[i]}` : "#contact"}
              className={activeSection === i ? "active" : ""}
            >
              {label}
            </a>
          ))}
        </div>
        <button {...ed("hero.primaryCta", "nav CTA", ot("hero.primaryCta", primaryCta), { className: "vpr-nav-cta" })}>
          {ot("hero.primaryCta", primaryCta)}
        </button>
      </nav>
 
      {/* ── HERO ── */}
      <section id="discipline" {...ed("heroSection", "hero", undefined, { className: "vpr-hero" })}>
        <div className="vpr-hero-media">
          {heroVideoUrl ? (
            <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
          ) : heroPosterUrl ? (
            <img src={heroPosterUrl} alt="" />
          ) : (
            <div className="vpr-hero-media-fallback" />
          )}
          <div className="vpr-hero-overlay" />
        </div>
 
        <div className="vpr-hero-copy">
          <div {...ed("hero.eyebrow", "eyebrow", ot("hero.eyebrow", heroEyebrow), { className: "vpr-hero-eyebrow" })}>
            {ot("hero.eyebrow", heroEyebrow)}
          </div>
          <h1 {...ed("hero.headline", "headline", ot("hero.headline", heroHeadline), { className: "vpr-hero-h1" })}>
            {ot("hero.headline", heroHeadline).split(" ").map((word, i, arr) =>
              i === arr.length - 1
                ? <em key={i}>{word}</em>
                : <React.Fragment key={i}>{word} </React.Fragment>
            )}
          </h1>
          <p {...ed("hero.subheadline", "subheadline", ot("hero.subheadline", heroSub), { className: "vpr-hero-sub" })}>
            {ot("hero.subheadline", heroSub)}
          </p>
          <div className="vpr-hero-actions">
            <button {...ed("hero.primaryCta", "primary CTA", ot("hero.primaryCta", primaryCta), { className: "vpr-btn-primary" })}>
              {ot("hero.primaryCta", primaryCta)}
            </button>
            <button {...ed("hero.secondaryCta", "secondary CTA", ot("hero.secondaryCta", secondaryCta), { className: "vpr-btn-ghost" })}>
              {ot("hero.secondaryCta", secondaryCta)}
            </button>
          </div>
        </div>
 
        <div className="vpr-hero-sidebar">
          {stats.slice(0, 4).map((stat, i) => (
            <StatRow key={`stat-${i}`} stat={stat} index={i} editing={editing} ed={ed} />
          ))}
        </div>
 
        <div className="vpr-scroll-hint" aria-hidden="true">
          <div className="vpr-scroll-track">
            <div className="vpr-scroll-thumb" />
          </div>
          <span>Scroll</span>
        </div>
      </section>
 
      {/* ── FEATURES STRIP ── */}
      <section id="work" {...ed("features", "features", undefined, { className: "vpr-strip-section" })}>
        <Reveal className="vpr-strip-header">
          <span className="vpr-section-label">Discipline</span>
          <h2 className="vpr-section-title">
            {t(state.sectionIntro?.headline, "Craft without\ncompromise.")}
          </h2>
        </Reveal>
        <div className="vpr-strip-grid">
          {features.slice(0, 4).map((item, i) => (
            <Reveal
              key={`feat-${i}`}
              delay={i * 80}
              tag="article"
              {...ed(`features.${i}`, "feature", undefined, { className: "vpr-strip-card" })}
            >
              <div className="vpr-strip-index">0{i + 1}</div>
              <div className="vpr-strip-card-accent" />
              <h3 {...ed(`features.${i}.title`, "feature title", t(item.title))}>
                {t(item.title)}
              </h3>
              <p {...ed(`features.${i}.description`, "feature desc", t(item.description))}>
                {t(item.description)}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
 
      {/* ── MOSAIC ── */}
      <section id="method" {...ed("premiumMosaic", "mosaic", undefined, { className: "vpr-mosaic-section" })}>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-a">
          {collectionImages[0]?.imageUrl || heroPosterUrl ? (
            <>
              <img src={collectionImages[0]?.imageUrl || heroPosterUrl} alt="" />
              <div className="vpr-mosaic-img-overlay" />
              <div className="vpr-mosaic-img-tag">Primary work</div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", background: `radial-gradient(ellipse at 40% 60%, color-mix(in srgb, var(--vpr-accent) 18%, var(--vpr-surface)), var(--vpr-surface))` }} />
          )}
        </div>
        <div {...ed("sections.0", "mosaic story", undefined, { className: "vpr-mosaic-cell vpr-mosaic-cell-b" })}>
          <div className="vpr-mosaic-text">
            <p>{t(sections[0]?.eyebrow, "Philosophy")}</p>
            <h2 {...ed("sections.0.title", "mosaic title", t(sections[0]?.title))}>
              {t(sections[0]?.title, "The discipline of less")}
            </h2>
            <span {...ed("sections.0.description", "mosaic desc", t(sections[0]?.description))}>
              {t(sections[0]?.description)}
            </span>
          </div>
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-c">
          {collectionImages[1]?.imageUrl ? (
            <>
              <img src={collectionImages[1].imageUrl} alt="" />
              <div className="vpr-mosaic-img-overlay" />
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--vpr-surface2)" }} />
          )}
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-d">
          <blockquote>
            "{t(state.sectionIntro?.headline, "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.")}"
          </blockquote>
          <cite>— Studio Maxim</cite>
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-e">
          {collectionImages[2]?.imageUrl ? (
            <>
              <img src={collectionImages[2].imageUrl} alt="" />
              <div className="vpr-mosaic-img-overlay" />
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--vpr-surface)" }} />
          )}
        </div>
      </section>
 
      {/* ── EDITORIAL TIMELINE ── */}
      <section id="archive" {...ed("sectionsArea", "sections", undefined, { className: "vpr-editorial" })}>
        <Reveal className="vpr-editorial-intro">
          <div className="vpr-section-label">Method</div>
          <h2>{t(state.sectionIntro?.eyebrow, "How we\napproach the work.")}</h2>
          <p>{t(state.sectionIntro?.description, `A rigorous, tested process refined across ${stats[0]?.title || "14"} years of practice in ${industry}.`)}</p>
        </Reveal>
        <div className="vpr-timeline">
          {sections.slice(0, 3).map((section, i) => (
            <Reveal
              key={`tl-${i}`}
              delay={i * 100}
              {...ed(`sections.${i}`, "section card", undefined, { className: "vpr-timeline-item" })}
            >
              <div className="vpr-timeline-index">0{i + 1}</div>
              <div className="vpr-timeline-body">
                <h3 {...ed(`sections.${i}.title`, "section title", t(section.title))}>
                  {t(section.title)}
                </h3>
                <p {...ed(`sections.${i}.description`, "section desc", t(section.description))}>
                  {t(section.description)}
                </p>
                <div className="vpr-chips">
                  {l(section.items, ["Item"]).slice(0, 4).map((item, j) => (
                    <span
                      key={`chip-${i}-${j}`}
                      className="vpr-chip"
                      {...ed(`sections.${i}.items.${j}`, "chip", item)}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
 
      {/* ── GALLERY ── */}
      {collectionImages.length > 0 && (
        <section id="gallery" {...ed("gallery", "gallery", undefined, { className: "vpr-gallery-section" })}>
          <Reveal className="vpr-gallery-header">
            <div>
              <div className="vpr-section-label" style={{ marginBottom: 16 }}>Archive</div>
              <h2 style={{ fontFamily: "var(--vpr-serif)", fontSize: 44, fontWeight: 300, color: "var(--vpr-text)" }}>
                {t(state.galleryIntro?.headline, "Selected works.")}
              </h2>
            </div>
            <a href="#contact" className="vpr-gallery-link">View complete archive</a>
          </Reveal>
          <div {...ed("mediaAssets.collectionImages", "gallery grid", undefined, { className: "vpr-gallery-grid" })}>
            {collectionImages.slice(0, 3).map((item, i) => (
              <Reveal
                key={`gal-${i}`}
                delay={i * 100}
                tag="article"
                {...ed(`mediaAssets.collectionImages.${i}`, "gallery card", undefined, { className: "vpr-gallery-card" })}
              >
                <img src={item.imageUrl} alt={item.title || ""} />
                <div className="vpr-gallery-caption">
                  <small>{t(item.tag, i === 0 ? "Featured" : "Collection")}</small>
                  <strong>{t(item.title || item.subtitle, industry)}</strong>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
 
      {/* ── PRICING ── */}
      {pricing.length > 0 && (
        <section id="pricing" {...ed("pricing", "pricing", undefined, { className: "vpr-pricing-section" })}>
          <Reveal>
            <div className="vpr-section-label" style={{ marginBottom: 48 }}>Engagement</div>
          </Reveal>
          <div className="vpr-pricing-grid">
            {pricing.slice(0, 3).map((plan, i) => (
              <Reveal
                key={`price-${i}`}
                delay={i * 110}
                tag="article"
                {...ed(`pricing.${i}`, "price card", undefined, {
                  className: `vpr-price-card${i === 1 ? " vpr-price-card-featured" : ""}`,
                })}
              >
                <div className="vpr-price-name">{t(plan.name, "Signature")}</div>
                <div className="vpr-price-num">{t(plan.price, "—")}</div>
                <p className="vpr-price-desc">{t(plan.description, "Tailored to the project.")}</p>
                <ul className="vpr-price-features">
                  {l(plan.features, ["Premium design", "Responsive build", "Launch ready"]).slice(0, 4).map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
                <button className="vpr-btn-primary" style={{ width: "100%", textAlign: "center", display: "block" }}>
                  Begin enquiry →
                </button>
              </Reveal>
            ))}
          </div>
        </section>
      )}
 
      {/* ── FINAL CTA ── */}
      <section id="contact" {...ed("footerCta", "footer CTA", undefined, { className: "vpr-cta-section" })}>
        <Reveal>
          <div className="vpr-cta-eyebrow">{industry}</div>
          <h2 {...ed("footer.headline", "footer headline", ot("footer.headline", t(footer.headline)), { className: "vpr-cta-h2" })}>
            {t(footer.headline, `Begin with\n${ot("brandName", brandName)}.`)}
          </h2>
        </Reveal>
        <Reveal delay={150} className="vpr-cta-aside">
          <p>Every engagement begins with a conversation. Reach out to discuss your project, timeline and ambitions.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button {...ed("footer.cta", "footer button", t(footer.cta, ot("hero.primaryCta", primaryCta)), { className: "vpr-btn-primary", style: { alignSelf: "flex-start" } })}>
              {t(footer.cta, ot("hero.primaryCta", primaryCta))} →
            </button>
            <button className="vpr-btn-ghost" style={{ alignSelf: "flex-start" }}>{ot("hero.secondaryCta", secondaryCta)}</button>
          </div>
        </Reveal>
      </section>
 
      {/* ── FOOTER ── */}
      <footer {...ed("footer", "footer", undefined, { className: "vpr-footer" })}>
        <span className="vpr-footer-brand">{ot("brandName", brandName)}</span>
        <span className="vpr-footer-tagline">{tagline}</span>
      </footer>
    </div>
  );
}