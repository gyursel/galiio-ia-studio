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
  Search,
  FolderOpen,
  Braces,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import InspectorPanel from "@/components/studio/InspectorPanel";
import ComponentsPalette from "@/components/studio/ComponentsPalette";

const FALLBACK_FILES = [
  {
    id: "html",
    label: "index.html",
    name: "index.html",
    path: "src/generated/index.html",
    type: "HTML",
    language: "html",
    icon: FileCode,
    editable: true,
    contentField: "html",
  },
  {
    id: "css",
    label: "styles.css",
    name: "styles.css",
    path: "src/generated/styles.css",
    type: "CSS",
    language: "css",
    icon: FileType,
    editable: true,
    contentField: "css",
  },
  {
    id: "js",
    label: "script.js",
    name: "script.js",
    path: "src/generated/script.js",
    type: "JS",
    language: "javascript",
    icon: FileJson,
    editable: true,
    contentField: "js",
  },
  {
    id: "projectState",
    label: "projectState.json",
    name: "projectState.json",
    path: "src/generated/projectState.json",
    type: "JSON",
    language: "json",
    icon: Braces,
    editable: false,
  },
];

function fileIcon(language) {
  const lang = String(language || "").toLowerCase();
  if (lang === "html") return FileCode;
  if (lang === "css") return FileType;
  if (lang === "javascript" || lang === "js") return FileJson;
  return Braces;
}

function normalizeGeneratedFiles(activePage) {
  const generated = Array.isArray(activePage?.generatedFiles)
    ? activePage.generatedFiles
    : [];

  if (generated.length) {
    return generated.map((file, index) => {
      const path = file.path || file.name || `generated/file-${index + 1}`;
      const name = file.name || String(path).split("/").pop() || `file-${index + 1}`;
      const language = file.language || file.kind || "text";
      return {
        id: file.id || path || name,
        label: name,
        name,
        path,
        type: String(language).toUpperCase(),
        language,
        editable: file.editable !== false,
        content: typeof file.content === "string" ? file.content : "",
        icon: fileIcon(language),
      };
    });
  }

  return FALLBACK_FILES.map((file) => {
    let content = "";
    if (file.id === "projectState") {
      content = JSON.stringify(activePage?.projectState || {}, null, 2);
    } else {
      content = activePage?.[file.contentField] || "";
    }
    return { ...file, content };
  });
}

function getFileValue(file) {
  return file?.content || "";
}

