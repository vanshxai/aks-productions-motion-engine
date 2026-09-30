import { staticFile } from "remotion";
export const injectFonts = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("abwab-fonts")) return;
  const style = document.createElement("style");
  style.id = "abwab-fonts";
  style.innerHTML = [300, 400, 500, 600, 700, 800]
    .map(
      (w) =>
        `@font-face{font-family:'InterLocal';src:url('${staticFile(
          `fonts/inter-latin-${w}-normal.woff2`
        )}') format('woff2');font-weight:${w};font-style:normal;font-display:block;}`
    )
    .join("");
  document.head.appendChild(style);
};
injectFonts();

/**
 * Register an extra brand font from /public/fonts (woff2/ttf). Call at module top-level of a project.
 * Example: loadFont("InstrumentSerif", "fonts/instrument-serif-400-italic.woff2", 400, "italic")
 */
export const loadFont = (family: string, file: string, weight = 400, style: "normal" | "italic" = "normal") => {
  if (typeof document === "undefined") return;
  const id = `font-${family}-${weight}-${style}`;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.innerHTML = `@font-face{font-family:'${family}';src:url('${staticFile(file)}');font-weight:${weight};font-style:${style};font-display:block;}`;
  document.head.appendChild(el);
};
