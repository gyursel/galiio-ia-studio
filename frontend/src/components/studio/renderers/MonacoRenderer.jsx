import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function MonacoRenderer({
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

  const brandName = text(state.brandName, "Monaco");
  const industry = text(state.industry, "executive advisory");
  const tagline = text(state.tagline, "Premium strategy, trusted execution and refined digital authority.");
  const primary = text(state.primaryColor, "#C6A15B");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const stats = list(state.stats, [
    { title: "98%", label: "Client confidence" },
    { title: "12+", label: "Years expertise" },
    { title: "24/7", label: "Executive support" },
  ]);

  const features = list(state.features, [
    { title: "Executive Trust", description: "A navy-and-gold premium renderer for finance, legal, consulting and high-end services." },
    { title: "Boardroom Clarity", description: "Strong hierarchy, refined spacing, formal cards and authority-driven content structure." },
    { title: "Premium Conversion", description: "Designed to make the brand feel established, secure, serious and expensive." },
  ]);

  const sections = list(state.sections, [
    { title: "Built for authority", description: `A premium executive layout for ${industry}, designed around trust, focus and confidence.` },
    { title: "Structured like a board deck", description: "Clear sections, strong proof, calm colors and elegant decision-making flow." },
    { title: "High-end without noise", description: "Refined gold accents, deep navy atmosphere and precise professional rhythm." },
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
      className: `${extra.className || ""}${editing ? " mo-editable" : ""}${selectedId === id ? " mo-selected" : ""} ${overrideClass(id)}`.trim(),
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
      className: `${extra.className || ""}${editing ? " mo-editable" : ""}${selectedId === id ? " mo-selected" : ""} ${overrideClass(id)}`.trim(),
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
        className: "mo-site",
        style: { "--mo-primary": primary },
      })}
    >
      <div {...editableMedia("mediaAssets.heroVideoUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "mo-video" })}>
        {heroVideoUrl ? (
          <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
        ) : heroPosterUrl ? (
          <img src={heroPosterUrl} alt="" />
        ) : (
          <div className="mo-video-fallback" />
        )}
      </div>

      <style>{`
        .mo-site {
          position: relative;
          min-height: 100vh;
          overflow: visible;
          isolation: isolate;
          color: #f8f1df;
          background: #07111f;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .mo-video {
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #07111f;
        }

        .mo-video video,
        .mo-video img,
        .mo-video-fallback {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          object-fit: cover;
          display: block;
          filter: saturate(.78) contrast(1.12) brightness(.52);
          transform: scale(1.03);
        }

        .mo-video-fallback {
          background:
            radial-gradient(circle at 78% 18%, rgba(198,161,91,.24), transparent 34%),
            linear-gradient(135deg, #07111f 0%, #0b1b31 52%, #020711 100%);
        }

        .mo-video::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(7,17,31,.96), rgba(7,17,31,.72), rgba(7,17,31,.94)),
            linear-gradient(180deg, rgba(7,17,31,.22), #07111f 92%);
        }

        .mo-page {
          position: relative;
          z-index: 2;
          width: min(1240px, calc(100% - 48px));
          margin: 0 auto;
        }

        .mo-nav {
          height: 92px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          border-bottom: 1px solid rgba(248,241,223,.14);
        }

        .mo-nav-left,
        .mo-nav-right {
          display: flex;
          align-items: center;
          gap: 28px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .16em;
        }

        .mo-nav-right {
          justify-content: flex-end;
        }

        .mo-nav a {
          color: rgba(248,241,223,.66);
          text-decoration: none;
        }

        .mo-brand {
          text-align: center;
        }

        .mo-brand strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 400;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #f8f1df;
        }

        .mo-brand span {
          display: block;
          margin-top: 6px;
          color: var(--mo-primary);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28em;
          text-transform: uppercase;
        }

        .mo-hero {
          min-height: 720px;
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 44px;
          align-items: center;
          padding: 64px 0 54px;
        }

        .mo-kicker {
          color: var(--mo-primary);
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .28em;
          margin-bottom: 24px;
        }

        .mo-hero h1 {
          margin: 0;
          max-width: 820px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(58px, 7.6vw, 118px);
          line-height: .88;
          font-weight: 400;
          letter-spacing: -.06em;
        }

        .mo-hero p {
          max-width: 650px;
          margin: 28px 0 0;
          color: rgba(248,241,223,.68);
          font-size: 18px;
          line-height: 1.8;
        }

        .mo-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 34px;
        }

        .mo-btn {
          height: 54px;
          padding: 0 25px;
          border: 1px solid var(--mo-primary);
          border-radius: 0;
          background: var(--mo-primary);
          color: #07111f;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
          box-shadow: 0 24px 58px rgba(198,161,91,.2);
        }

        .mo-btn-secondary {
          background: rgba(248,241,223,.06);
          color: #f8f1df;
          backdrop-filter: blur(16px);
        }

        .mo-board {
          border: 1px solid rgba(248,241,223,.14);
          background:
            radial-gradient(circle at 82% 12%, rgba(198,161,91,.18), transparent 34%),
            rgba(248,241,223,.055);
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 110px rgba(0,0,0,.32);
          padding: 24px;
        }

        .mo-board-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(248,241,223,.14);
        }

        .mo-board-head span {
          color: var(--mo-primary);
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 11px;
          font-weight: 950;
        }

        .mo-board-head strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          font-weight: 400;
        }

        .mo-board-image {
          height: 270px;
          margin-top: 22px;
          overflow: hidden;
          border: 1px solid rgba(248,241,223,.12);
          background: rgba(255,255,255,.04);
        }

        .mo-board-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.86) contrast(1.08) brightness(.78);
        }

        .mo-board-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .mo-board-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(248,241,223,.1);
          padding: 12px 0;
          color: rgba(248,241,223,.72);
          font-size: 13px;
        }

        .mo-board-row b {
          color: var(--mo-primary);
        }

        .mo-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 70px;
        }

        .mo-stat {
          border: 1px solid rgba(248,241,223,.14);
          background: rgba(248,241,223,.055);
          backdrop-filter: blur(18px);
          padding: 28px;
        }

        .mo-stat strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          color: var(--mo-primary);
          font-size: 46px;
          font-weight: 400;
        }

        .mo-stat span {
          display: block;
          margin-top: 8px;
          color: rgba(248,241,223,.62);
          font-weight: 800;
        }

        .mo-feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 78px;
        }

        .mo-feature {
          min-height: 290px;
          border: 1px solid rgba(248,241,223,.14);
          background: rgba(248,241,223,.055);
          backdrop-filter: blur(18px);
          padding: 30px;
        }

        .mo-feature small {
          color: var(--mo-primary);
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .mo-feature h3 {
          margin: 42px 0 14px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 400;
        }

        .mo-feature p {
          color: rgba(248,241,223,.62);
          line-height: 1.7;
        }

        .mo-sections {
          display: grid;
          grid-template-columns: .82fr 1.18fr;
          gap: 18px;
          margin-bottom: 80px;
        }

        .mo-section-title {
          min-height: 460px;
          border: 1px solid rgba(248,241,223,.14);
          background: rgba(248,241,223,.055);
          backdrop-filter: blur(18px);
          padding: 38px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mo-section-title h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(44px, 5.2vw, 82px);
          line-height: .9;
          font-weight: 400;
          letter-spacing: -.055em;
        }

        .mo-section-title p {
          color: rgba(248,241,223,.62);
          line-height: 1.75;
        }

        .mo-section-list {
          display: grid;
          gap: 14px;
        }

        .mo-section {
          border: 1px solid rgba(248,241,223,.14);
          background: rgba(248,241,223,.055);
          backdrop-filter: blur(18px);
          padding: 28px;
        }

        .mo-section small {
          color: var(--mo-primary);
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .mo-section h3 {
          margin: 16px 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          font-weight: 400;
          line-height: 1;
        }

        .mo-section p {
          color: rgba(248,241,223,.62);
          line-height: 1.75;
        }

        .mo-gallery {
          display: grid;
          grid-template-columns: 1.2fr .8fr .8fr;
          gap: 14px;
          margin-bottom: 80px;
        }

        .mo-gallery-card {
          min-height: 340px;
          border: 1px solid rgba(248,241,223,.14);
          overflow: hidden;
          position: relative;
          background: rgba(248,241,223,.055);
        }

        .mo-gallery-card:first-child {
          min-height: 500px;
          grid-row: span 2;
        }

        .mo-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.82) contrast(1.1) brightness(.7);
        }

        .mo-gallery-card div {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          border: 1px solid rgba(248,241,223,.14);
          background: rgba(7,17,31,.68);
          backdrop-filter: blur(14px);
          padding: 16px;
        }

        .mo-gallery-card small {
          color: var(--mo-primary);
          text-transform: uppercase;
          letter-spacing: .16em;
          font-size: 10px;
          font-weight: 950;
        }

        .mo-gallery-card strong {
          display: block;
          margin-top: 7px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 400;
        }

        .mo-cta {
          border-top: 1px solid rgba(248,241,223,.14);
          border-bottom: 1px solid rgba(248,241,223,.14);
          padding: 56px 0;
          margin-bottom: 44px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: end;
        }

        .mo-cta h2 {
          max-width: 900px;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(46px, 6vw, 90px);
          line-height: .9;
          font-weight: 400;
          letter-spacing: -.055em;
        }

        .mo-footer {
          padding: 0 0 48px;
          display: flex;
          justify-content: space-between;
          color: rgba(248,241,223,.48);
          font-weight: 800;
          font-size: 13px;
        }

        .mo-editable {
          cursor: pointer;
          outline: 1px dashed rgba(198,161,91,.45);
          outline-offset: 4px;
        }

        .mo-editable:hover,
        .mo-selected {
          outline-color: var(--mo-primary);
          background: rgba(198,161,91,.06);
        }

        @media (max-width: 1050px) {
          .mo-page {
            width: min(100% - 28px, 760px);
          }

          .mo-nav {
            grid-template-columns: 1fr;
            gap: 14px;
            height: auto;
            padding: 20px 0;
          }

          .mo-nav-left,
          .mo-nav-right {
            justify-content: center;
            flex-wrap: wrap;
          }

          .mo-hero,
          .mo-stats,
          .mo-feature-grid,
          .mo-sections,
          .mo-gallery,
          .mo-cta {
            grid-template-columns: 1fr;
          }

          .mo-hero h1 {
            font-size: 58px;
          }

          .mo-gallery-card:first-child {
            grid-row: auto;
            min-height: 340px;
          }

          .mo-footer {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      <div className="mo-page">
        <nav {...editable("nav", "navigation", undefined, { className: "mo-nav" })}>
          <div className="mo-nav-left">
            <a href="#expertise">Expertise</a>
            <a href="#proof">Proof</a>
          </div>

          <div {...editable("brandName", "brand", brandName, { className: "mo-brand" })}>
            <strong>{brandName}</strong>
            <span>{industry}</span>
          </div>

          <div className="mo-nav-right">
            <a href="#contact">Private Contact</a>
          </div>
        </nav>

        <section className="mo-hero">
          <div>
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "mo-kicker" })}>
              {text(hero.eyebrow, industry)}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `Executive confidence for ${brandName}`))}>
              {text(hero.headline, `Executive confidence for ${brandName}`)}
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>

            <div className="mo-actions">
              <button {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Request Consultation"), { className: "mo-btn" })}>
                {text(hero.primaryCta, "Request Consultation")}
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "Review Expertise"), { className: "mo-btn mo-btn-secondary" })}>
                {text(hero.secondaryCta, "Review Expertise")}
              </button>
            </div>
          </div>

          <div className="mo-board">
            <div className="mo-board-head">
              <span>Executive Brief</span>
              <strong>{brandName}</strong>
            </div>

            <div className="mo-board-image">
              {collectionImages[0]?.imageUrl || heroPosterUrl ? (
                <img
                  src={collectionImages[0]?.imageUrl || heroPosterUrl}
                  alt=""
                  {...editableMedia("mediaAssets.collectionImages.0.imageUrl", "image", collectionImages[0]?.imageUrl || heroPosterUrl)}
                />
              ) : null}
            </div>

            <div className="mo-board-list">
              <div className="mo-board-row"><span>Position</span><b>Premium</b></div>
              <div className="mo-board-row"><span>Focus</span><b>{industry}</b></div>
              <div className="mo-board-row"><span>Confidence</span><b>High</b></div>
            </div>
          </div>
        </section>

        <section className="mo-stats">
          {stats.slice(0, 3).map((stat, index) => (
            <article key={`mo-stat-${index}`} {...editable(`stats.${index}`, "stat", undefined, { className: "mo-stat" })}>
              <strong>{text(stat.title, "")}</strong>
              <span>{text(stat.label, "")}</span>
            </article>
          ))}
        </section>

        <section id="expertise" className="mo-feature-grid">
          {features.slice(0, 3).map((item, index) => (
            <article key={`mo-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "mo-feature" })}>
              <small>0{index + 1}</small>
              <h3>{text(item.title, "Executive Feature")}</h3>
              <p>{text(item.description, "")}</p>
            </article>
          ))}
        </section>

        <section id="proof" className="mo-sections">
          <div className="mo-section-title">
            <h2>Designed for serious decisions.</h2>
            <p>{tagline}</p>
          </div>

          <div className="mo-section-list">
            {sections.slice(0, 3).map((section, index) => (
              <article key={`mo-section-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "mo-section" })}>
                <small>0{index + 1}</small>
                <h3>{text(section.title, "Section")}</h3>
                <p>{text(section.description, "")}</p>
              </article>
            ))}
          </div>
        </section>

        {collectionImages.length ? (
          <section className="mo-gallery">
            {collectionImages.slice(0, 5).map((item, index) => (
              <article key={`mo-gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery", undefined, { className: "mo-gallery-card" })}>
                <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                <div>
                  <small>{text(item.tag, "Executive visual")}</small>
                  <strong>{text(item.subtitle || item.title, industry)}</strong>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section id="contact" className="mo-cta">
          <h2>{text(footer.headline, `Move ${brandName} with confidence.`)}</h2>
          <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Request Consultation"), { className: "mo-btn" })}>
            {text(footer.cta, "Request Consultation")}
          </button>
        </section>

        <footer className="mo-footer">
          <span>{brandName}</span>
          <span>{tagline}</span>
        </footer>
      </div>
    </div>
  );
}
