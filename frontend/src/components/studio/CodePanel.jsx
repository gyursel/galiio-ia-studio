import React from "react";
import {
  FileCode,
  FileType,
  FileJson,
  Save,
  Copy,
  Check,
  Code2,
  MousePointer2,
  Eye,
  Folder,
  FolderOpen,
  Braces,
  Palette,
  LayoutTemplate,
  Database,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import InspectorPanel from "@/components/studio/InspectorPanel";
import ComponentsPalette from "@/components/studio/ComponentsPalette";

const CORE_FILES = [
  {
    id: "html",
    field: "html",
    path: "src/generated/index.html",
    name: "index.html",
    folder: "src/generated",
    icon: FileCode,
    editable: true,
  },
  {
    id: "css",
    field: "css",
    path: "src/generated/styles.css",
    name: "styles.css",
    folder: "src/generated",
    icon: FileType,
    editable: true,
  },
  {
    id: "js",
    field: "js",
    path: "src/generated/script.js",
    name: "script.js",
    folder: "src/generated",
    icon: FileJson,
    editable: true,
  },
];

function stringify(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

function buildFiles(activePage, project) {
  const state = activePage?.projectState || project?.projectState || {};
  const media = state?.mediaAssets || {};
  const custom = state?.customCode || {};

  return [
    ...CORE_FILES,
    {
      id: "projectState",
      path: "src/generated/projectState.json",
      name: "projectState.json",
      folder: "src/generated",
      icon: Braces,
      editable: false,
      value: stringify(state),
    },
    {
      id: "theme",
      path: "src/generated/theme.json",
      name: "theme.json",
      folder: "src/generated",
      icon: Palette,
      editable: false,
      value: stringify({
        brandName: state.brandName,
        industry: state.industry,
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        visualSystem: state.visualSystem,
      }),
    },
    {
      id: "media",
      path: "src/generated/media.json",
      name: "media.json",
      folder: "src/generated",
      icon: Database,
      editable: false,
      value: stringify(media),
    },
    {
      id: "customCode",
      path: "src/generated/customCode.json",
      name: "customCode.json",
      folder: "src/generated",
      icon: Settings,
      editable: false,
      value: stringify(custom),
    },
    {
      id: "renderer",
      path: "src/components/studio/PremiumWebsiteRenderer.jsx",
      name: "PremiumWebsiteRenderer.jsx",
      folder: "src/components/studio",
      icon: LayoutTemplate,
      editable: false,
      value:
`// Renderer file reference
// This is the React renderer that displays projectState.
// Visual edits and AI generation update the project data,
// then the renderer turns it into the live website.

// Real file:
// frontend/src/components/studio/PremiumWebsiteRenderer.jsx`,
    },
  ];
}

export default function CodePanel({
  project,
  activePage,
  activeTab,
  onTabChange,
  onChange,
  onSave,
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
  const files = React.useMemo(() => buildFiles(activePage, project), [activePage, project]);
  const selectedFile = files.find((f) => f.id === activeTab) || files[0];
  const value = selectedFile?.editable
    ? activePage?.[selectedFile.field] || ""
    : selectedFile?.value || "";

  const grouped = React.useMemo(() => {
    const out = [];
    const folders = [...new Set(files.map((f) => f.folder))];

    for (const folder of folders) {
      out.push({
        folder,
        files: files.filter((f) => f.folder === folder),
      });
    }

    return out;
  }, [files]);

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

  const handleFileSelect = (file) => {
    onTabChange(file.id);
  };

  const handleChange = (next) => {
    if (!selectedFile?.editable) return;
    onChange(selectedFile.field, next);
  };

  return (
    <aside
      className="border-l border-zinc-800/80 bg-zinc-950 flex flex-col min-h-0"
      data-testid="code-panel"
    >
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
        <div className="flex-1 min-h-0 grid grid-rows-[260px_1fr]">
          <section className="min-h-0 border-b border-zinc-800/70 bg-zinc-950/95">
            <div className="h-9 px-3 border-b border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <FolderOpen className="w-3.5 h-3.5" />
                Generated File Tree
              </div>
              <div className="text-[10px] font-mono text-zinc-600">
                Hercules-style flat tree
              </div>
            </div>

            <div className="h-[221px] overflow-auto p-2">
              {grouped.map((group) => (
                <div key={group.folder} className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono text-zinc-400">
                    <Folder className="w-3.5 h-3.5 text-amber-300/80" />
                    <span className="truncate">{group.folder}</span>
                  </div>

                  <div className="ml-4 space-y-0.5 border-l border-zinc-800/70 pl-2">
                    {group.files.map((file) => {
                      const Icon = file.icon || FileCode;
                      const active = selectedFile?.id === file.id;

                      return (
                        <button
                          key={file.id}
                          data-testid={`file-tree-${file.id}`}
                          onClick={() => handleFileSelect(file)}
                          className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-mono transition-all ${
                            active
                              ? "bg-white text-zinc-950 shadow-lg"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-zinc-950" : "text-zinc-500"}`} />
                          <span className="truncate">{file.name}</span>
                          {!file.editable ? (
                            <span className={`ml-auto text-[9px] uppercase ${active ? "text-zinc-600" : "text-zinc-600"}`}>
                              read
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-0 flex flex-col bg-[#050509]">
            <div className="h-10 px-3 border-b border-zinc-800/70 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-100 truncate">
                  {selectedFile?.path}
                </div>
                <div className="text-[10px] font-mono text-zinc-600 truncate">
                  {selectedFile?.editable ? "Editable generated source" : "Read-only project reference"}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  data-testid="copy-code-btn"
                  onClick={handleCopy}
                  className="h-7 px-2 rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 inline-flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  data-testid="save-code-btn"
                  onClick={onSave}
                  disabled={!selectedFile?.editable}
                  className={`h-7 px-3 rounded-lg text-[11px] inline-flex items-center gap-1 transition-all ${
                    selectedFile?.editable
                      ? "bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95"
                      : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
            </div>

            <textarea
              data-testid="code-editor"
              value={value}
              readOnly={!selectedFile?.editable}
              onChange={(e) => handleChange(e.target.value)}
              spellCheck={false}
              className={`flex-1 min-h-0 w-full resize-none bg-[#050509] p-4 font-mono text-xs leading-6 outline-none ${
                selectedFile?.editable
                  ? "text-zinc-200 caret-emerald-300"
                  : "text-zinc-400"
              }`}
            />
          </section>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-3 border-b border-zinc-800/60">
            <button
              data-testid="enter-edit-mode-btn"
              onClick={onEnterEdit}
              className={`w-full h-9 rounded-lg text-xs font-semibold transition-all ${
                editing
                  ? "bg-blue-500/15 text-blue-200 border border-blue-400/30"
                  : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              {editing ? "Edit mode enabled" : "Enable Edit mode"}
            </button>
          </div>

          <InspectorPanel
            selected={selected}
            editing={editing}
            onUpdate={onInspectorUpdate}
            onClose={onInspectorClose}
          />

          <ComponentsPalette onInsert={onInsertComponent} />
        </div>
      )}
    </aside>
  );
}
