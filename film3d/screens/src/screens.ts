import { clamp, rr, smooth, rng } from "./lib";

type G = CanvasRenderingContext2D;
export const BRAND = {
  bg: "#080402", surface: "#0a0503", card: "#0e0906", line: "#2a1d14", amber: "#f5a93c", amberDeep: "#ee8517", amberHi: "#ffcb80",
  sand: "#ffe7c4", ink: "#f4e9de", ink2: "#c9b49f", ink3: "#95836f", live: "#7fd69b",
};
const JAK = '"Plus Jakarta Sans", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"DejaVu Sans Mono", Menlo, Consolas, monospace';

/* ---------------------------------------------------------------- code editor */
type Tok = [string, string];
const KW = "#c586c0", ID = "#9cdcfe", FN = "#dcdcaa", ST = "#ce9178", TY = "#4ec9b0", CM = "#6a9955", PL = "#d4d4d4", NM = "#b5cea8";
const CODE: Tok[][] = [
  [["import ", KW], ["{ ", PL], ["Hero", TY], [" } ", PL], ["from ", KW], ["'@/components/Hero'", ST]],
  [["import ", KW], ["{ ", PL], ["PricingTable", TY], [" } ", PL], ["from ", KW], ["'@/components/Pricing'", ST]],
  [["import ", KW], ["{ ", PL], ["getProjects", FN], [" } ", PL], ["from ", KW], ["'@/lib/projects'", ST]],
  [],
  [["export default async function ", KW], ["Page", FN], ["() {", PL]],
  [["  const ", KW], ["projects", ID], [" = ", PL], ["await ", KW], ["getProjects", FN], ["()", PL]],
  [["  return (", PL]],
  [["    <", PL], ["main ", TY], ["className", ID], ["=", PL], ['"grid gap-24"', ST], [">", PL]],
  [["      <", PL], ["Hero ", TY], ["title", ID], ["=", PL], ['"Northwind Portal"', ST], [" />", PL]],
  [["      {", PL], ["projects", ID], [".", PL], ["map", FN], ["(p => (", PL]],
  [["        <", PL], ["Card ", TY], ["key", ID], ["={p.id} ", PL], ["{...p}", ID], [" />", PL]],
  [["      ))}", PL]],
  [["      <", PL], ["PricingTable ", TY], ["/>", PL]],
  [["    </", PL], ["main", TY], [">", PL]],
  [["  )", PL]],
  [["}", PL]],
  [],
  [["// TODO: ship it before the deadline", CM]],
];
const FILES = ["app", "  layout.tsx", "  page.tsx", "  globals.css", "components", "  Hero.tsx", "  Card.tsx", "  Pricing.tsx", "lib", "  projects.ts", "package.json", "next.config.js"];

