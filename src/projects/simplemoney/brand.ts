import type { Brand } from "../../engine/util";
import { loadFont } from "../../engine/fonts";

// Full Inter / Inter Display (OFL) — the latin woff2 subsets lack the ₹ glyph.
loadFont("TSMText", "fonts/tsm/Inter-Medium.otf", 500);
loadFont("TSMText", "fonts/tsm/Inter-SemiBold.otf", 600);
loadFont("TSMText", "fonts/tsm/Inter-Bold.otf", 700);
loadFont("TSMDisplay", "fonts/tsm/InterDisplay-SemiBold.otf", 600);
loadFont("TSMDisplay", "fonts/tsm/InterDisplay-Bold.otf", 700);
loadFont("TSMDisplay", "fonts/tsm/InterDisplay-Black.otf", 900);
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-italic.woff2", 400, "italic");

/** The Simple Money — deep money green, mint accent, gold for coins. */
export const brand: Partial<Brand> = {
  violet: "#2EE59D", // mint — primary accent
  violet2: "#7CF5C4",
  lilac: "#C9FBE4",
  lilac2: "#5FD9A8",
  ink: "#04170F",
  muted: "#3D6B57",
  light: "#EFFBF4",
  card: "#E2F5EA",
  bg: "#062A1E",
  bgDeep: "#03170F",
  glow: "#0E7A4F",
  textOnDark: "#EAFBF3",
  textOnDarkMuted: "#9CC9B4",
  green: "#2EE59D",
  amber: "#F2C66D",
  red: "#FF5A5F",
  font: "TSMText, ui-sans-serif, system-ui, sans-serif",
  displayFont: "TSMDisplay, ui-sans-serif, system-ui, sans-serif",
  displayWeight: 800,
  displayItalicAccent: false,
  glass3D: "#E9B949",
  glass3DEmissive: "#5A3A00",
  light3D: ["#ffffff", "#C9FBE4", "#2EE59D", "#0E7A4F"],
};

export const SERIF = "InstrumentSerif, Georgia, serif";
export const GOLD = "#F2C66D";
export const KABIR = "#F2C66D"; // second runner: warm sand/gold
