import { Easing, interpolate } from "remotion";

/**
 * BRAND TOKENS. Every engine component reads colours/fonts from `C` and `FONT` at render time.
 * A project calls `applyBrand(brand)` at the top of its root composition so one repo can hold many clients.
 * Key names are historical (the first client was violet) — treat them as ROLES:
 *   violet  = primary accent        violet2 = accent, lighter step
 *   lilac   = accent tint (text on dark)   lilac2 = accent mid-tint (lines, connectors)
 *   ink     = heading text on light  muted = body text on light
 *   light   = light-scene background card = soft panel on light
 *   bg / bgDeep = dark-scene background   glow = dark-scene bottom glow colour
 *   textOnDark / textOnDarkMuted = copy colours on dark scenes
 *   green / amber / red = semantic status colours
 */
export type Brand = {
  violet: string; violet2: string; lilac: string; lilac2: string;
  ink: string; muted: string; light: string; card: string;
  bg: string; bgDeep: string; glow: string; textOnDark: string; textOnDarkMuted: string;
  green: string; amber: string; red: string;
  font: string; displayFont: string; displayWeight: number; displayItalicAccent: boolean;
  glass3D: string; glass3DEmissive: string; light3D: string[];
};

export const C: Brand = {
  violet: "#7C3AED", violet2: "#8B5CF6", lilac: "#C4B5FD", lilac2: "#A78BFA",
  ink: "#101828", muted: "#4A5565", light: "#FBF9FE", card: "#F4F3F8",
  bg: "#07050D", bgDeep: "#030208", glow: "#7C3AED", textOnDark: "#E9E4F7", textOnDarkMuted: "#B9AEDB",
  green: "#00C950", amber: "#FE9A00", red: "#FB2C36",
  font: "InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayFont: "InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayWeight: 300, displayItalicAccent: false,
  glass3D: "#8B5CF6", glass3DEmissive: "#3B1670", light3D: ["#ffffff", "#C4B5FD", "#8B5CF6", "#4C1D95"],
};

/** Live-binding font exports (ES modules update importers when these change). */
export let FONT = C.font;
export let DISPLAY = C.displayFont;

export const applyBrand = (b: Partial<Brand>) => {
  Object.assign(C, b);
  FONT = C.font;
  DISPLAY = C.displayFont;
};

/** hex (#RRGGBB) + alpha → rgba() string. */
export const rgba = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIn = Easing.bezier(0.55, 0, 0.9, 0.4);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const io = (f: number, input: number[], output: number[], easing: (t: number) => number = easeOut) =>
  interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
export const blurF = (b: number) => (b > 0.05 ? `blur(${b}px)` : undefined);
