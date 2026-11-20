"use client";

import { useMemo } from "react";
import { SCENES } from "@/lib/presets";
import { Scene, ShapeId, SHAPE_LABEL, SHAPE_ORDER } from "@/lib/types";
import { Icon, Section, ShapeIcon } from "./ui";

function gradientFor(scene: Scene): string {
  const lights = scene.lights
    .filter((l) => l.enabled)
    .map((l) => {
      const spread = Math.max(14, Math.min(64, l.size * 150));
      return `radial-gradient(circle at ${(l.x * 100).toFixed(1)}% ${(l.y * 100).toFixed(1)}%, ${
        l.color
      } 0%, ${l.color}dd ${spread * 0.45}%, ${l.color}00 ${spread}%)`;
    })
    .reverse();

  const bg = scene.bg.gradient
    ? `linear-gradient(${scene.bg.angle}deg, ${scene.bg.color}, ${scene.bg.color2})`
    : scene.bg.color;

  return [...lights, bg].join(", ");
}

export function SceneThumb({ scene }: { scene: Scene }) {
  return <span className="thumb" style={{ backgroundImage: gradientFor(scene) }} aria-hidden />;
}

interface LibraryProps {
  onAdd: (shape: ShapeId) => void;
  onApplyScene: (scene: Scene) => void;
  activeSceneId: string | null;
}

export function Library({ onAdd, onApplyScene, activeSceneId }: LibraryProps) {
  const thumbs = useMemo(() => SCENES.map((s) => ({ preset: s, scene: s.build() })), []);

  return (
    <div className="side side-left">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        <span className="brand-text">
          Lumenwall
          <em>ultrawide light panel</em>
        </span>
      </div>

      <Section title="Add a light">
        <div className="shape-grid">
          {SHAPE_ORDER.map((shape) => (
            <button key={shape} type="button" className="shape-btn" onClick={() => onAdd(shape)}>
              <ShapeIcon shape={shape} />
              <span>{SHAPE_LABEL[shape]}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Scenes">
        <div className="scene-list">
          {thumbs.map(({ preset, scene }) => (
            <button
              key={preset.id}
              type="button"
              className={`scene-btn${activeSceneId === preset.id ? " is-active" : ""}`}
              onClick={() => onApplyScene(scene)}
            >
              <SceneThumb scene={scene} />
              <span className="scene-text">
                <span className="scene-name">{preset.name}</span>
                <span className="scene-hint">{preset.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      <div className="side-foot">
        <Icon name="wand" size={14} />
        <span>Double-click the panel to drop a light</span>
      </div>
    </div>
  );
}
