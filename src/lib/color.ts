export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Convert an sRGB hex to a 0..1 tuple, gamma-aware so the shader adds light the way a display does. */
export function hexToLinear(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const enc = (v: number) => {
    const c = v / 255;
    return Math.pow(c, 2.2);
  };
  return [enc(r), enc(g), enc(b)];
}

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHex(value: string): string {
  const v = value.trim().replace(/^#/, "");
  if (!isValidHex(v)) return "#ffffff";
  return `#${v.toLowerCase()}`;
}

/**
 * Blackbody colour for a colour temperature, roughly matching what a
 * photographer expects from a 3200 K tungsten or a 5600 K HMI lamp.
 * Values are intentionally desaturated: they are display light, not stage light.
 */
export function kelvinToHex(kelvin: number): string {
  const t = Math.max(1000, Math.min(12000, kelvin)) / 100;
  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }

  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  // Pull every channel toward white a little: pure blackbody looks filthy on screen.
  const mix = (v: number) => Math.round(v * 0.82 + 255 * 0.18);
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
