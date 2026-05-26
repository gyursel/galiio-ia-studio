import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { History, RotateCcw } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function VersionsDialog({ open, onOpenChange, versions, onRestore }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg tracking-tight inline-flex items-center gap-2">
            <History className="w-4 h-4" /> Version history
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Every generation is automatically snapshotted. Restore any point in time.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-sm text-zinc-500">
              No versions yet — they appear after each AI generation.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {versions.map((v) => (
                <li
                  key={v.version_id}
                  className="flex items-center gap-3 py-3"
                  data-testid={`version-${v.version_id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{v.note || "Snapshot"}</div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      {timeAgo(v.created_at)} • {v.version_id}
                    </div>
                  </div>
                  <button
                    data-testid={`restore-${v.version_id}`}
                    onClick={() => onRestore(v.version_id)}
                    className="h-8 px-3 rounded-md border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-xs text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
