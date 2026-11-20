import { kelvinToHex } from "./color";
import {
  Background,
  clamp,
  DEFAULT_BG,
  makeId,
  Light,
  Scene,
  ShapeId,
} from "./types";

type LightSeed = Partial<Light> & { shape: ShapeId };

export function makeLight(seed: LightSeed): Light {
  return {
    id: makeId(),
    x: 0.5,
    y: 0.5,
    size: 0.16,
    color: "#ffffff",
    intensity: 0.8,
    softness: 0.5,
    rotation: 0,
    enabled: true,
    ...seed,
  };
}

/** Defaults used by the "add light" buttons — tuned so a fresh light looks good immediately. */
export const SHAPE_DEFAULTS: Record<ShapeId, Omit<Light, "id" | "x" | "y" | "color">> = {
  circle: { size: 0.17, intensity: 0.85, softness: 0.55, shape: "circle", rotation: 0, enabled: true },
  ring: { size: 0.2, intensity: 0.9, softness: 0.25, shape: "ring", rotation: 0, enabled: true },
  square: { size: 0.13, intensity: 0.85, softness: 0.3, shape: "square", rotation: 0, enabled: true },
  triangle: { size: 0.15, intensity: 0.85, softness: 0.3, shape: "triangle", rotation: 0, enabled: true },
  bar: { size: 0.14, intensity: 0.75, softness: 0.6, shape: "bar", rotation: 0, enabled: true },
};

export const SWATCHES: { label: string; color: string }[] = [
  { label: "White", color: "#ffffff" },
  { label: "3200 K", color: kelvinToHex(3200) },
  { label: "4300 K", color: kelvinToHex(4300) },
  { label: "5600 K", color: kelvinToHex(5600) },
  { label: "6500 K", color: kelvinToHex(6500) },
  { label: "Red", color: "#ff3b30" },
  { label: "Amber", color: "#ff9f0a" },
  { label: "Yellow", color: "#ffd60a" },
  { label: "Green", color: "#32d74b" },
  { label: "Cyan", color: "#40cbe0" },
  { label: "Blue", color: "#0a84ff" },
  { label: "Indigo", color: "#5e5ce6" },
  { label: "Violet", color: "#bf5af2" },
  { label: "Pink", color: "#ff2d55" },
];

const bg = (color: string, color2 = color, gradient = false, angle = 90): Background => ({
  ...DEFAULT_BG,
  color,
  color2,
  gradient,
  angle,
});

export interface ScenePreset {
  id: string;
  name: string;
  hint: string;
  build: () => Scene;
}

