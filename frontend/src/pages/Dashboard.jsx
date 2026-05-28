import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  listProjects,
  createProject,
  deleteProject,
  listTemplates,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  LogOut,
  LayoutGrid,
  Wand2,
  ArrowRight,
} from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    listTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleCreate = async (name, prompt) => {
    if (!name?.trim()) {
      toast.error("Project name is required");
      return;
    }
    setCreating(true);
    try {
      const proj = await createProject({ name: name.trim(), prompt: prompt || "" });
      toast.success("Project created");
      navigate(`/studio/${proj.project_id}`, { state: { initialPrompt: prompt } });
    } catch {
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      setProjects((p) => p.filter((x) => x.project_id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white grid place-items-center">
              <Sparkles className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-sm font-medium tracking-tight">Galio AI Studio</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="user-menu-trigger"
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-900 transition-colors"
              >
                {user?.picture ? (
                  <img src={user.picture} alt={user?.name || "user avatar"} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 grid place-items-center text-xs">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
                <span className="text-sm text-zinc-300 hidden sm:inline">{user?.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
              <DropdownMenuLabel className="text-xs text-zinc-400">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                data-testid="logout-btn"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="text-zinc-200 focus:bg-zinc-800 focus:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Workspace
            </p>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "creator"}.
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Start a new project or continue refining an existing one.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="open-templates-btn"
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200 h-10"
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Templates
            </Button>
            <Dialog open={showNew} onOpenChange={setShowNew}>
              <DialogTrigger asChild>
                <Button
                  data-testid="new-project-btn"
                  className="bg-white text-zinc-950 hover:bg-zinc-200 h-10 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> New project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-lg tracking-tight">
                    Create a new project
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm">
                    Give it a name and an optional brief — Galio will take it from there.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Project name</label>
                    <Input
                      data-testid="new-project-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Lumiere Italian Trattoria"
                      className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">
                      What should we build? (optional)
                    </label>
                    <Textarea
                      data-testid="new-project-prompt"
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="A premium landing page for an Italian restaurant with menu, reservations and a romantic mood."
                      className="bg-zinc-900 border-zinc-800 min-h-[100px] focus-visible:ring-zinc-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowNew(false)}
                    className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="confirm-create-project-btn"
                    disabled={creating}
                    onClick={() => handleCreate(newName, newPrompt)}
                    className="bg-white text-zinc-950 hover:bg-zinc-200"
                  >
                    {creating ? "Creating…" : "Create & open"}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setShowNew(true)} onTemplates={() => setShowTemplates(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="projects-grid">
            {projects.map((p) => (
              <div
                key={p.project_id}
                className="group rounded-xl border border-zinc-900 hover:border-zinc-700 bg-zinc-950 overflow-hidden transition-colors"
                data-testid={`project-card-${p.project_id}`}
              >
                <div
                  className="aspect-[16/10] bg-zinc-900 canvas-grid relative cursor-pointer"
                  onClick={() => navigate(`/studio/${p.project_id}`)}
                >
                  <div className="absolute inset-0 grid place-items-center text-zinc-700">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-4 flex items-start justify-between gap-2">
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => navigate(`/studio/${p.project_id}`)}
                  >
                    <div className="text-sm font-medium tracking-tight truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                      <span>Edited {timeAgo(p.updated_at)}</span>
                      {p.role && p.role !== "owner" && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] uppercase tracking-widest font-mono">
                          {p.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        data-testid={`project-menu-${p.project_id}`}
                        className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem
                        onClick={() => navigate(`/studio/${p.project_id}`)}
                        className="text-zinc-200 focus:bg-zinc-800"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-testid={`delete-project-${p.project_id}`}
                        onClick={() => handleDelete(p.project_id)}
                        className="text-red-400 focus:bg-red-950/30 focus:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg tracking-tight">Start from a template</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Hand-crafted prompts that Galio will expand into full sites.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                data-testid={`template-${t.id}`}
                onClick={() => {
                  setShowTemplates(false);
                  const safeTemplatePrompt = [
                    t.prompt || `Create a premium one-page website for ${t.name} Demo.`,
                    `Use the template id ${t.id}.`,
                    `Use the ${t.name} template only as page structure.`,
                    "Do not use premium-landing unless this card is Premium Landing Page.",
                  ].join(" ");
                  const stamp = new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  handleCreate(`${t.name} — Template ${stamp}`, safeTemplatePrompt);
                }}
                className="group text-left rounded-2xl border border-zinc-800 hover:border-emerald-400/70 overflow-hidden bg-zinc-950 transition-colors"
              >
                <div className="aspect-[16/10] bg-zinc-900 overflow-hidden relative">
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt={t.name || t.id} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900" />
                  )}
                  <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-semibold text-white">
                    {t.id}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-base font-semibold tracking-tight text-white">
                    {t.name || t.id || "Template"}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {t.description || "Universal one-page layout preset."}
                  </div>

                  {Array.isArray(t.sections) && t.sections.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.sections.slice(0, 4).map((section) => (
                        <span key={section} className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300">
                          {section}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-xl bg-white px-3 py-2 text-center text-xs font-bold text-black">
                    Use template
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onCreate, onTemplates }) {
  return (
    <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center bg-zinc-950">
      <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 grid place-items-center mb-6">
        <Wand2 className="w-5 h-5 text-zinc-400" />
      </div>
      <h3 className="text-xl font-medium tracking-tight">No projects yet</h3>
      <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
        Create your first project or pick a template — Galio will build the entire site
        from a single description.
      </p>
      <div className="mt-6 inline-flex gap-2">
        <Button
          onClick={onTemplates}
          variant="outline"
          className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200"
        >
          Browse templates
        </Button>
        <Button onClick={onCreate} className="bg-white text-zinc-950 hover:bg-zinc-200">
          <Plus className="w-4 h-4 mr-1.5" /> New project
        </Button>
      </div>
    </div>
  );
}
