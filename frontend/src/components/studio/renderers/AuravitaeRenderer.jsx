import React, { useMemo } from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function safeTemplateId(value) {
  return text(value, "premium-landing").toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

const TEMPLATE_PRESETS = {
  "premium-landing": {
    nav: ["Experience", "Proof", "Gallery", "Offers", "Contact"],
    ctas: ["Explore Experience", "View Collection"],
    tone: "emerald",
    heroMode: "luxury",
  },
  "saas-product": {
    nav: ["Platform", "Workflow", "Proof", "Pricing", "Demo"],
    ctas: ["Request Access", "Watch Demo"],
    tone: "blue",
    heroMode: "tech",
  },
  "local-business": {
    nav: ["Services", "Reviews", "Gallery", "Booking", "Contact"],
    ctas: ["Book a Visit", "View Services"],
    tone: "warm",
    heroMode: "trust",
  },
  "hospitality-experience": {
    nav: ["Experience", "Suites", "Gallery", "Reservations", "Reviews"],
    ctas: ["Reserve Now", "Explore Stay"],
    tone: "gold",
    heroMode: "editorial",
  },
  "portfolio-personal": {
    nav: ["Story", "Work", "Process", "Gallery", "Contact"],
    ctas: ["View Work", "Start Conversation"],
    tone: "cream",
    heroMode: "minimal",
  },
  "professional-service": {
    nav: ["Expertise", "Trust", "Process", "Results", "Contact"],
    ctas: ["Request Consultation", "See Process"],
    tone: "steel",
    heroMode: "authority",
  },
  "ecommerce-product": {
    nav: ["Product", "Benefits", "Details", "Gallery", "Buy"],
    ctas: ["Shop Now", "Compare Details"],
    tone: "violet",
    heroMode: "product",
  },
  "real-estate": {
    nav: ["Highlights", "Collection", "Destinations", "Viewing", "Contact"],
    ctas: ["Explore Properties", "Private Collection"],
    tone: "emerald",
    heroMode: "estate",
  },
  "event-conference": {
    nav: ["Agenda", "Speakers", "Venue", "Tickets", "Contact"],
    ctas: ["Get Tickets", "View Agenda"],
    tone: "violet",
    heroMode: "stage",
  },
  "mobile-app": {
    nav: ["App", "Features", "Screens", "Reviews", "Download"],
    ctas: ["Download App", "See Features"],
    tone: "blue",
    heroMode: "app",
  },
  "agency-studio": {
    nav: ["Studio", "Work", "Process", "Clients", "Contact"],
    ctas: ["Start Project", "View Work"],
    tone: "rose",
    heroMode: "creative",
  },
  "blog-magazine": {
    nav: ["Featured", "Categories", "Latest", "Editorial", "Subscribe"],
    ctas: ["Subscribe", "Read Latest"],
    tone: "gold",
    heroMode: "magazine",
  },
};

function getPreset(templateId) {
  return TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS["premium-landing"];
}

export default function PremiumWebsiteRenderer({
  website,
  editing = false,
  selectedId = null,
  onSelect,
}) {
  const state = website || {};
  const overrides = state.overrides || {};

  const brandName = text(state.brandName, "Auravitae");
  const tagline = text(state.tagline, "Exceptional experiences. Extraordinary presentation.");
  const industry = text(state.industry, "premium brand");
  const primary = text(state.primaryColor, "#0F7A5A");
  const secondary = text(state.secondaryColor, "#040605");

  const hero = state.hero || {};
  const footer = state.footer || {};
  const media = state.mediaAssets || {};
  const templateId = safeTemplateId(state.templateId);
  const preset = useMemo(() => getPreset(templateId), [templateId]);

  const navigation = list(state.navigation, preset.nav);
  const [primaryCtaLabel, secondaryCtaLabel] = preset.ctas || [
    text(hero.primaryCta, "Explore"),
    text(hero.secondaryCta, "View More"),
  ];

  const stats = list(state.stats, [
    { title: "1,250+", label: "Premium moments" },
    { title: "42", label: "Signature details" },
    { title: "15+", label: "Years of excellence" },
    { title: "98%", label: "Client confidence" },
  ]);

  const features = list(state.features, [
    {
      title: "Tailored to perfection",
      description: "A cinematic premium experience shaped around the subject, not a generic template.",
    },
    {
      title: "Visual storytelling",
      description: "Hero video, layered cards, elegant rhythm and luxury-grade visual hierarchy.",
    },
    {
      title: "Built for trust",
      description: "A refined structure that makes every subject feel credible, memorable and high-end.",
    },
    {
      title: "Conversion flow",
      description: "Every section guides the visitor toward one clear, premium action.",
    },
  ]);

  const sections = list(state.sections, [
    {
      title: "A bespoke approach",
      description: `We craft a premium digital presentation for ${industry}, with atmosphere, clarity and a strong first impression.`,
      items: ["Cinematic hero", "Premium story", "Elegant sections"],
    },
    {
      title: "Designed like a collection",
      description: "Content is presented as curated moments, not ordinary cards.",
      items: ["Bento layout", "Glass panels", "Editorial rhythm"],
    },
    {
      title: "Made to feel expensive",
      description: "Deep contrast, large serif titles, refined spacing and motion-ready backgrounds.",
      items: ["Luxury typography", "Video background", "High-end CTA"],
    },
  ]);

  const pricing = list(state.pricing, []);
  const collectionImages = list(media.collectionImages, []);
  const customElements = list(state.customElements, []);

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");

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

  function dataId(id) {
    return String(id || "").replace(/"/g, "&quot;");
  }

  function editable(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": dataId(id),
      className: `${extra.className || ""}${editing ? " gpr-editable" : ""}${selectedId === id ? " gpr-editable-selected" : ""} ${overrideClass(id)}`.trim(),
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
      "data-gpr-id": dataId(id),
      className: `${extra.className || ""}${editing ? " gpr-editable" : ""}${selectedId === id ? " gpr-editable-selected" : ""} ${overrideClass(id)}`.trim(),
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
              mediaUrl: overrideMediaUrl(id, mediaUrl || ""),
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
    };
  }

  function renderVideoBackground() {
    return (
      <div
        {...editableMedia(
          heroVideoUrl ? "mediaAssets.heroVideoUrl" : "mediaAssets.heroImageUrl",
          heroVideoUrl ? "video" : "image",
          heroVideoUrl || heroPosterUrl,
          { className: "gpr-video-stage" }
        )}
      >
        {heroVideoUrl ? (
          <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
        ) : heroPosterUrl ? (
          <img src={heroPosterUrl} alt="" />
        ) : (
          <div className="gpr-video-fallback" />
        )}
        <div className="gpr-video-overlay" />
      </div>
    );
  }

  function renderHeroCards() {
    return (
      <div {...editable("stats", "hero stat cards", undefined, { className: "gpr-hero-stats" })}>
        {stats.slice(0, 4).map((stat, index) => (
          <article key={`stat-${index}`} {...editable(`stats.${index}`, "stat card", undefined, { className: "gpr-stat-card" })}>
            <div className="gpr-stat-icon">{["◇", "◎", "✦", "♕"][index] || "✦"}</div>
            <strong {...editable(`stats.${index}.title`, "stat title", text(stat.title, ""))}>
              {text(stat.title, "")}
            </strong>
            <span {...editable(`stats.${index}.label`, "stat label", text(stat.label, ""))}>
              {text(stat.label, "")}
            </span>
          </article>
        ))}
      </div>
    );
  }

  function renderFeatureMosaic() {
    const heroImage = collectionImages[0]?.imageUrl || heroPosterUrl;
    const sideImage = collectionImages[1]?.imageUrl || collectionImages[0]?.imageUrl || heroPosterUrl;
    const bigImage = collectionImages[2]?.imageUrl || collectionImages[0]?.imageUrl || heroPosterUrl;

    return (
      <section id="proof" {...editable("premiumMosaic", "premium mosaic", undefined, { className: "gpr-mosaic" })}>
        <article {...editable("sections.0", "signature story", undefined, { className: "gpr-mosaic-story" })}>
          <p {...editable("sections.0.eyebrow", "mosaic eyebrow", text(sections[0]?.eyebrow, "Tailored to perfection"))}>
            {text(sections[0]?.eyebrow, "Tailored to perfection")}
          </p>
          <h2 {...editable("sections.0.title", "mosaic title", text(sections[0]?.title, "A bespoke approach to premium presentation"))}>
            {text(sections[0]?.title, "A bespoke approach to premium presentation")}
          </h2>
          <span {...editable("sections.0.description", "mosaic description", text(sections[0]?.description, ""))}>
            {text(sections[0]?.description, "")}
          </span>
          <button {...editable("sections.0.cta", "mosaic CTA", "Discover the philosophy", { className: "gpr-link-button" })}>
            Discover the philosophy <b>→</b>
          </button>
        </article>

        <article {...editable("mediaAssets.collectionImages.0", "video card", undefined, { className: "gpr-mosaic-video" })}>
          {heroImage ? (
            <img src={heroImage} alt="" {...editableMedia("mediaAssets.collectionImages.0.imageUrl", "image", heroImage)} />
          ) : null}
          <div className="gpr-play">▶</div>
        </article>

        <div className="gpr-mosaic-stack">
          {features.slice(0, 2).map((item, index) => (
            <article key={`mini-feature-${index}`} {...editable(`features.${index}`, "mini feature", undefined, { className: "gpr-mini-feature" })}>
              <p {...editable(`features.${index}.title`, "mini feature title", text(item.title, ""))}>
                {text(item.title, "")}
              </p>
              <span {...editable(`features.${index}.description`, "mini feature description", text(item.description, ""))}>
                {text(item.description, "")}
              </span>
              <button className="gpr-small-plus">+</button>
            </article>
          ))}
        </div>

        <article {...editable("featuredDestination", "featured visual card", undefined, { className: "gpr-featured-visual" })}>
          {bigImage ? (
            <img src={bigImage} alt="" {...editableMedia("mediaAssets.collectionImages.2.imageUrl", "image", bigImage)} />
          ) : null}
          <div>
            <p>{text(state.galleryIntro?.eyebrow, "Featured direction")}</p>
            <strong>{text(state.galleryIntro?.headline, industry)}</strong>
          </div>
        </article>

        {sideImage ? (
          <div className="gpr-hidden-preload">
            <img src={sideImage} alt="" />
          </div>
        ) : null}
      </section>
    );
  }

  function renderFeatures() {
    return (
      <section id="features" {...editable("features", "features section", undefined, { className: "gpr-feature-strip" })}>
        {features.slice(0, 4).map((item, index) => (
          <article key={`feature-${index}`} {...editable(`features.${index}`, "feature card", undefined, { className: "gpr-strip-card" })}>
            <div className="gpr-strip-icon">{["◇", "⚡", "◎", "⌁"][index] || "✦"}</div>
            <div>
              <h3 {...editable(`features.${index}.title`, "feature title", text(item.title, "Premium Feature"))}>
                {text(item.title, "Premium Feature")}
              </h3>
              <p {...editable(`features.${index}.description`, "feature description", text(item.description, ""))}>
                {text(item.description, "")}
              </p>
              <span>Learn more →</span>
            </div>
          </article>
        ))}
      </section>
    );
  }

  function renderGallery() {
    if (!collectionImages.length) return null;

    return (
      <section id="gallery" {...editable("gallery", "gallery section", undefined, { className: "gpr-gallery-section" })}>
        <div className="gpr-section-kicker">
          <p {...editable("galleryIntro.eyebrow", "gallery eyebrow", text(state.galleryIntro?.eyebrow, "Exceptional collection"))}>
            {text(state.galleryIntro?.eyebrow, "Exceptional collection")}
          </p>
          <a href="#contact">View all →</a>
        </div>

        <div {...editable("mediaAssets.collectionImages", "gallery grid", undefined, { className: "gpr-gallery-grid" })}>
          {collectionImages.slice(0, 4).map((item, index) => (
            <article key={`gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery card", undefined, { className: "gpr-gallery-card" })}>
              <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
              <div>
                <small>{text(item.tag, index === 0 ? "New vision" : "Private selection")}</small>
                <strong>{text(item.subtitle || item.title, industry)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderSections() {
    return (
      <section id="collection" {...editable("sectionsArea", "sections area", undefined, { className: "gpr-editorial-section" })}>
        <div {...editable("sectionIntro", "section intro", undefined, { className: "gpr-editorial-intro" })}>
          <p {...editable("sectionIntro.eyebrow", "section eyebrow", text(state.sectionIntro?.eyebrow, "Curated architecture"))}>
            {text(state.sectionIntro?.eyebrow, "Curated architecture")}
          </p>
          <h2 {...editable("sectionIntro.headline", "section headline", text(state.sectionIntro?.headline, "Designed to feel rare, cinematic and unmistakably premium."))}>
            {text(state.sectionIntro?.headline, "Designed to feel rare, cinematic and unmistakably premium.")}
          </h2>
        </div>

        <div {...editable("sections", "sections grid", undefined, { className: "gpr-editorial-grid" })}>
          {sections.slice(0, 3).map((section, index) => (
            <article key={`section-${index}`} {...editable(`sections.${index}`, "section card", undefined, { className: "gpr-editorial-card" })}>
              <span className="gpr-section-number">0{index + 1}</span>
              <h3 {...editable(`sections.${index}.title`, "section title", text(section.title, "Premium Section"))}>
                {text(section.title, "Premium Section")}
              </h3>
              <p {...editable(`sections.${index}.description`, "section description", text(section.description, ""))}>
                {text(section.description, "")}
              </p>
              <div className="gpr-chip-row">
                {list(section.items, ["Premium", "Modern", "Responsive"]).slice(0, 4).map((item, idx) => (
                  <span key={`chip-${index}-${idx}`} {...editable(`sections.${index}.items.${idx}`, "chip", item)}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderPricing() {
    if (!pricing.length) return null;

    return (
      <section id="pricing" {...editable("pricing", "pricing section", undefined, { className: "gpr-pricing" })}>
        {pricing.slice(0, 3).map((plan, index) => (
          <article key={`price-${index}`} {...editable(`pricing.${index}`, "pricing card", undefined, { className: "gpr-price-card" })}>
            <p>{text(plan.name, "Signature")}</p>
            <h3>{text(plan.price, "Custom")}</h3>
            <span>{text(plan.description, "Premium offer tailored to the project.")}</span>
            <ul>
              {list(plan.features, ["Premium design", "Responsive build", "Launch ready"]).slice(0, 4).map((item, idx) => (
                <li key={`price-${index}-${idx}`}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    );
  }

  return (
    <div
      {...editable("site", "site wrapper", undefined, {
        className: `gpr-site gpr-template-${templateId} gpr-tone-${preset.tone} gpr-mode-${preset.heroMode}`,
        style: {
          "--gpr-primary": primary,
          "--gpr-secondary": secondary,
        },
      })}
    >
      {renderVideoBackground()}

      <style>{`
        .gpr-site {
          width: 100%;
          min-height: 100vh;
          position: relative;
          color: #f8f4ea;
          background: #030504;
          overflow: visible;
          isolation: isolate;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .gpr-video-stage {
          position: absolute;
          inset: 0;
          min-height: 100vh;
          z-index: 0;
          overflow: hidden;
          pointer-events: ${editing ? "auto" : "none"};
          background: #030504;
        }

        .gpr-video-stage video,
        .gpr-video-stage img,
        .gpr-video-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.15) contrast(1.12) brightness(.72);
          transform: scale(1.035);
        }

        .gpr-video-fallback {
          background:
            radial-gradient(circle at 74% 30%, color-mix(in srgb, var(--gpr-primary) 28%, transparent), transparent 28%),
            linear-gradient(120deg, #07110e 0%, #030504 48%, #120d08 100%);
        }

        .gpr-video-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 78% 36%, rgba(255,255,255,.08), transparent 26%),
            linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.43) 42%, rgba(0,0,0,.74) 100%),
            linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.86));
        }

        .gpr-site::before {
          content: "";
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 92px 92px;
          opacity: .08;
          mask-image: linear-gradient(180deg, black, transparent 82%);
        }

        .gpr-page {
          position: relative;
          z-index: 2;
          width: min(1320px, calc(100% - 52px));
          margin: 0 auto;
        }

        .gpr-nav {
          height: 92px;
          display: grid;
          grid-template-columns: 260px 1fr auto;
          align-items: center;
          gap: 28px;
        }

        .gpr-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .gpr-monogram {
          font-family: Georgia, "Times New Roman", serif;
          color: #c8944f;
          font-size: 46px;
          line-height: 1;
          letter-spacing: -.08em;
          text-shadow: 0 0 26px rgba(200,148,79,.22);
        }

        .gpr-logo-text strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 23px;
          letter-spacing: .18em;
          text-transform: uppercase;
          line-height: .88;
        }

        .gpr-logo-text span {
          display: block;
          margin-top: 7px;
          color: rgba(248,244,234,.58);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .34em;
        }

        .gpr-nav-links {
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: rgba(248,244,234,.76);
        }

        .gpr-nav-links a {
          color: inherit;
          text-decoration: none;
          transition: color .2s ease, transform .2s ease;
        }

        .gpr-nav-links a:hover {
          color: #d7a867;
          transform: translateY(-2px);
        }

        .gpr-nav-action {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .gpr-private-pill {
          min-width: 176px;
          height: 45px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 10px;
          background: rgba(255,255,255,.07);
          color: #f8f4ea;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: .06em;
          text-transform: uppercase;
          backdrop-filter: blur(18px);
        }

        .gpr-menu-dot {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.2);
          display: grid;
          place-items: center;
          color: #f8f4ea;
          background: rgba(0,0,0,.24);
        }

        .gpr-hero {
          min-height: 730px;
          position: relative;
          display: grid;
          grid-template-columns: 1.08fr .92fr;
          align-items: center;
          gap: 40px;
          padding: 58px 0 70px;
        }

        .gpr-scroll-line {
          position: absolute;
          left: 0;
          top: 170px;
          bottom: 150px;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(248,244,234,.42), transparent);
        }

        .gpr-scroll-line::before {
          content: "";
          position: absolute;
          left: -4px;
          top: 22%;
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #f8f4ea;
        }

        .gpr-hero-copy {
          padding-left: 84px;
        }

        .gpr-eyebrow {
          color: rgba(248,244,234,.76);
          text-transform: uppercase;
          letter-spacing: .42em;
          font-size: 13px;
          margin-bottom: 24px;
        }

        .gpr-hero h1 {
          font-family: Georgia, "Times New Roman", serif;
          max-width: 790px;
          margin: 0;
          color: #fffaf0;
          font-size: clamp(74px, 9vw, 140px);
          line-height: .86;
          font-weight: 400;
          letter-spacing: -.075em;
          text-wrap: balance;
        }

        .gpr-hero h1 em {
          color: #c8944f;
          font-style: normal;
        }

        .gpr-hero-subtitle {
          max-width: 680px;
          margin: 28px 0 0;
          color: rgba(248,244,234,.78);
          font-size: 14px;
          line-height: 2;
          text-transform: uppercase;
          letter-spacing: .32em;
        }

        .gpr-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 36px;
          flex-wrap: wrap;
        }

        .gpr-btn {
          height: 54px;
          padding: 0 30px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,.14);
          color: #f8f4ea;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
          background: color-mix(in srgb, var(--gpr-primary) 78%, #03110c);
          box-shadow: 0 22px 60px color-mix(in srgb, var(--gpr-primary) 22%, transparent);
          cursor: pointer;
        }

        .gpr-btn-secondary {
          background: rgba(0,0,0,.18);
          backdrop-filter: blur(16px);
        }

        .gpr-hero-side {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          min-height: 520px;
        }

        .gpr-hero-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: min(470px, 100%);
          align-self: end;
          margin-top: 320px;
        }

        .gpr-stat-card {
          min-height: 124px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 12px;
          background: rgba(255,255,255,.075);
          backdrop-filter: blur(22px);
          padding: 22px;
          box-shadow: 0 24px 80px rgba(0,0,0,.28);
        }

        .gpr-stat-icon {
          color: #d7a867;
          font-size: 22px;
          margin-bottom: 14px;
        }

        .gpr-stat-card strong {
          display: block;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 31px;
          font-weight: 400;
        }

        .gpr-stat-card span {
          display: block;
          margin-top: 6px;
          color: rgba(248,244,234,.68);
          font-size: 12px;
          line-height: 1.45;
        }

        .gpr-feature-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          margin: 0 0 34px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 18px;
          background: rgba(0,0,0,.36);
          backdrop-filter: blur(22px);
          overflow: hidden;
        }

        .gpr-strip-card {
          min-height: 150px;
          padding: 24px;
          display: flex;
          gap: 18px;
          border-right: 1px solid rgba(255,255,255,.12);
        }

        .gpr-strip-card:last-child {
          border-right: 0;
        }

        .gpr-strip-icon {
          color: #d7a867;
          font-size: 29px;
        }

        .gpr-strip-card h3 {
          margin: 0 0 10px;
          color: #d7a867;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .gpr-strip-card p {
          margin: 0;
          color: rgba(248,244,234,.76);
          line-height: 1.55;
          font-size: 14px;
        }

        .gpr-strip-card span {
          display: block;
          margin-top: 15px;
          color: color-mix(in srgb, var(--gpr-primary) 44%, #f8f4ea);
          font-size: 13px;
          font-weight: 800;
        }

        .gpr-mosaic {
          display: grid;
          grid-template-columns: 1.2fr .9fr .9fr 1.25fr;
          grid-template-rows: 150px 150px;
          gap: 12px;
          padding: 28px 0 38px;
        }

        .gpr-mosaic-story,
        .gpr-mosaic-video,
        .gpr-mini-feature,
        .gpr-featured-visual {
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(0,0,0,.44);
          backdrop-filter: blur(22px);
          box-shadow: 0 28px 90px rgba(0,0,0,.32);
        }

        .gpr-mosaic-story {
          grid-row: span 2;
          padding: 34px;
          background:
            radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--gpr-primary) 16%, transparent), transparent 42%),
            rgba(0,0,0,.52);
        }

        .gpr-mosaic-story p,
        .gpr-featured-visual p {
          margin: 0 0 18px;
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 12px;
          font-weight: 900;
        }

        .gpr-mosaic-story h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 36px;
          line-height: 1.03;
          font-weight: 400;
        }

        .gpr-mosaic-story span {
          display: block;
          margin-top: 24px;
          color: rgba(248,244,234,.72);
          line-height: 1.7;
          font-size: 14px;
        }

        .gpr-link-button {
          margin-top: 30px;
          padding: 0;
          border: 0;
          border-bottom: 1px solid #d7a867;
          background: transparent;
          color: #f8f4ea;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 800;
          font-size: 12px;
          height: 32px;
        }

        .gpr-mosaic-video {
          grid-row: span 2;
          position: relative;
        }

        .gpr-mosaic-video img,
        .gpr-featured-visual img,
        .gpr-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.04) contrast(1.08) brightness(.86);
          transition: transform .5s ease;
        }

        .gpr-mosaic-video:hover img,
        .gpr-featured-visual:hover img,
        .gpr-gallery-card:hover img {
          transform: scale(1.06);
        }

        .gpr-play {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 66px;
          height: 66px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.72);
          background: rgba(0,0,0,.22);
          display: grid;
          place-items: center;
          backdrop-filter: blur(12px);
        }

        .gpr-mosaic-stack {
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 12px;
        }

        .gpr-mini-feature {
          padding: 22px;
          position: relative;
          background:
            radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--gpr-primary) 18%, transparent), transparent 38%),
            rgba(0,0,0,.48);
        }

        .gpr-mini-feature p {
          margin: 0 0 12px;
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 900;
        }

        .gpr-mini-feature span {
          color: rgba(248,244,234,.72);
          line-height: 1.5;
          font-size: 13px;
        }

        .gpr-small-plus {
          position: absolute;
          right: 18px;
          bottom: 16px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.2);
          background: transparent;
          color: #d7a867;
        }

        .gpr-featured-visual {
          grid-row: span 2;
          position: relative;
        }

        .gpr-featured-visual div {
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 24px;
        }

        .gpr-featured-visual strong {
          font-family: Georgia, "Times New Roman", serif;
          color: #d7a867;
          font-size: 27px;
          font-weight: 400;
        }

        .gpr-editorial-section {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 26px;
          padding: 60px 0;
        }

        .gpr-editorial-intro {
          position: sticky;
          top: 28px;
          align-self: start;
        }

        .gpr-editorial-intro p,
        .gpr-section-kicker p {
          margin: 0 0 18px;
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 12px;
          font-weight: 900;
        }

        .gpr-editorial-intro h2 {
          font-family: Georgia, "Times New Roman", serif;
          margin: 0;
          max-width: 560px;
          font-size: clamp(42px, 5vw, 72px);
          line-height: .95;
          font-weight: 400;
          letter-spacing: -.04em;
        }

        .gpr-editorial-grid {
          display: grid;
          gap: 14px;
        }

        .gpr-editorial-card {
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 18px;
          background: rgba(0,0,0,.38);
          backdrop-filter: blur(22px);
          padding: 30px;
        }

        .gpr-section-number {
          color: #d7a867;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .gpr-editorial-card h3 {
          margin: 22px 0 14px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 400;
        }

        .gpr-editorial-card p {
          color: rgba(248,244,234,.72);
          line-height: 1.7;
        }

        .gpr-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 22px;
        }

        .gpr-chip-row span {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          padding: 8px 11px;
          background: rgba(255,255,255,.055);
          color: rgba(248,244,234,.78);
          font-size: 12px;
        }

        .gpr-gallery-section {
          padding: 34px 0 70px;
        }

        .gpr-section-kicker {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .gpr-section-kicker a {
          color: rgba(248,244,234,.78);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
        }

        .gpr-gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .gpr-gallery-card {
          position: relative;
          min-height: 260px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(0,0,0,.34);
        }

        .gpr-gallery-card div {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(0,0,0,.46);
          border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(14px);
        }

        .gpr-gallery-card small {
          display: block;
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 10px;
          margin-bottom: 7px;
        }

        .gpr-gallery-card strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 400;
        }

        .gpr-pricing {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 20px 0 70px;
        }

        .gpr-price-card {
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 18px;
          padding: 28px;
          background: rgba(0,0,0,.38);
          backdrop-filter: blur(22px);
        }

        .gpr-price-card p {
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 900;
        }

        .gpr-price-card h3 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 42px;
          font-weight: 400;
          margin: 8px 0;
        }

        .gpr-price-card span,
        .gpr-price-card li {
          color: rgba(248,244,234,.72);
          line-height: 1.6;
        }

        .gpr-price-card ul {
          margin-top: 20px;
          padding-left: 18px;
        }

        .gpr-final-cta {
          margin: 20px 0 40px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 22px;
          padding: 52px;
          background:
            radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--gpr-primary) 18%, transparent), transparent 34%),
            rgba(0,0,0,.48);
          backdrop-filter: blur(24px);
        }

        .gpr-final-cta p {
          color: #d7a867;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 12px;
          font-weight: 900;
        }

        .gpr-final-cta h2 {
          max-width: 820px;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 6vw, 86px);
          line-height: .94;
          font-weight: 400;
        }

        .gpr-footer {
          padding: 28px 0 46px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: rgba(248,244,234,.58);
          border-top: 1px solid rgba(255,255,255,.12);
        }

        .gpr-hidden-preload {
          display: none;
        }

        .gpr-editable {
          cursor: pointer;
          outline: 1px dashed rgba(215,168,103,.35);
          outline-offset: 4px;
        }

        .gpr-editable:hover,
        .gpr-editable-selected {
          outline-color: rgba(215,168,103,.95);
          background: rgba(215,168,103,.04);
        }

        .gpr-tone-blue {
          --gpr-primary: #376BFF;
        }

        .gpr-tone-violet {
          --gpr-primary: #7C4DFF;
        }

        .gpr-tone-rose {
          --gpr-primary: #C94C7A;
        }

        .gpr-tone-gold {
          --gpr-primary: #B98A4B;
        }

        .gpr-tone-warm {
          --gpr-primary: #A76A3E;
        }

        .gpr-tone-steel {
          --gpr-primary: #6F8798;
        }

        .gpr-tone-cream {
          --gpr-primary: #BDA77B;
        }

        @media (max-width: 1050px) {
          .gpr-page {
            width: min(100% - 28px, 760px);
          }

          .gpr-nav {
            grid-template-columns: 1fr auto;
          }

          .gpr-nav-links {
            display: none;
          }

          .gpr-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .gpr-hero-copy {
            padding-left: 0;
          }

          .gpr-scroll-line {
            display: none;
          }

          .gpr-hero h1 {
            font-size: 62px;
          }

          .gpr-hero-side {
            min-height: auto;
          }

          .gpr-hero-stats,
          .gpr-feature-strip,
          .gpr-mosaic,
          .gpr-editorial-section,
          .gpr-gallery-grid,
          .gpr-pricing {
            grid-template-columns: 1fr;
          }

          .gpr-hero-stats {
            margin-top: 20px;
          }

          .gpr-feature-strip {
            border-radius: 16px;
          }

          .gpr-strip-card {
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,.12);
          }

          .gpr-mosaic {
            grid-template-rows: auto;
          }

          .gpr-mosaic-story,
          .gpr-mosaic-video,
          .gpr-featured-visual {
            grid-row: auto;
            min-height: 280px;
          }

          .gpr-gallery-card {
            min-height: 300px;
          }

          .gpr-final-cta {
            padding: 32px;
          }

          .gpr-footer {
            flex-direction: column;
          }
        }
      `}</style>

      {customElements.map((item, index) => {
        const id = `customElements.${index}`;
        const value = text(item?.text, "Double click text");
        return (
          <div
            key={id}
            {...editable(id, "custom text", value, {
              className: "gpr-custom-element",
              style: item?.styles || {},
            })}
          >
            {value}
          </div>
        );
      })}

      <div className="gpr-page">
        <nav {...editable("nav", "navigation", undefined, { className: "gpr-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "gpr-logo" })}>
            <span className="gpr-monogram">{brandName.slice(0, 1)}</span>
            <span className="gpr-logo-text">
              <strong>{brandName}</strong>
              <span>{industry}</span>
            </span>
          </div>

          <div className="gpr-nav-links">
            {navigation.slice(0, 6).map((label, index) => (
              <a key={`nav-${index}`} href={["#experience", "#features", "#proof", "#gallery", "#pricing", "#contact"][index] || "#experience"}>
                {label}
              </a>
            ))}
          </div>

          <div className="gpr-nav-action">
            <button {...editable("hero.primaryCta", "nav CTA", primaryCtaLabel, { className: "gpr-private-pill" })}>
              {primaryCtaLabel}
            </button>
            <div className="gpr-menu-dot">☰</div>
          </div>
        </nav>

        <section id="experience" {...editable("heroSection", "hero section", undefined, { className: "gpr-hero" })}>
          <div className="gpr-scroll-line" />
          <div className="gpr-hero-copy">
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "gpr-eyebrow" })}>
              {text(hero.eyebrow, industry)}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `Beyond Extraordinary.`))}>
              {text(hero.headline, `Beyond Extraordinary.`)
                .split(" ")
                .map((word, index, arr) =>
                  index === arr.length - 1 ? (
                    <React.Fragment key={`${word}-${index}`}>
                      <em>{word}</em>{" "}
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={`${word}-${index}`}>{word} </React.Fragment>
                  )
                )}
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline), { className: "gpr-hero-subtitle" })}>
              {text(hero.subheadline, tagline)}
            </p>

            <div {...editable("hero.actions", "hero actions", undefined, { className: "gpr-actions" })}>
              <button {...editable("hero.primaryCta", "primary button", primaryCtaLabel, { className: "gpr-btn" })}>
                {primaryCtaLabel} →
              </button>
              <button {...editable("hero.secondaryCta", "secondary button", secondaryCtaLabel, { className: "gpr-btn gpr-btn-secondary" })}>
                {secondaryCtaLabel}
              </button>
            </div>
          </div>

          <div className="gpr-hero-side">{renderHeroCards()}</div>
        </section>

        {renderFeatures()}
        {renderFeatureMosaic()}
        {renderSections()}
        {renderGallery()}
        {renderPricing()}

        <section id="contact" {...editable("footerCta", "footer CTA", undefined, { className: "gpr-final-cta" })}>
          <p>{industry}</p>
          <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Ready to elevate ${brandName}?`))}>
            {text(footer.headline, `Ready to elevate ${brandName}?`)}
          </h2>
          <button {...editable("footer.cta", "footer button", text(footer.cta, primaryCtaLabel), { className: "gpr-btn" })}>
            {text(footer.cta, primaryCtaLabel)} →
          </button>
        </section>

        <footer {...editable("footer", "footer", undefined, { className: "gpr-footer" })}>
          <span>{brandName}</span>
          <span>{tagline}</span>
        </footer>
      </div>
    </div>
  );
}
