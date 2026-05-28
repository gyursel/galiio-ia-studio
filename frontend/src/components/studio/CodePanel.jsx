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
  ChevronDown,
  ChevronRight,
  X,
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
    const content =
      file.id === "projectState"
        ? JSON.stringify(activePage?.projectState || {}, null, 2)
        : activePage?.[file.contentField] || "";

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

function fileDirtyKey(file) {
  return file?.path || file?.id || "";
}

function isJsonFile(file) {
  return (
    String(file?.language || "").toLowerCase().includes("json") ||
    String(file?.path || "").toLowerCase().endsWith(".json")
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
  const [dirtyFiles, setDirtyFiles] = React.useState({});
  const [collapsedFolders, setCollapsedFolders] = React.useState({});
  const [openTabs, setOpenTabs] = React.useState([]);

  const files = React.useMemo(() => normalizeGeneratedFiles(activePage), [activePage]);
  const selectedFile = files.find((file) => file.id === activeTab) || files[0];
  const value = getFileValue(selectedFile);

  const lineCount = value ? value.split("\n").length : 0;
  const fileSize = new Blob([value || ""]).size;

  const visibleFiles = files.filter((file) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    return (
      String(file.label || "").toLowerCase().includes(q) ||
      String(file.path || "").toLowerCase().includes(q) ||
      String(file.type || "").toLowerCase().includes(q)
    );
  });

  const folders = groupedFiles(visibleFiles);
  const selectedDirtyKey = fileDirtyKey(selectedFile);
  const hasUnsavedChanges = Boolean(dirtyFiles[selectedDirtyKey]);

  React.useEffect(() => {
    if (!selectedFile) return;

    setOpenTabs((current) => {
      const compactCurrent = current.filter((tab) =>
        files.some((file) => file.id === tab.id)
      );

      const exists = compactCurrent.some((tab) => tab.id === selectedFile.id);
      const next = exists ? compactCurrent : [...compactCurrent, selectedFile];

      return next.slice(-6);
    });
  }, [selectedFile, files]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1400);
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

    setDirtyFiles((current) => ({
      ...current,
      [fileDirtyKey(selectedFile) || field]: true,
    }));

    onChange?.(field, nextValue, selectedFile);
  };

  const handleFormatJson = () => {
    if (!selectedFile?.editable) {
      toast.message("This file is read-only");
      return;
    }

    if (!isJsonFile(selectedFile)) {
      toast.message("Format works only for JSON files");
      return;
    }

    try {
      const formatted = JSON.stringify(JSON.parse(value || "{}"), null, 2);
      handleChange(formatted);
      toast.success("JSON formatted");
    } catch {
      toast.error("Invalid JSON");
    }
  };

  const handleSaveClick = async () => {
    await onSave?.();
    setDirtyFiles({});
  };

  const handleCloseTab = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();

    setOpenTabs((current) => {
      const next = current.filter((item) => item.id !== tab.id);

      if (selectedFile?.id === tab.id && next.length) {
        onTabChange?.(next[next.length - 1].id);
      }

      return next.length ? next : current;
    });
  };

  const selectFile = (file) => {
    onTabChange?.(file.id);
  };

  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden border-l border-zinc-800/80 bg-[#07070a] text-white"
      data-testid="code-panel"
    >
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black/40 p-1 shadow-inner">
          <button
            type="button"
            data-testid="right-tab-code-btn"
            onClick={() => onRightTabChange?.("code")}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition ${
              rightTab === "code"
                ? "bg-white text-zinc-950 shadow"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Code
          </button>

          <button
            type="button"
            data-testid="right-tab-inspect-btn"
            onClick={() => onRightTabChange?.("inspect")}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition ${
              rightTab === "inspect"
                ? "bg-white text-zinc-950 shadow"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            Inspect
          </button>

          <button
            type="button"
            data-testid="right-tab-live-preview-btn"
            onClick={onLivePreview}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
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
        <div className="grid min-h-0 flex-1 grid-rows-[230px_1fr]">
          <section className="flex min-h-0 flex-col border-b border-zinc-800 bg-zinc-950/50">
            <div className="shrink-0 px-3 pb-2 pt-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                    <Files className="h-3.5 w-3.5" />
                    Generated files
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">
                    Hercules-style folder tree • {files.length} files
                  </div>
                </div>

                <div className="max-w-[120px] truncate rounded-full border border-zinc-800 bg-black/40 px-2 py-1 text-[10px] font-mono text-zinc-500">
                  {project?.name || "project"}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/40 px-2.5 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search files..."
                  className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-3 pb-3">
              {Object.entries(folders).map(([folder, folderFiles]) => (
                <div key={folder} className="mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedFolders((current) => ({
                        ...current,
                        [folder]: !current[folder],
                      }))
                    }
                    className="mb-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[10px] font-mono uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-900/70 hover:text-zinc-400"
                  >
                    {collapsedFolders[folder] ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{folder}</span>
                    <span className="ml-auto rounded-full border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {folderFiles.length}
                    </span>
                  </button>

                  {!collapsedFolders[folder] ? (
                    <div className="space-y-1">
                      {folderFiles.map((file) => {
                        const Icon = file.icon || Braces;
                        const active = selectedFile?.id === file.id;
                        const fileHasUnsavedChanges = Boolean(dirtyFiles[fileDirtyKey(file)]);

                        return (
                          <button
                            key={file.id}
                            type="button"
                            data-testid={`file-${file.id}-btn`}
                            onClick={() => selectFile(file)}
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
                                    active
                                      ? "text-zinc-600"
                                      : "text-zinc-600 group-hover:text-zinc-500"
                                  }`}
                                >
                                  {file.path}
                                </div>
                              </div>
                              {fileHasUnsavedChanges ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                              ) : null}
                              {!file.editable ? (
                                <Lock className="h-3 w-3 shrink-0 opacity-50" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}

              {!visibleFiles.length ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-600">
                  No files match your search.
                </div>
              ) : null}
            </div>
          </section>

          <section className="flex min-h-0 flex-col bg-[#050507]">
            {openTabs.length ? (
              <div className="shrink-0 border-b border-zinc-800 bg-black/30 px-2 pt-2">
                <div className="flex min-w-0 gap-1 overflow-x-auto">
                  {openTabs.map((tab) => {
                    const TabIcon = tab.icon || FileCode;
                    const tabDirty = Boolean(dirtyFiles[fileDirtyKey(tab)]);
                    const tabActive = selectedFile?.id === tab.id;

                    return (
                      <div
                        key={tab.id}
                        className={`inline-flex h-8 max-w-[175px] shrink-0 items-center rounded-t-xl border border-b-0 transition ${
                          tabActive
                            ? "border-zinc-800 bg-zinc-950 text-white"
                            : "border-transparent bg-zinc-900/40 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onTabChange?.(tab.id)}
                          className="inline-flex h-full min-w-0 items-center gap-1.5 px-2.5 text-[11px] font-semibold"
                        >
                          <TabIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                          {tabDirty ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          ) : null}
                        </button>

                        {openTabs.length > 1 ? (
                          <button
                            type="button"
                            onClick={(event) => handleCloseTab(event, tab)}
                            className={`mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                              tabActive
                                ? "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                            }`}
                            aria-label={`Close ${tab.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/90 px-3 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {selectedFile?.icon ? (
                      <selectedFile.icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    ) : (
                      <FileCode className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    )}

                    <span className="min-w-0 truncate text-xs font-semibold text-white">
                      {selectedFile?.label || "No file"}
                    </span>

                    <span className="shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                      {selectedFile?.type || "FILE"}
                    </span>
                  </div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono text-zinc-600">
                    <span className="max-w-full truncate">{selectedFile?.path || ""}</span>
                    <span>•</span>
                    <span>{lineCount} lines</span>
                    <span>•</span>
                    <span>{fileSize} bytes</span>
                    <span>•</span>
                    <span
                      className={
                        hasUnsavedChanges
                          ? "text-emerald-400"
                          : selectedFile?.editable
                            ? "text-zinc-400"
                            : "text-amber-400"
                      }
                    >
                      {hasUnsavedChanges
                        ? "unsaved changes"
                        : selectedFile?.editable
                          ? "editable"
                          : "read-only"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-2.5 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>

                  {isJsonFile(selectedFile) ? (
                    <button
                      type="button"
                      onClick={handleFormatJson}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-2.5 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95"
                    >
                      <Braces className="h-3 w-3" />
                      Format
                    </button>
                  ) : null}

                  <button
                    type="button"
                    data-testid="save-code-btn"
                    onClick={handleSaveClick}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-3 text-[11px] font-black text-zinc-950 shadow-[0_0_22px_rgba(255,255,255,0.12)] transition hover:bg-zinc-200 active:scale-95"
                  >
                    <Save className="h-3 w-3" />
                    {hasUnsavedChanges ? "Save changes" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            <textarea
              data-testid="code-editor"
              value={value}
              onChange={(event) => handleChange(event.target.value)}
              readOnly={!selectedFile?.editable}
              spellCheck={false}
              className={`min-h-0 flex-1 w-full resize-none border-0 bg-[#050507] p-4 font-mono text-[12px] leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 ${
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
