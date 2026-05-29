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
import { PREMIUM_RENDERERS } from "../components/studio/renderers";

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

      if (initialPrompt && !autoBuiltRef.current && p) {
        autoBuiltRef.current = true;
        setTimeout(() => handleGenerate(initialPrompt, "build", p), 250);
      }
    })();
  // This effect must run only when the project changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (editing && !activePage?.html) {
      setRightTab("inspect");
    }
  }, [activePage, editing]);

  const patchProjectStateValue = (state, path, value) => {
    const clone = JSON.parse(JSON.stringify(state || {}));
    const parts = String(path || "").split(".").filter(Boolean);
    if (!parts.length) return clone;

    let cur = clone;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      if (cur[key] === undefined || cur[key] === null) {
        cur[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      cur = cur[key];
    }

    const last = parts[parts.length - 1];
    const finalKey = /^\d+$/.test(last) ? Number(last) : last;
    cur[finalKey] = value;
    return clone;
  };

  const saveProjectStatePatch = async (nextProjectState, pageSnapshot) => {
    // pageSnapshot is passed explicitly to avoid stale-closure reads of activePage.
    const snap = pageSnapshot || activePage;
    try {
      await updatePage(projectId, activePath, {
        html: snap?.html || "",
        css: snap?.css || "",
        js: snap?.js || "",
        projectState: nextProjectState,
        generatedFiles: snap?.generatedFiles || [],
      });
    } catch {
      toast.error("React edit save failed");
    }
  };

  const handleGenerate = async (prompt, forcedMode, accessProject = null) => {
    const accessRole = accessProject?.role || accessProject?._role || role;
    const canGenerate = accessRole === "owner" || accessRole === "editor";

    if (!canGenerate) {
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
        setHistory((h) => [...h, { pages: project.pages }]);
        setRedoStack([]);
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

      let refreshedProject = null;
      try {
        refreshedProject = await loadProject();
      } catch (reloadError) {
        console.warn("Project reload failed after successful generation", reloadError);
      }

      try {
        await loadMessages();
      } catch (messagesError) {
        console.warn("Messages reload failed after successful generation", messagesError);
      }

      try {
        await loadVersions();
      } catch (versionsError) {
        console.warn("Versions reload failed after successful generation", versionsError);
      }

      if (useMode !== "plan") {
        toast.success(`${useMode === "build" ? "Built" : "Updated"} • ${result.summary?.slice(0, 60) || "Generated"}`);
      } else {
        toast.success("Plan ready");
      }
    } catch (e) {
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Generation failed";

      toast.error(detail.toString().slice(0, 220));
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
        html: lastPage.html || "",
        css: lastPage.css || "",
        js: lastPage.js || "",
        projectState: lastPage.projectState || null,
        generatedFiles: lastPage.generatedFiles || [],
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
        html: nextPage.html || "",
        css: nextPage.css || "",
        js: nextPage.js || "",
        projectState: nextPage.projectState || null,
        generatedFiles: nextPage.generatedFiles || [],
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

  const handleCodeChange = (field, value, fileMeta = null) => {
    setProject((p) => {
      const updateGeneratedFiles = (page) => {
        const files = Array.isArray(page.generatedFiles) ? page.generatedFiles : [];

        const targetPath = fileMeta?.path || "";
        const targetId = fileMeta?.id || "";
        const targetName = fileMeta?.name || fileMeta?.label || "";

        const syncField =
          field === "html" || targetPath.endsWith("index.html")
            ? "html"
            : field === "css" || targetPath.endsWith("styles.css")
              ? "css"
              : field === "js" || targetPath.endsWith("script.js")
                ? "js"
                : null;

        const nextPage = syncField ? { ...page, [syncField]: value } : { ...page };

        if (!files.length) {
          return nextPage;
        }

        const nextFiles = files.map((file) => {
          const filePath = file.path || "";
          const fileId = file.id || "";
          const fileName = file.name || String(filePath).split("/").pop() || "";

          const isSameGeneratedFile =
            (targetPath && filePath === targetPath) ||
            (targetId && fileId === targetId) ||
            (targetName && fileName === targetName);

          const isHtml = syncField === "html" && (fileId === "html" || filePath.endsWith("index.html"));
          const isCss = syncField === "css" && (fileId === "css" || filePath.endsWith("styles.css"));
          const isJs = syncField === "js" && (fileId === "js" || filePath.endsWith("script.js"));

          if (isSameGeneratedFile || isHtml || isCss || isJs) {
            return { ...file, content: value };
          }

          return file;
        });

        return { ...nextPage, generatedFiles: nextFiles };
      };

      const pages = (p.pages || []).map((pg) =>
        pg.path === activePath ? updateGeneratedFiles(pg) : pg
      );

      const activeUpdatedPage = pages.find((pg) => pg.path === activePath);
      const top = { ...p, pages };

      if (activePath === "/" && activeUpdatedPage) {
        top.html = activeUpdatedPage.html || "";
        top.css = activeUpdatedPage.css || "";
        top.js = activeUpdatedPage.js || "";
        top.generatedFiles = activeUpdatedPage.generatedFiles || [];
      }

      return top;
    });
  };

  const handleSaveCode = async () => {
    try {
      const nextProjectState = activePage?.projectState
        ? {
            ...activePage.projectState,
            renderMode: "projectState",
            customCode: {
              enabled: false,
              html: activePage.html || "",
              css: activePage.css || "",
              js: activePage.js || "",
              updatedAt: new Date().toISOString(),
            },
          }
        : activePage?.projectState;

      await updatePage(projectId, activePath, {
        html: activePage.html || "",
        css: activePage.css || "",
        js: activePage.js || "",
        projectState: nextProjectState,
        generatedFiles: activePage.generatedFiles || [],
      });

      const freshProject = await getProject(projectId);
      setProject(freshProject);

      toast.success("Saved and synced to preview");
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

  const setNestedValue = (target, path, value) => {
  const keys = String(path || "")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  if (!keys.length) return target;

  let cursor = target;

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const nextKey = keys[index + 1];
    const shouldBeArray = /^\d+$/.test(nextKey);

    if (isLast) {
      cursor[key] = value;
      return;
    }

    if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== "object") {
      cursor[key] = shouldBeArray ? [] : {};
    }

    cursor = cursor[key];
  });

  return target;
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

      const hasOverridePatch =
        (patch?.styles && typeof patch.styles === "object") ||
        typeof patch?.classes === "string" ||
        typeof patch?.text === "string" ||
        typeof patch?.mediaUrl === "string" ||
        typeof patch?.mediaType === "string";

      if (hasOverridePatch) {
        const currentOverrides = nextProjectState.overrides || {};
        const currentElement = currentOverrides[id] || {};
        const nextElement = { ...currentElement };

        if (patch?.styles && typeof patch.styles === "object") {
          nextElement.styles = {
            ...(currentElement.styles || {}),
            ...patch.styles,
          };
        }

        if (typeof patch?.classes === "string") {
          nextElement.classes = patch.classes;
        }

        if (typeof patch?.text === "string") {
          nextElement.text = patch.text;
        }

        if (typeof patch?.mediaUrl === "string") {
          nextElement.mediaUrl = patch.mediaUrl;
        }

        if (typeof patch?.mediaType === "string") {
          nextElement.mediaType = patch.mediaType;
        }

        nextProjectState = {
          ...nextProjectState,
          overrides: {
            ...currentOverrides,
            [id]: nextElement,
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

      saveProjectStatePatch(nextProjectState, activePage);
      // Forward patch to iframe so ProjectPreview re-renders immediately
      previewRef.current?.update(id, patch);
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

  const handleOpenLivePreview = async () => {
    const pagePath = encodeURIComponent(activePath || "/");
    const latestPage = (project?.pages || []).find((pg) => pg.path === activePath) || activePage;
    const latestProjectState = latestPage?.projectState || activePage?.projectState || project?.projectState || null;

    try {
      if (latestProjectState) {
        localStorage.setItem(
          `galio-preview-state:${projectId}:${activePath || "/"}`,
          JSON.stringify(latestProjectState)
        );

        await updatePage(projectId, activePath, {
          html: latestPage?.html || activePage?.html || "",
          css: latestPage?.css || activePage?.css || "",
          js: latestPage?.js || activePage?.js || "",
          projectState: latestProjectState,
          generatedFiles: latestPage?.generatedFiles || activePage?.generatedFiles || [],
        });
      }
    } catch (error) {
      console.error("Preview state save failed", error);
      toast.error("Preview save failed");
      return;
    }

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

  // Persist visual edits: save both iframe HTML and current projectState/overrides.
  const handleSerialize = async (html) => {
    if (!html) return;

    try {
      await updatePage(projectId, activePath, {
        html,
        css: activePage?.css || "",
        js: activePage?.js || "",
        projectState: activePage?.projectState || project?.projectState || null,
        generatedFiles: activePage?.generatedFiles || [],
      });

      const p = await loadProject();
      setProject(p);
      toast.success("Visual edits saved");
    } catch (error) {
      console.error("Save visual edits failed", error);
      toast.error("Save failed");
    }
  };

  const saveVisualEdits = async () => {
    try {
      if (activePage?.projectState) {
        await updatePage(projectId, activePath, {
          html: activePage.html || "",
          css: activePage.css || "",
          js: activePage.js || "",
          projectState: activePage.projectState,
          generatedFiles: activePage.generatedFiles || [],
        });
      }

      previewRef.current?.serialize();
    } catch (error) {
      console.error("Save visual edits failed", error);
      toast.error("Save failed");
    }
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

  const rendererStyle = activePage?.projectState?.rendererStyle || "auravitae";

  const handleRendererStyleChange = async (nextStyle) => {
    if (!activePage?.projectState) {
      toast.error("No projectState found for this page");
      return;
    }

    const nextProjectState = {
      ...activePage.projectState,
      rendererStyle: nextStyle,
      renderMode: "projectState",
    };

    setProject((prev) => {
      const nextPages = (prev.pages || []).map((pg) =>
        pg.path === activePath ? { ...pg, projectState: nextProjectState } : pg
      );

      return {
        ...prev,
        pages: nextPages,
        projectState: activePath === "/" ? nextProjectState : prev.projectState,
      };
    });

    try {
      await updatePage(projectId, activePath, {
        html: activePage.html || "",
        css: activePage.css || "",
        js: activePage.js || "",
        projectState: nextProjectState,
        generatedFiles: activePage.generatedFiles || [],
      });
      toast.success("Renderer style updated");
    } catch {
      toast.error("Renderer style save failed");
    }
  };

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

      <div className="h-12 shrink-0 border-b border-emerald-500/20 bg-zinc-950 px-4 flex items-center justify-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
          Premium Renderer
        </span>

        <select
          value={rendererStyle}
          onChange={(event) => handleRendererStyleChange(event.target.value)}
          disabled={!canEdit || !activePage?.projectState}
          className="h-8 min-w-[220px] rounded-lg border border-emerald-500/40 bg-zinc-900 px-3 text-xs font-bold text-zinc-100 outline-none hover:border-emerald-300 disabled:opacity-50"
        >
          {PREMIUM_RENDERERS.map((renderer) => (
            <option key={renderer.id} value={renderer.id}>
              {renderer.name}
            </option>
          ))}
        </select>
      </div>

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
          projectId={projectId}
          activePath={activePath}
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
