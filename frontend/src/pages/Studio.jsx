import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getProject,
  updateProject,
  aiGenerate,
  getMessages,
  getVersions,
  restoreVersion,
  pushToGithub,
  deployToVercel,
  exportProjectUrl,
  createPage,
  updatePage,
  deletePage,
} from "@/lib/api";
import { toast } from "sonner";
import StudioHeader from "@/components/studio/StudioHeader";
import ChatPanel from "@/components/studio/ChatPanel";
import PreviewCanvas from "@/components/studio/PreviewCanvas";
import CodePanel from "@/components/studio/CodePanel";
import VersionsDialog from "@/components/studio/VersionsDialog";
import PagesSidebar from "@/components/studio/PagesSidebar";
import ShareDialog from "@/components/studio/ShareDialog";
import DomainDialog from "@/components/studio/DomainDialog";

const MODES = ["plan", "build", "debug", "refine", "publish"];

export default function Studio() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt || "";

  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("build");
  const [device, setDevice] = useState("desktop");
  const [activeTab, setActiveTab] = useState("html");
  const [rightTab, setRightTab] = useState("code"); // "code" | "inspect"
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDomain, setShowDomain] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [activePath, setActivePath] = useState("/");

  // Visual editor
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const previewRef = useRef(null);

  const autoBuiltRef = useRef(false);

  const role = project?.role || project?._role;
  const canEdit = role === "owner" || role === "editor";

  const activePage = useMemo(() => {
    if (!project) return null;
    const pages = project.pages?.length
      ? project.pages
      : [{ path: "/", name: "Home", html: project.html || "", css: project.css || "", js: project.js || "" }];
    return pages.find((p) => p.path === activePath) || pages[0];
  }, [project, activePath]);

  const loadProject = async () => {
    try {
      const p = await getProject(projectId);
      setProject(p);
      return p;
    } catch {
      toast.error("Project not found");
      navigate("/dashboard");
      return null;
    }
  };

  const loadMessages = async () => {
    try {
      setMessages(await getMessages(projectId));
    } catch {}
  };

  const loadVersions = async () => {
    try {
      setVersions(await getVersions(projectId));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const p = await loadProject();
      await loadMessages();
      await loadVersions();
      if (p && initialPrompt && !(p.html || p.pages?.[0]?.html) && !autoBuiltRef.current) {
        autoBuiltRef.current = true;
        handleGenerate(initialPrompt, "build");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Disable editing when switching tabs / pages
  useEffect(() => {
    if (editing && !activePage?.html) {
      setEditing(false);
      setSelected(null);
    }
  }, [activePage, editing]);

  const pushHistory = (snapshot) => {
    setHistory((h) => [...h.slice(-19), snapshot]);
    setRedoStack([]);
  };

  const setNestedValue = (obj, path, value) => {
    const parts = String(path || "").split(".").filter(Boolean);
    if (!parts.length) return obj;

    const clone = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
    let cur = clone;

    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      const nextKey = parts[i + 1];
      const shouldBeArray = /^\d+$/.test(nextKey);

      if (cur[key] === undefined || cur[key] === null) {
        cur[key] = shouldBeArray ? [] : {};
      } else {
        cur[key] = Array.isArray(cur[key]) ? [...cur[key]] : { ...cur[key] };
      }

      cur = cur[key];
    }

    const last = parts[parts.length - 1];
    const finalKey = /^\d+$/.test(last) ? Number(last) : last;
    cur[finalKey] = value;
    return clone;
  };

  const saveProjectStatePatch = async (nextProjectState) => {
    try {
      await updatePage(projectId, activePath, {
        html: activePage?.html || "",
        css: activePage?.css || "",
        js: activePage?.js || "",
        projectState: nextProjectState,
      });
    } catch {
      toast.error("React edit save failed");
    }
  };

  const handleGenerate = async (prompt, forcedMode) => {
    if (!canEdit) {
      toast.error("You need editor access");
      return;
    }
    const useMode = forcedMode || mode;
    if (!prompt?.trim()) {
      toast.error("Enter a prompt first");
      return;
    }
    setGenerating(true);
    const tempUser = {
      message_id: `tmp_${Date.now()}`,
      role: "user",
      content: prompt,
      mode: useMode,
      page_path: activePath,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUser]);

    try {
      if (activePage?.html) {
        pushHistory({ pages: project.pages });
      }
      const result = await aiGenerate({
        project_id: projectId,
        prompt,
        mode: useMode,
        page_path: activePath,
        current_html: activePage?.html || "",
        current_css: activePage?.css || "",
        current_js: activePage?.js || "",
      });
      const p = await loadProject();
      await loadMessages();
      await loadVersions();
      if (useMode !== "plan" && p) {
        toast.success(`${useMode === "build" ? "Built" : "Updated"} • ${result.summary?.slice(0, 60)}`);
      } else {
        toast.success("Plan ready");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail?.toString().slice(0, 140) || "Generation failed");
      setMessages((m) => m.filter((x) => x.message_id !== tempUser.message_id));
    } finally {
      setGenerating(false);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) {
      toast.message("Nothing to undo");
      return;
    }
    const last = history[history.length - 1];
    setRedoStack((r) => [...r, { pages: project.pages }]);
    setHistory((h) => h.slice(0, -1));
    try {
      // restore via page update
      const lastPage = (last.pages || []).find((p) => p.path === activePath);
      if (!lastPage) return;
      const p = await updatePage(projectId, activePath, {
        html: lastPage.html,
        css: lastPage.css,
        js: lastPage.js,
      });
      const proj = await loadProject();
      setProject(proj);
    } catch {
      toast.error("Undo failed");
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) {
      toast.message("Nothing to redo");
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, { pages: project.pages }]);
    try {
      const nextPage = (next.pages || []).find((p) => p.path === activePath);
      if (!nextPage) return;
      await updatePage(projectId, activePath, {
        html: nextPage.html,
        css: nextPage.css,
        js: nextPage.js,
      });
      const proj = await loadProject();
      setProject(proj);
    } catch {
      toast.error("Redo failed");
    }
  };

  const handleExport = () => {
    if (!activePage?.html) {
      toast.error("Nothing to export yet — build the site first.");
      return;
    }
    window.open(exportProjectUrl(projectId), "_blank");
    toast.success("Exporting ZIP…");
  };

  const handleGithubPush = async () => {
    try {
      const res = await pushToGithub({
        project_id: projectId,
        repo_name: project?.name?.toLowerCase().replace(/\s+/g, "-") || "galio-site",
      });
      toast.success(`MOCKED: Pushed to ${res.repo} (${res.commit_sha})`);
    } catch {
      toast.error("GitHub push failed");
    }
  };

  const handleVercelDeploy = async () => {
    try {
      const res = await deployToVercel({ project_id: projectId });
      toast.success(`MOCKED: Live at ${res.url}`);
    } catch {
      toast.error("Vercel deploy failed");
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      await restoreVersion(projectId, versionId);
      const p = await loadProject();
      setProject(p);
      await loadVersions();
      toast.success("Version restored");
      setShowVersions(false);
    } catch {
      toast.error("Restore failed");
    }
  };

  const handleCodeChange = (field, value) => {
    setProject((p) => {
      const pages = (p.pages || []).map((pg) =>
        pg.path === activePath ? { ...pg, [field]: value } : pg
      );
      const top = { ...p, pages };
      if (activePath === "/") top[field] = value;
      return top;
    });
  };

  const handleSaveCode = async () => {
    try {
      await updatePage(projectId, activePath, {
        html: activePage.html,
        css: activePage.css,
        js: activePage.js,
      });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };

  // Page management
  const handleAddPage = async ({ path, name, parentId = null }) => {
    try {
      const newPage = await createPage(projectId, { path, name, parentId, prompt: "" });
      const p = await loadProject();
      setProject(p);
      setActivePath(newPage?.path || path);
      toast.success(parentId ? `Added subpage ${newPage?.path || path}` : `Added ${newPage?.path || path}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Add failed");
    }
  };

  const handleDeletePage = async (path) => {
    try {
      await deletePage(projectId, path);
      const p = await loadProject();
      setProject(p);
      if (activePath === path) setActivePath("/");
      toast.success("Page removed");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Delete failed");
    }
  };

  // Visual editor handlers
  const handleToggleEdit = () => {
    if (!canEdit) return;
    if (!activePage?.html) {
      toast.error("Build the page first");
      return;
    }
    setEditing((e) => !e);
    setRightTab((t) => (!editing ? "inspect" : t));
    setSelected(null);
  };

  const handleInspectorUpdate = (id, patch) => {
    if (activePage?.projectState) {
      let nextProjectState = activePage.projectState;

      if (patch?.delete === true) {
        if (String(id).startsWith("customElements.")) {
          const index = Number(String(id).split(".")[1]);
          const current = Array.isArray(nextProjectState.customElements) ? nextProjectState.customElements : [];
          nextProjectState = {
            ...nextProjectState,
            customElements: current.filter((_, i) => i !== index),
          };
          setSelected(null);
        }
      } else {
        if (Object.prototype.hasOwnProperty.call(patch || {}, "value")) {
          nextProjectState = setNestedValue(nextProjectState, id, patch.value);
        }

        if (typeof patch?.text === "string") {
          const targetPath = String(id).startsWith("customElements.") ? `${id}.text` : id;
          nextProjectState = setNestedValue(nextProjectState, targetPath, patch.text);
        }

        if (typeof patch?.mediaUrl === "string") {
          nextProjectState = setNestedValue(nextProjectState, id, patch.mediaUrl);
        }
      }

      if (patch?.styles && typeof patch.styles === "object") {
        const currentOverrides = nextProjectState.overrides || {};
        const currentElement = currentOverrides[id] || {};
        nextProjectState = {
          ...nextProjectState,
          overrides: {
            ...currentOverrides,
            [id]: {
              ...currentElement,
              styles: {
                ...(currentElement.styles || {}),
                ...patch.styles,
              },
            },
          },
        };
      }

      if (typeof patch?.classes === "string") {
        const currentOverrides = nextProjectState.overrides || {};
        const currentElement = currentOverrides[id] || {};
        nextProjectState = {
          ...nextProjectState,
          overrides: {
            ...currentOverrides,
            [id]: {
              ...currentElement,
              classes: patch.classes,
            },
          },
        };
      }

      setProject((prev) => {
        const pages = (prev.pages || []).map((pg) =>
          pg.path === activePath ? { ...pg, projectState: nextProjectState } : pg
        );

        return {
          ...prev,
          pages,
        };
      });

      saveProjectStatePatch(nextProjectState);
      if (patch?.delete !== true) {
        setSelected((s) =>
          s
            ? {
                ...s,
                text: typeof patch?.text === "string" ? patch.text : s.text,
                mediaUrl: typeof patch?.mediaUrl === "string" ? patch.mediaUrl : s.mediaUrl,
                styles: patch?.styles ? { ...(s.styles || {}), ...patch.styles } : s.styles,
                classes: typeof patch?.classes === "string" ? patch.classes : s.classes,
              }
            : s
        );
      }
      return;
    }

    previewRef.current?.update(id, patch);
  };

  const handleInspectorClose = () => {
    setSelected(null);
  };

  const handleOpenLivePreview = () => {
    const pagePath = encodeURIComponent(activePath || "/");
    window.open(`/preview/${projectId}?path=${pagePath}`, "_blank", "noopener,noreferrer");
  };

  const handleInsertComponent = (cmp) => {
    if (!editing) {
      toast.message("Enable Edit mode to insert components");
      return;
    }
    previewRef.current?.insert(cmp.snippet);
    toast.success(`Inserted: ${cmp.name}`);
  };

  // Persist visual edits: serialize iframe → save html
  const handleSerialize = async (html) => {
    if (!html) return;
    try {
      await updatePage(projectId, activePath, { html });
      const p = await loadProject();
      setProject(p);
      toast.success("Visual edits saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const saveVisualEdits = () => {
    previewRef.current?.serialize();
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 grid place-items-center text-zinc-400 text-sm">
        Loading project…
      </div>
    );
  }

  const pages = project.pages?.length
    ? project.pages
    : [{ path: "/", name: "Home", html: project.html || "", css: project.css || "", js: project.js || "" }];

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <StudioHeader
        project={project}
        role={role}
        onBack={() => navigate("/dashboard")}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        device={device}
        onDeviceChange={setDevice}
        onExport={handleExport}
        onGithubPush={handleGithubPush}
        onVercelDeploy={handleVercelDeploy}
        onOpenVersions={() => setShowVersions(true)}
        onOpenShare={() => setShowShare(true)}
        onOpenDomain={() => setShowDomain(true)}
        editing={editing}
        onToggleEdit={handleToggleEdit}
        onRename={async (name) => {
          try {
            const p = await updateProject(projectId, { name });
            setProject(p);
            toast.success("Renamed");
          } catch {
            toast.error("Rename failed");
          }
        }}
      />

      {/* Visual edit save bar */}
      {editing && (
        <div className="h-9 shrink-0 border-b border-blue-500/30 bg-blue-500/10 backdrop-blur-md flex items-center px-4 justify-between">
          <span className="text-xs text-blue-200">
            Visual edits are live in the preview. Click <strong>Save visual edits</strong> to persist
            them to your code.
          </span>
          <div className="flex gap-2">
            <button
              data-testid="discard-visual-edits-btn"
              onClick={() => {
                setEditing(false);
                setSelected(null);
                // reset iframe by reloading the page from saved state
                setProject((p) => ({ ...p }));
              }}
              className="text-xs text-blue-200 hover:text-white px-2"
            >
              Exit
            </button>
            <button
              data-testid="save-visual-edits-btn"
              onClick={saveVisualEdits}
              className="h-7 px-3 rounded bg-white text-zinc-950 text-xs font-medium hover:bg-zinc-200 active:scale-95 transition-all"
            >
              Save visual edits
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-[320px_1fr_380px] min-h-0">
        <div className="flex flex-col min-h-0 border-r border-zinc-800/80 bg-zinc-950">
          <PagesSidebar
            pages={pages}
            activePath={activePath}
            onSelect={setActivePath}
            onAdd={handleAddPage}
            onDelete={handleDeletePage}
            canEdit={canEdit}
          />
          <ChatPanel
            modes={MODES}
            mode={mode}
            onModeChange={setMode}
            messages={messages.filter(
              (m) => !m.page_path || m.page_path === activePath
            )}
            onSend={(prompt) => handleGenerate(prompt)}
            generating={generating}
            disabled={!canEdit}
          />
        </div>

        <PreviewCanvas
          ref={previewRef}
          html={activePage?.html}
          css={activePage?.css}
          js={activePage?.js}
          projectState={activePage?.projectState}
          selectedId={selected?.id}
          device={device}
          generating={generating}
          editing={editing}
          onSelectionChange={setSelected}
          onElementUpdate={handleInspectorUpdate}
          onSerialize={handleSerialize}
        />

        <CodePanel
          project={project}
          activePage={activePage}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onChange={handleCodeChange}
          onSave={handleSaveCode}
          editing={editing}
          selected={selected}
          onEnterEdit={handleToggleEdit}
          onInspectorUpdate={handleInspectorUpdate}
          onInspectorClose={handleInspectorClose}
          onInsertComponent={handleInsertComponent}
          rightTab={rightTab}
          onRightTabChange={setRightTab}
          onLivePreview={handleOpenLivePreview}
        />
      </div>

      <VersionsDialog
        open={showVersions}
        onOpenChange={setShowVersions}
        versions={versions}
        onRestore={handleRestoreVersion}
      />
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        projectId={projectId}
        currentRole={role}
      />
      <DomainDialog
        open={showDomain}
        onOpenChange={setShowDomain}
        projectId={projectId}
        currentDomain={project.custom_domain}
        onUpdate={(d) => setProject((p) => ({ ...p, custom_domain: d }))}
      />
    </div>
  );
}