export function drawEditor(g: G, W: number, H: number, p: number, frame: number) {
  g.fillStyle = "#1e1e1e"; g.fillRect(0, 0, W, H);
  // activity bar
  g.fillStyle = "#333333"; g.fillRect(0, 0, 54, H);
  ["#d4d4d4", "#858585", "#858585", "#858585"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3; rr(g, 15, 22 + i * 60, 24, 24, 5); g.stroke(); });
  // explorer
  g.fillStyle = "#252526"; g.fillRect(54, 0, 270, H);
  g.fillStyle = "#bbbbbb"; g.font = `600 15px ${JAK}`; g.fillText("EXPLORER", 76, 34);
  g.font = `500 16px ${JAK}`; g.fillStyle = "#e0e0e0"; g.fillText("v  NORTHWIND-PORTAL", 70, 66);
  FILES.forEach((f, i) => {
    const y = 96 + i * 30; const sel = f.trim() === "page.tsx";
    if (sel) { g.fillStyle = "#37373d"; g.fillRect(54, y - 20, 270, 28); }
    g.fillStyle = f.startsWith(" ") ? (sel ? "#ffffff" : "#c5c5c5") : "#e0e0e0"; g.font = `500 16px ${JAK}`;
    g.fillText((f.startsWith(" ") ? "     " : "v  ") + f.trim(), 76, y);
  });
  // tabs
  g.fillStyle = "#2d2d2d"; g.fillRect(324, 0, W - 324, 44);
  g.fillStyle = "#1e1e1e"; g.fillRect(324, 0, 190, 44); g.fillStyle = "#f5a93c"; g.fillRect(324, 0, 190, 2);
  g.fillStyle = "#ffffff"; g.font = `500 16px ${JAK}`; g.fillText("page.tsx", 348, 28);
  g.fillStyle = "#9d9d9d"; g.fillText("Hero.tsx", 544, 28); g.fillText("Card.tsx", 660, 28);
  // code
  const total = CODE.reduce((s, l) => s + l.reduce((a, t) => a + t[0].length, 0) + 1, 0);
  let left = Math.floor(clamp(p) * total);
  g.font = `500 21px ${MONO}`;
  let cursor: [number, number] = [0, 0];
  CODE.forEach((line, i) => {
    const y = 84 + i * 33;
    g.fillStyle = "#6e7681"; g.textAlign = "right"; g.fillText(String(i + 1), 388, y); g.textAlign = "left";
    let x = 412;
    for (const [t, c] of line) {
      if (left <= 0) return;
      const s = t.slice(0, left); g.fillStyle = c; g.fillText(s, x, y); x += g.measureText(s).width; left -= t.length;
      cursor = [x, y];
    }
    left -= 1;
    cursor = [x, y];
  });
  if (Math.floor(frame / 8) % 2 === 0) { g.fillStyle = "#f5a93c"; g.fillRect(cursor[0] + 2, cursor[1] - 21, 3, 27); }
  // minimap
  g.fillStyle = "#252526"; g.fillRect(W - 110, 44, 110, H - 70);
  for (let i = 0; i < 22; i++) { g.fillStyle = i % 3 ? "#4a4a4a" : "#3a3a3a"; g.fillRect(W - 96, 62 + i * 9, 20 + ((i * 37) % 60), 4); }
  // status bar
  g.fillStyle = "#007acc"; g.fillRect(0, H - 28, W, 28);
  g.fillStyle = "#fff"; g.font = `500 15px ${JAK}`; g.fillText("main   0 errors   0 warnings", 14, H - 9);
  g.textAlign = "right"; g.fillText("Ln 18, Col 12     UTF-8     TypeScript React", W - 16, H - 9); g.textAlign = "left";
}

/* ---------------------------------------------------------------- send / delivered */
export function drawSent(g: G, W: number, H: number, p: number) {
  drawEditor(g, W, H, 1, 0);
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, 0, W, H);
  const a = smooth(rng(0, 0.35, p)); const y = 130 - (1 - a) * 40;
  g.save(); g.globalAlpha = a;
  g.fillStyle = "#26262b"; rr(g, W / 2 - 330, y, 660, 190, 22); g.fill();
  g.strokeStyle = "#3a3a42"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#34c759"; g.beginPath(); g.arc(W / 2 - 250, y + 95, 38, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(W / 2 - 268, y + 96); g.lineTo(W / 2 - 254, y + 110); g.lineTo(W / 2 - 230, y + 80); g.stroke();
  g.fillStyle = "#fff"; g.font = `700 34px ${JAK}`; g.fillText("Final build sent", W / 2 - 190, y + 82);
  g.fillStyle = "#a1a1aa"; g.font = `500 24px ${JAK}`; g.fillText("northwind-portal.zip  ·  48 MB", W / 2 - 190, y + 122);
  g.fillText("Invoice INV-0042 attached", W / 2 - 190, y + 156);
  g.restore();
}

