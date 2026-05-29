import React, { useMemo, useRef, useState } from "react";

const CLIPBOARD_KEY = "galio_visual_editor_clipboard_v1";

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Serif Luxury", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono Tech", value: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" },
  { label: "System", value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

const SHADOWS = [
  { label: "None", value: "none" },
  { label: "Soft", value: "0 18px 45px rgba(0,0,0,.16)" },
  { label: "Premium", value: "0 28px 90px rgba(0,0,0,.28)" },
  { label: "Glow", value: "0 0 0 1px rgba(255,255,255,.12), 0 24px 80px rgba(16,185,129,.28)" },
  { label: "Deep", value: "0 40px 120px rgba(0,0,0,.42)" },
];

const CONTROLLED_STYLE_KEYS = [
  "color",
  "background",
  "backgroundColor",
  "borderColor",
  "opacity",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "padding",
  "margin",
  "width",
  "height",
  "minHeight",
  "maxWidth",
  "borderRadius",
  "boxShadow",
  "border",
  "objectFit",
];

function text(value, fallback = "") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function readClipboard() {
  try {
    return JSON.parse(window.localStorage.getItem(CLIPBOARD_KEY) || "null");
  } catch {
    return null;
  }
}

function writeClipboard(payload) {
  window.localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload || {}));
}

