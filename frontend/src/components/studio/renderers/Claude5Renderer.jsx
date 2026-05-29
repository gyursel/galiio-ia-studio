import React, { useState, useEffect } from "react";

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const state = website || {};
  const overrides = state.overrides || {};
  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  const footer = state.footer || {};

  const brandName = text(state.brandName, "Atelier");
  const industry = text(state.industry, "luxury studio");
  const tagline = text(state.tagline, "A curated editorial experience for premium brands.");
  const primary = text(state.primaryColor, "#D4AF37");

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

  function overrideText(id, fallback = "") {
    return overrides[id]?.text ?? fallback;
  }

  function overrideMediaUrl(id, fallback = "") {
    return overrides[id]?.mediaUrl ?? fallback;
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600;700;900&display=swap');

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .at-site {
          position: relative;
          min-height: 100vh;
          overflow: visible;
          isolation: isolate;
          color: #e8e0d5;
          background: linear-gradient(135deg, #0f0e0c 0%, #1a1815 40%, #15140f 100%);
          font-family: 'Inter', 'Cormorant Garamond', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0.35px;
        }

        .at-video {
          position: absolute;
          inset: 0;
          min-height: 100%;
          z-index: 0;
          overflow: hidden;
          background: #050403;
        }

        .at-video video,
        .at-video img,
        .at-video-fallback {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          object-fit: cover;
          display: block;
          filter: saturate(0.7) contrast(1.15) brightness(0.55) sepia(0.12);
          transform: scale(1.04);
        }

        .at-video-fallback {
          background:
            radial-gradient(circle at 72% 18%, rgba(212,175,55,.18), transparent 40%),
            linear-gradient(135deg, #1a1815 0%, #0f0e0c 50%, #050403 100%);
        }

        .at-video::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(15,14,12,.98) 0%, rgba(15,14,12,.85) 35%, rgba(5,4,3,.65) 100%),
            linear-gradient(180deg, rgba(15,14,12,.4), rgba(26,24,21,.92) 88%),
            radial-gradient(ellipse at 100% 0%, rgba(212,175,55,.08), transparent 50%);
          backdrop-filter: blur(0.8px);
        }

        .at-page {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 60px));
          margin: 0 auto;
        }

        .at-nav {
          height: 105px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          border-bottom: 1px solid rgba(212,175,55,.15);
          backdrop-filter: blur(16px);
          background: rgba(15,14,12,.45);
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 4px 32px rgba(0,0,0,.4);
        }

        .at-nav:hover {
          border-bottom-color: rgba(212,175,55,.25);
          background: rgba(15,14,12,.55);
          box-shadow: 0 8px 42px rgba(212,175,55,.08);
        }

        .at-nav-left,
        .at-nav-right {
          display: flex;
          gap: 36px;
          align-items: center;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.32em;
          font-weight: 500;
        }

        .at-nav-right {
          justify-content: flex-end;
        }

        .at-nav a {
          color: rgba(232,224,213,.65);
          text-decoration: none;
          position: relative;
          transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          font-weight: 500;
        }

        .at-nav a::after {
          content: "";
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: linear-gradient(90deg, var(--at-primary), rgba(212,175,55,0));
          transition: width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-nav a:hover {
          color: var(--at-primary);
        }

        .at-nav a:hover::after {
          width: 100%;
        }

        .at-logo {
          text-align: center;
          transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-logo:hover {
          transform: scale(1.03);
        }

        .at-logo strong {
          display: block;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          font-size: 34px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--at-primary);
          text-shadow: 0 0 20px rgba(212,175,55,.15);
        }

        .at-logo span {
          display: block;
          margin-top: 6px;
          font-size: 8px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(232,224,213,.45);
          font-weight: 400;
        }

        .at-hero {
          min-height: 780px;
          display: grid;
          grid-template-columns: 0.74fr 1.26fr;
          gap: 60px;
          align-items: center;
          padding: 90px 0 70px;
        }

        .at-hero-copy {
          align-self: end;
          padding-bottom: 56px;
          animation: fadeInUp 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(32px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .at-kicker {
          font-size: 10px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: var(--at-primary);
          font-weight: 700;
          margin-bottom: 32px;
          opacity: 0.92;
          text-shadow: 0 0 12px rgba(212,175,55,.1);
        }

        .at-hero h1 {
          margin: 0;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          font-size: clamp(64px, 10vw, 152px);
          line-height: 0.8;
          font-weight: 500;
          letter-spacing: -0.068em;
          color: #faf8f3;
          text-rendering: optimizeLegibility;
          text-shadow: 0 2px 12px rgba(0,0,0,.3);
        }

        .at-hero p {
          margin-top: 36px;
          max-width: 580px;
          color: rgba(232,224,213,.68);
          line-height: 1.95;
          font-size: 17px;
          font-weight: 300;
          letter-spacing: 0.35px;
        }

        .at-actions {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 48px;
        }

        .at-btn {
          height: 56px;
          padding: 0 36px;
          border-radius: 0;
          border: 1.5px solid var(--at-primary);
          background: rgba(212,175,55,.08);
          color: var(--at-primary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }

        .at-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--at-primary), rgba(212,175,55,.8));
          transform: translateX(-100%);
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: -1;
        }

        .at-btn:hover {
          border-color: var(--at-primary);
          color: #0f0e0c;
          transform: translateX(3px);
          box-shadow: 0 8px 28px rgba(212,175,55,.2);
        }

        .at-btn:hover::before {
          transform: translateX(0);
        }

        .at-btn-secondary {
          background: transparent;
          color: rgba(232,224,213,.8);
          border-color: rgba(212,175,55,.4);
        }

        .at-btn-secondary::before {
          background: rgba(212,175,55,.12);
        }

        .at-btn-secondary:hover {
          color: var(--at-primary);
          border-color: var(--at-primary);
          background: rgba(212,175,55,.06);
        }

        .at-visual {
          min-height: 650px;
          position: relative;
          display: grid;
          grid-template-columns: 0.88fr 0.12fr;
          gap: 24px;
          animation: fadeInUp 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-main-image {
          position: relative;
          overflow: hidden;
          border-radius: 0 0 220px 0;
          border: 1.5px solid rgba(212,175,55,.18);
          background: linear-gradient(135deg, rgba(255,255,255,.06), rgba(232,224,213,.08));
          box-shadow: 
            0 0 80px rgba(212,175,55,.08),
            0 50px 120px rgba(0,0,0,.4),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .at-main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.85) contrast(1.12) brightness(0.88);
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-main-image:hover img {
          transform: scale(1.02);
        }

        .at-main-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(180deg, transparent 0%, rgba(15,14,12,.3) 85%, rgba(15,14,12,.45) 100%),
            radial-gradient(ellipse at 85% 15%, rgba(212,175,55,.06), transparent 45%);
        }

        .at-vertical-type {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          justify-self: center;
          align-self: center;
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          letter-spacing: 0.22em;
          color: rgba(212,175,55,.18);
          font-weight: 400;
          text-shadow: 0 0 12px rgba(212,175,55,.05);
        }

        .at-floating-card {
          position: absolute;
          left: -58px;
          bottom: 52px;
          width: min(310px, 88%);
          padding: 28px;
          background: rgba(15,14,12,.75);
          border: 1.5px solid rgba(212,175,55,.2);
          backdrop-filter: blur(32px);
          box-shadow: 
            0 32px 100px rgba(0,0,0,.5),
            0 0 1px rgba(212,175,55,.4),
            inset 0 1px 0 rgba(255,255,255,.08);
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-floating-card:hover {
          transform: translateY(-6px);
          border-color: rgba(212,175,55,.3);
          box-shadow: 
            0 36px 110px rgba(0,0,0,.6),
            0 0 1px rgba(212,175,55,.5),
            inset 0 1px 0 rgba(255,255,255,.12);
        }

        .at-floating-card span {
          color: var(--at-primary);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(212,175,55,.15);
        }

        .at-floating-card strong {
          display: block;
          margin-top: 16px;
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          line-height: 1.08;
          font-weight: 500;
          color: #faf8f3;
        }

        .at-feature-line {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid rgba(212,175,55,.15);
          border-bottom: 1px solid rgba(212,175,55,.15);
          margin: 24px 0 110px;
          background: linear-gradient(135deg, rgba(212,175,55,.04) 0%, rgba(212,175,55,.02) 100%);
        }

        .at-feature {
          padding: 48px;
          border-right: 1px solid rgba(212,175,55,.12);
          transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
        }

        .at-feature::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,.06) 0%, rgba(212,175,55,.03) 100%);
          opacity: 0;
          transition: opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-feature:hover::before {
          opacity: 1;
        }

        .at-feature:last-child {
          border-right: 0;
        }

        .at-feature small {
          color: var(--at-primary);
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: 9px;
        }

        .at-feature h3 {
          margin: 22px 0 14px;
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 500;
          line-height: 1.2;
          color: #faf8f3;
        }

        .at-feature p {
          color: rgba(232,224,213,.62);
          line-height: 1.75;
          font-size: 15px;
          font-weight: 300;
        }

        .at-editorial {
          display: grid;
          grid-template-columns: 0.78fr 1.22fr;
          gap: 64px;
          padding-bottom: 120px;
        }

        .at-editorial-title {
          position: sticky;
          top: 28px;
          align-self: start;
        }

        .at-editorial-title small {
          color: var(--at-primary);
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: 9px;
          text-shadow: 0 0 8px rgba(212,175,55,.1);
        }

        .at-editorial-title h2 {
          margin: 28px 0 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(52px, 8vw, 100px);
          line-height: 0.86;
          font-weight: 500;
          letter-spacing: -0.058em;
          color: #faf8f3;
          text-shadow: 0 2px 12px rgba(0,0,0,.3);
        }

        .at-story-list {
          display: grid;
          gap: 0;
          border-top: 1px solid rgba(212,175,55,.12);
        }

        .at-story {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 36px;
          padding: 36px 0;
          border-bottom: 1px solid rgba(212,175,55,.12);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-story:hover {
          background: rgba(212,175,55,.05);
          padding-left: 18px;
          padding-right: 18px;
          margin: 0 -18px;
          padding: 36px 18px;
        }

        .at-story-number {
          color: var(--at-primary);
          font-weight: 800;
          letter-spacing: 0.28em;
          font-size: 12px;
          text-shadow: 0 0 8px rgba(212,175,55,.08);
        }

        .at-story h3 {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          font-weight: 500;
          line-height: 1.12;
          color: #faf8f3;
        }

        .at-story p {
          color: rgba(232,224,213,.64);
          line-height: 1.85;
          font-size: 16px;
          margin-top: 10px;
          font-weight: 300;
        }

        .at-gallery {
          display: grid;
          grid-template-columns: 1.18fr 0.82fr 1.18fr;
          gap: 24px;
          padding-bottom: 120px;
        }

        .at-gallery-card {
          min-height: 450px;
          position: relative;
          overflow: hidden;
          border: 1.5px solid rgba(212,175,55,.15);
          background: linear-gradient(135deg, rgba(255,255,255,.04), rgba(232,224,213,.05));
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-gallery-card:nth-child(2) {
          transform: translateY(64px);
        }

        .at-gallery-card:hover {
          box-shadow: 0 42px 100px rgba(212,175,55,.15), 0 0 50px rgba(212,175,55,.08);
          border-color: rgba(212,175,55,.28);
          transform: translateY(${-4}px);
        }

        .at-gallery-card:nth-child(2):hover {
          transform: translateY(calc(64px - 8px));
        }

        .at-gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.82) contrast(1.1) brightness(0.92);
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .at-gallery-card:hover img {
          transform: scale(1.05);
        }

        .at-gallery-card div {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          padding: 20px;
          background: rgba(15,14,12,.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(212,175,55,.2);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 0 1px rgba(212,175,55,.3), inset 0 1px 0 rgba(255,255,255,.06);
        }

        .at-gallery-card:hover div {
          background: rgba(15,14,12,.92);
          border-color: rgba(212,175,55,.3);
          box-shadow: 0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08);
        }

        .at-gallery-card small {
          display: block;
          color: var(--at-primary);
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-size: 8px;
          font-weight: 800;
          margin-bottom: 8px;
          text-shadow: 0 0 6px rgba(212,175,55,.1);
        }

        .at-gallery-card strong {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 500;
          color: #faf8f3;
        }

        .at-cta {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 36px;
          align-items: center;
          padding: 72px 0;
          border-top: 1px solid rgba(212,175,55,.15);
          border-bottom: 1px solid rgba(212,175,55,.15);
          margin-bottom: 56px;
          background: linear-gradient(135deg, rgba(212,175,55,.06) 0%, rgba(212,175,55,.03) 100%);
        }

        .at-cta h2 {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(52px, 8vw, 104px);
          line-height: 0.86;
          font-weight: 500;
          letter-spacing: -0.058em;
          color: #faf8f3;
          text-shadow: 0 2px 12px rgba(0,0,0,.3);
        }

        .at-footer {
          padding: 0 0 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(232,224,213,.48);
          font-size: 13px;
          letter-spacing: 0.35px;
        }

        .at-editable {
          cursor: pointer;
          outline: 1px dashed rgba(212,175,55,.25);
          outline-offset: 8px;
          transition: all 0.3s ease;
        }

        .at-editable:hover,
        .at-selected {
          outline-color: var(--at-primary);
          background: rgba(212,175,55,.08);
          outline-offset: 6px;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (max-width: 1050px) {
          .at-page {
            width: min(100% - 36px, 760px);
          }

          .at-nav {
            grid-template-columns: 1fr;
            height: auto;
            gap: 20px;
            padding: 28px 0;
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
            left: 24px;
            right: 24px;
            bottom: 28px;
          }

          .at-feature-line {
            grid-template-columns: 1fr;
          }

          .at-feature {
            border-right: 0;
            border-bottom: 1px solid rgba(212,175,55,.12);
          }

          .at-gallery-card:nth-child(2) {
            transform: none;
          }

          .at-gallery-card:nth-child(2):hover {
            transform: translateY(-4px);
          }

          .at-hero h1 {
            font-size: 64px;
          }

          .at-editorial {
            gap: 48px;
          }

          .at-footer {
            flex-direction: column;
            gap: 14px;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .at-hero {
            padding: 70px 0 45px;
            gap: 36px;
            min-height: auto;
          }

          .at-hero-copy {
            padding-bottom: 24px;
          }

          .at-feature {
            padding: 36px;
          }

          .at-floating-card {
            width: 100%;
            left: 0;
            right: 0;
          }

          .at-gallery {
            grid-template-columns: 1fr;
          }

          .at-story {
            grid-template-columns: 70px 1fr;
            gap: 18px;
          }

          .at-story h3 {
            font-size: 30px;
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
