import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function TerraRenderer({
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

  const brandName = text(state.brandName, "Terra");
  const industry = text(state.industry, "organic premium brand");
  const tagline = text(state.tagline, "A calm, natural and deeply refined digital experience.");
  const primary = text(state.primaryColor, "#6F8A4A");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const stats = list(state.stats, [
    { title: "100%", label: "Natural rhythm" },
    { title: "4.9", label: "Trusted experience" },
    { title: "12+", label: "Signature details" },
  ]);

  const features = list(state.features, [
    { title: "Organic Luxury", description: "A warm premium renderer with natural curves, soft shadows and calm visual rhythm." },
    { title: "Human Touch", description: "Designed for wellness, hospitality, food, handmade products and lifestyle brands." },
    { title: "Quiet Conversion", description: "Soft storytelling, trust sections and gentle CTA flow without aggressive design." },
  ]);

  const sections = list(state.sections, [
    { title: "Rooted in natural elegance", description: `A premium organic layout for ${industry}, designed to feel warm, trustworthy and refined.` },
    { title: "Soft visual storytelling", description: "Rounded cards, earthy colors, natural image rhythm and cinematic background atmosphere." },
    { title: "Premium without coldness", description: "A calm alternative to tech, black luxury and commerce-heavy renderers." },
  ]);

  function overrideClass(id) {
    return text(overrides[id]?.classes, "");
  }

  function overrideStyle(id) {
    return overrides[id]?.styles || {};
  }

  function editable(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": id,
      className: `${extra.className || ""}${editing ? " te-editable" : ""}${selectedId === id ? " te-selected" : ""} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag,
              text: value,
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
      className: `${extra.className || ""}${editing ? " te-editable" : ""}${selectedId === id ? " te-selected" : ""} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
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
        className: "te-site",
        style: { "--te-primary": primary },
      })}
    >
      <div {...editableMedia("mediaAssets.heroVideoUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "te-video" })}>
        {heroVideoUrl ? (
          <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
        ) : heroPosterUrl ? (
          <img src={heroPosterUrl} alt="" />
        ) : (
          <div className="te-video-fallback" />
        )}
      </div>

      <style>{`
        .te-site {
          position: relative;
          min-height: 100vh;
          overflow: visible;
          isolation: isolate;
          color: #2c2418;
          background: #f3eadc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .te-video {
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #f3eadc;
        }

        .te-video video,
        .te-video img,
        .te-video-fallback {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          object-fit: cover;
          display: block;
          filter: saturate(.92) contrast(1.02) brightness(.86);
          transform: scale(1.025);
        }

        .te-video-fallback {
          background:
            radial-gradient(circle at 75% 18%, rgba(111,138,74,.28), transparent 34%),
            radial-gradient(circle at 18% 28%, rgba(197,138,82,.22), transparent 34%),
            linear-gradient(135deg, #f3eadc 0%, #e0d0b8 52%, #b7c39a 100%);
        }

        .te-video::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(243,234,220,.96), rgba(243,234,220,.78), rgba(243,234,220,.88)),
            linear-gradient(180deg, rgba(243,234,220,.12), #f3eadc 92%);
        }

        .te-page {
          position: relative;
          z-index: 2;
          width: min(1240px, calc(100% - 44px));
          margin: 0 auto;
        }

        .te-nav {
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .te-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          font-weight: 400;
          letter-spacing: -.04em;
        }

        .te-leaf {
          width: 42px;
          height: 42px;
          border-radius: 60% 40% 60% 40%;
          background: var(--te-primary);
          box-shadow: 0 18px 42px rgba(111,138,74,.24);
          transform: rotate(-18deg);
        }

        .te-nav-links {
          display: flex;
          gap: 28px;
          color: rgba(44,36,24,.62);
          font-size: 13px;
          font-weight: 800;
        }

        .te-nav-links a {
          color: inherit;
          text-decoration: none;
        }

        .te-nav-btn {
          height: 44px;
          border: 1px solid rgba(44,36,24,.15);
          border-radius: 999px;
          background: rgba(255,255,255,.42);
          color: #2c2418;
          padding: 0 20px;
          font-weight: 900;
          backdrop-filter: blur(14px);
        }

        .te-hero {
          min-height: 720px;
          display: grid;
          grid-template-columns: .96fr 1.04fr;
          gap: 52px;
          align-items: center;
          padding: 48px 0 64px;
        }

        .te-kicker {
          width: fit-content;
          border-radius: 999px;
          padding: 10px 15px;
          background: rgba(255,255,255,.46);
          border: 1px solid rgba(44,36,24,.1);
          color: var(--te-primary);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          backdrop-filter: blur(16px);
        }

        .te-hero h1 {
          margin: 24px 0 0;
          max-width: 760px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(58px, 7.4vw, 118px);
          line-height: .88;
          font-weight: 400;
          letter-spacing: -.06em;
        }

        .te-hero p {
          max-width: 620px;
          margin: 28px 0 0;
          color: rgba(44,36,24,.66);
          font-size: 18px;
          line-height: 1.8;
        }

        .te-actions {
          display: flex;
          gap: 12px;
          margin-top: 34px;
          flex-wrap: wrap;
        }

        .te-btn {
          height: 54px;
          border: 0;
          border-radius: 999px;
          background: var(--te-primary);
          color: #fffaf0;
          padding: 0 24px;
          font-weight: 950;
          box-shadow: 0 24px 58px rgba(111,138,74,.22);
        }

        .te-btn-secondary {
          background: rgba(255,255,255,.52);
          color: #2c2418;
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 18px 42px rgba(44,36,24,.08);
        }

        .te-visual {
          min-height: 580px;
          position: relative;
        }

        .te-image-orb {
          position: absolute;
          inset: 0;
          border-radius: 48% 52% 44% 56%;
          overflow: hidden;
          border: 1px solid rgba(44,36,24,.12);
          background: rgba(255,255,255,.34);
          box-shadow: 0 34px 95px rgba(80,64,38,.18);
        }

        .te-image-orb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.92) contrast(1.02);
        }

        .te-floating-note {
          position: absolute;
          left: -18px;
          bottom: 56px;
          width: min(310px, 86%);
          border-radius: 34px;
          padding: 24px;
          background: rgba(255,255,255,.68);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 24px 70px rgba(80,64,38,.14);
          backdrop-filter: blur(18px);
        }

        .te-floating-note small {
          color: var(--te-primary);
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .16em;
        }

        .te-floating-note strong {
          display: block;
          margin-top: 12px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          line-height: 1;
          font-weight: 400;
        }

        .te-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 70px;
        }

        .te-stat {
          border-radius: 36px;
          padding: 28px;
          background: rgba(255,255,255,.5);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 22px 60px rgba(80,64,38,.08);
          backdrop-filter: blur(18px);
        }

        .te-stat strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 48px;
          font-weight: 400;
        }

        .te-stat span {
          display: block;
          margin-top: 8px;
          color: rgba(44,36,24,.58);
          font-weight: 800;
        }

        .te-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 76px;
        }

        .te-feature {
          min-height: 280px;
          border-radius: 42px;
          padding: 30px;
          background: rgba(255,255,255,.52);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 24px 70px rgba(80,64,38,.08);
          backdrop-filter: blur(18px);
        }

        .te-feature:nth-child(2) {
          transform: translateY(34px);
        }

        .te-feature-icon {
          width: 54px;
          height: 54px;
          border-radius: 60% 40% 60% 40%;
          background: linear-gradient(135deg, var(--te-primary), #c58a52);
          margin-bottom: 36px;
          transform: rotate(-16deg);
        }

        .te-feature h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 400;
        }

        .te-feature p {
          color: rgba(44,36,24,.62);
          line-height: 1.72;
        }

        .te-sections {
          display: grid;
          grid-template-columns: .86fr 1.14fr;
          gap: 18px;
          margin-bottom: 80px;
        }

        .te-section-title {
          min-height: 460px;
          border-radius: 50px;
          padding: 40px;
          background:
            radial-gradient(circle at 78% 18%, rgba(111,138,74,.18), transparent 34%),
            rgba(255,255,255,.48);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 24px 70px rgba(80,64,38,.08);
          backdrop-filter: blur(18px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .te-section-title h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(46px, 5.4vw, 86px);
          line-height: .9;
          font-weight: 400;
          letter-spacing: -.055em;
        }

        .te-section-title p {
          color: rgba(44,36,24,.62);
          line-height: 1.75;
        }

        .te-section-list {
          display: grid;
          gap: 14px;
        }

        .te-section {
          border-radius: 34px;
          padding: 28px;
          background: rgba(255,255,255,.52);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 22px 60px rgba(80,64,38,.08);
          backdrop-filter: blur(18px);
        }

        .te-section small {
          color: var(--te-primary);
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .16em;
        }

        .te-section h3 {
          margin: 16px 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          font-weight: 400;
          line-height: 1;
        }

        .te-section p {
          color: rgba(44,36,24,.62);
          line-height: 1.75;
        }

        .te-gallery {
          display: grid;
          grid-template-columns: 1.1fr .9fr 1fr;
          gap: 16px;
          margin-bottom: 80px;
        }

        .te-gallery-card {
          min-height: 360px;
          border-radius: 44px;
          overflow: hidden;
          position: relative;
          background: rgba(255,255,255,.45);
          border: 1px solid rgba(44,36,24,.1);
          box-shadow: 0 22px 70px rgba(80,64,38,.08);
        }

        .te-gallery-card:nth-child(2) {
          transform: translateY(52px);
        }

        .te-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.94) contrast(1.02);
        }

        .te-gallery-card div {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          border-radius: 26px;
          padding: 16px;
          background: rgba(255,255,255,.66);
          backdrop-filter: blur(16px);
        }

        .te-gallery-card small {
          display: block;
          color: var(--te-primary);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .16em;
          font-weight: 950;
          margin-bottom: 8px;
        }

        .te-gallery-card strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 23px;
          font-weight: 400;
        }

        .te-cta {
          border-radius: 52px;
          padding: 54px;
          margin-bottom: 44px;
          background:
            radial-gradient(circle at 80% 20%, rgba(197,138,82,.22), transparent 36%),
            var(--te-primary);
          color: #fffaf0;
          box-shadow: 0 30px 90px rgba(111,138,74,.2);
        }

        .te-cta h2 {
          max-width: 850px;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(46px, 6vw, 90px);
          line-height: .92;
          font-weight: 400;
          letter-spacing: -.055em;
        }

        .te-cta p {
          max-width: 680px;
          color: rgba(255,250,240,.76);
          line-height: 1.75;
        }

        .te-footer {
          padding: 0 0 50px;
          display: flex;
          justify-content: space-between;
          color: rgba(44,36,24,.56);
          font-weight: 800;
        }

        .te-editable {
          cursor: pointer;
          outline: 1px dashed rgba(111,138,74,.45);
          outline-offset: 4px;
        }

        .te-editable:hover,
        .te-selected {
          outline-color: var(--te-primary);
          background: rgba(111,138,74,.06);
        }

        @media (max-width: 1050px) {
          .te-page {
            width: min(100% - 28px, 760px);
          }

          .te-nav-links {
            display: none;
          }

          .te-hero,
          .te-stats,
          .te-feature-grid,
          .te-sections,
          .te-gallery {
            grid-template-columns: 1fr;
          }

          .te-hero h1 {
            font-size: 58px;
          }

          .te-visual {
            min-height: 420px;
          }

          .te-feature:nth-child(2),
          .te-gallery-card:nth-child(2) {
            transform: none;
          }

          .te-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      <div className="te-page">
        <nav {...editable("nav", "navigation", undefined, { className: "te-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "te-brand" })}>
            <span className="te-leaf" />
            <span>{brandName}</span>
          </div>

          <div className="te-nav-links">
            <a href="#story">Story</a>
            <a href="#features">Benefits</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </div>

          <button {...editable("hero.primaryCta", "nav CTA", text(hero.primaryCta, "Begin"), { className: "te-nav-btn" })}>
            {text(hero.primaryCta, "Begin")}
          </button>
        </nav>

        <section className="te-hero">
          <div>
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "te-kicker" })}>
              {text(hero.eyebrow, industry)}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `A naturally premium world for ${brandName}`))}>
              {text(hero.headline, `A naturally premium world for ${brandName}`)}
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>

            <div className="te-actions">
              <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Explore Naturally"), { className: "te-btn" })}>
                {text(hero.primaryCta, "Explore Naturally")} →
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "Read Story"), { className: "te-btn te-btn-secondary" })}>
                {text(hero.secondaryCta, "Read Story")}
              </button>
            </div>
          </div>

          <div className="te-visual">
            <div className="te-image-orb">
              {collectionImages[0]?.imageUrl || heroPosterUrl ? (
                <img
                  src={collectionImages[0]?.imageUrl || heroPosterUrl}
                  alt=""
                  {...editableMedia("mediaAssets.collectionImages.0.imageUrl", "image", collectionImages[0]?.imageUrl || heroPosterUrl)}
                />
              ) : null}
            </div>

            <div className="te-floating-note">
              <small>Organic premium</small>
              <strong>{text(sections[0]?.title, "Soft, calm and refined")}</strong>
            </div>
          </div>
        </section>

        <section className="te-stats">
          {stats.slice(0, 3).map((stat, index) => (
            <article key={`te-stat-${index}`} {...editable(`stats.${index}`, "stat", undefined, { className: "te-stat" })}>
              <strong>{text(stat.title, "")}</strong>
              <span>{text(stat.label, "")}</span>
            </article>
          ))}
        </section>

        <section id="features" className="te-feature-grid">
          {features.slice(0, 3).map((item, index) => (
            <article key={`te-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "te-feature" })}>
              <div className="te-feature-icon" />
              <h3>{text(item.title, "Feature")}</h3>
              <p>{text(item.description, "")}</p>
            </article>
          ))}
        </section>

        <section id="story" className="te-sections">
          <div className="te-section-title">
            <h2>Built with natural rhythm.</h2>
            <p>{tagline}</p>
          </div>

          <div className="te-section-list">
            {sections.slice(0, 3).map((section, index) => (
              <article key={`te-section-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "te-section" })}>
                <small>0{index + 1}</small>
                <h3>{text(section.title, "Section")}</h3>
                <p>{text(section.description, "")}</p>
              </article>
            ))}
          </div>
        </section>

        {collectionImages.length ? (
          <section id="gallery" className="te-gallery">
            {collectionImages.slice(0, 3).map((item, index) => (
              <article key={`te-gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery", undefined, { className: "te-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                <div>
                  <small>{text(item.tag, "Natural visual")}</small>
                  <strong>{text(item.subtitle || item.title, industry)}</strong>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section id="contact" className="te-cta">
          <h2>{text(footer.headline, `Let ${brandName} feel naturally premium.`)}</h2>
          <p>{text(footer.description, tagline)}</p>
          <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Begin"), { className: "te-btn" })}>
            {text(footer.cta, "Begin")} →
          </button>
        </section>

        <footer className="te-footer">
          <span>{brandName}</span>
          <span>{industry}</span>
        </footer>
      </div>
    </div>
  );
}
