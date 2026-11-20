export type ShapeId = "circle" | "ring" | "square" | "triangle" | "bar";

export const SHAPE_ORDER: ShapeId[] = ["circle", "ring", "square", "triangle", "bar"];

export interface Light {
  id: string;
  /** Horizontal position, 0 = left edge, 1 = right edge. */
  x: number;
  /** Vertical position, 0 = top edge, 1 = bottom edge. */
  y: number;
  /** Radius, expressed as a fraction of the screen height (so it stays round on any aspect ratio). */
  size: number;
  /** #rrggbb */
  color: string;
  /** 0 – 1.5 perceptual brightness of the light. */
  intensity: number;
  /** 0 = razor edge, 1 = fully diffuse. */
  softness: number;
  shape: ShapeId;
  /** Degrees, clockwise. */
  rotation: number;
  enabled: boolean;
}

export interface Background {
  color: string;
  gradient: boolean;
  color2: string;
  /** Degrees. 0 = left to right, 90 = top to bottom. */
  angle: number;
}

export interface Scene {
  lights: Light[];
  bg: Background;
  /** Global exposure applied to both lights and background. */
  master: number;
}

export const SHAPE_INDEX: Record<ShapeId, number> = {
  circle: 0,
  ring: 1,
  square: 2,
  triangle: 3,
  bar: 4,
};

export const SHAPE_LABEL: Record<ShapeId, string> = {
  circle: "Circle",
  ring: "Donut",
  square: "Square",
  triangle: "Triangle",
  bar: "Bar",
};

export const DEFAULT_BG: Background = {
  color: "#08090c",
  gradient: true,
  color2: "#141019",
  angle: 90,
};

let counter = 0;
export function makeId(): string {
  counter += 1;
  return `l${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
