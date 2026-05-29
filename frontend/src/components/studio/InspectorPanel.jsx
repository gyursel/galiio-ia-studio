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

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14, stroke = "currentColor", fill = "none", strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  copy:       "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 1 2 2v4M21 12H11",
  paste:      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6",
  copyAll:    "M19 21H9a2 2 0 0 1-2-2V7m14 14a2 2 0 0 0 2-2V9l-5-5H9a2 2 0 0 0-2 2m12 15-3-3m0 0-3 3m3-3v6",
  pasteAll:   "M12 5v14m-7-7h14",
  text:       "M4 6h16M4 12h8m-8 6h16",
  image:      "M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm5.5 0v11M3 14h18",
  upload:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  video:      "M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z",
  link:       "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  trash:      "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6",
  font:       "M4 20V4h6l4 8-4 8H4M10 4h10M10 20h10M15 12h5",
  layout:     "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M9 15l6-6m-4-2 6 6",
  palette:    "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 0v10M7 7l5 5 5-5",
  settings:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8.93-4a1 1 0 0 0-.93-.93V8a1 1 0 0 0-1-1h-1.07A8 8 0 0 0 13 3.07V2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.07A8 8 0 0 0 4.07 7H3a1 1 0 0 0-1 1v2a1 1 0 0 0 .93 1H3a8 8 0 0 0 3.93 3.93V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1.07A8 8 0 0 0 19.93 12H21a1 1 0 0 0 .93-1z",
  reset:      "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15",
  normalize:  "M8 12h8M12 8v8",
  close:      "M18 6 6 18M6 6l12 12",
  chevron:    "M9 18l6-6-6-6",
};

// ── Utilities ────────────────────────────────────────────────────────────────
function readClipboard() {
  try { return JSON.parse(window.localStorage.getItem(CLIPBOARD_KEY) || "null"); }
  catch { return null; }
}
function writeClipboard(payload) {
  try { window.localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload || {})); }
  catch {}
}
function normalizeText(value) { return String(value ?? "").trim(); }
function isVideoUrl(value) {
  const url = String(value || "").toLowerCase();
  return url.startsWith("data:video") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov");
}

