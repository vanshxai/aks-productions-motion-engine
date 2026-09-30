import { clamp, rr, smooth, rng } from "./lib";
import { BRAND, drawEditor, drawSent, drawTerminal, drawSite, drawSuspended, drawPhone } from "./screens";

type G = CanvasRenderingContext2D;
const JAK = '"Plus Jakarta Sans", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';

/* ---------------------------------------------------------------- phone lock screen with notifications */
type Notif = { app: string; title: string; body: string; when: string; brand?: boolean; at: number };
export function drawLock(g: G, W: number, H: number, p: number, time: string, date: string, notifs: Notif[], wake = 0.1) {
  const on = smooth(rng(wake - 0.05, wake + 0.05, p));
  // wallpaper: deep blue-violet gradient with soft blobs
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0d1330"); bg.addColorStop(0.55, "#1b1238"); bg.addColorStop(1, "#060610");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, r: number, c: string) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  blob(W * 0.2, H * 0.75, W * 0.9, "rgba(70,60,190,.35)"); blob(W * 0.9, H * 0.3, W * 0.7, "rgba(190,80,140,.18)");
  // status bar
  g.fillStyle = "#fff"; g.font = `600 30px ${JAK}`; g.fillText("", 60, 66);
  g.fillStyle = "rgba(255,255,255,.9)"; rr(g, W - 118, 46, 58, 24, 7); g.fill(); g.fillStyle = "#000"; rr(g, W - 114, 50, 40, 16, 4); g.fill();
  // date + clock
  g.textAlign = "center"; g.fillStyle = "rgba(255,255,255,.88)"; g.font = `600 36px ${JAK}`; g.fillText(date, W / 2, 230);
  g.fillStyle = "#fff"; g.font = `700 190px ${JAK}`; g.fillText(time, W / 2, 420); g.textAlign = "left";
  // notifications (newest on top)
  let y = 520;
  const shown = notifs.filter((n) => p >= n.at);
  shown.slice().reverse().forEach((n, i) => {
    const a = smooth(rng(n.at, n.at + 0.08, p)); const yy = y + (1 - a) * -60;
    g.save(); g.globalAlpha = a;
    g.fillStyle = "rgba(38,38,48,.82)"; rr(g, 34, yy, W - 68, 190, 40); g.fill();
    // app icon
    if (n.brand) { const ig = g.createLinearGradient(0, yy + 34, 0, yy + 110); ig.addColorStop(0, BRAND.amberHi); ig.addColorStop(1, BRAND.amberDeep); g.fillStyle = ig; }
    else g.fillStyle = "#34c759";
    rr(g, 62, yy + 36, 78, 78, 20); g.fill();
    g.fillStyle = n.brand ? "#2e1502" : "#fff"; g.font = n.brand ? `700 46px ${JAK}` : `700 40px ${JAK}`; g.textAlign = "center";
    g.fillText(n.brand ? "✦" : "✉", 101, yy + 91); g.textAlign = "left";
    g.fillStyle = "#fff"; g.font = `700 30px ${JAK}`; g.fillText(n.title, 166, yy + 70, W - 166 - 150);
    g.fillStyle = "rgba(235,235,245,.62)"; g.font = `500 26px ${JAK}`; g.textAlign = "right"; g.fillText(n.when, W - 64, yy + 70); g.textAlign = "left";
    g.fillStyle = "#fff"; g.font = `500 32px ${JAK}`; g.fillText(n.body, 166, yy + 118);
    g.fillStyle = "rgba(235,235,245,.62)"; g.font = `500 26px ${JAK}`; g.fillText(n.app, 166, yy + 160);
    g.restore(); y += 210;
  });
  // bottom hints
  g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.arc(120, H - 150, 50, 0, 7); g.fill(); g.beginPath(); g.arc(W - 120, H - 150, 50, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.85)"; rr(g, W / 2 - 110, H - 40, 220, 10, 5); g.fill();
  // screen off → on
  g.fillStyle = `rgba(0,0,0,${1 - on})`; g.fillRect(0, 0, W, H);
}

