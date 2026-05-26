"use client";

import React from "react";

type WebsiteOutput = {
  brandName?: string;
  tagline?: string;
  industry?: string;
  style?: string;
  userPrompt?: string;
  prompt?: string;
  primaryColor?: string;
  secondaryColor?: string;
  previewInstructions?: {
    background?: string;
    typography?: string;
    spacing?: string;
    mood?: string;
  };
  visualSystem?: {
    backgroundType?: string;
    backgroundPrompt?: string;
    motion?: string;
    details?: string[];
  };
  mediaAssets?: {
    heroVideoUrl?: string;
    heroPosterUrl?: string;
    heroImageUrl?: string;
    backgroundVideoUrl?: string;
    backgroundImageUrl?: string;
    collectionImages?: {
      title?: string;
      subtitle?: string;
      tag?: string;
      imageUrl?: string;
    }[];
  };
  hero?: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    primaryCta?: string;
    secondaryCta?: string;
  };
  sections?: {
    title?: string;
    description?: string;
    content?: string;
    items?: string[];
  }[];
  features?: {
    title?: string;
    description?: string;
    icon?: string;
  }[];
  pricing?: {
    name?: string;
    price?: string;
    description?: string;
    features?: string[];
    highlighted?: boolean;
  }[];
  footer?: {
    headline?: string;
    cta?: string;
  };
};

type VisualMood = "dark-cinematic" | "light-apple" | "luxury-gold" | "tech-bento" | "editorial-studio";

type VisualSystem = {
  mood: VisualMood;
  layout: "cinematic" | "split" | "bento" | "editorial";
  density: "calm" | "rich";
  label: string;
};

type Theme = {
  page: string;
  page2: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  soft: string;
  border: string;
  primary: string;
  primary2: string;
  buttonText: string;
  glow: string;
  overlay: string;
  heroGradient: string;
};

function safe(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return text || fallback;
}

function cleanGeneratedText(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  if (!text) return fallback;

  const bad = text.toLowerCase();

  if (
    bad.includes("fallback candidate") ||
    bad.includes("exact media query") ||
    bad.includes("subject match") ||
    bad.includes("debug") ||
    bad.includes("placeholder") ||
    bad.includes("generated image") ||
    bad.includes("pexels") ||
    bad.includes("mode instructions")
  ) {
    return fallback;
  }

  return text;
}

function textBlob(website: WebsiteOutput) {
  return [
    website.userPrompt,
    website.prompt,
    website.brandName,
    website.tagline,
    website.industry,
    website.style,
    website.primaryColor,
    website.secondaryColor,
    website.previewInstructions?.background,
    website.previewInstructions?.typography,
    website.previewInstructions?.spacing,
    website.previewInstructions?.mood,
    website.visualSystem?.backgroundType,
    website.visualSystem?.backgroundPrompt,
    website.visualSystem?.motion,
    ...(website.visualSystem?.details || []),
    website.hero?.eyebrow,
    website.hero?.headline,
    website.hero?.subheadline,
    ...(website.features || []).flatMap((item) => [item.title, item.description, item.icon]),
    ...(website.sections || []).flatMap((item) => [item.title, item.description, item.content, ...(item.items || [])]),
  ]
    .join(" ")
    .toLowerCase();
}

function resolveThemeIntent(website: WebsiteOutput): "dark" | "light" | "auto" {
  const text = textBlob(website);
  const primary = String(website.primaryColor || "").trim().toLowerCase();
  const background = String(website.previewInstructions?.background || "").trim().toLowerCase();

  const darkSignals = [
    "dark",
    "black",
    "night",
    "cinematic",
    "dark mode",
    "тъмен",
    "тъмна",
    "тъмно",
    "черен",
    "черна",
    "черно",
    "нощен",
    "премиум тъмен",
    "temen",
    "tumna",
    "cheren",
    "darken",
  ];

  const lightSignals = [
    "light",
    "white",
    "bright",
    "clean white",
    "светъл",
    "светла",
    "светло",
    "бял",
    "бяла",
    "бяло",
    "svetul",
    "svetla",
    "bial",
    "byal",
  ];

  const darkScore =
    darkSignals.reduce((score, word) => score + (text.includes(word) ? 2 : 0), 0) +
    (background.includes("dark") || background.includes("тъмен") ? 4 : 0) +
    (primary === "#000" || primary === "#000000" || primary.includes("black") ? 3 : 0);

  const lightScore =
    lightSignals.reduce((score, word) => score + (text.includes(word) ? 2 : 0), 0) +
    (background.includes("light") || background.includes("свет") ? 4 : 0) +
    (primary === "#fff" || primary === "#ffffff" || primary.includes("white") ? 3 : 0);

  if (darkScore > lightScore) return "dark";
  if (lightScore > darkScore) return "light";
  return "auto";
}

