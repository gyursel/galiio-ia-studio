import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function NexoraRenderer({
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

  const brandName = text(state.brandName, "Nexora");
  const industry = text(state.industry, "AI infrastructure");
  const tagline = text(state.tagline, "Futuristic digital systems built for scale.");
  const primary = text(state.primaryColor, "#4F7BFF");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const stats = list(state.stats, [
    { title: "24K+", label: "Active systems" },
    { title: "99.9%", label: "Operational uptime" },
    { title: "8.4x", label: "Performance lift" },
    { title: "Global", label: "Deployment ready" },
  ]);

  const features = list(state.features, [
    {
      title: "Elastic Intelligence",
      description: "A high-tech visual system for modern brands, platforms and digital products.",
    },
    {
      title: "Real-Time Experience",
      description: "Video background, glass dashboards and neon depth make the site feel alive.",
    },
    {
      title: "Developer First",
      description: "Structured sections, sharp hierarchy and fast scanning for product-led pages.",
    },
    {
      title: "Enterprise Ready",
      description: "Premium credibility through metrics, cards, flows and strong visual rhythm.",
    },
  ]);

  const sections = list(state.sections, [
    {
      title: "Built for what comes next",
      description: `A futuristic premium layout for ${industry}, designed to feel advanced, fast and trustworthy.`,
    },
    {
      title: "Systems that feel alive",
      description: "Layered panels, signal lines, dashboard modules and cinematic video atmosphere.",
    },
    {
      title: "Launch with authority",
      description: "A strong hero, conversion CTA and proof-driven content structure.",
    },
  ]);

  function overrideClass(id) {
    return text(overrides[id]?.classes, "");
  }

  function overrideStyle(id) {
    return overrides[id]?.styles || {}

  function overrideText(id, fallback = "") {
    return overrides[id]?.text ?? fallback;
  }

  function overrideMediaUrl(id, fallback = "") {
    return overrides[id]?.mediaUrl ?? fallback;
  };
  }

  function editable(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": id,
      className: `${extra.className || ""}${editing ? " nx-editable" : ""}${selectedId === id ? " nx-selected" : ""} ${overrideClass(id)}`.trim(),
      style: {
        ...(extra.style || {}),
        ...overrideStyle(id),
      },
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
    return {
      "data-gpr-id": id,
      className: `${extra.className || ""}${editing ? " nx-editable" : ""}${selectedId === id ? " nx-selected" : ""} ${overrideClass(id)}`.trim(),
      style: {
        ...(extra.style || {}),
        ...overrideStyle(id),
      },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag: mediaType,
              mediaType,
              mediaUrl,
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
    };
  }

  return (
    <div
      {...editable("site", "site wrapper", undefined, {
        className: "nx-site",
        style: { "--nx-primary": primary },
      })}
    >
      <div {...editableMedia("mediaAssets.heroVideoUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "nx-video" })}>
        {heroVideoUrl ? (
          <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
        ) : heroPosterUrl ? (
          <img src={heroPosterUrl} alt="" />
        ) : (
          <div className="nx-video-fallback" />
        )}
      </div>

      <style>{`
        .nx-site {
          position: relative;
          min-height: 100vh;
          overflow: visible;
          isolation: isolate;
          color: #f7fbff;
          background: #030511;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .nx-video {
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #030511;
        }

        .nx-video video,
        .nx-video img,
        .nx-video-fallback {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          object-fit: cover;
          display: block;
          filter: saturate(1.22) contrast(1.14) brightness(.58) hue-rotate(8deg);
          transform: scale(1.035);
        }

        .nx-video-fallback {
          background:
            radial-gradient(circle at 74% 18%, rgba(124,77,255,.36), transparent 28%),
            radial-gradient(circle at 25% 30%, rgba(79,123,255,.28), transparent 32%),
            linear-gradient(135deg, #030511 0%, #07112a 48%, #13071f 100%);
        }

        .nx-video::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 78% 24%, color-mix(in srgb, var(--nx-primary) 34%, transparent), transparent 26%),
            linear-gradient(90deg, rgba(2,5,17,.92), rgba(2,5,17,.58), rgba(2,5,17,.88)),
            linear-gradient(180deg, rgba(2,5,17,.28), #030511 92%);
        }

        .nx-site::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(125,160,255,.13) 1px, transparent 1px),
            linear-gradient(180deg, rgba(125,160,255,.08) 1px, transparent 1px);
          background-size: 76px 76px;
          mask-image: linear-gradient(180deg, black, transparent 75%);
          opacity: .38;
        }

        .nx-page {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
        }

        .nx-nav {
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(130,160,255,.16);
        }

        .nx-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 950;
          letter-spacing: -.04em;
        }

        .nx-logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background:
            linear-gradient(135deg, var(--nx-primary), #a855f7);
          box-shadow: 0 0 34px color-mix(in srgb, var(--nx-primary) 48%, transparent);
          display: grid;
          place-items: center;
          color: white;
        }

        .nx-nav-links {
          display: flex;
          gap: 28px;
          color: rgba(247,251,255,.68);
          font-size: 13px;
        }

        .nx-nav-links a {
          color: inherit;
          text-decoration: none;
        }

        .nx-access {
          height: 42px;
          border: 1px solid rgba(130,160,255,.32);
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          color: white;
          padding: 0 18px;
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
        }

        .nx-hero {
          min-height: 700px;
          display: grid;
          grid-template-columns: .95fr 1.05fr;
          gap: 42px;
          align-items: center;
          padding: 64px 0 44px;
        }

        .nx-pill {
          width: fit-content;
          border: 1px solid rgba(130,160,255,.24);
          border-radius: 999px;
          padding: 9px 13px;
          background: rgba(255,255,255,.055);
          color: #9eb8ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .nx-hero h1 {
          margin: 22px 0 0;
          max-width: 780px;
          font-size: clamp(54px, 7.2vw, 112px);
          line-height: .88;
          letter-spacing: -.085em;
        }

        .nx-gradient {
          background: linear-gradient(90deg, #ffffff, #8fb2ff 45%, #d28bff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .nx-hero p {
          max-width: 650px;
          margin: 26px 0 0;
          color: rgba(247,251,255,.68);
          font-size: 18px;
          line-height: 1.75;
        }

        .nx-actions {
          display: flex;
          gap: 12px;
          margin-top: 34px;
          flex-wrap: wrap;
        }

        .nx-btn {
          height: 52px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--nx-primary) 44%, rgba(255,255,255,.18));
          background: linear-gradient(135deg, var(--nx-primary), #8b5cf6);
          color: white;
          padding: 0 22px;
          font-weight: 950;
          box-shadow: 0 22px 65px color-mix(in srgb, var(--nx-primary) 28%, transparent);
        }

        .nx-btn-secondary {
          background: rgba(255,255,255,.065);
          box-shadow: none;
        }

        .nx-dashboard {
          border: 1px solid rgba(130,160,255,.2);
          border-radius: 28px;
          background:
            radial-gradient(circle at 70% 0%, color-mix(in srgb, var(--nx-primary) 22%, transparent), transparent 34%),
            rgba(4,8,27,.72);
          backdrop-filter: blur(24px);
          padding: 18px;
          box-shadow: 0 42px 140px rgba(0,0,0,.46);
        }

        .nx-window-bar {
          height: 44px;
          display: flex;
          align-items: center;
          gap: 7px;
          border-bottom: 1px solid rgba(130,160,255,.14);
          margin: -2px 0 18px;
        }

        .nx-window-bar span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.25);
        }

        .nx-system-grid {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 14px;
        }

        .nx-main-panel,
        .nx-side-panel,
        .nx-mini-panel {
          border: 1px solid rgba(130,160,255,.16);
          border-radius: 22px;
          background: rgba(255,255,255,.055);
          padding: 18px;
        }

        .nx-main-panel {
          min-height: 290px;
        }

        .nx-signal {
          height: 160px;
          border-radius: 18px;
          margin-top: 22px;
          background:
            linear-gradient(180deg, transparent 0 20%, rgba(130,160,255,.1) 20% 21%, transparent 21% 40%, rgba(130,160,255,.1) 40% 41%, transparent 41% 60%, rgba(130,160,255,.1) 60% 61%, transparent 61%),
            linear-gradient(135deg, rgba(79,123,255,.22), rgba(168,85,247,.16));
          position: relative;
          overflow: hidden;
        }

        .nx-signal::before {
          content: "";
          position: absolute;
          left: -20%;
          right: -20%;
          bottom: 18px;
          height: 4px;
          background: linear-gradient(90deg, transparent, #8fb2ff, #d28bff, transparent);
          transform: rotate(-8deg);
          box-shadow: 0 0 26px #8fb2ff;
        }

        .nx-panel-label {
          color: #9eb8ff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .16em;
          font-weight: 950;
        }

        .nx-panel-title {
          display: block;
          margin-top: 10px;
          font-size: 30px;
          letter-spacing: -.055em;
          line-height: 1;
        }

        .nx-side-panel {
          display: grid;
          gap: 12px;
        }

        .nx-mini-panel strong {
          display: block;
          font-size: 24px;
        }

        .nx-mini-panel span {
          color: rgba(247,251,255,.62);
          font-size: 12px;
        }

        .nx-feature-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          padding: 16px 0 70px;
        }

        .nx-feature-card {
          min-height: 190px;
          border: 1px solid rgba(130,160,255,.16);
          border-radius: 24px;
          background: rgba(255,255,255,.055);
          backdrop-filter: blur(18px);
          padding: 24px;
        }

        .nx-feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--nx-primary), #a855f7);
          box-shadow: 0 0 34px color-mix(in srgb, var(--nx-primary) 36%, transparent);
          margin-bottom: 22px;
        }

        .nx-feature-card h3 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -.035em;
        }

        .nx-feature-card p {
          color: rgba(247,251,255,.64);
          line-height: 1.6;
        }

        .nx-grid-section {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 18px;
          padding-bottom: 72px;
        }

        .nx-section-title {
          border: 1px solid rgba(130,160,255,.16);
          border-radius: 30px;
          background: rgba(255,255,255,.05);
          padding: 34px;
          backdrop-filter: blur(18px);
        }

        .nx-section-title h2 {
          margin: 0;
          font-size: clamp(40px, 5vw, 76px);
          line-height: .95;
          letter-spacing: -.075em;
        }

        .nx-section-title p {
          color: rgba(247,251,255,.64);
          line-height: 1.7;
        }

        .nx-section-cards {
          display: grid;
          gap: 14px;
        }

        .nx-section-card {
          border: 1px solid rgba(130,160,255,.16);
          border-radius: 24px;
          background: rgba(255,255,255,.055);
          padding: 24px;
          backdrop-filter: blur(18px);
        }

        .nx-section-card span {
          color: #9eb8ff;
          font-weight: 950;
          font-size: 12px;
          letter-spacing: .16em;
        }

        .nx-section-card h3 {
          margin: 14px 0 10px;
          font-size: 26px;
          letter-spacing: -.05em;
        }

        .nx-section-card p {
          color: rgba(247,251,255,.64);
          line-height: 1.65;
        }

        .nx-gallery {
          display: grid;
          grid-template-columns: 1.2fr .8fr .8fr;
          gap: 14px;
          padding-bottom: 72px;
        }

        .nx-gallery-card {
          min-height: 260px;
          border: 1px solid rgba(130,160,255,.16);
          border-radius: 26px;
          overflow: hidden;
          position: relative;
          background: rgba(255,255,255,.055);
        }

        .nx-gallery-card:first-child {
          grid-row: span 2;
          min-height: 534px;
        }

        .nx-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.12) contrast(1.1) brightness(.75);
        }

        .nx-gallery-card div {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 18px;
          padding: 14px;
          background: rgba(3,5,17,.56);
          backdrop-filter: blur(14px);
        }

        .nx-gallery-card small {
          color: #9eb8ff;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .14em;
        }

        .nx-gallery-card strong {
          display: block;
          margin-top: 6px;
        }

        .nx-cta {
          border: 1px solid rgba(130,160,255,.18);
          border-radius: 32px;
          background:
            radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--nx-primary) 26%, transparent), transparent 36%),
            rgba(255,255,255,.055);
          backdrop-filter: blur(22px);
          padding: 52px;
          margin-bottom: 44px;
        }

        .nx-cta h2 {
          margin: 0;
          max-width: 800px;
          font-size: clamp(42px, 6vw, 86px);
          line-height: .94;
          letter-spacing: -.08em;
        }

        .nx-cta p {
          color: rgba(247,251,255,.65);
          max-width: 680px;
          line-height: 1.7;
        }

        .nx-footer {
          border-top: 1px solid rgba(130,160,255,.16);
          padding: 28px 0 46px;
          display: flex;
          justify-content: space-between;
          color: rgba(247,251,255,.55);
        }

        .nx-editable {
          cursor: pointer;
          outline: 1px dashed rgba(143,178,255,.4);
          outline-offset: 4px;
        }

        .nx-editable:hover,
        .nx-selected {
          outline-color: #8fb2ff;
          background: rgba(143,178,255,.05);
        }

        @media (max-width: 1050px) {
          .nx-page {
            width: min(100% - 28px, 760px);
          }

          .nx-nav-links {
            display: none;
          }

          .nx-hero,
          .nx-system-grid,
          .nx-feature-strip,
          .nx-grid-section,
          .nx-gallery {
            grid-template-columns: 1fr;
          }

          .nx-hero h1 {
            font-size: 58px;
          }

          .nx-gallery-card:first-child {
            grid-row: auto;
            min-height: 300px;
          }

          .nx-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      <div className="nx-page">
        <nav {...editable("nav", "navigation", undefined, { className: "nx-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "nx-logo" })}>
            <span className="nx-logo-mark">N</span>
            <span>{brandName}</span>
          </div>

          <div className="nx-nav-links">
            {["Platform", "Systems", "Proof", "Gallery", "Launch"].map((item) => (
              <a key={item} href="#top">{item}</a>
            ))}
          </div>

          <button {...editable("hero.primaryCta", "nav CTA", text(hero.primaryCta, "Request Access"), { className: "nx-access" })}>
            {text(hero.primaryCta, "Request Access")}
          </button>
        </nav>

        <section className="nx-hero">
          <div>
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, "Built for the intelligence age"), { className: "nx-pill" })}>
              {text(hero.eyebrow, "Built for the intelligence age")}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `The system powering ${brandName}`))}>
              <span className="nx-gradient">{text(hero.headline, `The system powering ${brandName}`)}</span>
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>

            <div className="nx-actions">
              <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Request Access"), { className: "nx-btn" })}>
                {text(hero.primaryCta, "Request Access")} →
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "Explore Platform"), { className: "nx-btn nx-btn-secondary" })}>
                {text(hero.secondaryCta, "Explore Platform")}
              </button>
            </div>
          </div>

          <div className="nx-dashboard">
            <div className="nx-window-bar">
              <span />
              <span />
              <span />
            </div>

            <div className="nx-system-grid">
              <div className="nx-main-panel">
                <div className="nx-panel-label">{industry}</div>
                <strong className="nx-panel-title">Real-time system status</strong>
                <div className="nx-signal" />
              </div>

              <div className="nx-side-panel">
                {stats.slice(0, 4).map((stat, index) => (
                  <div key={`nx-stat-${index}`} {...editable(`stats.${index}`, "stat", undefined, { className: "nx-mini-panel" })}>
                    <strong>{text(stat.title, "")}</strong>
                    <span>{text(stat.label, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="nx-feature-strip">
          {features.slice(0, 4).map((item, index) => (
            <article key={`nx-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "nx-feature-card" })}>
              <div className="nx-feature-icon" />
              <h3>{text(item.title, "Feature")}</h3>
              <p>{text(item.description, "")}</p>
            </article>
          ))}
        </section>

        <section className="nx-grid-section">
          <div className="nx-section-title">
            <h2>Designed for builders. Optimized for breakthroughs.</h2>
            <p>{tagline}</p>
          </div>

          <div className="nx-section-cards">
            {sections.slice(0, 3).map((section, index) => (
              <article key={`nx-section-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "nx-section-card" })}>
                <span>0{index + 1}</span>
                <h3>{text(section.title, "System module")}</h3>
                <p>{text(section.description, "")}</p>
              </article>
            ))}
          </div>
        </section>

        {collectionImages.length ? (
          <section className="nx-gallery">
            {collectionImages.slice(0, 5).map((item, index) => (
              <article key={`nx-gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery", undefined, { className: "nx-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                <div>
                  <small>{text(item.tag, "System visual")}</small>
                  <strong>{text(item.subtitle || item.title, industry)}</strong>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section className="nx-cta">
          <h2>{text(footer.headline, `Ready to launch ${brandName}?`)}</h2>
          <p>{text(footer.description, tagline)}</p>
          <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Start Now"), { className: "nx-btn" })}>
            {text(footer.cta, "Start Now")} →
          </button>
        </section>

        <footer className="nx-footer">
          <span>{brandName}</span>
          <span>{industry}</span>
        </footer>
      </div>
    </div>
  );
}
