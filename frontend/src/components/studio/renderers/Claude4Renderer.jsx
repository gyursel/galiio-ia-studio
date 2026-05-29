/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   GALIO PREMIUM RENDERER
   Aesthetic: Premium Minimal Editorial + Controlled Luxury Glow
   Goals:
     · Minimal, luxury, professional visual language
     · Universal subject support
     · Stable JSX / build-safe code
     · Preserves editor contract: data-gpr-id, overrides, selectedId, onSelect
     · Responsive, accessible, reduced-motion friendly
     · Controlled luxury glow system for buttons, cards, hero and focus states
   ───────────────────────────────────────────────────────────────── */

function t(value, fallback = "") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function l(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function sid(value) {
  return t(value, "premium-landing").toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function titleCase(value) {
  return t(value, "Premium Studio")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function useReveal(threshold = 0.14) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0, threshold = 0.14, tag: Tag = "div", ...rest }) {
  const [ref, visible] = useReveal(threshold);
  const style = { transitionDelay: `${delay}ms`, ...(rest.style || {}) };

  return (
    <Tag
      {...rest}
      ref={ref}
      className={["gpr-reveal", visible ? "gpr-reveal--in" : "", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </Tag>
  );
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const value = Math.min(Math.max(window.scrollY / max, 0), 1);
      setProgress(value);
      setScrolled(window.scrollY > 28);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { progress, scrolled };
}

function usePointerDepth() {
  const [depth, setDepth] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame = null;

    const onMove = (event) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        setDepth({ x, y });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return depth;
}

function Metric({ item, index, ed }) {
  return (
    <Reveal
      tag="article"
      delay={index * 80}
      {...ed(`stats.${index}`, "metric", undefined, { className: "gpr-metric" })}
    >
      <strong {...ed(`stats.${index}.title`, "metric value", t(item.title), { className: "gpr-metric__value" })}>
        {t(item.title, index === 0 ? "98%" : "24/7")}
      </strong>
      <span {...ed(`stats.${index}.label`, "metric label", t(item.label), { className: "gpr-metric__label" })}>
        {t(item.label, "Client confidence")}
      </span>
    </Reveal>
  );
}

function PremiumImage({ src, alt = "", className = "", fallbackLabel = "Premium visual" }) {
  if (t(src)) {
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }

  return (
    <div className={["gpr-image-fallback", className].filter(Boolean).join(" ")} aria-label={fallbackLabel}>
      <span>{fallbackLabel}</span>
    </div>
  );
}

function TestimonialBlock({ items }) {
  const testimonials = l(items, [
    {
      quote: "The experience feels premium from the first second — focused, elegant and deeply considered.",
      name: "Client Partner",
      role: "Executive Sponsor",
    },
    {
      quote: "A rare balance of restraint and confidence. Everything feels intentional.",
      name: "Creative Lead",
      role: "Brand Director",
    },
  ]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length < 2) return undefined;
    const timer = setInterval(() => setActive((value) => (value + 1) % testimonials.length), 5200);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const current = testimonials[active] || testimonials[0];

  return (
    <Reveal className="gpr-quote-card">
      <div className="gpr-kicker">Client Signal</div>
      <blockquote>“{t(current.quote, "A precise, premium and professional experience.")}”</blockquote>
      <div className="gpr-quote-card__footer">
        <div>
          <strong>{t(current.name, "Client")}</strong>
          <span>{t(current.role, "Verified partner")}</span>
        </div>
        <div className="gpr-quote-dots" aria-label="Testimonials">
          {testimonials.map((_, index) => (
            <button
              key={index}
              type="button"
              className={index === active ? "is-active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

const PRESETS = {
  "premium-landing": {
    nav: ["Overview", "Proof", "Method", "Collection", "Contact"],
    ctas: ["Start Project", "View Work"],
    accent: "#D7B56D",
    sub: "Premium Experience",
  },
  "saas-product": {
    nav: ["Platform", "Benefits", "Workflow", "Pricing", "Demo"],
    ctas: ["Request Demo", "See Platform"],
    accent: "#7AA7FF",
    sub: "Product Platform",
  },
  "hospitality-experience": {
    nav: ["Experience", "Suites", "Gallery", "Reserve", "Contact"],
    ctas: ["Reserve Now", "Explore"],
    accent: "#C6A46A",
    sub: "Hospitality Experience",
  },
  "portfolio-personal": {
    nav: ["Work", "Process", "Writing", "About", "Connect"],
    ctas: ["View Work", "Start Brief"],
    accent: "#BFA7FF",
    sub: "Creative Portfolio",
  },
  "professional-service": {
    nav: ["Expertise", "Results", "Method", "Cases", "Contact"],
    ctas: ["Book Consultation", "View Method"],
    accent: "#8FC8A9",
    sub: "Professional Service",
  },
  "real-estate": {
    nav: ["Collection", "Highlights", "Viewings", "Team", "Reach"],
    ctas: ["Private Viewing", "View Collection"],
    accent: "#C7A35C",
    sub: "Private Collection",
  },
  "agency-studio": {
    nav: ["Studio", "Projects", "Clients", "Process", "Talk"],
    ctas: ["Start Brief", "Case Studies"],
    accent: "#FF8A70",
    sub: "Creative Agency",
  },
  "blog-magazine": {
    nav: ["Features", "Culture", "Design", "Opinion", "Subscribe"],
    ctas: ["Subscribe", "Latest Issue"],
    accent: "#E8C46E",
    sub: "Editorial Magazine",
  },
};

function getPreset(id) {
  return PRESETS[id] || PRESETS["premium-landing"];
}

export default function VaultPremiumRenderer({ website, editing = false, selectedId = null, onSelect }) {
  const state = website || {};
  const overrides = state.overrides || {};
  const { progress, scrolled } = useScrollProgress();
  const depth = usePointerDepth();
  const [menuOpen, setMenuOpen] = useState(false);

  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  const footer = state.footer || {};
  const templateId = sid(state.templateId);
  const preset = useMemo(() => getPreset(templateId), [templateId]);

  const brandName = t(state.brandName, titleCase(state.subject || state.industry || "Galio"));
  const tagline = t(state.tagline, "A refined digital presence built with clarity, confidence and restraint.");
  const industry = t(state.industry, preset.sub);
  const primaryColor = t(state.primaryColor, preset.accent);
  const accent = t(state.accentColor, preset.accent);
  const navigation = l(state.navigation, preset.nav);
  const [defaultPrimaryCta, defaultSecondaryCta] = preset.ctas;

  const heroHeadline = t(hero.headline, `Premium ${titleCase(industry)}\nwithout the noise.`);
  const heroEyebrow = t(hero.eyebrow, preset.sub);
  const heroSubheadline = t(hero.subheadline, tagline);
  const heroPosterUrl = t(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const heroVideoUrl = t(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const collectionImages = l(media.collectionImages, []);

  const stats = l(state.stats, [
    { title: "98%", label: "Client confidence" },
    { title: "12+", label: "Years of craft" },
    { title: "240", label: "Premium deliverables" },
    { title: "24h", label: "Response rhythm" },
  ]);

  const features = l(state.features, [
    {
      title: "Elegant first impression",
      description: "A calm premium structure that makes the offer feel trustworthy before the user reads a word.",
    },
    {
      title: "Clear conversion path",
      description: "Minimal sections, stronger hierarchy and fewer distractions guide people toward the next action.",
    },
    {
      title: "Professional content system",
      description: "Reusable blocks for proof, services, process, gallery, testimonials and pricing.",
    },
    {
      title: "Responsive by design",
      description: "The layout keeps its luxury feeling on desktop, tablet and mobile without visual clutter.",
    },
  ]);

  const sections = l(state.sections, [
    {
      title: "Strategy before surface",
      description: "We define what matters, remove what does not, and shape the experience around the strongest business signal.",
      items: ["Positioning", "Hierarchy", "Trust"],
    },
    {
      title: "Design with restraint",
      description: "Premium does not mean more effects. It means fewer elements, better spacing and clearer decisions.",
      items: ["Whitespace", "Typography", "Rhythm"],
    },
    {
      title: "Built for action",
      description: "Every section has a job: explain value, prove credibility, reduce doubt and move the visitor forward.",
      items: ["Proof", "CTA", "Flow"],
    },
  ]);

  const pricing = l(state.pricing, []);
  const customElements = l(state.customElements, []);
  const testimonials = l(state.testimonials, []);

  const footerLinks = l(footer.links, navigation).slice(0, 6);
  const year = new Date().getFullYear();

  const ov = useCallback((id) => overrides[id]?.styles || {}, [overrides]);
  const oc = useCallback((id) => t(overrides[id]?.classes, ""), [overrides]);
  const ot = useCallback((id, fallback = "") => t(overrides[id]?.text, fallback), [overrides]);

  const ed = useCallback(
    (id, tag, value, extra = {}) => ({
      "data-gpr-id": String(id || ""),
      className: [extra.className, editing ? "gpr-ed" : "", selectedId === id ? "gpr-ed--selected" : "", oc(id)]
        .filter(Boolean)
        .join(" "),
      style: { ...(extra.style || {}), ...ov(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({ id, tag, text: value, styles: ov(id), classes: oc(id), reactPath: id });
          }
        : extra.onClick,
    }),
    [editing, selectedId, onSelect, ov, oc]
  );

  const heroMediaTransform = `translate3d(${depth.x * 12}px, ${depth.y * 8}px, 0) scale(1.045)`;

  return (
    <div
      {...ed("site", "site wrapper", undefined, {
        className: "gpr-site",
        style: {
          "--gpr-accent": accent,
          "--gpr-primary": primaryColor,
        },
      })}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');

        .gpr-site {
          --gpr-bg: #070707;
          --gpr-bg-2: #0d0d0c;
          --gpr-surface: rgba(255,255,255,0.045);
          --gpr-surface-strong: rgba(255,255,255,0.075);
          --gpr-line: rgba(255,255,255,0.11);
          --gpr-line-strong: rgba(255,255,255,0.22);
          --gpr-text: #f5f1e8;
          --gpr-muted: rgba(245,241,232,0.66);
          --gpr-soft: rgba(245,241,232,0.42);
          --gpr-faint: rgba(245,241,232,0.18);
          --gpr-glow: color-mix(in srgb, var(--gpr-accent) 34%, transparent);
          --gpr-glow-soft: color-mix(in srgb, var(--gpr-accent) 16%, transparent);
          --gpr-glow-hot: color-mix(in srgb, var(--gpr-accent) 62%, white 10%);
          --gpr-serif: 'Instrument Serif', Georgia, serif;
          --gpr-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--gpr-accent) 14%, transparent), transparent 28rem),
            radial-gradient(circle at 90% 12%, rgba(255,255,255,0.06), transparent 30rem),
            linear-gradient(180deg, #050505 0%, var(--gpr-bg) 42%, #0b0a08 100%);
          color: var(--gpr-text);
          font-family: var(--gpr-sans);
          overflow-x: hidden;
          isolation: isolate;
        }


        .gpr-site::before,
        .gpr-site::after {
          content: '';
          position: fixed;
          pointer-events: none;
          z-index: -1;
          border-radius: 999px;
          filter: blur(4px);
          opacity: .9;
        }
        .gpr-site::before {
          width: 42vw;
          height: 42vw;
          min-width: 420px;
          min-height: 420px;
          left: -18vw;
          top: 20vh;
          background: radial-gradient(circle, var(--gpr-glow-soft), transparent 66%);
          animation: gpr-orbit-one 18s ease-in-out infinite alternate;
        }
        .gpr-site::after {
          width: 34vw;
          height: 34vw;
          min-width: 340px;
          min-height: 340px;
          right: -14vw;
          bottom: 10vh;
          background: radial-gradient(circle, color-mix(in srgb, var(--gpr-accent) 10%, #fff 3%, transparent), transparent 70%);
          animation: gpr-orbit-two 22s ease-in-out infinite alternate-reverse;
        }

        .gpr-site * { box-sizing: border-box; }
        .gpr-site a { color: inherit; text-decoration: none; }
        .gpr-site button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
        .gpr-site img, .gpr-site video { display: block; width: 100%; height: 100%; object-fit: cover; }

        .gpr-ed { outline: 1px dashed color-mix(in srgb, var(--gpr-accent) 62%, transparent); outline-offset: 4px; cursor: pointer; }
        .gpr-ed:hover, .gpr-ed--selected { outline: 2px solid var(--gpr-accent); }

        .gpr-progress { position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 1000; background: rgba(255,255,255,0.06); }
        .gpr-progress span { display: block; height: 100%; background: linear-gradient(90deg, var(--gpr-accent), #fff4c9); transform-origin: left; box-shadow: 0 0 18px var(--gpr-glow), 0 0 40px var(--gpr-glow-soft); }

        .gpr-reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
        .gpr-reveal--in { opacity: 1; transform: translateY(0); }

        .gpr-shell { width: min(1480px, calc(100% - 56px)); margin: 0 auto; }

        .gpr-nav {
          position: sticky; top: 0; z-index: 900;
          height: 76px;
          display: flex; align-items: center; justify-content: space-between; gap: 28px;
          padding: 0 max(28px, calc((100vw - 1480px) / 2));
          border-bottom: 1px solid transparent;
          transition: background .25s ease, border-color .25s ease, backdrop-filter .25s ease;
        }
        .gpr-nav--scrolled { background: rgba(7,7,7,.78); border-bottom-color: var(--gpr-line); backdrop-filter: blur(22px); }
        .gpr-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .gpr-brand__mark { width: 34px; height: 34px; border: 1px solid color-mix(in srgb, var(--gpr-accent) 46%, var(--gpr-line-strong)); display: grid; place-items: center; color: var(--gpr-accent); font-size: 12px; font-weight: 800; letter-spacing: -.04em; background: radial-gradient(circle at 35% 25%, color-mix(in srgb, var(--gpr-accent) 20%, transparent), rgba(255,255,255,.025)); box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 0 34px var(--gpr-glow-soft); }
        .gpr-brand__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .gpr-brand__name { font-weight: 700; letter-spacing: -.03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .gpr-brand__sub { font-size: 10px; text-transform: uppercase; letter-spacing: .18em; color: var(--gpr-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .gpr-nav__links { display: flex; align-items: center; justify-content: center; gap: 26px; color: var(--gpr-muted); font-size: 12px; }
        .gpr-nav__links a { position: relative; transition: color .2s ease; }
        .gpr-nav__links a::after { content: ''; position: absolute; left: 0; right: 0; bottom: -8px; height: 1px; background: var(--gpr-accent); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
        .gpr-nav__links a:hover { color: var(--gpr-text); }
        .gpr-nav__links a:hover::after { transform: scaleX(1); }
        .gpr-nav__cta { position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 40px; padding: 0 16px; border: 1px solid color-mix(in srgb, var(--gpr-accent) 34%, var(--gpr-line-strong)); font-size: 12px; font-weight: 600; background: rgba(255,255,255,.025); box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 0 0 1px rgba(255,255,255,.02); transition: border-color .2s ease, background .2s ease, transform .2s ease, box-shadow .25s ease; }
        .gpr-nav__cta::before { content: ''; position: absolute; inset: -1px; background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,.22) 42%, transparent 58%); transform: translateX(-130%); transition: transform .75s cubic-bezier(.22,1,.36,1); }
        .gpr-nav__cta:hover { border-color: var(--gpr-accent); background: color-mix(in srgb, var(--gpr-accent) 12%, rgba(255,255,255,.03)); transform: translateY(-1px); box-shadow: 0 0 30px var(--gpr-glow-soft), 0 12px 42px rgba(0,0,0,.34); }
        .gpr-nav__cta:hover::before { transform: translateX(130%); }
        .gpr-menu-button { display: none; width: 42px; height: 42px; border: 1px solid var(--gpr-line); align-items: center; justify-content: center; }
        .gpr-menu-button span { position: relative; display: block; width: 18px; height: 1px; background: var(--gpr-text); }
        .gpr-menu-button span::before, .gpr-menu-button span::after { content: ''; position: absolute; left: 0; width: 18px; height: 1px; background: var(--gpr-text); transition: transform .2s ease; }
        .gpr-menu-button span::before { top: -6px; }
        .gpr-menu-button span::after { top: 6px; }
        .gpr-drawer { display: none; }

        .gpr-hero { position: relative; min-height: calc(100svh - 76px); display: grid; align-items: end; overflow: hidden; border-bottom: 1px solid var(--gpr-line); }
        .gpr-hero::before { content: ''; position: absolute; width: 520px; height: 520px; right: 7%; top: 16%; border-radius: 999px; background: radial-gradient(circle, color-mix(in srgb, var(--gpr-accent) 18%, transparent), transparent 70%); filter: blur(2px); opacity: .75; pointer-events: none; z-index: -1; animation: gpr-breathe 7s ease-in-out infinite alternate; }
        .gpr-hero::after { content: ''; position: absolute; left: 50%; bottom: -1px; width: min(980px, 80vw); height: 1px; transform: translateX(-50%); background: linear-gradient(90deg, transparent, var(--gpr-accent), transparent); box-shadow: 0 0 28px var(--gpr-glow); opacity: .72; pointer-events: none; }
        .gpr-hero__media { position: absolute; inset: 0; z-index: -2; overflow: hidden; }
        .gpr-hero__media-inner { position: absolute; inset: -4%; transition: transform .16s linear; will-change: transform; }
        .gpr-hero__media video, .gpr-hero__media img { filter: brightness(.44) saturate(.82) contrast(1.06); }
        .gpr-hero__overlay { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(5,5,5,.96), rgba(5,5,5,.68) 48%, rgba(5,5,5,.92)), linear-gradient(180deg, rgba(5,5,5,.18), #070707 96%); }
        .gpr-hero__grid { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 54px; padding: 104px 0 68px; }
        .gpr-kicker { color: var(--gpr-accent); font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
        .gpr-hero h1 { margin: 22px 0 24px; max-width: 940px; font-family: var(--gpr-serif); font-size: clamp(62px, 8.8vw, 136px); line-height: .86; letter-spacing: -.055em; font-weight: 400; white-space: pre-line; text-wrap: balance; }
        .gpr-hero__lead { max-width: 640px; color: var(--gpr-muted); font-size: clamp(16px, 1.35vw, 20px); line-height: 1.72; }
        .gpr-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 36px; }
        .gpr-btn { position: relative; isolation: isolate; overflow: hidden; min-height: 52px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 0 24px; font-size: 13px; font-weight: 750; letter-spacing: -.01em; border-radius: 999px; transition: transform .22s cubic-bezier(.22,1,.36,1), background .22s ease, border-color .22s ease, color .22s ease, box-shadow .25s ease; }
        .gpr-btn::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 30% 0%, rgba(255,255,255,.34), transparent 34%), linear-gradient(110deg, transparent 0%, rgba(255,255,255,.24) 44%, transparent 60%); transform: translateX(-120%); transition: transform .85s cubic-bezier(.22,1,.36,1), opacity .25s ease; opacity: .72; }
        .gpr-btn::after { content: ''; position: absolute; inset: -2px; z-index: -2; border-radius: inherit; opacity: 0; background: radial-gradient(circle, var(--gpr-glow), transparent 64%); filter: blur(12px); transition: opacity .25s ease; }
        .gpr-btn:hover { transform: translateY(-3px); }
        .gpr-btn:hover::before { transform: translateX(120%); }
        .gpr-btn:hover::after { opacity: 1; }
        .gpr-btn--primary { background: linear-gradient(135deg, var(--gpr-text), color-mix(in srgb, var(--gpr-accent) 24%, var(--gpr-text))); color: #080808; box-shadow: inset 0 1px 0 rgba(255,255,255,.72), 0 12px 34px rgba(0,0,0,.34), 0 0 26px var(--gpr-glow-soft); }
        .gpr-btn--primary:hover { background: linear-gradient(135deg, #fffaf0, color-mix(in srgb, var(--gpr-accent) 38%, var(--gpr-text))); box-shadow: inset 0 1px 0 rgba(255,255,255,.82), 0 18px 48px rgba(0,0,0,.44), 0 0 42px var(--gpr-glow), 0 0 90px var(--gpr-glow-soft); }
        .gpr-btn--ghost { border: 1px solid color-mix(in srgb, var(--gpr-accent) 30%, var(--gpr-line-strong)); color: var(--gpr-text); background: rgba(255,255,255,.025); box-shadow: inset 0 1px 0 rgba(255,255,255,.10); }
        .gpr-btn--ghost:hover { border-color: var(--gpr-accent); background: color-mix(in srgb, var(--gpr-accent) 12%, rgba(255,255,255,.035)); box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 0 34px var(--gpr-glow-soft); }
        .gpr-hero__aside { align-self: end; display: grid; gap: 12px; }
        .gpr-metric { padding: 24px; border: 1px solid var(--gpr-line); background: rgba(255,255,255,.035); backdrop-filter: blur(18px); }
        .gpr-metric__value { display: block; font-family: var(--gpr-serif); font-size: 46px; line-height: 1; font-weight: 400; letter-spacing: -.04em; }
        .gpr-metric__label { display: block; margin-top: 10px; color: var(--gpr-soft); font-size: 12px; line-height: 1.45; }

        .gpr-section { border-bottom: 1px solid var(--gpr-line); padding: 104px 0; }
        .gpr-section__head { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1fr); gap: 56px; align-items: end; margin-bottom: 48px; }
        .gpr-section__head h2 { font-family: var(--gpr-serif); font-size: clamp(42px, 5vw, 78px); line-height: .96; letter-spacing: -.045em; font-weight: 400; white-space: pre-line; text-wrap: balance; }
        .gpr-section__head p { color: var(--gpr-muted); line-height: 1.8; font-size: 16px; max-width: 660px; }

        .gpr-feature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--gpr-line); }
        .gpr-feature-card { min-height: 300px; padding: 28px; border-right: 1px solid var(--gpr-line); background: rgba(255,255,255,.025); transition: background .25s ease, transform .25s ease; }
        .gpr-feature-card:last-child { border-right: 0; }
        .gpr-feature-card:hover { background: rgba(255,255,255,.055); transform: translateY(-4px); }
        .gpr-feature-card__index { color: var(--gpr-soft); font-size: 11px; margin-bottom: 54px; }
        .gpr-feature-card h3 { font-size: 20px; line-height: 1.2; letter-spacing: -.03em; margin: 0 0 14px; }
        .gpr-feature-card p { color: var(--gpr-muted); line-height: 1.72; font-size: 14px; margin: 0; }

        .gpr-showcase { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; }
        .gpr-showcase__image { min-height: 620px; position: relative; overflow: hidden; background: var(--gpr-surface); }
        .gpr-showcase__image img { filter: saturate(.86) contrast(1.02); transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .gpr-showcase__image:hover img { transform: scale(1.045); }
        .gpr-showcase__panel { display: grid; gap: 16px; }
        .gpr-method-card, .gpr-quote-card { border: 1px solid var(--gpr-line); background: rgba(255,255,255,.035); padding: 34px; min-height: 302px; }
        .gpr-method-card h3 { margin: 18px 0 14px; font-family: var(--gpr-serif); font-size: 38px; line-height: 1; font-weight: 400; letter-spacing: -.035em; }
        .gpr-method-card p { color: var(--gpr-muted); line-height: 1.75; }
        .gpr-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; }
        .gpr-chip { border: 1px solid var(--gpr-line); padding: 8px 11px; color: var(--gpr-soft); font-size: 11px; }
        .gpr-quote-card blockquote { margin: 18px 0 28px; font-family: var(--gpr-serif); font-size: 32px; line-height: 1.16; letter-spacing: -.03em; }
        .gpr-quote-card__footer { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
        .gpr-quote-card__footer strong, .gpr-quote-card__footer span { display: block; }
        .gpr-quote-card__footer span { margin-top: 5px; color: var(--gpr-soft); font-size: 12px; }
        .gpr-quote-dots { display: flex; gap: 8px; }
        .gpr-quote-dots button { width: 24px; height: 2px; background: var(--gpr-line-strong); }
        .gpr-quote-dots button.is-active { background: var(--gpr-accent); }

        .gpr-timeline { display: grid; gap: 0; border-top: 1px solid var(--gpr-line); }
        .gpr-timeline__item { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 28px; padding: 34px 0; border-bottom: 1px solid var(--gpr-line); }
        .gpr-timeline__num { color: var(--gpr-accent); font-size: 12px; font-weight: 700; }
        .gpr-timeline__item h3 { margin: 0 0 12px; font-family: var(--gpr-serif); font-size: clamp(30px, 3vw, 48px); line-height: 1; font-weight: 400; letter-spacing: -.035em; }
        .gpr-timeline__item p { max-width: 760px; color: var(--gpr-muted); line-height: 1.75; }

        .gpr-gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .gpr-gallery__card { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: var(--gpr-surface); }
        .gpr-gallery__card:nth-child(2) { margin-top: 54px; }
        .gpr-gallery__card img { filter: saturate(.82) contrast(1.02) brightness(.88); transition: transform .7s cubic-bezier(.22,1,.36,1), filter .4s ease; }
        .gpr-gallery__card:hover img { transform: scale(1.05); filter: saturate(1) contrast(1.04) brightness(.98); }
        .gpr-gallery__caption { position: absolute; left: 18px; right: 18px; bottom: 18px; padding: 16px; background: rgba(7,7,7,.72); backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,.12); }
        .gpr-gallery__caption small { display: block; color: var(--gpr-accent); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 6px; }
        .gpr-gallery__caption strong { display: block; font-size: 15px; }

        .gpr-pricing { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .gpr-price { padding: 30px; border: 1px solid var(--gpr-line); background: rgba(255,255,255,.035); }
        .gpr-price.is-featured { border-color: color-mix(in srgb, var(--gpr-accent) 72%, var(--gpr-line)); background: color-mix(in srgb, var(--gpr-accent) 9%, rgba(255,255,255,.035)); }
        .gpr-price__badge { display: inline-flex; margin-bottom: 20px; color: var(--gpr-accent); font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
        .gpr-price h3 { margin: 0 0 14px; font-size: 22px; }
        .gpr-price__num { display: block; margin-bottom: 16px; font-family: var(--gpr-serif); font-size: 58px; line-height: 1; letter-spacing: -.05em; }
        .gpr-price p { color: var(--gpr-muted); line-height: 1.7; }
        .gpr-price ul { list-style: none; padding: 0; margin: 26px 0 0; display: grid; gap: 12px; }
        .gpr-price li { color: var(--gpr-muted); font-size: 14px; }
        .gpr-price li::before { content: '—'; color: var(--gpr-accent); margin-right: 10px; }


        .gpr-metric,
        .gpr-feature-card,
        .gpr-method-card,
        .gpr-quote-card,
        .gpr-price,
        .gpr-custom__card,
        .gpr-gallery__caption {
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 18px 48px rgba(0,0,0,.18);
        }
        .gpr-metric::before,
        .gpr-feature-card::before,
        .gpr-method-card::before,
        .gpr-quote-card::before,
        .gpr-price::before,
        .gpr-custom__card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--gpr-accent) 13%, transparent), transparent 40%), linear-gradient(135deg, rgba(255,255,255,.055), transparent 38%);
          opacity: .42;
          transition: opacity .25s ease, transform .35s cubic-bezier(.22,1,.36,1);
        }
        .gpr-metric:hover,
        .gpr-feature-card:hover,
        .gpr-method-card:hover,
        .gpr-quote-card:hover,
        .gpr-price:hover,
        .gpr-custom__card:hover {
          border-color: color-mix(in srgb, var(--gpr-accent) 46%, var(--gpr-line));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.13), 0 22px 64px rgba(0,0,0,.32), 0 0 48px var(--gpr-glow-soft);
        }
        .gpr-metric:hover::before,
        .gpr-feature-card:hover::before,
        .gpr-method-card:hover::before,
        .gpr-quote-card:hover::before,
        .gpr-price:hover::before,
        .gpr-custom__card:hover::before { opacity: .9; transform: scale(1.04); }
        .gpr-price.is-featured { box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 0 0 1px color-mix(in srgb, var(--gpr-accent) 20%, transparent), 0 26px 80px rgba(0,0,0,.32), 0 0 64px var(--gpr-glow-soft); }
        .gpr-gallery__card::after { content: ''; position: absolute; inset: auto 0 0; height: 45%; background: linear-gradient(180deg, transparent, rgba(0,0,0,.64)); opacity: .9; pointer-events: none; }
        .gpr-gallery__card:hover { box-shadow: 0 24px 72px rgba(0,0,0,.38), 0 0 44px var(--gpr-glow-soft); }

        .gpr-custom { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .gpr-custom__card { border: 1px solid var(--gpr-line); background: rgba(255,255,255,.03); padding: 28px; }
        .gpr-custom__card h3 { margin: 0 0 12px; font-size: 20px; letter-spacing: -.03em; }
        .gpr-custom__card p { color: var(--gpr-muted); line-height: 1.7; }

        .gpr-cta { padding: 112px 0; border-bottom: 1px solid var(--gpr-line); }
        .gpr-cta__inner { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 58px; align-items: center; padding: 54px; border: 1px solid color-mix(in srgb, var(--gpr-accent) 28%, var(--gpr-line)); background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)), radial-gradient(circle at 80% 20%, var(--gpr-glow-soft), transparent 42%); position: relative; overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 28px 90px rgba(0,0,0,.28), 0 0 90px color-mix(in srgb, var(--gpr-accent) 8%, transparent); }
        .gpr-cta__inner::after { content: ''; position: absolute; width: 540px; height: 540px; right: -230px; top: -170px; border-radius: 999px; background: radial-gradient(circle, color-mix(in srgb, var(--gpr-accent) 18%, transparent), transparent 68%); }
        .gpr-cta h2 { position: relative; z-index: 1; margin: 0; max-width: 780px; font-family: var(--gpr-serif); font-size: clamp(48px, 6vw, 92px); line-height: .9; font-weight: 400; letter-spacing: -.055em; }
        .gpr-cta__side { position: relative; z-index: 1; }
        .gpr-cta__side p { color: var(--gpr-muted); line-height: 1.75; margin-bottom: 26px; }

        .gpr-footer { padding: 62px 0 36px; }
        .gpr-footer__grid { display: grid; grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(0, .6fr)); gap: 42px; }
        .gpr-footer__brand { font-family: var(--gpr-serif); font-size: 36px; letter-spacing: -.04em; }
        .gpr-footer p { max-width: 420px; color: var(--gpr-soft); line-height: 1.7; }
        .gpr-footer h4 { margin: 0 0 16px; font-size: 12px; color: var(--gpr-accent); letter-spacing: .16em; text-transform: uppercase; }
        .gpr-footer nav { display: grid; gap: 10px; color: var(--gpr-muted); font-size: 14px; }
        .gpr-footer__bottom { margin-top: 46px; padding-top: 22px; border-top: 1px solid var(--gpr-line); display: flex; justify-content: space-between; gap: 20px; color: var(--gpr-soft); font-size: 12px; }

        .gpr-image-fallback { display: grid; place-items: center; min-height: 100%; background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025)), radial-gradient(circle at 60% 30%, color-mix(in srgb, var(--gpr-accent) 16%, transparent), transparent 34rem); color: var(--gpr-soft); }
        .gpr-image-fallback span { border: 1px solid var(--gpr-line); padding: 10px 13px; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; }


        .gpr-site a:focus-visible,
        .gpr-site button:focus-visible {
          outline: 2px solid var(--gpr-accent);
          outline-offset: 4px;
          box-shadow: 0 0 0 6px var(--gpr-glow-soft), 0 0 34px var(--gpr-glow);
        }

        @keyframes gpr-breathe {
          0% { transform: translate3d(0,0,0) scale(.94); opacity: .45; }
          100% { transform: translate3d(-36px,24px,0) scale(1.08); opacity: .86; }
        }
        @keyframes gpr-orbit-one {
          0% { transform: translate3d(0,0,0) scale(1); opacity: .48; }
          100% { transform: translate3d(9vw,-5vh,0) scale(1.18); opacity: .82; }
        }
        @keyframes gpr-orbit-two {
          0% { transform: translate3d(0,0,0) scale(1); opacity: .38; }
          100% { transform: translate3d(-8vw,5vh,0) scale(1.16); opacity: .74; }
        }

        @media (max-width: 1120px) {
          .gpr-hero__grid, .gpr-section__head, .gpr-showcase, .gpr-cta__inner { grid-template-columns: 1fr; }
          .gpr-hero__aside { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gpr-feature-grid, .gpr-pricing, .gpr-custom { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gpr-feature-card:nth-child(2n) { border-right: 0; }
          .gpr-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gpr-nav__links, .gpr-nav__cta { display: none; }
          .gpr-menu-button { display: inline-flex; }
          .gpr-drawer { display: grid; position: fixed; inset: 76px 0 auto 0; z-index: 850; padding: 18px 28px 28px; background: rgba(7,7,7,.94); border-bottom: 1px solid var(--gpr-line); backdrop-filter: blur(22px); transform: translateY(-12px); opacity: 0; pointer-events: none; transition: opacity .2s ease, transform .2s ease; }
          .gpr-drawer.is-open { opacity: 1; transform: translateY(0); pointer-events: auto; }
          .gpr-drawer a { padding: 15px 0; border-bottom: 1px solid var(--gpr-line); color: var(--gpr-muted); }
        }

        @media (max-width: 720px) {
          .gpr-shell { width: min(100% - 36px, 1480px); }
          .gpr-nav { padding-left: 18px; padding-right: 18px; }
          .gpr-brand__sub { display: none; }
          .gpr-hero { min-height: auto; }
          .gpr-hero__grid { padding: 82px 0 42px; gap: 34px; }
          .gpr-hero h1 { font-size: clamp(54px, 16vw, 82px); }
          .gpr-hero__aside, .gpr-feature-grid, .gpr-gallery, .gpr-pricing, .gpr-custom, .gpr-footer__grid { grid-template-columns: 1fr; }
          .gpr-feature-card { border-right: 0; border-bottom: 1px solid var(--gpr-line); min-height: 230px; }
          .gpr-feature-card:last-child { border-bottom: 0; }
          .gpr-section { padding: 72px 0; }
          .gpr-showcase__image { min-height: 420px; }
          .gpr-gallery__card:nth-child(2) { margin-top: 0; }
          .gpr-timeline__item { grid-template-columns: 1fr; gap: 12px; }
          .gpr-cta { padding: 72px 0; }
          .gpr-cta__inner { padding: 30px; }
          .gpr-footer__bottom { flex-direction: column; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gpr-site *, .gpr-site *::before, .gpr-site *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
          .gpr-reveal { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="gpr-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <header className={["gpr-nav", scrolled ? "gpr-nav--scrolled" : ""].filter(Boolean).join(" ")}>
        <a href="#top" {...ed("brand", "brand", brandName, { className: "gpr-brand" })}>
          <span className="gpr-brand__mark">{ot("brand.initial", brandName.charAt(0) || "G")}</span>
          <span className="gpr-brand__text">
            <span {...ed("brandName", "brand name", brandName, { className: "gpr-brand__name" })}>{ot("brandName", brandName)}</span>
            <span {...ed("industry", "industry", industry, { className: "gpr-brand__sub" })}>{ot("industry", industry)}</span>
          </span>
        </a>

        <nav className="gpr-nav__links" aria-label="Primary navigation">
          {navigation.slice(0, 5).map((item, index) => (
            <a key={`${item}-${index}`} href={`#section-${index + 1}`}>
              {item}
            </a>
          ))}
        </nav>

        <a href="#contact" {...ed("nav.cta", "navigation CTA", defaultPrimaryCta, { className: "gpr-nav__cta" })}>
          {ot("nav.cta", defaultPrimaryCta)} <span>↗</span>
        </a>

        <button type="button" className="gpr-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu">
          <span />
        </button>
      </header>

      <div className={["gpr-drawer", menuOpen ? "is-open" : ""].filter(Boolean).join(" ")}>
        {navigation.slice(0, 6).map((item, index) => (
          <a key={`${item}-mobile-${index}`} href={`#section-${index + 1}`} onClick={() => setMenuOpen(false)}>
            {item}
          </a>
        ))}
      </div>

      <main id="top">
        <section {...ed("hero", "hero section", undefined, { className: "gpr-hero" })}>
          <div className="gpr-hero__media" aria-hidden="true">
            <div className="gpr-hero__media-inner" style={{ transform: heroMediaTransform }}>
              {heroVideoUrl ? (
                <video src={heroVideoUrl} poster={heroPosterUrl || undefined} autoPlay muted loop playsInline />
              ) : (
                <PremiumImage src={heroPosterUrl} fallbackLabel={brandName} />
              )}
            </div>
          </div>
          <div className="gpr-hero__overlay" aria-hidden="true" />

          <div className="gpr-shell gpr-hero__grid">
            <div>
              <Reveal>
                <div {...ed("hero.eyebrow", "hero eyebrow", heroEyebrow, { className: "gpr-kicker" })}>{ot("hero.eyebrow", heroEyebrow)}</div>
                <h1 {...ed("hero.headline", "hero headline", heroHeadline)}>{ot("hero.headline", heroHeadline)}</h1>
                <p {...ed("hero.subheadline", "hero subheadline", heroSubheadline, { className: "gpr-hero__lead" })}>
                  {ot("hero.subheadline", heroSubheadline)}
                </p>
                <div className="gpr-actions">
                  <a href="#contact" {...ed("hero.primaryCta", "primary CTA", defaultPrimaryCta, { className: "gpr-btn gpr-btn--primary" })}>
                    {ot("hero.primaryCta", defaultPrimaryCta)} <span>↗</span>
                  </a>
                  <a href="#section-2" {...ed("hero.secondaryCta", "secondary CTA", defaultSecondaryCta, { className: "gpr-btn gpr-btn--ghost" })}>
                    {ot("hero.secondaryCta", defaultSecondaryCta)}
                  </a>
                </div>
              </Reveal>
            </div>

            <aside className="gpr-hero__aside" aria-label="Key metrics">
              {stats.slice(0, 4).map((item, index) => (
                <Metric key={`metric-${index}`} item={item} index={index} ed={ed} />
              ))}
            </aside>
          </div>
        </section>

        <section id="section-1" {...ed("features", "features section", undefined, { className: "gpr-section" })}>
          <div className="gpr-shell">
            <Reveal className="gpr-section__head">
              <div>
                <div className="gpr-kicker">Premium System</div>
                <h2 {...ed("sectionIntro.headline", "section headline", t(state.sectionIntro?.headline))}>
                  {ot("sectionIntro.headline", t(state.sectionIntro?.headline, "Minimal design.\nMaximum trust."))}
                </h2>
              </div>
              <p {...ed("sectionIntro.description", "section description", t(state.sectionIntro?.description))}>
                {ot(
                  "sectionIntro.description",
                  t(
                    state.sectionIntro?.description,
                    "A professional renderer should not feel overloaded. It should feel sharp, quiet, confident and easy to understand."
                  )
                )}
              </p>
            </Reveal>

            <div className="gpr-feature-grid">
              {features.slice(0, 4).map((item, index) => (
                <Reveal
                  key={`feature-${index}`}
                  tag="article"
                  delay={index * 80}
                  {...ed(`features.${index}`, "feature", undefined, { className: "gpr-feature-card" })}
                >
                  <div className="gpr-feature-card__index">0{index + 1}</div>
                  <h3 {...ed(`features.${index}.title`, "feature title", t(item.title))}>{t(item.title)}</h3>
                  <p {...ed(`features.${index}.description`, "feature description", t(item.description))}>{t(item.description)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="section-2" {...ed("showcase", "showcase section", undefined, { className: "gpr-section" })}>
          <div className="gpr-shell">
            <div className="gpr-showcase">
              <Reveal className="gpr-showcase__image">
                <PremiumImage src={collectionImages[0]?.imageUrl || heroPosterUrl} fallbackLabel="Signature visual" />
              </Reveal>

              <div className="gpr-showcase__panel">
                <Reveal {...ed("sections.0", "method card", undefined, { className: "gpr-method-card" })}>
                  <div className="gpr-kicker">Method</div>
                  <h3 {...ed("sections.0.title", "method title", t(sections[0]?.title))}>{t(sections[0]?.title)}</h3>
                  <p {...ed("sections.0.description", "method description", t(sections[0]?.description))}>{t(sections[0]?.description)}</p>
                  <div className="gpr-chip-row">
                    {l(sections[0]?.items, ["Clarity", "Proof", "Flow"]).slice(0, 5).map((item, index) => (
                      <span key={`${item}-${index}`} className="gpr-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </Reveal>

                <TestimonialBlock items={testimonials} />
              </div>
            </div>
          </div>
        </section>

        <section id="section-3" {...ed("process", "process section", undefined, { className: "gpr-section" })}>
          <div className="gpr-shell">
            <Reveal className="gpr-section__head">
              <div>
                <div className="gpr-kicker">Process</div>
                <h2>Professional flow, without chaos.</h2>
              </div>
              <p>
                The page tells a clear story: what it is, why it matters, how it works, what proves it, and what the visitor should do next.
              </p>
            </Reveal>

            <div className="gpr-timeline">
              {sections.slice(0, 4).map((item, index) => (
                <Reveal
                  key={`section-${index}`}
                  tag="article"
                  delay={index * 80}
                  {...ed(`sections.${index}`, "process item", undefined, { className: "gpr-timeline__item" })}
                >
                  <div className="gpr-timeline__num">0{index + 1}</div>
                  <div>
                    <h3 {...ed(`sections.${index}.title`, "process title", t(item.title))}>{t(item.title)}</h3>
                    <p {...ed(`sections.${index}.description`, "process description", t(item.description))}>{t(item.description)}</p>
                    <div className="gpr-chip-row">
                      {l(item.items, []).slice(0, 4).map((chip, chipIndex) => (
                        <span key={`${chip}-${chipIndex}`} className="gpr-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="section-4" {...ed("gallery", "gallery section", undefined, { className: "gpr-section" })}>
          <div className="gpr-shell">
            <Reveal className="gpr-section__head">
              <div>
                <div className="gpr-kicker">Collection</div>
                <h2>Visuals with room to breathe.</h2>
              </div>
              <p>
                Large imagery, restrained captions and calm spacing make the page feel more premium than dense grids and aggressive effects.
              </p>
            </Reveal>

            <div className="gpr-gallery">
              {[0, 1, 2].map((slot) => {
                const image = collectionImages[slot];
                const src = image?.imageUrl || (slot === 0 ? heroPosterUrl : "");
                return (
                  <Reveal key={`gallery-${slot}`} delay={slot * 90} className="gpr-gallery__card">
                    <PremiumImage src={src} fallbackLabel={`Visual ${slot + 1}`} />
                    <div className="gpr-gallery__caption">
                      <small>{t(image?.label, `Selected ${slot + 1}`)}</small>
                      <strong>{t(image?.title, slot === 0 ? brandName : "Premium detail")}</strong>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {pricing.length ? (
          <section id="section-5" {...ed("pricing", "pricing section", undefined, { className: "gpr-section" })}>
            <div className="gpr-shell">
              <Reveal className="gpr-section__head">
                <div>
                  <div className="gpr-kicker">Investment</div>
                  <h2>Simple offers, clearly framed.</h2>
                </div>
                <p>Pricing cards are intentionally quiet: strong contrast, clear hierarchy and no unnecessary decoration.</p>
              </Reveal>

              <div className="gpr-pricing">
                {pricing.slice(0, 3).map((plan, index) => (
                  <Reveal
                    key={`price-${index}`}
                    delay={index * 90}
                    {...ed(`pricing.${index}`, "pricing card", undefined, {
                      className: ["gpr-price", plan.featured ? "is-featured" : ""].filter(Boolean).join(" "),
                    })}
                  >
                    <span className="gpr-price__badge">{plan.featured ? "Featured" : `0${index + 1}`}</span>
                    <h3 {...ed(`pricing.${index}.name`, "pricing name", t(plan.name))}>{t(plan.name, "Signature")}</h3>
                    <strong {...ed(`pricing.${index}.price`, "pricing price", t(plan.price), { className: "gpr-price__num" })}>
                      {t(plan.price, "Custom")}
                    </strong>
                    <p {...ed(`pricing.${index}.description`, "pricing description", t(plan.description))}>{t(plan.description)}</p>
                    <ul>
                      {l(plan.features, ["Strategy", "Design", "Delivery"]).slice(0, 5).map((item, itemIndex) => (
                        <li key={`${item}-${itemIndex}`}>{item}</li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {customElements.length ? (
          <section {...ed("customElements", "custom elements", undefined, { className: "gpr-section" })}>
            <div className="gpr-shell">
              <Reveal className="gpr-section__head">
                <div>
                  <div className="gpr-kicker">Additional</div>
                  <h2>Tailored content blocks.</h2>
                </div>
                <p>Generated custom elements are rendered inside the same premium system so the page remains visually consistent.</p>
              </Reveal>
              <div className="gpr-custom">
                {customElements.slice(0, 6).map((item, index) => (
                  <Reveal key={`custom-${index}`} delay={index * 70} className="gpr-custom__card">
                    <h3>{t(item.title || item.heading, `Block ${index + 1}`)}</h3>
                    <p>{t(item.description || item.text || item.body, "A focused content block aligned with the page objective.")}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="contact" {...ed("cta", "cta section", undefined, { className: "gpr-cta" })}>
          <div className="gpr-shell">
            <Reveal className="gpr-cta__inner">
              <h2 {...ed("cta.headline", "CTA headline", t(state.cta?.headline))}>
                {ot("cta.headline", t(state.cta?.headline, "Ready for a sharper digital presence?"))}
              </h2>
              <div className="gpr-cta__side">
                <p {...ed("cta.description", "CTA description", t(state.cta?.description))}>
                  {ot(
                    "cta.description",
                    t(state.cta?.description, "Turn the first impression into trust with a premium, minimal and professional experience.")
                  )}
                </p>
                <a href="#top" {...ed("cta.button", "CTA button", defaultPrimaryCta, { className: "gpr-btn gpr-btn--primary" })}>
                  {ot("cta.button", defaultPrimaryCta)} <span>↗</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer {...ed("footer", "footer", undefined, { className: "gpr-footer" })}>
        <div className="gpr-shell">
          <div className="gpr-footer__grid">
            <div>
              <div {...ed("footer.brand", "footer brand", brandName, { className: "gpr-footer__brand" })}>{ot("footer.brand", brandName)}</div>
              <p {...ed("footer.tagline", "footer tagline", t(footer.tagline, tagline))}>{ot("footer.tagline", t(footer.tagline, tagline))}</p>
            </div>
            <div>
              <h4>Navigate</h4>
              <nav>
                {footerLinks.slice(0, 5).map((item, index) => (
                  <a key={`${item}-${index}`} href={`#section-${Math.min(index + 1, 5)}`}>
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <h4>Contact</h4>
              <nav>
                <a href={`mailto:${t(footer.email, "hello@example.com")}`}>{t(footer.email, "hello@example.com")}</a>
                <a href="#contact">Start a conversation</a>
                <a href="#top">Back to top</a>
              </nav>
            </div>
          </div>
          <div className="gpr-footer__bottom">
            <span>© {year} {ot("brandName", brandName)}. All rights reserved.</span>
            <span>Premium minimal renderer by Galio.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