/* ---------------------------------------------------------------- terminal (real DevAegis CLI) */
export function drawTerminal(g: G, W: number, H: number, p: number, frame: number) {
  g.fillStyle = "#0b0907"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1a1410"; g.fillRect(0, 0, W, 52);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(30 + i * 30, 26, 9, 0, 7); g.fill(); });
  g.fillStyle = "#95836f"; g.font = `500 20px ${JAK}`; g.textAlign = "center"; g.fillText("northwind-portal — zsh", W / 2, 33); g.textAlign = "left";
  const lines: { t: string; kind: "cmd" | "out" | "ok" }[] = [
    { t: "npm i -g devaegis", kind: "cmd" },
    { t: "devaegis setup", kind: "cmd" },
    { t: "devaegis secure <project-id>", kind: "cmd" },
    { t: "devaegis export", kind: "cmd" },
    { t: "Encrypting (AES-256)...", kind: "out" },
    { t: "dist-secured/ ready", kind: "ok" },
  ];
  let budget = Math.floor(clamp(p) * 118);
  g.font = `600 44px ${MONO}`; let y = 150; let last: [number, number] = [40, y];
  for (const l of lines) {
    if (budget <= 0) break;
    let x = 40;
    if (l.kind === "cmd") { g.fillStyle = BRAND.amber; g.fillText("$", x, y); x += 56; }
    const s = l.t.slice(0, budget); g.fillStyle = l.kind === "ok" ? BRAND.live : l.kind === "out" ? BRAND.ink2 : BRAND.ink;
    if (l.kind === "ok") { g.fillText("✓ ", x, y); x += g.measureText("✓ ").width; }
    g.fillText(s, x, y); x += g.measureText(s).width; last = [x, y];
    budget -= l.kind === "cmd" ? l.t.length + 3 : Math.ceil(l.t.length / 2); y += 90;
  }
  if (Math.floor(frame / 8) % 2 === 0) { g.fillStyle = BRAND.amber; g.fillRect(last[0] + 4, last[1] - 38, 24, 46); }
}

/* ---------------------------------------------------------------- DevAegis hero (real copy + tokens) */
export function drawSite(g: G, W: number, H: number, p: number) {
  g.fillStyle = "#0a0503"; g.fillRect(0, 0, W, H);
  const bloom = g.createRadialGradient(W / 2, -60, 20, W / 2, -60, W * 0.75);
  bloom.addColorStop(0, "rgba(245,169,60,.32)"); bloom.addColorStop(1, "rgba(245,169,60,0)"); g.fillStyle = bloom; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.035)"; g.lineWidth = 1;
  for (let x = 0; x < W; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // header
  g.fillStyle = BRAND.amber; g.font = `400 26px ${JAK}`; g.fillText("✦", 70, 74);
  g.fillStyle = BRAND.ink; g.font = `italic 400 44px ${SERIF}`; g.fillText("DevAegis", 104, 78);
  g.strokeStyle = "#5a3d20"; g.lineWidth = 2; rr(g, W - 330, 40, 260, 56, 28); g.stroke();
  g.fillStyle = BRAND.ink2; g.font = `500 22px ${JAK}`; g.textAlign = "center"; g.fillText("Get started for free", W - 200, 76); g.textAlign = "left";
  // pill
  const a1 = smooth(rng(0, 0.25, p)), a2 = smooth(rng(0.12, 0.5, p)), a3 = smooth(rng(0.3, 0.7, p)), a4 = smooth(rng(0.5, 0.9, p));
  g.save(); g.globalAlpha = a1; g.strokeStyle = "#3a2a1c"; g.fillStyle = "rgba(26,15,7,.7)"; rr(g, W / 2 - 250, 170, 500, 52, 26); g.fill(); g.stroke();
  g.fillStyle = BRAND.amber; g.textAlign = "center"; g.font = `500 22px ${JAK}`; g.fillText("✦  Code protection + invoicing, in one system", W / 2, 204); g.restore();
  // h1
  const grad = (y0: number, y1: number, c0: string, c1: string) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
  g.save(); g.globalAlpha = a2; g.textAlign = "left";
  g.font = `500 108px ${JAK}`; const w1 = g.measureText("Your code is ").width;
  g.font = `italic 400 124px ${SERIF}`; const w2 = g.measureText("money").width;
  g.font = `500 108px ${JAK}`; const w3 = g.measureText(".").width;
  let x0 = W / 2 - (w1 + w2 + w3) / 2; const yy = 380 + (1 - a2) * 30;
  g.fillStyle = grad(yy - 100, yy + 20, "#fff0dc", "#f9b569"); g.fillText("Your code is ", x0, yy);
  g.font = `italic 400 124px ${SERIF}`; g.fillStyle = grad(yy - 100, yy + 20, "#ffe7c4", "#f59b36"); g.fillText("money", x0 + w1, yy);
  g.font = `500 108px ${JAK}`; g.fillStyle = grad(yy - 100, yy + 20, "#fff0dc", "#f9b569"); g.fillText(".", x0 + w1 + w2, yy);
  g.textAlign = "center"; g.fillText("Ship it protected.", W / 2, yy + 118); g.restore();
  // sub
  g.save(); g.globalAlpha = a3; g.fillStyle = BRAND.ink2; g.font = `500 27px ${JAK}`; g.textAlign = "center";
  g.fillText("DevAegis encrypts every build, locks it to one domain,", W / 2, 640); g.fillText("and ties access to the invoice.", W / 2, 678); g.restore();
  // CTA
  g.save(); g.globalAlpha = a4; const bw = 330, bh = 78; const bg = g.createLinearGradient(0, 730, 0, 730 + bh); bg.addColorStop(0, BRAND.amberHi); bg.addColorStop(1, BRAND.amberDeep);
  g.shadowColor = "rgba(245,169,60,.55)"; g.shadowBlur = 40; g.fillStyle = bg; rr(g, W / 2 - bw / 2, 730, bw, bh, 39); g.fill(); g.shadowBlur = 0;
  g.fillStyle = "#2e1502"; g.font = `700 28px ${JAK}`; g.textAlign = "center"; g.fillText("Get started for free", W / 2, 780); g.restore(); g.textAlign = "left";
}

