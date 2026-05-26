import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Github,
  Triangle,
  History,
  Sparkles,
  Pencil,
  Check,
  X,
  ChevronDown,
  Users,
  Globe,
  MousePointer2,
} from "lucide-react";

const DEVICES = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

export default function StudioHeader({
  project,
  onBack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  device,
  onDeviceChange,
  onExport,
  onGithubPush,
  onVercelDeploy,
  onOpenVersions,
  onOpenShare,
  onOpenDomain,
  onRename,
  editing,
  onToggleEdit,
  role,
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const canEdit = role === "owner" || role === "editor";
  const isOwner = role === "owner";

  const saveName = () => {
    if (name.trim() && name !== project.name) onRename(name.trim());
    setEditingName(false);
  };

  return (
    <header className="h-14 shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl flex items-center px-3 gap-2.5">
      <button
        data-testid="back-to-dashboard-btn"
        onClick={onBack}
        className="h-8 px-2 rounded-md hover:bg-zinc-900 text-zinc-300 hover:text-white inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
        <div className="w-6 h-6 rounded bg-white grid place-items-center">
          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
        </div>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">galio</span>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {editingName && canEdit ? (
          <div className="flex items-center gap-1.5">
            <Input
              data-testid="rename-input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setName(project.name);
                  setEditingName(false);
                }
              }}
              className="h-8 w-64 bg-zinc-900 border-zinc-800"
            />
            <button onClick={saveName} className="text-zinc-400 hover:text-white">
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setName(project.name);
                setEditingName(false);
              }}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            data-testid="project-title"
            onClick={() => canEdit && setEditingName(true)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium tracking-tight max-w-[260px] truncate hover:text-white"
            title={canEdit ? "Click to rename" : ""}
          >
            <span className="truncate">{project.name}</span>
            {canEdit && (
              <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            )}
          </button>
        )}
        {role && role !== "owner" && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-1.5 py-0.5 border border-zinc-800 rounded">
            {role}
          </span>
        )}
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 border border-zinc-800 rounded-md p-0.5">
        <button
          data-testid="undo-btn"
          onClick={onUndo}
          disabled={!canUndo || !canEdit}
          className="h-7 w-7 grid place-items-center rounded text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          data-testid="redo-btn"
          onClick={onRedo}
          disabled={!canRedo || !canEdit}
          className="h-7 w-7 grid place-items-center rounded text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Device toggles */}
      <div className="flex items-center gap-0.5 border border-zinc-800 rounded-md p-0.5">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          const active = d.id === device;
          return (
            <button
              key={d.id}
              data-testid={`device-${d.id}-btn`}
              onClick={() => onDeviceChange(d.id)}
              className={`h-7 w-7 grid place-items-center rounded transition-colors ${
                active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
              title={d.label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* Visual edit toggle */}
      <button
        data-testid="toggle-edit-mode-btn"
        onClick={onToggleEdit}
        disabled={!canEdit}
        className={`h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40 ${
          editing
            ? "bg-blue-500/15 border border-blue-500/40 text-blue-300"
            : "hover:bg-zinc-900 text-zinc-300 border border-transparent"
        }`}
        title="Visual editor"
      >
        <MousePointer2 className="w-3.5 h-3.5" /> {editing ? "Editing" : "Edit"}
      </button>

      <button
        data-testid="versions-btn"
        onClick={onOpenVersions}
        className="h-8 px-2 rounded-md hover:bg-zinc-900 text-zinc-300 hover:text-white inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <History className="w-3.5 h-3.5" /> History
      </button>

      <button
        data-testid="share-btn"
        onClick={onOpenShare}
        className="h-8 px-2 rounded-md hover:bg-zinc-900 text-zinc-300 hover:text-white inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <Users className="w-3.5 h-3.5" /> Share
      </button>

      <Button
        data-testid="export-zip-btn"
        onClick={onExport}
        variant="outline"
        className="h-8 border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-200 px-3 text-xs"
      >
        <Download className="w-3.5 h-3.5 mr-1.5" /> Export
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="deploy-menu-btn"
            className="h-8 bg-white text-zinc-950 hover:bg-zinc-200 px-3 text-xs font-medium active:scale-95 transition-all"
          >
            Publish
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 w-60" align="end">
          <DropdownMenuItem
            data-testid="github-push-btn"
            onClick={onGithubPush}
            className="text-zinc-200 focus:bg-zinc-800 text-sm"
          >
            <Github className="w-4 h-4 mr-2" /> Push to GitHub
            <span className="ml-auto text-[10px] font-mono text-zinc-500">MOCKED</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="vercel-deploy-btn"
            onClick={onVercelDeploy}
            className="text-zinc-200 focus:bg-zinc-800 text-sm"
          >
            <Triangle className="w-4 h-4 mr-2" /> Deploy to Vercel
            <span className="ml-auto text-[10px] font-mono text-zinc-500">MOCKED</span>
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              data-testid="connect-domain-menu-btn"
              onClick={onOpenDomain}
              className="text-zinc-200 focus:bg-zinc-800 text-sm"
            >
              <Globe className="w-4 h-4 mr-2" /> Custom domain
              <span className="ml-auto text-[10px] font-mono text-zinc-500">MOCKED</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            onClick={onExport}
            className="text-zinc-200 focus:bg-zinc-800 text-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Download as ZIP
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
