"use client";

import { useEffect, useRef, useState } from "react";
import { isValidHex, normalizeHex } from "@/lib/color";
import { ShapeId } from "@/lib/types";

export function ShapeIcon({ shape, size = 20 }: { shape: ShapeId; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
  };
  switch (shape) {
    case "circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity="0.18" />
        </svg>
      );
    case "ring":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" strokeWidth="3.4" />
        </svg>
      );
    case "square":
      return (
        <svg {...common}>
          <rect x="5.5" y="5.5" width="13" height="13" rx="2" fill="currentColor" fillOpacity="0.18" />
        </svg>
      );
    case "triangle":
      return (
        <svg {...common}>
          <path d="M12 4.5 20 19H4z" fill="currentColor" fillOpacity="0.18" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="8" rx="4" fill="currentColor" fillOpacity="0.18" />
        </svg>
      );
  }
}

type IconName =
  | "plus"
  | "trash"
  | "copy"
  | "undo"
  | "redo"
  | "expand"
  | "exit"
  | "eye"
  | "up"
  | "down"
  | "chevron"
  | "reset"
  | "wand";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p}>
          <path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12M10 11v5M14 11v5" />
        </svg>
      );
    case "copy":
      return (
        <svg {...p}>
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
        </svg>
      );
    case "undo":
      return (
        <svg {...p}>
          <path d="M4 9h9a5 5 0 0 1 0 10H8" />
          <path d="M8 5 4 9l4 4" />
        </svg>
      );
    case "redo":
      return (
        <svg {...p}>
          <path d="M20 9h-9a5 5 0 0 0 0 10h5" />
          <path d="m16 5 4 4-4 4" />
        </svg>
      );
    case "expand":
      return (
        <svg {...p}>
          <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
        </svg>
      );
    case "exit":
      return (
        <svg {...p}>
          <path d="M9 4H4v16h5M15 8l4 4-4 4M19 12H9" />
        </svg>
      );
    case "eye":
      return (
        <svg {...p}>
          <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      );
    case "up":
      return (
        <svg {...p}>
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      );
    case "down":
      return (
        <svg {...p}>
          <path d="M12 5v14M18 13l-6 6-6-6" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...p}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "reset":
      return (
        <svg {...p}>
          <path d="M4 12a8 8 0 1 0 3-6.2" />
          <path d="M4 4v5h5" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M5 19 19 5M15 5h4v4M9 9l-2 2 6 6 2-2" />
          <path d="m13 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
        </svg>
      );
  }
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onStart: () => void;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onStart,
  onChange,
  disabled,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className={`slider${disabled ? " is-disabled" : ""}`}>
      <span className="slider-head">
        <span className="slider-name">{label}</span>
        <span className="value mono">{format ? format(value) : value.toFixed(2)}</span>
      </span>
      <span className="slider-track">
        <span className="slider-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onPointerDown={onStart}
          onKeyDown={onStart}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    </label>
  );
}

interface ColorFieldProps {
  value: string;
  onChange: (hex: string) => void;
  swatches?: { label: string; color: string }[];
  label?: string;
}

export function ColorField({ value, onChange, swatches, label }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    if (isValidHex(raw)) onChange(normalizeHex(raw));
    else setDraft(value);
  };

  return (
    <div className="color-field">
      {label && <span className="slider-name">{label}</span>}
      {swatches && (
        <div className="swatches">
          {swatches.map((s) => (
            <button
              key={s.label}
              type="button"
              className={`swatch${s.color.toLowerCase() === value.toLowerCase() ? " is-active" : ""}`}
              style={{ background: s.color }}
              title={`${s.label} · ${s.color}`}
              aria-label={s.label}
              onClick={() => onChange(s.color)}
            />
          ))}
        </div>
      )}
      <div className="color-row">
        <label className="color-input" style={{ background: value }} title="Pick any colour">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label ?? "Colour"}
          />
        </label>
        <input
          className="hex mono"
          value={draft}
          spellCheck={false}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            focused.current = false;
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel-section">
      <header className="panel-head">
        <span className="label">{title}</span>
        {action}
      </header>
      {children}
    </section>
  );
}
