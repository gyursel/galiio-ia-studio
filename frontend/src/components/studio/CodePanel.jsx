import React from "react";
import {
  FileCode,
  FileType,
  FileJson,
  Save,
  Files,
  Copy,
  Check,
  Code2,
  MousePointer2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import InspectorPanel from "@/components/studio/InspectorPanel";
import ComponentsPalette from "@/components/studio/ComponentsPalette";

const TABS = [
  { id: "html", label: "index.html", icon: FileCode },
  { id: "css", label: "styles.css", icon: FileType },
  { id: "js", label: "script.js", icon: FileJson },
];

export default function CodePanel({
  project,
  activePage,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  // visual editor props
  editing,
  selected,
  onEnterEdit,
  onInspectorUpdate,
  onInspectorClose,
  onInsertComponent,
  rightTab,
  onRightTabChange,
  onLivePreview,
}) {
  const [copied, setCopied] = React.useState(false);
  const value = activePage?.[activeTab] || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <aside
      className="border-l border-zinc-800/80 bg-zinc-950 flex flex-col min-h-0"
      data-testid="code-panel"
    >
      {/* Top tab switcher: Code | Inspect */}
      <div className="flex border-b border-zinc-800/60 shrink-0">
        <button
          data-testid="right-tab-code-btn"
          onClick={() => onRightTabChange("code")}
          className={`flex-1 h-9 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            rightTab === "code"
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> Code
        </button>
        <button
          data-testid="right-tab-inspect-btn"
          onClick={() => onRightTabChange("inspect")}
          className={`flex-1 h-9 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            rightTab === "inspect"
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-200"
          }`}
        >
          <MousePointer2 className="w-3.5 h-3.5" /> Inspect
        </button>
        <button
          data-testid="right-tab-live-preview-btn"
          onClick={onLivePreview}
          className="flex-1 h-9 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 border-transparent text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Live Preview
        </button>
      </div>

      {rightTab === "code" ? (
        <>
          <div className="p-3 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 px-1">
              <Files className="w-3 h-3" /> Files
            </div>
            <div className="space-y-0.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    data-testid={`file-${t.id}-btn`}
                    onClick={() => onTabChange(t.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                      active
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ComponentsPalette onInsert={onInsertComponent} />

          <div className="h-9 shrink-0 border-b border-zinc-800/60 flex items-center px-3 gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              {activeTab}
            </span>
            <div className="flex-1" />
            <button
              data-testid="copy-code-btn"
              onClick={handleCopy}
              className="h-6 px-2 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-900 inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              data-testid="save-code-btn"
              onClick={onSave}
              className="h-6 px-2 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-white inline-flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <textarea
              data-testid="code-editor"
              value={value}
              onChange={(e) => onChange(activeTab, e.target.value)}
              spellCheck={false}
              className="w-full h-full bg-zinc-950 text-zinc-200 font-mono text-[12px] leading-relaxed p-4 resize-none outline-none border-0"
              placeholder={`// ${activeTab} will appear here once Galio generates your site`}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <InspectorPanel
            selected={selected}
            editing={editing}
            onEnter={onEnterEdit}
            onUpdate={onInspectorUpdate}
            onClose={onInspectorClose}
          />
        </div>
      )}
    </aside>
  );
}
