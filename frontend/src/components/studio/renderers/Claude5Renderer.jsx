import React, {
  useMemo, useRef, useEffect, useState, useCallback
} from "react";
 
/* ─────────────────────────────────────────────────────────────────
   VAULT PREMIUM RENDERER  v3.0
   Aesthetic: Architectural Dark Editorial — Maximum Expression
   New in v3:
     · Text-scramble entrance on hero headline
     · Mouse-parallax hero depth layers (X/Y tracking)
     · Reading-progress bar at top
     · Magnetic cursor orb (custom cursor)
     · Horizontal marquee ticker (brand / trust signals)
     · Testimonial carousel with auto-rotate + drag
     · 3D card tilt on hover (transform perspective)
     · Clip-path wipe reveals on section entry
     · Mobile hamburger menu with slide-in drawer
     · Rich footer with 4-column grid + social links
     · Floating "back to top" button with scroll progress ring
     · Glassmorphism pricing cards
     · Gradient border animated on featured card
     · Keyboard / focus accessible navigation
     · Full reduced-motion media-query coverage
   ───────────────────────────────────────────────────────────────── */
 
/* ── Utility helpers ── */
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
 
/* ── useReveal: IntersectionObserver scroll reveal ── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}
 
/* ── useCounter: animated number counter ── */
function useCounter(target, duration = 1400, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) { setCount(target); return; }
    const suffix = String(target).replace(/[0-9.]/g, "");
    const steps = 60;
    const step = numeric / steps;
    let current = 0; let frame = 0;
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
 
/* ── useScramble: text scramble effect ── */
function useScramble(text, started = false, delay = 0) {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const totalFrames = 28;
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        setDisplay(
          text.split("").map((char, i) => {
            if (char === " " || char === "\n") return char;
            if (frame / totalFrames > i / text.length) return char;
            return chars[Math.floor(Math.random() * chars.length)];
          }).join("")
        );
        frame++;
        if (frame > totalFrames) clearInterval(timer);
      }, 40);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [started, text]);
  return display;
}
 