/* ---------------------------------------------------------------- DevAegis project panel with kill switch (over real dashboard) */
export function drawKill(g: G, W: number, H: number, img: HTMLImageElement | null, p: number, reverse = false) {
  g.fillStyle = BRAND.bg; g.fillRect(0, 0, W, H);
  if (img) { g.save(); g.filter = "blur(6px)"; g.drawImage(img, 0, 0, W, H); g.restore(); }
  g.fillStyle = "rgba(8,4,2,.72)"; g.fillRect(0, 0, W, H);
  // panel
  const px = 250, py = 110, pw = W - 500, ph = H - 220;
  g.fillStyle = "#120b07"; rr(g, px, py, pw, ph, 28); g.fill(); g.strokeStyle = BRAND.line; g.lineWidth = 2; g.stroke();
  g.fillStyle = BRAND.amber; g.font = `400 30px ${JAK}`; g.fillText("✦", px + 44, py + 70);
  g.fillStyle = BRAND.ink; g.font = `italic 400 40px ${SERIF}`; g.fillText("DevAegis", px + 80, py + 72);
  g.fillStyle = BRAND.ink3; g.font = `500 24px ${JAK}`; g.fillText("Projects  /  Northwind Portal", px + 290, py + 70);
  // project row
  g.fillStyle = BRAND.ink; g.font = `700 48px ${JAK}`; g.fillText("Northwind Portal", px + 44, py + 170);
  g.fillStyle = BRAND.ink2; g.font = `500 26px ${JAK}`; g.fillText("portal.northwind.io  ·  AES-256  ·  domain lock", px + 44, py + 214);
  // switch progress
  const click = reverse ? 0.45 : 0.55;
  const t = smooth(rng(click, click + 0.08, p)); const off = reverse ? 1 - t : t; // 1 = suspended
  // status pill
  const live = off < 0.5;
  g.fillStyle = live ? "rgba(127,214,155,.14)" : "rgba(245,169,60,.16)"; rr(g, px + pw - 300, py + 136, 250, 56, 28); g.fill();
  g.fillStyle = live ? BRAND.live : BRAND.amber; g.beginPath(); g.arc(px + pw - 266, py + 164, 9, 0, 7); g.fill();
  g.font = `700 26px ${JAK}`; g.fillText(live ? "Live" : "Suspended", px + pw - 244, py + 173);
  // invoice line
  g.strokeStyle = BRAND.line; g.beginPath(); g.moveTo(px + 44, py + 262); g.lineTo(px + pw - 44, py + 262); g.stroke();
  g.fillStyle = BRAND.ink2; g.font = `500 28px ${JAK}`; g.fillText("INV-0042", px + 44, py + 320);
  g.fillStyle = BRAND.ink; g.font = `700 28px ${JAK}`; g.fillText("$1,850", px + 260, py + 320);
  const paid = reverse;
  g.fillStyle = paid ? BRAND.live : BRAND.amber; g.font = `700 26px ${JAK}`; g.fillText(paid ? "Paid" : "Overdue · 14 days", px + 420, py + 320);
  // kill switch row
  g.fillStyle = BRAND.ink; g.font = `700 36px ${JAK}`; g.fillText("Kill switch", px + 44, py + 430);
  g.fillStyle = BRAND.ink3; g.font = `500 24px ${JAK}`; g.fillText("Pause the client's build instantly. One click to restore.", px + 44, py + 472);
  const tx = px + pw - 210, ty = py + 392, tw = 160, th = 84;
  const trackOn = `rgba(127,214,155,${0.9 - 0.9 * off})`;
  g.fillStyle = "#2a1d14"; rr(g, tx, ty, tw, th, th / 2); g.fill();
  g.fillStyle = trackOn; rr(g, tx, ty, tw, th, th / 2); g.fill();
  if (off > 0.02) { g.fillStyle = `rgba(245,169,60,${off})`; rr(g, tx, ty, tw, th, th / 2); g.fill(); }
  const kx = tx + th / 2 + (tw - th) * (1 - off);
  g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 12; g.beginPath(); g.arc(kx, ty + th / 2, th / 2 - 8, 0, 7); g.fill(); g.shadowBlur = 0;
  // cursor path to the toggle
  const c0 = [W * 0.42, H * 0.9], c1 = [tx + tw * 0.62, ty + th * 0.55];
  const m = smooth(rng(0.1, click - 0.04, p));
  const cx = c0[0] + (c1[0] - c0[0]) * m, cy = c0[1] + (c1[1] - c0[1]) * m;
  const press = rng(click - 0.03, click, p) * (1 - rng(click + 0.02, click + 0.06, p));
  if (press > 0) { g.fillStyle = `rgba(255,255,255,${0.25 * press})`; g.beginPath(); g.arc(cx, cy, 34 * press + 10, 0, 7); g.fill(); }
  g.save(); g.translate(cx, cy); g.scale(1 - press * 0.12, 1 - press * 0.12);
  g.fillStyle = "#fff"; g.strokeStyle = "#000"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.lineTo(11, 33); g.lineTo(20, 52); g.lineTo(28, 48); g.lineTo(19, 30); g.lineTo(34, 30); g.closePath(); g.fill(); g.stroke(); g.restore();
  // toast
  const ta = smooth(rng(click + 0.08, click + 0.16, p));
  if (ta > 0) {
    g.save(); g.globalAlpha = ta; g.fillStyle = "#1c1410"; rr(g, W / 2 - 330, py + ph - 110 + (1 - ta) * 30, 660, 76, 38); g.fill(); g.strokeStyle = reverse ? BRAND.live : BRAND.amber; g.lineWidth = 2; g.stroke();
    g.fillStyle = BRAND.ink; g.font = `600 26px ${JAK}`; g.textAlign = "center";
    g.fillText(reverse ? "Access restored · portal.northwind.io is Live" : "Access paused · portal.northwind.io", W / 2, py + ph - 62 + (1 - ta) * 30); g.restore(); g.textAlign = "left";
  }
}