export const SCENES: ScenePreset[] = [
  {
    id: "blank",
    name: "Blank",
    hint: "Empty canvas",
    build: () => ({ lights: [], bg: { ...DEFAULT_BG }, master: 1 }),
  },
  {
    id: "soft-key",
    name: "Soft key",
    hint: "Warm key + cool fill",
    build: () => ({
      bg: bg("#0a0908", "#12100d", true, 100),
      master: 1,
      lights: [
        makeLight({ shape: "circle", x: 0.27, y: 0.46, size: 0.32, color: kelvinToHex(3600), intensity: 0.95, softness: 0.82 }),
        makeLight({ shape: "circle", x: 0.72, y: 0.55, size: 0.27, color: "#bad4ff", intensity: 0.52, softness: 0.95 }),
      ],
    }),
  },
  {
    id: "three-point",
    name: "Three point",
    hint: "Key, fill and rim",
    build: () => ({
      bg: bg("#07080b", "#0d0b12", true, 45),
      master: 1,
      lights: [
        makeLight({ shape: "circle", x: 0.16, y: 0.42, size: 0.3, color: "#fff4e8", intensity: 0.95, softness: 0.8 }),
        makeLight({ shape: "circle", x: 0.5, y: 0.62, size: 0.26, color: "#cfe4ff", intensity: 0.45, softness: 1 }),
        makeLight({ shape: "circle", x: 0.86, y: 0.38, size: 0.2, color: "#8f7bff", intensity: 0.8, softness: 0.7 }),
      ],
    }),
  },
  {
    id: "donut",
    name: "Donut",
    hint: "One soft ring",
    build: () => ({
      bg: bg("#0b0713", "#1a0e26", true, 120),
      master: 1,
      lights: [
        makeLight({ shape: "ring", x: 0.5, y: 0.5, size: 0.36, color: "#ffffff", intensity: 0.95, softness: 0.22 }),
        makeLight({ shape: "circle", x: 0.5, y: 0.5, size: 0.05, color: "#ff5ea8", intensity: 0.9, softness: 0.6 }),
      ],
    }),
  },
  {
    id: "circles",
    name: "Circles",
    hint: "Five discs in a row",
    build: () => ({
      bg: bg("#08080a", "#101018", true, 90),
      master: 1,
      lights: [
        makeLight({ shape: "circle", x: 0.1, y: 0.5, size: 0.13, color: "#ff6b3d", intensity: 0.9, softness: 0.4 }),
        makeLight({ shape: "circle", x: 0.3, y: 0.5, size: 0.16, color: "#ffb03a", intensity: 0.9, softness: 0.4 }),
        makeLight({ shape: "circle", x: 0.5, y: 0.5, size: 0.19, color: "#fff3dd", intensity: 0.95, softness: 0.4 }),
        makeLight({ shape: "circle", x: 0.7, y: 0.5, size: 0.16, color: "#8fb8ff", intensity: 0.9, softness: 0.4 }),
        makeLight({ shape: "circle", x: 0.9, y: 0.5, size: 0.13, color: "#b07bff", intensity: 0.9, softness: 0.4 }),
      ],
    }),
  },
  {
    id: "squares",
    name: "Squares",
    hint: "Three squares",
    build: () => ({
      bg: bg("#07090c", "#0c1118", true, 60),
      master: 1,
      lights: [
        makeLight({ shape: "square", x: 0.22, y: 0.5, size: 0.15, color: "#ffd60a", intensity: 0.85, softness: 0.18, rotation: 12 }),
        makeLight({ shape: "square", x: 0.5, y: 0.5, size: 0.19, color: "#f5f7ff", intensity: 0.9, softness: 0.18, rotation: 45 }),
        makeLight({ shape: "square", x: 0.78, y: 0.5, size: 0.15, color: "#00e0c6", intensity: 0.85, softness: 0.18, rotation: -12 }),
      ],
    }),
  },
  {
    id: "triangles",
    name: "Triangles",
    hint: "Three triangles",
    build: () => ({
      bg: bg("#0a0608", "#150a10", true, 110),
      master: 1,
      lights: [
        makeLight({ shape: "triangle", x: 0.24, y: 0.52, size: 0.17, color: "#ff4d6d", intensity: 0.85, softness: 0.15 }),
        makeLight({ shape: "triangle", x: 0.5, y: 0.44, size: 0.22, color: "#ffd9c2", intensity: 0.9, softness: 0.15 }),
        makeLight({ shape: "triangle", x: 0.76, y: 0.52, size: 0.17, color: "#7c5cff", intensity: 0.85, softness: 0.15 }),
      ],
    }),
  },
  {
    id: "split",
    name: "Split",
    hint: "Edge bars, warm/cool",
    build: () => ({
      bg: bg("#05060a", "#0a0d14", true, 0),
      master: 1,
      lights: [
        makeLight({ shape: "bar", x: 0.06, y: 0.5, size: 0.16, color: kelvinToHex(3200), intensity: 0.9, softness: 0.85 }),
        makeLight({ shape: "bar", x: 0.94, y: 0.5, size: 0.16, color: kelvinToHex(7500), intensity: 0.7, softness: 0.85 }),
      ],
    }),
  },
  {
    id: "wb-test",
    name: "WB test",
    hint: "Tungsten vs daylight",
    build: () => ({
      bg: bg("#0a0a0a"),
      master: 1,
      lights: [
        makeLight({ shape: "circle", x: 0.25, y: 0.5, size: 0.34, color: kelvinToHex(3200), intensity: 0.85, softness: 1 }),
        makeLight({ shape: "circle", x: 0.75, y: 0.5, size: 0.34, color: kelvinToHex(5600), intensity: 0.85, softness: 1 }),
      ],
    }),
  },
  {
    id: "dusk",
    name: "Dusk",
    hint: "Magenta haze",
    build: () => ({
      bg: bg("#1a0b1f", "#060510", true, 115),
      master: 1,
      lights: [
        makeLight({ shape: "circle", x: 0.18, y: 0.72, size: 0.4, color: "#ff3d7f", intensity: 0.75, softness: 1 }),
        makeLight({ shape: "circle", x: 0.52, y: 0.3, size: 0.32, color: "#ffb36b", intensity: 0.55, softness: 1 }),
        makeLight({ shape: "circle", x: 0.84, y: 0.62, size: 0.42, color: "#4d6bff", intensity: 0.6, softness: 1 }),
      ],
    }),
  },
  {
    id: "bounce",
    name: "Bounce",
    hint: "Soft white wall",
    build: () => ({
      bg: bg("#efece6", "#e2ded6", true, 90),
      master: 0.55,
      lights: [makeLight({ shape: "circle", x: 0.5, y: 0.5, size: 0.6, color: "#fffaf2", intensity: 0.5, softness: 1 })],
    }),
  },
];

export function sceneFromPreset(id: string): Scene | null {
  const preset = SCENES.find((s) => s.id === id);
  return preset ? preset.build() : null;
}

export function sanitizeLight(raw: unknown): Light | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<Light>;
  if (typeof l.x !== "number" || typeof l.y !== "number") return null;
  const shape: ShapeId = (["circle", "ring", "square", "triangle", "bar"] as ShapeId[]).includes(
    l.shape as ShapeId,
  )
    ? (l.shape as ShapeId)
    : "circle";
  return {
    id: typeof l.id === "string" ? l.id : makeId(),
    x: clamp(l.x, -0.5, 1.5),
    y: clamp(l.y, -0.5, 1.5),
    size: clamp(typeof l.size === "number" ? l.size : 0.16, 0.01, 1.2),
    color: typeof l.color === "string" && /^#[0-9a-fA-F]{6}$/.test(l.color) ? l.color : "#ffffff",
    intensity: clamp(typeof l.intensity === "number" ? l.intensity : 0.8, 0, 1.5),
    softness: clamp(typeof l.softness === "number" ? l.softness : 0.5, 0, 1),
    shape,
    rotation: typeof l.rotation === "number" ? l.rotation : 0,
    enabled: l.enabled !== false,
  };
}

export function sanitizeScene(raw: unknown): Scene | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<Scene>;
  if (!Array.isArray(s.lights)) return null;
  const lights = s.lights.map(sanitizeLight).filter((l): l is Light => l !== null).slice(0, 24);
  const b = (s.bg ?? {}) as Partial<Background>;
  const hex = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  return {
    lights,
    bg: {
      color: hex(b.color, DEFAULT_BG.color),
      color2: hex(b.color2, DEFAULT_BG.color2),
      gradient: b.gradient !== false,
      angle: clamp(typeof b.angle === "number" ? b.angle : 90, 0, 360),
    },
    master: clamp(typeof s.master === "number" ? s.master : 1, 0.05, 1.5),
  };
}
