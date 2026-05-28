import React, { useMemo, useRef, useEffect, useState } from "react";
 
/* ─────────────────────────────────────────────
   VAULT PREMIUM RENDERER  v1.0
   Aesthetic: Architectural Dark Editorial
   Palette: Near-black obsidian, cold white type,
            razor-thin platinum lines, crimson pulse
   Typography: Cormorant Garamond + DM Mono
   Layout: Asymmetric split columns, oversized
           typography, vertical timeline anchors
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
  const [activeSection, setActiveSection] = useState(0);
 
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
 
  function ov(id) { return overrides[id]?.styles || {}; }
  function oc(id) { return t(overrides[id]?.classes, ""); }
 
  function ed(id, tag, value, extra = {}) {
    return {
      "data-vpr-id": String(id || ""),
      className: [extra.className, editing ? "vpr-ed" : "", selectedId === id ? "vpr-ed-sel" : "", oc(id)].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...ov(id) },
      onClick: editing ? (e) => { e.stopPropagation(); onSelect?.({ id, tag, text: value, styles: ov(id), classes: oc(id), reactPath: id }); } : extra.onClick,
    };
  }
 
  const heroHeadline = t(hero.headline, "Beyond the\nordinary.");
  const heroEyebrow = t(hero.eyebrow, preset.sub);
  const heroSub = t(hero.subheadline, tagline);
 
  return (
    <div
      {...ed("site", "site wrapper", undefined, {
        className: "vpr-site",
        style: { "--vpr-accent": accent, "--vpr-primary": primary },
      })}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');
 
        .vpr-site {
          --vpr-bg: #0A090C;
          --vpr-surface: #111014;
          --vpr-surface2: #181620;
          --vpr-line: rgba(255,255,255,0.09);
          --vpr-line2: rgba(255,255,255,0.16);
          --vpr-text: #F2EFE8;
          --vpr-text-muted: rgba(242,239,232,0.46);
          --vpr-text-sub: rgba(242,239,232,0.26);
          --vpr-mono: 'DM Mono', 'Courier New', monospace;
          --vpr-serif: 'Cormorant Garamond', 'Times New Roman', serif;
          background: var(--vpr-bg);
          color: var(--vpr-text);
          min-height: 100vh;
          font-family: var(--vpr-mono);
          overflow-x: hidden;
          position: relative;
        }
 
        /* ── GLOBAL NOISE TEXTURE ── */
        .vpr-site::before {
          content: '';
          position: fixed;
          inset: 0;
          opacity: 0.028;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
        }
 
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { color: inherit; text-decoration: none; }
        button { background: none; border: none; cursor: pointer; font: inherit; color: inherit; }
        img { display: block; width: 100%; height: 100%; object-fit: cover; }
 
        .vpr-ed { outline: 1px dashed rgba(var(--vpr-accent), 0.4); outline-offset: 3px; cursor: pointer; }
        .vpr-ed:hover, .vpr-ed-sel { outline-color: var(--vpr-accent); }
 
        /* ── RENDERER BADGE ── */
        .vpr-badge {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: var(--vpr-surface2);
          border: 1px solid var(--vpr-line2);
          color: var(--vpr-text-muted);
          font-family: var(--vpr-mono);
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 6px 14px;
          pointer-events: none;
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
        .vpr-ruler::after {
          content: '';
          position: absolute;
          top: 0;
          width: 1px;
          height: 60px;
          background: var(--vpr-accent);
          animation: rulerPulse 4s ease-in-out infinite;
        }
        @keyframes rulerPulse {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: calc(100% - 60px); }
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
          background: rgba(10,9,12,0.82);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--vpr-line);
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
        }
        .vpr-nav-links a:hover { color: var(--vpr-text); }
        .vpr-nav-cta {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          border: 1px solid var(--vpr-accent);
          padding: 9px 20px;
          transition: background 0.2s, color 0.2s;
        }
        .vpr-nav-cta:hover {
          background: var(--vpr-accent);
          color: #fff;
        }
 
        /* ── HERO ── */
        .vpr-hero {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1fr 380px;
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
          filter: brightness(0.28) saturate(0.6);
        }
        .vpr-hero-media-fallback {
          width: 100%;
          height: 100%;
          background:
            radial-gradient(ellipse 60% 50% at 72% 40%, color-mix(in srgb, var(--vpr-accent) 12%, transparent), transparent),
            linear-gradient(160deg, #0e0c14 0%, #0a090c 60%, #120c10 100%);
        }
        .vpr-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(10,9,12,0.94) 0%, rgba(10,9,12,0.7) 55%, rgba(10,9,12,0.88) 100%),
            linear-gradient(180deg, rgba(10,9,12,0.2) 0%, rgba(10,9,12,0.6) 100%);
        }
        .vpr-hero-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 96px;
          padding-top: 140px;
        }
        .vpr-hero-eyebrow {
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vpr-hero-eyebrow::before {
          content: '';
          display: block;
          width: 36px;
          height: 1px;
          background: var(--vpr-accent);
        }
        .vpr-hero-h1 {
          font-family: var(--vpr-serif);
          font-size: clamp(72px, 8vw, 128px);
          font-weight: 300;
          line-height: 0.92;
          letter-spacing: -0.01em;
          color: var(--vpr-text);
          margin-bottom: 36px;
          white-space: pre-line;
        }
        .vpr-hero-h1 em {
          font-style: italic;
          color: var(--vpr-text-muted);
        }
        .vpr-hero-sub {
          font-size: 12px;
          line-height: 1.8;
          color: var(--vpr-text-muted);
          max-width: 440px;
          margin-bottom: 52px;
          letter-spacing: 0.04em;
        }
        .vpr-hero-actions {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .vpr-btn-primary {
          font-family: var(--vpr-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: var(--vpr-accent);
          color: #fff;
          padding: 14px 32px;
          transition: opacity 0.2s;
        }
        .vpr-btn-primary:hover { opacity: 0.84; }
        .vpr-btn-ghost {
          font-family: var(--vpr-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }
        .vpr-btn-ghost::after { content: '→'; }
        .vpr-btn-ghost:hover { color: var(--vpr-text); }
 
        /* ── HERO SIDEBAR ── */
        .vpr-hero-sidebar {
          position: relative;
          z-index: 2;
          border-left: 1px solid var(--vpr-line);
          padding: 140px 0 96px 48px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 0;
        }
        .vpr-stat-row {
          padding: 28px 0;
          border-bottom: 1px solid var(--vpr-line);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0 20px;
          align-items: baseline;
        }
        .vpr-stat-row:first-child { border-top: 1px solid var(--vpr-line); }
        .vpr-stat-num {
          font-family: var(--vpr-serif);
          font-size: 48px;
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
          width: 24px;
          height: 1px;
          background: var(--vpr-accent);
          grid-column: 2;
          margin-top: 8px;
        }
 
        /* ── SCROLL INDICATOR ── */
        .vpr-scroll-hint {
          position: absolute;
          bottom: 36px;
          left: 72px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-sub);
        }
        .vpr-scroll-line {
          width: 1px;
          height: 42px;
          background: linear-gradient(to bottom, var(--vpr-accent), transparent);
          animation: scrollBob 2s ease-in-out infinite;
        }
        @keyframes scrollBob {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
 
        /* ── STRIP (Features) ── */
        .vpr-strip-section {
          padding: 0 64px 0 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-strip-header {
          padding: 64px 0 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 0;
        }
        .vpr-section-label {
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          display: flex;
          align-items: center;
          gap: 10px;
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
          max-width: 560px;
        }
        .vpr-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--vpr-line);
          margin-top: 56px;
        }
        .vpr-strip-card {
          padding: 40px 32px;
          border-right: 1px solid var(--vpr-line);
          position: relative;
          transition: background 0.3s;
        }
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
          margin-bottom: 20px;
          transition: width 0.3s;
        }
        .vpr-strip-card:hover .vpr-strip-card-accent { width: 48px; }
        .vpr-strip-card h3 {
          font-family: var(--vpr-serif);
          font-size: 20px;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 14px;
          color: var(--vpr-text);
        }
        .vpr-strip-card p {
          font-size: 11px;
          line-height: 1.8;
          color: var(--vpr-text-muted);
          letter-spacing: 0.04em;
        }
 
        /* ── MOSAIC ── */
        .vpr-mosaic-section {
          padding: 96px 64px 96px 72px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 420px 380px;
          gap: 2px;
        }
        .vpr-mosaic-cell {
          background: var(--vpr-surface);
          overflow: hidden;
          position: relative;
        }
        .vpr-mosaic-cell img {
          filter: saturate(0.5) brightness(0.7);
          transition: filter 0.5s, transform 0.5s;
        }
        .vpr-mosaic-cell:hover img {
          filter: saturate(0.8) brightness(0.85);
          transform: scale(1.03);
        }
        .vpr-mosaic-cell-a {
          grid-column: 1 / 3;
          grid-row: 1;
        }
        .vpr-mosaic-cell-b {
          grid-column: 3;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 40px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text p {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          margin-bottom: 12px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text h2 {
          font-family: var(--vpr-serif);
          font-size: 28px;
          font-weight: 300;
          line-height: 1.2;
          color: var(--vpr-text);
          margin-bottom: 16px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text span {
          font-size: 11px;
          line-height: 1.7;
          color: var(--vpr-text-muted);
          letter-spacing: 0.04em;
        }
        .vpr-mosaic-cell-c {
          grid-column: 1;
          grid-row: 2;
        }
        .vpr-mosaic-cell-d {
          grid-column: 2;
          grid-row: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px;
          background: color-mix(in srgb, var(--vpr-accent) 14%, var(--vpr-surface));
          border: 1px solid color-mix(in srgb, var(--vpr-accent) 30%, transparent);
        }
        .vpr-mosaic-cell-d blockquote {
          font-family: var(--vpr-serif);
          font-size: 24px;
          font-style: italic;
          font-weight: 300;
          line-height: 1.4;
          color: var(--vpr-text);
          margin-bottom: 24px;
        }
        .vpr-mosaic-cell-d cite {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          font-style: normal;
        }
        .vpr-mosaic-cell-e {
          grid-column: 3;
          grid-row: 2;
        }
        .vpr-mosaic-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,9,12,0.72), transparent 60%);
        }
        .vpr-mosaic-img-tag {
          position: absolute;
          bottom: 24px;
          left: 24px;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vpr-mosaic-img-tag::before {
          content: '';
          width: 16px;
          height: 1px;
          background: var(--vpr-accent);
        }
 
        /* ── EDITORIAL TIMELINE ── */
        .vpr-editorial {
          padding: 96px 64px 96px 72px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 0 80px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-editorial-intro {
          position: sticky;
          top: 120px;
          align-self: start;
        }
        .vpr-editorial-intro .vpr-section-label { margin-bottom: 24px; }
        .vpr-editorial-intro h2 {
          font-family: var(--vpr-serif);
          font-size: 36px;
          font-weight: 300;
          line-height: 1.15;
          margin-bottom: 24px;
          color: var(--vpr-text);
        }
        .vpr-editorial-intro p {
          font-size: 11px;
          line-height: 1.8;
          color: var(--vpr-text-muted);
          letter-spacing: 0.04em;
        }
        .vpr-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .vpr-timeline-item {
          padding: 48px 0;
          border-bottom: 1px solid var(--vpr-line);
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0 32px;
          align-items: start;
          cursor: pointer;
          transition: background 0.2s;
        }
        .vpr-timeline-item:hover { background: rgba(255,255,255,0.02); }
        .vpr-timeline-item:last-child { border-bottom: none; }
        .vpr-timeline-index {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--vpr-text-sub);
          padding-top: 6px;
          position: relative;
        }
        .vpr-timeline-index::after {
          content: '';
          position: absolute;
          right: 0;
          top: 14px;
          width: 32px;
          height: 1px;
          background: var(--vpr-line);
        }
        .vpr-timeline-body h3 {
          font-family: var(--vpr-serif);
          font-size: 28px;
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 16px;
          color: var(--vpr-text);
          transition: color 0.2s;
        }
        .vpr-timeline-item:hover .vpr-timeline-body h3 { color: color-mix(in srgb, var(--vpr-accent) 80%, var(--vpr-text)); }
        .vpr-timeline-body p {
          font-size: 11px;
          line-height: 1.8;
          color: var(--vpr-text-muted);
          margin-bottom: 20px;
          letter-spacing: 0.04em;
        }
        .vpr-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vpr-chip {
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--vpr-text-sub);
          border: 1px solid var(--vpr-line);
          padding: 5px 12px;
        }
 
        /* ── GALLERY ── */
        .vpr-gallery-section {
          padding: 0 64px 0 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-gallery-header {
          padding: 64px 0 48px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .vpr-gallery-link {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }
        .vpr-gallery-link:hover { color: var(--vpr-text); }
        .vpr-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          padding-bottom: 96px;
        }
        .vpr-gallery-card {
          aspect-ratio: 3/4;
          overflow: hidden;
          position: relative;
          background: var(--vpr-surface);
        }
        .vpr-gallery-card img {
          filter: saturate(0.4) brightness(0.75);
          transition: filter 0.4s, transform 0.5s;
        }
        .vpr-gallery-card:hover img {
          filter: saturate(0.75) brightness(0.9);
          transform: scale(1.04);
        }
        .vpr-gallery-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px 24px 24px;
          background: linear-gradient(to top, rgba(10,9,12,0.88), transparent);
          transform: translateY(8px);
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
        }
        .vpr-gallery-card:hover .vpr-gallery-caption { opacity: 1; transform: translateY(0); }
        .vpr-gallery-caption small {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          display: block;
          margin-bottom: 6px;
        }
        .vpr-gallery-caption strong {
          font-family: var(--vpr-serif);
          font-size: 18px;
          font-weight: 400;
          color: var(--vpr-text);
        }
 
        /* ── PRICING ── */
        .vpr-pricing-section {
          padding: 96px 64px 96px 72px;
          border-top: 1px solid var(--vpr-line);
        }
        .vpr-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 64px;
        }
        .vpr-price-card {
          padding: 52px 40px;
          background: var(--vpr-surface);
          border: 1px solid var(--vpr-line);
          transition: border-color 0.3s, background 0.3s;
        }
        .vpr-price-card:hover {
          border-color: var(--vpr-line2);
          background: var(--vpr-surface2);
        }
        .vpr-price-card-featured {
          background: color-mix(in srgb, var(--vpr-accent) 8%, var(--vpr-surface));
          border-color: color-mix(in srgb, var(--vpr-accent) 40%, transparent);
        }
        .vpr-price-name {
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          margin-bottom: 24px;
        }
        .vpr-price-num {
          font-family: var(--vpr-serif);
          font-size: 52px;
          font-weight: 300;
          line-height: 1;
          margin-bottom: 24px;
          color: var(--vpr-text);
        }
        .vpr-price-desc {
          font-size: 11px;
          line-height: 1.7;
          color: var(--vpr-text-muted);
          margin-bottom: 32px;
          letter-spacing: 0.04em;
        }
        .vpr-price-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }
        .vpr-price-features li {
          font-size: 11px;
          color: var(--vpr-text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 0.04em;
        }
        .vpr-price-features li::before {
          content: '';
          width: 16px;
          height: 1px;
          background: var(--vpr-accent);
          flex-shrink: 0;
        }
 
        /* ── FINAL CTA ── */
        .vpr-cta-section {
          padding: 120px 64px 120px 72px;
          border-top: 1px solid var(--vpr-line);
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 0 80px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .vpr-cta-section::before {
          content: '';
          position: absolute;
          right: -100px;
          top: 50%;
          transform: translateY(-50%);
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--vpr-accent) 12%, transparent), transparent 70%);
          pointer-events: none;
        }
        .vpr-cta-eyebrow {
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--vpr-accent);
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vpr-cta-eyebrow::before {
          content: '';
          width: 28px;
          height: 1px;
          background: var(--vpr-accent);
        }
        .vpr-cta-h2 {
          font-family: var(--vpr-serif);
          font-size: clamp(48px, 5vw, 80px);
          font-weight: 300;
          line-height: 0.96;
          letter-spacing: -0.01em;
          color: var(--vpr-text);
        }
        .vpr-cta-aside {
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: relative;
          z-index: 1;
        }
        .vpr-cta-aside p {
          font-size: 12px;
          line-height: 1.8;
          color: var(--vpr-text-muted);
          letter-spacing: 0.04em;
        }
 
        /* ── FOOTER ── */
        .vpr-footer {
          padding: 40px 64px 48px 72px;
          border-top: 1px solid var(--vpr-line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .vpr-footer-brand {
          font-family: var(--vpr-serif);
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--vpr-text-muted);
        }
        .vpr-footer-tagline {
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--vpr-text-sub);
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
            padding-left: 20px;
            padding-right: 20px;
          }
          .vpr-strip-grid { grid-template-columns: 1fr; }
          .vpr-gallery-grid { grid-template-columns: 1fr; }
          .vpr-mosaic-section { grid-template-columns: 1fr; }
          .vpr-mosaic-cell-a { grid-column: 1; }
        }
      `}</style>
 
      {/* Ruler */}
      <div className="vpr-ruler" aria-hidden="true" />
 
      {/* Badge */}
      <div className="vpr-badge">Vault Premium Renderer</div>
 
      {/* Custom elements */}
      {customElements.map((item, i) => (
        <div key={`ce-${i}`} {...ed(`customElements.${i}`, "custom", t(item?.text), { style: item?.styles || {} })}>
          {t(item?.text)}
        </div>
      ))}
 
      {/* ── NAV ── */}
      <nav {...ed("nav", "navigation", undefined, { className: "vpr-nav" })}>
        <div {...ed("brandName", "brand", brandName, { className: "vpr-logo-block" })}>
          <span className="vpr-logo-name">{brandName}</span>
          <span className="vpr-logo-rule" aria-hidden="true" />
          <span className="vpr-logo-sub">{industry}</span>
        </div>
        <div className="vpr-nav-links">
          {navigation.slice(0, 5).map((label, i) => (
            <a key={`nav-${i}`} href={["#discipline", "#work", "#method", "#archive", "#contact"][i] || "#contact"}>
              {label}
            </a>
          ))}
        </div>
        <button {...ed("hero.primaryCta", "nav CTA", primaryCta, { className: "vpr-nav-cta" })}>
          {primaryCta}
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
          <div {...ed("hero.eyebrow", "eyebrow", heroEyebrow, { className: "vpr-hero-eyebrow" })}>
            {heroEyebrow}
          </div>
          <h1 {...ed("hero.headline", "headline", heroHeadline, { className: "vpr-hero-h1" })}>
            {heroHeadline.split(" ").map((word, i, arr) =>
              i === arr.length - 1
                ? <em key={i}>{word}</em>
                : <React.Fragment key={i}>{word} </React.Fragment>
            )}
          </h1>
          <p {...ed("hero.subheadline", "subheadline", heroSub, { className: "vpr-hero-sub" })}>
            {heroSub}
          </p>
          <div className="vpr-hero-actions">
            <button {...ed("hero.primaryCta", "primary CTA", primaryCta, { className: "vpr-btn-primary" })}>
              {primaryCta}
            </button>
            <button {...ed("hero.secondaryCta", "secondary CTA", secondaryCta, { className: "vpr-btn-ghost" })}>
              {secondaryCta}
            </button>
          </div>
        </div>
 
        <div className="vpr-hero-sidebar">
          {stats.slice(0, 4).map((stat, i) => (
            <div key={`stat-${i}`} {...ed(`stats.${i}`, "stat", undefined, { className: "vpr-stat-row" })}>
              <span {...ed(`stats.${i}.title`, "stat title", t(stat.title), { className: "vpr-stat-num" })}>
                {t(stat.title)}
              </span>
              <span {...ed(`stats.${i}.label`, "stat label", t(stat.label), { className: "vpr-stat-label" })}>
                {t(stat.label)}
              </span>
              <div className="vpr-stat-divider" />
            </div>
          ))}
        </div>
 
        <div className="vpr-scroll-hint" aria-hidden="true">
          <div className="vpr-scroll-line" />
          <span>Scroll</span>
        </div>
      </section>
 
      {/* ── FEATURES STRIP ── */}
      <section id="work" {...ed("features", "features", undefined, { className: "vpr-strip-section" })}>
        <div className="vpr-strip-header">
          <span className="vpr-section-label">Discipline</span>
          <h2 className="vpr-section-title">
            {t(state.sectionIntro?.headline, "Craft without\ncompromise.")}
          </h2>
        </div>
        <div className="vpr-strip-grid">
          {features.slice(0, 4).map((item, i) => (
            <article key={`feat-${i}`} {...ed(`features.${i}`, "feature", undefined, { className: "vpr-strip-card" })}>
              <div className="vpr-strip-index">0{i + 1}</div>
              <div className="vpr-strip-card-accent" />
              <h3 {...ed(`features.${i}.title`, "feature title", t(item.title))}>
                {t(item.title)}
              </h3>
              <p {...ed(`features.${i}.description`, "feature desc", t(item.description))}>
                {t(item.description)}
              </p>
            </article>
          ))}
        </div>
      </section>
 
      {/* ── MOSAIC ── */}
      <section id="method" {...ed("premiumMosaic", "mosaic", undefined, { className: "vpr-mosaic-section" })}>
        {/* Large image */}
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
        {/* Text card */}
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
        {/* Image c */}
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
        {/* Quote card */}
        <div className="vpr-mosaic-cell vpr-mosaic-cell-d">
          <blockquote>
            "{t(state.sectionIntro?.headline, "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.")}"
          </blockquote>
          <cite>— Studio Maxim</cite>
        </div>
        {/* Image e */}
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
        <div className="vpr-editorial-intro">
          <div className="vpr-section-label">Method</div>
          <h2>{t(state.sectionIntro?.eyebrow, "How we\napproach the work.")}</h2>
          <p>{t(state.sectionIntro?.description, `A rigorous, tested process refined across ${stats[0]?.title || "14"} years of practice in ${industry}.`)}</p>
        </div>
        <div className="vpr-timeline">
          {sections.slice(0, 3).map((section, i) => (
            <div key={`tl-${i}`} {...ed(`sections.${i}`, "section card", undefined, { className: "vpr-timeline-item" })}>
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
                    <span key={`chip-${i}-${j}`} className="vpr-chip"
                      {...ed(`sections.${i}.items.${j}`, "chip", item)}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* ── GALLERY ── */}
      {collectionImages.length > 0 && (
        <section id="gallery" {...ed("gallery", "gallery", undefined, { className: "vpr-gallery-section" })}>
          <div className="vpr-gallery-header">
            <div>
              <div className="vpr-section-label" style={{ marginBottom: 16 }}>Archive</div>
              <h2 style={{ fontFamily: "var(--vpr-serif)", fontSize: 44, fontWeight: 300, color: "var(--vpr-text)" }}>
                {t(state.galleryIntro?.headline, "Selected works.")}
              </h2>
            </div>
            <a href="#contact" className="vpr-gallery-link">View complete archive →</a>
          </div>
          <div {...ed("mediaAssets.collectionImages", "gallery grid", undefined, { className: "vpr-gallery-grid" })}>
            {collectionImages.slice(0, 3).map((item, i) => (
              <article key={`gal-${i}`} {...ed(`mediaAssets.collectionImages.${i}`, "gallery card", undefined, { className: "vpr-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title || ""} />
                <div className="vpr-gallery-caption">
                  <small>{t(item.tag, i === 0 ? "Featured" : "Collection")}</small>
                  <strong>{t(item.title || item.subtitle, industry)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
 
      {/* ── PRICING ── */}
      {pricing.length > 0 && (
        <section id="pricing" {...ed("pricing", "pricing", undefined, { className: "vpr-pricing-section" })}>
          <div className="vpr-section-label" style={{ marginBottom: 48 }}>Engagement</div>
          <div className="vpr-pricing-grid">
            {pricing.slice(0, 3).map((plan, i) => (
              <article key={`price-${i}`} {...ed(`pricing.${i}`, "price card", undefined, {
                className: `vpr-price-card${i === 1 ? " vpr-price-card-featured" : ""}`
              })}>
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
              </article>
            ))}
          </div>
        </section>
      )}
 
      {/* ── FINAL CTA ── */}
      <section id="contact" {...ed("footerCta", "footer CTA", undefined, { className: "vpr-cta-section" })}>
        <div>
          <div className="vpr-cta-eyebrow">{industry}</div>
          <h2 {...ed("footer.headline", "footer headline", t(footer.headline), { className: "vpr-cta-h2" })}>
            {t(footer.headline, `Begin with\n${brandName}.`)}
          </h2>
        </div>
        <div className="vpr-cta-aside">
          <p>Every engagement begins with a conversation. Reach out to discuss your project, timeline and ambitions.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button {...ed("footer.cta", "footer button", t(footer.cta, primaryCta), { className: "vpr-btn-primary", style: { alignSelf: "flex-start" } })}>
              {t(footer.cta, primaryCta)} →
            </button>
            <button className="vpr-btn-ghost" style={{ alignSelf: "flex-start" }}>{secondaryCta}</button>
          </div>
        </div>
      </section>
 
      {/* ── FOOTER ── */}
      <footer {...ed("footer", "footer", undefined, { className: "vpr-footer" })}>
        <span className="vpr-footer-brand">{brandName}</span>
        <span className="vpr-footer-tagline">{tagline}</span>
      </footer>
    </div>
  );
}