// ── Base Components ──────────────────────────────────────────────────────────
function Button({ children, variant = "default", className = "", icon, ...props }) {
  const variants = {
    default: "border-zinc-700/60 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:scale-[.97]",
    primary: "border-emerald-400/80 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-300 active:scale-[.97]",
    danger:  "border-red-500/30 bg-red-500/8 text-red-300/80 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200 active:scale-[.97]",
    ghost:   "border-zinc-700/40 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 active:scale-[.97]",
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 min-h-8 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-35 ${variants[variant]} ${className}`}
    >
      {icon && <span className="opacity-70 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
        {hint && <span className="text-[9px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] text-zinc-200 placeholder-zinc-700 outline-none transition-all duration-150 focus:border-emerald-500/70 focus:bg-black focus:ring-1 focus:ring-emerald-500/20 ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-20 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[11px] text-zinc-200 placeholder-zinc-700 outline-none transition-all duration-150 focus:border-emerald-500/70 focus:bg-black focus:ring-1 focus:ring-emerald-500/20 resize-y ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={`h-8 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] text-zinc-200 outline-none transition-all duration-150 focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20 ${props.className || ""}`}
    />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative shrink-0">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-9 rounded-lg border border-zinc-700 bg-zinc-950 p-0.5 cursor-pointer"
        />
        <div
          className="pointer-events-none absolute inset-0.5 rounded-md border border-white/10"
          style={{ background: value || "#ffffff" }}
        />
      </div>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#ffffff / rgba(...)" />
    </div>
  );
}

function Divider() {
  return <div className="border-t border-zinc-800/60" />;
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500">
      {children}
    </span>
  );
}

// ── Panel Section ────────────────────────────────────────────────────────────
function PanelSection({ title, description, children, defaultOpen = false, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400/90">{title}</div>
            {description && <div className="mt-0.5 text-[10px] text-zinc-600 truncate">{description}</div>}
          </div>
        </div>
        <span
          className="shrink-0 text-zinc-600 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <Icon d={Icons.chevron} size={13} />
        </span>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-zinc-800/80 bg-zinc-950/50 p-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Clipboard Row ────────────────────────────────────────────────────────────
function ClipRow({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {left}
      {right}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function InspectorPanel({ selected, onUpdate, editing, onClose }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("ok"); // "ok" | "err"

  const hasSelection = Boolean(selected?.id);
  const styles = selected?.styles || {};
  const classes = selected?.classes || "";
  const isText = selected?.text !== undefined && selected?.text !== null;
  const isMedia = selected?.mediaUrl !== undefined && selected?.mediaUrl !== null;

  const label = useMemo(() => {
    if (!selected) return "No selection";
    return selected.tag || selected.id || "Selected element";
  }, [selected]);

  function notify(message, type = "ok") {
    setNotice(message);
    setNoticeType(type);
    window.setTimeout(() => setNotice(""), 1800);
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
    if (!clip?.text && clip?.type !== "text" && clip?.type !== "element") return notify("Nothing to paste", "err");
    updatePatch({ text: clip.text || "" });
    notify("Text pasted");
  }

  function copyStyle() {
    writeClipboard({ type: "style", styles, classes });
    notify("Style copied");
  }

  function pasteStyle() {
    const clip = readClipboard();
    if (!clip?.styles && clip?.type !== "style" && clip?.type !== "element") return notify("Nothing to paste", "err");
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
    if (!clip) return notify("Nothing copied", "err");
    const patch = { styles: clip.styles || {}, classes: clip.classes || "" };
    if (isText && typeof clip.text === "string") patch.text = clip.text;
    if (isMedia && typeof clip.mediaUrl === "string") patch.mediaUrl = clip.mediaUrl;
    updatePatch(patch);
    notify("Element pasted");
  }

  async function pasteMediaUrl() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) return notify("Clipboard empty", "err");
      updatePatch({ mediaUrl: value.trim() });
      notify("URL pasted");
    } catch {
      notify("Clipboard blocked", "err");
    }
  }

  function uploadFile(event, type) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updatePatch({ mediaUrl: String(reader.result || ""), mediaType: type });
      notify(type === "video" ? "Video uploaded" : "Image uploaded");
    };
    reader.readAsDataURL(file);
  }

  function resetVisuals() {
    updatePatch({ styles: {}, classes: "" });
    notify("Styles reset");
  }

  // ── Idle states ────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950 px-4 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600">
          <Icon d={Icons.settings} size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-400">Edit mode is off</div>
          <div className="mt-0.5 text-[11px] text-zinc-600">Enable Edit mode to use the inspector.</div>
        </div>
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950 px-4 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600">
          <Icon d={Icons.layout} size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-400">No element selected</div>
          <div className="mt-0.5 text-[11px] text-zinc-600">Click any element in the preview to inspect it.</div>
        </div>
      </div>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2 text-zinc-100">

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 p-3">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #10b981 0%, transparent 60%)" }} />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-400/80">Inspector</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="truncate text-sm font-bold text-white">{label}</div>
              <Tag>{selected.tag || "div"}</Tag>
            </div>
            <div className="mt-0.5 font-mono text-[9px] text-zinc-600 truncate">{selected.id}</div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-900/80 text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-200 active:scale-90"
            >
              <Icon d={Icons.close} size={12} />
            </button>
          )}
        </div>

        {notice && (
          <div className={`mt-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${
            noticeType === "err"
              ? "bg-red-500/10 text-red-300 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          }`}>
            <div className={`h-1 w-1 rounded-full shrink-0 ${noticeType === "err" ? "bg-red-400" : "bg-emerald-400"}`} />
            {notice}
          </div>
        )}
      </div>

      {/* Clipboard */}
      <PanelSection
        title="Clipboard"
        description="Copy / paste text, styles, or whole element"
        defaultOpen
        icon={<Icon d={Icons.copy} size={13} />}
      >
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold px-0.5">Text</div>
          <ClipRow
            left={<Button onClick={copyText} disabled={!isText} icon={<Icon d={Icons.copy} size={11} />}>Copy Text</Button>}
            right={<Button onClick={pasteText} disabled={!isText} icon={<Icon d={Icons.paste} size={11} />}>Paste Text</Button>}
          />
          <Divider />
          <div className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold px-0.5">Style</div>
          <ClipRow
            left={<Button onClick={copyStyle} icon={<Icon d={Icons.copy} size={11} />}>Copy Style</Button>}
            right={<Button onClick={pasteStyle} icon={<Icon d={Icons.paste} size={11} />}>Paste Style</Button>}
          />
          <Divider />
          <div className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold px-0.5">Full element</div>
          <ClipRow
            left={<Button onClick={copyFull} icon={<Icon d={Icons.copyAll} size={11} />}>Copy All</Button>}
            right={<Button onClick={pasteFull} icon={<Icon d={Icons.pasteAll} size={11} />}>Paste All</Button>}
          />
        </div>
      </PanelSection>

      {/* Content */}
      {isText && (
        <PanelSection
          title="Content"
          description="Edit text or button label"
          defaultOpen
          icon={<Icon d={Icons.text} size={13} />}
        >
          <Field label="Text content">
            <TextArea value={selected.text || ""} onChange={(e) => updatePatch({ text: e.target.value })} placeholder="Enter text…" />
          </Field>
        </PanelSection>
      )}

      {/* Media */}
      {isMedia && (
        <PanelSection
          title="Media"
          description="Replace image / video, upload or remove"
          defaultOpen
          icon={<Icon d={Icons.image} size={13} />}
        >
          <Field label="URL" hint="image or video">
            <Input
              value={selected.mediaUrl || ""}
              onChange={(e) => updatePatch({ mediaUrl: e.target.value })}
              placeholder="https://…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-1.5">
            <Button onClick={() => imageInputRef.current?.click()} icon={<Icon d={Icons.upload} size={11} />}>Image</Button>
            <Button onClick={() => videoInputRef.current?.click()} icon={<Icon d={Icons.video} size={11} />}>Video</Button>
            <Button onClick={pasteMediaUrl} icon={<Icon d={Icons.link} size={11} />}>Paste URL</Button>
            <Button variant="danger" onClick={() => updatePatch({ mediaUrl: "" })} icon={<Icon d={Icons.trash} size={11} />}>Remove</Button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadFile(e, "image")} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => uploadFile(e, "video")} />

          {selected.mediaUrl && (
            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-black">
              {selected.mediaType === "video" || isVideoUrl(selected.mediaUrl) ? (
                <video src={selected.mediaUrl} className="max-h-40 w-full object-cover" muted loop playsInline controls />
              ) : (
                <img src={selected.mediaUrl} alt="" className="max-h-40 w-full object-cover" />
              )}
            </div>
          )}
        </PanelSection>
      )}

      {/* Typography */}
      <PanelSection
        title="Typography"
        description="Font, size, weight, spacing, alignment"
        defaultOpen
        icon={<Icon d={Icons.font} size={13} />}
      >
        <Field label="Font family">
          <Select value={styles.fontFamily || ""} onChange={(e) => updateStyle("fontFamily", e.target.value)}>
            {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Size" hint="e.g. 48px">
            <Input placeholder="48px" value={styles.fontSize || ""} onChange={(e) => updateStyle("fontSize", e.target.value)} />
          </Field>
          <Field label="Weight">
            <Select value={styles.fontWeight || ""} onChange={(e) => updateStyle("fontWeight", e.target.value)}>
              <option value="">Default</option>
              <option value="300">Light 300</option>
              <option value="400">Regular 400</option>
              <option value="500">Medium 500</option>
              <option value="700">Bold 700</option>
              <option value="800">Extra Bold 800</option>
              <option value="900">Black 900</option>
            </Select>
          </Field>
          <Field label="Letter spacing" hint="e.g. -0.04em">
            <Input placeholder="-0.04em" value={styles.letterSpacing || ""} onChange={(e) => updateStyle("letterSpacing", e.target.value)} />
          </Field>
          <Field label="Line height" hint="e.g. 1.1">
            <Input placeholder="1.1" value={styles.lineHeight || ""} onChange={(e) => updateStyle("lineHeight", e.target.value)} />
          </Field>
        </div>

        <Field label="Alignment">
          <div className="grid grid-cols-4 gap-1">
            {["left","center","right","justify"].map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateStyle("textAlign", align)}
                className={`h-8 rounded-lg border text-[10px] font-semibold capitalize transition-all duration-150 ${
                  styles.textAlign === align
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {align.slice(0, 1).toUpperCase() + align.slice(1, 3)}
              </button>
            ))}
          </div>
        </Field>
      </PanelSection>

      {/* Colors */}
      <PanelSection
        title="Colors"
        description="Text, background, border, opacity"
        icon={<Icon d={Icons.palette} size={13} />}
      >
        <Field label="Text color">
          <ColorInput value={styles.color || ""} onChange={(v) => updateStyle("color", v)} />
        </Field>
        <Field label="Background">
          <ColorInput value={styles.backgroundColor || styles.background || ""} onChange={(v) => updateStyle("backgroundColor", v)} />
        </Field>
        <Field label="Border color">
          <ColorInput value={styles.borderColor || ""} onChange={(v) => updateStyle("borderColor", v)} />
        </Field>
        <Field label="Opacity" hint="0 – 1">
          <Input placeholder="1" value={styles.opacity || ""} onChange={(e) => updateStyle("opacity", e.target.value)} />
        </Field>
      </PanelSection>

      {/* Layout */}
      <PanelSection
        title="Layout"
        description="Spacing, size, radius, border, shadow"
        icon={<Icon d={Icons.layout} size={13} />}
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Padding",    "padding",      "24px"],
            ["Margin",     "margin",       "12px"],
            ["Width",      "width",        "100%"],
            ["Height",     "height",       "420px"],
            ["Min height", "minHeight",    "320px"],
            ["Max width",  "maxWidth",     "900px"],
            ["Radius",     "borderRadius", "24px"],
            ["Border",     "border",       "1px solid …"],
          ].map(([lbl, key, ph]) => (
            <Field key={key} label={lbl}>
              <Input placeholder={ph} value={styles[key] || ""} onChange={(e) => updateStyle(key, e.target.value)} />
            </Field>
          ))}
        </div>

        <Field label="Shadow">
          <Select value={styles.boxShadow || ""} onChange={(e) => updateStyle("boxShadow", e.target.value)}>
            {SHADOWS.map((s) => <option key={s.label} value={s.value}>{s.label}</option>)}
          </Select>
        </Field>

        {isMedia && (
          <Field label="Object fit">
            <div className="grid grid-cols-3 gap-1">
              {["cover","contain","fill"].map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => updateStyle("objectFit", fit)}
                  className={`h-8 rounded-lg border text-[10px] font-semibold capitalize transition-all duration-150 ${
                    styles.objectFit === fit
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </Field>
        )}
      </PanelSection>

      {/* Advanced */}
      <PanelSection
        title="Advanced"
        description="CSS classes, reset, normalize"
        icon={<Icon d={Icons.settings} size={13} />}
      >
        <Field label="CSS classes">
          <Input value={classes || ""} onChange={(e) => updatePatch({ classes: e.target.value })} placeholder="custom-class another-class" />
        </Field>

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="danger"
            onClick={resetVisuals}
            icon={<Icon d={Icons.reset} size={11} />}
          >
            Reset Styles
          </Button>
          <Button
            variant="ghost"
            onClick={() => updatePatch({ text: normalizeText(selected.text), mediaUrl: selected.mediaUrl })}
            icon={<Icon d={Icons.normalize} size={11} />}
          >
            Normalize
          </Button>
        </div>
      </PanelSection>

    </div>
  );
}
