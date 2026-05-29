import React, { useMemo, useRef, useState } from "react";

const CLIPBOARD_KEY = "galio_visual_editor_clipboard_v2";

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Serif Luxury", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono Tech", value: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" },
  { label: "System", value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

const SHADOWS = [
  { label: "Default", value: "" },
  { label: "None", value: "none" },
  { label: "Soft", value: "0 18px 45px rgba(0,0,0,.16)" },
  { label: "Premium", value: "0 28px 90px rgba(0,0,0,.28)" },
  { label: "Glow", value: "0 0 0 1px rgba(255,255,255,.12), 0 24px 80px rgba(16,185,129,.28)" },
  { label: "Deep", value: "0 40px 120px rgba(0,0,0,.42)" },
];

function readClipboard() {
  try {
    return JSON.parse(window.localStorage.getItem(CLIPBOARD_KEY) || "null");
  } catch {
    return null;
  }
}

function writeClipboard(payload) {
  try {
    window.localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload || {}));
  } catch {}
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function isVideoUrl(value) {
  const url = String(value || "").toLowerCase();
  return url.startsWith("data:video") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov");
}

function Button({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800",
    primary: "border-emerald-400 bg-emerald-400 text-black hover:bg-emerald-300",
    danger: "border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400",
    ghost: "border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600",
  };

  return (
    <button
      type="button"
      {...props}
      className={`min-h-9 rounded-xl border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-xl border border-zinc-800 bg-black px-3 text-xs text-zinc-100 outline-none transition focus:border-emerald-400 ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-emerald-400 ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded-xl border border-zinc-800 bg-black px-3 text-xs text-zinc-100 outline-none transition focus:border-emerald-400 ${props.className || ""}`}
    />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-11 rounded-xl border border-zinc-800 bg-black p-1"
      />
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="#ffffff / rgba(...)" />
    </div>
  );
}

function PanelSection({ title, description, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-zinc-800 bg-zinc-950/80">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-3 py-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">{title}</div>
          {description ? <div className="mt-1 text-[11px] text-zinc-500">{description}</div> : null}
        </div>
        <span className="text-zinc-500 transition group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 border-t border-zinc-800 p-3">{children}</div>
    </details>
  );
}

