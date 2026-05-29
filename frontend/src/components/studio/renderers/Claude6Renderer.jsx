import React, { useRef, useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   VAULT ULTRA-PREMIUM ATELIER RENDERER v6.0 — THE APEX
   Aesthetic: Silent Luxury / Museum Editorial / Kinetic Depth
   ───────────────────────────────────────────────────────────── */

function t(value, fallback = "") {
  return String(value || "").trim() || fallback;
}

function l(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

/* ── Луксозен Паралакс Hook за Плавно Движение на Кадрите ── */
function useParallaxScroll() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return scrollY;
}

/* ── Премиум Брояч с Омекотено Забавяне (Quintic Easing) ── */
function useUltraCounter(target, duration = 2200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ""));
    if (isNaN(num)) {
      setCount(target);
      return;
    }

    const startTime = Date.now();
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5); // Още по-плавно спиране в края

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setCount(Math.floor(num * easeOutQuint(progress)));

      if (progress < 1) requestAnimationFrame(animate);
      else setCount(num);
    };

    animate();
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

/* ── Скрол Наблюдател (Reveal) ── */
function usePremiumReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* ── Статистика от Висш Клас ── */
function StatItem({ stat, index }) {
  const [ref, visible] = usePremiumReveal(0.2);
  const { count, start } = useUltraCounter(t(stat.title));

  useEffect(() => {
    if (visible) start();
  }, [visible, start]);

  const suffix = String(stat.title).replace(/[0-9]/g, "");

  return (
    <div ref={ref} className={`vlux-stat-node ${visible ? "is-visible" : ""}`} style={{ transitionDelay: `${index * 120}ms` }}>
      <div className="vlux-stat-value">
        {visible ? count : 0}
        <span className="vlux-stat-mark">{suffix || "+"}</span>
      </div>
      <div className="vlux-stat-caption">{t(stat.label)}</div>
    </div>
  );
}

