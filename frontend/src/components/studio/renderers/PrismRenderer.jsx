import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

export default function PremiumWebsiteRenderer({
  website,
  editing = false,
  selectedId = null,
  onSelect,
  onUpdate,
}) {
  const state = website || {};
  const overrides = state.overrides || {};
  const rootRef = useRef(null);
  const overlayDragRef = useRef(null);
  const [overlayRect, setOverlayRect] = useState(null);

  const brandName = text(state.brandName, "Galio Premium");
  const tagline = text(state.tagline, "Premium digital experience");
  const industry = text(state.industry, "premium brand");
  const primary = text(state.primaryColor, "#FFFFFF");
  const secondary = text(state.secondaryColor, "#0A0A0C");

  const hero = state.hero || {};
  const footer = state.footer || {};
  const media = state.mediaAssets || {};
  const templateId = text(state.templateId, "premium-landing");
  
  const templateNavigation = {
    "saas-product": ["Product", "Workflow", "Pricing", "Demo"],
    "local-business": ["Services", "About", "Reviews", "Contact"],
    "hospitality-experience": ["Experience", "Gallery", "Booking", "Reviews"],
    "portfolio-personal": ["About", "Work", "Skills", "Contact"],
    "professional-service": ["Trust", "Services", "Process", "Contact"],
    "ecommerce-product": ["Products", "Benefits", "Details", "Buy"],
    "real-estate": ["Highlights", "Gallery", "Location", "Contact"],
    "event-conference": ["Agenda", "Speakers", "Venue", "Tickets"],
    "mobile-app": ["App", "Features", "Reviews", "Download"],
    "agency-studio": ["Services", "Work", "Process", "Clients"],
    "blog-magazine": ["Featured", "Categories", "Latest", "Subscribe"],
  };
  
  const templateCtas = {
    "saas-product": ["Start Free", "Watch Demo"],
    "local-business": ["Book a Call", "View Services"],
    "hospitality-experience": ["Reserve Now", "Explore Gallery"],
    "portfolio-personal": ["View Work", "Contact Me"],
    "professional-service": ["Request Consultation", "See Process"],
    "ecommerce-product": ["Shop Now", "Compare Details"],
    "real-estate": ["Schedule Viewing", "See Location"],
    "event-conference": ["Get Tickets", "View Agenda"],
    "mobile-app": ["Download App", "See Features"],
    "agency-studio": ["Start Project", "View Work"],
    "blog-magazine": ["Subscribe", "Read Latest"],
  };

  const navigation = list(state.navigation, templateNavigation[templateId] || ["Experience", "Features", "Work", "Contact"]);
  const [primaryCtaLabel, secondaryCtaLabel] = templateCtas[templateId] || [
    text(hero.primaryCta, "Get Started"),
    text(hero.secondaryCta, "Explore"),
  ];

  const stats = list(state.stats, [
    { title: "99.9%", label: "Visual Perfection" },
    { title: "Zero", label: "Compromises" },
    { title: "100%", label: "Tailored Flow" },
  ]);

  const heroVideoUrl = text(media.heroVideoUrl || media.backgroundVideoUrl, "");
  const heroPosterUrl = text(media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl, "");
  const collectionImages = list(media.collectionImages, []);

  const features = list(state.features, [
    {
      title: "Immersive Architecture",
      description: "A meticulously balanced structure engineered for absolute brand authority and conversion.",
    },
    {
      title: "Cinematic Motion",
      description: "Sophisticated interactions meets high-contrast depth, creating an unforgettable digital signature.",
    },
    {
      title: "Fluid Responsiveness",
      description: "Every pixel adapts seamlessly, ensuring flawless aesthetics from mobile screens to ultra-wide displays.",
    },
  ]);

  const sections = list(state.sections, [
    {
      title: "The Core Philosophy",
      description: `A hyper-focused presentation crafted tailored specifically for ${industry}, blending aesthetics with functional minimalism.`,
      items: ["Elite Positioning", "Zero Friction Layout", "Refined Typography"],
    },
    {
      title: "Engineered to Convert",
      description: "Moving away from traditional templates. Every element subtly guides the user towards meaningful interactions.",
      items: ["Seamless CTA", "Interactive Micro-copy", "Trust Alignment"],
    },
  ]);

  const pricing = list(state.pricing, []);
  const customElements = list(state.customElements, []);

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
  function dataId(id) { return String(id || "").replace(/"/g, "&quot;"); }

  function cssValue(key, value) {
    const raw = String(value ?? "").replace(/;/g, "").trim();
    if (!raw) return "";
    const pxKeys = new Set(["width", "height", "minHeight", "maxWidth", "padding", "margin", "borderRadius", "gap", "fontSize", "letterSpacing", "top", "right", "bottom", "left"]);
    if (pxKeys.has(key) && /^-?\d+(\.\d+)?$/.test(raw)) return `${raw}px`;
    return raw;
  }

  function buildOverrideCss() {
    return Object.entries(overrides || {})
      .map(([id, config]) => {
        const styles = config?.styles || {};
        const declarations = Object.entries(styles)
          .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
          .flatMap(([key, value]) => {
            const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            const safeValue = cssValue(key, value);
            if (!safeValue) return [];
            const lines = [`${cssKey}: ${safeValue} !important`];
            if (key === "height") lines.push(`min-height: ${safeValue} !important`);
            if (key === "width") lines.push(`max-width: ${safeValue} !important`);
            return lines;
          });
        if (!declarations.length) return "";
        return `[data-gpr-id="${String(id).replace(/"/g, '\\\"')}"] { ${declarations.join("; ")}; }`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function editClass(id) {
    return editing ? ` gpr-editable ${selectedId === id ? "gpr-editable-selected" : ""}` : "";
  }

  function editable(id, tag, value, extra = {}) {
    return {
      "data-gpr-id": dataId(id),
      className: `${extra.className || ""}${editClass(id)} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}) },
      onClick: editing ? (event) => {
        event.stopPropagation();
        onSelect?.({ id, tag, text: overrideText(id, value), styles: overrideStyle(id), classes: overrideClass(id), reactPath: id });
      } : extra.onClick,
    };
  }

  function editableMedia(id, mediaType, mediaUrl, extra = {}) {
    return {
      "data-gpr-id": dataId(id),
      className: `${extra.className || ""}${editClass(id)} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}) },
      onClick: editing ? (event) => {
        event.stopPropagation();
        onSelect?.({ id, tag: mediaType === "video" ? "video" : "image", text: undefined, mediaUrl: overrideMediaUrl(id, mediaUrl || ""), mediaType, styles: overrideStyle(id), classes: overrideClass(id), reactPath: id });
      } : extra.onClick,
    };
  }

  const getSelectedElement = useCallback(() => {
    if (!editing || !selectedId || !rootRef.current) return null;
    const safeId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(selectedId) : String(selectedId).replace(/"/g, '\\"');
    return rootRef.current.querySelector(`[data-gpr-id="${safeId}"]`);
  }, [editing, selectedId]);

  const refreshOverlayRect = useCallback(() => {
    const root = rootRef.current;
    const el = getSelectedElement();
    if (!root || !el) { setOverlayRect(null); return; }
    const rootBox = root.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    setOverlayRect({
      left: elBox.left - rootBox.left + root.scrollLeft,
      top: elBox.top - rootBox.top + root.scrollTop,
      width: elBox.width,
      height: elBox.height,
    });
  }, [getSelectedElement]);

  useLayoutEffect(() => { refreshOverlayRect(); }, [refreshOverlayRect, website, selectedId, editing]);

  useEffect(() => {
    if (!editing) { setOverlayRect(null); return undefined; }
    const onFrame = () => refreshOverlayRect();
    window.addEventListener("resize", onFrame);
    window.addEventListener("scroll", onFrame, true);
    const timer = window.setInterval(onFrame, 500);
    return () => {
      window.removeEventListener("resize", onFrame);
      window.removeEventListener("scroll", onFrame, true);
      window.clearInterval(timer);
    };
  }, [editing, refreshOverlayRect]);

  const getBaseTransform = (id) => {
    const transform = String(overrides?.[id]?.styles?.transform || "");
    const match = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
    return { x: match ? Number(match[1]) : 0, y: match ? Number(match[2]) : 0 };
  };

  const isMoveAllowed = (id) => {
    if (id === "site") return false;
    return true;
  };

  const startProOverlayDrag = (mode, event) => {
    if (!editing || !selectedId || !onUpdate || !overlayRect) return;
    event.preventDefault();
    event.stopPropagation();
    if (mode === "move" && !isMoveAllowed(selectedId)) return;
    const el = getSelectedElement();
    if (!el) return;
    const baseTransform = getBaseTransform(selectedId);
    overlayDragRef.current = { mode, el, startX: event.clientX, startY: event.clientY, startRect: { ...overlayRect }, baseX: baseTransform.x, baseY: baseTransform.y };

    const onMove = (moveEvent) => {
      const drag = overlayDragRef.current;
      if (!drag) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      const next = { ...drag.startRect };

      if (drag.mode === "move") { next.left = drag.startRect.left + dx; next.top = drag.startRect.top + dy; }
      if (drag.mode.includes("e")) next.width = Math.max(24, drag.startRect.width + dx);
      if (drag.mode.includes("s")) next.height = Math.max(24, drag.startRect.height + dy);
      if (drag.mode.includes("w")) { next.left = drag.startRect.left + dx; next.width = Math.max(24, drag.startRect.width - dx); }
      if (drag.mode.includes("n")) { next.top = drag.startRect.top + dy; next.height = Math.max(24, drag.startRect.height - dy); }
      setOverlayRect(next);
    };

    const onUp = (upEvent) => {
      const drag = overlayDragRef.current;
      overlayDragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!drag) return;
      const dx = upEvent.clientX - drag.startX;
      const dy = upEvent.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;

      if (drag.mode === "move") {
        onUpdate(selectedId, { styles: { transform: `translate(${Math.round(drag.baseX + dx)}px, ${Math.round(drag.baseY + dy)}px)`, position: "relative", zIndex: "20" } });
        return;
      }
      const width = Math.round(Math.max(24, overlayRect.width + (drag.mode.includes("e") ? dx : drag.mode.includes("w") ? -dx : 0)));
      const height = Math.round(Math.max(24, overlayRect.height + (drag.mode.includes("s") ? dy : drag.mode.includes("n") ? -dy : 0)));
      onUpdate(selectedId, { styles: { width: `${width}px`, maxWidth: `${width}px`, height: `${height}px`, minHeight: `${height}px`, display: "inline-block" } });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleCanvasDoubleClick = (event) => {
    if (!editing || !onUpdate || !rootRef.current) return;
    const tag = String(event.target?.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;
    event.preventDefault();
    event.stopPropagation();

    const rootBox = rootRef.current.getBoundingClientRect();
    const x = Math.round(event.clientX - rootBox.left + rootRef.current.scrollLeft);
    const y = Math.round(event.clientY - rootBox.top + rootRef.current.scrollTop);
    const index = customElements.length;
    const id = `customElements.${index}`;

    const element = {
      type: "text",
      text: "Premium Focus",
      styles: {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        zIndex: "50",
        color: "#ffffff",
        fontSize: "24px",
        fontWeight: "600",
        letterSpacing: "-0.03em",
        padding: "12px 18px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    };

    onUpdate(id, { value: element });
    window.setTimeout(() => {
      onSelect?.({ id, tag: "custom text", text: element.text, styles: element.styles, classes: "", reactPath: id });
    }, 30);
  };

  return (
    <div
      ref={rootRef}
      onDoubleClick={handleCanvasDoubleClick}
      {...editable("site", "site wrapper", undefined, {
        className: "gpr-site",
        style: {
          "--gpr-primary": primary,
          "--gpr-secondary": secondary,
        },
      })}
    >
      {(heroVideoUrl || heroPosterUrl) && (
        <div {...editableMedia(heroVideoUrl ? "mediaAssets.heroVideoUrl" : "mediaAssets.heroImageUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "gpr-media-bg" })}>
          {heroVideoUrl ? (
            <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline />
          ) : (
            <img src={heroPosterUrl} alt="" />
          )}
        </div>
      )}

      {overlayRect && selectedId && editing && (
        <div className="gpr-pro-overlay" style={{ left: `${overlayRect.left}px`, top: `${overlayRect.top}px`, width: `${overlayRect.width}px`, height: `${overlayRect.height}px` }}>
          <div className="gpr-pro-overlay-label">{selectedId} <span>{isMoveAllowed(selectedId) ? "canvas element" : "locked"}</span></div>
          <div className="gpr-pro-toolbar">
            <button type="button" className="gpr-pro-tool" onMouseDown={(event) => startProOverlayDrag("move", event)}>Move</button>
          </div>
          <div className="gpr-pro-size-badge">{Math.round(overlayRect.width)} × {Math.round(overlayRect.height)}</div>
          <div className={`gpr-pro-move ${isMoveAllowed(selectedId) ? "" : "gpr-pro-move-disabled"}`} onMouseDown={(event) => startProOverlayDrag("move", event)} />
          {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((handle) => (
            <div key={handle} className={`gpr-pro-handle gpr-pro-handle-${handle}`} onMouseDown={(event) => startProOverlayDrag(handle, event)} />
          ))}
        </div>
      )}

      <style>{buildOverrideCss()}</style>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700&display=swap');

        .gpr-site {
          min-height: 100%;
          position: relative;
          color: #EFF1F5;
          background-color: #050507;
          background-image: 
            radial-gradient(circle at 50% -20%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 0% 0%, rgba(120, 119, 198, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 100% 80%, rgba(255, 255, 255, 0.02) 0%, transparent 30%);
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow: hidden;
          letter-spacing: -0.01em;
        }

        .gpr-wrap {
          position: relative;
          z-index: 2;
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
        }

        .gpr-editable {
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
          border: 1px solid transparent;
        }
        .gpr-editable:hover {
          border-color: rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }
        .gpr-editable-selected {
          border-color: rgba(255, 255, 255, 0.3) !important;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
        }

        .gpr-pro-overlay { position: absolute; z-index: 99999; border: 1px solid #ffffff; background: rgba(255,255,255,.03); pointer-events: none; box-shadow: 0 30px 60px rgba(0,0,0,.4); }
        .gpr-pro-overlay-label { position: absolute; left: -1px; top: -28px; display: flex; align-items: center; gap: 6px; height: 22px; background: #ffffff; color: #000000; padding: 0 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
        .gpr-pro-overlay-label span { opacity: 0.5; font-weight: 400; }
        .gpr-pro-size-badge { position: absolute; right: -1px; bottom: -24px; height: 18px; display: flex; align-items: center; background: #000000; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); padding: 0 6px; font-size: 9px; font-weight: 500; }
        .gpr-pro-toolbar { position: absolute; right: -1px; top: -28px; display: flex; background: #000000; pointer-events: auto; border: 1px solid rgba(255,255,255,0.2); }
        .gpr-pro-tool { height: 20px; border: 0; background: transparent; color: #ffffff; padding: 0 8px; font-size: 10px; cursor: pointer; }
        .gpr-pro-move { position: absolute; inset: -4px; cursor: move; pointer-events: auto; }
        .gpr-pro-handle { position: absolute; width: 6px; height: 6px; background: #ffffff; border: 1px solid #000000; pointer-events: auto; }
        .gpr-pro-handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .gpr-pro-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .gpr-pro-handle-e { right: -4px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .gpr-pro-handle-w { left: -4px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .gpr-pro-handle-se { right: -4px; bottom: -4px; cursor: nwse-resize; }

        .gpr-media-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.15;
          pointer-events: none;
          filter: grayscale(100%) contrast(1.1);
        }
        .gpr-media-bg video, .gpr-media-bg img { width: 100%; height: 100%; object-fit: cover; }
        .gpr-media-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, #050507 0%, transparent 40%, #050507 100%);
        }

        .gpr-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .gpr-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 18px;
          letter-spacing: -0.03em;
          color: #FFFFFF;
        }
        .gpr-logo-mark {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          background: #FFFFFF;
          box-shadow: 0 0 20px rgba(255,255,255,0.3);
        }
        .gpr-nav-links {
          display: flex;
          gap: 32px;
          background: rgba(255, 255, 255, 0.03);
          padding: 8px 24px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        .gpr-nav-links a {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .gpr-nav-links a:hover { color: #FFFFFF; }

        .gpr-btn {
          border: 0;
          border-radius: 999px;
          background: #FFFFFF;
          color: #000000;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
        }
        .gpr-btn:hover {
          transform: translateY(-1px);
          background: #F5F5F7;
          box-shadow: 0 6px 24px rgba(255, 255, 255, 0.2);
        }
        .gpr-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: none;
          backdrop-filter: blur(5px);
        }
        .gpr-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
        }

        .gpr-hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 64px;
          align-items: center;
          padding: 120px 0 100px;
        }
        .gpr-eyebrow {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .gpr-hero h1 {
          margin: 0;
          font-size: clamp(44px, 5.5vw, 76px);
          line-height: 1.05;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: #FFFFFF;
          background: linear-gradient(to bottom right, #FFFFFF 30%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gpr-hero p {
          margin: 24px 0 0;
          font-size: 18px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
          max-width: 520px;
        }
        .gpr-actions { display: flex; gap: 16px; margin-top: 40px; }
        
        .gpr-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 32px;
        }
        .gpr-stats strong { display: block; font-size: 32px; font-weight: 500; color: #FFFFFF; letter-spacing: -0.02em; }
        .gpr-stats span { display: block; font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; }

        .gpr-visual { position: relative; display: flex; justify-content: center; align-items: center; }
        .gpr-device {
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 420px;
          min-height: 480px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 32px;
          backdrop-filter: blur(30px);
          box-shadow: 
            0 30px 100px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .gpr-notch { width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 999px; margin: 0 auto 40px; }
        .gpr-screen span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); font-weight: 600; }
        .gpr-screen strong { display: block; font-size: 28px; font-weight: 500; margin-top: 12px; color: #FFFFFF; letter-spacing: -0.02em; }
        .gpr-screen p { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.5; margin-top: 12px; }
        
        .gpr-products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 40px; }
        .gpr-products div { height: 90px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
        .gpr-products img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; transition: opacity 0.3s; }
        .gpr-products div:hover img { opacity: 1; }

        .gpr-orb { position: absolute; border-radius: 500px; filter: blur(80px); z-index: 1; pointer-events: none; opacity: 0.4; }
        .gpr-orb-a { width: 300px; height: 300px; background: rgba(255,255,255,0.05); right: -50px; top: -50px; }
        .gpr-orb-b { width: 250px; height: 250px; background: rgba(140, 120, 240, 0.05); left: -50px; bottom: 0; }

        .gpr-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 100px 0; }
        .gpr-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 40px;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .gpr-card:hover {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .gpr-icon { width: 16px; height: 16px; border-radius: 4px; background: rgba(255,255,255,0.1); margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2); }
        .gpr-card h3, .gpr-section-card h3, .gpr-price-card h3 { font-size: 20px; font-weight: 500; color: #FFFFFF; margin: 0 0 14px; letter-spacing: -0.01em; }
        .gpr-card p, .gpr-section-card p, .gpr-price-card p { font-size: 15px; color: rgba(255, 255, 255, 0.45); line-height: 1.6; margin: 0; }

        .gpr-section-head { margin-bottom: 56px; }
        .gpr-section-head p { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); font-weight: 500; margin: 0 0 16px; }
        .gpr-section-head h2 { font-size: clamp(32px, 4vw, 48px); font-weight: 600; color: #FFFFFF; margin: 0; letter-spacing: -0.03em; }
        
        .gpr-section-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; padding-bottom: 100px; }
        .gpr-section-card { background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 40px; position: relative; }
        .gpr-section-card-large { grid-row: span 1; }
        .gpr-number { font-size: 12px; font-family: monospace; color: rgba(255,255,255,0.3); margin-bottom: 24px; display: inline-block; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; }
        
        .gpr-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 32px; }
        .gpr-chip-row span { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 999px; padding: 6px 14px; color: rgba(255, 255, 255, 0.6); font-size: 12px; font-weight: 500; }

        .gpr-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 40px 0 100px; }
        .gpr-gallery-card { position: relative; height: 320px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); background: #000; }
        .gpr-gallery-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s; opacity: 0.85; }
        .gpr-gallery-card:hover img { transform: scale(1.04); opacity: 1; }
        .gpr-gallery-info {
          position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
          display: flex; flex-direction: column; justify-content: flex-end; padding: 32px;
        }
        .gpr-gallery-info span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); font-weight: 500; }
        .gpr-gallery-info strong { font-size: 18px; font-weight: 500; color: #FFFFFF; margin-top: 8px; display: block; }

        .gpr-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 40px 0 100px; }
        .gpr-price-card { background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 40px; }
        .gpr-price-card h3 { font-size: 36px; margin: 16px 0; font-weight: 600; }
        .gpr-price-card ul { list-style: none; padding: 0; margin: 32px 0 0; display: flex; flex-direction: column; gap: 14px; }
        .gpr-price-card li { font-size: 14px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 10px; }
        .gpr-price-card li::before { content: "—"; color: rgba(255,255,255,0.3); }

        .gpr-cta {
          margin: 40px auto 120px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 80px 40px;
          text-align: center;
          background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 70%), rgba(255, 255, 255, 0.01);
          position: relative;
        }
        .gpr-cta p { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
        .gpr-cta h2 { font-size: clamp(32px, 4vw, 54px); font-weight: 600; color: #FFFFFF; margin: 0 auto 32px; max-width: 600px; letter-spacing: -0.03em; }

        .gpr-footer {
          padding: 40px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 13px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .gpr-custom-element { transition: all 0.2s ease; }

        @media (max-width: 960px) {
          .gpr-nav-links { display: none; }
          .gpr-hero { grid-template-columns: 1fr; text-align: center; padding: 60px 0; gap: 40px; }
          .gpr-hero p { margin: 24px auto 0; }
          .gpr-actions { justify-content: center; }
          .gpr-stats { grid-template-columns: 1fr; gap: 16px; text-align: center; }
          .gpr-features, .gpr-pricing-grid, .gpr-section-grid, .gpr-gallery { grid-template-columns: 1fr; gap: 16px; }
          .gpr-device { max-width: 100%; }
        }
      `}</style>

      {customElements.map((item, index) => {
        const id = `customElements.${index}`;
        const value = text(item?.text, "Premium Focus");
        const baseStyles = item?.styles || {};
        return (
          <div key={id} {...editable(id, "custom text", value, { className: "gpr-custom-element", style: baseStyles })}>
            {value}
          </div>
        );
      })}

      <div className={`gpr-wrap gpr-template-${templateId}`}>
        <nav {...editable("nav", "navigation bar", undefined, { className: "gpr-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "gpr-logo" })}>
            <span className="gpr-logo-mark" />
            <span>{brandName}</span>
          </div>

          <div className="gpr-nav-links">
            {navigation.slice(0, 6).map((label, idx) => {
              const navTargets = ["#experience", "#features", "#work", "#contact", "#pricing", "#gallery"];
              return (
                <a key={`nav-${idx}`} href={navTargets[idx] || "#experience"} {...editable(`navigation.${idx}`, "nav label", label)}>
                  {label}
                </a>
              );
            })}
          </div>

          <button {...editable("hero.primaryCta", "nav button", text(hero.primaryCta, "Get Started"), { className: "gpr-btn" })}>
            {primaryCtaLabel}
          </button>
        </nav>

        <section id="experience" {...editable("heroSection", "hero section", undefined, { className: "gpr-hero" })}>
          <div>
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "gpr-eyebrow" })}>
              {text(hero.eyebrow, industry)}
            </div>

            <h1 {...editable("hero.headline", "hero headline", text(hero.headline, `The New Standard of ${brandName}`))}>
              {text(hero.headline, `The New Standard of ${brandName}`)}
            </h1>

            <p {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>

            <div {...editable("hero.actions", "hero buttons row", undefined, { className: "gpr-actions" })}>
              <button {...editable("hero.primaryCta", "button", text(hero.primaryCta, "Get Started"), { className: "gpr-btn" })}>
                {primaryCtaLabel}
              </button>
              <button {...editable("hero.secondaryCta", "button", text(hero.secondaryCta, "Explore"), { className: "gpr-btn gpr-btn-secondary" })}>
                {secondaryCtaLabel}
              </button>
            </div>

            <div {...editable("stats", "stats row", undefined, { className: "gpr-stats" })}>
              {stats.slice(0, 3).map((stat, idx) => (
                <div key={`stat-${idx}`} {...editable(`stats.${idx}`, "stat card", undefined)}>
                  <strong {...editable(`stats.${idx}.title`, "stat title", text(stat.title, ""))}>{text(stat.title, "")}</strong>
                  <span {...editable(`stats.${idx}.label`, "stat label", text(stat.label, ""))}>{text(stat.label, "")}</span>
                </div>
              ))}
            </div>
          </div>

          <div {...editable("hero.visual", "hero visual", undefined, { className: "gpr-visual" })}>
            <div {...editable("hero.device", "hero device", undefined, { className: "gpr-device" })}>
              <div {...editable("hero.device.notch", "device notch", undefined, { className: "gpr-notch" })} />
              <div {...editable("hero.device.screen", "device screen", undefined, { className: "gpr-screen" })}>
                <span {...editable("industry", "industry", industry)}>{industry}</span>
                <strong {...editable("brandName", "brand", brandName)}>{brandName}</strong>
                <p {...editable("tagline", "tagline", tagline)}>{tagline}</p>
              </div>

              <div {...editable("mediaAssets.collectionImages", "mini image row", undefined, { className: "gpr-products" })}>
                {[0, 1, 2].map((idx) => (
                  <div key={`mini-${idx}`} {...editable(`mediaAssets.collectionImages.${idx}`, "image card", undefined)}>
                    {collectionImages[idx]?.imageUrl ? (
                      <img src={collectionImages[idx].imageUrl} alt={collectionImages[idx].title || ""} {...editableMedia(`mediaAssets.collectionImages.${idx}.imageUrl`, "image", collectionImages[idx].imageUrl)} />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div {...editable("hero.orbA", "decor orb", undefined, { className: "gpr-orb gpr-orb-a" })} />
            <div {...editable("hero.orbB", "decor orb", undefined, { className: "gpr-orb gpr-orb-b" })} />
          </div>
        </section>

        <section id="features" {...editable("features", "features section", undefined, { className: "gpr-features" })}>
          {features.slice(0, 9).map((item, index) => (
            <article key={`feature-${index}`} {...editable(`features.${index}`, "feature card", undefined, { className: "gpr-card" })}>
              <div {...editable(`features.${index}.icon`, "feature icon", undefined, { className: "gpr-icon" })} />
              <h3 {...editable(`features.${index}.title`, "feature title", text(item.title, "Premium Feature"))}>{text(item.title, "Premium Feature")}</h3>
              <p {...editable(`features.${index}.description`, "feature description", text(item.description, "Premium section description."))}>{text(item.description, "Premium section description.")}</p>
            </article>
          ))}
        </section>

        <section id="work" {...editable("sectionsArea", "sections area", undefined)}>
          <div {...editable("sectionIntro", "section intro", undefined, { className: "gpr-section-head" })}>
            <p {...editable("sectionIntro.eyebrow", "section eyebrow", text(state.sectionIntro?.eyebrow, "Experience Architecture"))}>{text(state.sectionIntro?.eyebrow, "Experience Architecture")}</p>
            <h2 {...editable("sectionIntro.headline", "section headline", text(state.sectionIntro?.headline, "Designed with absolute clarity"))}>{text(state.sectionIntro?.headline, "Designed with absolute clarity")}</h2>
          </div>

          <div {...editable("sections", "section cards grid", undefined, { className: "gpr-section-grid" })}>
            {sections.slice(0, 6).map((section, index) => (
              <article key={`section-${index}`} {...editable(`sections.${index}`, "section card", undefined, { className: `gpr-section-card ${index === 0 ? "gpr-section-card-large" : ""}` })}>
                <div {...editable(`sections.${index}.number`, "section number", `0${index + 1}`, { className: "gpr-number" })}>0{index + 1}</div>
                <h3 {...editable(`sections.${index}.title`, "section title", text(section.title, "Premium Section"))}>{text(section.title, "Premium Section")}</h3>
                <p {...editable(`sections.${index}.description`, "section description", text(section.description, "Premium section copy."))}>{text(section.description, "Premium section copy.")}</p>
                <div {...editable(`sections.${index}.items`, "chips row", undefined, { className: "gpr-chip-row" })}>
                  {list(section.items, ["Elite", "Minimal", "Fluid"]).slice(0, 8).map((item, idx) => (
                    <span key={`chip-${index}-${idx}`} {...editable(`sections.${index}.items.${idx}`, "chip", item)}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {collectionImages.length > 0 && (
          <section id="gallery" {...editable("mediaGallery", "media gallery", undefined)}>
            <div {...editable("galleryIntro", "gallery intro", undefined, { className: "gpr-section-head" })}>
              <p {...editable("galleryIntro.eyebrow", "gallery eyebrow", text(state.galleryIntro?.eyebrow, "Visual Direction"))}>{text(state.galleryIntro?.eyebrow, "Visual Direction")}</p>
              <h2 {...editable("galleryIntro.headline", "gallery headline", text(state.galleryIntro?.headline, "Curated Media Presentation"))}>{text(state.galleryIntro?.headline, "Curated Media Presentation")}</h2>
            </div>

            <div {...editable("mediaAssets.collectionImages", "gallery grid", undefined, { className: "gpr-gallery" })}>
              {collectionImages.slice(0, 6).map((item, index) => (
                <article key={`gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery card", undefined, { className: "gpr-gallery-card" })}>
                  <img src={item.imageUrl} alt={item.title || ""} {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                  <div {...editable(`mediaAssets.collectionImages.${index}.info`, "gallery info", undefined, { className: "gpr-gallery-info" })}>
                    <span {...editable(`mediaAssets.collectionImages.${index}.tag`, "image tag", text(item.tag, "Curated"))}>{text(item.tag, "Curated")}</span>
                    <strong {...editable(`mediaAssets.collectionImages.${index}.subtitle`, "image subtitle", text(item.subtitle || item.title, industry))}>{text(item.subtitle || item.title, industry)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {pricing.length > 0 && (
          <section id="pricing" {...editable("pricing", "pricing section", undefined)}>
            <div {...editable("pricingIntro", "pricing intro", undefined, { className: "gpr-section-head" })}>
              <p {...editable("pricingIntro.eyebrow", "pricing eyebrow", text(state.pricingIntro?.eyebrow, "Investment"))}>{text(state.pricingIntro?.eyebrow, "Investment")}</p>
              <h2 {...editable("pricingIntro.headline", "pricing headline", text(state.pricingIntro?.headline, "Transparent Pricing Structure"))}>{text(state.pricingIntro?.headline, "Transparent Pricing Structure")}</h2>
            </div>

            <div {...editable("pricing", "pricing grid", undefined, { className: "gpr-pricing-grid" })}>
              {pricing.slice(0, 3).map((plan, index) => (
                <article key={`price-${index}`} {...editable(`pricing.${index}`, "price card", undefined, { className: "gpr-price-card" })}>
                  <p {...editable(`pricing.${index}.name`, "plan name", text(plan.name, "Tier"))}>{text(plan.name, "Tier")}</p>
                  <h3 {...editable(`pricing.${index}.price`, "plan price", text(plan.price, "Custom"))}>{text(plan.price, "Custom")}</h3>
                  <p {...editable(`pricing.${index}.description`, "plan description", text(plan.description, "Premium tier access."))}>{text(plan.description, "Premium tier access.")}</p>
                  <ul {...editable(`pricing.${index}.features`, "plan features", undefined)}>
                    {list(plan.features, ["Bespoke Architecture", "Fluid Interactions", "Complete Hand-off"]).slice(0, 6).map((f, i) => (
                      <li key={`pf-${index}-${i}`} {...editable(`pricing.${index}.features.${i}`, "plan feature", f)}>{f}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="contact" {...editable("footerCta", "footer CTA", undefined, { className: "gpr-cta" })}>
          <p {...editable("industry", "footer eyebrow", industry)}>{industry}</p>
          <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Elevate your presentation with ${brandName}`))}>
            {text(footer.headline, `Elevate your presentation with ${brandName}`)}
          </h2>
          <button {...editable("footer.cta", "footer button", text(footer.cta, text(hero.primaryCta, "Get Started")), { className: "gpr-btn" })}>
            {text(footer.cta, text(hero.primaryCta, "Get Started"))}
          </button>
        </section>

        <footer {...editable("footer", "footer", undefined, { className: "gpr-footer" })}>
          <span {...editable("brandName", "footer brand", brandName)}>{brandName}</span>
          <span {...editable("tagline", "footer tagline", tagline)}>{tagline}</span>
        </footer>
      </div>
    </div>
  );
}