import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
 
function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}
 
function list(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}
 
// ─── AUTO MEDIA SYSTEM ────────────────────────────────────────────────────────
// Maps templateId / industry keywords → Unsplash search query + Pexels video ID
const TOPIC_MEDIA_MAP = [
  { match: ["restaurant","food","cafe","bistro","culinary","dining","kitchen","chef","cuisine"],        query: "restaurant food dining",         videoId: "3571264"  },
  { match: ["hotel","resort","spa","hospitality","luxury stay","accommodation","inn"],                  query: "luxury hotel resort",            videoId: "3125977"  },
  { match: ["real estate","property","home","house","apartment","villa","architecture","interior"],     query: "luxury real estate architecture", videoId: "3843013"  },
  { match: ["fitness","gym","workout","sport","training","yoga","wellness","health club"],              query: "gym fitness workout",             videoId: "4761261"  },
  { match: ["fashion","clothing","apparel","boutique","style","wear","outfit","dress"],                 query: "fashion clothing boutique",       videoId: "4763825"  },
  { match: ["tech","software","saas","app","startup","digital","ai","platform","dashboard"],           query: "technology software abstract",    videoId: "3129671"  },
  { match: ["travel","adventure","tourism","destination","explore","trip","vacation"],                  query: "travel adventure landscape",     videoId: "856973"   },
  { match: ["beauty","cosmetics","skincare","salon","makeup","spa"],                                    query: "beauty cosmetics skincare",       videoId: "4608677"  },
  { match: ["music","concert","event","festival","entertainment","nightlife","club"],                   query: "music concert event",            videoId: "2098540"  },
  { match: ["coffee","cafe","barista","espresso","brew"],                                               query: "coffee cafe barista",            videoId: "2278095"  },
  { match: ["agency","studio","creative","design","branding","marketing"],                              query: "creative studio design agency",  videoId: "3573666"  },
  { match: ["law","legal","attorney","finance","consulting","professional"],                            query: "business professional office",   videoId: "3048276"  },
  { match: ["nature","organic","eco","green","environment","plant","botanical"],                        query: "nature organic green",           videoId: "854048"   },
  { match: ["photography","photo","portfolio","art","gallery","creative"],                              query: "photography art portfolio",      videoId: "4763825"  },
  { match: ["medical","health","clinic","doctor","dentist","therapy"],                                  query: "modern medical clinic",          videoId: "3576378"  },
  { match: ["car","auto","vehicle","automotive","dealership","luxury car"],                             query: "luxury car automotive",          videoId: "3571264"  },
];
 
const DEFAULT_MEDIA = { query: "premium luxury brand", videoId: "3573666" };
 
function getTopicMedia(industry, templateId) {
  const haystack = `${industry} ${templateId}`.toLowerCase();
  for (const entry of TOPIC_MEDIA_MAP) {
    if (entry.match.some(kw => haystack.includes(kw))) return entry;
  }
  return DEFAULT_MEDIA;
}
 
// Build Unsplash source URLs (free, no key needed via source.unsplash.com)
// Each call gets a different random photo by using a unique seed integer
function unsplashUrl(query, seed, w = 800, h = 600) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;
}
 
// Pexels free video embed (no autoplay key needed for mp4 direct links via their CDN)
// We use their publicly embeddable HD mp4 links
function pexelsVideoUrl(id) {
  // Pexels provides free HD videos; direct mp4 links follow this pattern
  return `https://player.vimeo.com/external/${id}.hd.mp4?s=00000000&profile_id=175&oauth2_token_id=57447761`;
}
 
// Fallback: use a public domain Coverr.co video by topic keyword
const COVERR_VIDEOS = {
  "3571264":  "https://assets.mixkit.co/videos/preview/mixkit-restaurant-food-top-view-5-large.mp4",
  "3125977":  "https://assets.mixkit.co/videos/preview/mixkit-luxury-hotel-lobby-3-large.mp4",
  "3843013":  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4",
  "4761261":  "https://assets.mixkit.co/videos/preview/mixkit-athlete-running-fast-on-a-treadmill-4-large.mp4",
  "4763825":  "https://assets.mixkit.co/videos/preview/mixkit-woman-posing-for-photos-in-an-alley-48-large.mp4",
  "3129671":  "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-laptop-618-large.mp4",
  "856973":   "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4",
  "4608677":  "https://assets.mixkit.co/videos/preview/mixkit-girl-applying-makeup-in-front-of-a-mirror-47-large.mp4",
  "2098540":  "https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-in-a-club-at-night-417-large.mp4",
  "2278095":  "https://assets.mixkit.co/videos/preview/mixkit-barista-preparing-a-coffee-in-a-coffee-shop-4385-large.mp4",
  "3573666":  "https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-164-large.mp4",
  "3048276":  "https://assets.mixkit.co/videos/preview/mixkit-person-typing-on-a-computer-keyboard-1296-large.mp4",
  "854048":   "https://assets.mixkit.co/videos/preview/mixkit-green-leaves-in-the-wind-1188-large.mp4",
  "3576378":  "https://assets.mixkit.co/videos/preview/mixkit-doctor-reviewing-medical-results-5-large.mp4",
  "default":  "https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-164-large.mp4",
};
 
function getVideoUrl(videoId) {
  return COVERR_VIDEOS[String(videoId)] || COVERR_VIDEOS["default"];
}
 