/* ---------------------------------------------------------------- the client's live portal (before suspension) */
export function drawPortal(g: G, W: number, H: number) {
  g.fillStyle = "#f6f7fb"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e7e9f0"; g.fillRect(0, 0, W, 64);
  g.fillStyle = "#fff"; rr(g, 100, 12, W - 200, 40, 20); g.fill();
  g.fillStyle = "#6b7080"; g.font = `500 20px ${JAK}`; g.fillText("portal.northwind.io", 130, 39);
  g.fillStyle = "#0f1b3d"; g.font = `800 34px ${JAK}`; g.fillText("Northwind", 90, 140);
  ["Dashboard", "Orders", "Customers", "Reports"].forEach((t, i) => { g.fillStyle = "#4a5068"; g.font = `600 22px ${JAK}`; g.fillText(t, 520 + i * 170, 136); });
  g.fillStyle = "#0f1b3d"; g.font = `800 64px ${JAK}`; g.fillText("Good afternoon, Richard.", 90, 270);
  const cards = [["Orders today", "1,284"], ["Revenue", "$48,210"], ["Active users", "3,902"]];
  cards.forEach(([a, b], i) => { const x = 90 + i * ((W - 180) / 3); g.fillStyle = "#fff"; rr(g, x, 330, (W - 180) / 3 - 30, 190, 22); g.fill();
    g.fillStyle = "#6b7080"; g.font = `600 22px ${JAK}`; g.fillText(a, x + 32, 385); g.fillStyle = "#0f1b3d"; g.font = `800 54px ${JAK}`; g.fillText(b, x + 32, 468); });
  g.fillStyle = "#fff"; rr(g, 90, 560, W - 180, H - 620, 22); g.fill();
  g.strokeStyle = "#3b6cff"; g.lineWidth = 5; g.beginPath();
  for (let i = 0; i <= 40; i++) { const x = 130 + i * ((W - 260) / 40), y = H - 110 - (Math.sin(i * 0.35) * 0.5 + 0.5 + i / 60) * 150; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
}

export function drawPortalSwitch(g: G, W: number, H: number, p: number, frame: number) {
  // live → glitch → suspended
  if (p < 0.25) { drawPortal(g, W, H); return; }
  if (p < 0.36) {
    drawPortal(g, W, H);
    for (let i = 0; i < 14; i++) { const y = ((frame * 97 + i * 131) % H); const h = 6 + ((i * 37 + frame * 13) % 40); const dx = ((i * 53 + frame * 29) % 120) - 60;
      g.drawImage(g.canvas, 0, y, W, h, dx, y, W, h); }
    g.fillStyle = `rgba(245,169,60,${0.15 + 0.1 * Math.sin(frame)})`; g.fillRect(0, 0, W, H);
    return;
  }
  drawSuspended(g, W, H, rng(0.36, 0.6, p));
}

export { drawEditor, drawSent, drawTerminal, drawSite, drawSuspended, drawPhone };
