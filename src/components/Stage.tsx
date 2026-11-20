"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LightRenderer } from "@/lib/renderer";
import { clamp, Light, Scene } from "@/lib/types";

interface StageProps {
  scene: Scene;
  selectedId: string | null;
  uiHidden: boolean;
  onSelect: (id: string | null) => void;
  onGestureStart: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, size: number) => void;
  onRotate: (id: string, rotation: number) => void;
  onAddAt: (x: number, y: number) => void;
  onDuplicate: (id: string) => void;
}

type DragMode = "move" | "size" | "rotate";

interface DragState {
  mode: DragMode;
  id: string;
  offsetX: number;
  offsetY: number;
  startSize: number;
  startRotation: number;
  startAngle: number;
  moved: boolean;
}

function hitTest(lights: Light[], px: number, py: number, w: number, h: number): Light | null {
  for (let i = lights.length - 1; i >= 0; i--) {
    const light = lights[i];
    if (!light.enabled) continue;
    const dx = (px - light.x * w) / h;
    const dy = (py - light.y * h) / h;
    const s = Math.max(light.size, 0.02);
    const a = (-light.rotation * Math.PI) / 180;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    const dist = Math.hypot(dx, dy);

    let hit = false;
    switch (light.shape) {
      case "ring":
        hit = Math.abs(dist - s * 0.78) < Math.max(s * 0.55, 0.035);
        break;
      case "bar":
        hit = Math.abs(lx) < s * 2.4 + 0.02 && Math.abs(ly) < s * 0.55 + 0.02;
        break;
      case "square":
        hit = Math.abs(lx) < s * 1.05 && Math.abs(ly) < s * 1.05;
        break;
      default:
        hit = dist < s * 1.15 + 0.01;
    }
    if (hit) return light;
  }
  return null;
}