function groupedFiles(files) {
  const groups = {};
  for (const file of files) {
    const parts = String(file.path || file.name || "").split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(file);
  }

  return Object.fromEntries(
    Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([folder, folderFiles]) => [
        folder,
        [...folderFiles].sort((a, b) =>
          String(a.path || a.name || "").localeCompare(String(b.path || b.name || ""))
        ),
      ])
  );
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
  const [query, setQuery] = React.useState("");

  const files = React.useMemo(() => normalizeGeneratedFiles(activePage), [activePage]);
  const selectedFile = files.find((file) => file.id === activeTab) || files[0];
  const value = getFileValue(selectedFile);
  const lineCount = value ? value.split("\n").length : 0;
  const fileSize = new Blob([value || ""]).size;

  const visibleFiles = files.filter((file) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      file.label.toLowerCase().includes(q) ||
      file.path.toLowerCase().includes(q) ||
      file.type.toLowerCase().includes(q)
    );
  });

  const folders = groupedFiles(visibleFiles);

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

  const handleChange = (nextValue) => {
    if (!selectedFile?.editable) return;

    const id = selectedFile.id;
    const path = selectedFile.path || "";

    const field =
      id === "html" || path.endsWith("index.html")
        ? "html"
        : id === "css" || path.endsWith("styles.css")
          ? "css"
          : id === "js" || path.endsWith("script.js")
            ? "js"
            : id;

    onChange?.(field, nextValue, selectedFile);
  };

  return (
    <aside
      className="h-full min-h-0 border-l border-zinc-800/80 bg-[#07070a] text-white flex flex-col overflow-hidden"
      data-testid="code-panel"
    >
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black/40 p-1 shadow-inner">
          <button
            type="button"
            data-testid="right-tab-code-btn"
            onClick={() => onRightTabChange?.("code")}
            className={`flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition ${
              rightTab === "code"
                ? "bg-white text-zinc-950 shadow"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>

          <button
            type="button"
            data-testid="right-tab-inspect-btn"
            onClick={() => onRightTabChange?.("inspect")}
            className={`flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition ${
              rightTab === "inspect"
                ? "bg-white text-zinc-950 shadow"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            Inspect
          </button>

          <button
            type="button"
            data-testid="right-tab-live-preview-btn"
            onClick={onLivePreview}
            className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>

      {rightTab === "inspect" ? (
        <div className="flex-1 overflow-auto p-3">
          <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-xs font-semibold text-white">Visual Inspector</div>
            <div className="mt-1 text-[11px] leading-5 text-zinc-500">
              Click an element in Edit mode and adjust it here.
            </div>
          </div>

          <InspectorPanel
            selected={selected}
            editing={editing}
            onUpdate={onInspectorUpdate}
            onClose={onInspectorClose}
            onEnter={onEnterEdit}
          />

          <div className="mt-3">
            <ComponentsPalette onInsert={onInsertComponent} disabled={!editing} />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-rows-[240px_1fr]">
          <section className="min-h-0 border-b border-zinc-800 bg-zinc-950/50 flex flex-col">
            <div className="shrink-0 px-3 pt-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                    <Files className="w-3.5 h-3.5" />
                    Generated files
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">
                    Hercules-style flat tree • {files.length} files
                  </div>
                </div>

                <div className="rounded-full border border-zinc-800 bg-black/40 px-2 py-1 text-[10px] font-mono text-zinc-500">
                  {project?.name || "project"}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/40 px-2.5 py-2">
                <Search className="h-3.5 w-3.5 text-zinc-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-3 pb-3">
              {Object.entries(folders).map(([folder, folderFiles]) => (
                <div key={folder} className="mb-3">
                  <div className="mb-1.5 flex items-center gap-2 px-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="truncate">{folder}</span>
                    <span className="ml-auto rounded-full border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {folderFiles.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {folderFiles.map((file) => {
                      const Icon = file.icon || Braces;
                      const active = selectedFile?.id === file.id;

                      return (
                        <button
                          key={file.id}
                          type="button"
                          data-testid={`file-${file.id}-btn`}
                          onClick={() => onTabChange?.(file.id)}
                          className={`group w-full rounded-xl border px-2.5 py-2 text-left transition ${
                            active
                              ? "border-white/20 bg-white text-zinc-950 shadow"
                              : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold">
                                {file.label}
                              </div>
                              <div
                                className={`truncate text-[10px] font-mono ${
                                  active ? "text-zinc-600" : "text-zinc-600 group-hover:text-zinc-500"
                                }`}
                              >
                                {file.path}
                              </div>
                            </div>
                            {!file.editable ? <Lock className="h-3 w-3 shrink-0 opacity-50" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-0 flex flex-col bg-[#050507]">
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/80 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {selectedFile?.icon ? (
                      <selectedFile.icon className="h-3.5 w-3.5 text-zinc-400" />
                    ) : (
                      <FileCode className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span className="truncate text-xs font-semibold text-white">
                      {selectedFile?.label || "No file"}
                    </span>
                    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                      {selectedFile?.type || "FILE"}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] font-mono text-zinc-600">
                    <span className="truncate">{selectedFile?.path || ""}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0">{lineCount} lines</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0">{fileSize} bytes</span>
                    <span className="shrink-0">•</span>
                    <span className={`shrink-0 ${selectedFile?.editable ? "text-emerald-400" : "text-amber-400"}`}>
                      {selectedFile?.editable ? "editable" : "read-only"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    data-testid="save-code-btn"
                    onClick={onSave}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-bold text-zinc-950 shadow transition hover:bg-zinc-200 active:scale-95"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            <textarea
              data-testid="code-editor"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              readOnly={!selectedFile?.editable}
              spellCheck={false}
              className={`flex-1 min-h-0 w-full resize-none border-0 bg-[#050507] p-4 font-mono text-xs leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 ${
                selectedFile?.editable ? "" : "opacity-70"
              }`}
              placeholder={
                selectedFile?.editable
                  ? "Generated file content..."
                  : "This generated metadata file is read-only for now."
              }
            />
          </section>
        </div>
      )}
    </aside>
  );
}
