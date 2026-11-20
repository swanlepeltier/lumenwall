"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inspector } from "@/components/Inspector";
import { Library } from "@/components/Library";
import { Stage } from "@/components/Stage";
import { TopBar } from "@/components/TopBar";
import { SCENES } from "@/lib/presets";
import { clamp, Scene, ShapeId, SHAPE_ORDER } from "@/lib/types";
import { useLumen } from "@/lib/useLumen";

const sceneKey = (scene: Scene) =>
  JSON.stringify({
    master: scene.master.toFixed(3),
    bg: [scene.bg.color, scene.bg.color2, scene.bg.gradient, scene.bg.angle],
    lights: scene.lights.map((l) => [
      l.shape,
      l.x.toFixed(4),
      l.y.toFixed(4),
      l.size.toFixed(4),
      l.color,
      l.intensity.toFixed(3),
      l.softness.toFixed(3),
      l.rotation,
      l.enabled,
    ]),
  });

export default function Page() {
  const api = useLumen();
  const [uiHidden, setUiHidden] = useState(false);
  const [present, setPresent] = useState(false);
  const [peek, setPeek] = useState(false);
  const [sheet, setSheet] = useState<"left" | "right" | null>(null);
  const [lastShape, setLastShape] = useState<ShapeId>("circle");
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presets = useMemo(() => SCENES.map((s) => ({ id: s.id, scene: s.build() })), []);
  const activeSceneId = useMemo(() => {
    const current = sceneKey(api.scene);
    return presets.find((p) => sceneKey(p.scene) === current)?.id ?? null;
  }, [api.scene, presets]);

  const enterPresent = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* The API needs a user gesture; the UI still hides. */
    }
    setPresent(true);
    setUiHidden(true);
    setSheet(null);
  }, []);

  const exitPresent = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    setPresent(false);
    setUiHidden(false);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const active = Boolean(document.fullscreenElement);
      setPresent(active);
      if (!active) setUiHidden(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // In presentation mode, moving the mouse brings the interface back for a moment.
  useEffect(() => {
    if (!uiHidden) {
      setPeek(false);
      return;
    }
    const onMove = () => {
      setPeek(true);
      if (peekTimer.current) clearTimeout(peekTimer.current);
      peekTimer.current = setTimeout(() => setPeek(false), 2600);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (peekTimer.current) clearTimeout(peekTimer.current);
    };
  }, [uiHidden]);

  const addShape = useCallback(
    (shape: ShapeId) => {
      setLastShape(shape);
      api.addLight(shape);
    },
    [api],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (!api.selected) return;
      api.updateLight(
        api.selected.id,
        {
          x: clamp(api.selected.x + dx, 0, 1),
          y: clamp(api.selected.y + dy, 0, 1),
        },
        true,
      );
    },
    [api],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
        return;
      }
      if (mod && (key === "d" || key === "j")) {
        e.preventDefault();
        if (api.selectedId) api.duplicateLight(api.selectedId);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (api.selectedId) {
          e.preventDefault();
          api.removeLight(api.selectedId);
        }
        return;
      }
      if (e.key === "Escape") {
        if (api.selectedId) api.select(null);
        else if (present) exitPresent();
        return;
      }
      if (key === "f") {
        e.preventDefault();
        if (present) exitPresent();
        else void enterPresent();
        return;
      }
      if (key === "h") {
        setUiHidden((v) => !v);
        return;
      }
      if (e.key.startsWith("Arrow") && api.selected) {
        e.preventDefault();
        const step = e.shiftKey ? 0.02 : 0.0025;
        if (e.key === "ArrowLeft") nudge(-step, 0);
        if (e.key === "ArrowRight") nudge(step, 0);
        if (e.key === "ArrowUp") nudge(0, -step);
        if (e.key === "ArrowDown") nudge(0, step);
        return;
      }
      if ((key === "[" || key === "]") && api.selected) {
        e.preventDefault();
        const factor = key === "]" ? 1.08 : 0.925;
        api.updateLight(api.selected.id, { size: clamp(api.selected.size * factor, 0.012, 1.2) }, true);
        return;
      }
      if (/^[1-5]$/.test(key)) {
        e.preventDefault();
        addShape(SHAPE_ORDER[Number(key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, addShape, enterPresent, exitPresent, nudge, present]);

  return (
    <div
      className={`app${uiHidden ? " is-hidden-ui" : ""}${peek ? " is-peek" : ""}${
        present ? " is-present" : ""
      }`}
    >
      <Stage
        scene={api.scene}
        selectedId={api.selectedId}
        uiHidden={uiHidden}
        onSelect={api.select}
        onGestureStart={api.commitHistory}
        onMove={(id, x, y) => api.updateLight(id, { x, y }, true)}
        onResize={(id, size) => api.updateLight(id, { size }, true)}
        onRotate={(id, rotation) => api.updateLight(id, { rotation }, true)}
        onAddAt={(x, y) => api.addLight(lastShape, { x, y })}
        onDuplicate={api.duplicateLight}
      />

      <TopBar
        uiHidden={uiHidden}
        canUndo={api.canUndo}
        canRedo={api.canRedo}
        onUndo={api.undo}
        onRedo={api.redo}
        onReset={api.resetAll}
        onToggleUi={() => setUiHidden((v) => !v)}
        onPresent={enterPresent}
        onOpenSheet={(s) => setSheet((cur) => (cur === s ? null : s))}
      />

      <div className={`side-wrap${sheet === "left" ? " is-open" : ""}`}>
        <Library onAdd={addShape} onApplyScene={api.applyScene} activeSceneId={activeSceneId} />
      </div>
      <div className={`side-wrap is-right${sheet === "right" ? " is-open" : ""}`}>
        <Inspector api={api} />
      </div>

      <div className="hint-bar">
        <span><kbd>F</kbd> present</span>
        <span><kbd>H</kbd> hide UI</span>
        <span><kbd>1</kbd>–<kbd>5</kbd> new light</span>
        <span><kbd>⌫</kbd> delete</span>
      </div>
    </div>
  );
}
