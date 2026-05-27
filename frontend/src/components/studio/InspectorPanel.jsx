import React, { useEffect, useMemo, useState } from "react";
import { Box, Image, SlidersHorizontal, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { searchPexelsMedia } from "@/lib/api";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export default function InspectorPanel({ selected, onUpdate, editing }) {
  const safeSelected = selected || {};
  const styles = safeSelected.styles || {};

  const defaultMediaQuery = useMemo(() => {
    return String(
      safeSelected.mediaQuery ||
        safeSelected.label ||
        safeSelected.alt ||
        safeSelected.text ||
        safeSelected.mediaType ||
        "premium realistic photography"
    ).slice(0, 80);
  }, [safeSelected.mediaQuery, safeSelected.label, safeSelected.alt, safeSelected.text, safeSelected.mediaType]);

  const [pexelsQuery, setPexelsQuery] = useState(defaultMediaQuery);
  const [pexelsType, setPexelsType] = useState(safeSelected.mediaType === "video" ? "video" : "photo");
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsResults, setPexelsResults] = useState([]);

  useEffect(() => {
    setPexelsQuery(defaultMediaQuery);
    setPexelsType(safeSelected.mediaType === "video" ? "video" : "photo");
    setPexelsResults([]);
  }, [safeSelected.id, safeSelected.mediaType, defaultMediaQuery]);

  if (!editing) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        Enable <span className="font-semibold text-zinc-300">Edit</span> to inspect elements.
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        Click any element in the preview to edit it.
      </div>
    );
  }

  const patchText = (text) => onUpdate(selected.id, { text });
  const patchMediaUrl = (mediaUrl) => onUpdate(selected.id, { mediaUrl });

  const searchPexels = async () => {
    const q = String(pexelsQuery || defaultMediaQuery || "").trim();
    if (!q) return;

    setPexelsLoading(true);
    try {
      const data = await searchPexelsMedia({
        q,
        type: pexelsType,
        per_page: 18,
      });
      setPexelsResults(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      window.alert(error?.response?.data?.detail || error?.message || "Pexels search failed");
    } finally {
      setPexelsLoading(false);
    }
  };
  const patchClasses = (classes) => onUpdate(selected.id, { classes });
  const deleteElement = () => onUpdate(selected.id, { delete: true });
  const normalizeCssValue = (key, value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    const pxKeys = new Set([
      "width",
      "height",
      "minHeight",
      "maxWidth",
      "padding",
      "margin",
      "borderRadius",
      "gap",
      "fontSize",
      "letterSpacing",
    ]);

    if (pxKeys.has(key) && /^-?\\d+(\\.\\d+)?$/.test(raw)) {
      return `${raw}px`;
    }

    return raw;
  };

  const patchStyle = (key, value) => {
    const layoutKeys = new Set([
      "width",
      "height",
      "minHeight",
      "maxWidth",
      "padding",
      "margin",
      "borderRadius",
      "gap",
      "gridTemplateColumns",
    ]);

    const normalized = normalizeCssValue(key, value);
    const styles = { [key]: normalized };

    if (layoutKeys.has(key) && !selected.styles?.display) {
      styles.display = "inline-block";
    }

    onUpdate(selected.id, { styles });
  };

  const inputClass = "h-8 border-zinc-800 bg-zinc-900 text-xs text-zinc-100";
  const areaClass = "min-h-[72px] border-zinc-800 bg-zinc-900 text-xs text-zinc-100";

  return (
    <div className="space-y-3 p-3 text-zinc-100">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="text-xs font-bold text-emerald-300">Selected</div>
        <div className="mt-1 truncate text-xs text-zinc-400">{selected.tag || "element"}</div>
        <div className="mt-1 truncate text-[11px] text-zinc-500">{selected.id}</div>
        <div className="mt-2 text-[11px] text-zinc-500">Auto-save enabled</div>
      </div>

      {String(selected.id || "").startsWith("customElements.") ? (
        <button
          type="button"
          onClick={deleteElement}
          className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20"
        >
          Delete selected custom text
        </button>
      ) : null}


      {selected.text !== undefined && selected.text !== null ? (
        <Section icon={Type} title="Text">
          <Textarea
            value={selected.text || ""}
            onChange={(e) => patchText(e.target.value)}
            className={areaClass}
            placeholder="Element text..."
          />
        </Section>
      ) : null}

      {selected.mediaUrl !== undefined && selected.mediaUrl !== null ? (
        <Section icon={Image} title="Media">
          <Field label={selected.mediaType === "video" ? "Video URL" : "Image URL"}>
            <Input
              value={selected.mediaUrl || ""}
              onChange={(e) => patchMediaUrl(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) patchMediaUrl(text.trim());
                } catch {
                  window.alert("Clipboard access blocked. Paste the URL manually.");
                }
              }}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-[11px] font-bold text-zinc-200 hover:bg-zinc-800"
            >
              Paste URL
            </button>
            <button
              type="button"
              onClick={() => selected.mediaUrl && window.open(selected.mediaUrl, "_blank")}
              disabled={!selected.mediaUrl}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-[11px] font-bold text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => patchMediaUrl("")}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-[11px] font-bold text-red-300 hover:bg-red-500/20"
            >
              Clear
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Pexels Picker
              </div>
              <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
                <button
                  type="button"
                  onClick={() => setPexelsType("photo")}
                  className={`rounded-md px-2 py-1 text-[10px] font-bold ${pexelsType === "photo" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  Photos
                </button>
                <button
                  type="button"
                  onClick={() => setPexelsType("video")}
                  className={`rounded-md px-2 py-1 text-[10px] font-bold ${pexelsType === "video" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                >
                  Videos
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                className={inputClass}
                placeholder="Search Pexels..."
              />
              <button
                type="button"
                onClick={searchPexels}
                disabled={pexelsLoading}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pexelsLoading ? "..." : "Search"}
              </button>
            </div>

            {pexelsResults.length ? (
              <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-auto pr-1">
                {pexelsResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => patchMediaUrl(item.url)}
                    className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-left hover:border-cyan-400/60"
                    title={item.alt || item.credit}
                  >
                    {item.preview ? (
                      <img src={item.preview} alt={item.alt || ""} className="h-20 w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-20 items-center justify-center text-xs text-zinc-500">No preview</div>
                    )}
                    <div className="truncate px-2 py-1 text-[10px] text-zinc-500">
                      {item.type} • {item.credit || "Pexels"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-zinc-800 p-3 text-center text-[11px] text-zinc-500">
                Search Pexels and click a result to replace the selected media.
              </div>
            )}
          </div>

          {selected.mediaUrl ? (
            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              {selected.mediaType === "video" ? (
                <video src={selected.mediaUrl} className="max-h-36 w-full object-cover" muted loop playsInline />
              ) : (
                <img src={selected.mediaUrl} alt="" className="max-h-36 w-full object-cover" />
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/60 p-4 text-center text-xs text-zinc-500">
              Pick from Pexels or paste an image/video URL.
            </div>
          )}
        </Section>
      ) : null}

      <Section icon={Box} title="Layout">
        <Row>
          <Field label="Width">
            <Input value={styles.width || ""} onChange={(e) => patchStyle("width", e.target.value)} className={inputClass} placeholder="320px / 100%" />
          </Field>
          <Field label="Height">
            <Input value={styles.height || ""} onChange={(e) => patchStyle("height", e.target.value)} className={inputClass} placeholder="120px / auto" />
          </Field>
        </Row>

        <Row>
          <Field label="Min height">
            <Input value={styles.minHeight || ""} onChange={(e) => patchStyle("minHeight", e.target.value)} className={inputClass} placeholder="400px" />
          </Field>
          <Field label="Max width">
            <Input value={styles.maxWidth || ""} onChange={(e) => patchStyle("maxWidth", e.target.value)} className={inputClass} placeholder="900px" />
          </Field>
        </Row>

        <Row>
          <Field label="Padding">
            <Input value={styles.padding || ""} onChange={(e) => patchStyle("padding", e.target.value)} className={inputClass} placeholder="24px" />
          </Field>
          <Field label="Margin">
            <Input value={styles.margin || ""} onChange={(e) => patchStyle("margin", e.target.value)} className={inputClass} placeholder="0 auto" />
          </Field>
        </Row>

        <Row>
          <Field label="Gap">
            <Input value={styles.gap || ""} onChange={(e) => patchStyle("gap", e.target.value)} className={inputClass} placeholder="18px" />
          </Field>
          <Field label="Display">
            <Input value={styles.display || ""} onChange={(e) => patchStyle("display", e.target.value)} className={inputClass} placeholder="block / flex / grid" />
          </Field>
        </Row>

        <Row>
          <Field label="Justify">
            <Input value={styles.justifyContent || ""} onChange={(e) => patchStyle("justifyContent", e.target.value)} className={inputClass} placeholder="center / space-between" />
          </Field>
          <Field label="Align">
            <Input value={styles.alignItems || ""} onChange={(e) => patchStyle("alignItems", e.target.value)} className={inputClass} placeholder="center / stretch" />
          </Field>
        </Row>

        <Field label="Grid columns">
          <Input
            value={styles.gridTemplateColumns || ""}
            onChange={(e) => patchStyle("gridTemplateColumns", e.target.value)}
            className={inputClass}
            placeholder="repeat(3, minmax(0, 1fr))"
          />
        </Field>
      </Section>

      <Section icon={Type} title="Typography">
        <Row>
          <Field label="Font size">
            <Input value={styles.fontSize || ""} onChange={(e) => patchStyle("fontSize", e.target.value)} className={inputClass} placeholder="32px" />
          </Field>
          <Field label="Weight">
            <Input value={styles.fontWeight || ""} onChange={(e) => patchStyle("fontWeight", e.target.value)} className={inputClass} placeholder="700" />
          </Field>
        </Row>

        <Row>
          <Field label="Line height">
            <Input value={styles.lineHeight || ""} onChange={(e) => patchStyle("lineHeight", e.target.value)} className={inputClass} placeholder="1.1" />
          </Field>
          <Field label="Letter spacing">
            <Input value={styles.letterSpacing || ""} onChange={(e) => patchStyle("letterSpacing", e.target.value)} className={inputClass} placeholder="-0.04em" />
          </Field>
        </Row>

        <Field label="Text color">
          <Input value={styles.color || ""} onChange={(e) => patchStyle("color", e.target.value)} className={inputClass} placeholder="#ffffff" />
        </Field>
      </Section>

      <Section icon={SlidersHorizontal} title="Visual">
        <Row>
          <Field label="Background">
            <Input value={styles.background || ""} onChange={(e) => patchStyle("background", e.target.value)} className={inputClass} placeholder="rgba(...) / #111" />
          </Field>
          <Field label="Radius">
            <Input value={styles.borderRadius || ""} onChange={(e) => patchStyle("borderRadius", e.target.value)} className={inputClass} placeholder="24px" />
          </Field>
        </Row>

        <Row>
          <Field label="Border">
            <Input value={styles.border || ""} onChange={(e) => patchStyle("border", e.target.value)} className={inputClass} placeholder="1px solid ..." />
          </Field>
          <Field label="Opacity">
            <Input value={styles.opacity || ""} onChange={(e) => patchStyle("opacity", e.target.value)} className={inputClass} placeholder="0.8" />
          </Field>
        </Row>

        <Field label="Shadow">
          <Input value={styles.boxShadow || ""} onChange={(e) => patchStyle("boxShadow", e.target.value)} className={inputClass} placeholder="0 20px 80px rgba(...)" />
        </Field>

        <Row>
          <Field label="Scale">
            <Input value={styles.transform || ""} onChange={(e) => patchStyle("transform", e.target.value)} className={inputClass} placeholder="scale(1.05)" />
          </Field>
          <Field label="Z index">
            <Input value={styles.zIndex || ""} onChange={(e) => patchStyle("zIndex", e.target.value)} className={inputClass} placeholder="10" />
          </Field>
        </Row>

        <Field label="Extra classes">
          <Input value={selected.classes || ""} onChange={(e) => patchClasses(e.target.value)} className={inputClass} placeholder="custom-class" />
        </Field>
      </Section>
    </div>
  );
}