function inferVisualSystem(website: WebsiteOutput): VisualSystem {
  const text = textBlob(website);
  const themeIntent = resolveThemeIntent(website);
  const primary = String(website.primaryColor || "").toLowerCase();
  const secondary = String(website.secondaryColor || "").toLowerCase();

  const wantsGold =
    text.includes("gold") ||
    text.includes("luxury") ||
    text.includes("лукс") ||
    text.includes("злат") ||
    primary.includes("gold") ||
    primary.includes("#d4af37");

  const wantsLight =
    text.includes("minimal") ||
    text.includes("apple") ||
    text.includes("clean") ||
    text.includes("light") ||
    text.includes("светъл") ||
    text.includes("минимал") ||
    primary.includes("white") ||
    primary.includes("#fff");

  const wantsTech =
    text.includes("tech") ||
    text.includes("saas") ||
    text.includes("ai") ||
    text.includes("software") ||
    text.includes("dashboard") ||
    text.includes("blue") ||
    text.includes("cyber") ||
    primary.includes("blue") ||
    secondary.includes("blue");

  const wantsEditorial =
    text.includes("studio") ||
    text.includes("agency") ||
    text.includes("portfolio") ||
    text.includes("editorial") ||
    text.includes("brand") ||
    text.includes("creative");

  if (themeIntent === "dark" && !wantsGold) {
    return {
      mood: wantsTech ? "tech-bento" : "dark-cinematic",
      layout: wantsTech ? "bento" : "cinematic",
      density: "rich",
      label: wantsTech ? "Dark tech visual system" : "Dark premium visual system",
    };
  }

  if (themeIntent === "light" && !wantsGold) {
    return {
      mood: wantsTech ? "tech-bento" : "light-apple",
      layout: wantsTech ? "bento" : "split",
      density: wantsTech ? "rich" : "calm",
      label: wantsTech ? "Light tech visual system" : "Light premium visual system",
    };
  }

  if (wantsGold) {
    return {
      mood: "luxury-gold",
      layout: "cinematic",
      density: "rich",
      label: "Luxury visual system",
    };
  }

  if (wantsLight) {
    return {
      mood: "light-apple",
      layout: "split",
      density: "calm",
      label: "Apple-style visual system",
    };
  }

  if (wantsTech) {
    return {
      mood: "tech-bento",
      layout: "bento",
      density: "rich",
      label: "Tech bento visual system",
    };
  }

  if (wantsEditorial) {
    return {
      mood: "editorial-studio",
      layout: "editorial",
      density: "calm",
      label: "Editorial studio visual system",
    };
  }

  return {
    mood: "dark-cinematic",
    layout: "cinematic",
    density: "rich",
    label: "Premium cinematic visual system",
  };
}

function getTheme(website: WebsiteOutput, system: VisualSystem): Theme {
  const customPrimary = String(website.primaryColor || "").trim();
  const customSecondary = String(website.secondaryColor || "").trim();

  if (system.mood === "light-apple") {
    return {
      page: "#f8fafc",
      page2: "#eef2f7",
      surface: "rgba(255,255,255,0.82)",
      surface2: "rgba(241,245,249,0.92)",
      text: "#0f172a",
      muted: "#64748b",
      soft: "#334155",
      border: "rgba(15,23,42,0.12)",
      primary: customPrimary || "#2563eb",
      primary2: customSecondary || "#60a5fa",
      buttonText: "#ffffff",
      glow: "0 28px 80px rgba(37,99,235,0.16)",
      overlay: "linear-gradient(90deg, rgba(248,250,252,.95), rgba(248,250,252,.62), rgba(248,250,252,.25))",
      heroGradient: "radial-gradient(circle at 20% 20%, rgba(37,99,235,.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(14,165,233,.15), transparent 32%)",
    };
  }

  if (system.mood === "luxury-gold") {
    return {
      page: "#080604",
      page2: "#150f08",
      surface: "rgba(30,22,12,0.82)",
      surface2: "rgba(45,32,15,0.88)",
      text: "#fff7ed",
      muted: "#d6c4aa",
      soft: "#f3d28a",
      border: "rgba(245,203,120,0.24)",
      primary: customPrimary || "#d4af37",
      primary2: customSecondary || "#f5d37a",
      buttonText: "#120c03",
      glow: "0 32px 90px rgba(212,175,55,0.22)",
      overlay: "linear-gradient(90deg, rgba(8,6,4,.96), rgba(8,6,4,.68), rgba(8,6,4,.28))",
      heroGradient: "radial-gradient(circle at 18% 18%, rgba(212,175,55,.26), transparent 34%), radial-gradient(circle at 78% 12%, rgba(255,255,255,.10), transparent 28%)",
    };
  }

  if (system.mood === "tech-bento") {
    return {
      page: "#020617",
      page2: "#07111f",
      surface: "rgba(15,23,42,0.78)",
      surface2: "rgba(30,41,59,0.72)",
      text: "#f8fafc",
      muted: "#94a3b8",
      soft: "#cbd5e1",
      border: "rgba(148,163,184,0.20)",
      primary: customPrimary || "#22c55e",
      primary2: customSecondary || "#38bdf8",
      buttonText: "#020617",
      glow: "0 32px 110px rgba(34,197,94,0.20)",
      overlay: "linear-gradient(90deg, rgba(2,6,23,.96), rgba(2,6,23,.66), rgba(2,6,23,.28))",
      heroGradient: "radial-gradient(circle at 18% 20%, rgba(34,197,94,.24), transparent 34%), radial-gradient(circle at 78% 16%, rgba(56,189,248,.18), transparent 34%)",
    };
  }

  if (system.mood === "editorial-studio") {
    return {
      page: "#10100e",
      page2: "#181714",
      surface: "rgba(250,250,247,0.08)",
      surface2: "rgba(250,250,247,0.12)",
      text: "#fafaf7",
      muted: "#c7c4b8",
      soft: "#e8e2cc",
      border: "rgba(250,250,247,0.16)",
      primary: customPrimary || "#f97316",
      primary2: customSecondary || "#fb7185",
      buttonText: "#111111",
      glow: "0 32px 90px rgba(249,115,22,0.18)",
      overlay: "linear-gradient(90deg, rgba(16,16,14,.95), rgba(16,16,14,.65), rgba(16,16,14,.26))",
      heroGradient: "radial-gradient(circle at 18% 18%, rgba(249,115,22,.20), transparent 36%), radial-gradient(circle at 78% 18%, rgba(251,113,133,.14), transparent 32%)",
    };
  }

  return {
    page: "#030712",
    page2: "#0b1020",
    surface: "rgba(17,24,39,0.78)",
    surface2: "rgba(31,41,55,0.72)",
    text: "#f9fafb",
    muted: "#a1a1aa",
    soft: "#e4e4e7",
    border: "rgba(255,255,255,0.14)",
    primary: customPrimary || "#22c55e",
    primary2: customSecondary || "#84cc16",
    buttonText: "#020617",
    glow: "0 34px 120px rgba(34,197,94,0.20)",
    overlay: "linear-gradient(90deg, rgba(3,7,18,.96), rgba(3,7,18,.66), rgba(3,7,18,.24))",
    heroGradient: "radial-gradient(circle at 18% 18%, rgba(34,197,94,.22), transparent 34%), radial-gradient(circle at 82% 16%, rgba(132,204,22,.14), transparent 34%)",
  };
}