// Hook: auto-populate media if none provided
function useAutoMedia(industry, templateId, providedMedia) {
  const [autoMedia, setAutoMedia] = useState(null);
 
  useEffect(() => {
    const hasImages = providedMedia?.collectionImages?.length >= 8;
    const hasVideo  = !!(providedMedia?.heroVideoUrl || providedMedia?.backgroundVideoUrl);
 
    if (hasImages && hasVideo) return; // already full
 
    const topic = getTopicMedia(industry, templateId);
 
    // Build 8 unique image seeds
    const images = [];
    const baseQuery = topic.query;
    for (let i = 0; i < 8; i++) {
      const seed = (industry + templateId + i).split("").reduce((a, c) => a + c.charCodeAt(0), i * 37);
      images.push({
        imageUrl: unsplashUrl(baseQuery, seed, 800, 600),
        title: `${industry} ${i + 1}`,
        tag: industry,
        subtitle: industry,
      });
    }
 
    const videoUrl = getVideoUrl(topic.videoId);
 
    setAutoMedia({
      collectionImages: hasImages ? providedMedia.collectionImages : images,
      heroVideoUrl:     hasVideo  ? (providedMedia.heroVideoUrl || providedMedia.backgroundVideoUrl) : videoUrl,
      heroPosterUrl:    providedMedia?.heroPosterUrl || unsplashUrl(baseQuery, 999, 1600, 900),
    });
  }, [industry, templateId, providedMedia]);
 
  return autoMedia;
}
// ─────────────────────────────────────────────────────────────────────────────
 
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
  const primary = text(state.primaryColor, "#C9F270");
  const secondary = text(state.secondaryColor, "#060608");
 
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
    { title: "Premium", label: "Visual system" },
    { title: "Fast", label: "Launch flow" },
    { title: "100%", label: "Responsive" },
  ]);
 
  // Auto-load topic media when none (or fewer than 8 images) provided
  const [mediaLoading, setMediaLoading] = useState(true);
  const autoMedia = useAutoMedia(industry, templateId, media);
  useEffect(() => { if (autoMedia) setMediaLoading(false); }, [autoMedia]);
  const providedCollectionImages = list(media.collectionImages, []);
  const autoCollectionImages = list(autoMedia?.collectionImages, []);

  const mergedCollectionImages = [
    ...providedCollectionImages,
    ...autoCollectionImages.slice(providedCollectionImages.length),
  ].slice(0, Math.max(8, providedCollectionImages.length));

  const effectiveMedia = autoMedia ? {
    ...autoMedia,
    ...media,
    collectionImages: mergedCollectionImages,
    heroVideoUrl: media.heroVideoUrl || media.backgroundVideoUrl || autoMedia.heroVideoUrl,
    heroPosterUrl: media.heroPosterUrl || media.heroImageUrl || media.backgroundImageUrl || autoMedia.heroPosterUrl,
  } : media;
 
  const heroVideoUrl    = text(effectiveMedia.heroVideoUrl || effectiveMedia.backgroundVideoUrl, "");
  const heroPosterUrl   = text(effectiveMedia.heroPosterUrl || effectiveMedia.heroImageUrl || effectiveMedia.backgroundImageUrl, "");
  const collectionImages = list(effectiveMedia.collectionImages, []);
 
  const features = list(state.features, [
    { title: "Premium Strategy", description: "A polished structure built for trust, conversion and high-end brand perception." },
    { title: "Cinematic Visuals", description: "Dark, modern, memorable presentation with strong hierarchy and premium spacing." },
    { title: "Responsive Flow", description: "Clean sections designed to feel sharp across desktop, tablet and mobile." },
  ]);
 
  const sections = list(state.sections, [
    {
      title: "Signature Experience",
      description: `A carefully crafted presentation for ${industry}, focused on trust, clarity and premium perception.`,
      items: ["Premium positioning", "Clear visual hierarchy", "Conversion-first layout"],
    },
    {
      title: "Built To Convert",
      description: "Every section guides visitors from first impression to action with strong messaging and elegant UI.",
      items: ["Hero CTA", "Product highlights", "Trust signals"],
    },
  ]);
 
  const pricing = list(state.pricing, []);
  const customElements = list(state.customElements, []);
 
  function overrideClass(id) { return text(overrides[id]?.classes, ""); }
  function overrideStyle(id) { return overrides[id]?.styles || {}; }
  function dataId(id) { return String(id || "").replace(/"/g, "&quot;"); }
 
  function cssValue(key, value) {
    const raw = String(value ?? "").replace(/;/g, "").trim();
    if (!raw) return "";
    const pxKeys = new Set(["width","height","minHeight","maxWidth","padding","margin","borderRadius","gap","fontSize","letterSpacing","top","right","bottom","left"]);
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
        return `[data-gpr-id="${String(id).replace(/"/g, '\\"')}"] { ${declarations.join("; ")}; }`;
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
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({ id, tag, text: value, styles: overrideStyle(id), classes: overrideClass(id), reactPath: id });
          }
        : extra.onClick,
    };
  }
 
  function editableMedia(id, mediaType, mediaUrl, extra = {}) {
    return {
      "data-gpr-id": dataId(id),
      className: `${extra.className || ""}${editClass(id)} ${overrideClass(id)}`.trim(),
      style: { ...(extra.style || {}), ...overrideStyle(id) },
      onClick: editing
        ? (event) => {
            event.stopPropagation();
            onSelect?.({
              id,
              tag: mediaType === "video" ? "video" : "image",
              text: undefined,
              mediaUrl: mediaUrl || "",
              mediaType,
              styles: overrideStyle(id),
              classes: overrideClass(id),
              reactPath: id,
            });
          }
        : extra.onClick,
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
    setOverlayRect({ left: elBox.left - rootBox.left + root.scrollLeft, top: elBox.top - rootBox.top + root.scrollTop, width: elBox.width, height: elBox.height });
  }, [getSelectedElement]);
 
  useLayoutEffect(() => { refreshOverlayRect(); }, [refreshOverlayRect, website, selectedId, editing]);
 
  useEffect(() => {
    if (!editing) { setOverlayRect(null); return undefined; }
    const onFrame = () => refreshOverlayRect();
    window.addEventListener("resize", onFrame);
    window.addEventListener("scroll", onFrame, true);
    const timer = window.setInterval(onFrame, 500);
    return () => { window.removeEventListener("resize", onFrame); window.removeEventListener("scroll", onFrame, true); window.clearInterval(timer); };
  }, [editing, refreshOverlayRect]);
 
  const getBaseTransform = (id) => {
    const transform = String(overrides?.[id]?.styles?.transform || "");
    const match = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
    return { x: match ? Number(match[1]) : 0, y: match ? Number(match[2]) : 0 };
  };
 
  const isMoveAllowed = (id) => String(id || "") !== "site";
 
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
    const element = { type: "text", text: "Double click text", styles: { position: "absolute", left: `${x}px`, top: `${y}px`, zIndex: "50", color: "#ffffff", fontSize: "28px", fontWeight: "800", lineHeight: "1.1", padding: "8px 10px", borderRadius: "12px", backdropFilter: "blur(10px)" } };
    onUpdate(id, { value: element });
    window.setTimeout(() => { onSelect?.({ id, tag: "custom text", text: element.text, styles: element.styles, classes: "", reactPath: id }); }, 30);
  };
 
  return (
    <div
      ref={rootRef}
      onDoubleClick={handleCanvasDoubleClick}
      {...editable("site", "site wrapper", undefined, {
        className: "gpr-site",
        style: { "--gpr-primary": primary, "--gpr-secondary": secondary },
      })}
    >
      {/* Background media */}
      {(heroVideoUrl || heroPosterUrl) && (
        <div {...editableMedia(heroVideoUrl ? "mediaAssets.heroVideoUrl" : "mediaAssets.heroImageUrl", heroVideoUrl ? "video" : "image", heroVideoUrl || heroPosterUrl, { className: "gpr-media-bg" })}>
          {heroVideoUrl ? <video src={heroVideoUrl} poster={heroPosterUrl} autoPlay muted loop playsInline /> : <img src={heroPosterUrl} alt="" />}
        </div>
      )}
 
      {/* Edit overlay */}
      {overlayRect && selectedId && editing && (
        <div className="gpr-pro-overlay" style={{ left: `${overlayRect.left}px`, top: `${overlayRect.top}px`, width: `${overlayRect.width}px`, height: `${overlayRect.height}px` }}>
          <div className="gpr-pro-overlay-label">{selectedId}<span>{isMoveAllowed(selectedId) ? "move + resize" : "root locked"}</span></div>
          <div className="gpr-pro-toolbar">
            <button type="button" className="gpr-pro-tool" onMouseDown={(e) => startProOverlayDrag("move", e)} title="Move">Move</button>
            <button type="button" className="gpr-pro-tool" title="Resize from handles">Resize</button>
          </div>
          <div className="gpr-pro-size-badge">{Math.round(overlayRect.width)} × {Math.round(overlayRect.height)}</div>
          <div className={`gpr-pro-move ${isMoveAllowed(selectedId) ? "" : "gpr-pro-move-disabled"}`} onMouseDown={(e) => startProOverlayDrag("move", e)} />
          {["n","s","e","w","ne","nw","se","sw"].map((handle) => (
            <div key={handle} className={`gpr-pro-handle gpr-pro-handle-${handle}`} onMouseDown={(e) => startProOverlayDrag(handle, e)} />
          ))}
        </div>
      )}
 
      <style>{buildOverrideCss()}</style>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
 
        /* ─── EDIT OVERLAY ─────────────────────────────────────── */
        .gpr-editable {
          cursor: pointer;
          outline: 1px dashed rgba(201,242,112,.3);
          outline-offset: 5px;
          border-radius: 6px;
          transition: outline-color .15s ease;
        }
        .gpr-editable:hover {
          outline-color: rgba(201,242,112,.9);
          background: rgba(201,242,112,.04);
        }
        .gpr-editable-selected {
          outline: 1px solid rgba(201,242,112,.5);
          background: rgba(201,242,112,.03);
        }
        .gpr-pro-overlay {
          position: absolute;
          z-index: 99999;
          user-select: none;
          touch-action: none;
          border: 1.5px solid #3b82f6;
          background: rgba(59,130,246,.03);
          box-shadow: 0 0 0 1px rgba(2,6,23,.72), 0 0 0 4px rgba(59,130,246,.12), 0 18px 70px rgba(0,0,0,.36);
          pointer-events: none;
        }
        .gpr-pro-overlay-label {
          position: absolute; left: -1px; top: -34px;
          display: flex; align-items: center; gap: 8px; height: 28px;
          border-radius: 8px 8px 8px 0; background: #2563eb; color: #fff;
          border: 1px solid rgba(255,255,255,.18); padding: 0 10px;
          font-size: 11px; font-weight: 800; letter-spacing: .01em;
          white-space: nowrap; box-shadow: 0 10px 32px rgba(0,0,0,.35);
        }
        .gpr-pro-overlay-label span { color: rgba(255,255,255,.78); font-weight: 700; }
        .gpr-pro-size-badge {
          position: absolute; right: -1px; bottom: -30px; height: 24px;
          display: flex; align-items: center; border-radius: 0 0 8px 8px;
          background: #020617; color: #bfdbfe;
          border: 1px solid rgba(59,130,246,.55); padding: 0 8px;
          font-size: 11px; font-weight: 800; box-shadow: 0 10px 32px rgba(0,0,0,.3);
        }
        .gpr-pro-toolbar {
          position: absolute; right: -1px; top: -34px;
          display: flex; overflow: hidden; border-radius: 8px 8px 0 8px;
          border: 1px solid rgba(255,255,255,.15); background: #020617;
          box-shadow: 0 10px 32px rgba(0,0,0,.35); pointer-events: auto;
        }
        .gpr-pro-tool {
          height: 28px; border: 0; border-right: 1px solid rgba(255,255,255,.1);
          background: transparent; color: #bfdbfe; padding: 0 9px;
          font-size: 11px; font-weight: 900; cursor: pointer;
        }
        .gpr-pro-tool:last-child { border-right: 0; }
        .gpr-pro-tool:hover { background: rgba(59,130,246,.18); color: #fff; }
        .gpr-pro-move { position: absolute; inset: -8px; cursor: move; pointer-events: auto; }
        .gpr-pro-move-disabled { cursor: not-allowed; }
        .gpr-pro-handle {
          position: absolute; width: 10px; height: 10px; border-radius: 3px;
          background: #fff; border: 1.5px solid #2563eb;
          box-shadow: 0 0 0 1px rgba(2,6,23,.65), 0 5px 14px rgba(0,0,0,.28);
          pointer-events: auto;
        }
        .gpr-pro-handle-n { top:-6px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
        .gpr-pro-handle-s { bottom:-6px; left:50%; transform:translateX(-50%); cursor:ns-resize; }
        .gpr-pro-handle-e { right:-6px; top:50%; transform:translateY(-50%); cursor:ew-resize; }
        .gpr-pro-handle-w { left:-6px; top:50%; transform:translateY(-50%); cursor:ew-resize; }
        .gpr-pro-handle-ne { right:-6px; top:-6px; cursor:nesw-resize; }
        .gpr-pro-handle-nw { left:-6px; top:-6px; cursor:nwse-resize; }
        .gpr-pro-handle-se { right:-6px; bottom:-6px; cursor:nwse-resize; }
        .gpr-pro-handle-sw { left:-6px; bottom:-6px; cursor:nesw-resize; }
 
        /* ─── KEYFRAMES ─────────────────────────────────────────── */
        @keyframes gpr-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gpr-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gpr-scale-in {
          from { opacity: 0; transform: scale(.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes gpr-orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(22px,-18px) scale(1.06); }
          66%     { transform: translate(-14px,12px) scale(.96); }
        }
        @keyframes gpr-grain {
          0%,100% { background-position: 0 0; }
          25%     { background-position: 200px 50px; }
          50%     { background-position: 100px 200px; }
          75%     { background-position: 300px 150px; }
        }
        @keyframes gpr-shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
        @keyframes gpr-line-grow {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes gpr-pulse-glow {
          0%,100% { box-shadow: 0 0 24px color-mix(in srgb, var(--gpr-primary) 40%, transparent); }
          50%     { box-shadow: 0 0 52px color-mix(in srgb, var(--gpr-primary) 70%, transparent), 0 0 80px color-mix(in srgb, var(--gpr-primary) 30%, transparent); }
        }
 
        /* ─── SITE ROOT ─────────────────────────────────────────── */
        .gpr-site {
          min-height: 100%;
          position: relative;
          overflow: hidden;
          color: #f0ede8;
          background:
            radial-gradient(ellipse 80% 60% at 15% -5%, color-mix(in srgb, var(--gpr-primary) 12%, transparent), transparent 55%),
            radial-gradient(ellipse 60% 50% at 90% 10%, rgba(139,92,246,.08), transparent 40%),
            radial-gradient(ellipse 100% 80% at 50% 120%, color-mix(in srgb, var(--gpr-primary) 6%, transparent), transparent 50%),
            linear-gradient(160deg, #09090f 0%, #0d0d15 40%, #080810 100%);
          font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
        }
 
        /* film grain overlay */
        .gpr-site::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: .028;
          animation: gpr-grain 4s steps(8) infinite;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }
 
        /* horizontal scan line */
        .gpr-site::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.008) 2px, rgba(255,255,255,.008) 4px);
        }
 
        /* ─── LOADING SKELETON ─────────────────────────────────── */
        @keyframes gpr-skeleton-pulse {
          0%,100% { opacity: .4; }
          50%     { opacity: .7; }
        }
        .gpr-gallery-card.gpr-loading {
          background: rgba(255,255,255,.04);
          animation: gpr-skeleton-pulse 1.5s ease-in-out infinite;
        }
        .gpr-gallery-card.gpr-loading img { opacity: 0; }
 
        /* ─── MEDIA BG ──────────────────────────────────────────── */
        .gpr-media-bg {
          position: absolute; inset: 0; overflow: hidden;
          pointer-events: ${editing ? "auto" : "none"};
          opacity: .22;
        }
        .gpr-media-bg video,
        .gpr-media-bg img {
          width: 100%; height: 100%; object-fit: cover;
          filter: saturate(1.1) contrast(1.2) brightness(.7);
        }
        .gpr-media-bg::after {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 20% 20%, color-mix(in srgb, var(--gpr-primary) 15%, transparent), transparent 50%),
            linear-gradient(100deg, rgba(9,9,15,.97) 0%, rgba(9,9,15,.6) 50%, rgba(9,9,15,.9) 100%);
        }
 
        /* ─── LAYOUT WRAP ───────────────────────────────────────── */
        .gpr-wrap {
          position: relative;
          z-index: 2;
          width: min(1200px, calc(100% - 40px));
          margin: 0 auto;
        }
 
        /* ─── NAV ───────────────────────────────────────────────── */
        .gpr-nav {
          padding: 28px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: gpr-fade-in .8s ease both;
        }
        .gpr-logo {
          display: flex; align-items: center; gap: 12px;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 22px;
          letter-spacing: -.01em;
          color: #f0ede8;
        }
        .gpr-logo-mark {
          width: 32px; height: 32px; border-radius: 10px;
          background: var(--gpr-primary);
          animation: gpr-pulse-glow 3s ease-in-out infinite;
          display: grid; place-items: center;
          position: relative;
          flex-shrink: 0;
        }
        .gpr-logo-mark::after {
          content: "";
          position: absolute; inset: 6px;
          border-radius: 4px;
          background: rgba(0,0,0,.4);
        }
        .gpr-nav-pill {
          display: flex; align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(16px);
        }
        .gpr-nav-pill a {
          padding: 7px 16px;
          border-radius: 999px;
          color: rgba(240,237,232,.6);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: color .2s, background .2s;
        }
        .gpr-nav-pill a:hover {
          color: #f0ede8;
          background: rgba(255,255,255,.08);
        }
 
        /* ─── BUTTONS ───────────────────────────────────────────── */
        .gpr-btn {
          position: relative; overflow: hidden;
          cursor: pointer; border: none;
          border-radius: 14px;
          background: var(--gpr-primary);
          color: #09090f;
          padding: 14px 24px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -.01em;
          transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease, filter .2s ease;
          box-shadow:
            0 1px 0 rgba(255,255,255,.4) inset,
            0 8px 32px color-mix(in srgb, var(--gpr-primary) 35%, transparent),
            0 2px 8px rgba(0,0,0,.2);
        }
        .gpr-btn::before {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: gpr-shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
        .gpr-btn:hover {
          transform: translateY(-3px) scale(1.02);
          filter: brightness(1.08);
          box-shadow:
            0 1px 0 rgba(255,255,255,.4) inset,
            0 16px 48px color-mix(in srgb, var(--gpr-primary) 45%, transparent),
            0 4px 16px rgba(0,0,0,.3);
        }
        .gpr-btn:active { transform: translateY(0) scale(.98); }
        .gpr-btn-ghost {
          background: transparent;
          color: rgba(240,237,232,.8);
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: none;
        }
        .gpr-btn-ghost::before { display: none; }
        .gpr-btn-ghost:hover {
          background: rgba(255,255,255,.06);
          color: #f0ede8;
          border-color: rgba(255,255,255,.26);
          box-shadow: none;
          filter: none;
        }
 
        /* ─── HERO ──────────────────────────────────────────────── */
        .gpr-hero {
          min-height: 760px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 60px;
          align-items: center;
          padding: 60px 0 90px;
        }
        .gpr-hero-left > * {
          animation: gpr-fade-up .9s cubic-bezier(.16,1,.3,1) both;
        }
        .gpr-hero-left > *:nth-child(1) { animation-delay: .1s; }
        .gpr-hero-left > *:nth-child(2) { animation-delay: .22s; }
        .gpr-hero-left > *:nth-child(3) { animation-delay: .34s; }
        .gpr-hero-left > *:nth-child(4) { animation-delay: .46s; }
        .gpr-hero-left > *:nth-child(5) { animation-delay: .58s; }
 
        /* eyebrow tag */
        .gpr-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid color-mix(in srgb, var(--gpr-primary) 30%, rgba(255,255,255,.1));
          background: color-mix(in srgb, var(--gpr-primary) 8%, rgba(255,255,255,.04));
          color: var(--gpr-primary);
          border-radius: 999px;
          padding: 8px 16px;
          margin-bottom: 28px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .gpr-eyebrow::before {
          content: "";
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gpr-primary);
          box-shadow: 0 0 8px var(--gpr-primary);
          flex-shrink: 0;
        }
 
        /* hero headline */
        .gpr-hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(52px, 7.5vw, 108px);
          line-height: .92;
          letter-spacing: -.035em;
          margin: 0;
          color: #f0ede8;
        }
        .gpr-hero-h1 em {
          font-style: italic;
          color: var(--gpr-primary);
        }
        .gpr-hero-sub {
          max-width: 520px;
          color: rgba(240,237,232,.56);
          font-size: 18px;
          font-weight: 400;
          line-height: 1.75;
          margin: 24px 0 0;
        }
        .gpr-actions {
          display: flex; gap: 12px;
          margin-top: 36px; align-items: center;
          flex-wrap: wrap;
        }
 
        /* divider line accent */
        .gpr-line-accent {
          margin-top: 48px;
          display: flex; align-items: center; gap: 20px;
        }
        .gpr-line-accent::before {
          content: "";
          height: 1px; flex: 1;
          background: linear-gradient(90deg, color-mix(in srgb, var(--gpr-primary) 60%, transparent), transparent);
          animation: gpr-line-grow 1.2s .7s ease both;
        }
 
        /* ─── STATS ─────────────────────────────────────────────── */
        .gpr-stats {
          display: flex; gap: 0;
          margin-top: 52px;
          max-width: 540px;
        }
        .gpr-stat-item {
          flex: 1;
          padding: 22px 24px;
          position: relative;
        }
        .gpr-stat-item:not(:last-child)::after {
          content: "";
          position: absolute; right: 0; top: 20%; bottom: 20%;
          width: 1px;
          background: rgba(255,255,255,.1);
        }
        .gpr-stat-value {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 26px;
          font-weight: 500;
          color: #f0ede8;
          letter-spacing: -.04em;
        }
        .gpr-stat-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(240,237,232,.42);
          letter-spacing: .04em;
          text-transform: uppercase;
          margin-top: 4px;
        }
 
        /* ─── HERO VISUAL ───────────────────────────────────────── */
        .gpr-visual {
          position: relative;
          min-height: 600px;
          display: grid;
          place-items: center;
          animation: gpr-scale-in 1s .3s cubic-bezier(.16,1,.3,1) both;
        }
        .gpr-orb {
          position: absolute; border-radius: 999px;
          filter: blur(1px);
          animation: gpr-orb-drift 12s ease-in-out infinite;
        }
        .gpr-orb-a {
          width: 320px; height: 320px;
          right: -20px; top: 60px;
          background: radial-gradient(circle, color-mix(in srgb, var(--gpr-primary) 22%, transparent), transparent 70%);
          animation-duration: 14s;
        }
        .gpr-orb-b {
          width: 200px; height: 200px;
          left: 0; bottom: 80px;
          background: radial-gradient(circle, rgba(139,92,246,.18), transparent 70%);
          animation-duration: 10s;
          animation-delay: -4s;
        }
        .gpr-orb-c {
          width: 120px; height: 120px;
          right: 20%; top: 10%;
          background: radial-gradient(circle, rgba(56,189,248,.12), transparent 70%);
          animation-duration: 8s;
          animation-delay: -2s;
        }
 
        /* device mockup */
        .gpr-device {
          position: relative; z-index: 2;
          width: min(380px, 88vw);
          min-height: 540px;
          border-radius: 44px;
          border: 1px solid rgba(255,255,255,.14);
          background:
            linear-gradient(160deg, rgba(255,255,255,.1) 0%, rgba(255,255,255,.03) 100%);
          box-shadow:
            0 0 0 1px rgba(0,0,0,.5),
            0 48px 100px rgba(0,0,0,.6),
            0 0 80px color-mix(in srgb, var(--gpr-primary) 10%, transparent) inset;
          padding: 24px;
          backdrop-filter: blur(20px);
          transform: perspective(900px) rotateY(-8deg) rotateX(3deg);
          transition: transform .4s ease;
        }
        .gpr-device:hover {
          transform: perspective(900px) rotateY(-4deg) rotateX(1deg) translateY(-4px);
        }
        /* edge highlight */
        .gpr-device::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: 44px;
          background: linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 40%, transparent 60%, rgba(255,255,255,.06) 100%);
          pointer-events: none;
        }
        .gpr-notch {
          width: 88px; height: 7px; border-radius: 999px;
          margin: 0 auto 48px;
          background: rgba(255,255,255,.18);
        }
        .gpr-screen {
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(0,0,0,.4);
          padding: 24px;
          backdrop-filter: blur(8px);
        }
        .gpr-screen-label {
          font-family: 'DM Mono', monospace;
          color: var(--gpr-primary);
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: .14em;
        }
        .gpr-screen-brand {
          display: block;
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 600;
          letter-spacing: -.04em;
          line-height: .98;
          margin-top: 14px;
          color: #f0ede8;
        }
        .gpr-screen-tagline {
          color: rgba(240,237,232,.5);
          font-size: 13px;
          line-height: 1.6;
          margin-top: 14px;
        }
        .gpr-products {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .gpr-products div {
          height: 110px; border-radius: 20px;
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--gpr-primary) 20%, transparent), rgba(255,255,255,.05));
          border: 1px solid rgba(255,255,255,.1);
          overflow: hidden;
          transition: transform .25s ease;
        }
        .gpr-products div:hover { transform: scale(1.04); }
        .gpr-products img { width: 100%; height: 100%; object-fit: cover; opacity: .82; }
 
        /* ─── SECTION HEADER ────────────────────────────────────── */
        .gpr-section-head {
          margin-bottom: 48px;
        }
        .gpr-section-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'DM Mono', monospace;
          color: var(--gpr-primary);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .gpr-section-eyebrow::after {
          content: "";
          display: inline-block; width: 32px; height: 1px;
          background: var(--gpr-primary);
          opacity: .6;
        }
        .gpr-section-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(36px, 5vw, 68px);
          line-height: .95;
          letter-spacing: -.03em;
          margin: 0;
          color: #f0ede8;
          max-width: 820px;
        }
 
        /* ─── FEATURES ──────────────────────────────────────────── */
        .gpr-features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          padding: 0 0 88px;
        }
        .gpr-card {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          overflow: hidden;
          transition: transform .3s cubic-bezier(.2,.8,.2,1), border-color .3s ease, box-shadow .3s ease;
        }
        .gpr-card::before {
          content: "";
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 80% at 50% 0%, color-mix(in srgb, var(--gpr-primary) 6%, transparent), transparent 60%);
          opacity: 0;
          transition: opacity .3s ease;
        }
        .gpr-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--gpr-primary) 28%, rgba(255,255,255,.1));
          box-shadow: 0 24px 60px rgba(0,0,0,.28), 0 0 0 1px color-mix(in srgb, var(--gpr-primary) 10%, transparent);
        }
        .gpr-card:hover::before { opacity: 1; }
        .gpr-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: color-mix(in srgb, var(--gpr-primary) 12%, rgba(255,255,255,.06));
          border: 1px solid color-mix(in srgb, var(--gpr-primary) 25%, rgba(255,255,255,.1));
          margin-bottom: 22px;
          position: relative;
          display: grid; place-items: center;
        }
        .gpr-icon::after {
          content: "◈";
          color: var(--gpr-primary);
          font-size: 18px;
        }
        .gpr-card h3 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -.03em;
          color: #f0ede8;
        }
        .gpr-card p {
          color: rgba(240,237,232,.5);
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }
 
        /* card number badge */
        .gpr-card-num {
          position: absolute; top: 24px; right: 24px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(240,237,232,.2);
          letter-spacing: .04em;
        }
 
        /* ─── SECTION GRID ──────────────────────────────────────── */
        .gpr-section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          padding-bottom: 88px;
        }
        .gpr-section-card {
          position: relative;
          padding: 36px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          overflow: hidden;
          transition: transform .3s ease, border-color .3s ease;
        }
        .gpr-section-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,.14);
        }
        .gpr-section-card-large { grid-row: span 2; }
        .gpr-number {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--gpr-primary);
          letter-spacing: .1em;
          margin-bottom: 32px;
          display: flex; align-items: center; gap: 10px;
        }
        .gpr-number::after { content: ""; flex: 1; height: 1px; background: color-mix(in srgb, var(--gpr-primary) 20%, transparent); }
        .gpr-section-card h3 {
          margin: 0 0 12px;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -.03em;
          color: #f0ede8;
        }
        .gpr-section-card p {
          color: rgba(240,237,232,.5);
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }
        .gpr-chip-row {
          display: flex; gap: 8px; flex-wrap: wrap; margin-top: 24px;
        }
        .gpr-chip-row span {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          color: rgba(240,237,232,.65);
          font-size: 12px;
          font-weight: 500;
          transition: border-color .2s, color .2s, background .2s;
        }
        .gpr-chip-row span:hover {
          border-color: color-mix(in srgb, var(--gpr-primary) 40%, rgba(255,255,255,.1));
          color: var(--gpr-primary);
          background: color-mix(in srgb, var(--gpr-primary) 6%, rgba(255,255,255,.04));
        }
 
        /* ─── GALLERY ───────────────────────────────────────────── */
        .gpr-gallery {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-auto-rows: 240px;
          gap: 16px;
          padding-bottom: 88px;
        }
        /* Make first card span 2 cols + 2 rows for visual interest */
        .gpr-gallery .gpr-gallery-card:first-child {
          grid-column: span 2;
          grid-row: span 2;
        }
        /* 5th card spans 2 cols */
        .gpr-gallery .gpr-gallery-card:nth-child(5) {
          grid-column: span 2;
        }
        .gpr-gallery-card {
          min-height: 280px; border-radius: 24px; overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          position: relative;
          cursor: pointer;
          transform: translateZ(0);
          transition: transform .38s cubic-bezier(.2,.8,.2,1), border-color .3s ease, box-shadow .3s ease;
        }
        .gpr-gallery-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: color-mix(in srgb, var(--gpr-primary) 35%, rgba(255,255,255,.1));
          box-shadow: 0 28px 72px rgba(0,0,0,.42), 0 0 40px color-mix(in srgb, var(--gpr-primary) 15%, transparent);
        }
        .gpr-gallery-card img {
          width: 100%; height: 100%; min-height: 280px; object-fit: cover;
          transition: transform .45s cubic-bezier(.2,.8,.2,1), filter .3s ease;
          filter: saturate(1.05) contrast(1.05);
        }
        .gpr-gallery-card:hover img {
          transform: scale(1.08);
          filter: saturate(1.12) contrast(1.08) brightness(1.04);
        }
        .gpr-gallery-info {
          position: absolute; left: 16px; right: 16px; bottom: 16px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px; padding: 16px 18px;
          background: rgba(9,9,15,.72);
          backdrop-filter: blur(16px);
          transform: translateY(4px);
          opacity: .9;
          transition: opacity .3s ease, transform .3s ease;
        }
        .gpr-gallery-card:hover .gpr-gallery-info {
          opacity: 1; transform: translateY(0);
        }
        .gpr-gallery-info span {
          font-family: 'DM Mono', monospace;
          color: var(--gpr-primary);
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .gpr-gallery-info strong {
          display: block; margin-top: 5px;
          font-size: 16px; font-weight: 600;
          letter-spacing: -.02em;
          color: #f0ede8;
        }
 
        /* ─── PRICING ───────────────────────────────────────────── */
        .gpr-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          padding-bottom: 88px;
        }
        .gpr-price-card {
          padding: 36px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          transition: transform .3s ease, border-color .3s ease;
        }
        .gpr-price-card:hover {
          transform: translateY(-6px);
          border-color: color-mix(in srgb, var(--gpr-primary) 25%, rgba(255,255,255,.1));
        }
        .gpr-price-card p { color: rgba(240,237,232,.55); font-size: 14px; line-height: 1.65; margin: 10px 0 0; }
        .gpr-price-card h3 { font-family: 'DM Mono', monospace; font-size: 38px; font-weight: 400; margin: 16px 0; color: #f0ede8; letter-spacing: -.04em; }
        .gpr-price-card ul { list-style: none; padding: 0; margin: 20px 0 0; display: flex; flex-direction: column; gap: 10px; }
        .gpr-price-card li { color: rgba(240,237,232,.65); font-size: 14px; display: flex; align-items: center; gap: 10px; }
        .gpr-price-card li::before { content: "✦"; color: var(--gpr-primary); font-size: 10px; flex-shrink: 0; }
 
        /* ─── CTA SECTION ───────────────────────────────────────── */
        .gpr-cta {
          margin: 0 auto 48px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 32px;
          padding: 72px 64px;
          position: relative; overflow: hidden;
          background:
            radial-gradient(ellipse 80% 70% at 80% 20%, color-mix(in srgb, var(--gpr-primary) 10%, transparent), transparent 55%),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,92,246,.07), transparent 50%),
            rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
        }
        .gpr-cta::before {
          content: "";
          position: absolute; inset: -1px;
          border-radius: 32px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--gpr-primary) 20%, transparent), transparent 40%, transparent 60%, rgba(139,92,246,.12));
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: xor;
          padding: 1px;
          pointer-events: none;
        }
        .gpr-cta-eyebrow {
          font-family: 'DM Mono', monospace;
          color: var(--gpr-primary);
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .gpr-cta h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(38px, 5vw, 70px);
          line-height: .96;
          letter-spacing: -.03em;
          margin: 0 0 32px;
          color: #f0ede8;
          max-width: 700px;
        }
 
        /* ─── FOOTER ────────────────────────────────────────────── */
        .gpr-footer {
          padding: 36px 0 52px;
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid rgba(255,255,255,.08);
          color: rgba(240,237,232,.35);
          font-size: 13px;
        }
        .gpr-footer-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: rgba(240,237,232,.6);
          letter-spacing: -.01em;
        }
 
        /* ─── SCROLL TARGETS ────────────────────────────────────── */
        #experience, #features, #work, #gallery, #pricing, #contact {
          scroll-margin-top: 96px;
        }
        html { scroll-behavior: smooth; }
 
        /* ─── TEMPLATE VARIANTS ─────────────────────────────────── */
        .gpr-template-saas-product .gpr-hero { grid-template-columns: .9fr 1.1fr; }
        .gpr-template-saas-product .gpr-device { width: min(520px,90vw); border-radius: 24px; transform: perspective(900px) rotateY(-5deg); }
        .gpr-template-local-business .gpr-hero { grid-template-columns: 1fr .8fr; }
        .gpr-template-local-business .gpr-features { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .gpr-template-local-business .gpr-btn { border-radius: 10px; }
        .gpr-template-hospitality-experience .gpr-hero { min-height: 800px; }
        .gpr-template-hospitality-experience .gpr-device { width: min(460px,90vw); min-height: 640px; border-radius: 52px; }
        .gpr-template-portfolio-personal .gpr-hero { grid-template-columns: .85fr 1.15fr; }
        .gpr-template-portfolio-personal .gpr-features { grid-template-columns: repeat(4,minmax(0,1fr)); }
        .gpr-template-ecommerce-product .gpr-products { grid-template-columns: repeat(2,1fr); }
        .gpr-template-ecommerce-product .gpr-products div { height: 140px; }
        .gpr-template-real-estate .gpr-device { width: min(560px,92vw); min-height: 440px; border-radius: 32px; }
        .gpr-template-real-estate .gpr-section-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .gpr-template-event-conference .gpr-hero { grid-template-columns: 1fr; text-align: center; }
        .gpr-template-event-conference .gpr-hero-left { max-width: 900px; margin: 0 auto; }
        .gpr-template-event-conference .gpr-actions,
        .gpr-template-event-conference .gpr-stats { justify-content: center; }
        .gpr-template-event-conference .gpr-visual { display: none; }
        .gpr-template-mobile-app .gpr-device { width: min(320px,86vw); min-height: 660px; border-radius: 56px; }
        .gpr-template-mobile-app .gpr-features { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .gpr-template-agency-studio .gpr-hero-h1 { font-size: clamp(58px,8.5vw,118px); }
        .gpr-template-agency-studio .gpr-section-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .gpr-template-blog-magazine .gpr-hero { grid-template-columns: 1fr; }
        .gpr-template-blog-magazine .gpr-visual { display: none; }
        .gpr-template-blog-magazine .gpr-features { grid-template-columns: 1.4fr .8fr .8fr; }
 
        /* ─── RESPONSIVE ────────────────────────────────────────── */
        @media (max-width: 900px) {
          .gpr-nav-pill { display: none; }
          .gpr-hero { grid-template-columns: 1fr; min-height: auto; gap: 40px; }
          .gpr-visual { min-height: 400px; }
          .gpr-device { transform: none !important; width: min(340px,90vw) !important; }
          .gpr-features,
          .gpr-pricing-grid,
          .gpr-section-grid,
          .gpr-gallery { grid-template-columns: 1fr; }
          .gpr-stats { flex-direction: row; flex-wrap: wrap; }
          .gpr-stat-item { min-width: 120px; }
          .gpr-hero-h1 { font-size: clamp(44px, 10vw, 64px); }
          .gpr-cta { padding: 40px 32px; }
          .gpr-cta h2 { font-size: clamp(32px, 7vw, 52px); }
        }
      `}</style>
 
      {/* Custom elements */}
      {customElements.map((item, index) => {
        const id = `customElements.${index}`;
        const value = text(item?.text, "Double click text");
        return (
          <div key={id} {...editable(id, "custom text", value, { className: "gpr-custom-element", style: item?.styles || {} })}>
            {value}
          </div>
        );
      })}
 
      <div className={`gpr-wrap gpr-template-${templateId}`}>
 
        {/* ── NAV ── */}
        <nav {...editable("nav", "navigation bar", undefined, { className: "gpr-nav" })}>
          <div {...editable("brandName", "brand", brandName, { className: "gpr-logo" })}>
            <span className="gpr-logo-mark" />
            <span>{brandName}</span>
          </div>
 
          <div className="gpr-nav-pill">
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
 
        {/* ── HERO ── */}
        <section id="experience" {...editable("heroSection", "hero section", undefined, { className: "gpr-hero" })}>
          <div className="gpr-hero-left">
            <div {...editable("hero.eyebrow", "hero eyebrow", text(hero.eyebrow, industry), { className: "gpr-eyebrow" })}>
              {text(hero.eyebrow, industry)}
            </div>
 
            <h1 className="gpr-hero-h1" {...editable("hero.headline", "hero headline", text(hero.headline, `Premium ${brandName}`))}>
              {text(hero.headline, `Premium ${brandName}`)}
            </h1>
 
            <p className="gpr-hero-sub" {...editable("hero.subheadline", "hero subheadline", text(hero.subheadline, tagline))}>
              {text(hero.subheadline, tagline)}
            </p>
 
            <div {...editable("hero.actions", "hero buttons row", undefined, { className: "gpr-actions" })}>
              <button {...editable("hero.primaryCta", "button", text(hero.primaryCta, "Get Started"), { className: "gpr-btn" })}>
                {primaryCtaLabel}
              </button>
              <button {...editable("hero.secondaryCta", "button", text(hero.secondaryCta, "Explore"), { className: "gpr-btn gpr-btn-ghost" })}>
                {secondaryCtaLabel}
              </button>
            </div>
 
            <div {...editable("stats", "stats row", undefined, { className: "gpr-stats" })}>
              {stats.slice(0, 3).map((stat, idx) => (
                <div key={`stat-${idx}`} className="gpr-stat-item" {...editable(`stats.${idx}`, "stat card", undefined)}>
                  <strong className="gpr-stat-value" {...editable(`stats.${idx}.title`, "stat title", text(stat.title, ""))}>
                    {text(stat.title, "")}
                  </strong>
                  <span className="gpr-stat-label" {...editable(`stats.${idx}.label`, "stat label", text(stat.label, ""))}>
                    {text(stat.label, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
 
          <div {...editable("hero.visual", "hero visual", undefined, { className: "gpr-visual" })}>
            <div {...editable("hero.device", "hero device", undefined, { className: "gpr-device" })}>
              <div {...editable("hero.device.notch", "device notch", undefined, { className: "gpr-notch" })} />
              <div {...editable("hero.device.screen", "device screen", undefined, { className: "gpr-screen" })}>
                <span className="gpr-screen-label" {...editable("industry", "industry", industry)}>{industry}</span>
                <strong className="gpr-screen-brand" {...editable("brandName", "brand", brandName)}>{brandName}</strong>
                <p className="gpr-screen-tagline" {...editable("tagline", "tagline", tagline)}>{tagline}</p>
              </div>
              <div {...editable("mediaAssets.collectionImages", "mini image row", undefined, { className: "gpr-products" })}>
                {[0, 1, 2].map((idx) => (
                  <div key={`mini-${idx}`} {...editable(`mediaAssets.collectionImages.${idx}`, "image card", undefined)}>
                    {collectionImages[idx]?.imageUrl && (
                      <img src={collectionImages[idx].imageUrl} alt={collectionImages[idx].title || ""}
                        {...editableMedia(`mediaAssets.collectionImages.${idx}.imageUrl`, "image", collectionImages[idx].imageUrl)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div {...editable("hero.orbA", "decor orb", undefined, { className: "gpr-orb gpr-orb-a" })} />
            <div {...editable("hero.orbB", "decor orb", undefined, { className: "gpr-orb gpr-orb-b" })} />
            <div className="gpr-orb gpr-orb-c" />
          </div>
        </section>
 
        {/* ── FEATURES ── */}
        <section id="features" {...editable("features", "features section", undefined)}>
          <div className="gpr-section-head">
            <p className="gpr-section-eyebrow">Capabilities</p>
            <h2 className="gpr-section-h2">Everything you need to stand out</h2>
          </div>
          <div className="gpr-features">
            {features.slice(0, 9).map((item, index) => (
              <article key={`feature-${index}`} {...editable(`features.${index}`, "feature card", undefined, { className: "gpr-card" })}>
                <span className="gpr-card-num">0{index + 1}</span>
                <div {...editable(`features.${index}.icon`, "feature icon", undefined, { className: "gpr-icon" })} />
                <h3 {...editable(`features.${index}.title`, "feature title", text(item.title, "Premium Feature"))}>
                  {text(item.title, "Premium Feature")}
                </h3>
                <p {...editable(`features.${index}.description`, "feature description", text(item.description, "Premium section description."))}>
                  {text(item.description, "Premium section description.")}
                </p>
              </article>
            ))}
          </div>
        </section>
 
        {/* ── SECTIONS ── */}
        <section id="work" {...editable("sectionsArea", "sections area", undefined)}>
          <div {...editable("sectionIntro", "section intro", undefined, { className: "gpr-section-head" })}>
            <p className="gpr-section-eyebrow" {...editable("sectionIntro.eyebrow", "section eyebrow", text(state.sectionIntro?.eyebrow, "Experience Architecture"))}>
              {text(state.sectionIntro?.eyebrow, "Experience Architecture")}
            </p>
            <h2 className="gpr-section-h2" {...editable("sectionIntro.headline", "section headline", text(state.sectionIntro?.headline, "Designed like a premium product launch"))}>
              {text(state.sectionIntro?.headline, "Designed like a premium product launch")}
            </h2>
          </div>
 
          <div {...editable("sections", "section cards grid", undefined, { className: "gpr-section-grid" })}>
            {sections.slice(0, 6).map((section, index) => (
              <article key={`section-${index}`} {...editable(`sections.${index}`, "section card", undefined, { className: `gpr-section-card ${index === 0 ? "gpr-section-card-large" : ""}` })}>
                <div className="gpr-number" {...editable(`sections.${index}.number`, "section number", `0${index + 1}`)}>
                  0{index + 1}
                </div>
                <h3 {...editable(`sections.${index}.title`, "section title", text(section.title, "Premium Section"))}>
                  {text(section.title, "Premium Section")}
                </h3>
                <p {...editable(`sections.${index}.description`, "section description", text(section.description, "Premium section copy."))}>
                  {text(section.description, "Premium section copy.")}
                </p>
                <div {...editable(`sections.${index}.items`, "chips row", undefined, { className: "gpr-chip-row" })}>
                  {list(section.items, ["Premium", "Modern", "Responsive"]).slice(0, 8).map((item, idx) => (
                    <span key={`chip-${index}-${idx}`} {...editable(`sections.${index}.items.${idx}`, "chip", item)}>{item}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
 
        {/* ── GALLERY ── */}
        <section id="gallery" {...editable("mediaGallery", "media gallery", undefined)}>
            <div {...editable("galleryIntro", "gallery intro", undefined, { className: "gpr-section-head" })}>
              <p className="gpr-section-eyebrow" {...editable("galleryIntro.eyebrow", "gallery eyebrow", text(state.galleryIntro?.eyebrow, "Visual Direction"))}>
                {text(state.galleryIntro?.eyebrow, "Visual Direction")}
              </p>
              <h2 className="gpr-section-h2" {...editable("galleryIntro.headline", "gallery headline", text(state.galleryIntro?.headline, "Real media matched to the project subject"))}>
                {text(state.galleryIntro?.headline, "Real media matched to the project subject")}
              </h2>
            </div>
            <div {...editable("mediaAssets.collectionImages", "gallery grid", undefined, { className: "gpr-gallery" })}>
              {collectionImages.slice(0, 8).map((item, index) => (
                <article key={`gallery-${index}`} {...editable(`mediaAssets.collectionImages.${index}`, "gallery card", undefined, { className: "gpr-gallery-card" })}>
                  <img src={item.imageUrl} alt={item.title || ""}
                    {...editableMedia(`mediaAssets.collectionImages.${index}.imageUrl`, "image", item.imageUrl)} />
                  <div {...editable(`mediaAssets.collectionImages.${index}.info`, "gallery info", undefined, { className: "gpr-gallery-info" })}>
                    <span {...editable(`mediaAssets.collectionImages.${index}.tag`, "image tag", text(item.tag, "Premium"))}>
                      {text(item.tag, "Premium")}
                    </span>
                    <strong {...editable(`mediaAssets.collectionImages.${index}.subtitle`, "image subtitle", text(item.subtitle || item.title, industry))}>
                      {text(item.subtitle || item.title, industry)}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
        </section>
 
        {/* ── PRICING ── */}
        {pricing.length > 0 && (
          <section id="pricing" {...editable("pricing", "pricing section", undefined)}>
            <div {...editable("pricingIntro", "pricing intro", undefined, { className: "gpr-section-head" })}>
              <p className="gpr-section-eyebrow" {...editable("pricingIntro.eyebrow", "pricing eyebrow", text(state.pricingIntro?.eyebrow, "Offers"))}>
                {text(state.pricingIntro?.eyebrow, "Offers")}
              </p>
              <h2 className="gpr-section-h2" {...editable("pricingIntro.headline", "pricing headline", text(state.pricingIntro?.headline, "Choose the right experience"))}>
                {text(state.pricingIntro?.headline, "Choose the right experience")}
              </h2>
            </div>
            <div {...editable("pricing", "pricing grid", undefined, { className: "gpr-pricing-grid" })}>
              {pricing.slice(0, 3).map((plan, index) => (
                <article key={`price-${index}`} {...editable(`pricing.${index}`, "price card", undefined, { className: "gpr-price-card" })}>
                  <p {...editable(`pricing.${index}.name`, "plan name", text(plan.name, "Plan"))}>{text(plan.name, "Plan")}</p>
                  <h3 {...editable(`pricing.${index}.price`, "plan price", text(plan.price, "Custom"))}>{text(plan.price, "Custom")}</h3>
                  <p {...editable(`pricing.${index}.description`, "plan description", text(plan.description, "Premium offer."))}>{text(plan.description, "Premium offer.")}</p>
                  <ul {...editable(`pricing.${index}.features`, "plan features", undefined)}>
                    {list(plan.features, ["Premium design", "Responsive build", "Launch ready"]).slice(0, 6).map((f, i) => (
                      <li key={`pf-${index}-${i}`} {...editable(`pricing.${index}.features.${i}`, "plan feature", f)}>{f}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
 
        {/* ── CTA ── */}
        <section id="contact" {...editable("footerCta", "footer CTA", undefined, { className: "gpr-cta" })}>
          <p className="gpr-cta-eyebrow" {...editable("industry", "footer eyebrow", industry)}>{industry}</p>
          <h2 {...editable("footer.headline", "footer headline", text(footer.headline, `Ready to launch ${brandName}?`))}>
            {text(footer.headline, `Ready to launch ${brandName}?`)}
          </h2>
          <button {...editable("footer.cta", "footer button", text(footer.cta, text(hero.primaryCta, "Start Now")), { className: "gpr-btn" })}>
            {text(footer.cta, text(hero.primaryCta, "Start Now"))}
          </button>
        </section>
 
        {/* ── FOOTER ── */}
        <footer {...editable("footer", "footer", undefined, { className: "gpr-footer" })}>
          <span className="gpr-footer-brand" {...editable("brandName", "footer brand", brandName)}>{brandName}</span>
          <span {...editable("tagline", "footer tagline", tagline)}>{tagline}</span>
        </footer>
      </div>
    </div>
  );
}