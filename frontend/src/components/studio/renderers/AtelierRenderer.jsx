import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function AtelierRenderer({
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

  const brandName = text(state.brandName, "Atelier");
  const industry = text(state.industry, "luxury studio");
  const tagline = text(state.tagline, "A curated editorial experience for premium brands.");
  const primary = text(state.primaryColor, "#B98A4B");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const features = list(state.features, [
    { title: "Editorial Direction", description: "Magazine-level layout rhythm with refined whitespace and luxury typography." },
    { title: "Curated Visuals", description: "Large image moments, cinematic video atmosphere and asymmetric premium sections." },
    { title: "Brand Presence", description: "A calmer, more elegant renderer for fashion, portfolio, hospitality and lifestyle projects." },
  ]);

  const sections = list(state.sections, [
    { title: "A visual language with restraint", description: `An editorial presentation for ${industry}, built around mood, space and premium perception.` },
    { title: "Designed as a story", description: "Instead of ordinary cards, every block feels like a curated page from a luxury magazine." },
    { title: "Quiet confidence", description: "High contrast, serif typography, cinematic media and minimal navigation." },
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
      className: `${extra.className || ""}${editing ? " at-editable" : ""}${selectedId === id ? " at-selected" : ""} ${overrideClass(id)}`.trim(),
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
      className: `${extra.className || ""}${editing ? " at-editable" : ""}${selectedId === id ? " at-selected" : ""} ${overrideClass(id)}`.trim(),
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
        className: "at-site",
        style: { "--at-primary": primary },
      })}
    >
      <div {...editableMedia("mediaAssets.heroVideoUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "at-video" })}>
        {heroVideoUrl ? (
          <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
        ) : heroPosterUrl ? (
          <img src={heroPosterUrl} alt="" />
        ) : (
          <div className="at-video-fallback" />
        )}
      </div>

      <style>{`
        .at-site {
          position: relative;
          min-height: 100vh;
          overflow: visible;
          isolation: isolate;
          color: #17130e;
          background: #eee6d8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .at-video {
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #17130e;
        }

        .at-video video,
        .at-video img,
        .at-video-fallback {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          object-fit: cover;
          display: block;
          filter: saturate(.82) contrast(1.06) brightness(.78);
          transform: scale(1.025);
        }

        .at-video-fallback {
          background:
            radial-gradient(circle at 72% 18%, rgba(185,138,75,.24), transparent 32%),
            linear-gradient(135deg, #ede4d6 0%, #d7c6ad 52%, #17130e 100%);
        }

        .at-video::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(238,230,216,.94) 0%, rgba(238,230,216,.72) 42%, rgba(23,19,14,.42) 100%),
            linear-gradient(180deg, rgba(238,230,216,.22), #eee6d8 92%);
        }

        .at-page {
          position: relative;
          z-index: 2;
          width: min(1240px, calc(100% - 54px));
          margin: 0 auto;
        }

        .at-nav {
          height: 90px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          border-bottom: 1px solid rgba(23,19,14,.14);
        }

        .at-nav-left,
        .at-nav-right {
          display: flex;
          gap: 26px;
          align-items: center;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .16em;
        }

        .at-nav-right {
          justify-content: flex-end;
        }

        .at-nav a {
          color: rgba(23,19,14,.66);
          text-decoration: none;
        }

        .at-logo {
          text-align: center;
        }

        .at-logo strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          letter-spacing: .18em;
          text-transform: uppercase;
          font-weight: 400;
        }

        .at-logo span {
          display: block;
          margin-top: 5px;
          font-size: 10px;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(23,19,14,.54);
        }

        .at-hero {
          min-height: 720px;
          display: grid;
          grid-template-columns: .78fr 1.22fr;
          gap: 42px;
          align-items: center;
          padding: 62px 0 56px;
        }

        .at-hero-copy {
          align-self: end;
          padding-bottom: 48px;
        }

        .at-kicker {
          font-size: 12px;
          letter-spacing: .32em;
          text-transform: uppercase;
          color: var(--at-primary);
          font-weight: 900;
          margin-bottom: 24px;
        }

        .at-hero h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(58px, 8vw, 126px);
          line-height: .86;
          font-weight: 400;
          letter-spacing: -.055em;
        }

        .at-hero p {
          margin-top: 28px;
          max-width: 520px;
          color: rgba(23,19,14,.68);
          line-height: 1.85;
          font-size: 17px;
        }

        .at-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .at-btn {
          height: 50px;
          padding: 0 24px;
          border-radius: 0;
          border: 1px solid #17130e;
          background: #17130e;
          color: #f8f1e5;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
        }

        .at-btn-secondary {
          background: transparent;
          color: #17130e;
        }

        .at-visual {
          min-height: 580px;
          position: relative;
          display: grid;
          grid-template-columns: .88fr .12fr;
          gap: 16px;
        }

        .at-main-image {
          position: relative;
          overflow: hidden;
          border-radius: 0 0 180px 0;
          border: 1px solid rgba(23,19,14,.14);
          background: rgba(255,255,255,.32);
          box-shadow: 0 34px 90px rgba(70,48,24,.22);
        }

        .at-main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.92) contrast(1.04);
        }

        .at-main-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent, rgba(23,19,14,.22));
        }

        .at-vertical-type {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          justify-self: center;
          align-self: center;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          letter-spacing: .14em;
          color: rgba(23,19,14,.46);
        }

        .at-floating-card {
          position: absolute;
          left: -50px;
          bottom: 42px;
          width: min(270px, 80%);
          padding: 22px;
          background: rgba(248,241,229,.78);
          border: 1px solid rgba(23,19,14,.12);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 70px rgba(70,48,24,.18);
        }

        .at-floating-card span {
          color: var(--at-primary);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .at-floating-card strong {
          display: block;
          margin-top: 12px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 28px;
          line-height: 1;
          font-weight: 400;
        }

        .at-feature-line {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid rgba(23,19,14,.15);
          border-bottom: 1px solid rgba(23,19,14,.15);
          margin: 14px 0 72px;
        }

        .at-feature {
          padding: 32px;
          border-right: 1px solid rgba(23,19,14,.15);
        }

        .at-feature:last-child {
          border-right: 0;
        }

        .at-feature small {
          color: var(--at-primary);
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .at-feature h3 {
          margin: 18px 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          font-weight: 400;
          line-height: 1;
        }

        .at-feature p {
          color: rgba(23,19,14,.64);
          line-height: 1.65;
        }

        .at-editorial {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 42px;
          padding-bottom: 84px;
        }

        .at-editorial-title {
          position: sticky;
          top: 20px;
          align-self: start;
        }

        .at-editorial-title small {
          color: var(--at-primary);
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .at-editorial-title h2 {
          margin: 20px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(44px, 6vw, 84px);
          line-height: .92;
          font-weight: 400;
          letter-spacing: -.045em;
        }

        .at-story-list {
          display: grid;
          gap: 0;
          border-top: 1px solid rgba(23,19,14,.14);
        }

        .at-story {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 26px;
          padding: 28px 0;
          border-bottom: 1px solid rgba(23,19,14,.14);
        }

        .at-story-number {
          color: var(--at-primary);
          font-weight: 900;
          letter-spacing: .2em;
        }

        .at-story h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          font-weight: 400;
        }

        .at-story p {
          color: rgba(23,19,14,.64);
          line-height: 1.75;
        }

        .at-gallery {
          display: grid;
          grid-template-columns: 1.1fr .9fr 1.1fr;
          gap: 16px;
          padding-bottom: 84px;
        }

        .at-gallery-card {
          min-height: 390px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(23,19,14,.14);
          background: rgba(255,255,255,.32);
        }

        .at-gallery-card:nth-child(2) {
          transform: translateY(52px);
        }

        .at-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.86) contrast(1.04);
        }

        .at-gallery-card div {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          padding: 16px;
          background: rgba(248,241,229,.8);
          backdrop-filter: blur(14px);
        }

        .at-gallery-card small {
          display: block;
          color: var(--at-primary);
          text-transform: uppercase;
          letter-spacing: .16em;
          font-size: 10px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .at-gallery-card strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 23px;
          font-weight: 400;
        }

        .at-cta {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: end;
          padding: 54px 0;
          border-top: 1px solid rgba(23,19,14,.14);
          border-bottom: 1px solid rgba(23,19,14,.14);
          margin-bottom: 40px;
        }

        .at-cta h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(44px, 6vw, 86px);
          line-height: .92;
          font-weight: 400;
          letter-spacing: -.045em;
        }

        .at-footer {
          padding: 0 0 48px;
          display: flex;
          justify-content: space-between;
          color: rgba(23,19,14,.58);
          font-size: 13px;
        }

        .at-editable {
          cursor: pointer;
          outline: 1px dashed rgba(185,138,75,.45);
          outline-offset: 4px;
        }

        .at-editable:hover,
        .at-selected {
          outline-color: var(--at-primary);
          background: rgba(185,138,75,.06);
        }

        @media (max-width: 1050px) {
          .at-page {
            width: min(100% - 28px, 760px);
          }

          .at-nav {
            grid-template-columns: 1fr;
            height: auto;
            gap: 14px;
            padding: 20px 0;
          }

          .at-nav-left,
          .at-nav-right {
            justify-content: center;
            flex-wrap: wrap;
          }

          .at-hero,
          .at-editorial,
          .at-gallery,
          .at-cta {
            grid-template-columns: 1fr;
          }

          .at-visual {
            grid-template-columns: 1fr;
          }

          .at-vertical-type {
            display: none;
          }

          .at-floating-card {
            left: 16px;
          }

          .at-feature-line {
            grid-template-columns: 1fr;
          }

          .at-feature {
            border-right: 0;
            border-bottom: 1px solid rgba(23,19,14,.15);
          }

          .at-gallery-card:nth-child(2) {
            transform: none;
          }

          .at-hero h1 {
            font-size: 58px;
          }

          .at-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      <div className="at-page">
        <nav {...editable("nav", "navigation", undefined, { className: "at-nav" })}>
          <div className="at-nav-left">
            <a href="#story">Story</a>
            <a href="#work">Work</a>
          </div>

          <div {...editable("brandName", "brand", brandName, { className: "at-logo" })}>
            <strong>{brandName}</strong>
            <span>{industry}</span>
          </div>

          <div className="at-nav-right">
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>

        <section className="at-hero">
          <div className="at-hero-copy">
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "at-kicker" })}>
              {text(hero.eyebrow, industry)}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `A curated world for ${brandName}`))}>
              {text(hero.headline, `A curated world for ${brandName}`)}
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>

            <div className="at-actions">
              <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Explore Collection"), { className: "at-btn" })}>
                {text(hero.primaryCta, "Explore Collection")}
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "View Story"), { className: "at-btn at-btn-secondary" })}>
                {text(hero.secondaryCta, "View Story")}
              </button>
            </div>
          </div>

          <div className="at-visual">
            <div className="at-main-image">
              {collectionImages[0]?.imageUrl || heroPosterUrl ? (
                <img
                  src={collectionImages[0]?.imageUrl || heroPosterUrl}
                  alt=""
                  {...editableMedia("mediaAssets.collectionImages.0.imageUrl", "image", collectionImages[0]?.imageUrl || heroPosterUrl)}
                />
              ) : null}

              <div className="at-floating-card">
                <span>Editorial Selection</span>
                <strong>{text(sections[0]?.title, "Designed with quiet confidence")}</strong>
              </div>
            </div>

            <div className="at-vertical-type">EDITORIAL</div>
          </div>
        </section>

        <section className="at-feature-line">
          {features.slice(0, 3).map((item, index) => (
            <article key={`at-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "at-feature" })}>
              <small>0{index + 1}</small>
              <h3>{text(item.title, "Editorial Feature")}</h3>
              <p>{text(item.description, "")}</p>
            </article>
          ))}
        </section>

        <section id="story" className="at-editorial">
          <div className="at-editorial-title">
            <small>Brand narrative</small>
            <h2>Premium does not need to shout.</h2>
          </div>

          <div className="at-story-list">
            {sections.slice(0, 3).map((section, index) => (
              <article key={`at-section-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "at-story" })}>
                <div className="at-story-number">0{index + 1}</div>
                <div>
                  <h3>{text(section.title, "Editorial section")}</h3>
                  <p>{text(section.description, "")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {collectionImages.length ? (
          <section id="gallery" className="at-gallery">
            {collectionImages.slice(0, 3).map((item, index) => (
              <article key={`at-gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery", undefined, { className: "at-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                <div>
                  <small>{text(item.tag, "Visual Story")}</small>
                  <strong>{text(item.subtitle || item.title, industry)}</strong>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section id="contact" className="at-cta">
          <h2>{text(footer.headline, `Begin the next chapter of ${brandName}.`)}</h2>
          <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Start Conversation"), { className: "at-btn" })}>
            {text(footer.cta, "Start Conversation")}
          </button>
        </section>

        <footer className="at-footer">
          <span>{brandName}</span>
          <span>{tagline}</span>
        </footer>
      </div>
    </div>
  );
}