export default function InspectorPanel({ selected, onUpdate, editing, onClose }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [notice, setNotice] = useState("");

  const hasSelection = Boolean(selected?.id);
  const styles = selected?.styles || {};
  const classes = selected?.classes || "";
  const isText = selected?.text !== undefined && selected?.text !== null;
  const isMedia = selected?.mediaUrl !== undefined && selected?.mediaUrl !== null;

  const label = useMemo(() => {
    if (!selected) return "No selection";
    return selected.tag || selected.id || "Selected element";
  }, [selected]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  function updatePatch(patch) {
    if (!selected?.id || !onUpdate) return;
    onUpdate(selected.id, patch);
  }

  function updateStyle(key, value) {
    updatePatch({ styles: { [key]: value } });
  }

  function copyText() {
    writeClipboard({ type: "text", text: selected?.text || "" });
    notify("Text copied");
  }

  function pasteText() {
    const clip = readClipboard();
    if (!clip?.text && clip?.type !== "text" && clip?.type !== "element") return notify("No copied text");
    updatePatch({ text: clip.text || "" });
    notify("Text pasted");
  }

  function copyStyle() {
    writeClipboard({ type: "style", styles, classes });
    notify("Style copied");
  }

  function pasteStyle() {
    const clip = readClipboard();
    if (!clip?.styles && clip?.type !== "style" && clip?.type !== "element") return notify("No copied style");
    updatePatch({ styles: clip.styles || {}, classes: clip.classes || "" });
    notify("Style pasted");
  }

  function copyFull() {
    writeClipboard({
      type: "element",
      text: selected?.text || "",
      mediaUrl: selected?.mediaUrl || "",
      mediaType: selected?.mediaType || "",
      styles,
      classes,
    });
    notify("Element copied");
  }

  function pasteFull() {
    const clip = readClipboard();
    if (!clip) return notify("Nothing copied");

    const patch = {
      styles: clip.styles || {},
      classes: clip.classes || "",
    };

    if (isText && typeof clip.text === "string") patch.text = clip.text;
    if (isMedia && typeof clip.mediaUrl === "string") patch.mediaUrl = clip.mediaUrl;

    updatePatch(patch);
    notify("Element pasted");
  }

  async function pasteMediaUrl() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) return notify("Clipboard empty");
      updatePatch({ mediaUrl: value.trim() });
      notify("URL pasted");
    } catch {
      notify("Clipboard blocked");
    }
  }

  function uploadFile(event, type) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updatePatch({
        mediaUrl: String(reader.result || ""),
        mediaType: type,
      });
      notify(type === "video" ? "Video uploaded" : "Image uploaded");
    };
    reader.readAsDataURL(file);
  }

  function resetVisuals() {
    updatePatch({ styles: {}, classes: "" });
    notify("Visual styles reset");
  }

  if (!editing) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
        Enable Edit mode to use the universal inspector.
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
        Click an element in the preview. The same edit menu will be used for every renderer.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-zinc-100">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Universal Edit Menu</div>
            <div className="mt-1 truncate text-sm font-black text-white">{label}</div>
            <div className="mt-1 break-all text-[11px] text-zinc-400">{selected.id}</div>
          </div>
          {onClose ? (
            <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>
        {notice ? <div className="mt-2 text-xs font-bold text-emerald-200">{notice}</div> : null}
      </div>

      <PanelSection title="Clipboard" description="Copy/paste text, styles or whole element." defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={copyText} disabled={!isText}>Copy Text</Button>
          <Button onClick={pasteText} disabled={!isText}>Paste Text</Button>
          <Button onClick={copyStyle}>Copy Style</Button>
          <Button onClick={pasteStyle}>Paste Style</Button>
          <Button onClick={copyFull}>Copy Full</Button>
          <Button onClick={pasteFull}>Paste Full</Button>
        </div>
      </PanelSection>

      {isText ? (
        <PanelSection title="Content" description="Edit selected text/button label." defaultOpen>
          <Field label="Text">
            <TextArea value={selected.text || ""} onChange={(event) => updatePatch({ text: event.target.value })} />
          </Field>
        </PanelSection>
      ) : null}

      {isMedia ? (
        <PanelSection title="Media" description="Replace image/video, upload or remove." defaultOpen>
          <Field label="Media URL">
            <Input value={selected.mediaUrl || ""} onChange={(event) => updatePatch({ mediaUrl: event.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => imageInputRef.current?.click()}>Upload Image</Button>
            <Button onClick={() => videoInputRef.current?.click()}>Upload Video</Button>
            <Button onClick={pasteMediaUrl}>Paste URL</Button>
            <Button variant="danger" onClick={() => updatePatch({ mediaUrl: "" })}>Remove</Button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadFile(event, "image")} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => uploadFile(event, "video")} />

          {selected.mediaUrl ? (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
              {selected.mediaType === "video" || isVideoUrl(selected.mediaUrl) ? (
                <video src={selected.mediaUrl} className="max-h-44 w-full object-cover" muted loop playsInline controls />
              ) : (
                <img src={selected.mediaUrl} alt="" className="max-h-44 w-full object-cover" />
              )}
            </div>
          ) : null}
        </PanelSection>
      ) : null}

      <PanelSection title="Typography" description="Font, size, weight, spacing and alignment." defaultOpen>
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
          <Select value={styles.textAlign || ""} onChange={(event) => updateStyle("textAlign", event.target.value)}>
            <option value="">Default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </Select>
        </Field>
      </PanelSection>

      <PanelSection title="Colors" description="Text, background, border and opacity.">
        <Field label="Text color">
          <ColorInput value={styles.color || ""} onChange={(value) => updateStyle("color", value)} />
        </Field>
        <Field label="Background color">
          <ColorInput value={styles.backgroundColor || styles.background || ""} onChange={(value) => updateStyle("backgroundColor", value)} />
        </Field>
        <Field label="Border color">
          <ColorInput value={styles.borderColor || ""} onChange={(value) => updateStyle("borderColor", value)} />
        </Field>
        <Field label="Opacity">
          <Input placeholder="1 / 0.75" value={styles.opacity || ""} onChange={(event) => updateStyle("opacity", event.target.value)} />
        </Field>
      </PanelSection>

      <PanelSection title="Layout" description="Spacing, size, radius and shadows.">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Padding">
            <Input placeholder="24px" value={styles.padding || ""} onChange={(event) => updateStyle("padding", event.target.value)} />
          </Field>
          <Field label="Margin">
            <Input placeholder="12px" value={styles.margin || ""} onChange={(event) => updateStyle("margin", event.target.value)} />
          </Field>
          <Field label="Width">
            <Input placeholder="100%" value={styles.width || ""} onChange={(event) => updateStyle("width", event.target.value)} />
          </Field>
          <Field label="Height">
            <Input placeholder="420px" value={styles.height || ""} onChange={(event) => updateStyle("height", event.target.value)} />
          </Field>
          <Field label="Min height">
            <Input placeholder="320px" value={styles.minHeight || ""} onChange={(event) => updateStyle("minHeight", event.target.value)} />
          </Field>
          <Field label="Max width">
            <Input placeholder="900px" value={styles.maxWidth || ""} onChange={(event) => updateStyle("maxWidth", event.target.value)} />
          </Field>
          <Field label="Radius">
            <Input placeholder="24px" value={styles.borderRadius || ""} onChange={(event) => updateStyle("borderRadius", event.target.value)} />
          </Field>
          <Field label="Border">
            <Input placeholder="1px solid rgba(...)" value={styles.border || ""} onChange={(event) => updateStyle("border", event.target.value)} />
          </Field>
        </div>

        <Field label="Shadow">
          <Select value={styles.boxShadow || ""} onChange={(event) => updateStyle("boxShadow", event.target.value)}>
            {SHADOWS.map((shadow) => (
              <option key={shadow.label} value={shadow.value}>{shadow.label}</option>
            ))}
          </Select>
        </Field>

        {isMedia ? (
          <Field label="Object fit">
            <Select value={styles.objectFit || ""} onChange={(event) => updateStyle("objectFit", event.target.value)}>
              <option value="">Default</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </Select>
          </Field>
        ) : null}
      </PanelSection>

      <PanelSection title="Advanced" description="Classes and reset.">
        <Field label="CSS classes">
          <Input value={classes || ""} onChange={(event) => updatePatch({ classes: event.target.value })} placeholder="custom-class another-class" />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={resetVisuals}>Reset Visuals</Button>
          <Button variant="ghost" onClick={() => updatePatch({ text: normalizeText(selected.text), mediaUrl: selected.mediaUrl })}>Normalize</Button>
        </div>
      </PanelSection>
    </div>
  );
}
