import React, { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   CLAUDE 6 ULTRA PREMIUM RENDERER v7.1 — POLISHED
   Aesthetic: cinematic luxury, minimal editorial, professional glow
   Goals: universal data support, stable editing contract, no hardcoded-only UI
   ───────────────────────────────────────────────────────────── */

function text(value, fallback = "") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function splitHeadline(value) {
  const clean = text(value, "Designing quiet digital authority.");
  if (clean.includes("\n")) return clean.split("\n").filter(Boolean);
  const words = clean.split(" ").filter(Boolean);
  if (words.length <= 5) return [clean];
  const pivot = Math.ceil(words.length / 2);
  return [words.slice(0, pivot).join(" "), words.slice(pivot).join(" ")];
}

function useScrollFrame() {
  const [scroll, setScroll] = useState({ y: 0, progress: 0 });

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const y = window.scrollY || 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScroll({ y, progress: clamp(y / max, 0, 1) });
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return scroll;
}

function useReveal(threshold = 0.14) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0, as: Tag = "div", ...props }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={["c6-reveal", visible ? "is-visible" : "", className].filter(Boolean).join(" ")}
      style={{ transitionDelay: `${delay}ms`, ...(props.style || {}) }}
      {...props}
    >
      {children}
    </Tag>
  );
}

function MetricCard({ stat, index, editable }) {
  return (
    <Reveal delay={index * 90} {...editable(`stats.${index}`, "stat", undefined, { className: "c6-metric" })}>
      <span className="c6-metric-index">0{index + 1}</span>
      <strong>{text(stat.title, "100%")}</strong>
      <small>{text(stat.label, "Premium proof")}</small>
    </Reveal>
  );
}

function FeatureCard({ item, index, editable }) {
  return (
    <Reveal delay={index * 110} {...editable(`features.${index}`, "feature", undefined, { className: "c6-feature-card" })}>
      <div className="c6-feature-topline">
        <span>0{index + 1}</span>
        <i />
      </div>
      <h3>{text(item.title, "Precision system")}</h3>
      <p>{text(item.description, "A refined layer of visual structure, hierarchy and conversion rhythm.")}</p>
    </Reveal>
  );
}

function ProcessRow({ item, index, editable }) {
  return (
    <Reveal delay={index * 90} {...editable(`sections.${index}`, "section", undefined, { className: "c6-process-row" })}>
      <span className="c6-process-number">/0{index + 1}</span>
      <div>
        <h3>{text(item.title, "Strategic clarity")}</h3>
        <p>{text(item.description, "Every page is shaped through restraint, proportion and intentional visual order.")}</p>
      </div>
    </Reveal>
  );
}