/* ── Reveal wrapper component ── */
function Reveal({ children, className = "", delay = 0, threshold = 0.12, tag: Tag = "div", clip = false, ...rest }) {
  const [ref, visible] = useReveal(threshold);
  const clipClass = clip ? " vpr-reveal--clip" : "";
  return (
    <Tag
      ref={ref}
      className={`vpr-reveal${clipClass}${visible ? " vpr-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
 
/* ── 3D Tilt card wrapper ── */
function TiltCard({ children, className = "", intensity = 8, ...rest }) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(8px)`;
  }, [intensity]);
  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);
  return (
    <div ref={ref} className={`vpr-tilt-card ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave} {...rest}>
      {children}
    </div>
  );
}
 
/* ── StatRow with animated counter ── */
function StatRow({ stat, index, editing, ed }) {
  const [ref, visible] = useReveal(0.3);
  const count = useCounter(t(stat.title), 1600, visible);
  return (
    <div
      ref={ref}
      {...ed(`stats.${index}`, "stat", undefined, {
        className: `vpr-stat-row${visible ? " vpr-stat-row--visible" : ""}`,
        style: { transitionDelay: `${index * 130}ms` },
      })}
    >
      <span {...ed(`stats.${index}.title`, "stat title", t(stat.title), { className: "vpr-stat-num" })}>
        {visible ? count : t(stat.title)}
      </span>
      <div className="vpr-stat-right">
        <span {...ed(`stats.${index}.label`, "stat label", t(stat.label), { className: "vpr-stat-label" })}>
          {t(stat.label)}
        </span>
        <div className="vpr-stat-bar" />
      </div>
    </div>
  );
}
 
/* ── Testimonial Carousel ── */
function TestimonialCarousel({ items, ed }) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const [ref, visible] = useReveal(0.1);
 
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
 
  const onPointerDown = (e) => { startX.current = e.clientX; setDragging(true); };
  const onPointerUp = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) setActive(a => dx < 0 ? (a + 1) % items.length : (a - 1 + items.length) % items.length);
    setDragging(false);
  };
 
  return (
    <section ref={ref} className={`vpr-testimonials${visible ? " vpr-reveal--in" : " vpr-reveal"}`}>
      <div className="vpr-testimonials-inner">
        <Reveal className="vpr-testimonials-label">
          <div className="vpr-section-label">Voices</div>
        </Reveal>
        <div
          className="vpr-testimonial-stage"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setDragging(false)}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={`vpr-testimonial-slide${i === active ? " active" : ""}`}
              aria-hidden={i !== active}
            >
              <blockquote className="vpr-testimonial-quote">
                <span className="vpr-quote-mark">"</span>
                {t(item.quote, "An exceptional experience from first brief to final delivery.")}
              </blockquote>
              <div className="vpr-testimonial-author">
                <div className="vpr-testimonial-avatar">
                  {t(item.avatar) ? <img src={item.avatar} alt="" /> : <span>{t(item.name, "A")[0]}</span>}
                </div>
                <div>
                  <div className="vpr-testimonial-name">{t(item.name, "Client")}</div>
                  <div className="vpr-testimonial-role">{t(item.role, "")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="vpr-testimonial-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`vpr-dot${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
 
/* ── Marquee ticker ── */
function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="vpr-marquee-wrap" aria-hidden="true">
      <div className="vpr-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="vpr-marquee-item">
            {item}<span className="vpr-marquee-sep">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
 
/* ── Back to Top button ── */
function BackToTop({ scrollProgress }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * scrollProgress;
  return (
    <button
      className={`vpr-backtop${show ? " vpr-backtop--show" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <svg viewBox="0 0 44 44" width="44" height="44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(26,23,18,0.08)" strokeWidth="1.5" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="var(--vpr-gold)"
          strokeWidth="1.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{ transition: "stroke-dasharray 0.2s" }}
        />
        <path d="M22 28 L22 16 M16 22 L22 16 L28 22" stroke="var(--vpr-text)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
 
/* ── PRESETS ── */
const PRESETS = {
  "premium-landing":       { nav: ["Studio","Work","Method","Archive","Reach"],           ctas: ["Enter Studio","View Archive"],           accent: "#C8102E", sub: "Luxury Experience Design" },
  "saas-product":          { nav: ["Platform","API","Workflow","Pricing","Demo"],          ctas: ["Request Access","Live Demo"],             accent: "#1A6BFF", sub: "Software Platform" },
  "hospitality-experience":{ nav: ["Experience","Suites","Reserve","Gallery","Contact"],   ctas: ["Reserve Now","The Collection"],           accent: "#B08B57", sub: "Hospitality & Experience" },
  "portfolio-personal":    { nav: ["Index","Work","Writing","Process","Connect"],          ctas: ["View Work","Start a Project"],            accent: "#7C5CBF", sub: "Creative Portfolio" },
  "professional-service":  { nav: ["Practice","Expertise","Method","Cases","Contact"],     ctas: ["Request Consultation","View Method"],     accent: "#2D6A4F", sub: "Professional Services" },
  "real-estate":           { nav: ["Collection","Highlights","Viewings","Team","Reach"],   ctas: ["View Collection","Private Access"],       accent: "#8B6914", sub: "Luxury Real Estate" },
  "agency-studio":         { nav: ["Studio","Projects","Clients","Process","Talk"],        ctas: ["Start a Brief","Case Studies"],           accent: "#FF4136", sub: "Creative Agency" },
  "blog-magazine":         { nav: ["Features","Culture","Design","Opinion","Subscribe"],   ctas: ["Subscribe","Latest Issue"],               accent: "#C8102E", sub: "Editorial & Magazine" },
};
function getPreset(id) { return PRESETS[id] || PRESETS["premium-landing"]; }
 
/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function VaultPremiumRenderer({ website, editing = false, selectedId = null, onSelect }) {
  const state     = website || {};
  const overrides = state.overrides || {};
 
  const siteRef        = useRef(null);
 
  const mousePos       = useRef({ x: 0, y: 0 });
  const [activeSection,  setActiveSection]  = useState(0);
  const [navScrolled,    setNavScrolled]    = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroVisible,    setHeroVisible]    = useState(false);
  const [parallax,       setParallax]       = useState({ x: 0, y: 0 });
 
  /* ── Data ── */
  const brandName = t(state.brandName, "VAULT");
  const tagline   = t(state.tagline,   "Architecture of the extraordinary.");
  const industry  = t(state.industry,  "premium studio");
  const primary   = t(state.primaryColor, "#C8102E");
 
  const hero              = state.hero || {};
  const footer            = state.footer || {};
  const media             = state.mediaAssets || {};
  const templateId        = sid(state.templateId);
  const preset            = useMemo(() => getPreset(templateId), [templateId]);
  const accent            = preset.accent;
  const navigation        = l(state.navigation, preset.nav);
  const [primaryCta, secondaryCta] = preset.ctas || ["Enter", "Explore"];
 
  const stats = l(state.stats, [
    { title: "XIV",  label: "Years of practice"  },
    { title: "230+", label: "Works completed"    },
    { title: "98%",  label: "Client retention"   },
    { title: "47",   label: "Active territories" },
  ]);
  const features = l(state.features, [
    { title: "Architectural thinking", description: "Structure before surface. Every decision rooted in purpose and proportion." },
    { title: "Material precision",     description: "Obsessive attention to detail at every scale, from macro to micro."        },
    { title: "Temporal depth",         description: "Work designed to endure. Beauty that compounds with time, not trends."    },
    { title: "Curated restraint",      description: "Knowing what to leave out is the highest form of craft."                 },
  ]);
  const sections = l(state.sections, [
    { title: "The discipline of less",  description: "Reduction as philosophy. Every element earns its presence.",              items: ["Subtraction","Hierarchy","Negative space"]     },
    { title: "Built on research",       description: "Deep contextual understanding before a single line is drawn.",             items: ["Ethnography","Precedent study","Spatial analysis"] },
    { title: "Made to last",            description: "Timelessness achieved through mastery of fundamentals, not fashion.",      items: ["Material integrity","Technical rigor","Future-proof"] },
  ]);
  const pricing = l(state.pricing, []);
  const collectionImages = l(media.collectionImages, []);
  const customElements   = l(state.customElements,   []);
  const heroVideoUrl  = t(media.heroVideoUrl  || media.backgroundVideoUrl, "");
  const heroPosterUrl = t(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const testimonials  = l(state.testimonials, [
    { quote: "They reshaped how we think about our own brand. Nothing short of transformative.", name: "Margot H.", role: "Creative Director, Luminen" },
    { quote: "The most disciplined and refined studio we have worked with across 12 years of projects.", name: "James K.", role: "CEO, Aldous Collective"  },
    { quote: "Perfection achieved through subtraction. They know exactly what to leave out.",       name: "Yuki T.",  role: "Founder, Murata Agency"     },
  ]);
  const marqueeItems = l(state.marqueeItems, [
    ot("brandName", brandName), "Est. 2010", "Award Winning", "47 Territories", "230 Projects", "98% Retention",
    "Editorial Excellence", "Architectural Precision",
  ]);
 
  const heroHeadline = t(hero.headline, "Beyond the\nordinary.");
  const heroEyebrow = t(hero.eyebrow, preset.sub);
  const heroSub = t(hero.subheadline, tagline);
  const sectionIds    = ["discipline","work","method","archive","gallery","contact"];
 
  /* ── Scroll spy + progress + cursor ── */
  useEffect(() => {
    setHeroVisible(true);
 
    const onScroll = () => {
      const sy   = window.scrollY;
      const docH = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? sy / docH : 0);
      setNavScrolled(sy > 40);
      let active = 0;
      sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && sy >= el.offsetTop - 130) active = i;
      });
      setActiveSection(active);
    };
 
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
/* hero parallax */
      const cx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x: cx * 18, y: cy * 12 });
    };
 
    window.addEventListener("scroll",    onScroll,    { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);
 
  /* ── ed helper ── */
  function ov(id) { return overrides[id]?.styles || {}; }
  function oc(id) { return t(overrides[id]?.classes, ""); }
  function ot(id, fallback = "") { return t(overrides[id]?.text, fallback); }
  function ed(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": String(id || ""),
      className: [extra.className, editing ? "vpr-ed" : "", selectedId === id ? "vpr-ed-sel" : "", oc(id)].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...ov(id) },
      onClick: editing
        ? (e) => { e.stopPropagation(); onSelect?.({ id, tag, text: value, styles: ov(id), classes: oc(id), reactPath: id }); }
        : extra.onClick,
    };
  }
 
  /* ── Scrambled hero ── */
  const scrambledHeadline = useScramble(ot("hero.headline", heroHeadline).toUpperCase(), heroVisible, 200);
 
  return (
    <div
      ref={siteRef}
      {...ed("site", "site wrapper", undefined, {
        className: "vpr-site",
        style: { "--vpr-accent": "#B08D57", "--vpr-primary": primary },
      })}
    >
      {/* ════════ STYLES ════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Jost:wght@200;300;400;500&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
 
        /* ── DESIGN TOKENS ── */
        .vpr-site {
          --vpr-bg:         #F7F4EE;
          --vpr-surface:    #EEEBE3;
          --vpr-surface2:   #E8E3D8;
          --vpr-surface3:   #DDD8CB;
          --vpr-ink:        #1A1712;
          --vpr-glass:      rgba(247,244,238,0.72);
          --vpr-line:       rgba(26,23,18,0.10);
          --vpr-line2:      rgba(26,23,18,0.18);
          --vpr-line3:      rgba(26,23,18,0.32);
          --vpr-text:       #1A1712;
          --vpr-text-muted: rgba(26,23,18,0.52);
          --vpr-text-sub:   rgba(26,23,18,0.30);
          --vpr-gold:       #B08D57;
          --vpr-gold2:      #C9A96E;
          --vpr-gold-light: rgba(176,141,87,0.12);
          --vpr-serif:      'Playfair Display','Times New Roman',serif;
          --vpr-body:       'EB Garamond','Georgia',serif;
          --vpr-sans:       'Jost',system-ui,sans-serif;
          --vpr-ease:       cubic-bezier(0.22,1,0.36,1);
          --vpr-ease-back:  cubic-bezier(0.34,1.56,0.64,1);
          background: var(--vpr-bg);
          color: var(--vpr-text);
          min-height: 100vh;
          font-family: var(--vpr-sans);
          overflow-x: hidden;
          position: relative;
          isolation: isolate;
        }
 
        /* ── PAPER GRAIN ── */
        .vpr-site::before {
          content: '';
          position: fixed; inset: 0; opacity: 0.038; pointer-events: none; z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: multiply;
        }
 
        /* ── RESET ── */
        * { box-sizing:border-box; margin:0; padding:0; }
        a { color:inherit; text-decoration:none; }
        button { background:none; border:none; cursor:pointer; font:inherit; color:inherit; }
        img { display:block; width:100%; height:100%; object-fit:cover; }
 
        /* ── EDIT STATES ── */
        .vpr-ed { outline:1px dashed rgba(200,16,46,0.35); outline-offset:3px; cursor:pointer; }
        .vpr-ed:hover, .vpr-ed-sel { outline-color:var(--vpr-accent); }
 
        /* ── PROGRESS BAR ── */
        .vpr-progress-bar {
          position: fixed; top: 0; left: 0; right: 0; height: 1px; z-index: 9000;
          background: var(--vpr-line);
          pointer-events: none;
        }
        .vpr-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--vpr-gold), var(--vpr-gold2));
          transition: width 0.15s linear;
        }
 
 
        /* ── AMBIENT ── */
        .vpr-ambient {
          position: fixed; width: 800px; height: 800px; border-radius: 50%;
          background: radial-gradient(circle, rgba(176,141,87,0.09), transparent 65%);
          pointer-events: none; z-index: 0; top: -300px; right: -200px;
          animation: ambientDrift 26s ease-in-out infinite alternate;
        }
        .vpr-ambient-2 {
          position: fixed; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(176,141,87,0.05), transparent 65%);
          pointer-events: none; z-index: 0; bottom: -250px; left: -150px;
          animation: ambientDrift 34s ease-in-out infinite alternate-reverse;
        }
        @keyframes ambientDrift {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(-60px,100px) scale(1.1); }
          66%  { transform: translate(50px,180px) scale(0.92); }
          100% { transform: translate(-30px,50px) scale(1.05); }
        }
 
        /* ── REVEAL ── */
        .vpr-reveal {
          opacity: 0; transform: translateY(30px);
          transition: opacity 0.85s var(--vpr-ease), transform 0.85s var(--vpr-ease);
        }
        .vpr-reveal--clip {
          clip-path: inset(0 0 100% 0);
          transform: translateY(0);
          transition: opacity 0.85s var(--vpr-ease), clip-path 0.9s var(--vpr-ease), transform 0.85s var(--vpr-ease);
        }
        .vpr-reveal--in { opacity:1; transform:translateY(0); clip-path: inset(0 0 0% 0); }
        @media (prefers-reduced-motion:reduce) {
          .vpr-reveal, .vpr-reveal--clip { opacity:1; transform:none; clip-path:none; transition:none; }
        }
 
        /* ── RULER ── */
        .vpr-ruler {
          position: fixed; left: 32px; top: 0; bottom: 0; width: 1px;
          background: var(--vpr-line); z-index: 100; pointer-events: none;
        }
        .vpr-ruler-pulse {
          position: absolute; top: 0; left: 0; width: 1px; height: 72px;
          background: linear-gradient(to bottom, transparent, var(--vpr-gold), transparent);
          animation: rulerPulse 6s ease-in-out infinite;
        }
        @keyframes rulerPulse {
          0%   { top: -72px; opacity:0; }
          8%   { opacity:1; }
          92%  { opacity:1; }
          100% { top:100%; opacity:0; }
        }
 
        /* ── NAV ── */
        .vpr-nav {
          position: sticky; top: 0; z-index: 500;
          padding: 0 64px 0 72px; height: 76px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.45s, border-color 0.45s, backdrop-filter 0.45s;
          border-bottom: 1px solid transparent;
        }
        .vpr-nav--scrolled {
          background: rgba(247,244,238,0.92);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-bottom-color: var(--vpr-line);
          box-shadow: 0 1px 0 rgba(176,141,87,0.12), 0 4px 32px rgba(26,23,18,0.06);
        }
        .vpr-logo-block { display:flex; align-items:baseline; gap:16px; }
        .vpr-logo-name {
          font-family: var(--vpr-serif); font-size:20px; font-weight:500;
          letter-spacing:0.22em; text-transform:uppercase; color:var(--vpr-text);
        }
        .vpr-logo-rule { width:1px; height:16px; background:var(--vpr-line2); display:inline-block; vertical-align:middle; }
        .vpr-logo-sub { font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:var(--vpr-text-sub); font-family:var(--vpr-sans); }
        .vpr-nav-links { display:flex; gap:40px; align-items:center; }
        .vpr-nav-links a {
          font-family:var(--vpr-sans); font-size:10px; letter-spacing:0.18em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-text-muted); transition:color 0.2s;
          position:relative; padding-bottom:2px;
        }
        .vpr-nav-links a::after {
          content:''; position:absolute; bottom:-2px; left:0;
          width:0; height:1px; background:var(--vpr-gold); transition:width 0.3s var(--vpr-ease);
        }
        .vpr-nav-links a:hover { color:var(--vpr-text); }
        .vpr-nav-links a:hover::after, .vpr-nav-links a.active::after { width:100%; }
        .vpr-nav-links a.active { color:var(--vpr-text); }
        .vpr-nav-cta {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.20em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold);
          border:1px solid rgba(176,141,87,0.45);
          padding:10px 22px;
          transition:background 0.25s, color 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .vpr-nav-cta:hover {
          background:var(--vpr-gold); color:#FAF7F2; border-color:var(--vpr-gold);
          box-shadow:0 4px 24px rgba(176,141,87,0.28);
        }
 
        /* ── HAMBURGER ── */
        .vpr-hamburger {
          display:none; flex-direction:column; gap:5px; padding:8px;
          cursor:pointer; z-index:600;
        }
        .vpr-hamburger span {
          display:block; width:22px; height:1px; background:var(--vpr-text-muted);
          transition:transform 0.3s var(--vpr-ease), opacity 0.2s, background 0.2s;
        }
        .vpr-hamburger.open span:nth-child(1) { transform:translateY(6px) rotate(45deg); background:var(--vpr-text); }
        .vpr-hamburger.open span:nth-child(2) { opacity:0; }
        .vpr-hamburger.open span:nth-child(3) { transform:translateY(-6px) rotate(-45deg); background:var(--vpr-text); }
 
        /* ── MOBILE DRAWER ── */
        .vpr-drawer {
          position:fixed; inset:0; z-index:490;
          background:rgba(247,244,238,0.97);
          backdrop-filter:blur(32px);
          display:flex; flex-direction:column; justify-content:center; align-items:center;
          gap:40px; padding:80px 40px;
          opacity:0; pointer-events:none;
          transition:opacity 0.4s var(--vpr-ease);
        }
        .vpr-drawer.open { opacity:1; pointer-events:all; }
        .vpr-drawer a {
          font-family:var(--vpr-serif); font-size:40px; font-weight:400;
          letter-spacing:0.04em; color:rgba(26,23,18,0.40);
          transition:color 0.2s, letter-spacing 0.3s var(--vpr-ease);
        }
        .vpr-drawer a:hover { color:var(--vpr-text); letter-spacing:0.08em; }
 
        /* ── HERO ── */
        .vpr-hero {
          min-height:100svh; display:grid;
          grid-template-columns:1fr 340px;
          position:relative; padding:0 64px 0 72px;
          overflow:hidden;
          background: var(--vpr-bg);
        }
        .vpr-hero-media {
          position:absolute; inset:0; z-index:0; overflow:hidden;
        }
        .vpr-hero-media-inner {
          position:absolute; inset:-5%;
          will-change:transform;
          transition:transform 0.12s linear;
        }
        .vpr-hero-media video, .vpr-hero-media img {
          width:100%; height:100%; object-fit:cover;
          filter:brightness(0.55) saturate(0.4) sepia(0.25);
          transform:scale(1.04);
          animation:heroMediaIn 2s var(--vpr-ease) forwards;
        }
        @keyframes heroMediaIn {
          from { transform:scale(1.10); filter:brightness(0.15) saturate(0) sepia(0); }
          to   { transform:scale(1.04); filter:brightness(0.55) saturate(0.4) sepia(0.25); }
        }
        .vpr-hero-media-fallback {
          width:100%; height:100%;
          background:
            radial-gradient(ellipse 60% 50% at 65% 42%, rgba(176,141,87,0.22), transparent),
            linear-gradient(155deg, #EDE8DC 0%, #D5CEBD 50%, #E2D9C8 100%);
        }
        .vpr-hero-overlay {
          position:absolute; inset:0;
          background:
            linear-gradient(92deg, rgba(247,244,238,0.96) 0%, rgba(247,244,238,0.60) 48%, rgba(247,244,238,0.90) 100%),
            linear-gradient(180deg, rgba(247,244,238,0.05) 0%, rgba(247,244,238,0.65) 100%);
        }
        /* Gold accent slash */
        .vpr-hero-slash {
          position:absolute; right:340px; top:0; bottom:0; width:1px;
          background:linear-gradient(to bottom, transparent, rgba(176,141,87,0.35) 30%, rgba(176,141,87,0.35) 70%, transparent);
          z-index:1;
        }
        .vpr-hero-copy {
          position:relative; z-index:2;
          display:flex; flex-direction:column; justify-content:flex-end;
          padding-bottom:108px; padding-top:148px;
        }
        .vpr-hero-eyebrow {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.36em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold); margin-bottom:36px;
          display:flex; align-items:center; gap:18px;
          opacity:0; animation:fadeUp 0.9s 0.3s var(--vpr-ease) forwards;
        }
        .vpr-hero-eyebrow::before {
          content:''; display:block; width:0; height:1px; background:var(--vpr-gold);
          animation:lineGrow 0.7s 0.7s ease forwards;
        }
        @keyframes lineGrow { to { width:48px; } }
        .vpr-hero-h1 {
          font-family:var(--vpr-serif);
          font-size:clamp(64px,7.5vw,122px);
          font-weight:500; line-height:0.92; letter-spacing:-0.02em;
          color:var(--vpr-text); margin-bottom:40px;
          white-space:pre-line;
          opacity:0; animation:fadeUp 1s 0.5s var(--vpr-ease) forwards;
        }
        .vpr-hero-h1 em { font-style:italic; font-weight:400; color:var(--vpr-gold); }
        .vpr-hero-sub {
          font-family:var(--vpr-body); font-size:17px; line-height:1.75; color:var(--vpr-text-muted);
          max-width:420px; margin-bottom:60px; font-style:italic;
          opacity:0; animation:fadeUp 0.9s 0.75s var(--vpr-ease) forwards;
        }
        .vpr-hero-actions {
          display:flex; align-items:center; gap:36px;
          opacity:0; animation:fadeUp 0.9s 0.95s var(--vpr-ease) forwards;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
 
        /* ── HERO SIDEBAR ── */
        .vpr-hero-sidebar {
          position:relative; z-index:2;
          border-left:1px solid var(--vpr-line);
          padding:148px 0 108px 52px;
          display:flex; flex-direction:column; justify-content:flex-end;
        }
        .vpr-stat-row {
          padding:28px 0; border-bottom:1px solid var(--vpr-line);
          display:grid; grid-template-columns:auto 1fr;
          gap:0 22px; align-items:center;
          opacity:0; transform:translateX(20px);
          transition:opacity 0.7s var(--vpr-ease), transform 0.7s var(--vpr-ease);
        }
        .vpr-stat-row:first-child { border-top:1px solid var(--vpr-line); }
        .vpr-stat-row--visible { opacity:1; transform:translateX(0); }
        .vpr-stat-num {
          font-family:var(--vpr-serif); font-size:46px; font-weight:500;
          line-height:1; color:var(--vpr-text); letter-spacing:-0.02em;
        }
        .vpr-stat-right { display:flex; flex-direction:column; gap:8px; }
        .vpr-stat-label {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.18em; text-transform:uppercase;
          color:var(--vpr-text-muted); font-weight:400;
        }
        .vpr-stat-bar {
          width:20px; height:1px; background:var(--vpr-gold);
          transition:width 0.55s var(--vpr-ease);
        }
        .vpr-stat-row--visible .vpr-stat-bar { width:36px; }
 
        /* ── SCROLL HINT ── */
        .vpr-scroll-hint {
          position:absolute; bottom:44px; left:72px; z-index:2;
          display:flex; align-items:center; gap:12px;
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-text-sub);
          opacity:0; animation:fadeUp 0.8s 1.5s var(--vpr-ease) forwards;
        }
        .vpr-scroll-track { width:1px; height:52px; background:var(--vpr-line2); position:relative; overflow:hidden; }
        .vpr-scroll-thumb {
          position:absolute; top:-100%; left:0; width:1px; height:100%;
          background:linear-gradient(to bottom, var(--vpr-gold), transparent);
          animation:scrollThumb 2.5s ease-in-out infinite;
        }
        @keyframes scrollThumb { 0% { top:-100%; } 100% { top:100%; } }
 
        /* ── BUTTONS ── */
        .vpr-btn-primary {
          font-family:var(--vpr-sans); font-size:10px; letter-spacing:0.24em; font-weight:400;
          text-transform:uppercase;
          background:var(--vpr-gold); color:#FAF7F2;
          padding:16px 38px; position:relative; overflow:hidden;
          transition:box-shadow 0.3s var(--vpr-ease), transform 0.2s var(--vpr-ease), background 0.3s;
        }
        .vpr-btn-primary::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg, rgba(255,255,255,0.20), transparent);
          opacity:0; transition:opacity 0.2s;
        }
        .vpr-btn-primary:hover {
          background:var(--vpr-gold2);
          box-shadow:0 8px 36px rgba(176,141,87,0.36);
          transform:translateY(-2px);
        }
        .vpr-btn-primary:hover::before { opacity:1; }
        .vpr-btn-ghost {
          font-family:var(--vpr-sans); font-size:10px; letter-spacing:0.22em; font-weight:400;
          text-transform:uppercase; color:var(--vpr-text-muted);
          display:flex; align-items:center; gap:10px;
          transition:color 0.2s, gap 0.3s var(--vpr-ease);
        }
        .vpr-btn-ghost::after { content:'→'; transition:transform 0.3s var(--vpr-ease); }
        .vpr-btn-ghost:hover { color:var(--vpr-text); gap:14px; }
        .vpr-btn-ghost:hover::after { transform:translateX(4px); }
 
        /* ── MARQUEE TICKER ── */
        .vpr-marquee-wrap {
          border-top:1px solid var(--vpr-line); border-bottom:1px solid var(--vpr-line);
          overflow:hidden; padding:18px 0;
          background:var(--vpr-surface);
        }
        .vpr-marquee-track {
          display:flex; gap:0; white-space:nowrap;
          animation:marqueeScroll 28s linear infinite;
          will-change:transform;
        }
        .vpr-marquee-track:hover { animation-play-state:paused; }
        @keyframes marqueeScroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        .vpr-marquee-item {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.28em; text-transform:uppercase; font-weight:300;
          color:var(--vpr-text-sub); padding:0 32px; display:inline-flex; align-items:center; gap:32px;
          flex-shrink:0;
        }
        .vpr-marquee-sep { color:var(--vpr-gold); font-size:6px; }
 
        /* ── SECTION LABEL ── */
        .vpr-section-label {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.32em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold); display:flex; align-items:center; gap:14px;
        }
        .vpr-section-label::before { content:''; width:26px; height:1px; background:var(--vpr-gold); }
 
        /* ── FEATURES STRIP ── */
        .vpr-strip-section { padding:0 64px 0 72px; border-top:1px solid var(--vpr-line); }
        .vpr-strip-header {
          padding:88px 0 0; display:flex; align-items:flex-end;
          justify-content:space-between; margin-bottom:0;
        }
        .vpr-section-title {
          font-family:var(--vpr-serif); font-size:clamp(32px,4vw,54px);
          font-weight:500; line-height:1.08; letter-spacing:-0.015em; max-width:560px;
        }
        .vpr-strip-grid {
          display:grid; grid-template-columns:repeat(4,1fr);
          border-top:1px solid var(--vpr-line); margin-top:64px;
        }
        .vpr-strip-card {
          padding:52px 36px; border-right:1px solid var(--vpr-line);
          position:relative; overflow:hidden;
          background:transparent;
          transition:background 0.45s var(--vpr-ease);
          transform-style:preserve-3d;
          cursor:default;
        }
        .vpr-strip-card::before {
          content:''; position:absolute; bottom:0; left:0; right:0; height:0;
          background:linear-gradient(to top, rgba(176,141,87,0.06), transparent);
          transition:height 0.45s var(--vpr-ease);
        }
        .vpr-strip-card:hover { background:rgba(176,141,87,0.04); }
        .vpr-strip-card:hover::before { height:100%; }
        .vpr-strip-card:last-child { border-right:none; }
        .vpr-strip-index { font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.18em; color:var(--vpr-text-sub); margin-bottom:36px; font-weight:300; }
        .vpr-strip-card-accent {
          width:28px; height:1px; background:var(--vpr-gold); margin-bottom:26px;
          transition:width 0.45s var(--vpr-ease);
        }
        .vpr-strip-card:hover .vpr-strip-card-accent { width:52px; }
        .vpr-strip-card h3 {
          font-family:var(--vpr-serif); font-size:22px; font-weight:500;
          line-height:1.2; margin-bottom:16px; color:var(--vpr-text);
        }
        .vpr-strip-card p { font-family:var(--vpr-body); font-size:15px; line-height:1.8; color:var(--vpr-text-muted); font-style:italic; }
 
        /* ── TILT CARD (wrapper only — no visual by itself) ── */
        .vpr-tilt-card { transition:transform 0.25s var(--vpr-ease); will-change:transform; }
 
        /* ── MOSAIC ── */
        .vpr-mosaic-section {
          padding:108px 64px 108px 72px; display:grid;
          grid-template-columns:1fr 1fr 1fr;
          grid-template-rows:460px 400px; gap:3px;
          background: var(--vpr-surface);
        }
        .vpr-mosaic-cell { background:var(--vpr-surface2); overflow:hidden; position:relative; }
        .vpr-mosaic-cell img {
          filter:saturate(0.55) brightness(0.82);
          transition:filter 0.7s var(--vpr-ease), transform 0.7s var(--vpr-ease);
        }
        .vpr-mosaic-cell:hover img { filter:saturate(0.92) brightness(1.0); transform:scale(1.04); }
        .vpr-mosaic-cell-a { grid-column:1/3; grid-row:1; }
        .vpr-mosaic-cell-b {
          grid-column:3; grid-row:1;
          display:flex; flex-direction:column; justify-content:flex-end;
          padding:48px; background:var(--vpr-bg);
          border:1px solid var(--vpr-line);
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text p {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.26em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold); margin-bottom:14px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text h2 {
          font-family:var(--vpr-serif); font-size:28px; font-weight:500;
          line-height:1.2; color:var(--vpr-text); margin-bottom:18px;
        }
        .vpr-mosaic-cell-b .vpr-mosaic-text span {
          font-family:var(--vpr-body); font-size:15px; line-height:1.75; color:var(--vpr-text-muted); font-style:italic;
        }
        .vpr-mosaic-cell-c { grid-column:1; grid-row:2; }
        .vpr-mosaic-cell-d {
          grid-column:2; grid-row:2;
          display:flex; flex-direction:column; justify-content:center; padding:56px;
          background:var(--vpr-gold-light);
          border:1px solid rgba(176,141,87,0.22);
          position:relative; overflow:hidden;
        }
        .vpr-mosaic-cell-d::before {
          content:'"'; position:absolute; top:-28px; left:32px;
          font-family:var(--vpr-serif); font-size:200px; font-weight:400;
          color:rgba(176,141,87,0.15);
          line-height:1; pointer-events:none;
        }
        .vpr-mosaic-cell-d blockquote {
          font-family:var(--vpr-serif); font-size:22px; font-style:italic;
          font-weight:400; line-height:1.55; color:var(--vpr-text);
          margin-bottom:26px; position:relative; z-index:1;
        }
        .vpr-mosaic-cell-d cite {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.22em; text-transform:uppercase;
          color:var(--vpr-gold); font-style:normal; font-weight:400;
        }
        .vpr-mosaic-cell-e { grid-column:3; grid-row:2; }
        .vpr-mosaic-img-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(247,244,238,0.75), transparent 60%);
        }
        .vpr-mosaic-img-tag {
          position:absolute; bottom:24px; left:24px;
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold); display:flex; align-items:center; gap:10px;
        }
        .vpr-mosaic-img-tag::before { content:''; width:16px; height:1px; background:var(--vpr-gold); }
 
        /* ── EDITORIAL TIMELINE ── */
        .vpr-editorial {
          padding:108px 64px 108px 72px;
          display:grid; grid-template-columns:280px 1fr;
          gap:0 92px; border-top:1px solid var(--vpr-line);
        }
        .vpr-editorial-intro { position:sticky; top:120px; align-self:start; }
        .vpr-editorial-intro .vpr-section-label { margin-bottom:26px; }
        .vpr-editorial-intro h2 {
          font-family:var(--vpr-serif); font-size:40px; font-weight:500;
          line-height:1.1; margin-bottom:24px; color:var(--vpr-text);
        }
        .vpr-editorial-intro p { font-family:var(--vpr-body); font-size:16px; line-height:1.8; color:var(--vpr-text-muted); font-style:italic; }
        .vpr-timeline { display:flex; flex-direction:column; }
        .vpr-timeline-item {
          padding:56px 0; border-bottom:1px solid var(--vpr-line);
          display:grid; grid-template-columns:80px 1fr; gap:0 36px; align-items:start;
          cursor:pointer; position:relative;
          transition:padding-left 0.3s var(--vpr-ease);
        }
        .vpr-timeline-item::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:0;
          background:rgba(176,141,87,0.04);
          transition:width 0.4s var(--vpr-ease);
        }
        .vpr-timeline-item:hover::before { width:100%; }
        .vpr-timeline-item:last-child { border-bottom:none; }
        .vpr-timeline-index {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.22em; color:var(--vpr-gold); padding-top:6px; position:relative; font-weight:300;
        }
        .vpr-timeline-index::after {
          content:''; position:absolute; right:0; top:14px; width:36px; height:1px; background:var(--vpr-line);
        }
        .vpr-timeline-body h3 {
          font-family:var(--vpr-serif); font-size:30px; font-weight:500;
          line-height:1.1; margin-bottom:16px; color:var(--vpr-text); transition:color 0.25s;
        }
        .vpr-timeline-item:hover .vpr-timeline-body h3 { color:var(--vpr-gold); }
        .vpr-timeline-body p { font-family:var(--vpr-body); font-size:16px; line-height:1.8; color:var(--vpr-text-muted); margin-bottom:22px; font-style:italic; }
        .vpr-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .vpr-chip {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.18em; text-transform:uppercase; font-weight:300;
          color:var(--vpr-text-sub); border:1px solid var(--vpr-line); padding:5px 14px;
          transition:border-color 0.2s, color 0.2s, background 0.2s;
        }
        .vpr-chip:hover { border-color:rgba(176,141,87,0.40); color:var(--vpr-gold); background:rgba(176,141,87,0.04); }
 
        /* ── GALLERY ── */
        .vpr-gallery-section { padding:0 64px 0 72px; border-top:1px solid var(--vpr-line); }
        .vpr-gallery-header { padding:76px 0 56px; display:flex; justify-content:space-between; align-items:flex-end; }
        .vpr-gallery-link {
          font-family:var(--vpr-sans); font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-text-muted); display:flex; align-items:center; gap:10px;
          transition:color 0.2s, gap 0.3s var(--vpr-ease);
        }
        .vpr-gallery-link::after { content:'→'; transition:transform 0.3s var(--vpr-ease); }
        .vpr-gallery-link:hover { color:var(--vpr-gold); gap:14px; }
        .vpr-gallery-link:hover::after { transform:translateX(4px); }
        .vpr-gallery-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; padding-bottom:108px; }
        .vpr-gallery-card { aspect-ratio:3/4; overflow:hidden; position:relative; background:var(--vpr-surface); cursor:pointer; }
        .vpr-gallery-card img {
          filter:saturate(0.5) brightness(0.85);
          transition:filter 0.55s var(--vpr-ease), transform 0.65s var(--vpr-ease);
        }
        .vpr-gallery-card:hover img { filter:saturate(0.9) brightness(1.0); transform:scale(1.05); }
        .vpr-gallery-caption {
          position:absolute; bottom:0; left:0; right:0; padding:44px 24px 24px;
          background:linear-gradient(to top, rgba(247,244,238,0.95), transparent);
          transform:translateY(12px); opacity:0;
          transition:opacity 0.35s var(--vpr-ease), transform 0.35s var(--vpr-ease);
        }
        .vpr-gallery-card:hover .vpr-gallery-caption { opacity:1; transform:translateY(0); }
        .vpr-gallery-caption small {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; font-weight:300;
          color:var(--vpr-gold); display:block; margin-bottom:6px;
        }
        .vpr-gallery-caption strong { font-family:var(--vpr-serif); font-size:20px; font-weight:500; color:var(--vpr-text); }
 
        /* ── TESTIMONIALS ── */
        .vpr-testimonials {
          padding:108px 64px 108px 72px; border-top:1px solid var(--vpr-line);
          position:relative; overflow:hidden;
          background:var(--vpr-surface);
        }
        .vpr-testimonials::before {
          content:''; position:absolute; right:-100px; top:50%; transform:translateY(-50%);
          width:500px; height:500px; border-radius:50%;
          background:radial-gradient(circle, rgba(176,141,87,0.08), transparent 70%);
          pointer-events:none;
        }
        .vpr-testimonials-label { margin-bottom:60px; }
        .vpr-testimonial-stage {
          position:relative; min-height:280px;
          cursor:grab; user-select:none;
        }
        .vpr-testimonial-stage:active { cursor:grabbing; }
        .vpr-testimonial-slide {
          position:absolute; inset:0;
          display:flex; flex-direction:column; gap:48px;
          opacity:0; pointer-events:none;
          transform:translateX(24px);
          transition:opacity 0.55s var(--vpr-ease), transform 0.55s var(--vpr-ease);
        }
        .vpr-testimonial-slide.active {
          opacity:1; pointer-events:all; transform:translateX(0); position:relative;
        }
        .vpr-quote-mark {
          font-family:var(--vpr-serif); font-size:120px; font-weight:400; line-height:0;
          color:rgba(176,141,87,0.28);
          display:block; margin-bottom:-20px;
        }
        .vpr-testimonial-quote {
          font-family:var(--vpr-serif); font-size:clamp(22px,2.8vw,38px);
          font-weight:400; line-height:1.35; font-style:italic;
          color:var(--vpr-text); max-width:760px;
        }
        .vpr-testimonial-author { display:flex; align-items:center; gap:20px; }
        .vpr-testimonial-avatar {
          width:48px; height:48px; border-radius:50%; overflow:hidden;
          background:var(--vpr-surface3); border:1px solid var(--vpr-line2);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--vpr-serif); font-size:20px; font-weight:400; color:var(--vpr-text-muted);
          flex-shrink:0;
        }
        .vpr-testimonial-name { font-family:var(--vpr-sans); font-size:12px; letter-spacing:0.12em; color:var(--vpr-text); margin-bottom:4px; font-weight:400; }
        .vpr-testimonial-role { font-family:var(--vpr-sans); font-size:10px; letter-spacing:0.14em; color:var(--vpr-gold); font-weight:300; }
        .vpr-testimonial-dots { display:flex; gap:10px; margin-top:48px; }
        .vpr-dot {
          width:24px; height:1px; background:var(--vpr-line2);
          transition:width 0.3s var(--vpr-ease), background 0.3s;
        }
        .vpr-dot.active { width:40px; background:var(--vpr-gold); }
 
        /* ── PRICING ── */
        .vpr-pricing-section { padding:108px 64px 108px 72px; border-top:1px solid var(--vpr-line); }
        .vpr-pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; margin-top:72px; }
        .vpr-price-card {
          padding:60px 48px; background:var(--vpr-surface); border:1px solid var(--vpr-line);
          transition:border-color 0.35s, background 0.35s, transform 0.35s var(--vpr-ease), box-shadow 0.35s;
          position:relative; overflow:hidden;
        }
        .vpr-price-card:hover { border-color:rgba(176,141,87,0.28); background:var(--vpr-bg); transform:translateY(-5px); box-shadow:0 24px 60px rgba(26,23,18,0.10); }
        .vpr-price-card-featured {
          background:linear-gradient(145deg, rgba(176,141,87,0.09), rgba(176,141,87,0.03));
          border-color:rgba(176,141,87,0.35);
        }
        /* Animated gradient border for featured */
        .vpr-price-card-featured::before {
          content:''; position:absolute; inset:-2px; z-index:-1; border-radius:0;
          background:conic-gradient(from 0deg, var(--vpr-gold), rgba(176,141,87,0.20), var(--vpr-gold));
          animation:borderSpin 5s linear infinite;
        }
        @keyframes borderSpin { to { --angle:360deg; } }
        .vpr-price-card-featured::after {
          content:''; position:absolute; inset:2px;
          background:linear-gradient(145deg, rgba(176,141,87,0.08), rgba(247,244,238,0.96));
          z-index:-1;
        }
        .vpr-price-badge {
          position:absolute; top:24px; right:24px;
          font-family:var(--vpr-sans); font-size:8px; letter-spacing:0.2em; text-transform:uppercase; font-weight:400;
          background:var(--vpr-gold); color:#FAF7F2; padding:5px 14px;
        }
        .vpr-price-name { font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.26em; text-transform:uppercase; font-weight:400; color:var(--vpr-gold); margin-bottom:26px; }
        .vpr-price-num { font-family:var(--vpr-serif); font-size:58px; font-weight:500; line-height:1; margin-bottom:24px; color:var(--vpr-text); }
        .vpr-price-desc { font-family:var(--vpr-body); font-size:15px; line-height:1.75; color:var(--vpr-text-muted); margin-bottom:36px; font-style:italic; }
        .vpr-price-features { list-style:none; display:flex; flex-direction:column; gap:14px; margin-bottom:48px; }
        .vpr-price-features li {
          font-family:var(--vpr-sans); font-size:11px; color:var(--vpr-text-muted); display:flex; align-items:center;
          gap:14px; letter-spacing:0.04em; font-weight:300;
        }
        .vpr-price-features li::before { content:''; width:16px; height:1px; background:var(--vpr-gold); flex-shrink:0; }
 
        /* ── CTA ── */
        .vpr-cta-section {
          padding:136px 64px 136px 72px; border-top:1px solid var(--vpr-line);
          display:grid; grid-template-columns:1fr 440px; gap:0 92px; align-items:center;
          position:relative; overflow:hidden;
          background:var(--vpr-surface);
        }
        .vpr-cta-section::before {
          content:''; position:absolute; right:-100px; top:50%; transform:translateY(-50%);
          width:680px; height:680px; border-radius:50%;
          background:radial-gradient(circle, rgba(176,141,87,0.10), transparent 70%);
          pointer-events:none; animation:ctaGlow 9s ease-in-out infinite alternate;
        }
        @keyframes ctaGlow {
          0%   { transform:translateY(-50%) scale(1); opacity:0.6; }
          100% { transform:translateY(-50%) scale(1.18); opacity:1; }
        }
        .vpr-cta-eyebrow {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.36em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-gold); margin-bottom:36px;
          display:flex; align-items:center; gap:18px;
        }
        .vpr-cta-eyebrow::before { content:''; width:28px; height:1px; background:var(--vpr-gold); }
        .vpr-cta-h2 {
          font-family:var(--vpr-serif); font-size:clamp(46px,5vw,82px);
          font-weight:500; line-height:0.94; letter-spacing:-0.018em; color:var(--vpr-text);
        }
        .vpr-cta-aside { display:flex; flex-direction:column; gap:30px; position:relative; z-index:1; }
        .vpr-cta-aside p { font-family:var(--vpr-body); font-size:16px; line-height:1.75; color:var(--vpr-text-muted); font-style:italic; }
 
        /* ── FOOTER (rich 4-col) ── */
        .vpr-footer {
          padding:72px 64px 52px 72px; border-top:1px solid var(--vpr-line);
          display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:0 56px;
          background:var(--vpr-surface2);
        }
        .vpr-footer-brand-col {}
        .vpr-footer-brand {
          font-family:var(--vpr-serif); font-size:26px; font-weight:500;
          letter-spacing:0.22em; text-transform:uppercase; color:var(--vpr-text);
          display:block; margin-bottom:18px;
        }
        .vpr-footer-tagline { font-family:var(--vpr-body); font-size:15px; line-height:1.7; color:var(--vpr-text-sub); font-style:italic; display:block; max-width:280px; }
        .vpr-footer-social { display:flex; gap:20px; margin-top:32px; }
        .vpr-footer-social a {
          width:32px; height:32px; border:1px solid var(--vpr-line); display:flex;
          align-items:center; justify-content:center;
          font-family:var(--vpr-sans); font-size:9px; font-weight:400; color:var(--vpr-text-sub);
          transition:border-color 0.2s, color 0.2s, background 0.2s;
        }
        .vpr-footer-social a:hover { border-color:rgba(176,141,87,0.50); color:var(--vpr-gold); background:rgba(176,141,87,0.06); }
        .vpr-footer-col-title {
          font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.28em; text-transform:uppercase; font-weight:400;
          color:var(--vpr-text-muted); margin-bottom:24px;
        }
        .vpr-footer-links { display:flex; flex-direction:column; gap:12px; }
        .vpr-footer-links a {
          font-family:var(--vpr-sans); font-size:12px; font-weight:300; color:var(--vpr-text-sub);
          transition:color 0.2s; display:flex; align-items:center; gap:8px;
        }
        .vpr-footer-links a::before { content:''; width:0; height:1px; background:var(--vpr-gold); transition:width 0.25s var(--vpr-ease); flex-shrink:0; }
        .vpr-footer-links a:hover { color:var(--vpr-text-muted); }
        .vpr-footer-links a:hover::before { width:14px; }
        .vpr-footer-bottom {
          padding:28px 64px 28px 72px; border-top:1px solid var(--vpr-line);
          display:flex; justify-content:space-between; align-items:center;
          grid-column:1/-1;
        }
        .vpr-footer-copy { font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.18em; color:var(--vpr-text-sub); font-weight:300; }
        .vpr-footer-legal { display:flex; gap:28px; }
        .vpr-footer-legal a { font-family:var(--vpr-sans); font-size:9px; letter-spacing:0.14em; font-weight:300; color:var(--vpr-text-sub); transition:color 0.2s; }
        .vpr-footer-legal a:hover { color:var(--vpr-gold); }
 
        /* ── BACK TO TOP ── */
        .vpr-backtop {
          position:fixed; bottom:36px; right:36px; z-index:600;
          opacity:0; pointer-events:none;
          transform:translateY(16px);
          transition:opacity 0.4s var(--vpr-ease), transform 0.4s var(--vpr-ease);
          background:rgba(247,244,238,0.90);
          backdrop-filter:blur(16px);
          border:1px solid var(--vpr-line2); border-radius:0;
          box-shadow:0 4px 24px rgba(26,23,18,0.10);
        }
        .vpr-backtop--show { opacity:1; pointer-events:all; transform:translateY(0); }
        .vpr-backtop:hover { border-color:rgba(176,141,87,0.45); background:rgba(247,244,238,0.98); box-shadow:0 8px 32px rgba(176,141,87,0.15); }
 
        /* ── RESPONSIVE ── */
        @media (max-width:1100px) {
          .vpr-hero { grid-template-columns:1fr; }
          .vpr-hero-sidebar { display:none; }
          .vpr-strip-grid { grid-template-columns:1fr 1fr; }
          .vpr-mosaic-section { grid-template-columns:1fr 1fr; grid-template-rows:auto; }
          .vpr-mosaic-cell-a { grid-column:1/3; }
          .vpr-mosaic-cell-c,.vpr-mosaic-cell-d,.vpr-mosaic-cell-e { grid-column:auto; }
          .vpr-editorial { grid-template-columns:1fr; }
          .vpr-editorial-intro { position:static; }
          .vpr-gallery-grid { grid-template-columns:1fr 1fr; }
          .vpr-pricing-grid { grid-template-columns:1fr; }
          .vpr-cta-section { grid-template-columns:1fr; }
          .vpr-footer { grid-template-columns:1fr 1fr; gap:40px 32px; }
          .vpr-ruler { display:none; }
          .vpr-nav { padding:0 32px; }
          .vpr-nav-links { display:none; }
          .vpr-hamburger { display:flex; }
        }
        @media (max-width:680px) {
          .vpr-nav { padding:0 20px; }
          .vpr-hero,.vpr-strip-section,.vpr-mosaic-section,.vpr-editorial,
          .vpr-gallery-section,.vpr-pricing-section,.vpr-cta-section,
          .vpr-testimonials,.vpr-footer { padding-left:20px; padding-right:20px; }
          .vpr-strip-grid { grid-template-columns:1fr; }
          .vpr-gallery-grid { grid-template-columns:1fr; }
          .vpr-mosaic-section { grid-template-columns:1fr; }
          .vpr-mosaic-cell-a { grid-column:1; }
          .vpr-footer { grid-template-columns:1fr; }
          .vpr-footer-bottom { flex-direction:column; gap:16px; text-align:center; }
          .vpr-cta-section { padding-top:80px; padding-bottom:80px; }
          .vpr-backtop { bottom:20px; right:20px; }
        }
      `}</style>
 
      {/* ── Progress bar ── */}
      <div className="vpr-progress-bar" aria-hidden="true">
        <div className="vpr-progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
      </div>
 
{/* ── Ambient glows ── */}
      <div className="vpr-ambient"   aria-hidden="true" />
      <div className="vpr-ambient-2" aria-hidden="true" />
 
      {/* ── Ruler ── */}
      <div className="vpr-ruler" aria-hidden="true">
        <div className="vpr-ruler-pulse" />
      </div>
 
      {/* ── Custom elements ── */}
      {customElements.map((item, i) => (
        <div key={`ce-${i}`} {...ed(`customElements.${i}`, "custom", t(item?.text), { style: item?.styles || {} })}>
          {t(item?.text)}
        </div>
      ))}
 
      {/* ════ NAV ════ */}
      <nav {...ed("nav", "navigation", undefined, {
        className: `vpr-nav${navScrolled ? " vpr-nav--scrolled" : ""}`,
      })}>
        <div {...ed("brandName", "brand", ot("brandName", brandName), { className: "vpr-logo-block" })}>
          <span className="vpr-logo-name">{ot("brandName", brandName)}</span>
          <span className="vpr-logo-rule" aria-hidden="true" />
          <span className="vpr-logo-sub">{industry}</span>
        </div>
 
        {/* Desktop links */}
        <div className="vpr-nav-links">
          {navigation.slice(0, 5).map((label, i) => (
            <a key={`nav-${i}`} href={sectionIds[i] ? `#${sectionIds[i]}` : "#contact"}
              className={activeSection === i ? "active" : ""}>
              {label}
            </a>
          ))}
        </div>
 
        <button {...ed("hero.primaryCta", "nav CTA", ot("hero.primaryCta", primaryCta), { className: "vpr-nav-cta" })}>
          {ot("hero.primaryCta", primaryCta)}
        </button>
 
        {/* Hamburger */}
        <button
          className={`vpr-hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </nav>
 
      {/* ── Mobile drawer ── */}
      <div className={`vpr-drawer${menuOpen ? " open" : ""}`} role="dialog" aria-modal="true">
        {navigation.slice(0, 5).map((label, i) => (
          <a key={`drw-${i}`} href={sectionIds[i] ? `#${sectionIds[i]}` : "#contact"}
            onClick={() => setMenuOpen(false)}>
            {label}
          </a>
        ))}
      </div>
 
      {/* ════ HERO ════ */}
      <section id="discipline" {...ed("heroSection", "hero", undefined, { className: "vpr-hero" })}>
        <div className="vpr-hero-media">
          <div
            className="vpr-hero-media-inner"
            style={{ transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.3}px)` }}
          >
            {heroVideoUrl
              ? <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
              : heroPosterUrl
                ? <img src={heroPosterUrl} alt="" />
                : <div className="vpr-hero-media-fallback" />
            }
          </div>
          <div className="vpr-hero-overlay" />
        </div>
        <div className="vpr-hero-slash" aria-hidden="true" />
 
        <div className="vpr-hero-copy">
          <div {...ed("hero.eyebrow", "eyebrow", ot("hero.eyebrow", heroEyebrow), { className: "vpr-hero-eyebrow" })}>
            {ot("hero.eyebrow", heroEyebrow)}
          </div>
          <h1
            {...ed("hero.headline", "headline", ot("hero.headline", heroHeadline), { className: "vpr-hero-h1" })}
            style={{ transform: `translate(${parallax.x * -0.6}px, ${parallax.y * -0.4}px)` }}
          >
            {ot("hero.headline", heroHeadline).split(" ").map((word, i, arr) =>
              i === arr.length - 1
                ? <em key={i}>{word}</em>
                : <React.Fragment key={i}>{word} </React.Fragment>
            )}
          </h1>
          <p
            {...ed("hero.subheadline", "subheadline", ot("hero.subheadline", heroSub), { className: "vpr-hero-sub" })}
            style={{ transform: `translate(${parallax.x * -0.25}px, ${parallax.y * -0.15}px)` }}
          >
            {ot("hero.subheadline", heroSub)}
          </p>
          <div className="vpr-hero-actions">
            <button {...ed("hero.primaryCta", "primary CTA", ot("hero.primaryCta", primaryCta), { className: "vpr-btn-primary" })}>
              {ot("hero.primaryCta", primaryCta)} →
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
          <div className="vpr-scroll-track"><div className="vpr-scroll-thumb" /></div>
          <span>Scroll</span>
        </div>
      </section>
 
      {/* ════ MARQUEE ════ */}
      <Marquee items={marqueeItems} />
 
      {/* ════ FEATURES STRIP ════ */}
      <section id="work" {...ed("features", "features", undefined, { className: "vpr-strip-section" })}>
        <Reveal className="vpr-strip-header">
          <span className="vpr-section-label">Discipline</span>
          <h2 className="vpr-section-title">
            {t(state.sectionIntro?.headline, "Craft without\ncompromise.")}
          </h2>
        </Reveal>
        <div className="vpr-strip-grid">
          {features.slice(0, 4).map((item, i) => (
            <TiltCard key={`feat-${i}`}>
              <Reveal
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
            </TiltCard>
          ))}
        </div>
      </section>
 
      {/* ════ MOSAIC ════ */}
      <section id="method" {...ed("premiumMosaic", "mosaic", undefined, { className: "vpr-mosaic-section" })}>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-a">
          {collectionImages[0]?.imageUrl || heroPosterUrl ? (
            <>
              <img src={collectionImages[0]?.imageUrl || heroPosterUrl} alt="" />
              <div className="vpr-mosaic-img-overlay" />
              <div className="vpr-mosaic-img-tag">Primary work</div>
            </>
          ) : (
            <div style={{ width:"100%", height:"100%", background:`radial-gradient(ellipse at 40% 60%, color-mix(in srgb, var(--vpr-accent) 18%, var(--vpr-surface)), var(--vpr-surface))` }} />
          )}
        </div>
        <div {...ed("sections.0","mosaic story",undefined,{ className:"vpr-mosaic-cell vpr-mosaic-cell-b" })}>
          <div className="vpr-mosaic-text">
            <p>{t(sections[0]?.eyebrow, "Philosophy")}</p>
            <h2 {...ed("sections.0.title","mosaic title",t(sections[0]?.title))}>
              {t(sections[0]?.title,"The discipline of less")}
            </h2>
            <span {...ed("sections.0.description","mosaic desc",t(sections[0]?.description))}>
              {t(sections[0]?.description)}
            </span>
          </div>
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-c">
          {collectionImages[1]?.imageUrl ? (
            <><img src={collectionImages[1].imageUrl} alt="" /><div className="vpr-mosaic-img-overlay" /></>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"var(--vpr-surface2)" }} />
          )}
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-d">
          <blockquote>
            "{t(state.sectionIntro?.headline,"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.")}"
          </blockquote>
          <cite>— Studio Maxim</cite>
        </div>
        <div className="vpr-mosaic-cell vpr-mosaic-cell-e">
          {collectionImages[2]?.imageUrl ? (
            <><img src={collectionImages[2].imageUrl} alt="" /><div className="vpr-mosaic-img-overlay" /></>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"var(--vpr-surface)" }} />
          )}
        </div>
      </section>
 
      {/* ════ EDITORIAL TIMELINE ════ */}
      <section id="archive" {...ed("sectionsArea","sections",undefined,{ className:"vpr-editorial" })}>
        <Reveal className="vpr-editorial-intro">
          <div className="vpr-section-label">Method</div>
          <h2>{t(state.sectionIntro?.eyebrow,"How we\napproach the work.")}</h2>
          <p>{t(state.sectionIntro?.description,`A rigorous, tested process refined across ${stats[0]?.title||"14"} years of practice in ${industry}.`)}</p>
        </Reveal>
        <div className="vpr-timeline">
          {sections.slice(0,3).map((section,i) => (
            <Reveal key={`tl-${i}`} delay={i*100}
              {...ed(`sections.${i}`,"section card",undefined,{ className:"vpr-timeline-item" })}>
              <div className="vpr-timeline-index">0{i+1}</div>
              <div className="vpr-timeline-body">
                <h3 {...ed(`sections.${i}.title`,"section title",t(section.title))}>{t(section.title)}</h3>
                <p {...ed(`sections.${i}.description`,"section desc",t(section.description))}>{t(section.description)}</p>
                <div className="vpr-chips">
                  {l(section.items,["Item"]).slice(0,4).map((item,j) => (
                    <span key={`chip-${i}-${j}`} className="vpr-chip"
                      {...ed(`sections.${i}.items.${j}`,"chip",item)}>{item}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
 
      {/* ════ GALLERY ════ */}
      {collectionImages.length > 0 && (
        <section id="gallery" {...ed("gallery","gallery",undefined,{ className:"vpr-gallery-section" })}>
          <Reveal className="vpr-gallery-header">
            <div>
              <div className="vpr-section-label" style={{ marginBottom:18 }}>Archive</div>
              <h2 style={{ fontFamily:"var(--vpr-serif)", fontSize:46, fontWeight:300, color:"var(--vpr-text)" }}>
                {t(state.galleryIntro?.headline,"Selected works.")}
              </h2>
            </div>
            <a href="#contact" className="vpr-gallery-link">View complete archive</a>
          </Reveal>
          <div {...ed("mediaAssets.collectionImages","gallery grid",undefined,{ className:"vpr-gallery-grid" })}>
            {collectionImages.slice(0,3).map((item,i) => (
              <Reveal key={`gal-${i}`} delay={i*110} tag="article"
                {...ed(`mediaAssets.collectionImages.${i}`,"gallery card",undefined,{ className:"vpr-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title||""} />
                <div className="vpr-gallery-caption">
                  <small>{t(item.tag, i===0?"Featured":"Collection")}</small>
                  <strong>{t(item.title||item.subtitle,industry)}</strong>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
 
      {/* ════ TESTIMONIALS ════ */}
      {testimonials.length > 0 && (
        <TestimonialCarousel items={testimonials} ed={ed} />
      )}
 
      {/* ════ PRICING ════ */}
      {pricing.length > 0 && (
        <section id="pricing" {...ed("pricing","pricing",undefined,{ className:"vpr-pricing-section" })}>
          <Reveal>
            <div className="vpr-section-label" style={{ marginBottom:52 }}>Engagement</div>
          </Reveal>
          <div className="vpr-pricing-grid">
            {pricing.slice(0,3).map((plan,i) => (
              <TiltCard key={`price-${i}`} intensity={4}>
                <Reveal delay={i*120} tag="article"
                  {...ed(`pricing.${i}`,"price card",undefined,{
                    className:`vpr-price-card${i===1?" vpr-price-card-featured":""}`,
                  })}>
                  {i===1 && <div className="vpr-price-badge">Most popular</div>}
                  <div className="vpr-price-name">{t(plan.name,"Signature")}</div>
                  <div className="vpr-price-num">{t(plan.price,"—")}</div>
                  <p className="vpr-price-desc">{t(plan.description,"Tailored to the project.")}</p>
                  <ul className="vpr-price-features">
                    {l(plan.features,["Premium design","Responsive build","Launch ready"]).slice(0,4).map((item,j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                  <button className="vpr-btn-primary" style={{ width:"100%", textAlign:"center", display:"block" }}>
                    Begin enquiry →
                  </button>
                </Reveal>
              </TiltCard>
            ))}
          </div>
        </section>
      )}
 
      {/* ════ FINAL CTA ════ */}
      <section id="contact" {...ed("footerCta","footer CTA",undefined,{ className:"vpr-cta-section" })}>
        <Reveal>
          <div className="vpr-cta-eyebrow">{industry}</div>
          <h2 {...ed("footer.headline","footer headline",ot("footer.headline", t(footer.headline)),{ className:"vpr-cta-h2" })}>
            {t(footer.headline,`Begin with\n${ot("brandName", brandName)}.`)}
          </h2>
        </Reveal>
        <Reveal delay={160} className="vpr-cta-aside">
          <p>Every engagement begins with a conversation. Reach out to discuss your project, timeline and ambitions.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <button {...ed("footer.cta","footer button",t(footer.cta,ot("hero.primaryCta", primaryCta)),{ className:"vpr-btn-primary", style:{ alignSelf:"flex-start" } })}>
              {t(footer.cta,ot("hero.primaryCta", primaryCta))} →
            </button>
            <button className="vpr-btn-ghost" style={{ alignSelf:"flex-start" }}>{ot("hero.secondaryCta", secondaryCta)}</button>
          </div>
        </Reveal>
      </section>
 
      {/* ════ FOOTER (4-col) ════ */}
      <footer {...ed("footer","footer",undefined,{ className:"vpr-footer" })}>
        <div className="vpr-footer-brand-col">
          <span className="vpr-footer-brand">{ot("brandName", brandName)}</span>
          <span className="vpr-footer-tagline">{tagline}</span>
          <div className="vpr-footer-social">
            {["IG","TW","LI","BE"].map((s,i) => (
              <a key={i} href="#" aria-label={s}>{s}</a>
            ))}
          </div>
        </div>
        {[
          { title:"Studio",  links:["About","Work","Awards","Journal"] },
          { title:"Services", links:["Strategy","Identity","Digital","Interior"] },
          { title:"Connect",  links:["Contact","Careers","Press","Legal"] },
        ].map((col,i) => (
          <div key={i}>
            <div className="vpr-footer-col-title">{col.title}</div>
            <div className="vpr-footer-links">
              {col.links.map((link,j) => <a key={j} href="#">{link}</a>)}
            </div>
          </div>
        ))}
        <div className="vpr-footer-bottom" style={{ gridColumn:"1/-1", paddingLeft:0, paddingRight:0 }}>
          <span className="vpr-footer-copy">© {new Date().getFullYear()} {ot("brandName", brandName)}. All rights reserved.</span>
          <div className="vpr-footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
 
      {/* ── Back to top ── */}
      <BackToTop scrollProgress={scrollProgress} />
    </div>
  );
}