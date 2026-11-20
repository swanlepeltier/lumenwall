"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { makeLight, sanitizeScene, sceneFromPreset, SHAPE_DEFAULTS } from "./presets";
import { clamp, Light, Scene, ShapeId } from "./types";

const STORAGE_KEY = "lumenwall.scene.v1";
const HISTORY_LIMIT = 60;

function clone(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene;
}

export interface LumenApi {
  scene: Scene;
  selectedId: string | null;
  selected: Light | null;
  hydrated: boolean;
  canUndo: boolean;
  canRedo: boolean;
  select: (id: string | null) => void;
  addLight: (shape: ShapeId, at?: { x: number; y: number }) => void;
  updateLight: (id: string, patch: Partial<Light>, transient?: boolean) => void;
  removeLight: (id: string) => void;
  duplicateLight: (id: string) => void;
  reorderLight: (id: string, direction: 1 | -1) => void;
  setBackground: (patch: Partial<Scene["bg"]>, transient?: boolean) => void;
  setMaster: (value: number, transient?: boolean) => void;
  applyScene: (scene: Scene) => void;
  clearLights: () => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
}

export function useLumen(): LumenApi {
  const [scene, setScene] = useState<Scene>(() => sceneFromPreset("soft-key")!);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const past = useRef<Scene[]>([]);
  const future = useRef<Scene[]>([]);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the last session once we are on the client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = sanitizeScene(JSON.parse(raw));
        if (restored) setScene(restored);
      }
    } catch {
      /* corrupted storage — start fresh */
    }
    setHydrated(true);
  }, []);

  // Autosave, debounced: sliders fire a lot of value changes.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
      } catch {
        /* quota or private mode */
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [scene, hydrated]);

  const snapshot = useCallback(() => {
    past.current = [...past.current, clone(scene)].slice(-HISTORY_LIMIT);
    future.current = [];
    bump();
  }, [scene]);

  const mutate = useCallback(
    (recipe: (draft: Scene) => void, transient = false) => {
      if (!transient) snapshot();
      setScene((prev) => {
        const draft = clone(prev);
        recipe(draft);
        return draft;
      });
    },
    [snapshot],
  );

  const addLight = useCallback(
    (shape: ShapeId, at?: { x: number; y: number }) => {
      const defaults = SHAPE_DEFAULTS[shape];
      const light: Light = makeLight({
        ...defaults,
        x: at ? clamp(at.x, 0.02, 0.98) : 0.5,
        y: at ? clamp(at.y, 0.02, 0.98) : 0.5,
        color: "#ffffff",
      });
      snapshot();
      setScene((prev) => ({ ...prev, lights: [...prev.lights, light].slice(0, 24) }));
      setSelectedId(light.id);
    },
    [snapshot],
  );

  const updateLight = useCallback(
    (id: string, patch: Partial<Light>, transient = false) => {
      mutate((draft) => {
        const target = draft.lights.find((l) => l.id === id);
        if (target) Object.assign(target, patch);
      }, transient);
    },
    [mutate],
  );

  const removeLight = useCallback(
    (id: string) => {
      snapshot();
      setScene((prev) => ({ ...prev, lights: prev.lights.filter((l) => l.id !== id) }));
      setSelectedId((current) => (current === id ? null : current));
    },
    [snapshot],
  );

  const duplicateLight = useCallback(
    (id: string) => {
      const source = scene.lights.find((l) => l.id === id);
      if (!source) return;
      const copy = makeLight({
        ...source,
        x: clamp(source.x + 0.03, 0, 1),
        y: clamp(source.y + 0.03, 0, 1),
      });
      snapshot();
      setScene((prev) => ({ ...prev, lights: [...prev.lights, copy].slice(0, 24) }));
      setSelectedId(copy.id);
    },
    [scene.lights, snapshot],
  );

  const reorderLight = useCallback(
    (id: string, direction: 1 | -1) => {
      snapshot();
      setScene((prev) => {
        const index = prev.lights.findIndex((l) => l.id === id);
        const next = index + direction;
        if (index < 0 || next < 0 || next >= prev.lights.length) return prev;
        const lights = [...prev.lights];
        [lights[index], lights[next]] = [lights[next], lights[index]];
        return { ...prev, lights };
      });
    },
    [snapshot],
  );

  const setBackground = useCallback(
    (patch: Partial<Scene["bg"]>, transient = false) => {
      mutate((draft) => {
        draft.bg = { ...draft.bg, ...patch };
      }, transient);
    },
    [mutate],
  );

  const setMaster = useCallback(
    (value: number, transient = false) => {
      mutate((draft) => {
        draft.master = clamp(value, 0.05, 1.5);
      }, transient);
    },
    [mutate],
  );

  const applyScene = useCallback(
    (next: Scene) => {
      snapshot();
      setScene(clone(next));
      setSelectedId(null);
    },
    [snapshot],
  );

  const clearLights = useCallback(() => {
    snapshot();
    setScene((prev) => ({ ...prev, lights: [] }));
    setSelectedId(null);
  }, [snapshot]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    setScene((current) => {
      future.current = [...future.current, clone(current)].slice(-HISTORY_LIMIT);
      return previous;
    });
    bump();
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setScene((current) => {
      past.current = [...past.current, clone(current)].slice(-HISTORY_LIMIT);
      return next;
    });
    bump();
  }, []);

  const resetAll = useCallback(() => {
    snapshot();
    setScene(sceneFromPreset("soft-key")!);
    setSelectedId(null);
  }, [snapshot]);

  const selected = useMemo(
    () => scene.lights.find((l) => l.id === selectedId) ?? null,
    [scene.lights, selectedId],
  );

  return {
    scene,
    selectedId,
    selected,
    hydrated,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    select: setSelectedId,
    addLight,
    updateLight,
    removeLight,
    duplicateLight,
    reorderLight,
    setBackground,
    setMaster,
    applyScene,
    clearLights,
    commitHistory: snapshot,
    undo,
    redo,
    resetAll,
  };
}
