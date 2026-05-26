import React, { useEffect, useState } from "react";
import { listComponents } from "@/lib/api";
import { Boxes, Plus } from "lucide-react";

export default function ComponentsPalette({ onInsert }) {
  const [groups, setGroups] = useState({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listComponents()
      .then((items) => {
        const g = {};
        items.forEach((c) => {
          if (!g[c.category]) g[c.category] = [];
          g[c.category].push(c);
        });
        setGroups(g);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border-t border-zinc-800/60">
      <button
        data-testid="toggle-components-btn"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
      >
        <span className="inline-flex items-center gap-1.5">
          <Boxes className="w-3 h-3" /> Components
        </span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto space-y-3">
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] text-zinc-500 px-1 mb-1">{cat}</div>
              <div className="space-y-1">
                {items.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`insert-${c.id}-btn`}
                    onClick={() => onInsert(c)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white text-left transition-colors"
                  >
                    <Plus className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