function GalleryCard({ item, index, fallback, editable, editableMedia, overrideMediaUrl }) {
  const src = text(item?.imageUrl || item?.image || item?.url, fallback);
  const title = text(item?.title || item?.subtitle, `Selected work 0${index + 1}`);
  const tag = text(item?.tag || item?.category, "Curated visual");

  return (
    <Reveal delay={index * 110} {...editable(`mediaAssets.collectionImages.${index}`, "gallery item", undefined, { className: `c6-gallery-card c6-gallery-card-${index + 1}` })}>
      <div className="c6-gallery-media">
        {src ? <img src={overrideMediaUrl?.(`mediaAssets.collectionImages.${index}.imageUrl`, src) || src} alt={title} loading="lazy" {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", src)} /> : <div className="c6-gallery-fallback" />}
      </div>
      <div className="c6-gallery-caption">
        <small>{tag}</small>
        <strong>{title}</strong>
      </div>
    </Reveal>
  );
}

export default function Claude6Renderer({ website, editing = false, selectedId = null, onSelect }) {
  const state = website || {};
  const overrides = state.overrides || {};
  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  const footer = state.footer || {};

  const brandName = text(state.brandName, "CLAUDE");
  const industry = text(state.industry, "premium digital studio");
  const tagline = text(state.tagline, "A minimal, cinematic and conversion-focused premium web experience.");
  const accent = text(state.primaryColor, "#D8B46A");

  const scroll = useScrollFrame();
  const navActive = scroll.y > 42;

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");

  const fallbackImages = useMemo(() => [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=90",
  ], []);

  const stats = list(state.stats, [
    { title: "98%", label: "Client confidence" },
    { title: "42", label: "Premium modules" },
    { title: "7ms", label: "Visual response" },
    { title: "24/7", label: "Digital presence" },
  ]);

  const features = list(state.features, [
    { title: "Silent luxury interface", description: "A calm visual system with cinematic depth, controlled glow and strong premium hierarchy." },
    { title: "Minimal conversion rhythm", description: "CTA placement, proof blocks and content structure are composed for trust without noise." },
    { title: "Universal business fit", description: "Works for products, services, studios, hospitality, real estate, SaaS, creators and local brands." },
  ]);

  const sections = list(state.sections, [
    { title: "Define the core promise", description: "We reduce the page to the message that matters, then build visual authority around it." },
    { title: "Shape cinematic hierarchy", description: "Large typography, measured contrast and elegant spacing make every section feel intentional." },
    { title: "Convert through trust", description: "Proof, detail and call-to-action flow are designed to move visitors without pressure." },
  ]);

  const testimonials = list(state.testimonials, [
    { quote: "The result feels expensive, clear and extremely easy to trust.", name: "A. Morgan", role: "Founder" },
    { quote: "It finally looks like a real premium brand, not another template.", name: "S. Vale", role: "Creative Director" },
  ]);

  const pricing = list(state.pricing, []);
  const collectionImages = list(media.collectionImages, []);
  const navigation = list(state.navigation, ["Capabilities", "Work", "Process", "Contact"]);
  const headlineLines = splitHeadline(overrides["hero.headline"]?.text ?? hero.headline ?? `Premium presence for ${brandName}`);

  function overrideClass(id) {
    return text(overrides[id]?.classes, "");
  }

  function overrideStyle(id) {
    return overrides[id]?.styles || {};
  }

  function overrideText(id, fallback = "") {
    return overrides[id]?.text ?? fallback;
  }

  function overrideMediaUrl(id, fallback = "") {
    return overrides[id]?.mediaUrl ?? fallback;
  }

  function editable(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": String(id || ""),
      className: [extra.className, editing ? "c6-editable" : "", selectedId === id ? "c6-selected" : "", overrideClass(id)].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({ id, tag, text: overrideText(id, value), styles: overrideStyle(id), classes: overrideClass(id), reactPath: id });
          }
        : extra.onClick,
    };
  }

  function editableMedia(id, mediaType, mediaUrl, extra = {}) {
    const finalUrl = overrideMediaUrl(id, mediaUrl);
    return {
      "data-gpr-id": String(id || ""),
      className: [extra.className, editing ? "c6-editable" : "", selectedId === id ? "c6-selected" : "", overrideClass(id)].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({ id, tag: mediaType, mediaType, mediaUrl: finalUrl, styles: overrideStyle(id), classes: overrideClass(id), reactPath: id });
          }
        : extra.onClick,
    };
  }

  return (
    <div
      {...editable("site", "site wrapper", undefined, {
        className: "c6-site",
        style: { "--c6-accent": accent, "--c6-progress": `${Math.round(scroll.progress * 100)}%` },
      })}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');

        .c6-site {
          --c6-bg: #050506;
          --c6-bg-2: #09090b;
          --c6-card: rgba(255,255,255,.052);
          --c6-card-2: rgba(255,255,255,.078);
          --c6-line: rgba(255,255,255,.105);
          --c6-line-strong: rgba(255,255,255,.20);
          --c6-text: #f7f2e8;
          --c6-muted: rgba(247,242,232,.66);
          --c6-dim: rgba(247,242,232,.42);
          --c6-serif: 'Playfair Display', Georgia, serif;
          --c6-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 18% 8%, color-mix(in srgb, var(--c6-accent) 14%, transparent), transparent 30vw),
            radial-gradient(circle at 86% 18%, rgba(255,255,255,.09), transparent 26vw),
            linear-gradient(180deg, #050506 0%, #08080a 44%, #040405 100%);
          color: var(--c6-text);
          font-family: var(--c6-sans);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        .c6-site::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: .38;
          background:
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,.026) 1px, transparent 1px);
          background-size: 88px 88px;
          mask-image: radial-gradient(circle at center, black, transparent 78%);
        }

        .c6-site::after {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: var(--c6-progress);
          height: 2px;
          z-index: 2000;
          background: linear-gradient(90deg, transparent, var(--c6-accent), #fff6d7);
          box-shadow: 0 0 24px color-mix(in srgb, var(--c6-accent) 76%, transparent);
          pointer-events: none;
        }

        .c6-shell {
          position: relative;
          z-index: 2;
          width: min(1500px, calc(100% - 48px));
          margin: 0 auto;
        }

        .c6-nav {
          position: fixed;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: min(1500px, calc(100% - 48px));
          height: 72px;
          border: 1px solid transparent;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px 0 28px;
          transition: background .45s cubic-bezier(.16,1,.3,1), border-color .45s, box-shadow .45s, backdrop-filter .45s;
        }

        .c6-nav.is-active {
          background: rgba(9,9,11,.74);
          border-color: var(--c6-line);
          backdrop-filter: blur(28px) saturate(1.25);
          -webkit-backdrop-filter: blur(28px) saturate(1.25);
          box-shadow: 0 18px 70px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.055);
        }

        .c6-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--c6-text);
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .28em;
          text-transform: uppercase;
        }

        .c6-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          position: relative;
          background:
            radial-gradient(circle at 34% 26%, #fff, color-mix(in srgb, var(--c6-accent) 84%, #fff) 22%, transparent 23%),
            linear-gradient(135deg, color-mix(in srgb, var(--c6-accent) 82%, #fff), var(--c6-accent));
          box-shadow: 0 0 34px color-mix(in srgb, var(--c6-accent) 46%, transparent);
        }

        .c6-links { display: flex; align-items: center; gap: 34px; }
        .c6-links a {
          color: var(--c6-dim);
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          transition: color .25s;
        }
        .c6-links a:hover { color: var(--c6-text); }

        .c6-nav-cta,
        .c6-btn-primary,
        .c6-btn-secondary,
        .c6-price-button {
          border: 0;
          cursor: pointer;
          font: inherit;
        }

        .c6-nav-cta {
          min-height: 44px;
          border-radius: 999px;
          padding: 0 18px;
          color: #11100d;
          background: linear-gradient(135deg, #fff3cf, var(--c6-accent));
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
          box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 0 36px color-mix(in srgb, var(--c6-accent) 28%, transparent);
          transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s;
        }
        .c6-nav-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,255,255,.28), 0 0 56px color-mix(in srgb, var(--c6-accent) 48%, transparent); }

        .c6-hero {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 58px;
          align-items: end;
          padding: 160px 0 86px;
        }

        .c6-hero-copy { position: relative; z-index: 3; padding-bottom: 12px; }

        .c6-kicker {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          color: var(--c6-accent);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .28em;
          text-transform: uppercase;
        }
        .c6-kicker::before { content: ""; width: 42px; height: 1px; background: currentColor; box-shadow: 0 0 18px currentColor; }

        .c6-headline {
          margin: 0;
          max-width: 920px;
          font-family: var(--c6-serif);
          font-size: clamp(64px, 8.6vw, 142px);
          line-height: .88;
          letter-spacing: -.065em;
          font-weight: 600;
        }
        .c6-headline span { display: block; }
        .c6-headline span:nth-child(2) { color: transparent; -webkit-text-stroke: 1px rgba(247,242,232,.58); text-stroke: 1px rgba(247,242,232,.58); font-style: italic; }

        .c6-subline {
          max-width: 620px;
          margin: 30px 0 0;
          color: var(--c6-muted);
          font-size: 17px;
          line-height: 1.88;
          letter-spacing: -.01em;
        }

        .c6-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 38px; }
        .c6-btn-primary,
        .c6-btn-secondary,
        .c6-price-button {
          min-height: 58px;
          border-radius: 999px;
          padding: 0 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
          transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s, border-color .28s, background .28s;
        }
        .c6-btn-primary,
        .c6-price-button {
          background: linear-gradient(135deg, #fff1c4 0%, var(--c6-accent) 48%, color-mix(in srgb, var(--c6-accent) 72%, #6b4c13) 100%);
          color: #11100d;
          box-shadow: 0 18px 56px color-mix(in srgb, var(--c6-accent) 26%, transparent), inset 0 1px 0 rgba(255,255,255,.45);
        }
        .c6-btn-primary::after,
        .c6-price-button::after {
          content: "";
          position: absolute;
          inset: -80% auto -80% -50%;
          width: 42%;
          transform: rotate(18deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
          transition: left .7s cubic-bezier(.16,1,.3,1);
        }
        .c6-btn-primary:hover::after,
        .c6-price-button:hover::after { left: 120%; }
        .c6-btn-primary:hover,
        .c6-price-button:hover { transform: translateY(-3px); box-shadow: 0 28px 88px color-mix(in srgb, var(--c6-accent) 42%, transparent), inset 0 1px 0 rgba(255,255,255,.58); }

        .c6-btn-secondary {
          color: var(--c6-text);
          background: rgba(255,255,255,.055);
          border: 1px solid var(--c6-line);
          backdrop-filter: blur(18px);
        }
        .c6-btn-secondary:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--c6-accent) 46%, var(--c6-line)); box-shadow: 0 22px 70px rgba(0,0,0,.28), 0 0 38px color-mix(in srgb, var(--c6-accent) 16%, transparent); }

        .c6-hero-visual { position: relative; min-height: 680px; }
        .c6-hero-frame {
          position: absolute;
          inset: 0;
          border-radius: 38px;
          overflow: hidden;
          background: #111;
          border: 1px solid var(--c6-line);
          box-shadow: 0 50px 150px rgba(0,0,0,.56), 0 0 90px color-mix(in srgb, var(--c6-accent) 12%, transparent);
        }
        .c6-hero-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(180deg, rgba(5,5,6,.06), rgba(5,5,6,.64)), radial-gradient(circle at 74% 20%, color-mix(in srgb, var(--c6-accent) 22%, transparent), transparent 34%);
          pointer-events: none;
        }
        .c6-hero-frame video,
        .c6-hero-frame img,
        .c6-media-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(.82) contrast(1.06) brightness(.82);
          transform: scale(1.06);
        }
        .c6-media-fallback {
          background:
            radial-gradient(circle at 72% 18%, color-mix(in srgb, var(--c6-accent) 36%, transparent), transparent 32%),
            linear-gradient(135deg, #191919 0%, #050506 52%, #18120a 100%);
        }
        .c6-floating-panel {
          position: absolute;
          left: -38px;
          bottom: 48px;
          z-index: 4;
          width: min(390px, 88%);
          border-radius: 30px;
          padding: 24px;
          background: rgba(10,10,12,.66);
          border: 1px solid rgba(255,255,255,.13);
          backdrop-filter: blur(26px) saturate(1.25);
          box-shadow: 0 30px 100px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.08);
        }
        .c6-floating-panel small { display: block; color: var(--c6-accent); font-size: 10px; font-weight: 900; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 10px; }
        .c6-floating-panel strong { display: block; font-family: var(--c6-serif); font-size: 28px; line-height: 1.1; letter-spacing: -.035em; }

        .c6-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          margin: 18px 0 120px;
          border: 1px solid var(--c6-line);
          border-radius: 34px;
          overflow: hidden;
          background: var(--c6-line);
        }
        .c6-metric {
          min-height: 190px;
          padding: 28px;
          background: rgba(255,255,255,.042);
          position: relative;
          overflow: hidden;
        }
        .c6-metric::after,
        .c6-feature-card::after,
        .c6-process-row::after,
        .c6-testimonial::after,
        .c6-price-card::after {
          content: "";
          position: absolute;
          inset: auto -20% -44% -20%;
          height: 80%;
          background: radial-gradient(circle, color-mix(in srgb, var(--c6-accent) 16%, transparent), transparent 62%);
          opacity: 0;
          transition: opacity .35s;
          pointer-events: none;
        }
        .c6-metric:hover::after,
        .c6-feature-card:hover::after,
        .c6-process-row:hover::after,
        .c6-testimonial:hover::after,
        .c6-price-card:hover::after { opacity: 1; }
        .c6-metric-index { color: var(--c6-accent); font-size: 11px; font-weight: 900; letter-spacing: .18em; }
        .c6-metric strong { display: block; margin-top: 34px; font-family: var(--c6-serif); font-size: clamp(42px, 4vw, 72px); line-height: .9; letter-spacing: -.055em; }
        .c6-metric small { display: block; margin-top: 14px; color: var(--c6-dim); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }

        .c6-section-head {
          display: grid;
          grid-template-columns: .72fr 1.28fr;
          gap: 64px;
          align-items: end;
          margin: 0 0 46px;
        }
        .c6-section-label { color: var(--c6-accent); font-size: 11px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
        .c6-section-title { margin: 0; font-family: var(--c6-serif); font-size: clamp(44px, 5.8vw, 96px); line-height: .94; letter-spacing: -.06em; }
        .c6-section-copy { color: var(--c6-muted); line-height: 1.85; max-width: 620px; }

        .c6-features { padding: 0 0 130px; }
        .c6-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .c6-feature-card {
          min-height: 360px;
          border-radius: 34px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.035));
          border: 1px solid var(--c6-line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.055);
          transition: transform .32s cubic-bezier(.16,1,.3,1), border-color .32s, background .32s;
        }
        .c6-feature-card:hover { transform: translateY(-8px); border-color: color-mix(in srgb, var(--c6-accent) 38%, var(--c6-line)); background: linear-gradient(180deg, rgba(255,255,255,.088), rgba(255,255,255,.045)); }
        .c6-feature-topline { display: flex; align-items: center; justify-content: space-between; color: var(--c6-accent); font-size: 11px; font-weight: 900; letter-spacing: .18em; }
        .c6-feature-topline i { width: 44px; height: 44px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--c6-accent) 36%, transparent); box-shadow: inset 0 0 20px color-mix(in srgb, var(--c6-accent) 12%, transparent), 0 0 26px color-mix(in srgb, var(--c6-accent) 14%, transparent); }
        .c6-feature-card h3 { margin: 88px 0 16px; font-family: var(--c6-serif); font-size: 38px; line-height: 1; letter-spacing: -.04em; }
        .c6-feature-card p { margin: 0; color: var(--c6-muted); line-height: 1.78; }

        .c6-gallery { padding: 0 0 150px; }
        .c6-gallery-grid { display: grid; grid-template-columns: 1.08fr .92fr 1fr; gap: 18px; align-items: start; }
        .c6-gallery-card { position: relative; border-radius: 34px; overflow: hidden; min-height: 520px; border: 1px solid var(--c6-line); background: var(--c6-card); box-shadow: 0 24px 100px rgba(0,0,0,.26); }
        .c6-gallery-card-2 { margin-top: 90px; }
        .c6-gallery-card-3 { margin-top: 34px; }
        .c6-gallery-media { position: absolute; inset: 0; }
        .c6-gallery-media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,5,6,.02), rgba(5,5,6,.78)); }
        .c6-gallery-media img,
        .c6-gallery-fallback { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(.82) contrast(1.05) brightness(.84); transition: transform .8s cubic-bezier(.16,1,.3,1), filter .8s; }
        .c6-gallery-fallback { background: linear-gradient(135deg, #171719, #050506 48%, color-mix(in srgb, var(--c6-accent) 24%, #070707)); }
        .c6-gallery-card:hover img { transform: scale(1.055); filter: saturate(.96) contrast(1.06) brightness(.92); }
        .c6-gallery-caption { position: absolute; z-index: 3; left: 24px; right: 24px; bottom: 24px; border-radius: 24px; padding: 18px; background: rgba(8,8,10,.58); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(18px); }
        .c6-gallery-caption small { display: block; color: var(--c6-accent); font-size: 10px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 8px; }
        .c6-gallery-caption strong { display: block; font-family: var(--c6-serif); font-size: 26px; line-height: 1.05; letter-spacing: -.035em; }

        .c6-process { padding: 0 0 140px; }
        .c6-process-board { border-top: 1px solid var(--c6-line); }
        .c6-process-row { display: grid; grid-template-columns: 180px 1fr; gap: 40px; padding: 42px 0; border-bottom: 1px solid var(--c6-line); position: relative; overflow: hidden; }
        .c6-process-number { color: var(--c6-accent); font-size: 12px; font-weight: 900; letter-spacing: .2em; }
        .c6-process-row h3 { margin: 0 0 12px; font-family: var(--c6-serif); font-size: clamp(32px, 3.4vw, 58px); line-height: 1; letter-spacing: -.045em; }
        .c6-process-row p { margin: 0; max-width: 760px; color: var(--c6-muted); line-height: 1.82; }

        .c6-trust { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding-bottom: 140px; }
        .c6-testimonial { min-height: 310px; position: relative; overflow: hidden; border-radius: 34px; padding: 34px; background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.035)); border: 1px solid var(--c6-line); }
        .c6-quote-mark { color: var(--c6-accent); font-family: var(--c6-serif); font-size: 90px; line-height: .7; opacity: .75; }
        .c6-testimonial blockquote { margin: 22px 0 30px; font-family: var(--c6-serif); font-size: clamp(28px, 3vw, 46px); line-height: 1.16; letter-spacing: -.04em; }
        .c6-testimonial footer { color: var(--c6-muted); font-size: 12px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .c6-testimonial footer span { color: var(--c6-accent); }

        .c6-pricing { padding-bottom: 140px; }
        .c6-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .c6-price-card { position: relative; overflow: hidden; border-radius: 34px; padding: 32px; background: rgba(255,255,255,.046); border: 1px solid var(--c6-line); min-height: 420px; display: flex; flex-direction: column; }
        .c6-price-card.is-featured { background: linear-gradient(180deg, color-mix(in srgb, var(--c6-accent) 14%, rgba(255,255,255,.05)), rgba(255,255,255,.04)); border-color: color-mix(in srgb, var(--c6-accent) 44%, var(--c6-line)); box-shadow: 0 0 90px color-mix(in srgb, var(--c6-accent) 12%, transparent); }
        .c6-price-name { color: var(--c6-accent); font-size: 11px; font-weight: 900; letter-spacing: .22em; text-transform: uppercase; }
        .c6-price-value { margin: 32px 0 18px; font-family: var(--c6-serif); font-size: 60px; letter-spacing: -.06em; }
        .c6-price-card p { color: var(--c6-muted); line-height: 1.72; }
        .c6-price-list { list-style: none; padding: 0; margin: 30px 0; display: grid; gap: 12px; color: var(--c6-muted); }
        .c6-price-list li::before { content: "—"; color: var(--c6-accent); margin-right: 10px; }
        .c6-price-button { margin-top: auto; width: 100%; }

        .c6-cta { padding: 0 0 56px; }
        .c6-cta-card { border-radius: 42px; padding: clamp(34px, 6vw, 82px); position: relative; overflow: hidden; background: radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--c6-accent) 30%, transparent), transparent 34%), linear-gradient(135deg, #111113, #060607); border: 1px solid color-mix(in srgb, var(--c6-accent) 26%, var(--c6-line)); box-shadow: 0 36px 120px rgba(0,0,0,.38), 0 0 90px color-mix(in srgb, var(--c6-accent) 10%, transparent); }
        .c6-cta-card h2 { margin: 0; max-width: 1080px; font-family: var(--c6-serif); font-size: clamp(48px, 7vw, 118px); line-height: .9; letter-spacing: -.065em; }
        .c6-cta-card p { max-width: 720px; margin: 28px 0 0; color: var(--c6-muted); line-height: 1.86; }

        .c6-footer { display: flex; justify-content: space-between; gap: 24px; padding: 42px 0 64px; color: var(--c6-dim); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .c6-footer strong { color: var(--c6-text); letter-spacing: .22em; }

        .c6-reveal { opacity: 0; transform: translateY(34px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
        .c6-reveal.is-visible { opacity: 1; transform: translateY(0); }

        .c6-editable { outline: 1px dashed color-mix(in srgb, var(--c6-accent) 52%, transparent); outline-offset: 5px; cursor: pointer; }
        .c6-editable:hover,
        .c6-selected { outline: 1px solid var(--c6-accent) !important; box-shadow: 0 0 0 4px color-mix(in srgb, var(--c6-accent) 11%, transparent); }

        @media (prefers-reduced-motion: reduce) {
          .c6-reveal,
          .c6-btn-primary,
          .c6-btn-secondary,
          .c6-feature-card,
          .c6-gallery-media img { transition: none !important; transform: none !important; }
        }

        @media (max-width: 1120px) {
          .c6-hero,
          .c6-section-head,
          .c6-gallery-grid,
          .c6-trust { grid-template-columns: 1fr; }
          .c6-hero-visual { min-height: 520px; }
          .c6-metrics,
          .c6-feature-grid,
          .c6-price-grid { grid-template-columns: 1fr 1fr; }
          .c6-gallery-card-2,
          .c6-gallery-card-3 { margin-top: 0; }
          .c6-links { display: none; }
        }

        @media (max-width: 720px) {
          .c6-shell,
          .c6-nav { width: min(100% - 28px, 1500px); }
          .c6-nav { top: 12px; height: 64px; padding: 0 12px 0 18px; }
          .c6-brand { font-size: 11px; letter-spacing: .18em; }
          .c6-brand-mark { width: 28px; height: 28px; }
          .c6-nav-cta { min-height: 38px; padding: 0 12px; font-size: 9px; }
          .c6-hero { padding-top: 122px; gap: 28px; }
          .c6-headline { font-size: clamp(50px, 16vw, 82px); }
          .c6-subline { font-size: 15px; }
          .c6-hero-visual { min-height: 420px; }
          .c6-floating-panel { left: 14px; right: 14px; bottom: 14px; width: auto; }
          .c6-metrics,
          .c6-feature-grid,
          .c6-price-grid { grid-template-columns: 1fr; }
          .c6-process-row { grid-template-columns: 1fr; gap: 16px; }
          .c6-gallery-card { min-height: 420px; }
          .c6-footer { flex-direction: column; }
        }
      `}</style>

      <header {...editable("nav", "navigation", undefined, { className: ["c6-nav", navActive ? "is-active" : ""].filter(Boolean).join(" ") })}>
        <a href="#top" {...editable("brandName", "brand", brandName, { className: "c6-brand" })}>
          <span className="c6-brand-mark" />
          <span>{overrideText("brandName", brandName)}</span>
        </a>
        <nav className="c6-links" aria-label="Main navigation">
          <a href="#capabilities">Capabilities</a>
          <a href="#work">Work</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </nav>
        <button {...editable("hero.primaryCta", "nav CTA", text(hero.primaryCta, "Start"), { className: "c6-nav-cta" })}>
          {overrideText("hero.primaryCta", text(hero.primaryCta, "Start"))}
        </button>
      </header>

      <main id="top" className="c6-shell">
        <section className="c6-hero">
          <div className="c6-hero-copy">
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "c6-kicker" })}>
              {overrideText("hero.eyebrow", text(hero.eyebrow, industry))}
            </div>
            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `Premium presence for ${brandName}`), { className: "c6-headline" })}>
              {headlineLines.map((line, index) => <span key={`headline-${index}`}>{line}</span>)}
            </h1>
            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline), { className: "c6-subline" })}>
              {overrideText("hero.subheadline", text(hero.subheadline, tagline))}
            </p>
            <div className="c6-actions">
              <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Start the experience"), { className: "c6-btn-primary" })}>
                {overrideText("hero.primaryCta", text(hero.primaryCta, "Start the experience"))} <span>→</span>
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "View work"), { className: "c6-btn-secondary" })}>
                {overrideText("hero.secondaryCta", text(hero.secondaryCta, "View work"))}
              </button>
            </div>
          </div>

          <div className="c6-hero-visual">
            <div {...editableMedia(heroVideoUrl ? "mediaAssets.heroVideoUrl" : "mediaAssets.heroImageUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "c6-hero-frame" })}>
              {heroVideoUrl ? (
                <video src={overrideMediaUrl("mediaAssets.heroVideoUrl", heroVideoUrl)} poster={heroPosterUrl} autoPlay muted loop playsInline />
              ) : heroPosterUrl ? (
                <img src={overrideMediaUrl("mediaAssets.heroImageUrl", heroPosterUrl)} alt="" />
              ) : (
                <div className="c6-media-fallback" />
              )}
            </div>
            <div {...editable("hero.floatingNote", "hero note", industry, { className: "c6-floating-panel" })}>
              <small>Premium system</small>
              <strong>{brandName} — {industry}</strong>
            </div>
          </div>
        </section>

        <section className="c6-metrics" aria-label="Metrics">
          {stats.slice(0, 4).map((stat, index) => <MetricCard key={`metric-${index}`} stat={stat} index={index} editable={editable} />)}
        </section>

        <section id="capabilities" className="c6-features">
          <div className="c6-section-head">
            <div className="c6-section-label">Capabilities</div>
            <div>
              <h2 className="c6-section-title">Minimal structure. Maximum perceived value.</h2>
              <p className="c6-section-copy">This renderer upgrades the page into a polished premium system: cinematic first impression, controlled glow, strong proof, clean conversion flow and universal support for any subject.</p>
            </div>
          </div>
          <div className="c6-feature-grid">
            {features.slice(0, 3).map((item, index) => <FeatureCard key={`feature-${index}`} item={item} index={index} editable={editable} />)}
          </div>
        </section>

        <section id="work" className="c6-gallery">
          <div className="c6-section-head">
            <div className="c6-section-label">Selected visuals</div>
            <div>
              <h2 className="c6-section-title">A gallery that feels curated, not generated.</h2>
              <p className="c6-section-copy">The layout uses your real media assets first and falls back gracefully when the project has no images yet.</p>
            </div>
          </div>
          <div className="c6-gallery-grid">
            {[0, 1, 2].map((index) => (
              <GalleryCard
                key={`gallery-${index}`}
                item={collectionImages[index]}
                index={index}
                fallback={fallbackImages[index + 1]}
                editable={editable}
                editableMedia={editableMedia}
                overrideMediaUrl={overrideMediaUrl}
              />
            ))}
          </div>
        </section>

        <section id="process" className="c6-process">
          <div className="c6-section-head">
            <div className="c6-section-label">Method</div>
            <div>
              <h2 className="c6-section-title">The page now has a professional story arc.</h2>
              <p className="c6-section-copy">Instead of hardcoded architecture copy, the renderer maps your project sections into a refined process block that works for every business type.</p>
            </div>
          </div>
          <div className="c6-process-board">
            {sections.slice(0, 4).map((item, index) => <ProcessRow key={`process-${index}`} item={item} index={index} editable={editable} />)}
          </div>
        </section>

        <section className="c6-trust">
          {testimonials.slice(0, 2).map((item, index) => (
            <Reveal key={`testimonial-${index}`} delay={index * 120} {...editable(`testimonials.${index}`, "testimonial", undefined, { className: "c6-testimonial" })}>
              <div className="c6-quote-mark">“</div>
              <blockquote>{text(item.quote, "A refined result that immediately feels more trustworthy and premium.")}</blockquote>
              <footer>{text(item.name, "Client")} <span>— {text(item.role, "Verified")}</span></footer>
            </Reveal>
          ))}
        </section>

        {pricing.length ? (
          <section className="c6-pricing">
            <div className="c6-section-head">
              <div className="c6-section-label">Offers</div>
              <div>
                <h2 className="c6-section-title">Premium packages with clean hierarchy.</h2>
                <p className="c6-section-copy">Pricing is shown only when the project provides pricing data.</p>
              </div>
            </div>
            <div className="c6-price-grid">
              {pricing.slice(0, 3).map((plan, index) => (
                <Reveal key={`price-${index}`} delay={index * 120} {...editable(`pricing.${index}`, "pricing plan", undefined, { className: `c6-price-card ${index === 1 ? "is-featured" : ""}` })}>
                  <div className="c6-price-name">{text(plan.name || plan.title, `Plan 0${index + 1}`)}</div>
                  <div className="c6-price-value">{text(plan.price, "Custom")}</div>
                  <p>{text(plan.description, "A focused package for a polished premium web presence.")}</p>
                  <ul className="c6-price-list">
                    {list(plan.features, ["Premium layout", "Responsive experience", "Conversion-focused structure"]).slice(0, 5).map((feature, featureIndex) => (
                      <li key={`price-${index}-feature-${featureIndex}`}>{text(feature, "Included")}</li>
                    ))}
                  </ul>
                  <button {...editable(`pricing.${index}.cta`, "pricing CTA", text(plan.cta, "Choose"), { className: "c6-price-button" })}>{text(plan.cta, "Choose")}</button>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        <section id="contact" className="c6-cta">
          <div className="c6-cta-card">
            <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Make ${brandName} feel premium.`))}>
              {overrideText("footer.headline", text(footer.headline, `Make ${brandName} feel premium.`))}
            </h2>
            <p {...editable("footer.description", "footer description", text(footer.description, tagline))}>
              {overrideText("footer.description", text(footer.description, tagline))}
            </p>
            <div className="c6-actions">
              <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Begin now"), { className: "c6-btn-primary" })}>
                {overrideText("footer.cta", text(footer.cta, "Begin now"))} <span>→</span>
              </button>
            </div>
          </div>
        </section>

        <footer {...editable("footer", "footer", undefined, { className: "c6-footer" })}>
          <strong {...editable("footer.brand", "footer brand", brandName)}>{brandName}</strong>
          <span {...editable("industry", "industry", industry)}>{industry}</span>
          <span>© {new Date().getFullYear()} Premium Experience</span>
        </footer>
      </main>
    </div>
  );
}
