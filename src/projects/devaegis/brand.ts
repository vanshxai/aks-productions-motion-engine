import { Brand } from "../../engine/util";
import { loadFont } from "../../engine/fonts";

// Free fonts (OFL): Plus Jakarta Sans (UI + headlines) + Instrument Serif italic (the ✦DevAegis logo and the *money* accent).
[500, 600, 700, 800].forEach((w) => loadFont("Jakarta", `fonts/plus-jakarta-sans-latin-${w}-normal.woff2`, w));
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-italic.woff2", 400, "italic");
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-normal.woff2", 400, "normal");

/** DevAegis — tokens scanned from devaegis.com (Sept 2026): near-black ember background, molten amber accents. */
export const brand: Partial<Brand> = {
  violet: "#ee8517", violet2: "#f5a93c", lilac: "#ffcb80", lilac2: "#f5a93c",
  ink: "#f4e9de", muted: "#95836f", light: "#ffe7c4", card: "#0e0906",
  bg: "#080402", bgDeep: "#030201", glow: "#ee8517", textOnDark: "#f4e9de", textOnDarkMuted: "#c9b49f",
  green: "#7fd69b", amber: "#f5a93c", red: "#ff5a4f",
  font: "Jakarta, InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayFont: "Jakarta, InterLocal, ui-sans-serif, system-ui, sans-serif", displayWeight: 700, displayItalicAccent: true,
  glass3D: "#f5a93c", glass3DEmissive: "#3a1a04", light3D: ["#fff0dc", "#ffcb80", "#ee8517", "#1a0c04"],
};

export const T = {
  bg: "#080402", surface: "#0a0503", card: "#0e0906", line: "#2a1d14",
  amber: "#f5a93c", deep: "#ee8517", hi: "#ffcb80", sand: "#ffe7c4",
  ink: "#f4e9de", ink2: "#c9b49f", ink3: "#95836f", live: "#7fd69b", danger: "#ff5a4f", cold: "#8fa6c4",
  serif: "InstrumentSerif, Georgia, serif", sans: "Jakarta, InterLocal, sans-serif", mono: "'DejaVu Sans Mono', Menlo, Consolas, monospace",
  h1a: "linear-gradient(180deg,#fff0dc,#f9b569)", h1b: "linear-gradient(180deg,#ffe7c4,#f59b36)", cta: "linear-gradient(180deg,#ffcb80,#ee8517)",
};
