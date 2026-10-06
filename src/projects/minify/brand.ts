import { Brand } from "../../engine/util";
import { loadFont } from "../../engine/fonts";

// DevAegis type (free, OFL): Plus Jakarta Sans (headlines/UI), Instrument Serif italic (accent words), JetBrains Mono (code + labels).
[500, 600, 700, 800].forEach((w) => loadFont("PJS", `fonts/plus-jakarta-sans-latin-${w}-normal.woff2`, w));
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-italic.woff2", 400, "italic");
[400, 500, 700].forEach((w) => loadFont("JBMono", `fonts/jetbrains-mono-latin-${w}-normal.woff2`, w));

/** DevAegis "How It Works" — Dead Simple Engineering format, recoloured to the DevAegis palette (scanned from devaegis.com). */
export const brand: Partial<Brand> = {
  violet: "#f5a93c", violet2: "#ffcb80", lilac: "#ffe7c4", lilac2: "#ee8517",
  ink: "#f4e9de", muted: "#c9b49f", light: "#ffe7c4", card: "#0e0906",
  bg: "#080402", bgDeep: "#030201", glow: "#ee8517", textOnDark: "#f4e9de", textOnDarkMuted: "#c9b49f",
  green: "#7fd69b", amber: "#f5a93c", red: "#ff5a4f",
  font: "PJS, ui-sans-serif, system-ui, sans-serif",
  displayFont: "PJS, ui-sans-serif, system-ui, sans-serif",
  displayWeight: 800, displayItalicAccent: true,
};

/** Named roles used by the kit. Lines are amber on near-black (the site's own high-contrast pairing). */
export const K = {
  bg: "#080402", bgDeep: "#030201", card: "#0e0906", rule: "#2a1d14",
  line: "#f5a93c", lineDim: "#7a5530", grid: "rgba(245,169,60,0.045)", gridMajor: "rgba(245,169,60,0.10)",
  amber: "#ffcb80", amberDeep: "#ee8517", red: "#ff5a4f", green: "#7fd69b", cold: "#8fa6c4",
  text: "#f4e9de", muted: "#c9b49f", dim: "#95836f",
  head: "PJS, sans-serif", serif: "InstrumentSerif, Georgia, serif", mono: "JBMono, ui-monospace, monospace",
  glowCenter: "#1f1006", vignette: "rgba(3,2,1,0.78)", tagBg: "rgba(14,9,6,0.9)", meterBg: "rgba(3,2,1,0.6)", lineA: "rgba(245,169,60,0.16)",
};
