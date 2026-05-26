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

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

    return () => {
      alive = false;
    };
  }, [projectId, navigate]);

  const activePage = useMemo(() => {
    if (!project) return null;

    const pages = Array.isArray(project.pages) && project.pages.length
      ? project.pages
      : [
          {
            path: "/",
            name: "Home",
            html: project.html || "",
            css: project.css || "",
            js: project.js || "",
            projectState: project.projectState || null,
          },
        ];

    return pages.find((p) => p.path === path) || pages[0] || null;
  }, [project, path]);

  const website = activePage?.projectState || project?.projectState || null;

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
        html,
        body,
        #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100% !important;
          background: #ffffff !important;
        }

        [id*="emergent"],
        [class*="emergent"],
        [href*="emergent"],
        [id*="immersive"],
        [class*="immersive"],
        [href*="immersive"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      <PremiumWebsiteRenderer
        website={website}
        editing={false}
        selectedId={null}
        onSelect={() => {}}
        onUpdate={() => {}}
      />
    </main>
  );
}
