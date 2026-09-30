import { Brand } from "../../engine/util";
import { loadFont } from "../../engine/fonts";

// Free fonts (OFL): Instrument Serif (display) + Inter Tight (UI). Arabic/Cyrillic for the multilingual AI transcript.
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-normal.woff2", 400, "normal");
loadFont("InstrumentSerif", "fonts/instrument-serif-latin-400-italic.woff2", 400, "italic");
[400, 500, 600, 700].forEach((w) => loadFont("InterTight", `fonts/inter-tight-latin-${w}-normal.woff2`, w));
loadFont("InterTightCyr", "fonts/inter-tight-cyrillic-500-normal.woff2", 500);
loadFont("NotoArabic", "fonts/noto-sans-arabic-arabic-500-normal.woff2", 500);

/** WebEpex — tokens scanned from webepex.com (Sept 2026): cream paper, espresso ink, gold/bronze accents. */
export const brand: Partial<Brand> = {
  violet: "#A6864F", violet2: "#C9A77A", lilac: "#E6D3AE", lilac2: "#C9A77A",
  ink: "#1C1612", muted: "#6E6258", light: "#F5F0E8", card: "#EBE3D5",
  bg: "#0E0A08", bgDeep: "#070504", glow: "#A6864F", textOnDark: "#F5F0E8", textOnDarkMuted: "#BFB2A3",
  green: "#3FAE55", amber: "#E0A33B", red: "#D0533F",
  font: "InterTight, InterLocal, ui-sans-serif, system-ui, sans-serif",
  displayFont: "InstrumentSerif, Georgia, serif", displayWeight: 400, displayItalicAccent: true,
  glass3D: "#C9A77A", glass3DEmissive: "#3A2A15", light3D: ["#FFF6E6", "#E8D2A8", "#C9A77A", "#3A2A15"],
};
