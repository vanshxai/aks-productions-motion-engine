/**
 * The sample file and its five real stages. Stage 3 is byte-for-byte terser output (`terser -m --toplevel`, no compress),
 * stage 4 is byte-for-byte prettier output of stage 3. Stages 1–2 are the same steps shown one at a time.
 * Every visible glyph belongs to a token with a stable id, so tokens can glide between layouts.
 */
export type Kind = "kw" | "id" | "prop" | "pun" | "str" | "num" | "cm" | "op";
export type Tok = { id: string; t: string; k: Kind; to?: string };

export const TOKS: Tok[] = [
  { id: "cm", t: "// VIP clients get a discount", k: "cm" },
  { id: "fn", t: "function", k: "kw" }, { id: "nm", t: "calculateTotal", k: "id", to: "c" },
  { id: "p1", t: "(", k: "pun" }, { id: "a1", t: "items", k: "id", to: "c" }, { id: "c1", t: ",", k: "pun" },
  { id: "a2", t: "discount", k: "id", to: "e" }, { id: "p2", t: ")", k: "pun" }, { id: "b1", t: "{", k: "pun" },
  { id: "k2", t: "const", k: "kw" }, { id: "v1", t: "subtotal", k: "id", to: "i" }, { id: "eq", t: "=", k: "op" },
  { id: "a1b", t: "items", k: "id", to: "c" }, { id: "d1", t: ".", k: "pun" }, { id: "red", t: "reduce", k: "prop" }, { id: "p3", t: "(", k: "pun" },
  { id: "p4", t: "(", k: "pun" }, { id: "s1", t: "sum", k: "id", to: "c" }, { id: "c2", t: ",", k: "pun" }, { id: "s2", t: "item", k: "id", to: "e" },
  { id: "p5", t: ")", k: "pun" }, { id: "ar", t: "=>", k: "op" }, { id: "s1b", t: "sum", k: "id", to: "c" }, { id: "pl", t: "+", k: "op" },
  { id: "s2b", t: "item", k: "id", to: "e" }, { id: "d2", t: ".", k: "pun" }, { id: "pr", t: "price", k: "prop" }, { id: "c3", t: ",", k: "pun" },
  { id: "z", t: "0", k: "num" }, { id: "p6", t: ")", k: "pun" }, { id: "sc1", t: ";", k: "pun" },
  { id: "rt", t: "return", k: "kw" }, { id: "v1b", t: "subtotal", k: "id", to: "i" }, { id: "mul", t: "*", k: "op" }, { id: "p7", t: "(", k: "pun" },
  { id: "one", t: "1", k: "num" }, { id: "mi", t: "-", k: "op" }, { id: "a2b", t: "discount", k: "id", to: "e" }, { id: "p8", t: ")", k: "pun" }, { id: "sc2", t: ";", k: "pun" },
  { id: "b2", t: "}", k: "pun" },
  { id: "fe", t: "fetch", k: "prop" }, { id: "p9", t: "(", k: "pun" }, { id: "st", t: '"/api/invoices"', k: "str" }, { id: "p10", t: ")", k: "pun" }, { id: "sc3", t: ";", k: "pun" },
];
export const BY: Record<string, Tok> = Object.fromEntries(TOKS.map((t) => [t.id, t]));

/** Stage templates: {id} = token, other characters are literal whitespace / line breaks. `~` = forced wrap point (none needed). */
const S0 = `{cm}
{fn} {nm}{p1}{a1}{c1} {a2}{p2} {b1}
  {k2} {v1} {eq} {a1b}{d1}{red}{p3}
    {p4}{s1}{c2} {s2}{p5} {ar} {s1b} {pl} {s2b}{d2}{pr}{c3} {z}{p6}{sc1}
  {rt} {v1b} {mul} {p7}{one} {mi} {a2b}{p8}{sc2}
{b2}
{fe}{p9}{st}{p10}{sc3}
`;
const S1 = `{fn} {nm}{p1}{a1}{c1}{a2}{p2}{b1}
{k2} {v1}{eq}{a1b}{d1}{red}{p3}
{p4}{s1}{c2}{s2}{p5}{ar}{s1b}{pl}{s2b}{d2}{pr}{c3}{z}{p6}{sc1}
{rt} {v1b}{mul}{p7}{one}{mi}{a2b}{p8}{sc2}
{b2}
{fe}{p9}{st}{p10}{sc3}
`;
// terser output (one line; terser drops the `;` before `}`)
const S3 = `{fn} {nm}{p1}{a1}{c1}{a2}{p2}{b1}{k2} {v1}{eq}{a1b}{d1}{red}{p3}{p4}{s1}{c2}{s2}{p5}{ar}{s1b}{pl}{s2b}{d2}{pr}{c3}{z}{p6}{sc1}{rt} {v1b}{mul}{p7}{one}{mi}{a2b}{p8}{b2}{fe}{p9}{st}{p10}{sc3}
`;
// prettier output of S3
const S4 = `{fn} {nm}{p1}{a1}{c1} {a2}{p2} {b1}
  {k2} {v1} {eq} {a1b}{d1}{red}{p3}{p4}{s1}{c2} {s2}{p5} {ar} {s1b} {pl} {s2b}{d2}{pr}{c3} {z}{p6}{sc1}
  {rt} {v1b} {mul} {p7}{one} {mi} {a2b}{p8}{sc2}
{b2}
{fe}{p9}{st}{p10}{sc3}
`;

export type Placed = { id: string; text: string; col: number; row: number };
export type Stage = { toks: Record<string, Placed>; rows: number; bytes: number; text: string };

/** Lay a template out on a monospace grid. `renamed` swaps identifiers to their short names. `wrap` breaks at token boundaries. */
const build = (tpl: string, renamed: boolean, wrap = 999): Stage => {
  const toks: Record<string, Placed> = {};
  let col = 0, row = 0, text = "";
  const re = /\{(\w+)\}|([^{])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) {
    if (m[1]) {
      const tk = BY[m[1]];
      const s = renamed && tk.to ? tk.to : tk.t;
      if (col > 0 && col + s.length > wrap) { col = 0; row++; }
      toks[tk.id] = { id: tk.id, text: s, col, row };
      col += s.length; text += s;
    } else if (m[2] === "\n") { row++; col = 0; text += "\n"; }
    else { col += 1; text += m[2]; }
  }
  const rows = text.endsWith("\n") ? row : row + 1;
  return { toks, rows, bytes: new TextEncoder().encode(text).length, text };
};

export const STAGES = [build(S0, false), build(S1, false), build(S1, true), build(S3, true, 40), build(S4, true)];
// verified against the real files: 209 (source), 157, 98, 92 (terser output), 115 (prettier output)
export const BYTES = STAGES.map((s) => s.bytes);
export const LINES = STAGES.map((s) => s.rows);

/** groups used for highlights */
export const NAMES = ["nm", "a1", "a2", "v1", "a1b", "s1", "s2", "s1b", "s2b", "v1b", "a2b"];
export const LOGIC = ["red", "pr", "pl", "mul", "one", "mi", "z"];
export const ROUTE = ["fe", "st"];
export const RENAMES: [string, string][] = [["calculateTotal", "c"], ["items", "c"], ["discount", "e"], ["subtotal", "i"], ["sum", "c"], ["item", "e"]];