/* ---------------------------------------------------------------- real dashboard screenshot with focus */
export function drawDashboard(g: G, W: number, H: number, img: HTMLImageElement | null, p: number) {
  g.fillStyle = "#080402"; g.fillRect(0, 0, W, H);
  if (img) g.drawImage(img, 0, 0, W, H);
  // highlight "Northwind Portal susp… Suspended" (right column, bottom activity row)
  const a = smooth(rng(0.25, 0.6, p));
  const x = (1099 / 1440) * W, y = (642 / 900) * H, w = (304 / 1440) * W, h = (77 / 900) * H;
  g.fillStyle = `rgba(0,0,0,${0.5 * a})`; g.fillRect(0, 0, W, H);
  if (img) g.drawImage(img, x, y, w, h, x, y, w, h);
  g.strokeStyle = BRAND.amber; g.lineWidth = 3 + 2 * Math.sin(p * 30); g.globalAlpha = a; g.shadowColor = BRAND.amber; g.shadowBlur = 24 * a;
  rr(g, x - 4, y - 4, w + 8, h + 8, 14); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
}

/* ---------------------------------------------------------------- client's suspended site (real copy) */
export function drawSuspended(g: G, W: number, H: number, p: number) {
  g.fillStyle = "#101014"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1b1b21"; g.fillRect(0, 0, W, 64);
  g.fillStyle = "#2a2a32"; rr(g, 100, 12, W - 200, 40, 20); g.fill();
  g.fillStyle = "#9a9aa6"; g.font = `500 20px ${JAK}`; g.fillText("portal.northwind.io", 130, 39);
  const a = smooth(rng(0, 0.3, p));
  g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 24);
  g.fillStyle = "#17171d"; rr(g, W / 2 - 340, H / 2 - 190, 680, 400, 30); g.fill(); g.strokeStyle = "#2b2b34"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "rgba(245,169,60,.16)"; g.beginPath(); g.arc(W / 2, H / 2 - 100, 58, 0, 7); g.fill();
  g.strokeStyle = BRAND.amber; g.lineWidth = 8; g.lineCap = "round";
  rr(g, W / 2 - 24, H / 2 - 98, 48, 38, 8); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2 - 100, 19, Math.PI, 0); g.stroke();
  g.fillStyle = "#fff"; g.font = `700 50px ${JAK}`; g.textAlign = "center"; g.fillText("Service suspended.", W / 2, H / 2 + 40);
  g.fillStyle = "#a1a1aa"; g.font = `500 30px ${JAK}`; g.fillText("Contact your developer.", W / 2, H / 2 + 96);
  g.restore(); g.textAlign = "left";
}

