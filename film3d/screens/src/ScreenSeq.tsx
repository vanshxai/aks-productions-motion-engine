import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { drawEditor, drawSent, drawTerminal, drawSite, drawPhone, drawLock, drawKill, drawPortalSwitch } from "./screens2";
import { useFonts, useImg, rng } from "./lib";

export const SCREENS: Record<string, { w: number; h: number; d: number }> = {
  editor: { w: 1440, h: 900, d: 96 },     // typing, idle (shot 1 background + shot 2 start)
  send: { w: 1440, h: 900, d: 84 },       // shot 2
  lock1: { w: 720, h: 1560, d: 84 },      // shot 4
  chat: { w: 720, h: 1560, d: 72 },       // shot 6
  site: { w: 1440, h: 900, d: 108 },      // shot 8
  term: { w: 1440, h: 900, d: 108 },      // shot 9
  lock2: { w: 720, h: 1560, d: 60 },      // shot 12
  kill: { w: 1440, h: 900, d: 84 },       // shot 13
  portal: { w: 1600, h: 900, d: 72 },     // shot 14
  lock3: { w: 720, h: 1560, d: 72 },      // shot 16
  restore: { w: 1440, h: 900, d: 48 },    // shot 17
};

export const ScreenSeq: React.FC<{ kind: string }> = ({ kind }) => {
  useFonts();
  const f = useCurrentFrame(); const { width: W, height: H, durationInFrames: D } = useVideoConfig();
  const img = useImg("devaegis/dashboard-dark.png");
  const ref = useRef<HTMLCanvasElement>(null);
  const p = f / (D - 1);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textAlign = "left";
    const msg = { app: "Messages", title: "Northwind Client", body: "We'll pay next week.", when: "now", at: 0.14 };
    switch (kind) {
      case "editor": drawEditor(g, W, H, 0.55 + 0.4 * p, f); break;
      case "send": f < 30 ? drawEditor(g, W, H, 0.95 + 0.05 * (f / 30), f) : drawSent(g, W, H, rng(30, 70, f)); break;
      case "lock1": drawLock(g, W, H, p, "11:52", "Thursday, 12 June", [msg]); break;
      case "chat": drawPhone(g, W, H, "ghost", p, f); break;
      case "site": drawSite(g, W, H, Math.min(1, f / 60)); break;
      case "term": drawTerminal(g, W, H, Math.min(1, f / 90), f); break;
      case "lock2": drawLock(g, W, H, p, "4:07", "Monday, 30 June", [{ ...msg, when: "now", at: 0.18 }]); break;
      case "kill": drawKill(g, W, H, img, p, false); break;
      case "portal": drawPortalSwitch(g, W, H, p, f); break;
      case "lock3": drawLock(g, W, H, p, "4:11", "Monday, 30 June", [{ ...msg, when: "4m ago", at: 0 }, { app: "DevAegis", title: "Payment $1,850 received", body: "INV-0042 · Northwind Portal", when: "now", at: 0.16, brand: true }], 0.08); break;
      case "restore": drawKill(g, W, H, img, p, true); break;
    }
  }, [f, kind, img, W, H, p]);
  return <AbsoluteFill style={{ background: "#000" }}><canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} /></AbsoluteFill>;
};
