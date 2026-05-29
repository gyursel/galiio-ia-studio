import React from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function clampItems(value, fallback = [], count = 3) {
  return list(value, fallback).slice(0, count);
}

export default function AstraRenderer({
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

  const brandName = text(state.brandName, "ASTRA");
  const industry = text(state.industry, "premium digital studio");
  const tagline = text(
    state.tagline,
    "A precise, cinematic and conversion-focused digital experience for modern premium brands."
  );
  const primary = text(state.primaryColor, "#8B5CF6");
  const secondary = text(state.secondaryColor, "#38BDF8");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const navItems = list(state.navigation, ["Overview", "System", "Work", "Proof", "Contact"]);

  const stats = clampItems(state.stats, [
    { title: "4.9", label: "Client rating" },
    { title: "120+", label: "Projects shipped" },
    { title: "32%", label: "Avg. lift" },
  ], 4);

  const features = clampItems(state.features, [
    {
      title: "Premium clarity",
      description: "A stripped-back visual system with strong hierarchy, calm motion and high-end spacing.",
    },
    {
      title: "Cinematic depth",
      description: "Dark editorial atmosphere, glass layers, subtle glow and media-first presentation.",
    },
    {
      title: "Conversion discipline",
      description: "Every section is built to guide attention, communicate trust and move users forward.",
    },
  ], 3);

  const sections = clampItems(state.sections, [
    {
      title: "Strategy before surface",
      description: `A professional premium renderer for ${industry}, focused on positioning, trust and visual authority.`,
      items: ["Positioning", "Hierarchy", "Conversion"],
    },
    {
      title: "Minimal, not empty",
      description: "The design removes noise while keeping rich atmosphere, depth and persuasive structure.",
      items: ["Editorial rhythm", "Whitespace", "Signal"],
    },
    {
      title: "Built to scale",
      description: "Flexible sections adapt to services, products, portfolios, agencies and high-ticket brands.",
      items: ["Responsive", "Editable", "Reusable"],
    },
  ], 3);

  const pricing = clampItems(state.pricing, [
    {
      name: "Essential",
      price: "€990",
      description: "A focused premium landing page with clear story, CTA and trust sections.",
      features: ["Premium layout", "Responsive design", "Editable sections"],
    },
    {
      name: "Signature",
      price: "€2.4k",
      description: "A complete high-end digital presence with refined visual system and conversion flow.",
      features: ["Full site system", "Gallery / proof", "Premium CTA flow"],
      featured: true,
    },
    {
      name: "Bespoke",
      price: "Custom",
      description: "A fully tailored experience for brands that need a more cinematic, custom direction.",
      features: ["Custom sections", "Media direction", "Advanced polish"],
    },
  ], 3);

  const testimonials = clampItems(state.testimonials, [
    {
      quote: "The final result felt premium, sharp and far more expensive than a typical generated page.",
      name: "M. Vasilev",
      role: "Founder",
    },
    {
      quote: "Clean structure, strong visual rhythm and exactly the level of professionalism we needed.",
      name: "Elena R.",
      role: "Creative Lead",
    },
  ], 2);

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
      className: [
        extra.className || "",
        editing ? "ar-editable" : "",
        selectedId === id ? "ar-selected" : "",
        overrideClass(id),
      ].filter(Boolean).join(" "),
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
    const finalUrl = overrideMediaUrl(id, mediaUrl);
    return {
      "data-gpr-id": id,
      className: [
        extra.className || "",
        editing ? "ar-editable" : "",
        selectedId === id ? "ar-selected" : "",
        overrideClass(id),
      ].filter(Boolean).join(" "),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag: mediaType,
              mediaType,
              mediaUrl: finalUrl,
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
    };
  }

  const heroHeadline = text(hero.headline, `Premium presence for ${brandName}`);
  const heroSubheadline = text(hero.subheadline, tagline);
  const primaryCta = text(hero.primaryCta, "Start Project");
  const secondaryCta = text(hero.secondaryCta, "View System");
  const heroMediaUrl = heroVideoUrl || heroPosterUrl || collectionImages[0]?.imageUrl || "";

  return (
    <div
      {...editable("site", "site wrapper", undefined, {
        className: "ar-site",
        style: { "--ar-primary": primary, "--ar-secondary": secondary },
      })}
    >
      <style>{`
        .ar-site {
          --ar-bg: #05060a;
          --ar-bg-2: #080a12;
          --ar-card: rgba(255,255,255,.052);
          --ar-card-2: rgba(255,255,255,.078);
          --ar-line: rgba(255,255,255,.105);
          --ar-line-strong: rgba(255,255,255,.22);
          --ar-text: #f7f7f2;
          --ar-muted: rgba(247,247,242,.66);
          --ar-soft: rgba(247,247,242,.42);
          --ar-ghost: rgba(247,247,242,.12);
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          isolation: isolate;
          color: var(--ar-text);
          background:
            radial-gradient(circle at 16% 14%, color-mix(in srgb, var(--ar-primary) 22%, transparent), transparent 34rem),
            radial-gradient(circle at 84% 8%, color-mix(in srgb, var(--ar-secondary) 16%, transparent), transparent 30rem),
            linear-gradient(180deg, #05060a 0%, #090a12 48%, #05060a 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ar-site *, .ar-site *::before, .ar-site *::after { box-sizing: border-box; }
        .ar-site button { font: inherit; }
        .ar-site a { color: inherit; text-decoration: none; }

        .ar-site::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: .34;
          background:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at 50% 8%, black, transparent 74%);
        }

        .ar-site::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(255,255,255,.035), transparent 18%, transparent 82%, rgba(255,255,255,.035));
          opacity: .32;
        }

        .ar-shell {
          position: relative;
          z-index: 2;
          width: min(1380px, calc(100% - 48px));
          margin: 0 auto;
        }

        .ar-glow-orb {
          position: absolute;
          z-index: 0;
          width: 34rem;
          height: 34rem;
          border-radius: 999px;
          filter: blur(18px);
          opacity: .42;
          pointer-events: none;
          background: radial-gradient(circle, color-mix(in srgb, var(--ar-primary) 18%, transparent), transparent 66%);
          animation: arFloat 9s ease-in-out infinite alternate;
        }
        .ar-glow-orb.one { top: 8rem; right: -14rem; }
        .ar-glow-orb.two { bottom: 18rem; left: -16rem; background: radial-gradient(circle, color-mix(in srgb, var(--ar-secondary) 14%, transparent), transparent 66%); animation-duration: 12s; }

        @keyframes arFloat {
          from { transform: translate3d(0,0,0) scale(1); }
          to { transform: translate3d(-32px, 38px, 0) scale(1.08); }
        }

        .ar-nav {
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid var(--ar-line);
        }

        .ar-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .ar-mark {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.04));
          border: 1px solid var(--ar-line-strong);
          box-shadow: 0 0 34px color-mix(in srgb, var(--ar-primary) 30%, transparent);
        }
        .ar-mark::after {
          content: "";
          position: absolute;
          inset: 9px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--ar-primary), var(--ar-secondary));
          box-shadow: 0 0 24px color-mix(in srgb, var(--ar-primary) 50%, transparent);
        }

        .ar-brand-name {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: .24em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ar-nav-links {
          display: flex;
          gap: 28px;
          color: var(--ar-soft);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .ar-nav-links a { transition: color .22s ease, text-shadow .22s ease; }
        .ar-nav-links a:hover { color: var(--ar-text); text-shadow: 0 0 24px color-mix(in srgb, var(--ar-primary) 55%, transparent); }

        .ar-nav-cta,
        .ar-btn {
          border: 1px solid color-mix(in srgb, var(--ar-primary) 42%, rgba(255,255,255,.16));
          color: var(--ar-text);
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--ar-primary) 22%, rgba(255,255,255,.08)), rgba(255,255,255,.045));
          box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 0 34px color-mix(in srgb, var(--ar-primary) 17%, transparent);
          backdrop-filter: blur(18px);
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, background .22s ease;
        }
        .ar-nav-cta {
          height: 42px;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          white-space: nowrap;
        }
        .ar-nav-cta:hover,
        .ar-btn:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--ar-primary) 72%, rgba(255,255,255,.28));
          box-shadow: 0 16px 60px color-mix(in srgb, var(--ar-primary) 28%, transparent), 0 0 0 1px rgba(255,255,255,.08) inset;
        }

        .ar-hero {
          min-height: 760px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(420px, .95fr);
          gap: 44px;
          align-items: center;
          padding: 72px 0 58px;
        }

        .ar-kicker {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          width: fit-content;
          margin-bottom: 24px;
          color: color-mix(in srgb, var(--ar-primary) 70%, white);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-kicker::before {
          content: "";
          width: 44px;
          height: 1px;
          background: linear-gradient(90deg, var(--ar-primary), transparent);
          box-shadow: 0 0 18px var(--ar-primary);
        }

        .ar-hero h1 {
          max-width: 860px;
          margin: 0;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          font-size: clamp(62px, 8.5vw, 136px);
          line-height: .86;
          letter-spacing: -.078em;
          font-weight: 500;
        }

        .ar-hero h1 span {
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,.72) 42%, color-mix(in srgb, var(--ar-primary) 58%, #fff) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 80px color-mix(in srgb, var(--ar-primary) 18%, transparent);
        }

        .ar-hero-copy {
          position: relative;
        }

        .ar-hero-copy::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -42px;
          width: min(420px, 70%);
          height: 1px;
          background: linear-gradient(90deg, var(--ar-primary), transparent);
          opacity: .7;
        }

        .ar-sub {
          max-width: 650px;
          margin: 30px 0 0;
          color: var(--ar-muted);
          font-size: 18px;
          line-height: 1.78;
        }

        .ar-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .ar-btn {
          min-height: 56px;
          border-radius: 999px;
          padding: 0 24px;
          font-weight: 950;
          letter-spacing: .04em;
        }
        .ar-btn-primary {
          background: linear-gradient(135deg, var(--ar-primary), color-mix(in srgb, var(--ar-primary) 58%, var(--ar-secondary)));
        }
        .ar-btn-ghost {
          background: rgba(255,255,255,.045);
          border-color: var(--ar-line);
          color: rgba(255,255,255,.82);
        }

        .ar-hero-media {
          min-height: 620px;
          position: relative;
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid var(--ar-line-strong);
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.025));
          box-shadow: 0 40px 130px rgba(0,0,0,.45), 0 0 90px color-mix(in srgb, var(--ar-primary) 15%, transparent);
        }
        .ar-hero-media::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 3;
          background: radial-gradient(circle at 70% 15%, rgba(255,255,255,.18), transparent 30%), linear-gradient(180deg, transparent 45%, rgba(5,6,10,.72));
          pointer-events: none;
        }
        .ar-hero-media video,
        .ar-hero-media img,
        .ar-media-fallback {
          width: 100%;
          height: 100%;
          min-height: 620px;
          display: block;
          object-fit: cover;
          filter: saturate(.78) contrast(1.08) brightness(.78);
          transform: scale(1.025);
        }
        .ar-media-fallback {
          background:
            linear-gradient(135deg, rgba(255,255,255,.12), transparent 28%),
            radial-gradient(circle at 68% 18%, color-mix(in srgb, var(--ar-primary) 42%, transparent), transparent 30%),
            radial-gradient(circle at 22% 78%, color-mix(in srgb, var(--ar-secondary) 30%, transparent), transparent 32%),
            #0a0c14;
        }

        .ar-floating-panel {
          position: absolute;
          z-index: 4;
          left: 24px;
          right: 24px;
          bottom: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 22px;
          align-items: end;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 24px;
          padding: 22px;
          background: rgba(7,8,14,.62);
          backdrop-filter: blur(22px);
          box-shadow: 0 24px 80px rgba(0,0,0,.35);
        }
        .ar-floating-panel small {
          display: block;
          margin-bottom: 9px;
          color: color-mix(in srgb, var(--ar-secondary) 70%, white);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-floating-panel strong {
          display: block;
          max-width: 360px;
          font-family: ui-serif, Georgia, serif;
          font-size: 28px;
          line-height: 1;
          font-weight: 500;
        }
        .ar-signal {
          width: 72px;
          height: 72px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.18);
          background: radial-gradient(circle, var(--ar-primary), transparent 62%);
          box-shadow: 0 0 38px color-mix(in srgb, var(--ar-primary) 55%, transparent);
        }

        .ar-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px;
          margin: 8px 0 112px;
          border: 1px solid var(--ar-line);
          background: var(--ar-line);
          border-radius: 28px;
          overflow: hidden;
        }
        .ar-stat {
          min-height: 150px;
          padding: 28px;
          background: rgba(255,255,255,.045);
          backdrop-filter: blur(18px);
        }
        .ar-stat strong {
          display: block;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(42px, 5vw, 76px);
          line-height: .9;
          font-weight: 500;
          letter-spacing: -.05em;
        }
        .ar-stat span {
          display: block;
          margin-top: 18px;
          color: var(--ar-soft);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .ar-section-head {
          display: grid;
          grid-template-columns: minmax(0, .82fr) minmax(0, 1fr);
          gap: 44px;
          align-items: end;
          margin-bottom: 34px;
        }
        .ar-label {
          color: color-mix(in srgb, var(--ar-primary) 70%, white);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-section-head h2 {
          margin: 12px 0 0;
          max-width: 650px;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(44px, 5.5vw, 84px);
          line-height: .92;
          letter-spacing: -.06em;
          font-weight: 500;
        }
        .ar-section-head p {
          color: var(--ar-muted);
          font-size: 16px;
          line-height: 1.75;
          margin: 0;
        }

        .ar-features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 116px;
        }
        .ar-feature,
        .ar-method-card,
        .ar-price,
        .ar-testimonial {
          border: 1px solid var(--ar-line);
          background: linear-gradient(180deg, rgba(255,255,255,.068), rgba(255,255,255,.032));
          box-shadow: 0 24px 90px rgba(0,0,0,.2);
          backdrop-filter: blur(18px);
          transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease, background .24s ease;
        }
        .ar-feature:hover,
        .ar-method-card:hover,
        .ar-price:hover,
        .ar-testimonial:hover {
          transform: translateY(-4px);
          border-color: color-mix(in srgb, var(--ar-primary) 44%, rgba(255,255,255,.2));
          box-shadow: 0 34px 110px rgba(0,0,0,.28), 0 0 54px color-mix(in srgb, var(--ar-primary) 13%, transparent);
          background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04));
        }
        .ar-feature {
          min-height: 320px;
          border-radius: 30px;
          padding: 30px;
          position: relative;
          overflow: hidden;
        }
        .ar-feature::before {
          content: "";
          position: absolute;
          inset: auto 28px 0 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--ar-primary), transparent);
          opacity: .58;
        }
        .ar-feature-index {
          color: var(--ar-soft);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .18em;
        }
        .ar-feature h3 {
          margin: 78px 0 14px;
          max-width: 320px;
          font-family: ui-serif, Georgia, serif;
          font-size: 35px;
          line-height: 1;
          letter-spacing: -.035em;
          font-weight: 500;
        }
        .ar-feature p { color: var(--ar-muted); line-height: 1.72; margin: 0; }

        .ar-method {
          display: grid;
          grid-template-columns: .76fr 1.24fr;
          gap: 18px;
          margin-bottom: 116px;
        }
        .ar-method-sticky {
          min-height: 560px;
          border-radius: 34px;
          padding: 36px;
          background:
            radial-gradient(circle at 80% 18%, color-mix(in srgb, var(--ar-primary) 18%, transparent), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.034));
          border: 1px solid var(--ar-line);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 30px 110px rgba(0,0,0,.24);
        }
        .ar-method-sticky h2 {
          margin: 0;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(48px, 5.5vw, 92px);
          line-height: .88;
          letter-spacing: -.07em;
          font-weight: 500;
        }
        .ar-method-sticky p { color: var(--ar-muted); line-height: 1.75; max-width: 420px; }

        .ar-method-list { display: grid; gap: 14px; }
        .ar-method-card {
          border-radius: 28px;
          padding: 28px;
        }
        .ar-method-card small {
          color: color-mix(in srgb, var(--ar-secondary) 72%, white);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-method-card h3 {
          margin: 18px 0 12px;
          font-family: ui-serif, Georgia, serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: -.035em;
        }
        .ar-method-card p { color: var(--ar-muted); line-height: 1.72; margin: 0; }
        .ar-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
        .ar-chip {
          border: 1px solid var(--ar-line);
          border-radius: 999px;
          padding: 8px 12px;
          color: var(--ar-soft);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .ar-gallery {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 16px;
          margin-bottom: 116px;
        }
        .ar-gallery-main,
        .ar-gallery-side-card {
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid var(--ar-line);
          background: rgba(255,255,255,.045);
          box-shadow: 0 30px 110px rgba(0,0,0,.28);
          position: relative;
        }
        .ar-gallery-main { min-height: 620px; }
        .ar-gallery-side { display: grid; gap: 16px; }
        .ar-gallery-side-card { min-height: 302px; }
        .ar-gallery img,
        .ar-gallery video {
          width: 100%;
          height: 100%;
          min-height: inherit;
          display: block;
          object-fit: cover;
          filter: saturate(.78) contrast(1.06) brightness(.78);
          transition: transform .6s ease, filter .6s ease;
        }
        .ar-gallery-main:hover img,
        .ar-gallery-side-card:hover img { transform: scale(1.035); filter: saturate(.95) contrast(1.08) brightness(.88); }
        .ar-gallery-caption {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          border-radius: 22px;
          padding: 18px;
          background: rgba(5,6,10,.66);
          border: 1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(18px);
        }
        .ar-gallery-caption small {
          display: block;
          margin-bottom: 8px;
          color: color-mix(in srgb, var(--ar-primary) 72%, white);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-gallery-caption strong {
          font-family: ui-serif, Georgia, serif;
          font-size: 26px;
          line-height: 1;
          font-weight: 500;
        }

        .ar-proof {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 16px;
          margin-bottom: 116px;
        }
        .ar-testimonial {
          border-radius: 32px;
          padding: 34px;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ar-testimonial blockquote {
          margin: 0;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(28px, 3vw, 44px);
          line-height: 1.08;
          letter-spacing: -.04em;
        }
        .ar-author { color: var(--ar-soft); font-weight: 850; line-height: 1.7; }
        .ar-author strong { display: block; color: var(--ar-text); }

        .ar-pricing {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 116px;
        }
        .ar-price {
          min-height: 440px;
          border-radius: 32px;
          padding: 30px;
          position: relative;
          overflow: hidden;
        }
        .ar-price.featured {
          border-color: color-mix(in srgb, var(--ar-primary) 55%, rgba(255,255,255,.18));
          box-shadow: 0 36px 120px rgba(0,0,0,.32), 0 0 70px color-mix(in srgb, var(--ar-primary) 20%, transparent);
        }
        .ar-price.featured::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 70% 10%, color-mix(in srgb, var(--ar-primary) 22%, transparent), transparent 38%);
        }
        .ar-price small {
          color: color-mix(in srgb, var(--ar-primary) 72%, white);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .ar-price strong {
          display: block;
          margin-top: 24px;
          font-family: ui-serif, Georgia, serif;
          font-size: 58px;
          line-height: .9;
          letter-spacing: -.06em;
          font-weight: 500;
        }
        .ar-price p { color: var(--ar-muted); line-height: 1.72; margin: 24px 0; }
        .ar-price ul { list-style: none; display: grid; gap: 12px; padding: 0; margin: 0; color: var(--ar-muted); }
        .ar-price li { display: flex; gap: 10px; align-items: center; }
        .ar-price li::before { content: ""; width: 16px; height: 1px; background: var(--ar-primary); box-shadow: 0 0 12px var(--ar-primary); }

        .ar-cta {
          position: relative;
          overflow: hidden;
          border-radius: 40px;
          padding: clamp(42px, 7vw, 90px);
          margin-bottom: 42px;
          border: 1px solid color-mix(in srgb, var(--ar-primary) 48%, rgba(255,255,255,.18));
          background:
            radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--ar-secondary) 25%, transparent), transparent 34%),
            linear-gradient(135deg, color-mix(in srgb, var(--ar-primary) 32%, #10121d), #080912 72%);
          box-shadow: 0 44px 140px rgba(0,0,0,.34), 0 0 90px color-mix(in srgb, var(--ar-primary) 18%, transparent);
        }
        .ar-cta h2 {
          max-width: 940px;
          margin: 0;
          font-family: ui-serif, Georgia, serif;
          font-size: clamp(50px, 7vw, 112px);
          line-height: .88;
          letter-spacing: -.075em;
          font-weight: 500;
        }
        .ar-cta p { max-width: 720px; color: rgba(255,255,255,.72); line-height: 1.78; font-size: 17px; margin: 26px 0 32px; }

        .ar-footer {
          min-height: 96px;
          border-top: 1px solid var(--ar-line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          color: var(--ar-soft);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .ar-editable {
          cursor: pointer;
          outline: 1px dashed color-mix(in srgb, var(--ar-primary) 65%, rgba(255,255,255,.2));
          outline-offset: 5px;
        }
        .ar-editable:hover,
        .ar-selected {
          outline-color: var(--ar-primary);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--ar-primary) 28%, transparent), 0 0 42px color-mix(in srgb, var(--ar-primary) 16%, transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          .ar-glow-orb { animation: none; }
          .ar-site *, .ar-site *::before, .ar-site *::after { transition: none !important; }
        }

        @media (max-width: 1120px) {
          .ar-shell { width: min(860px, calc(100% - 32px)); }
          .ar-nav-links { display: none; }
          .ar-hero,
          .ar-section-head,
          .ar-method,
          .ar-gallery,
          .ar-proof,
          .ar-pricing {
            grid-template-columns: 1fr;
          }
          .ar-hero { min-height: auto; padding-top: 54px; }
          .ar-hero-media { min-height: 500px; }
          .ar-hero-media video,
          .ar-hero-media img,
          .ar-media-fallback { min-height: 500px; }
          .ar-stats,
          .ar-features { grid-template-columns: 1fr; }
        }

        @media (max-width: 680px) {
          .ar-shell { width: min(100% - 24px, 520px); }
          .ar-nav { height: 78px; }
          .ar-brand-name { max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
          .ar-nav-cta { display: none; }
          .ar-hero h1 { font-size: clamp(52px, 16vw, 76px); }
          .ar-sub { font-size: 16px; }
          .ar-hero-media { min-height: 420px; border-radius: 26px; }
          .ar-hero-media video,
          .ar-hero-media img,
          .ar-media-fallback { min-height: 420px; }
          .ar-floating-panel { grid-template-columns: 1fr; }
          .ar-signal { display: none; }
          .ar-section-head h2,
          .ar-method-sticky h2,
          .ar-cta h2 { letter-spacing: -.055em; }
          .ar-footer { flex-direction: column; align-items: flex-start; padding: 28px 0; }
        }
      `}</style>

      <div className="ar-glow-orb one" />
      <div className="ar-glow-orb two" />

      <div className="ar-shell">
        <nav {...editable("nav", "navigation", undefined, { className: "ar-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "ar-brand" })}>
            <span className="ar-mark" />
            <span className="ar-brand-name">{overrideText("brandName", brandName)}</span>
          </div>

          <div className="ar-nav-links">
            {navItems.slice(0, 5).map((item, index) => (
              <a key={`ar-nav-${index}`} href={`#ar-${index + 1}`}>
                {text(item, `Link ${index + 1}`)}
              </a>
            ))}
          </div>

          <button {...editable("hero.primaryCta", "nav CTA", primaryCta, { className: "ar-nav-cta" })}>
            {overrideText("hero.primaryCta", primaryCta)}
          </button>
        </nav>

        <section id="ar-1" className="ar-hero">
          <div className="ar-hero-copy">
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "ar-kicker" })}>
              {overrideText("hero.eyebrow", text(hero.eyebrow, industry))}
            </div>

            <h1 {...editable("hero.headline", "hero headline", heroHeadline)}>
              <span>{overrideText("hero.headline", heroHeadline)}</span>
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", heroSubheadline, { className: "ar-sub" })}>
              {overrideText("hero.subheadline", heroSubheadline)}
            </p>

            <div className="ar-actions">
              <button {...editable("hero.primaryCta", "primary CTA", primaryCta, { className: "ar-btn ar-btn-primary" })}>
                {overrideText("hero.primaryCta", primaryCta)} →
              </button>
              <button {...editable("hero.secondaryCta", "secondary CTA", secondaryCta, { className: "ar-btn ar-btn-ghost" })}>
                {overrideText("hero.secondaryCta", secondaryCta)}
              </button>
            </div>
          </div>

          <div {...editableMedia("mediaAssets.heroMedia", heroVideoUrl ? "video" : "image", heroMediaUrl, { className: "ar-hero-media" })}>
            {heroVideoUrl ? (
              <video src={overrideMediaUrl("mediaAssets.heroVideoUrl", heroVideoUrl)} poster={heroPosterUrl} autoPlay muted loop playsInline />
            ) : heroMediaUrl ? (
              <img src={overrideMediaUrl("mediaAssets.heroPosterUrl", heroMediaUrl)} alt="" />
            ) : (
              <div className="ar-media-fallback" />
            )}

            <div className="ar-floating-panel">
              <div>
                <small>{brandName} system</small>
                <strong>{text(sections[0]?.title, "Minimal structure. Premium signal.")}</strong>
              </div>
              <div className="ar-signal" />
            </div>
          </div>
        </section>

        <section id="ar-2" className="ar-stats">
          {stats.slice(0, 3).map((stat, index) => (
            <article key={`ar-stat-${index}`} {...editable(`stats.${index}`, "stat", undefined, { className: "ar-stat" })}>
              <strong {...editable(`stats.${index}.title`, "stat title", text(stat.title, ""))}>{overrideText(`stats.${index}.title`, text(stat.title, ""))}</strong>
              <span {...editable(`stats.${index}.label`, "stat label", text(stat.label, ""))}>{overrideText(`stats.${index}.label`, text(stat.label, ""))}</span>
            </article>
          ))}
        </section>

        <section>
          <div className="ar-section-head">
            <div>
              <div className="ar-label">Core advantages</div>
              <h2>Professional design with premium restraint.</h2>
            </div>
            <p>{tagline}</p>
          </div>

          <div className="ar-features">
            {features.map((item, index) => (
              <article key={`ar-feature-${index}`} {...editable(`features.${index}`, "feature", undefined, { className: "ar-feature" })}>
                <div className="ar-feature-index">0{index + 1}</div>
                <h3 {...editable(`features.${index}.title`, "feature title", text(item.title, "Feature"))}>{overrideText(`features.${index}.title`, text(item.title, "Feature"))}</h3>
                <p {...editable(`features.${index}.description`, "feature description", text(item.description, ""))}>{overrideText(`features.${index}.description`, text(item.description, ""))}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ar-3" className="ar-method">
          <div className="ar-method-sticky">
            <div>
              <div className="ar-label">Method</div>
              <h2>Less noise. More authority.</h2>
            </div>
            <p>{heroSubheadline}</p>
          </div>

          <div className="ar-method-list">
            {sections.map((section, index) => (
              <article key={`ar-section-${index}`} {...editable(`sections.${index}`, "section", undefined, { className: "ar-method-card" })}>
                <small>Phase 0{index + 1}</small>
                <h3 {...editable(`sections.${index}.title`, "section title", text(section.title, "Section"))}>{overrideText(`sections.${index}.title`, text(section.title, "Section"))}</h3>
                <p {...editable(`sections.${index}.description`, "section description", text(section.description, ""))}>{overrideText(`sections.${index}.description`, text(section.description, ""))}</p>
                {Array.isArray(section.items) && section.items.length ? (
                  <div className="ar-chips">
                    {section.items.slice(0, 4).map((item, chipIndex) => (
                      <span key={`ar-chip-${index}-${chipIndex}`} className="ar-chip">{text(item, "Detail")}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {(collectionImages.length || heroMediaUrl) ? (
          <section id="ar-4" className="ar-gallery">
            <article {...editable("mediaAssets.collectionImages.0", "gallery main", undefined, { className: "ar-gallery-main" })}>
              {collectionImages[0]?.imageUrl ? (
                <img src={overrideMediaUrl("mediaAssets.collectionImages.0.imageUrl", collectionImages[0].imageUrl)} alt={collectionImages[0]?.title || ""} {...editableMedia("mediaAssets.collectionImages.0.imageUrl", "image", collectionImages[0].imageUrl)} />
              ) : heroVideoUrl ? (
                <video src={overrideMediaUrl("mediaAssets.heroVideoUrl", heroVideoUrl)} poster={heroPosterUrl} autoPlay muted loop playsInline />
              ) : heroMediaUrl ? (
                <img src={overrideMediaUrl("mediaAssets.heroPosterUrl", heroMediaUrl)} alt="" />
              ) : null}
              <div className="ar-gallery-caption">
                <small>{text(collectionImages[0]?.tag, "Selected work")}</small>
                <strong>{text(collectionImages[0]?.title || collectionImages[0]?.subtitle, brandName)}</strong>
              </div>
            </article>

            <div className="ar-gallery-side">
              {[1, 2].map((imageIndex) => {
                const item = collectionImages[imageIndex] || collectionImages[0] || {};
                return (
                  <article key={`ar-gallery-side-${imageIndex}`} {...editable(`mediaAssets.collectionImages.${imageIndex}`, "gallery card", undefined, { className: "ar-gallery-side-card" })}>
                    {item.imageUrl ? (
                      <img src={overrideMediaUrl(`mediaAssets.collectionImages.${imageIndex}.imageUrl`, item.imageUrl)} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${imageIndex}.imageUrl`, "image", item.imageUrl)} />
                    ) : (
                      <div className="ar-media-fallback" />
                    )}
                    <div className="ar-gallery-caption">
                      <small>{text(item.tag, "Visual proof")}</small>
                      <strong>{text(item.subtitle || item.title, industry)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="ar-proof">
          {testimonials.map((item, index) => (
            <article key={`ar-testimonial-${index}`} {...editable(`testimonials.${index}`, "testimonial", undefined, { className: "ar-testimonial" })}>
              <blockquote {...editable(`testimonials.${index}.quote`, "testimonial quote", text(item.quote, ""))}>“{overrideText(`testimonials.${index}.quote`, text(item.quote, ""))}”</blockquote>
              <div className="ar-author">
                <strong {...editable(`testimonials.${index}.name`, "testimonial name", text(item.name, "Client"))}>{overrideText(`testimonials.${index}.name`, text(item.name, "Client"))}</strong>
                <span {...editable(`testimonials.${index}.role`, "testimonial role", text(item.role, ""))}>{overrideText(`testimonials.${index}.role`, text(item.role, ""))}</span>
              </div>
            </article>
          ))}
        </section>

        {pricing.length ? (
          <section className="ar-pricing">
            {pricing.map((plan, index) => (
              <article key={`ar-price-${index}`} {...editable(`pricing.${index}`, "pricing card", undefined, { className: `ar-price ${plan.featured || index === 1 ? "featured" : ""}` })}>
                <small {...editable(`pricing.${index}.name`, "pricing name", text(plan.name, "Plan"))}>{overrideText(`pricing.${index}.name`, text(plan.name, "Plan"))}</small>
                <strong {...editable(`pricing.${index}.price`, "pricing price", text(plan.price, "Custom"))}>{overrideText(`pricing.${index}.price`, text(plan.price, "Custom"))}</strong>
                <p {...editable(`pricing.${index}.description`, "pricing description", text(plan.description, ""))}>{overrideText(`pricing.${index}.description`, text(plan.description, ""))}</p>
                <ul>
                  {list(plan.features, ["Premium structure", "Responsive design", "Editable content"]).slice(0, 4).map((feature, featureIndex) => (
                    <li key={`ar-price-${index}-feature-${featureIndex}`}>{text(feature, "Feature")}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        <section id="ar-5" className="ar-cta">
          <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Make ${brandName} feel unmistakably premium.`))}>
            {overrideText("footer.headline", text(footer.headline, `Make ${brandName} feel unmistakably premium.`))}
          </h2>
          <p {...editable("footer.description", "footer description", text(footer.description, tagline))}>
            {overrideText("footer.description", text(footer.description, tagline))}
          </p>
          <button {...editable("footer.cta", "footer CTA", text(footer.cta, "Start now"), { className: "ar-btn ar-btn-primary" })}>
            {overrideText("footer.cta", text(footer.cta, "Start now"))} →
          </button>
        </section>

        <footer className="ar-footer">
          <span>{brandName}</span>
          <span>{industry}</span>
          <span>Premium renderer system</span>
        </footer>
      </div>
    </div>
  );
}
