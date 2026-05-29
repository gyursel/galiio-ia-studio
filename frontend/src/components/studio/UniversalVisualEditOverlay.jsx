import React, { useCallback, useEffect, useRef, useState } from "react";

function parseTranslate(transform = "") {
  const match = String(transform || "").match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
  return {
    x: match ? Number(match[1]) : 0,
    y: match ? Number(match[2]) : 0,
  };
}

export default function UniversalVisualEditOverlay({
  rootRef,
  editing,
  selectedId,
  onElementUpdate,
}) {
  const dragRef = useRef(null);
  const [rect, setRect] = useState(null);

  const refresh = useCallback(() => {
    if (!editing || !selectedId || !rootRef?.current) {
      setRect(null);
      return;
    }

    const root = rootRef.current;
    const safeId = CSS.escape(selectedId);
    const element = root.querySelector(`[data-gpr-id="${safeId}"]`);

    if (!element) {
      setRect(null);
      return;
    }

    const rootBox = root.getBoundingClientRect();
    const box = element.getBoundingClientRect();

    setRect({
      left: box.left - rootBox.left + root.scrollLeft,
      top: box.top - rootBox.top + root.scrollTop,
      width: box.width,
      height: box.height,
    });
  }, [editing, selectedId, rootRef]);

  useEffect(() => {
    refresh();

    if (!editing) return undefined;

    const onFrame = () => refresh();
    window.addEventListener("resize", onFrame);
    window.addEventListener("scroll", onFrame, true);

    const timer = window.setInterval(onFrame, 350);

    return () => {
      window.removeEventListener("resize", onFrame);
      window.removeEventListener("scroll", onFrame, true);
      window.clearInterval(timer);
    };
  }, [editing, refresh]);

  function startDrag(mode, event) {
    if (!selectedId || !rect) return;

    event.preventDefault();
    event.stopPropagation();

    const root = rootRef.current;
    const safeId = CSS.escape(selectedId);
    const element = root?.querySelector(`[data-gpr-id="${safeId}"]`);
    const computed = element ? window.getComputedStyle(element) : null;
    const currentTransform = computed?.transform && computed.transform !== "none" ? element.style.transform : "";
    const base = parseTranslate(currentTransform);

    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...rect },
      baseX: base.x,
      baseY: base.y,
    };

    const onMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;

      const next = { ...drag.startRect };

      if (drag.mode === "move") {
        next.left = drag.startRect.left + dx;
        next.top = drag.startRect.top + dy;
      }

      if (drag.mode.includes("e")) next.width = Math.max(24, drag.startRect.width + dx);
      if (drag.mode.includes("s")) next.height = Math.max(24, drag.startRect.height + dy);

      if (drag.mode.includes("w")) {
        next.left = drag.startRect.left + dx;
        next.width = Math.max(24, drag.startRect.width - dx);
      }

      if (drag.mode.includes("n")) {
        next.top = drag.startRect.top + dy;
        next.height = Math.max(24, drag.startRect.height - dy);
      }

      setRect(next);
    };

    const onUp = (upEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      if (!drag || !onElementUpdate) return;

      const dx = upEvent.clientX - drag.startX;
      const dy = upEvent.clientY - drag.startY;

      if (drag.mode === "move") {
        onElementUpdate(selectedId, {
          styles: {
            position: "relative",
            zIndex: "20",
            transform: `translate(${Math.round(drag.baseX + dx)}px, ${Math.round(drag.baseY + dy)}px)`,
          },
        });
        window.setTimeout(refresh, 60);
        return;
      }

      const width = Math.round(
        Math.max(
          24,
          drag.startRect.width +
            (drag.mode.includes("e") ? dx : 0) -
            (drag.mode.includes("w") ? dx : 0)
        )
      );

      const height = Math.round(
        Math.max(
          24,
          drag.startRect.height +
            (drag.mode.includes("s") ? dy : 0) -
            (drag.mode.includes("n") ? dy : 0)
        )
      );

      onElementUpdate(selectedId, {
        styles: {
          width: `${width}px`,
          height: `${height}px`,
          minHeight: `${height}px`,
        },
      });

      window.setTimeout(refresh, 60);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (!editing || !selectedId || !rect) return null;

  const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <div className="gve-layer">
      <div
        className="gve-box"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }}
        onMouseDown={(event) => startDrag("move", event)}
      >
        <div className="gve-label">Move / Resize · {selectedId}</div>

        {handles.map((handle) => (
          <button
            key={handle}
            type="button"
            className={`gve-handle gve-handle-${handle}`}
            onMouseDown={(event) => startDrag(handle, event)}
            aria-label={`Resize ${handle}`}
          />
        ))}
      </div>

      <style>{`
        .gve-layer {
          position: absolute;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }

        .gve-box {
          position: absolute;
          border: 2px solid #10b981;
          box-shadow: 0 0 0 9999px rgba(0,0,0,.03), 0 0 30px rgba(16,185,129,.25);
          pointer-events: auto;
          cursor: move;
          border-radius: 10px;
        }

        .gve-label {
          position: absolute;
          left: 0;
          top: -30px;
          max-width: 420px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          border-radius: 999px;
          background: #10b981;
          color: #03110b;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 12px 30px rgba(16,185,129,.25);
        }

        .gve-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 2px solid #020617;
          background: #10b981;
          box-shadow: 0 8px 20px rgba(0,0,0,.25);
        }

        .gve-handle-nw { left: -7px; top: -7px; cursor: nwse-resize; }
        .gve-handle-n { left: 50%; top: -7px; transform: translateX(-50%); cursor: ns-resize; }
        .gve-handle-ne { right: -7px; top: -7px; cursor: nesw-resize; }
        .gve-handle-e { right: -7px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .gve-handle-se { right: -7px; bottom: -7px; cursor: nwse-resize; }
        .gve-handle-s { left: 50%; bottom: -7px; transform: translateX(-50%); cursor: ns-resize; }
        .gve-handle-sw { left: -7px; bottom: -7px; cursor: nesw-resize; }
        .gve-handle-w { left: -7px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
      `}</style>
    </div>
  );
}