export function Stage({
  scene,
  selectedId,
  uiHidden,
  onSelect,
  onGestureStart,
  onMove,
  onResize,
  onRotate,
  onAddAt,
  onDuplicate,
}: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<LightRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragMode | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const selected = scene.lights.find((l) => l.id === selectedId) ?? null;

  // --- WebGL bootstrap ---------------------------------------------------
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rendererRef.current = new LightRenderer(canvas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "WebGL2 unavailable");
      return;
    }
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // --- size tracking -----------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const apply = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      rendererRef.current?.resize(w, h);
      rendererRef.current?.render(sceneRef.current);
      setSize({ w: rect.width, h: rect.height });
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(wrap);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  // --- draw on every scene change ---------------------------------------
  useEffect(() => {
    if (size.w === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current?.resize(canvas.width, canvas.height);
    rendererRef.current?.render(scene);
  }, [scene, size]);

  // --- pointer interaction ----------------------------------------------
  const localPoint = useCallback((clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / Math.max(rect.width, 1),
      y: (clientY - rect.top) / Math.max(rect.height, 1),
      px: clientX - rect.left,
      py: clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (uiHidden || e.button !== 0) return;
    const p = localPoint(e.clientX, e.clientY);
    const hit = hitTest(sceneRef.current.lights, p.px, p.py, p.w, p.h);

    if (!hit) {
      onSelect(null);
      return;
    }

    onSelect(hit.id);

    if (e.altKey) {
      onDuplicate(hit.id);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode: "move",
      id: hit.id,
      offsetX: p.x - hit.x,
      offsetY: p.y - hit.y,
      startSize: hit.size,
      startRotation: hit.rotation,
      startAngle: 0,
      moved: false,
    };
    setDrag("move");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (uiHidden) return;
    const p = localPoint(e.clientX, e.clientY);
    const state = dragRef.current;

    if (!state) {
      const hover = hitTest(sceneRef.current.lights, p.px, p.py, p.w, p.h);
      setHoverId(hover ? hover.id : null);
      return;
    }

    if (state.mode === "move") {
      if (!state.moved) {
        onGestureStart();
        state.moved = true;
      }
      let x = p.x - state.offsetX;
      let y = p.y - state.offsetY;
      if (e.shiftKey) {
        const light = sceneRef.current.lights.find((l) => l.id === state.id);
        if (light) {
          if (Math.abs(x - light.x) > Math.abs(y - light.y)) y = light.y;
          else x = light.x;
        }
      }
      onMove(state.id, clamp(x, -0.2, 1.2), clamp(y, -0.2, 1.2));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      dragRef.current = null;
      setDrag(null);
    }
  };

  // Wheel over a light resizes it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (uiHidden) return;
      const p = localPoint(e.clientX, e.clientY);
      const hit = hitTest(sceneRef.current.lights, p.px, p.py, p.w, p.h);
      if (!hit) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.94 : 1.06;
      onResize(hit.id, clamp(hit.size * factor, 0.012, 1.2));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [localPoint, onResize, uiHidden]);

  const handleDoubleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (uiHidden) return;
    const p = localPoint(e.clientX, e.clientY);
    const hit = hitTest(sceneRef.current.lights, p.px, p.py, p.w, p.h);
    if (!hit) onAddAt(clamp(p.x, 0.02, 0.98), clamp(p.y, 0.02, 0.98));
  };

  // --- inspector handles -------------------------------------------------
  const startHandle = (e: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const p = localPoint(e.clientX, e.clientY);
    dragRef.current = {
      mode,
      id: selected.id,
      offsetX: 0,
      offsetY: 0,
      startSize: selected.size,
      startRotation: selected.rotation,
      startAngle:
        (Math.atan2(p.py - selected.y * p.h, p.px - selected.x * p.w) * 180) / Math.PI,
      moved: false,
    };
    setDrag(mode);
  };

  const moveHandle = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || !selected || state.id !== selected.id) return;
    if (!state.moved) {
      onGestureStart();
      state.moved = true;
    }
    const p = localPoint(e.clientX, e.clientY);
    if (state.mode === "size") {
      const dx = (p.px - selected.x * p.w) / p.h;
      const dy = (p.py - selected.y * p.h) / p.h;
      onResize(selected.id, clamp(Math.hypot(dx, dy), 0.012, 1.2));
    } else if (state.mode === "rotate") {
      const angle =
        (Math.atan2(p.py - selected.y * p.h, p.px - selected.x * p.w) * 180) / Math.PI;
      let next = state.startRotation + (angle - state.startAngle);
      if (e.shiftKey) next = Math.round(next / 15) * 15;
      onRotate(selected.id, Math.round(next));
    }
  };

  const endHandle = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    setDrag(null);
  };

  // --- selection frame ---------------------------------------------------
  const frame = (() => {
    if (!selected || size.h === 0) return null;
    const r = selected.size * size.h;
    const wide = selected.shape === "bar";
    const w = wide ? r * 4.8 : r * 2;
    const h = wide ? r * 1.1 : r * 2;
    const square = selected.shape === "square";
    return {
      left: selected.x * size.w,
      top: selected.y * size.h,
      w,
      h,
      rotation: square || wide || selected.shape === "triangle" ? selected.rotation : 0,
      round: selected.shape === "circle" || selected.shape === "ring",
    };
  })();

  return (
    <div className="stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={`stage-canvas${uiHidden ? " is-hidden-ui" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      />

      {error && (
        <div className="stage-error">
          <strong>WebGL2 required</strong>
          <span>{error}</span>
          <span>Try Chrome, Edge, Firefox or Safari 15+ with hardware acceleration on.</span>
        </div>
      )}

      {!uiHidden && (
        <div className={`stage-overlay${drag ? " is-dragging" : ""}`}>
          {scene.lights.map((light) => (
            <span
              key={light.id}
              className={`light-dot${light.enabled ? "" : " is-off"}${
                hoverId === light.id ? " is-hover" : ""
              }`}
              style={{
                left: `${light.x * 100}%`,
                top: `${light.y * 100}%`,
                background: light.color,
              }}
            />
          ))}

          {frame && (
            <div
              className={`sel-frame${frame.round ? " is-round" : ""}`}
              style={{
                left: frame.left,
                top: frame.top,
                width: frame.w,
                height: frame.h,
                transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)`,
              }}
            >
              <div
                className="handle handle-rotate"
                onPointerDown={(e) => startHandle(e, "rotate")}
                onPointerMove={moveHandle}
                onPointerUp={endHandle}
                onPointerCancel={endHandle}
                title="Rotate"
              />
              <div
                className="handle handle-size"
                onPointerDown={(e) => startHandle(e, "size")}
                onPointerMove={moveHandle}
                onPointerUp={endHandle}
                onPointerCancel={endHandle}
                title="Size"
              />
            </div>
          )}

          {scene.lights.length === 0 && (
            <div className="stage-hint">
              Double-click anywhere to place a light
            </div>
          )}
        </div>
      )}
    </div>
  );
}
