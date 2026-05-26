import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Home,
  Plus,
  Trash2,
} from "lucide-react";

function pageKey(page) {
  return page?.id || (page?.path === "/" ? "home" : page?.path);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9а-яА-Я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function joinPath(parentPath, childPathOrSlug) {
  const raw = String(childPathOrSlug || "").trim();

  if (raw.startsWith("/")) {
    return raw.replace(/\/+/g, "/") || "/";
  }

  const child = slugify(raw);
  const parent = parentPath === "/" ? "" : String(parentPath || "").replace(/\/+$/g, "");

  return `${parent}/${child}`.replace(/\/+/g, "/") || "/";
}

function buildTree(pages) {
  const normalized = (pages || []).map((page, index) => ({
    ...page,
    id: pageKey(page),
    parentId: page.parentId || null,
    order: Number.isFinite(page.order) ? page.order : index,
  }));

  const byParent = new Map();

  for (const page of normalized) {
    const parent = page.parentId || null;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(page);
  }

  for (const children of byParent.values()) {
    children.sort((a, b) => {
      if ((a.path === "/") !== (b.path === "/")) return a.path === "/" ? -1 : 1;
      return (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name));
    });
  }

  const toNode = (page, depth = 0) => ({
    ...page,
    depth,
    children: (byParent.get(page.id) || []).map((child) => toNode(child, depth + 1)),
  });

  const roots = (byParent.get(null) || []).map((page) => toNode(page, 0));
  const attachedIds = new Set();

  function mark(node) {
    attachedIds.add(node.id);
    node.children.forEach(mark);
  }

  roots.forEach(mark);

  const orphans = normalized
    .filter((page) => !attachedIds.has(page.id))
    .map((page) => toNode({ ...page, parentId: null }, 0));

  return [...roots, ...orphans];
}

export default function PagesSidebar({
  pages,
  activePath,
  onSelect,
  onAdd,
  onDelete,
  canEdit,
}) {
  const [adding, setAdding] = useState(false);
  const [parentPage, setParentPage] = useState(null);
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const tree = useMemo(() => buildTree(pages), [pages]);
  const flatPages = useMemo(() => {
    const out = [];
    const walk = (nodes) => {
      nodes.forEach((node) => {
        out.push(node);
        walk(node.children || []);
      });
    };
    walk(tree);
    return out;
  }, [tree]);

  const parentBasePath = parentPage?.path || "/";
  const typedName = name.trim();
  const typedPath = path.trim();
  const computedName = typedName || typedPath.replace(/^\/+/, "") || "Page";
  const computedPath = typedPath
    ? joinPath(parentBasePath, typedPath)
    : joinPath(parentBasePath, computedName);

  const openAddDialog = (parent = null) => {
    setParentPage(parent);
    setName("");
    setPath("");
    setAdding(true);
  };

  const submit = async () => {
    const finalName = computedName;
    const finalPath = computedPath;

    if (!finalPath || finalPath === "/") return;

    setBusy(true);
    try {
      await onAdd({
        path: finalPath,
        name: finalName,
        parentId: parentPage ? pageKey(parentPage) : null,
      });
      setAdding(false);
      setParentPage(null);
      setPath("");
      setName("");
    } finally {
      setBusy(false);
    }
  };

  const hasChildren = (page) => flatPages.some((p) => p.parentId === pageKey(page));

  const renderNode = (page) => {
    const active = page.path === activePath;
    const isHome = page.path === "/";
    const children = page.children || [];
    const hasKids = children.length > 0;
    const isCollapsed = collapsed[page.id] === true;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1.5 rounded text-xs cursor-pointer transition-colors ${
            active
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
          style={{ paddingLeft: `${8 + page.depth * 16}px`, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}
          onClick={() => onSelect(page.path)}
          data-testid={`page-${page.path === "/" ? "home" : page.path.replace(/\//g, "")}-btn`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasKids) {
                setCollapsed((c) => ({ ...c, [page.id]: !isCollapsed }));
              }
            }}
            className={`grid h-4 w-4 place-items-center rounded ${
              hasKids ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-zinc-700"
            }`}
          >
            {hasKids ? (
              isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <span className="h-3 w-3" />
            )}
          </button>

          {isHome ? (
            <Home className="h-3.5 w-3.5 shrink-0" />
          ) : hasKids ? (
            <Folder className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0" />
          )}

          <span className="min-w-0 flex-1 truncate">{page.name}</span>
          <span className="hidden max-w-[90px] truncate font-mono text-[10px] text-zinc-500 group-hover:block">
            {page.path}
          </span>

          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAddDialog(page);
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-300"
              title="Add subpage"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}

          {canEdit && !isHome && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (hasChildren(page)) {
                  window.alert("This page has subpages. Delete or move the subpages first.");
                  return;
                }

                if (window.confirm(`Delete ${page.name}?`)) onDelete(page.path);
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
              data-testid={`delete-page-${page.path.replace(/\//g, "")}-btn`}
              title="Delete page"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {hasKids && !isCollapsed ? (
          <div className="mt-0.5 space-y-0.5">{children.map(renderNode)}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="border-b border-zinc-800/60 px-3 py-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Pages
        </span>

        {canEdit && (
          <button
            data-testid="add-page-btn"
            onClick={() => openAddDialog(null)}
            className="text-zinc-500 hover:text-white"
            title="Add root page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {tree.map(renderNode)}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>{parentPage ? "Add subpage" : "Add page"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {parentPage
                ? `Create a subpage under ${parentPage.name}.`
                : "Create a top-level page."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {parentPage ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Parent</div>
                <div className="mt-1 text-xs text-zinc-200">{parentPage.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{parentPage.path}</div>
              </div>
            ) : null}

            <div>
              <label className="text-xs text-zinc-400">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={parentPage ? "iPhone" : "Products"}
                className="mt-1 border-zinc-800 bg-zinc-900"
                data-testid="new-page-name"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Path or slug</label>
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder={parentPage ? "iphone" : "/products"}
                className="mt-1 border-zinc-800 bg-zinc-900"
                data-testid="new-page-path"
              />
              <div className="mt-1 font-mono text-[11px] text-zinc-500">
                Will create: {computedPath}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdding(false)}
              className="border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              disabled={busy || (!path.trim() && !name.trim())}
              onClick={submit}
              className="bg-white text-zinc-950 hover:bg-zinc-200"
              data-testid="confirm-add-page-btn"
            >
              {busy ? "Adding…" : parentPage ? "Add subpage" : "Add page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