function Section({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <summary className="cursor-pointer select-none px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
        {title}
      </summary>
      <div className="space-y-3 border-t border-zinc-800 p-3">{children}</div>
    </details>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-xl border border-zinc-800 bg-black px-3 text-xs text-zinc-100 outline-none focus:border-emerald-400 ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded-xl border border-zinc-800 bg-black px-3 text-xs text-zinc-100 outline-none focus:border-emerald-400 ${props.className || ""}`}
    />
  );
}

function Button({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-emerald-400",
    primary: "border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400",
    danger: "border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400",
    ghost: "border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600",
  };

  return (
    <button
      type="button"
      {...props}
      className={`h-9 rounded-xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function InspectorPanel({ selected, onUpdate, editing, onClose }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [notice, setNotice] = useState("");

  const styles = selected?.styles || {};
  const classes = selected?.classes || "";
  const hasSelection = Boolean(selected?.id);
  const isMedia = selected?.mediaUrl !== undefined && selected?.mediaUrl !== null;
  const isText = selected?.text !== undefined && selected?.text !== null;

  const selectedLabel = useMemo(() => {
    if (!selected) return "No element selected";
    return selected.tag || selected.id || "Selected element";
  }, [selected]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function updatePatch(patch) {
    if (!selected?.id || !onUpdate) return;
    onUpdate(selected.id, patch);
  }

  function updateStyle(key, value) {
    updatePatch({ styles: { [key]: value } });
  }

  function updateStyles(nextStyles) {
    updatePatch({ styles: nextStyles });
  }

  function copyText() {
    if (!selected) return;
    writeClipboard({ type: "text", text: selected.text || "" });
    notify("Text copied");
  }

  function pasteText() {
    const clip = readClipboard();
    if (!clip?.text && clip?.type !== "text" && clip?.type !== "element") return notify("No copied text");
    updatePatch({ text: clip.text || "" });
    notify("Text pasted");
  }

  function copyStyle() {
    if (!selected) return;
    writeClipboard({ type: "style", styles: selected.styles || {}, classes: selected.classes || "" });
    notify("Style copied");
  }

  function pasteStyle() {
    const clip = readClipboard();
    if (!clip?.styles && clip?.type !== "style" && clip?.type !== "element") return notify("No copied style");
    updatePatch({ styles: clip.styles || {}, classes: clip.classes || "" });
    notify("Style pasted");
  }

  function copyFullElement() {
    if (!selected) return;
    writeClipboard({
      type: "element",
      text: selected.text || "",
      mediaUrl: selected.mediaUrl || "",
      mediaType: selected.mediaType || "",
      styles: selected.styles || {},
      classes: selected.classes || "",
    });
    notify("Full element copied");
  }

  function pasteFullElement() {
    const clip = readClipboard();
    if (!clip) return notify("Nothing copied");

    const patch = {
      styles: clip.styles || {},
      classes: clip.classes || "",
    };

    if (isText && typeof clip.text === "string") patch.text = clip.text;
    if (isMedia && typeof clip.mediaUrl === "string") patch.mediaUrl = clip.mediaUrl;

    updatePatch(patch);
    notify("Full element pasted");
  }

  async function pasteUrlFromClipboard() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) return;
      updatePatch({ mediaUrl: value.trim() });
      notify("URL pasted");
    } catch {
      window.alert("Clipboard access blocked. Paste the URL manually.");
    }
  }

  function handleFileUpload(event, type) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updatePatch({ mediaUrl: String(reader.result || "") });
      notify(type === "video" ? "Video uploaded" : "Image uploaded");
    };
    reader.readAsDataURL(file);
  }

  function removeMedia() {
    updatePatch({ mediaUrl: "" });
    notify("Media removed");
  }

  function resetControlledStyles() {
    const empty = {};
    CONTROLLED_STYLE_KEYS.forEach((key) => {
      empty[key] = "";
    });
    updatePatch({ styles: empty, classes: "" });
    notify("Styles reset");
  }

  if (!editing) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
        Enable Edit mode to use the visual inspector.
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
        Click an element in the preview to edit text, media and styles.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-zinc-100">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Edit Menu</div>
            <div className="mt-1 break-all text-sm font-black text-white">{selectedLabel}</div>
            <div className="mt-1 break-all text-[11px] text-zinc-400">{selected.id}</div>
          </div>
          {onClose ? (
            <Button variant="ghost" className="h-8 px-2" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>
        {notice ? <div className="mt-2 text-xs font-bold text-emerald-200">{notice}</div> : null}
      </div>

      <Section title="Phase 1 — Clipboard" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={copyText} disabled={!isText}>Copy Text</Button>
          <Button onClick={pasteText} disabled={!isText}>Paste Text</Button>
          <Button onClick={copyStyle}>Copy Style</Button>
          <Button onClick={pasteStyle}>Paste Style</Button>
          <Button onClick={copyFullElement}>Copy Full</Button>
          <Button onClick={pasteFullElement}>Paste Full</Button>
        </div>
      </Section>

      {isText ? (
        <Section title="Text Content" defaultOpen>
          <Field label="Selected text">
            <textarea
              value={selected.text || ""}
              onChange={(event) => updatePatch({ text: event.target.value })}
              className="min-h-24 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-400"
            />
          </Field>
        </Section>
      ) : null}

      {isMedia ? (
        <Section title="Phase 5 — Media" defaultOpen>
          <Field label="Media URL">
            <Input value={selected.mediaUrl || ""} onChange={(event) => updatePatch({ mediaUrl: event.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => imageInputRef.current?.click()}>Upload Image</Button>
            <Button onClick={() => videoInputRef.current?.click()}>Upload Video</Button>
            <Button onClick={pasteUrlFromClipboard}>Paste URL</Button>
            <Button variant="danger" onClick={removeMedia}>Remove Media</Button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFileUpload(event, "image")} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleFileUpload(event, "video")} />

          {selected.mediaUrl ? (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
              {selected.mediaType === "video" || String(selected.mediaUrl).startsWith("data:video") ? (
                <video src={selected.mediaUrl} className="max-h-40 w-full object-cover" muted loop playsInline controls />
              ) : (
                <img src={selected.mediaUrl} alt="" className="max-h-40 w-full object-cover" />
              )}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section title="Phase 2 — Typography" defaultOpen>
        <Field label="Font family">
          <Select value={styles.fontFamily || ""} onChange={(event) => updateStyle("fontFamily", event.target.value)}>
            {FONT_FAMILIES.map((font) => (
              <option key={font.label} value={font.value}>{font.label}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Font size">
            <Input placeholder="48px" value={styles.fontSize || ""} onChange={(event) => updateStyle("fontSize", event.target.value)} />
          </Field>
          <Field label="Weight">
            <Select value={styles.fontWeight || ""} onChange={(event) => updateStyle("fontWeight", event.target.value)}>
              <option value="">Default</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
              <option value="900">Black</option>
            </Select>
          </Field>
          <Field label="Letter spacing">
            <Input placeholder="-0.04em" value={styles.letterSpacing || ""} onChange={(event) => updateStyle("letterSpacing", event.target.value)} />
          </Field>
          <Field label="Line height">
            <Input placeholder="1.1" value={styles.lineHeight || ""} onChange={(event) => updateStyle("lineHeight", event.target.value)} />
          </Field>
        </div>

        <Field label="Text align">
          <div className="grid grid-cols-4 gap-2">
            {["left", "center", "right", "justify"].map((align) => (
              <Button
                key={align}
                variant={styles.textAlign === align ? "primary" : "default"}
                onClick={() => updateStyle("textAlign", align)}
              >
                {align}
              </Button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Phase 3 — Colors" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Text color">
            <Input type="color" value={styles.color || "#ffffff"} onChange={(event) => updateStyle("color", event.target.value)} />
          </Field>
          <Field label="Background">
            <Input type="color" value={styles.backgroundColor || "#000000"} onChange={(event) => updateStyle("backgroundColor", event.target.value)} />
          </Field>
          <Field label="Border color">
            <Input type="color" value={styles.borderColor || "#10b981"} onChange={(event) => updateStyles({ borderColor: event.target.value, border: `1px solid ${event.target.value}` })} />
          </Field>
          <Field label="Opacity">
            <Input type="number" min="0" max="1" step="0.05" value={styles.opacity || ""} placeholder="1" onChange={(event) => updateStyle("opacity", event.target.value)} />
          </Field>
        </div>

        <Field label="Gradient background">
          <Input
            placeholder="linear-gradient(135deg, #111827, #10b981)"
            value={styles.background || ""}
            onChange={(event) => updateStyle("background", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Phase 4 — Layout" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Padding">
            <Input placeholder="24px" value={styles.padding || ""} onChange={(event) => updateStyle("padding", event.target.value)} />
          </Field>
          <Field label="Margin">
            <Input placeholder="12px" value={styles.margin || ""} onChange={(event) => updateStyle("margin", event.target.value)} />
          </Field>
          <Field label="Width">
            <Input placeholder="420px / 100%" value={styles.width || ""} onChange={(event) => updateStyle("width", event.target.value)} />
          </Field>
          <Field label="Height">
            <Input placeholder="260px" value={styles.height || ""} onChange={(event) => updateStyle("height", event.target.value)} />
          </Field>
          <Field label="Min height">
            <Input placeholder="320px" value={styles.minHeight || ""} onChange={(event) => updateStyle("minHeight", event.target.value)} />
          </Field>
          <Field label="Max width">
            <Input placeholder="760px" value={styles.maxWidth || ""} onChange={(event) => updateStyle("maxWidth", event.target.value)} />
          </Field>
          <Field label="Radius">
            <Input placeholder="24px" value={styles.borderRadius || ""} onChange={(event) => updateStyle("borderRadius", event.target.value)} />
          </Field>
          <Field label="Object fit">
            <Select value={styles.objectFit || ""} onChange={(event) => updateStyle("objectFit", event.target.value)}>
              <option value="">Default</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </Select>
          </Field>
        </div>

        <Field label="Shadow">
          <Select value={styles.boxShadow || ""} onChange={(event) => updateStyle("boxShadow", event.target.value)}>
            <option value="">Default</option>
            {SHADOWS.map((shadow) => (
              <option key={shadow.label} value={shadow.value}>{shadow.label}</option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Advanced classes" defaultOpen={false}>
        <Field label="CSS classes">
          <Input value={classes} onChange={(event) => updatePatch({ classes: event.target.value })} placeholder="custom-class another-class" />
        </Field>
      </Section>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" onClick={resetControlledStyles}>Reset Style</Button>
        <Button variant="ghost" onClick={() => updatePatch({ delete: true })}>Delete</Button>
      </div>
    </div>
  );
}
