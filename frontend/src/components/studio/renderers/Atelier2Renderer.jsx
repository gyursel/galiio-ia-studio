import React, { useState } from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function mediaImage(images, index, fallback = "") {
  return text(images?.[index]?.imageUrl, fallback);
}

export default function AtelierRenderer({
  website,
  editing = false,
  selectedId = null,
  onSelect,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const state = website || {};
  const overrides = state.overrides || {};
  const hero = state.hero || {};
  const media = state.mediaAssets || {};
  const footer = state.footer || {};

  const brandName = "G-Studio";
  const industry = text(state.industry, "премиум студио");
  const tagline = text(
    state.tagline,
    "Премиум студио за луксозни дигитални преживявания, силна визия, атмосфера и професионално присъствие."
  );
  const primary = text(state.primaryColor, "#C9A15E");

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(
    media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl,
    ""
  );

  const collectionImages = list(media.collectionImages, []);

  const features = list(state.features, [
    {
      title: "Редакционна посока",
      description:
        "Премиум композиция с изчистено пространство, силна йерархия и луксозна типография.",
    },
    {
      title: "Подбрана визуалност",
      description:
        "Кинематографични изображения, внимателна композиция и разпознаваем визуален стил.",
    },
    {
      title: "Бранд присъствие",
      description:
        "По-елегантен и професионален renderer за мода, портфолио, услуги, ресторанти и premium проекти.",
    },
  ]);

  const sections = list(state.sections, [
    {
      title: "Премиум пространство",
      description: "Дизайн с баланс, светлина, пропорция и усещане за класа.",
    },
    {
      title: "Изискани детайли",
      description: "Фини детайли, които повишават усещането за стойност и качество.",
    },
    {
      title: "Дизайн като история",
      description:
        "Всеки проект е изграден като силна визуална история, в която настроение, пространство и детайл създават преживяване.",
    },
    {
      title: "Тих лукс",
      description:
        "Сдържаност, контраст и кинематографично темпо създават скъпо усещане без излишен шум.",
    },
    {
      title: "Визуални системи",
      description:
        "Всяка секция е изградена като премиум модул със силна структура и ясна визуална логика.",
    },
  ]);

  const galleryTitles = [
    "Премиум пространство",
    "Изискани детайли",
    "Материали и текстури",
    "Мека архитектура",
    "Кампания и настроение",
    "Продуктов ритуал",
    "Частен салон",
    "Вечни обекти",
  ];

  const galleryTags = [
    "Интериорна посока",
    "Луксозен детайл",
    "Текстура и светлина",
    "Пространствен дизайн",
    "Редакционна кампания",
    "Бранд ритуал",
    "Премиум студио",
    "История на обекта",
  ];

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
      className: `${extra.className || ""}${editing ? " at-editable" : ""}${
        selectedId === id ? " at-selected" : ""
      } ${overrideClass(id)}`.trim(),
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
      className: `${extra.className || ""}${editing ? " at-editable" : ""}${
        selectedId === id ? " at-selected" : ""
      } ${overrideClass(id)}`.trim(),
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

  const heroImage = overrideMediaUrl(
    "mediaAssets.collectionImages.0.imageUrl",
    mediaImage(collectionImages, 0, heroPosterUrl)
  );

  const images = Array.from({ length: 8 }, (_, index) =>
    overrideMediaUrl(
      `mediaAssets.collectionImages.${index}.imageUrl`,
      mediaImage(collectionImages, index, index === 0 ? heroPosterUrl : "")
    )
  );

  function RenderImage({ index, className = "", fallbackClass = "at-image-fallback" }) {
    const imageUrl = images[index];
    return imageUrl ? (
      <img
        src={imageUrl}
        alt={collectionImages[index]?.title || galleryTitles[index] || ""}
        {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", imageUrl, {
          className,
        })}
      />
    ) : (
      <div
        {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", imageUrl, {
          className: `${fallbackClass} ${className}`.trim(),
        })}
      />
    );
  }

  return (
    <div
      {...editable("site", "site wrapper", undefined, {
        className: "at-site",
        style: { "--at-primary": primary },
      })}
    >
      <style>{`
        .at-site {
          width: 100%;
          max-width: none;
          --at-black: #070807;
          --at-black-2: #0d0e0d;
          --at-cream: #f2eadc;
          --at-muted: rgba(242,234,220,.72);
          --at-soft-ink: #171410;
          --at-line-dark: rgba(242,234,220,.12);
          --at-line-light: rgba(23,20,16,.14);
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          isolation: isolate;
          color: var(--at-cream);
          background: var(--at-black);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .at-site * {
          box-sizing: border-box;
        }

        .at-site,
        .at-page,
        .at-hero,
        .at-feature-strip,
        .at-story-grid,
        .at-manifesto,
        .at-gallery-section,
        .at-process,
        .at-cta,
        .at-footer {
          inline-size: 100%;
        }

        .at-page {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: none;
          margin: 0;
          background: var(--at-black);
          box-shadow: none;
        }

        .at-hero {
          position: relative;
          min-height: 690px;
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          background:
            radial-gradient(circle at 82% 8%, rgba(201,161,94,.18), transparent 30%),
            linear-gradient(90deg, #15120d 0%, #241b12 46%, #746049 100%);
        }

        .at-hero-media {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #1b140d;
        }

        .at-hero-media video,
        .at-hero-media img,
        .at-image-fallback {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .at-hero-media video,
        .at-hero-media img {
          filter: saturate(.82) contrast(1.06) brightness(.72);
          transform: scale(1.02);
        }

        .at-image-fallback {
          min-height: 100%;
          background:
            radial-gradient(circle at 76% 28%, rgba(245,222,188,.18), transparent 31%),
            radial-gradient(circle at 24% 72%, rgba(201,161,94,.12), transparent 34%),
            linear-gradient(135deg, #17120c 0%, #6f5942 58%, #1a120b 100%);
        }

        .at-hero-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(9,9,8,.86) 0%, rgba(9,9,8,.58) 40%, rgba(9,9,8,.08) 78%),
            linear-gradient(180deg, rgba(9,9,8,.18) 0%, rgba(9,9,8,.26) 72%, rgba(9,9,8,.88) 100%);
        }

        .at-nav {
          position: relative;
          z-index: 3;
          height: 82px;
          display: grid;
          grid-template-columns: 230px 1fr 230px;
          align-items: center;
          padding: 0 72px;
        }

        @keyframes at-logo-liquid-gold {
          0% {
            background-position: 80% 50%;
          }
          25% {
            background-position: 40% 50%;
          }
          50% {
            background-position: 0% 50%;
          }
          75% {
            background-position: -40% 50%;
          }
          100% {
            background-position: -80% 50%;
          }
        }

        @keyframes at-logo-breathe {
          0%, 100% {
            text-shadow:
              0 0 7px rgba(190, 135, 42, .18),
              0 0 16px rgba(255, 210, 105, .10),
              0 0 30px rgba(160, 105, 28, .06);
          }
          50% {
            text-shadow:
              0 0 9px rgba(255, 235, 170, .28),
              0 0 20px rgba(255, 195, 75, .16),
              0 0 38px rgba(160, 105, 28, .10);
          }
        }

        .at-logo {
          position: relative;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: .42em;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 19px;
          font-weight: 800;
          color: transparent;
          background:
            linear-gradient(
              110deg,
              #9b6a22 0%,
              #c8963a 18%,
              #e8c267 34%,
              #fff0b2 48%,
              #d7a74a 62%,
              #b9822b 78%,
              #e6bd5f 100%
            );
          background-size: 520% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation:
            at-logo-liquid-gold 9.5s cubic-bezier(.45, 0, .25, 1) infinite,
            at-logo-breathe 6.5s ease-in-out infinite;
          transition:
            transform .35s ease,
            letter-spacing .35s ease,
            filter .35s ease;
          filter: saturate(1.15) contrast(1.08);
        }

        .at-logo::before {
          content: "";
          position: absolute;
          inset: -8px -14px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 215, 105, .18), transparent 62%);
          opacity: .65;
          filter: blur(10px);
          z-index: -1;
          pointer-events: none;
        }

        .at-logo::after {
          content: "";
          position: absolute;
          left: 0;
          right: .42em;
          bottom: -12px;
          height: 1px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(139, 90, 23, .45),
              rgba(255, 211, 105, .95),
              rgba(255, 243, 186, .72),
              rgba(139, 90, 23, .45),
              transparent
            );
          box-shadow:
            0 0 10px rgba(255, 211, 105, .52),
            0 0 24px rgba(197, 138, 43, .24);
          opacity: .78;
        }

        .at-logo:hover {
          transform: translateY(-0.5px) scale(1.012);
          letter-spacing: .44em;
          filter: saturate(1.18) contrast(1.08) brightness(1.04);
        }

        .at-nav-center {
          display: flex;
          justify-content: center;
          gap: 52px;
        }

        .at-nav a,
        .at-menu-label {
          position: relative;
          color: rgba(255,247,232,.88);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .24em;
          font-size: 10px;
          font-weight: 900;
          text-shadow:
            0 0 10px rgba(255, 213, 134, .18),
            0 0 18px rgba(201, 161, 94, .14);
          transition:
            color .25s ease,
            text-shadow .25s ease,
            transform .25s ease;
        }

        .at-nav a::after,
        .at-menu-label::after {
          content: "";
          position: absolute;
          left: 0;
          right: .24em;
          bottom: -10px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 219, 151, .95), transparent);
          opacity: 0;
          transform: scaleX(.35);
          transition: opacity .25s ease, transform .25s ease;
          box-shadow:
            0 0 10px rgba(255, 203, 108, .65),
            0 0 18px rgba(201, 161, 94, .42);
        }

        .at-nav a:hover,
        .at-menu:hover .at-menu-label {
          color: #fff8ea;
          transform: translateY(-1px);
          text-shadow:
            0 0 10px rgba(255, 232, 181, .55),
            0 0 22px rgba(255, 203, 108, .42),
            0 0 34px rgba(201, 161, 94, .28);
        }

        .at-nav a:hover::after,
        .at-menu:hover .at-menu-label::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .at-menu {
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 22px;
          cursor: pointer;
          border: 0;
          background: transparent;
          padding: 0;
          appearance: none;
          font: inherit;
        }

        .at-burger {
          width: 34px;
          display: grid;
          gap: 7px;
          filter:
            drop-shadow(0 0 8px rgba(255, 203, 108, .22))
            drop-shadow(0 0 14px rgba(201, 161, 94, .14));
          transition: filter .25s ease, transform .25s ease;
        }

        .at-burger span {
          display: block;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,247,232,.62), rgba(255, 219, 151, .98), rgba(255,247,232,.62));
          box-shadow:
            0 0 8px rgba(255, 203, 108, .5),
            0 0 16px rgba(201, 161, 94, .32);
          transform-origin: center;
          transition: transform .25s ease, opacity .25s ease;
        }

        .at-menu:hover .at-burger,
        .at-menu.is-open .at-burger {
          transform: translateY(-1px);
          filter:
            drop-shadow(0 0 10px rgba(255, 232, 181, .5))
            drop-shadow(0 0 20px rgba(255, 203, 108, .36));
        }

        .at-menu.is-open .at-burger span:first-child {
          transform: translateY(4px) rotate(42deg);
        }

        .at-menu.is-open .at-burger span:last-child {
          transform: translateY(-4px) rotate(-42deg);
        }

        .at-menu-panel {
          position: absolute;
          top: 72px;
          right: 58px;
          z-index: 10;
          width: min(245px, calc(100vw - 32px));
          padding: 14px;
          border: 1px solid rgba(255, 219, 151, .26);
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(8,10,9,.94), rgba(24,18,12,.9)),
            radial-gradient(circle at 82% 8%, rgba(201,161,94,.16), transparent 34%);
          backdrop-filter: blur(24px);
          box-shadow:
            0 24px 70px rgba(0,0,0,.45),
            0 0 28px rgba(201,161,94,.12),
            0 0 0 1px rgba(255,255,255,.045) inset;
          transform: translateY(-8px) scale(.96);
          transform-origin: top right;
          opacity: 0;
          pointer-events: none;
          transition: opacity .22s ease, transform .22s ease;
        }

        .at-menu-panel.is-open {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .at-menu-panel::before {
          content: "";
          position: absolute;
          top: -7px;
          right: 24px;
          width: 12px;
          height: 12px;
          transform: rotate(45deg);
          background: rgba(17,14,10,.94);
          border-left: 1px solid rgba(255, 219, 151, .22);
          border-top: 1px solid rgba(255, 219, 151, .22);
        }

        .at-menu-panel-brand {
          padding: 10px 10px 14px;
          border-bottom: 1px solid rgba(255, 219, 151, .14);
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15px;
          letter-spacing: .28em;
          text-transform: uppercase;
          text-shadow:
            0 0 12px rgba(255,232,181,.34),
            0 0 24px rgba(201,161,94,.2);
        }

        .at-menu-panel-links {
          display: grid;
          gap: 2px;
          padding: 10px 0;
        }

        .at-menu-panel-links a,
        .at-menu-panel-contact {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 38px;
          padding: 0 10px;
          border-radius: 12px;
          color: rgba(255,247,232,.78);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 10px;
          font-weight: 900;
          text-shadow:
            0 0 10px rgba(255, 213, 134, .12),
            0 0 18px rgba(201, 161, 94, .08);
          transition:
            color .2s ease,
            background .2s ease,
            text-shadow .2s ease,
            transform .2s ease;
        }

        .at-menu-panel-links a::after {
          content: "→";
          color: rgba(255, 219, 151, .54);
          letter-spacing: 0;
          font-size: 13px;
          opacity: 0;
          transform: translateX(-5px);
          transition: opacity .2s ease, transform .2s ease;
        }

        .at-menu-panel-links a:hover,
        .at-menu-panel-contact:hover {
          color: #fff8ea;
          background: rgba(255, 219, 151, .075);
          transform: translateX(2px);
          text-shadow:
            0 0 10px rgba(255, 232, 181, .42),
            0 0 20px rgba(255, 203, 108, .28);
        }

        .at-menu-panel-links a:hover::after {
          opacity: 1;
          transform: translateX(0);
        }

        .at-menu-panel-contact {
          justify-content: center;
          min-height: 42px;
          margin-top: 8px;
          border: 1px solid rgba(255, 219, 151, .32);
          background:
            linear-gradient(135deg, rgba(255, 232, 181, .12), rgba(255,255,255,.035));
          box-shadow:
            0 0 14px rgba(255, 203, 108, .12),
            0 0 0 1px rgba(255,255,255,.04) inset;
        }

        .at-hero-content {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: .92fr 1.08fr;
          align-items: center;
          min-height: 608px;
          padding: 48px 72px 88px;
        }

        .at-hero-copy {
          max-width: 690px;
        }

        .at-kicker {
          color: var(--at-primary);
          text-transform: uppercase;
          letter-spacing: .24em;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 20px;
        }

        .at-title {
          margin: 0;
          max-width: 720px;
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(68px, 7vw, 112px);
          line-height: .94;
          letter-spacing: -.06em;
          font-weight: 400;
          text-wrap: balance;
        }

        .at-gold-line {
          width: 42px;
          height: 2px;
          margin: 30px 0 24px;
          background: var(--at-primary);
        }

        .at-hero-text {
          max-width: 440px;
          margin: 0;
          color: rgba(255,247,232,.76);
          font-size: 16px;
          line-height: 1.72;
        }

        .at-actions {
          margin-top: 36px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .at-btn {
          position: relative;
          height: 54px;
          padding: 0 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 219, 151, .9);
          background:
            linear-gradient(135deg, #f1cf8b 0%, #c89548 42%, #8f5d22 100%);
          color: #fff8ea;
          text-transform: uppercase;
          letter-spacing: .18em;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          box-shadow:
            0 0 0 1px rgba(255, 232, 181, .18) inset,
            0 0 18px rgba(255, 203, 108, .34),
            0 16px 34px rgba(201, 133, 45, .26),
            0 24px 54px rgba(0,0,0,.34);
          transition:
            transform .28s ease,
            box-shadow .28s ease,
            border-color .28s ease,
            filter .28s ease;
        }

        .at-btn::before {
          content: "";
          position: absolute;
          inset: -2px;
          z-index: 0;
          background:
            radial-gradient(circle at 22% 0%, rgba(255,255,255,.58), transparent 22%),
            linear-gradient(120deg, transparent 0%, rgba(255,255,255,.32) 38%, transparent 56%);
          opacity: .42;
          transform: translateX(-38%);
          transition: transform .6s ease, opacity .3s ease;
          pointer-events: none;
        }

        .at-btn::after {
          content: "";
          position: absolute;
          inset: -10px;
          z-index: -1;
          background: radial-gradient(circle, rgba(255, 201, 91, .48), transparent 64%);
          opacity: .55;
          filter: blur(14px);
          pointer-events: none;
        }

        .at-btn > * {
          position: relative;
          z-index: 1;
        }

        .at-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 239, 197, 1);
          filter: brightness(1.06) saturate(1.08);
          box-shadow:
            0 0 0 1px rgba(255, 239, 197, .28) inset,
            0 0 26px rgba(255, 208, 111, .56),
            0 20px 46px rgba(201, 133, 45, .38),
            0 30px 72px rgba(0,0,0,.42);
        }

        .at-btn:hover::before {
          opacity: .72;
          transform: translateX(38%);
        }

        .at-btn-ghost {
          background:
            linear-gradient(135deg, rgba(255, 232, 181, .14), rgba(255,255,255,.045));
          border-color: rgba(255, 219, 151, .42);
          box-shadow:
            0 0 16px rgba(255, 203, 108, .18),
            0 0 0 1px rgba(255,255,255,.06) inset;
          backdrop-filter: blur(18px);
        }

        .at-btn-ghost:hover {
          border-color: rgba(255, 232, 181, .72);
          box-shadow:
            0 0 24px rgba(255, 203, 108, .3),
            0 18px 44px rgba(0,0,0,.28),
            0 0 0 1px rgba(255,255,255,.09) inset;
        }

        .at-play {
          position: absolute;
          right: 60px;
          bottom: 76px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 18px;
          color: rgba(255,247,232,.8);
          text-transform: uppercase;
          letter-spacing: .22em;
          font-size: 10px;
          font-weight: 900;
        }

        .at-play-circle {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255,247,232,.5);
          color: #fff8ea;
        }

        .at-feature-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background:
            radial-gradient(circle at 50% 0%, rgba(201,161,94,.09), transparent 46%),
            #080a09;
          border-top: 1px solid rgba(255,247,232,.08);
          border-bottom: 1px solid rgba(255,247,232,.08);
        }

        .at-feature {
          min-height: 238px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 38px 54px;
          border-right: 1px solid rgba(201,161,94,.28);
        }

        .at-feature:last-child {
          border-right: 0;
        }

        .at-feature-number {
          color: var(--at-primary);
          font-size: 12px;
          letter-spacing: .18em;
          margin-bottom: 16px;
          font-weight: 800;
        }

        .at-feature h3 {
          margin: 0;
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -.035em;
        }

        .at-feature p {
          max-width: 300px;
          margin: 12px auto 20px;
          color: rgba(255,247,232,.68);
          line-height: 1.55;
          font-size: 14px;
        }

        .at-feature-icon {
          color: var(--at-primary);
          font-size: 28px;
          line-height: 1;
        }

        .at-story-grid {
          display: grid;
          grid-template-columns: 36.4% 31.8% 31.8%;
          min-height: 460px;
          background: #f3eadc;
          color: var(--at-soft-ink);
          border-bottom: 1px solid var(--at-line-light);
        }

        .at-story-copy {
          padding: 66px 76px 54px;
          background:
            radial-gradient(circle at 20% 20%, rgba(201,161,94,.1), transparent 26%),
            #f2e7d7;
        }

        .at-mini-kicker {
          display: flex;
          align-items: center;
          gap: 22px;
          color: #9b713c;
          text-transform: uppercase;
          letter-spacing: .22em;
          font-size: 10px;
          font-weight: 900;
          margin-bottom: 26px;
        }

        .at-mini-kicker::after {
          content: "";
          width: 42px;
          height: 1px;
          background: #b88b50;
        }

        .at-story-copy h2 {
          margin: 0;
          max-width: 410px;
          color: #080807;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(50px, 4.8vw, 72px);
          line-height: .97;
          letter-spacing: -.06em;
          font-weight: 400;
        }

        .at-story-copy p {
          max-width: 390px;
          margin: 28px 0 0;
          color: rgba(23,20,16,.72);
          line-height: 1.7;
          font-size: 15px;
        }

        .at-learn {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          margin-top: 30px;
          color: #15110d;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: .2em;
          font-weight: 900;
          font-size: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(151,103,48,.45);
        }

        .at-work-card {
          position: relative;
          overflow: hidden;
          min-height: 460px;
          background: #21170f;
          border-left: 1px solid rgba(23,20,16,.14);
        }

        .at-work-card img,
        .at-work-card .at-image-fallback {
          width: 100%;
          height: 100%;
          min-height: 460px;
          object-fit: cover;
          display: block;
          filter: saturate(.78) contrast(1.06) brightness(.78);
          transform: scale(1.015);
        }

        .at-work-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,.04) 0%, rgba(0,0,0,.72) 100%),
            linear-gradient(90deg, rgba(0,0,0,.2), transparent);
        }

        .at-card-content {
          position: absolute;
          z-index: 2;
          left: 30px;
          right: 30px;
          bottom: 26px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: end;
          color: #fff8ea;
        }

        .at-card-content h3 {
          margin: 0 0 9px;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -.04em;
        }

        .at-card-content p {
          margin: 0;
          color: rgba(255,247,232,.72);
          line-height: 1.5;
          font-size: 14px;
        }

        .at-card-arrow {
          color: #fff8ea;
          font-size: 28px;
          line-height: 1;
        }

        .at-manifesto {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #080a09;
          border-bottom: 1px solid rgba(255,247,232,.08);
        }

        .at-manifesto-copy {
          padding: 86px 76px;
          display: grid;
          align-content: center;
        }

        .at-manifesto-copy h2,
        .at-gallery-title h2 {
          margin: 0;
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 5vw, 82px);
          line-height: .96;
          letter-spacing: -.06em;
          font-weight: 400;
        }

        .at-manifesto-copy p {
          margin: 28px 0 0;
          max-width: 560px;
          color: rgba(255,247,232,.68);
          font-size: 16px;
          line-height: 1.8;
        }

        .at-manifesto-media {
          min-height: 520px;
          position: relative;
          overflow: hidden;
          border-left: 1px solid rgba(255,247,232,.08);
        }

        .at-manifesto-media img,
        .at-manifesto-media .at-image-fallback {
          width: 100%;
          height: 100%;
          min-height: 520px;
          object-fit: cover;
          display: block;
          filter: saturate(.76) contrast(1.08) brightness(.72);
        }

        .at-manifesto-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,.55));
        }

        .at-gallery-section {
          background: #f3eadc;
          color: #15110d;
          padding: 74px 72px 82px;
        }

        .at-gallery-title {
          display: grid;
          grid-template-columns: .8fr 1fr;
          gap: 42px;
          align-items: end;
          margin-bottom: 34px;
        }

        .at-gallery-title h2 {
          color: #080807;
        }

        .at-gallery-title p {
          margin: 0;
          max-width: 600px;
          color: rgba(21,17,13,.64);
          line-height: 1.75;
        }

        .at-mosaic {
          display: grid;
          grid-template-columns: 1.1fr .9fr 1fr;
          grid-auto-rows: 235px;
          gap: 14px;
        }

        .at-mosaic-card {
          position: relative;
          overflow: hidden;
          background: #21170f;
          border: 1px solid rgba(23,20,16,.16);
        }

        .at-mosaic-card:nth-child(1) {
          grid-row: span 2;
        }

        .at-mosaic-card:nth-child(4) {
          grid-column: span 2;
        }

        .at-mosaic-card:nth-child(6) {
          grid-row: span 2;
        }

        .at-mosaic-card img,
        .at-mosaic-card .at-image-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(.8) contrast(1.05) brightness(.84);
          transform: scale(1.01);
        }

        .at-mosaic-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 34%, rgba(0,0,0,.68));
          opacity: .92;
        }

        .at-mosaic-label {
          position: absolute;
          z-index: 2;
          left: 22px;
          right: 22px;
          bottom: 20px;
          color: #fff8ea;
        }

        .at-mosaic-label small {
          display: block;
          color: var(--at-primary);
          text-transform: uppercase;
          letter-spacing: .22em;
          font-size: 9px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .at-mosaic-label strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -.04em;
        }

        .at-process {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 70px;
          padding: 78px 72px;
          background: #080a09;
          color: #fff8ea;
          border-top: 1px solid rgba(255,247,232,.08);
          border-bottom: 1px solid rgba(255,247,232,.08);
        }

        .at-process h2 {
          margin: 0;
          max-width: 520px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(46px, 4.8vw, 78px);
          line-height: .97;
          letter-spacing: -.06em;
          font-weight: 400;
        }

        .at-process-list {
          border-top: 1px solid rgba(201,161,94,.28);
        }

        .at-process-row {
          display: grid;
          grid-template-columns: 82px 1fr;
          gap: 26px;
          padding: 28px 0;
          border-bottom: 1px solid rgba(201,161,94,.24);
        }

        .at-process-row span {
          color: var(--at-primary);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
        }

        .at-process-row h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-size: 30px;
          letter-spacing: -.04em;
        }

        .at-process-row p {
          margin: 8px 0 0;
          max-width: 680px;
          color: rgba(255,247,232,.65);
          line-height: 1.65;
        }

        .at-cta {
          position: relative;
          min-height: 430px;
          display: grid;
          grid-template-columns: 1fr .9fr;
          align-items: center;
          overflow: hidden;
          background: #17110b;
        }

        .at-cta-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: .32;
        }

        .at-cta-bg img,
        .at-cta-bg .at-image-fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(.7) contrast(1.08) brightness(.55);
        }

        .at-cta-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(8,10,9,.92), rgba(8,10,9,.52), rgba(8,10,9,.94)),
            radial-gradient(circle at 64% 34%, rgba(201,161,94,.26), transparent 30%);
        }

        .at-cta-content {
          position: relative;
          z-index: 2;
          padding: 78px 72px;
        }

        .at-cta-content h2 {
          margin: 0;
          max-width: 760px;
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(54px, 6vw, 96px);
          line-height: .94;
          letter-spacing: -.06em;
          font-weight: 400;
        }

        .at-cta-content p {
          max-width: 560px;
          margin: 26px 0 0;
          color: rgba(255,247,232,.68);
          line-height: 1.75;
        }

        .at-footer {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1.3fr;
          gap: 54px;
          padding: 50px 72px 66px;
          background:
            radial-gradient(circle at 18% 0%, rgba(201,161,94,.08), transparent 32%),
            #080a09;
          border-top: 1px solid rgba(255,247,232,.08);
          color: rgba(255,247,232,.68);
        }

        .at-footer-mark {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(201,161,94,.64);
          border-radius: 999px;
          color: #fff8ea;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 46px;
          line-height: 1;
          margin-bottom: 22px;
        }

        .at-footer p {
          margin: 0;
          max-width: 320px;
          line-height: 1.65;
          font-size: 14px;
        }

        .at-footer h4 {
          margin: 0 0 18px;
          color: #fff8ea;
          text-transform: uppercase;
          letter-spacing: .22em;
          font-size: 10px;
        }

        .at-footer span,
        .at-footer a {
          display: block;
          color: rgba(255,247,232,.68);
          text-decoration: none;
          margin-top: 11px;
          font-size: 14px;
          text-shadow:
            0 0 10px rgba(255, 213, 134, .12),
            0 0 18px rgba(201, 161, 94, .08);
          transition: color .25s ease, text-shadow .25s ease, transform .25s ease;
        }

        .at-footer a:hover,
        .at-footer span:hover {
          color: #fff8ea;
          transform: translateX(2px);
          text-shadow:
            0 0 10px rgba(255, 232, 181, .42),
            0 0 20px rgba(255, 203, 108, .32),
            0 0 30px rgba(201, 161, 94, .2);
        }

        .at-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 18px;
        }

        .at-socials a {
          position: relative;
          display: inline;
          margin: 0;
          color: rgba(255, 232, 181, .78);
        }

        .at-socials a::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -5px;
          height: 1px;
          background: rgba(255, 219, 151, .9);
          opacity: .38;
          box-shadow: 0 0 10px rgba(255, 203, 108, .45);
          transition: opacity .25s ease, box-shadow .25s ease;
        }

        .at-socials a:hover::after {
          opacity: 1;
          box-shadow:
            0 0 10px rgba(255, 232, 181, .72),
            0 0 18px rgba(255, 203, 108, .5);
        }

        .at-editable {
          cursor: pointer;
          outline: 1px dashed rgba(201,161,94,.48);
          outline-offset: 4px;
        }

        .at-editable:hover,
        .at-selected {
          outline-color: var(--at-primary);
          background: rgba(201,161,94,.08);
        }

        @media (max-width: 1100px) {
          .at-nav {
            grid-template-columns: 1fr;
            gap: 18px;
            height: auto;
            padding: 24px;
            text-align: center;
          }

          .at-nav-center {
            order: 2;
            flex-wrap: wrap;
            gap: 24px;
          }

          .at-menu {
            justify-content: center;
          }

          .at-menu-panel {
            top: 122px;
            right: 50%;
            transform: translate(50%, -8px) scale(.96);
            transform-origin: top center;
          }

          .at-menu-panel.is-open {
            transform: translate(50%, 0) scale(1);
          }

          .at-menu-panel::before {
            right: 50%;
            margin-right: -6px;
          }

          .at-hero-content {
            grid-template-columns: 1fr;
            min-height: 600px;
            padding: 48px 28px 90px;
          }

          .at-play {
            left: 28px;
            right: auto;
            bottom: 34px;
          }

          .at-feature-strip,
          .at-story-grid,
          .at-manifesto,
          .at-gallery-title,
          .at-process,
          .at-cta,
          .at-footer {
            grid-template-columns: 1fr;
          }

          .at-feature {
            min-height: auto;
            border-right: 0;
            border-bottom: 1px solid rgba(201,161,94,.24);
          }

          .at-story-copy,
          .at-manifesto-copy,
          .at-gallery-section,
          .at-process,
          .at-cta-content,
          .at-footer {
            padding-left: 28px;
            padding-right: 28px;
          }

          .at-mosaic {
            grid-template-columns: 1fr 1fr;
          }

          .at-mosaic-card:nth-child(1),
          .at-mosaic-card:nth-child(4),
          .at-mosaic-card:nth-child(6) {
            grid-column: auto;
            grid-row: auto;
          }
        }

        @media (max-width: 640px) {
          .at-title {
            font-size: 54px;
          }

          .at-nav-center {
            display: none;
          }

          .at-menu-panel {
            top: 106px;
            width: min(238px, calc(100vw - 28px));
          }

          .at-menu-panel-links {
            display: grid;
          }

          .at-logo {
            letter-spacing: .32em;
          }

          .at-actions {
            flex-direction: column;
          }

          .at-btn {
            width: 100%;
          }

          .at-story-copy h2,
          .at-manifesto-copy h2,
          .at-gallery-title h2,
          .at-process h2,
          .at-cta-content h2 {
            font-size: 46px;
          }

          .at-card-content {
            grid-template-columns: 1fr;
          }

          .at-mosaic {
            grid-template-columns: 1fr;
            grid-auto-rows: 260px;
          }

          .at-process-row {
            grid-template-columns: 1fr;
          }
        }
      `}
</style>

      <main className="at-page">
        <section className="at-hero">
          <div
            {...editableMedia(
              "mediaAssets.heroVideoUrl",
              heroVideoUrl ? "video" : "image",
              heroVideoUrl || heroPosterUrl || heroImage,
              { className: "at-hero-media" }
            )}
          >
            {heroVideoUrl ? (
              <video src={heroVideoUrl} poster={heroPosterUrl || heroImage} autoPlay muted loop playsInline />
            ) : heroImage || heroPosterUrl ? (
              <img src={heroImage || heroPosterUrl} alt="" />
            ) : (
              <div className="at-image-fallback" />
            )}
          </div>

          <nav {...editable("nav", "navigation", undefined, { className: "at-nav" })}>
            <div className="at-logo" data-galio-id="brandName" data-galio-type="brand">Gyursel Studio</div>

            <div className="at-nav-center">
              <a href="#work">Проекти</a>
              <a href="#about">За нас</a>
              <a href="#studio">Студио</a>
              <a href="#journal">Журнал</a>
              <a href="#contact">Контакт</a>
            </div>

            <button
              type="button"
              className={`at-menu${menuOpen ? " is-open" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              aria-label={menuOpen ? "Затвори менюто" : "Отвори менюто"}
              aria-expanded={menuOpen}
            >
              <span className="at-menu-label">{menuOpen ? "Затвори" : "Меню"}</span>
              <span className="at-burger" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </nav>

          <div
            className={`at-menu-panel${menuOpen ? " is-open" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="at-menu-panel-brand">G-Studio</div>
            <div className="at-menu-panel-links">
              <a href="#work" onClick={() => setMenuOpen(false)}>Проекти</a>
              <a href="#about" onClick={() => setMenuOpen(false)}>За нас</a>
              <a href="#studio" onClick={() => setMenuOpen(false)}>Студио</a>
              <a href="#journal" onClick={() => setMenuOpen(false)}>Журнал</a>
              <a href="#contact" onClick={() => setMenuOpen(false)}>Контакт</a>
            </div>
            <a className="at-menu-panel-contact" href="#contact" onClick={() => setMenuOpen(false)}>
              Започни проект
            </a>
          </div>

          <div className="at-hero-content">
            <div className="at-hero-copy">
              <div
                {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, "Премиум визуално преживяване"), {
                  className: "at-kicker",
                })}
              >
                {text(hero.eyebrow, "Премиум визуално преживяване")}
              </div>

              <h1
                {...editable(
                  "hero.headline",
                  "hero headline",
                  text(hero.headline, "Създадено за премиум брандове")
                )}
                className="at-title"
              >
                {text(hero.headline, "Създадено за премиум брандове")}
              </h1>

              <div className="at-gold-line" />

              <p
                {...editable(
                  "hero.subheadline",
                  "hero subheadline",
                  text(hero.subheadline, "Създаваме визуални истории с класа, финес и професионална премиум визия.")
                )}
                className="at-hero-text"
              >
                {text(hero.subheadline, "Създаваме визуални истории с класа, финес и професионална премиум визия.")}
              </p>

              <div className="at-actions">
                <button
                  {...editable("hero.primaryCta", "primary CTA", text(hero.primaryCta, "Разгледай проектите"), {
                    className: "at-btn",
                  })}
                >
                  {text(hero.primaryCta, "Разгледай проектите")} <span>→</span>
                </button>

                <button
                  {...editable("hero.secondaryCta", "secondary CTA", text(hero.secondaryCta, "Виж студиото"), {
                    className: "at-btn at-btn-ghost",
                  })}
                >
                  {text(hero.secondaryCta, "Виж студиото")}
                </button>
              </div>
            </div>
          </div>

          <div className="at-play">
            <span className="at-play-circle">▷</span>
            <span>Play reel</span>
          </div>
        </section>

        <section className="at-feature-strip">
          {features.slice(0, 3).map((item, index) => (
            <article
              key={`atelier-feature-${index}`}
              {...editable(`features.${index}`, "feature", undefined, { className: "at-feature" })}
            >
              <div>
                <div className="at-feature-number">0{index + 1}</div>
                <h3>{text(item.title, "Premium Feature")}</h3>
                <p>{text(item.description, "")}</p>
                <div className="at-feature-icon">
                  {index === 0 ? "✥" : index === 1 ? "◉" : "♛"}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section id="about" className="at-story-grid">
          <div className="at-story-copy">
            <div className="at-mini-kicker">Нашият подход</div>
            <h2>{text(sections[2]?.title, "Дизайн като история")}</h2>
            <p>
              {text(
                sections[2]?.description,
                "Всеки проект е изграден като силна визуална история, в която настроение, пространство и детайл създават преживяване."
              )}
            </p>
            <a className="at-learn" href="#contact">
              Научи повече <span>→</span>
            </a>
          </div>

          <article
            id="work"
            {...editable("mediaAssets.collectionImages.1", "work card", undefined, {
              className: "at-work-card",
            })}
          >
            <RenderImage index={1} />
            <div className="at-card-content">
              <div>
                <h3>{text(sections[0]?.title, "Премиум пространство")}</h3>
                <p>{text(sections[0]?.description, "Дизайн с баланс, светлина, пропорция и усещане за класа.")}</p>
              </div>
              <div className="at-card-arrow">→</div>
            </div>
          </article>

          <article
            {...editable("mediaAssets.collectionImages.2", "work card", undefined, {
              className: "at-work-card",
            })}
          >
            <RenderImage index={2} />
            <div className="at-card-content">
              <div>
                <h3>{text(sections[1]?.title, "Изискани детайли")}</h3>
                <p>{text(sections[1]?.description, "Фини детайли, които повишават усещането за стойност и качество.")}</p>
              </div>
              <div className="at-card-arrow">→</div>
            </div>
          </article>
        </section>

        <section id="studio" className="at-manifesto">
          <div className="at-manifesto-copy">
            <div className="at-mini-kicker">Манифест на студиото</div>
            <h2>{text(sections[3]?.title, "Quiet luxury, designed to last.")}</h2>
            <p>
              {text(
                sections[3]?.description,
                "We combine dramatic imagery, editorial composition and restrained interaction to create websites that feel cinematic, premium and deeply intentional."
              )}
            </p>
          </div>
          <div
            {...editable("mediaAssets.collectionImages.3", "manifesto image", undefined, {
              className: "at-manifesto-media",
            })}
          >
            <RenderImage index={3} />
          </div>
        </section>

        <section id="journal" className="at-gallery-section">
          <div className="at-gallery-title">
            <div>
              <div className="at-mini-kicker">Визуален архив</div>
              <h2>Осем премиум визуални момента.</h2>
            </div>
            <p>
              The renderer now has a larger page structure and at least eight editable image slots:
              hero image, two story cards, manifesto image, three mosaic cards and one CTA background.
            </p>
          </div>

          <div className="at-mosaic">
            {[0, 1, 2, 3, 4, 5].map((_, gridIndex) => {
              const imageIndex = gridIndex + 2;
              const item = collectionImages[imageIndex] || {};
              return (
                <article
                  key={`atelier-mosaic-${imageIndex}`}
                  {...editable(`mediaAssets.collectionImages.${imageIndex}`, "gallery image", undefined, {
                    className: "at-mosaic-card",
                  })}
                >
                  <RenderImage index={imageIndex} />
                  <div className="at-mosaic-label">
                    <small>{text(item.tag || item.subtitle, galleryTags[imageIndex] || "Editorial")}</small>
                    <strong>{text(item.title, galleryTitles[imageIndex] || "Premium Moment")}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="at-process">
          <div>
            <div className="at-mini-kicker">Процес</div>
            <h2>{text(sections[4]?.title, "Пълна premium система, не само hero секция.")}</h2>
          </div>

          <div className="at-process-list">
            {[
              {
                title: "Първо атмосфера",
                description: "Страницата започва с кинематографичен hero и силен редакционен контраст.",
              },
              {
                title: "Структурирана история",
                description: "Feature, story, manifesto и gallery секциите създават по-дълъг и завършен premium сайт.",
              },
              {
                title: "Медиен premium layout",
                description: "Осем отделни image позиции правят renderer-а визуален, скъп и завършен.",
              },
            ].map((item, index) => (
              <article key={`atelier-process-${index}`} className="at-process-row">
                <span>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="at-cta">
          <div
            {...editable("mediaAssets.collectionImages.7", "CTA background image", undefined, {
              className: "at-cta-bg",
            })}
          >
            <RenderImage index={7} />
          </div>

          <div className="at-cta-content">
            <div className="at-mini-kicker">Започни следващата глава</div>
            <h2>{text(footer.headline, `Ready to elevate $brandName?`)}</h2>
            <p>
              {text(
                footer.description,
                `Стартирай premium, кинематографично уеб преживяване за ${industry} с по-силна йерархия, по-богати секции и повече визуална дълбочина.`
              )}
            </p>
            <div className="at-actions">
              <button
                {...editable("footer.cta", "footer CTA", text(footer.cta, "Започни сега"), {
                  className: "at-btn",
                })}
              >
                {text(footer.cta, "Започни сега")} <span>→</span>
              </button>
            </div>
          </div>
        </section>

        <footer className="at-footer">
          <div>
            <div className="at-footer-mark">A</div>
            <p>{tagline}</p>
          </div>

          <div>
            <h4>Studio</h4>
            <span>About</span>
            <span>Екип</span>
            <span>Кариери</span>
          </div>

          <div>
            <h4>Информация</h4>
            <span>Journal</span>
            <span>Преса</span>
            <span>Въпроси</span>
          </div>

          <div>
            <h4>Контакти</h4>
            <span>{text(footer.email, "hello@atelier.studio")}</span>
            <span>{text(footer.phone, "+44 20 7946 0958")}</span>
            <div className="at-socials">
              <a href="#instagram">Instagram</a>
              <a href="#pinterest">Pinterest</a>
              <a href="#linkedin">LinkedIn</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