function displayHeroHeadline(website: WebsiteOutput) {
  const brand = safe(website.brandName, safe(website.industry, "Premium Brand"));
  const headline = String(website.hero?.headline || "").trim();

  if (
    !headline ||
    headline.toLowerCase().startsWith("premium website for") ||
    headline.toLowerCase().startsWith("website for") ||
    headline.toLowerCase().includes("mode instructions")
  ) {
    return `${brand}: премиум дигитално изживяване`;
  }

  return headline;
}

function displayHeroSubheadline(website: WebsiteOutput) {
  const industry = safe(website.industry || website.brandName, "бранда");
  const sub = String(website.hero?.subheadline || website.tagline || "").trim();

  if (
    !sub ||
    sub.toLowerCase().includes("placeholder") ||
    sub.toLowerCase().includes("mode instructions")
  ) {
    return `Професионално представяне за ${industry} с ясен фокус, силно първо впечатление и премиум структура, създадена за доверие и действие.`;
  }

  return sub;
}

function cleanMediaTitle(item: { title?: string; tag?: string }, index: number) {
  const tag = String(item.tag || "").toLowerCase();
  const fallback =
    index === 0 ? "Hero visual direction" :
    index === 1 ? "Premium detail" :
    index === 2 ? "Customer moment" :
    "Brand atmosphere";

  return cleanGeneratedText(item.title || item.tag, fallback);
}

function cleanMediaSubtitle(item: { subtitle?: string }, website: WebsiteOutput) {
  const industry = safe(website.industry || website.brandName, "темата");
  return cleanGeneratedText(
    item.subtitle,
    `Визуален акцент, който подсилва доверието и усещането за ${industry}.`,
  );
}

function getHeroMedia(website: WebsiteOutput) {
  return {
    video: website.mediaAssets?.heroVideoUrl || website.mediaAssets?.backgroundVideoUrl || "",
    poster: website.mediaAssets?.heroPosterUrl || website.mediaAssets?.heroImageUrl || website.mediaAssets?.backgroundImageUrl || "",
    image: website.mediaAssets?.heroImageUrl || website.mediaAssets?.backgroundImageUrl || "",
  };
}

function galioEditable(type: "text" | "image" | "section" | "button" | "background", path: string, label: string) {
  return {
    "data-galio-editable": type,
    "data-galio-path": path,
    "data-galio-label": label,
  } as const;
}

