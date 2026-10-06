import { Brand } from "../../engine/util";
import { loadFont } from "../../engine/fonts";

// Free fonts (OFL): Inter Tight (headlines/UI), Instrument Serif italic (accent words), JetBrains Mono (technical labels).
[500, 600, 700].forEach((w) => loadFont("InterTight", `fonts/inter-tight-latin-${w}-normal.woff2`, w));
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-italic.woff2", 400, "italic");
[400, 500, 700].forEach((w) => loadFont("JBMono", `fonts/jetbrains-mono-latin-${w}-normal.woff2`, w));

/** "How It Works" series — blueprint look (placeholder until the page brand is locked). */
export const brand: Partial<Brand> = {
  violet: "#5CD3FF", violet2: "#8BE2FF", lilac: "#BDEBFF", lilac2: "#2E8DB8",
  ink: "#EAF4FF", muted: "#8FB3D1", light: "#EAF4FF", card: "#0D2340",
  bg: "#06142A", bgDeep: "#030B18", glow: "#1B5C8F", textOnDark: "#EAF4FF", textOnDarkMuted: "#8FB3D1",
  green: "#3EE08F", amber: "#FFB547", red: "#FF5A5F",
  font: "InterTight, InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayFont: "InterTight, InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayWeight: 700, displayItalicAccent: true,
};

/** Series palette (named roles used by the gearbox kit). */
export const K = {
  bg: "#06142A", bgDeep: "#030B18",
  line: "#5CD3FF", lineDim: "#2B7FAA", grid: "rgba(110,180,255,0.065)", gridMajor: "rgba(110,180,255,0.13)",
  amber: "#FFB547", amberDeep: "#E08A00", red: "#FF5A5F", green: "#3EE08F",
  text: "#EAF4FF", muted: "#8FB3D1",
  head: "InterTight, InterLocal, sans-serif", serif: "InstrumentSerif, Georgia, serif", mono: "JBMono, ui-monospace, monospace",
};