/* ---------------------------------------------------------------- phone chat / banner */
export function drawPhone(g: G, W: number, H: number, mode: "ghost" | "paid", p: number, frame: number) {
  g.fillStyle = "#0b0b0e"; g.fillRect(0, 0, W, H);
  // status bar
  g.fillStyle = "#fff"; g.font = `700 30px ${JAK}`; g.fillText("2:14", 60, 66);
  g.fillStyle = "#fff"; rr(g, W - 120, 44, 62, 26, 8); g.fill();
  // header
  g.fillStyle = "#15151a"; g.fillRect(0, 96, W, 130);
  g.fillStyle = "#3a3a44"; g.beginPath(); g.arc(W / 2, 148, 34, 0, 7); g.fill();
  g.fillStyle = "#fff"; g.font = `700 32px ${JAK}`; g.textAlign = "center"; g.fillText("C", W / 2, 160); g.font = `500 24px ${JAK}`; g.fillStyle = "#c8c8d0"; g.fillText("Northwind Client", W / 2, 208); g.textAlign = "left";
  const bubble = (txt: string[], y: number, mine: boolean, a: number) => {
    g.save(); g.globalAlpha = a; g.font = `500 32px ${JAK}`;
    const w = Math.max(...txt.map((t) => g.measureText(t).width)) + 56; const h = txt.length * 44 + 30; const x = mine ? W - w - 36 : 36;
    g.fillStyle = mine ? "#0a84ff" : "#2a2a30"; rr(g, x, y, w, h, 32); g.fill();
    g.fillStyle = "#fff"; txt.forEach((t, i) => g.fillText(t, x + 28, y + 52 + i * 44)); g.restore(); return h;
  };
  g.fillStyle = "#8a8a94"; g.font = `500 24px ${JAK}`; g.textAlign = "center"; g.fillText("Yesterday 11:40 PM", W / 2, 290); g.textAlign = "left";
  bubble(["Final build is ready."], 320, true, 1);
  bubble(["Sent you the files.", "Invoice attached."], 410, true, 1);
  bubble(["We'll pay next week."], 550, false, 1); // scenario line from the DevAegis site
  g.fillStyle = "#8a8a94"; g.font = `500 24px ${JAK}`; g.textAlign = "center"; g.fillText("Today 2:14 AM", W / 2, 690); g.textAlign = "left";
  bubble(["Hello? Any update?"], 720, true, 1);
  g.fillStyle = "#8a8a94"; g.textAlign = "right"; g.fillText("Seen 2:14 AM", W - 40, 812); g.textAlign = "left";
  if (mode === "ghost") {
    // typing dots appear then vanish
    const dots = rng(0.55, 0.7, p) * (1 - rng(0.85, 0.95, p));
    if (dots > 0) { g.save(); g.globalAlpha = dots; g.fillStyle = "#2a2a30"; rr(g, 36, 850, 150, 70, 35); g.fill(); g.fillStyle = "#8a8a94";
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(78 + i * 32, 885 - Math.abs(Math.sin(frame * 0.25 + i)) * 8, 9, 0, 7); g.fill(); } g.restore(); }
  } else {
    const a = smooth(rng(0, 0.3, p)); const y = -150 + a * 190;
    g.fillStyle = "#1c1410"; g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 30; rr(g, 30, y, W - 60, 150, 36); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = BRAND.amber; g.lineWidth = 3; g.stroke();
    g.fillStyle = BRAND.amber; g.font = `700 30px ${JAK}`; g.fillText("✦", 66, y + 62); g.fillStyle = BRAND.ink; g.font = `italic 400 34px ${SERIF}`; g.fillText("DevAegis", 108, y + 62);
    g.fillStyle = "#fff"; g.font = `700 38px ${JAK}`; g.fillText("Payment $1,850 received", 66, y + 116);
    g.fillStyle = BRAND.live; g.font = `700 24px ${JAK}`; g.textAlign = "right"; g.fillText("Live", W - 66, y + 62); g.textAlign = "left";
  }
}
