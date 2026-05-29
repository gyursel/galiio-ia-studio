import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getProject } from "@/lib/api";
import PremiumWebsiteRenderer from "@/components/studio/PremiumWebsiteRenderer";

export default function ProjectPreview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const path = searchParams.get("path") || "/";

  // ?edit=1 or ?editing=1 activates visual edit mode.
  // Normal live-preview (no param) is completely unaffected.
  const [editing, setEditing] = useState(
    searchParams.get("edit") === "1" || searchParams.get("editing") === "1"
  );
  const [selectedId, setSelectedId] = useState(null);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Load project ───────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await getProject(projectId);
        if (!alive) return;
        setProject(data);
      } catch {
        toast.error("Preview not found");
        navigate("/dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [projectId, navigate, refreshTick]);

  // ── Refresh preview when Studio saves edits ──────────────────────────────
  useEffect(() => {
    const refreshKey = `galio-preview-refresh:${projectId}:${path || "/"}`;
    let lastSeen = localStorage.getItem(refreshKey) || "";

    const refresh = () => {
      const nextSeen = localStorage.getItem(refreshKey) || "";
      if (nextSeen && nextSeen !== lastSeen) {
        lastSeen = nextSeen;
        setOverrides({});
        setRefreshTick((tick) => tick + 1);
      }
    };

    const onStorage = (event) => {
      if (event.key === refreshKey) refresh();
    };

    const onFocus = () => {
      setRefreshTick((tick) => tick + 1);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(refresh, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [projectId, path]);

  // ── Local overrides state (applied immediately to renderer) ──────────────
  const [overrides, setOverrides] = React.useState({});

  function applyPatch(id, patch) {
    setOverrides((prev) => {
      const current = prev[id] || {};
      const next = { ...current };
      if (patch?.styles)                      next.styles   = { ...(current.styles || {}), ...patch.styles };
      if (typeof patch?.classes === "string") next.classes  = patch.classes;
      if (typeof patch?.text    === "string") next.text     = patch.text;
      if (typeof patch?.mediaUrl=== "string") next.mediaUrl = patch.mediaUrl;
      if (typeof patch?.mediaType==="string") next.mediaType= patch.mediaType;
      return { ...prev, [id]: next };
    });
  }

  // ── postMessage bridge (only when inside Studio iframe) ───────────────────
  useEffect(() => {
    window.parent.postMessage({ type: "galio:ready" }, "*");

    function onMessage(ev) {
      const msg = ev.data || {};
      if (msg.type === "galio:enable")        setEditing(true);
      else if (msg.type === "galio:disable")  { setEditing(false); setSelectedId(null); }
      else if (msg.type === "galio:set-selected-id") setSelectedId(msg.payload?.id ?? null);
      else if (msg.type === "galio:update" && msg.payload) {
        // Studio → iframe: apply patch locally so renderer updates instantly
        applyPatch(msg.payload.id, msg.payload.patch);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // ── Callbacks passed to renderer ──────────────────────────────────────────
  const handleSelect = (selection) => {
    const id = typeof selection === "string" ? selection : selection?.id ?? null;
    setSelectedId(id);
    window.parent.postMessage({ type: "galio:selected", payload: selection }, "*");
  };

  const handleUpdate = (id, patch) => {
    // Apply locally for instant feedback
    applyPatch(id, patch);
    // Also notify Studio so it can persist via handleInspectorUpdate
    window.parent.postMessage({ type: "galio:update", payload: { id, patch } }, "*");
  };

  // ── Derive page & website ─────────────────────────────────────────────────
  const activePage = useMemo(() => {
    if (!project) return null;
    const pages = Array.isArray(project.pages) && project.pages.length
      ? project.pages
      : [{ path: "/", name: "Home", html: project.html || "", css: project.css || "", js: project.js || "", projectState: project.projectState || null }];
    return pages.find((p) => p.path === path) || pages[0] || null;
  }, [project, path]);

  const websiteBase = React.useMemo(() => {
    return activePage?.projectState || project?.projectState || null;
  }, [activePage, project]);

  // Merge live local overrides so renderer reflects edits immediately
  const website = React.useMemo(() => {
    if (!websiteBase) return websiteBase;
    if (!Object.keys(overrides).length) return websiteBase;
    const existing = websiteBase.overrides || {};
    const merged = { ...existing };
    for (const [id, patch] of Object.entries(overrides)) {
      merged[id] = { ...(existing[id] || {}), ...patch };
    }
    return { ...websiteBase, overrides: merged };
  }, [websiteBase, overrides]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-sm text-zinc-500">
        Loading preview…
      </main>
    );
  }

  if (!website) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center text-sm text-zinc-500">
        No preview content yet
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white" data-testid="project-live-preview-page">
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100% !important;
          background: #ffffff !important;
        }
        [id*="emergent"],[class*="emergent"],[href*="emergent"],
        [id*="immersive"],[class*="immersive"],[href*="immersive"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      <PremiumWebsiteRenderer
        website={website}
        editing={editing}
        selectedId={selectedId}
        onSelect={handleSelect}
        onUpdate={handleUpdate}
      />
    </main>
  );
}
