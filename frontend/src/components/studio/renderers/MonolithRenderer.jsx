import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function MonolithRenderer({
  website,
  editing = false,
  selectedId = null,
  onSelect,
}) {
  const state = website || {};
  const overrides = state.overrides || {};
  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  const footer = state.footer || {};

  const brandName = text(state.brandName, "Monolith");
  const industry = text(state.industry, "premium professional brand");
  const tagline = text(state.tagline, "A precise, minimal and high-trust digital presence built for serious brands.");
  const primary = text(state.primaryColor, "#111111");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const stats = list(state.stats, [
    { title: "01", label: "Clear positioning" },
    { title: "98%", label: "Trust-focused flow" },
    { title: "24h", label: "Premium first impression" },
  ]);

  const features = list(state.features, [
    { title: "Quiet authority", description: "A restrained premium renderer with strong hierarchy, fine lines and confident spacing." },
    { title: "Editorial system", description: "Built with magazine-like composition, elegant image rhythm and professional information flow." },
    { title: "Conversion without noise", description: "Focused calls to action, credible proof sections and minimal friction for visitors." },
  ]);

  const sections = list(state.sections, [
    { title: "Positioned with intent", description: `A refined professional layout for ${industry}, designed around clarity, confidence and premium trust.` },
    { title: "Every section has a job", description: "No decorative clutter. Each block exists to explain, prove, guide or convert." },
    { title: "Built as a brand object", description: "Large typography, elegant restraint and a visual system that feels expensive without shouting." },
  ]);

  const testimonials = list(state.testimonials, [
    { quote: "The site finally feels as premium as the work behind the brand.", name: "Client Partner", role: "Founder" },
    { quote: "Minimal, sharp and trustworthy. Exactly the direction we needed.", name: "Strategy Lead", role: "Director" },
  ]);

  const pricing = list(state.pricing, []);

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
      "data-gpr-id": id,
      className: `${extra.className || ""}${editing ? " mr-editable" : ""}${selectedId === id ? " mr-selected" : ""} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag,
              text: overrideText(id, value),
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
    };
  }

  function editableMedia(id, mediaType, mediaUrl, extra = {}) {
    const finalMediaUrl = overrideMediaUrl(id, mediaUrl);
    return {
      "data-gpr-id": id,
      className: `${extra.className || ""}${editing ? " mr-editable" : ""}${selectedId === id ? " mr-selected" : ""} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag: mediaType,
              mediaType,
              mediaUrl: finalMediaUrl,
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
    };
  }

  const heroImage = collectionImages[0]?.imageUrl || heroPosterUrl;
  const gallery = collectionImages.length
    ? collectionImages.slice(0, 5)
    : [
        { title: "Identity", subtitle: brandName, imageUrl: heroPosterUrl },
        { title: "Method", subtitle: industry, imageUrl: heroPosterUrl },
        { title: "Proof", subtitle: "Selected work", imageUrl: heroPosterUrl },
      ].filter((item) => item.imageUrl);

  return (
    <main
      {...editable("site", "site wrapper", undefined, {
        className: "mr-site",
        style: { "--mr-primary": primary },
      })}
    >
      <style>{`
        .mr-site {
          min-height: 100vh;
          color: #111111;
          background:
            linear-gradient(90deg, rgba(17,17,17,.045) 1px, transparent 1px) 0 0 / 80px 80px,
            linear-gradient(180deg, #f8f6f0 0%, #efebe2 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: hidden;
          isolation: isolate;
        }

        .mr-site * { box-sizing: border-box; }
        .mr-site button { font: inherit; }
        .mr-shell { width: min(1380px, calc(100% - 48px)); margin: 0 auto; }

        .mr-nav {
          height: 86px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-brand {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          letter-spacing: -.055em;
          font-weight: 500;
        }

        .mr-nav-center {
          display: flex;
          align-items: center;
          gap: 26px;
          color: rgba(17,17,17,.54);
          font-size: 11px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .mr-nav-center a { color: inherit; text-decoration: none; transition: color .2s ease; }
        .mr-nav-center a:hover { color: #111; }
        .mr-nav-action { display: flex; justify-content: flex-end; }

        .mr-link-button,
        .mr-primary-button,
        .mr-light-button {
          min-height: 48px;
          border-radius: 0;
          padding: 0 21px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .13em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
        }

        .mr-link-button {
          background: transparent;
          color: #111;
          border: 1px solid rgba(17,17,17,.18);
          box-shadow: inset 0 0 0 0 #111;
        }

        .mr-link-button:hover {
          background: #111;
          color: #f8f6f0;
          transform: translateY(-2px);
          box-shadow: 0 22px 44px rgba(17,17,17,.14);
        }

        .mr-primary-button {
          position: relative;
          overflow: hidden;
          border: 1px solid #111;
          background: #111;
          color: #f8f6f0;
          box-shadow: 0 24px 60px rgba(17,17,17,.18), 0 0 0 1px rgba(255,255,255,.08) inset;
        }

        .mr-primary-button::before {
          content: "";
          position: absolute;
          inset: -80% -35%;
          background: linear-gradient(110deg, transparent 34%, rgba(255,255,255,.22), transparent 66%);
          transform: translateX(-60%) rotate(8deg);
          transition: transform .75s cubic-bezier(.22,1,.36,1);
        }

        .mr-primary-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 30px 80px rgba(17,17,17,.26), 0 0 45px rgba(17,17,17,.12);
        }

        .mr-primary-button:hover::before { transform: translateX(62%) rotate(8deg); }
        .mr-primary-button span { position: relative; z-index: 1; }

        .mr-light-button {
          border: 1px solid rgba(248,246,240,.38);
          background: rgba(248,246,240,.08);
          color: #f8f6f0;
          backdrop-filter: blur(16px);
        }

        .mr-light-button:hover {
          background: #f8f6f0;
          color: #111;
          transform: translateY(-2px);
          box-shadow: 0 22px 58px rgba(0,0,0,.24);
        }

        .mr-hero {
          min-height: 760px;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, .72fr);
          gap: 46px;
          padding: 58px 0 42px;
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 640px;
        }

        .mr-kicker-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding-top: 8px;
          color: rgba(17,17,17,.52);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .mr-title {
          margin: 42px 0 0;
          max-width: 980px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(78px, 10vw, 170px);
          line-height: .79;
          letter-spacing: -.075em;
          font-weight: 500;
        }

        .mr-title .mr-muted { color: rgba(17,17,17,.34); }

        .mr-hero-bottom {
          display: grid;
          grid-template-columns: .72fr 1fr;
          gap: 36px;
          align-items: end;
          margin-top: 52px;
        }

        .mr-hero-text {
          margin: 0;
          max-width: 660px;
          color: rgba(17,17,17,.64);
          font-size: 18px;
          line-height: 1.75;
        }

        .mr-actions { display: flex; flex-wrap: wrap; gap: 12px; }

        .mr-hero-media {
          position: relative;
          min-height: 640px;
          background: #111;
          overflow: hidden;
          border: 1px solid rgba(17,17,17,.14);
          box-shadow: 0 50px 120px rgba(17,17,17,.18);
        }

        .mr-hero-media::before {
          content: "";
          position: absolute;
          inset: 16px;
          z-index: 2;
          border: 1px solid rgba(248,246,240,.28);
          pointer-events: none;
        }

        .mr-hero-media video,
        .mr-hero-media img,
        .mr-media-fallback {
          width: 100%;
          height: 100%;
          min-height: 640px;
          object-fit: cover;
          display: block;
          filter: saturate(.76) contrast(1.08) brightness(.88);
        }

        .mr-media-fallback {
          background:
            radial-gradient(circle at 70% 20%, rgba(255,255,255,.16), transparent 30%),
            linear-gradient(135deg, #151515 0%, #2d2b27 52%, #0b0b0b 100%);
        }

        .mr-hero-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.58));
        }

        .mr-media-caption {
          position: absolute;
          left: 34px;
          right: 34px;
          bottom: 34px;
          z-index: 3;
          color: #f8f6f0;
          display: flex;
          justify-content: space-between;
          gap: 22px;
          align-items: flex-end;
        }

        .mr-media-caption strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          line-height: .95;
          font-weight: 500;
          letter-spacing: -.045em;
        }

        .mr-media-caption span {
          color: rgba(248,246,240,.68);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .16em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .mr-proof-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-stat {
          min-height: 170px;
          padding: 34px 30px;
          border-right: 1px solid rgba(17,17,17,.12);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: background .25s ease, transform .25s ease;
        }

        .mr-stat:last-child { border-right: 0; }
        .mr-stat:hover { background: rgba(255,255,255,.35); transform: translateY(-2px); }
        .mr-stat strong { font-family: Georgia, "Times New Roman", serif; font-size: 58px; line-height: 1; font-weight: 500; letter-spacing: -.055em; }
        .mr-stat span { color: rgba(17,17,17,.54); font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }

        .mr-section-head {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 56px;
          padding: 110px 0 52px;
        }

        .mr-label {
          color: rgba(17,17,17,.48);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .mr-section-title {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 5.6vw, 96px);
          line-height: .88;
          font-weight: 500;
          letter-spacing: -.065em;
        }

        .mr-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(17,17,17,.12);
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-feature {
          min-height: 390px;
          padding: 34px 30px;
          border-right: 1px solid rgba(17,17,17,.12);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: rgba(248,246,240,.22);
          transition: background .28s ease, box-shadow .28s ease, transform .28s ease;
        }

        .mr-feature:last-child { border-right: 0; }
        .mr-feature:hover { background: rgba(255,255,255,.54); transform: translateY(-4px); box-shadow: 0 35px 85px rgba(17,17,17,.08); }
        .mr-feature-index { font-size: 11px; font-weight: 950; letter-spacing: .16em; color: rgba(17,17,17,.42); }
        .mr-feature h3 { margin: 0 0 16px; font-family: Georgia, "Times New Roman", serif; font-size: 42px; line-height: .96; font-weight: 500; letter-spacing: -.055em; }
        .mr-feature p { margin: 0; color: rgba(17,17,17,.62); font-size: 15px; line-height: 1.75; }

        .mr-method {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 0;
          padding: 110px 0;
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-method-aside {
          padding: 34px 38px 34px 0;
          border-right: 1px solid rgba(17,17,17,.12);
        }

        .mr-method-aside h2 { margin: 26px 0 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(54px, 6vw, 104px); line-height: .84; letter-spacing: -.07em; font-weight: 500; }
        .mr-method-aside p { max-width: 440px; margin: 28px 0 0; color: rgba(17,17,17,.6); line-height: 1.75; font-size: 16px; }

        .mr-method-list { display: grid; }
        .mr-method-card {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 28px;
          padding: 38px 0 38px 42px;
          border-bottom: 1px solid rgba(17,17,17,.12);
          transition: background .25s ease, padding-left .25s ease;
        }

        .mr-method-card:last-child { border-bottom: 0; }
        .mr-method-card:hover { background: rgba(255,255,255,.36); padding-left: 56px; }
        .mr-method-card small { color: rgba(17,17,17,.42); font-size: 11px; font-weight: 950; letter-spacing: .18em; text-transform: uppercase; }
        .mr-method-card h3 { margin: 0 0 12px; font-family: Georgia, "Times New Roman", serif; font-size: 36px; line-height: 1; letter-spacing: -.045em; font-weight: 500; }
        .mr-method-card p { margin: 0; color: rgba(17,17,17,.6); line-height: 1.7; }

        .mr-gallery {
          padding: 96px 0 110px;
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-gallery-grid {
          display: grid;
          grid-template-columns: 1.1fr .75fr 1.05fr;
          gap: 16px;
          align-items: stretch;
          margin-top: 52px;
        }

        .mr-gallery-card {
          position: relative;
          min-height: 480px;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(17,17,17,.14);
          box-shadow: 0 34px 80px rgba(17,17,17,.12);
        }

        .mr-gallery-card:nth-child(2) { min-height: 380px; margin-top: 84px; }
        .mr-gallery-card img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(.76) contrast(1.08) brightness(.86); transition: transform .7s cubic-bezier(.22,1,.36,1), filter .7s ease; }
        .mr-gallery-card:hover img { transform: scale(1.045); filter: saturate(.95) contrast(1.05) brightness(.96); }
        .mr-gallery-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 42%, rgba(0,0,0,.72)); }
        .mr-gallery-caption { position: absolute; left: 24px; right: 24px; bottom: 24px; z-index: 2; color: #f8f6f0; }
        .mr-gallery-caption small { display: block; color: rgba(248,246,240,.64); font-size: 10px; font-weight: 900; letter-spacing: .17em; text-transform: uppercase; margin-bottom: 8px; }
        .mr-gallery-caption strong { font-family: Georgia, "Times New Roman", serif; font-size: 30px; line-height: 1; letter-spacing: -.045em; font-weight: 500; }

        .mr-testimonials {
          display: grid;
          grid-template-columns: .72fr 1fr;
          gap: 80px;
          padding: 110px 0;
          border-bottom: 1px solid rgba(17,17,17,.12);
        }

        .mr-quote-card {
          padding: 34px 0;
          border-top: 1px solid rgba(17,17,17,.12);
        }

        .mr-quote-card blockquote {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(30px, 3.1vw, 52px);
          line-height: 1.04;
          letter-spacing: -.045em;
        }

        .mr-quote-card footer { margin-top: 24px; color: rgba(17,17,17,.52); font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }

        .mr-pricing { padding: 96px 0 110px; border-bottom: 1px solid rgba(17,17,17,.12); }
        .mr-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 48px; }
        .mr-price-card { padding: 32px; min-height: 320px; border: 1px solid rgba(17,17,17,.14); background: rgba(255,255,255,.28); display: flex; flex-direction: column; justify-content: space-between; transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
        .mr-price-card:hover { transform: translateY(-4px); background: rgba(255,255,255,.52); box-shadow: 0 35px 86px rgba(17,17,17,.1); }
        .mr-price-card h3 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 34px; letter-spacing: -.045em; }
        .mr-price-card strong { display: block; margin-top: 18px; font-family: Georgia, "Times New Roman", serif; font-size: 54px; letter-spacing: -.06em; }
        .mr-price-card p { color: rgba(17,17,17,.62); line-height: 1.65; }

        .mr-cta {
          margin: 110px 0 44px;
          min-height: 520px;
          padding: 48px;
          background:
            radial-gradient(circle at 84% 18%, rgba(255,255,255,.18), transparent 32%),
            #111111;
          color: #f8f6f0;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 48px;
          align-items: end;
          box-shadow: 0 48px 120px rgba(17,17,17,.24);
        }

        .mr-cta h2 { max-width: 980px; margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(58px, 8vw, 132px); line-height: .82; letter-spacing: -.075em; font-weight: 500; }
        .mr-cta p { margin: 0 0 24px; color: rgba(248,246,240,.68); line-height: 1.75; }

        .mr-footer {
          min-height: 96px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(17,17,17,.48);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .mr-editable { cursor: pointer; outline: 1px dashed rgba(17,17,17,.32); outline-offset: 4px; }
        .mr-editable:hover,
        .mr-selected { outline-color: var(--mr-primary); background: rgba(17,17,17,.045); }
        .mr-site :focus-visible { outline: 2px solid #111; outline-offset: 4px; }

        @media (max-width: 1100px) {
          .mr-shell { width: min(100% - 28px, 780px); }
          .mr-nav { grid-template-columns: 1fr auto; }
          .mr-nav-center { display: none; }
          .mr-hero,
          .mr-hero-bottom,
          .mr-section-head,
          .mr-feature-grid,
          .mr-method,
          .mr-gallery-grid,
          .mr-testimonials,
          .mr-pricing-grid,
          .mr-cta { grid-template-columns: 1fr; }
          .mr-hero-copy { min-height: auto; }
          .mr-title { font-size: clamp(62px, 16vw, 112px); }
          .mr-hero-media { min-height: 440px; }
          .mr-hero-media video,
          .mr-hero-media img,
          .mr-media-fallback { min-height: 440px; }
          .mr-proof-strip { grid-template-columns: 1fr; }
          .mr-stat { border-right: 0; border-bottom: 1px solid rgba(17,17,17,.12); }
          .mr-feature { border-right: 0; border-bottom: 1px solid rgba(17,17,17,.12); }
          .mr-method-aside { border-right: 0; padding-right: 0; border-bottom: 1px solid rgba(17,17,17,.12); }
          .mr-method-card { padding-left: 0; grid-template-columns: 1fr; }
          .mr-method-card:hover { padding-left: 0; }
          .mr-gallery-card:nth-child(2) { margin-top: 0; }
          .mr-cta { min-height: auto; padding: 32px; }
          .mr-footer { flex-direction: column; align-items: flex-start; gap: 12px; padding-bottom: 32px; }
        }

        @media (max-width: 640px) {
          .mr-shell { width: min(100% - 22px, 520px); }
          .mr-brand { font-size: 22px; }
          .mr-link-button,
          .mr-primary-button,
          .mr-light-button { width: 100%; justify-content: center; }
          .mr-actions { flex-direction: column; }
          .mr-kicker-row { flex-direction: column; }
          .mr-title { font-size: 58px; }
          .mr-hero { min-height: auto; padding-top: 34px; }
          .mr-media-caption { flex-direction: column; align-items: flex-start; }
          .mr-section-title { font-size: 48px; }
          .mr-cta h2 { font-size: 52px; }
        }
      `}</style>

      <div className="mr-shell">
        <nav {...editable("nav", "navigation", undefined, { className: "mr-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "mr-brand" })}>{brandName}</div>
          <div className="mr-nav-center">
            <a href="#proof">Proof</a>
            <a href="#features">System</a>
            <a href="#method">Method</a>
            <a href="#gallery">Work</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="mr-nav-action">
            <button {...editable("hero.primaryCta", "nav CTA", text(hero.primaryCta, "Start"), { className: "mr-link-button" })}>
              {text(hero.primaryCta, "Start")}
            </button>
          </div>
        </nav>

        <section className="mr-hero">
          <div className="mr-hero-copy">
            <div>
              <div className="mr-kicker-row">
                <span {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry))}>{text(hero.eyebrow, industry)}</span>
                <span>{new Date().getFullYear()} / Premium System</span>
              </div>
              <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `A precise premium presence for ${brandName}`), { className: "mr-title" })}>
                {text(hero.headline, `A precise premium presence for ${brandName}`)}
              </h1>
            </div>

            <div className="mr-hero-bottom">
              <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline), { className: "mr-hero-text" })}>
                {text(hero.subheadline, tagline)}
              </p>
              <div className="mr-actions">
                <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Start project"), { className: "mr-primary-button" })}>
                  <span>{text(hero.primaryCta, "Start project")}</span>
                </button>
                <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "View method"), { className: "mr-link-button" })}>
                  {text(hero.secondaryCta, "View method")}
                </button>
              </div>
            </div>
          </div>

          <div {...editableMedia("mediaAssets.heroVideoUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroImage, { className: "mr-hero-media" })}>
            {heroVideoUrl ? (
              <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
            ) : heroImage ? (
              <img src={heroImage} alt="" />
            ) : (
              <div className="mr-media-fallback" />
            )}
            <div className="mr-media-caption">
              <strong>{brandName}</strong>
              <span>{industry}</span>
            </div>
          </div>
        </section>

        <section id="proof" className="mr-proof-strip">
          {stats.slice(0, 3).map((stat, index) => (
            <article key={`mr-stat-${index}`} {...editable(`stats.${index}`, "stat", undefined, { className: "mr-stat" })}>
              <strong>{text(stat.title, "")}</strong>
              <span>{text(stat.label, "")}</span>
            </article>
          ))}
        </section>

        <section id="features">
          <div className="mr-section-head">
            <div className="mr-label">System</div>
            <h2 className="mr-section-title">Premium through restraint, structure and trust.</h2>
          </div>
          <div className="mr-feature-grid">
            {features.slice(0, 3).map((item, index) => (
              <article key={`mr-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "mr-feature" })}>
                <span className="mr-feature-index">0{index + 1}</span>
                <div>
                  <h3>{text(item.title, "Feature")}</h3>
                  <p>{text(item.description, "")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="method" className="mr-method">
          <aside className="mr-method-aside">
            <div className="mr-label">Method</div>
            <h2>Designed like an object.</h2>
            <p>{tagline}</p>
          </aside>
          <div className="mr-method-list">
            {sections.slice(0, 3).map((section, index) => (
              <article key={`mr-method-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "mr-method-card" })}>
                <small>0{index + 1}</small>
                <div>
                  <h3>{text(section.title, "Section")}</h3>
                  <p>{text(section.description, "")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {gallery.length ? (
          <section id="gallery" className="mr-gallery">
            <div className="mr-section-head" style={{ paddingTop: 0 }}>
              <div className="mr-label">Selected visuals</div>
              <h2 className="mr-section-title">A gallery rhythm that feels curated, not generated.</h2>
            </div>
            <div className="mr-gallery-grid">
              {gallery.slice(0, 3).map((item, index) => (
                <article key={`mr-gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery", undefined, { className: "mr-gallery-card" })}>
                  <img
                    src={item.imageUrl}
                    alt={item.title || ""}
                    {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)}
                  />
                  <div className="mr-gallery-caption">
                    <small>{text(item.tag || item.title, "Visual")}</small>
                    <strong>{text(item.subtitle || item.title, industry)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mr-testimonials">
          <div>
            <div className="mr-label">Trust</div>
            <h2 className="mr-section-title" style={{ marginTop: 24 }}>Proof in the voice of clients.</h2>
          </div>
          <div>
            {testimonials.slice(0, 2).map((item, index) => (
              <article key={`mr-testimonial-${index}`} {...editable(`testimonials.${index}`, "testimonial", undefined, { className: "mr-quote-card" })}>
                <blockquote>“{text(item.quote, "Excellent work.")}”</blockquote>
                <footer>{text(item.name, "Client")} / {text(item.role, "Partner")}</footer>
              </article>
            ))}
          </div>
        </section>

        {pricing.length ? (
          <section className="mr-pricing">
            <div className="mr-label">Offers</div>
            <h2 className="mr-section-title" style={{ marginTop: 24 }}>Simple packages. Serious presentation.</h2>
            <div className="mr-pricing-grid">
              {pricing.slice(0, 3).map((item, index) => (
                <article key={`mr-price-${index}`} {...editable(`pricing.${index}`, "pricing", undefined, { className: "mr-price-card" })}>
                  <div>
                    <h3>{text(item.name || item.title, `Option ${index + 1}`)}</h3>
                    <strong>{text(item.price, "Custom")}</strong>
                  </div>
                  <p>{text(item.description, "A focused premium package for confident presentation and conversion.")}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="contact" className="mr-cta">
          <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Make ${brandName} look unmistakably premium.`))}>
            {text(footer.headline, `Make ${brandName} look unmistakably premium.`)}
          </h2>
          <div>
            <p {...editable("footer.description", "footer description", text(footer.description, tagline))}>
              {text(footer.description, tagline)}
            </p>
            <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Begin"), { className: "mr-light-button" })}>
              {text(footer.cta, "Begin")} →
            </button>
          </div>
        </section>

        <footer className="mr-footer">
          <span>{brandName}</span>
          <span>{industry}</span>
          <span>Premium minimal renderer</span>
        </footer>
      </div>
    </main>
  );
}