/* ── Паралакс Кадър в Галерията ── */
function ParallaxGalleryItem({ item, index, globalScroll }) {
  const [ref, visible] = usePremiumReveal(0.1);
  const itemRef = useRef(null);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    if (itemRef.current) {
      setOffsetTop(itemRef.current.offsetTop);
    }
  }, [visible]);

  // Изчисляване на деликатното паралакс отместване
  const yOffset = visible ? (globalScroll - offsetTop) * 0.06 : 0;

  return (
    <div ref={itemRef}>
      <div ref={ref} className={`vlux-editorial-card ${visible ? "is-visible" : ""}`} style={{ transitionDelay: `${(index % 2) * 100}ms` }}>
        <div className="vlux-editorial-image-frame">
          <img 
            src={item.image} 
            alt={item.title} 
            style={{ transform: `scale(1.1) translateY(${yOffset}px)` }} 
            loading="lazy" 
          />
          <div className="vlux-editorial-curtain" />
        </div>
        <div className="vlux-editorial-footer">
          <div className="vlux-editorial-index">/ 0{index + 1}</div>
          <div className="vlux-editorial-details">
            <h3>{item.title}</h3>
            <p>{item.location}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VaultPremiumRenderer({ website, editing = false, selectedId = null, onSelect }) {
  const state = website || {};
  const brandName = t(state.brandName, "VAULT");
  const tagline = t(state.tagline, "The architecture of absolute silence.");
  const primaryColor = t(state.primaryColor, "#C5A880"); // Премиум шампанско/платина злато

  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  
  const scrollY = useParallaxScroll();
  const [navActive, setNavActive] = useState(false);

  useEffect(() => {
    setNavActive(scrollY > 60);
  }, [scrollY]);

  const demoImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=90", 
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90", 
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=90", 
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=90", 
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=90", 
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1800&q=90", 
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=90", 
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=90",
  ];

  const stats = l(state.stats, [
    { title: "16", label: "Years of Rigor" },
    { title: "94", label: "Monoliths Built" },
    { title: "100%", label: "Discretion Rate" },
    { title: "12", label: "Sovereign States" },
  ]);

  const projects = [
    { title: "The Obsidian Atrium", location: "Reykjavík, IS", image: demoImages[1] },
    { title: "Sovereign House", location: "St. Moritz, CH", image: demoImages[2] },
    { title: "Pavilion of Quietude", location: "Kyoto, JP", image: demoImages[3] },
    { title: "The Brutalist Monolith", location: "Berlin, DE", image: demoImages[4] },
    { title: "Dune Meridian", location: "Abu Dhabi, UAE", image: demoImages[6] },
    { title: "Aether Villa", location: "Peloponnese, GR", image: demoImages[7] },
  ];

  const [revealManifesto, manifestoVisible] = usePremiumReveal(0.15);
  const [revealOutro, outroVisible] = usePremiumReveal(0.15);

  const ed = (id, tag, value, extra = {}) => ({
    "data-gpr-id": id,
    className: [extra.className, editing ? "vlux-editable" : "", selectedId === id ? "vlux-selected" : ""].filter(Boolean).join(" "),
    onClick: editing ? (e) => { e.stopPropagation(); onSelect?.({ id, tag, text: value }); } : undefined,
  });

  return (
    <div className="vlux-master-container" style={{ "--vlux-accent": primaryColor }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400&family=Playfair+Display:ital,wght@0,400;1,400;1,500&display=swap');

        .vlux-master-container {
          --vlux-dark: #050506;
          --vlux-pure-white: #FFFFFF;
          --vlux-muted-silver: #6E6E73;
          --vlux-fine-line: rgba(255, 255, 255, 0.025);
          
          --vlux-sans: 'Inter', system-ui, sans-serif;
          --vlux-serif: 'Playfair Display', serif;
          
          background-color: var(--vlux-dark);
          color: var(--vlux-pure-white);
          font-family: var(--vlux-sans);
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* Симетрична Архитектурна Навигация */
        .vlux-bar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6vw;
          z-index: 1000;
          transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
        }
        
        .vlux-bar.is-active {
          height: 84px;
          background: rgba(5, 5, 6, 0.85);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-bottom: 1px solid var(--vlux-fine-line);
        }

        .vlux-identity {
          font-family: var(--vlux-sans);
          font-weight: 200;
          font-size: 18px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--vlux-pure-white);
          text-decoration: none;
        }

        .vlux-links-group { display: flex; gap: 56px; }
        .vlux-anchor {
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vlux-muted-silver);
          text-decoration: none;
          transition: color 0.4s ease;
        }
        .vlux-anchor:hover { color: var(--vlux-pure-white); }

        .vlux-nav-dot {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--vlux-accent);
          cursor: pointer;
        }
        .vlux-nav-dot::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--vlux-accent);
          border-radius: 50%;
        }

        /* Секция 1: Огромен Кинематографичен Корпус (Hero) */
        .vlux-stage-hero {
          position: relative;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 6vw 5vh;
          overflow: hidden;
        }

        .vlux-stage-wallpaper {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to bottom, rgba(5,5,6,0.1) 0%, rgba(5,5,6,0.95) 100%);
        }
        
        .vlux-stage-wallpaper img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
          filter: brightness(0.3) contrast(1.02);
          transform: scale(1.02);
        }

        .vlux-stage-body { position: relative; z-index: 2; max-width: 1200px; margin-bottom: 5vh; }
        .vlux-label-mini {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--vlux-accent);
          margin-bottom: 28px;
          display: block;
        }

        .vlux-monument-title {
          font-family: var(--vlux-serif);
          font-size: clamp(60px, 8vw, 120px);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.03em;
          margin: 0 0 32px 0;
        }
        
        .vlux-monument-title span {
          font-style: italic;
          font-family: var(--vlux-serif);
          font-weight: 400;
        }

        .vlux-monument-sub {
          font-size: 15px;
          font-weight: 200;
          line-height: 1.9;
          color: var(--vlux-muted-silver);
          max-width: 480px;
        }

        .vlux-grid-stats {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--vlux-fine-line);
          padding-top: 36px;
        }

        .vlux-stat-node {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.15, 1, 0.3, 1);
        }
        .vlux-stat-node.is-visible { opacity: 1; transform: translateY(0); }
        .vlux-stat-value { font-family: var(--vlux-sans); font-weight: 100; font-size: 48px; line-height: 1; margin-bottom: 8px; }
        .vlux-stat-mark { color: var(--vlux-accent); font-weight: 200; margin-left: 2px; }
        .vlux-stat-caption { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--vlux-muted-silver); font-weight: 300; }

        /* Секция 2: Музеен Манифест (Editorial Space) */
        .vlux-manifesto-hall {
          padding: 280px 6vw;
          display: grid;
          grid-template-columns: 0.4fr 1fr;
          gap: 80px;
          max-width: 1600px;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1.4s cubic-bezier(0.15, 1, 0.3, 1);
        }
        .vlux-manifesto-hall.is-visible { opacity: 1; transform: translateY(0); }
        
        .vlux-manifesto-title {
          font-family: var(--vlux-sans);
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--vlux-accent);
          margin-top: 12px;
        }
        
        .vlux-manifesto-body {
          font-family: var(--vlux-serif);
          font-size: clamp(36px, 5vw, 64px);
          line-height: 1.22;
          font-weight: 400;
          color: #E5E5EA;
        }
        .vlux-manifesto-body em {
          font-style: italic;
          color: var(--vlux-muted-silver);
        }

        /* Секция 3: Огромна Асиметрична Изложба (Infinite Scale Portfolio) */
        .vlux-exhibition-hall { padding: 0 6vw 240px; }
        .vlux-exhibition-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 220px 100px; /* Огромен въздух между редовете за усещане за лукс */
        }

        /* Премиум шахматно отместване */
        .vlux-exhibition-grid > div:nth-child(even) { transform: translateY(140px); }

        .vlux-editorial-card {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1.4s cubic-bezier(0.15, 1, 0.3, 1);
        }
        .vlux-editorial-card.is-visible { opacity: 1; transform: translateY(0); }

        .vlux-editorial-image-frame {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background-color: #0B0B0C;
        }
        
        .vlux-editorial-image-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s linear; /* Контролира се динамично от паралакса */
          will-change: transform;
        }
        
        .vlux-editorial-curtain {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 70%, rgba(5,5,6,0.5) 100%);
          pointer-events: none;
        }

        .vlux-editorial-footer {
          margin-top: 32px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .vlux-editorial-index {
          font-family: var(--vlux-sans);
          font-weight: 300;
          font-size: 11px;
          color: var(--vlux-accent);
          margin-top: 4px;
        }
        .vlux-editorial-details h3 { font-family: var(--vlux-serif); font-size: 32px; font-weight: 400; margin: 0 0 8px 0; letter-spacing: -0.01em; }
        .vlux-editorial-details p { font-size: 11px; color: var(--vlux-muted-silver); font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; }

        /* Секция 4: Full-Bleed Панорамен Монолит (Immersive Break) */
        .vlux-monolith-break {
          height: 90vh;
          position: relative;
          margin: 140px 0 240px 0;
          overflow: hidden;
        }
        .vlux-monolith-break img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.35);
          will-change: transform;
        }
        .vlux-monolith-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0 6vw;
        }
        .vlux-monolith-quote {
          font-family: var(--vlux-serif);
          font-style: italic;
          font-size: clamp(40px, 5.5vw, 76px);
          font-weight: 400;
          max-width: 1100px;
          line-height: 1.2;
          color: #F1F1F4;
        }

        /* Секция 5: Последен Изискан Стейтмънт (The Outro) */
        .vlux-outro-hall {
          padding: 100px 6vw 280px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1.4s cubic-bezier(0.15, 1, 0.3, 1);
        }
        .vlux-outro-hall.is-visible { opacity: 1; transform: translateY(0); }
        
        .vlux-outro-badge { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--vlux-accent); margin-bottom: 40px; }
        .vlux-outro-text { font-family: var(--vlux-serif); font-size: clamp(32px, 4vw, 52px); font-weight: 400; line-height: 1.4; max-width: 900px; margin-bottom: 50px; }
        .vlux-contact-trigger {
          font-family: var(--vlux-sans);
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--vlux-pure-white);
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--vlux-accent);
          padding-bottom: 8px;
          cursor: pointer;
          transition: opacity 0.3s;
        }
        .vlux-contact-trigger:hover { opacity: 0.7; }

        /* Върхов Луксозен Footer */
        .vlux-ultimate-footer {
          background-color: #09090A;
          border-top: 1px solid var(--vlux-fine-line);
          padding: 120px 6vw 60px;
        }
        .vlux-footer-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 100px;
        }
        .vlux-footer-signature { font-family: var(--vlux-sans); font-weight: 100; font-size: 36px; letter-spacing: 0.25em; }
        .vlux-footer-nodes { display: flex; gap: 140px; }
        .vlux-footer-col-header { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 28px; color: var(--vlux-accent); }
        .vlux-footer-col-node { display: block; font-size: 13px; font-weight: 200; color: var(--vlux-muted-silver); text-decoration: none; margin-bottom: 14px; transition: color 0.3s; }
        .vlux-footer-col-node:hover { color: var(--vlux-pure-white); }
        
        .vlux-footer-closing {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.01);
          padding-top: 40px;
          font-size: 11px;
          font-weight: 200;
          color: var(--vlux-muted-silver);
          letter-spacing: 0.05em;
        }

        /* CMS системи инлайн рендеринг */
        .vlux-editable { outline: 1px dashed rgba(255,255,255,0.08); outline-offset: 6px; cursor: pointer; }
        .vlux-editable:hover { outline: 1px solid var(--vlux-accent); }
        .vlux-selected { outline: 1px solid var(--vlux-accent) !important; background: rgba(197, 168, 128, 0.02); }

        @media (max-width: 1024px) {
          .vlux-exhibition-grid { grid-template-columns: 1fr; gap: 120px; }
          .vlux-exhibition-grid > div:nth-child(even) { transform: translateY(0); }
          .vlux-manifesto-hall { grid-template-columns: 1fr; gap: 30px; padding: 140px 6vw; }
          .vlux-footer-main { flex-direction: column; gap: 60px; }
          .vlux-links-group { display: none; }
        }
      `}</style>

      {/* HEADER / NAVIGATION */}
      <header className={`vlux-bar ${navActive ? "is-active" : ""}`}>
        <a href="#" className="vlux-identity">{brandName}</a>
        <nav className="vlux-links-group">
          {["Exhibition", "Manifesto", "Atelier"].map((item, i) => (
            <a key={i} href={`#${item.toLowerCase()}`} className="vlux-anchor">
              {item}
            </a>
          ))}
        </nav>
        <div className="vlux-nav-dot">Commission</div>
      </header>

      {/* SECTION 1: HERO MONUMENT */}
      <section id="hero" className="vlux-stage-hero">
        <div className="vlux-stage-wallpaper">
          <img 
            src={media.heroImageUrl || demoImages[0]} 
            alt="Atelier Architectural Structure" 
            style={{ transform: `scale(1.05) translateY(${scrollY * 0.12}px)` }} // Мек паралакс на главния фон
          />
        </div>

        <div className="vlux-stage-body">
          <span className="vlux-label-mini">ATELIER EST. 2011 • {t(state.industry, "ARCHITECTURAL MONOLITHS")}</span>
          <h1 {...ed("hero.headline", "headline", t(hero.headline, "We build the <span>silent structures</span>\nof tomorrow."))} className="vlux-monument-title">
            {t(hero.headline, "We build the <span>silent structures</span>\nof tomorrow.")}
          </h1>
          <p className="vlux-monument-sub">{t(hero.subheadline, tagline)}</p>
        </div>

        <div className="vlux-grid-stats">
          {stats.map((stat, i) => (
            <StatItem key={i} stat={stat} index={i} />
          ))}
        </div>
      </section>

      {/* SECTION 2: EDITORIAL MANIFESTO */}
      <section ref={revealManifesto} id="manifesto" className={`vlux-manifesto-hall ${manifestoVisible ? "is-visible" : ""}`}>
        <div className="vlux-manifesto-title">The Absolute Order</div>
        <h2 className="vlux-manifesto-body">
          True excellence is not achieved when there is nothing left to add, but when there is <em>absolutely nothing left to remove</em>. We sculpt forms that anchor light and endure generations.
        </h2>
      </section>

      {/* SECTION 3: IMMERSIVE ASYMMETRIC PORTFOLIO */}
      <section id="exhibition" className="vlux-exhibition-hall">
        <div className="vlux-exhibition-grid">
          {projects.map((project, index) => (
            <ParallaxGalleryItem 
              key={index} 
              item={project} 
              index={index} 
              globalScroll={scrollY} 
            />
          ))}
        </div>
      </section>

      {/* SECTION 4: FULL-BLEED PANORAMIC MONOLITH BREAK */}
      <section className="vlux-monolith-break">
        <img 
          src={demoImages[5]} 
          alt="Immersive Scale Landscape" 
          style={{ transform: `scale(1.2) translateY(${(scrollY - 3000) * 0.08}px)` }} // Мощен междинен паралакс ефект
          loading="lazy"
        />
        <div className="vlux-monolith-overlay">
          <h2 className="vlux-monolith-quote">"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</h2>
        </div>
      </section>

      {/* SECTION 5: THE OUTRO MANIFESTO */}
      <section ref={revealOutro} id="atelier" className={`vlux-outro-hall ${outroVisible ? "is-visible" : ""}`}>
        <span className="vlux-outro-badge">The Sovereign Studio</span>
        <h2 className="vlux-outro-text">
          We intentionally limit our intake to a select few commissions annually. This ensures uncompromising execution from initial draft to tangible form.
        </h2>
        <button className="vlux-contact-trigger">Initiate Private Dialogue</button>
      </section>

      {/* ULTIMATE FOOTER */}
      <footer className="vlux-ultimate-footer">
        <div className="vlux-footer-main">
          <div className="vlux-footer-signature">{brandName}</div>
          <div className="vlux-footer-nodes">
            <div>
              <div className="vlux-footer-col-header">Chambers</div>
              <a href="#" className="vlux-footer-col-node">Zürich</a>
              <a href="#" className="vlux-footer-col-node">Kyoto</a>
              <a href="#" className="vlux-footer-col-node">New York</a>
            </div>
            <div>
              <div className="vlux-footer-col-header">Archives</div>
              <a href="#" className="vlux-footer-col-node">Monographs</a>
              <a href="#" className="vlux-footer-col-node">Essays</a>
              <a href="#" className="vlux-footer-col-node">Dialogue</a>
            </div>
          </div>
        </div>
        
        <div className="vlux-footer-closing">
          <div>{brandName} Atelier © {new Date().getFullYear()} — Built For Absolute Legacy.</div>
          <div style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "9px" }}>Confidentiality Guaranteed.</div>
        </div>
      </footer>
    </div>
  );
}