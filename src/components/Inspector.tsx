"use client";

import { SWATCHES } from "@/lib/presets";
import { kelvinToHex } from "@/lib/color";
import { Light, SHAPE_LABEL, SHAPE_ORDER } from "@/lib/types";
import { LumenApi } from "@/lib/useLumen";
import { ColorField, Icon, Section, ShapeIcon, Slider } from "./ui";

const BG_SWATCHES = [
  { label: "Black", color: "#000000" },
  { label: "Ink", color: "#0a0b0f" },
  { label: "Slate", color: "#15171d" },
  { label: "Plum", color: "#150c1d" },
  { label: "Wine", color: "#1a0a10" },
  { label: "Forest", color: "#08160f" },
  { label: "Paper", color: "#e8e4dc" },
  { label: "3200 K", color: kelvinToHex(3200) },
  { label: "5600 K", color: kelvinToHex(5600) },
];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const deg = (v: number) => `${Math.round(v)}°`;

export function Inspector({ api }: { api: LumenApi }) {
  const { scene, selected, setBackground, setMaster, updateLight } = api;
  const soft = (patch: Partial<Light>) => updateLight(selected!.id, patch, true);

  return (
    <div className="side side-right">
      <div className="inspector-head">
        {selected ? (
          <>
            <span className="inspector-glyph" style={{ color: selected.color }}>
              <ShapeIcon shape={selected.shape} size={22} />
            </span>
            <div className="inspector-title">
              <strong>{SHAPE_LABEL[selected.shape]} light</strong>
              <span className="mono">
                x {Math.round(selected.x * 100)}% · y {Math.round(selected.y * 100)}%
              </span>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => api.select(null)}
              title="Deselect (Esc)"
            >
              <Icon name="chevron" size={16} />
            </button>
          </>
        ) : (
          <>
            <span className="inspector-glyph is-muted">
              <Icon name="wand" size={20} />
            </span>
            <div className="inspector-title">
              <strong>Room</strong>
              <span className="mono">
                {scene.lights.length} light{scene.lights.length === 1 ? "" : "s"}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="panel-scroll">
        {selected ? (
          <>
            <Section title="Colour">
              <ColorField
                value={selected.color}
                swatches={SWATCHES}
                onChange={(hex) => updateLight(selected.id, { color: hex })}
              />
            </Section>

            <Section title="Shape">
              <div className="shape-strip">
                {SHAPE_ORDER.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    className={`shape-mini${selected.shape === shape ? " is-active" : ""}`}
                    onClick={() => updateLight(selected.id, { shape })}
                    title={SHAPE_LABEL[shape]}
                  >
                    <ShapeIcon shape={shape} size={17} />
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Light">
              <Slider
                label="Size"
                value={selected.size}
                min={0.012}
                max={0.9}
                step={0.002}
                format={pct}
                onStart={api.commitHistory}
                onChange={(v) => soft({ size: v })}
              />
              <Slider
                label="Softness"
                value={selected.softness}
                min={0}
                max={1}
                step={0.01}
                format={pct}
                onStart={api.commitHistory}
                onChange={(v) => soft({ softness: v })}
              />
              <Slider
                label="Intensity"
                value={selected.intensity}
                min={0}
                max={1.5}
                step={0.01}
                format={pct}
                onStart={api.commitHistory}
                onChange={(v) => soft({ intensity: v })}
              />
              <Slider
                label="Rotation"
                value={selected.rotation}
                min={-180}
                max={180}
                step={1}
                format={deg}
                onStart={api.commitHistory}
                onChange={(v) => soft({ rotation: v })}
              />
            </Section>

            <div className="action-grid">
              <button
                type="button"
                className="action-btn"
                onClick={() => api.duplicateLight(selected.id)}
                title="Duplicate (Ctrl/Cmd + D)"
              >
                <Icon name="copy" size={15} />
                Duplicate
              </button>
              <button
                type="button"
                className={`action-btn${selected.enabled ? "" : " is-off"}`}
                onClick={() => updateLight(selected.id, { enabled: !selected.enabled })}
                title="Show / hide this light"
              >
                <Icon name="eye" size={15} />
                {selected.enabled ? "Visible" : "Hidden"}
              </button>
            </div>
            <div className="action-grid">
              <button
                type="button"
                className="action-btn"
                onClick={() => api.reorderLight(selected.id, -1)}
                title="Send backward"
              >
                <Icon name="down" size={15} />
                Back
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => api.reorderLight(selected.id, 1)}
                title="Bring forward"
              >
                <Icon name="up" size={15} />
                Front
              </button>
            </div>
            <div className="action-grid is-single">
              <button
                type="button"
                className="action-btn is-danger is-block"
                onClick={() => api.removeLight(selected.id)}
                title="Delete (Del)"
              >
                <Icon name="trash" size={15} />
                Delete light
              </button>
            </div>
            <div className="hairline" />
          </>
        ) : (
          <p className="empty-note">
            Click a light on the panel to edit it, or double-click empty space to place a new one.
          </p>
        )}

        <Section
          title="Background"
          action={
            <span className="switch-row">
              <span className="switch-text">Gradient</span>
              <button
                type="button"
                className={`switch${scene.bg.gradient ? " is-on" : ""}`}
                onClick={() => setBackground({ gradient: !scene.bg.gradient })}
                aria-pressed={scene.bg.gradient}
                aria-label="Gradient background"
              >
                <span />
              </button>
            </span>
          }
        >
          <ColorField
            value={scene.bg.color}
            swatches={BG_SWATCHES}
            onChange={(hex) => setBackground({ color: hex })}
            label={scene.bg.gradient ? "First stop" : "Colour"}
          />
          {scene.bg.gradient && (
            <>
              <ColorField
                value={scene.bg.color2}
                onChange={(hex) => setBackground({ color2: hex })}
                label="Second stop"
              />
              <Slider
                label="Angle"
                value={scene.bg.angle}
                min={0}
                max={360}
                step={1}
                format={deg}
                onStart={api.commitHistory}
                onChange={(v) => setBackground({ angle: v }, true)}
              />
            </>
          )}
          <div className="hairline is-tight" />
          <Slider
            label="Exposure"
            value={scene.master}
            min={0.05}
            max={1.5}
            step={0.01}
            format={pct}
            onStart={api.commitHistory}
            onChange={(v) => setMaster(v, true)}
          />
        </Section>
      </div>
    </div>
  );
}