function scrollToSection(id: string, trigger?: HTMLElement | null) {
  const root = trigger?.closest(".gpv3-root") as HTMLElement | null;
  const target = root?.querySelector(`#${id}`) as HTMLElement | null;

  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function Button({
  children,
  t,
  variant = "primary",
  onClick,
}: {
  children: React.ReactNode;
  t: Theme;
  variant?: "primary" | "secondary";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="gpv3-btn"
      onClick={onClick}
      style={{
        background: variant === "primary" ? `linear-gradient(135deg, ${t.primary}, ${t.primary2})` : "transparent",
        color: variant === "primary" ? t.buttonText : t.text,
        borderColor: variant === "primary" ? "transparent" : t.border,
        boxShadow: variant === "primary" ? t.glow : "none",
      }}
    >
      {children}
    </button>
  );
}

function Nav({ website, t, system }: { website: WebsiteOutput; t: Theme; system: VisualSystem }) {
  const links = [
    ["Value", "value"],
    ["Visuals", "visuals"],
    ["Experience", "experience"],
    ["Contact", "contact"],
  ];

  return (
    <nav className="gpv3-nav" style={{ background: t.surface, borderColor: t.border }}>
      <button className="gpv3-logo" style={{ color: t.text }} onClick={(event) => scrollToSection("top", event.currentTarget)}>
        {safe(website.brandName, "Galio Site")}
      </button>

      <div className="gpv3-links">
        {links.map(([label, id]) => (
          <button key={id} type="button" style={{ color: t.muted, borderColor: t.border }} onClick={(event) => scrollToSection(id, event.currentTarget)}>
            {label}
          </button>
        ))}
      </div>

      <span className="gpv3-system-pill" style={{ color: t.primary, borderColor: t.border }}>
        {system.label}
      </span>
    </nav>
  );
}

function Hero({ website, t, system }: { website: WebsiteOutput; t: Theme; system: VisualSystem }) {
  const media = getHeroMedia(website);
  const brand = safe(website.brandName, "Premium Brand");
  const eyebrow = cleanGeneratedText(website.hero?.eyebrow, system.label);
  const primary = safe(website.hero?.primaryCta, "Започни сега");
  const secondary = safe(website.hero?.secondaryCta, "Виж повече");

  return (
    <section id="top" className={`gpv3-hero gpv3-hero-${system.layout}`} style={{ background: t.page }}>
      {media.video ? (
        <video className="gpv3-bg" src={media.video} poster={media.poster || undefined} autoPlay muted loop playsInline />
      ) : media.image ? (
        <img className="gpv3-bg" src={media.image} alt={brand} />
      ) : null}

      <div className="gpv3-overlay" style={{ background: `${t.overlay}, ${t.heroGradient}` }} />

      <div className="gpv3-hero-inner">
        <div className="gpv3-hero-copy" style={{ background: t.surface, borderColor: t.border, boxShadow: t.glow }}>
          <span {...galioEditable("text", "hero.eyebrow", "Hero eyebrow")} className="gpv3-pill" style={{ color: t.primary, borderColor: t.border }}>{eyebrow}</span>
          <h1 {...galioEditable("text", "hero.headline", "Hero headline")} style={{ color: t.text }}>{displayHeroHeadline(website)}</h1>
          <p {...galioEditable("text", "hero.subheadline", "Hero subheadline")} style={{ color: t.muted }}>{displayHeroSubheadline(website)}</p>

          <div className="gpv3-actions">
            <span {...galioEditable("button", "hero.primaryCta", "Primary CTA")}><Button t={t} onClick={(event) => scrollToSection("contact", event.currentTarget)}>{primary}</Button></span>
            <span {...galioEditable("button", "hero.secondaryCta", "Secondary CTA")}><Button t={t} variant="secondary" onClick={(event) => scrollToSection("value", event.currentTarget)}>{secondary}</Button></span>
          </div>

          <div className="gpv3-proof">
            {["Premium structure", "Subject locked", "Mobile ready"].map((item) => (
              <span key={item} style={{ color: t.soft, borderColor: t.border }}>{item}</span>
            ))}
          </div>

          <div className="gpv3-metric-deck">
            {[
              ["01", "Premium hero", "Strong first impression"],
              ["02", "Bento flow", "Clear value structure"],
              ["03", "CTA path", "Built for action"],
            ].map(([number, title, description]) => (
              <article key={title} className="gpv3-metric-card" style={{ background: t.surface2, borderColor: t.border }}>
                <b style={{ color: t.primary }}>{number}</b>
                <strong style={{ color: t.text }}>{title}</strong>
                <span style={{ color: t.muted }}>{description}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="gpv3-hero-showcase" style={{ background: t.surface, borderColor: t.border, boxShadow: t.glow }}>
          <div className="gpv3-window"><span /><span /><span /></div>
          <div className="gpv3-showcase-media">
            {media.video ? (
              <video src={media.video} poster={media.poster || undefined} autoPlay muted loop playsInline />
            ) : media.image ? (
              <img {...galioEditable("image", "mediaAssets.heroImageUrl", "Hero image")} src={media.image} alt={brand} />
            ) : (
              <div className="gpv3-empty-media" style={{ color: t.muted, background: t.surface2 }}>{brand}</div>
            )}
          </div>
          <div className="gpv3-showcase-footer">
            <b style={{ color: t.primary }}>Live visual system</b>
            <span style={{ color: t.muted }}>{system.mood} · {system.layout} · {system.density}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalStrip({ website, t, system }: { website: WebsiteOutput; t: Theme; system: VisualSystem }) {
  const industry = safe(website.industry || website.brandName, "premium project");
  const signals = [
    ["Design Review", "Active"],
    ["Subject", industry],
    ["Layout", system.layout],
    ["Conversion", "Hero → Trust → CTA"],
  ];

  return (
    <section className="gpv3-signal" style={{ background: t.page }}>
      <div className="gpv3-container">
        <div className="gpv3-signal-grid">
          {signals.map(([label, value]) => (
            <article key={label} className="gpv3-signal-card" style={{ background: t.surface, borderColor: t.border }}>
              <b style={{ color: t.primary }}>{label}</b>
              <strong style={{ color: t.text }}>{value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueBento({ website, t, system }: { website: WebsiteOutput; t: Theme; system: VisualSystem }) {
  const features = website.features?.length
    ? website.features
    : [
        { title: "Силно първо впечатление", description: "Hero, текст и визуална посока работят за доверие от първия екран." },
        { title: "Ясна стойност", description: "Секциите са подредени така, че потребителят бързо да разбере защо да избере бранда." },
        { title: "Премиум усещане", description: "Ритъм, spacing, типография и контраст създават по-скъп и професионален вид." },
        { title: "Conversion flow", description: "От послание към доказателство и действие — без излишен шум." },
      ];

  return (
    <section id="value" className="gpv3-section" style={{ background: t.page2 }}>
      <div className="gpv3-container">
        <div className="gpv3-head">
          <span style={{ color: t.primary }}>Value system</span>
          <h2 style={{ color: t.text }}>Премиум структура, създадена за действие</h2>
          <p style={{ color: t.muted }}>
            Dynamic Visual System Renderer превръща съдържанието в по-силен layout според стила, темата и визуалната посока.
          </p>
        </div>

        <div className={`gpv3-bento gpv3-bento-${system.layout}`}>
          {features.slice(0, 6).map((feature, index) => (
            <article
              key={`${feature.title}-${index}`}
              className={index === 0 ? "gpv3-bento-card gpv3-bento-large" : "gpv3-bento-card"}
              style={{ background: t.surface, borderColor: t.border, boxShadow: index === 0 ? t.glow : "none" }}
            >
              <div className="gpv3-icon" style={{ color: t.primary, borderColor: t.border }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 {...galioEditable("text", `features.${index}.title`, `Feature ${index + 1} title`)} style={{ color: t.text }}>{safe(feature.title, `Feature ${index + 1}`)}</h3>
              <p {...galioEditable("text", `features.${index}.description`, `Feature ${index + 1} description`)} style={{ color: t.muted }}>{safe(feature.description, "Професионално предимство, представено ясно и премиум.")}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualGallery({ website, t }: { website: WebsiteOutput; t: Theme }) {
  const images = (website.mediaAssets?.collectionImages || []).filter((item) => item.imageUrl);
  if (!images.length) return null;

  return (
    <section id="visuals" className="gpv3-section" style={{ background: t.page }}>
      <div className="gpv3-container">
        <div className="gpv3-head">
          <span style={{ color: t.primary }}>Visual direction</span>
          <h2 style={{ color: t.text }}>Снимки, които поддържат темата</h2>
          <p style={{ color: t.muted }}>Визуалният слой трябва да подсилва продукта, услугата и доверието — не да изглежда случаен.</p>
        </div>

        <div className="gpv3-gallery">
          {images.slice(0, 4).map((image, index) => (
            <article key={`${image.imageUrl}-${index}`} className="gpv3-shot" style={{ background: t.surface, borderColor: t.border }}>
              <img {...galioEditable("image", `mediaAssets.collectionImages.${index}.imageUrl`, `Gallery image ${index + 1}`)} src={image.imageUrl} alt={cleanMediaTitle(image, index)} />
              <div>
                <b style={{ color: t.primary }}>{safe(image.tag, `VISUAL ${index + 1}`)}</b>
                <h3 {...galioEditable("text", `mediaAssets.collectionImages.${index}.title`, `Gallery image ${index + 1} title`)} style={{ color: t.text }}>{cleanMediaTitle(image, index)}</h3>
                <p {...galioEditable("text", `mediaAssets.collectionImages.${index}.subtitle`, `Gallery image ${index + 1} subtitle`)} style={{ color: t.muted }}>{cleanMediaSubtitle(image, website)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experience({ website, t }: { website: WebsiteOutput; t: Theme }) {
  const sections = website.sections?.length
    ? website.sections
    : [
        { title: "Премиум начало", description: "Първият екран представя бранда ясно, красиво и уверено." },
        { title: "Визуално доверие", description: "Секциите комбинират стойност, детайли и реална причина за интерес." },
        { title: "Лесно действие", description: "Потребителят бързо разбира какво да направи следващо." },
      ];

  return (
    <section id="experience" className="gpv3-section" style={{ background: t.page2 }}>
      <div className="gpv3-container">
        <div className="gpv3-split">
          <div className="gpv3-sticky">
            <span style={{ color: t.primary }}>Experience flow</span>
            <h2 style={{ color: t.text }}>От внимание към доверие и действие</h2>
            <p style={{ color: t.muted }}>
              Всяка секция има конкретна роля: да обясни, докаже, насочи и затвори интереса.
            </p>
          </div>

          <div className="gpv3-stack">
            {sections.slice(0, 5).map((section, index) => (
              <article key={`${section.title}-${index}`} className="gpv3-row-card" style={{ background: t.surface, borderColor: t.border }}>
                <div className="gpv3-row-number" style={{ color: t.primary }}>{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <h3 {...galioEditable("text", `sections.${index}.title`, `Section ${index + 1} title`)} style={{ color: t.text }}>{safe(section.title, `Секция ${index + 1}`)}</h3>
                  <p {...galioEditable("text", `sections.${index}.description`, `Section ${index + 1} description`)} style={{ color: t.muted }}>{safe(section.description || section.content, "Професионална секция.")}</p>
                  {section.items?.length ? (
                    <div className="gpv3-tags">
                      {section.items.slice(0, 4).map((item) => (
                        <span key={item} style={{ color: t.soft, borderColor: t.border }}>{item}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({ website, t }: { website: WebsiteOutput; t: Theme }) {
  const pricing = website.pricing || [];
  if (!pricing.length) return null;

  return (
    <section id="pricing" className="gpv3-section" style={{ background: t.page }}>
      <div className="gpv3-container">
        <div className="gpv3-head">
          <span style={{ color: t.primary }}>Offers</span>
          <h2 style={{ color: t.text }}>Пакети и оферти</h2>
          <p style={{ color: t.muted }}>Ясни оферти, добре подредена стойност и силен CTA.</p>
        </div>

        <div className="gpv3-grid">
          {pricing.slice(0, 3).map((plan, index) => (
            <article
              key={`${plan.name}-${index}`}
              className="gpv3-card gpv3-price"
              style={{
                background: t.surface,
                borderColor: plan.highlighted || index === 1 ? t.primary : t.border,
                boxShadow: plan.highlighted || index === 1 ? t.glow : "none",
              }}
            >
              <h3 style={{ color: t.text }}>{safe(plan.name, "Pro")}</h3>
              <strong style={{ color: t.primary }}>{safe(plan.price, "Custom")}</strong>
              <p style={{ color: t.muted }}>{safe(plan.description, "Премиум пакет за професионално присъствие.")}</p>

              <div className="gpv3-price-list">
                {(plan.features || []).slice(0, 5).map((item) => (
                  <span key={item} style={{ color: t.soft }}>✓ {item}</span>
                ))}
              </div>

              <Button t={t} onClick={(event) => scrollToSection("contact", event.currentTarget)}>Избери</Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ website, t }: { website: WebsiteOutput; t: Theme }) {
  return (
    <section id="contact" className="gpv3-section" style={{ background: t.page2 }}>
      <div className="gpv3-contact" style={{ background: t.surface, borderColor: t.border, boxShadow: t.glow }}>
        <span style={{ color: t.primary }}>Contact</span>
        <h2 style={{ color: t.text }}>{safe(website.footer?.headline, "Готови ли сте да започнем?")}</h2>
        <p style={{ color: t.muted }}>{safe(website.tagline, "Свържете се с нас за професионална консултация.")}</p>

        <div className="gpv3-form">
          <input placeholder="Вашето име" style={{ background: t.surface2, color: t.text, borderColor: t.border }} />
          <input placeholder="Email адрес" style={{ background: t.surface2, color: t.text, borderColor: t.border }} />
          <textarea rows={4} placeholder="Съобщение" style={{ background: t.surface2, color: t.text, borderColor: t.border }} />
          <Button t={t} onClick={() => undefined}>{safe(website.footer?.cta, "Изпрати")}</Button>
        </div>
      </div>
    </section>
  );
}

export default function PremiumWebsiteRendererV3({ website }: { website: WebsiteOutput | null; variant?: string }) {
  if (!website) {
    return <div className="gpv3-empty">Генерирай сайт с AI агента →</div>;
  }

  const system = inferVisualSystem(website);
  const t = getTheme(website, system);

  return (
    <main className={`gpv3-root gpv3-${system.mood}`} style={{ background: t.page, color: t.text }}>
      <Nav website={website} t={t} system={system} />
      <Hero website={website} t={t} system={system} />
      <SignalStrip website={website} t={t} system={system} />
      <ValueBento website={website} t={t} system={system} />
      <VisualGallery website={website} t={t} />
      <Experience website={website} t={t} />
      <Pricing website={website} t={t} />
      <Contact website={website} t={t} />

      <style jsx global>{`
        .gpv3-root {
          container-type: inline-size;
          min-height: 100%;
          width: 100%;
          overflow-x: hidden;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .gpv3-nav {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 16px;
          padding: 14px 22px;
          border-bottom: 1px solid;
          backdrop-filter: blur(24px);
        }

        .gpv3-logo {
          border: 0;
          background: transparent;
          font-size: 16px;
          font-weight: 950;
          letter-spacing: -0.045em;
          cursor: pointer;
          text-align: left;
        }

        .gpv3-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gpv3-links button,
        .gpv3-system-pill {
          border: 1px solid;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        .gpv3-system-pill {
          cursor: default;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .gpv3-btn {
          border: 1px solid;
          border-radius: 999px;
          padding: 12px 18px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          transition:
            transform 160ms ease,
            filter 160ms ease,
            opacity 160ms ease;
        }

        .gpv3-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .gpv3-hero {
          position: relative;
          min-height: 700px;
          overflow: hidden;
        }

        .gpv3-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.62;
          transform: scale(1.025);
        }

        .gpv3-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .gpv3-hero-inner {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 0.72fr);
          gap: 32px;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
          padding: 96px 24px 86px;
        }

        .gpv3-hero-split .gpv3-hero-inner {
          grid-template-columns: minmax(0, 0.92fr) minmax(380px, 1.08fr);
        }

        .gpv3-hero-bento .gpv3-hero-inner {
          grid-template-columns: minmax(0, 1.06fr) minmax(360px, 0.94fr);
        }

        .gpv3-hero-editorial .gpv3-hero-inner {
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
        }

        .gpv3-hero-copy,
        .gpv3-hero-showcase,
        .gpv3-card,
        .gpv3-shot,
        .gpv3-row-card,
        .gpv3-contact,
        .gpv3-bento-card,
        .gpv3-signal-card {
          backdrop-filter: blur(22px);
        }

        .gpv3-hero-copy {
          border: 1px solid;
          border-radius: 34px;
          padding: 34px;
        }

        .gpv3-pill {
          display: inline-flex;
          width: fit-content;
          border: 1px solid;
          border-radius: 999px;
          padding: 8px 12px;
          margin-bottom: 18px;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          background: rgba(255,255,255,.05);
        }

        .gpv3-hero h1 {
          max-width: 900px;
          margin: 0;
          font-size: clamp(44px, 7.8vw, 92px);
          line-height: 0.9;
          letter-spacing: -0.08em;
        }

        .gpv3-light-apple .gpv3-hero h1 {
          letter-spacing: -0.075em;
        }

        .gpv3-editorial-studio .gpv3-hero h1 {
          font-size: clamp(48px, 8.6vw, 104px);
          letter-spacing: -0.09em;
        }

        .gpv3-hero p {
          max-width: 700px;
          margin: 22px 0 0;
          font-size: clamp(16px, 2vw, 21px);
          line-height: 1.65;
        }

        .gpv3-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .gpv3-proof {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
        }

        .gpv3-proof span {
          border: 1px solid;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 850;
        }

        .gpv3-metric-deck {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .gpv3-metric-card {
          border: 1px solid;
          border-radius: 22px;
          padding: 14px;
          min-height: 116px;
          transform: translateY(0);
          transition: transform 180ms ease, filter 180ms ease;
        }

        .gpv3-metric-card:hover {
          transform: translateY(-3px);
          filter: brightness(1.06);
        }

        .gpv3-metric-card b {
          display: block;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
        }

        .gpv3-metric-card strong {
          display: block;
          font-size: 17px;
          line-height: 1.05;
          letter-spacing: -0.045em;
        }

        .gpv3-metric-card span {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.35;
        }

        .gpv3-hero-showcase {
          border: 1px solid;
          border-radius: 34px;
          overflow: hidden;
        }

        .gpv3-window {
          display: flex;
          gap: 8px;
          padding: 14px;
        }

        .gpv3-window span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.32);
        }

        .gpv3-showcase-media {
          height: 420px;
          overflow: hidden;
        }

        .gpv3-showcase-media img,
        .gpv3-showcase-media video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .gpv3-empty-media {
          height: 100%;
          display: grid;
          place-items: center;
          font-weight: 950;
        }

        .gpv3-showcase-footer {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .gpv3-showcase-footer b {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .gpv3-signal {
          padding: 0 24px 48px;
          margin-top: -42px;
          position: relative;
          z-index: 5;
        }

        .gpv3-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        .gpv3-signal-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .gpv3-signal-card {
          border: 1px solid;
          border-radius: 24px;
          padding: 18px;
        }

        .gpv3-signal-card b {
          display: block;
          margin-bottom: 8px;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .gpv3-signal-card strong {
          display: block;
          font-size: 17px;
          line-height: 1.15;
          letter-spacing: -0.035em;
        }

        .gpv3-section {
          padding: 86px 24px;
        }

        .gpv3-head {
          max-width: 780px;
          margin-bottom: 34px;
        }

        .gpv3-head span,
        .gpv3-sticky span,
        .gpv3-contact span {
          display: inline-block;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .gpv3-head h2,
        .gpv3-sticky h2,
        .gpv3-contact h2 {
          margin: 0;
          font-size: clamp(31px, 4.8vw, 62px);
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .gpv3-head p,
        .gpv3-sticky p,
        .gpv3-contact p {
          margin: 16px 0 0;
          font-size: 16px;
          line-height: 1.7;
        }

        .gpv3-bento {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .gpv3-bento-card {
          position: relative;
          overflow: hidden;
          border: 1px solid;
          border-radius: 30px;
          padding: 24px;
          min-height: 230px;
        }

        .gpv3-bento-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 12%, rgba(255,255,255,.16), transparent 28%),
            linear-gradient(135deg, rgba(255,255,255,.10), transparent 42%);
          opacity: .72;
        }

        .gpv3-bento-card > * {
          position: relative;
          z-index: 1;
        }

        .gpv3-bento-large {
          grid-column: span 2;
          grid-row: span 2;
          min-height: 476px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .gpv3-bento-large h3 {
          font-size: clamp(30px, 4vw, 54px);
          line-height: .96;
        }

        .gpv3-bento-editorial .gpv3-bento-large {
          grid-column: span 3;
        }

        .gpv3-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .gpv3-card {
          border: 1px solid;
          border-radius: 28px;
          padding: 24px;
        }

        .gpv3-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border: 1px solid;
          border-radius: 16px;
          margin-bottom: 24px;
          font-weight: 950;
        }

        .gpv3-card h3,
        .gpv3-shot h3,
        .gpv3-row-card h3,
        .gpv3-bento-card h3 {
          margin: 0;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -0.04em;
        }

        .gpv3-card p,
        .gpv3-shot p,
        .gpv3-row-card p,
        .gpv3-bento-card p {
          margin: 12px 0 0;
          line-height: 1.65;
          font-size: 14px;
        }

        .gpv3-gallery {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .gpv3-shot {
          border: 1px solid;
          border-radius: 28px;
          overflow: hidden;
        }

        .gpv3-shot img {
          width: 100%;
          height: 230px;
          object-fit: cover;
          display: block;
        }

        .gpv3-shot div {
          padding: 18px;
        }

        .gpv3-shot b {
          display: block;
          margin-bottom: 8px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .gpv3-split {
          display: grid;
          grid-template-columns: .82fr 1.18fr;
          gap: 28px;
          align-items: start;
        }

        .gpv3-sticky {
          position: sticky;
          top: 92px;
        }

        .gpv3-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .gpv3-row-card {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 18px;
          border: 1px solid;
          border-radius: 26px;
          padding: 22px;
        }

        .gpv3-row-number {
          font-size: 18px;
          font-weight: 950;
        }

        .gpv3-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .gpv3-tags span {
          border: 1px solid;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .gpv3-price strong {
          display: block;
          margin-top: 18px;
          font-size: 34px;
          letter-spacing: -0.06em;
        }

        .gpv3-price-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 18px 0;
          font-size: 14px;
        }

        .gpv3-contact {
          max-width: 780px;
          margin: 0 auto;
          border: 1px solid;
          border-radius: 34px;
          padding: 34px;
        }

        .gpv3-form {
          display: grid;
          gap: 12px;
          margin-top: 24px;
        }

        .gpv3-form input,
        .gpv3-form textarea {
          width: 100%;
          border: 1px solid;
          border-radius: 18px;
          padding: 14px 16px;
          outline: none;
          font: inherit;
        }

        .gpv3-empty {
          display: grid;
          place-items: center;
          min-height: 400px;
          color: #94a3b8;
          background: #020617;
          font-weight: 950;
        }

        @container (max-width: 720px) {
          .gpv3-nav {
            position: relative;
            grid-template-columns: 1fr;
            align-items: stretch;
            padding: 14px;
          }

          .gpv3-logo {
            text-align: center;
          }

          .gpv3-links {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
          }

          .gpv3-links button,
          .gpv3-system-pill {
            width: 100%;
            text-align: center;
          }

          .gpv3-hero {
            min-height: auto;
          }

          .gpv3-hero-inner {
            grid-template-columns: 1fr;
            padding: 24px 14px 38px;
            gap: 16px;
          }

          .gpv3-hero-copy {
            padding: 22px 18px;
            border-radius: 26px;
          }

          .gpv3-pill {
            font-size: 10px;
            padding: 7px 9px;
          }

          .gpv3-hero h1 {
            font-size: 42px;
            line-height: .94;
            letter-spacing: -0.065em;
            max-width: 100%;
            overflow-wrap: anywhere;
          }

          .gpv3-hero p {
            font-size: 14px;
            line-height: 1.5;
          }

          .gpv3-actions {
            flex-direction: column;
          }

          .gpv3-actions .gpv3-btn {
            width: 100%;
          }

          .gpv3-proof {
            display: grid;
            grid-template-columns: 1fr;
          }

          .gpv3-metric-deck {
            grid-template-columns: 1fr;
          }

          .gpv3-metric-card {
            min-height: auto;
          }

          .gpv3-showcase-media {
            height: 240px;
          }

          .gpv3-signal {
            margin-top: 0;
            padding: 18px 14px 38px;
          }

          .gpv3-signal-grid,
          .gpv3-bento,
          .gpv3-gallery,
          .gpv3-grid {
            grid-template-columns: 1fr !important;
          }

          .gpv3-bento-large {
            grid-column: auto;
            grid-row: auto;
            min-height: 260px;
          }

          .gpv3-section {
            padding: 48px 14px;
          }

          .gpv3-head {
            margin-bottom: 22px;
          }

          .gpv3-head h2,
          .gpv3-sticky h2,
          .gpv3-contact h2 {
            font-size: 34px;
            line-height: 1;
          }

          .gpv3-bento-card,
          .gpv3-card,
          .gpv3-shot,
          .gpv3-row-card,
          .gpv3-contact,
          .gpv3-hero-showcase {
            border-radius: 24px;
          }

          .gpv3-shot {
            display: grid;
            grid-template-columns: 118px 1fr;
            min-height: 148px;
          }

          .gpv3-shot img {
            width: 118px;
            height: 100%;
            min-height: 148px;
          }

          .gpv3-shot div {
            padding: 14px;
            min-width: 0;
          }

          .gpv3-split {
            grid-template-columns: 1fr;
          }

          .gpv3-sticky {
            position: relative;
            top: auto;
          }

          .gpv3-row-card {
            grid-template-columns: 42px 1fr;
            padding: 18px;
          }

          .gpv3-form input,
          .gpv3-form textarea {
            font-size: 16px;
          }
          /* Galio safe mobile preset */
          .gpv3-root {
            overflow-x: hidden;
          }

          .gpv3-nav {
            gap: 10px;
          }

          .gpv3-links {
            display: none;
          }

          .gpv3-system-pill {
            display: none;
          }

          .gpv3-hero-inner {
            padding: 18px 12px 28px;
          }

          .gpv3-hero-copy,
          .gpv3-hero-showcase,
          .gpv3-bento-card,
          .gpv3-card,
          .gpv3-shot,
          .gpv3-row-card,
          .gpv3-contact {
            border-radius: 20px;
          }

          .gpv3-hero-copy {
            padding: 20px 16px;
          }

          .gpv3-hero h1 {
            font-size: clamp(30px, 10vw, 38px);
            line-height: 1.02;
            letter-spacing: -0.045em;
          }

          .gpv3-hero p,
          .gpv3-bento-card p,
          .gpv3-row-card p,
          .gpv3-shot p {
            font-size: 14px;
            line-height: 1.55;
          }

          .gpv3-section {
            padding: 40px 12px;
          }

          .gpv3-head h2,
          .gpv3-sticky h2,
          .gpv3-contact h2 {
            font-size: clamp(26px, 8vw, 32px);
            line-height: 1.08;
            letter-spacing: -0.04em;
          }

          .gpv3-bento-large {
            min-height: auto;
          }

          .gpv3-shot {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .gpv3-shot img {
            width: 100%;
            height: 190px;
            min-height: 0;
          }

          .gpv3-showcase-media {
            height: 210px;
          }

          .gpv3-row-card {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          /* Galio emergency mobile width fix */
          .gpv3-container,
          .gpv3-hero-inner,
          .gpv3-hero-copy,
          .gpv3-hero-showcase,
          .gpv3-head,
          .gpv3-sticky,
          .gpv3-contact,
          .gpv3-bento,
          .gpv3-gallery,
          .gpv3-grid,
          .gpv3-stack,
          .gpv3-row-card,
          .gpv3-bento-card,
          .gpv3-shot {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }

          .gpv3-hero-inner,
          .gpv3-split,
          .gpv3-bento,
          .gpv3-gallery,
          .gpv3-grid,
          .gpv3-stack {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .gpv3-hero-copy {
            display: block !important;
          }

          .gpv3-hero h1,
          .gpv3-head h2,
          .gpv3-sticky h2,
          .gpv3-contact h2,
          .gpv3-bento-card h3,
          .gpv3-row-card h3,
          .gpv3-shot h3,
          .gpv3-hero p,
          .gpv3-bento-card p,
          .gpv3-row-card p,
          .gpv3-shot p {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            white-space: normal !important;
            word-break: normal !important;
            overflow-wrap: break-word !important;
            writing-mode: horizontal-tb !important;
            text-orientation: mixed !important;
          }

          .gpv3-hero h1 {
            font-size: clamp(28px, 8vw, 34px) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.035em !important;
          }

          .gpv3-proof,
          .gpv3-metric-deck,
          .gpv3-actions {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            width: 100% !important;
          }

          .gpv3-btn {
            width: 100% !important;
            justify-content: center !important;
          }

        }
      `}</style>
    </main>
  );
}
