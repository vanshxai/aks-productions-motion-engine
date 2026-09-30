import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/* ---------- math ---------- */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eio = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eout = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const ein = (t: number) => Math.pow(clamp(t), 3);
export const rng = (a: number, b: number, f: number) => clamp((f - a) / (b - a));
/** smooth pseudo-noise in [-1,1] */
export const noise = (x: number, seed = 0) =>
  (Math.sin(x * 1.7 + seed * 12.3) * 0.5 + Math.sin(x * 2.9 + seed * 5.1) * 0.3 + Math.sin(x * 4.3 + seed * 2.7) * 0.2);
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ---------- glTF loading (blocks the frame until ready) ---------- */
const cache: Record<string, Promise<THREE.Group>> = {};
const loader = new GLTFLoader();
export const loadModel = (path: string) => {
  if (!cache[path]) cache[path] = new Promise((res, rej) => loader.load(staticFile(path), (g) => res(g.scene), undefined, rej));
  return cache[path];
};
export const useModel = (path: string) => {
  const [h] = useState(() => delayRender("model " + path, { timeoutInMilliseconds: 120000 }));
  const [scene, setScene] = useState<THREE.Group | null>(null);
  useEffect(() => {
    loadModel(path).then((s) => { setScene(s); continueRender(h); }).catch((e) => cancelRender(e));
  }, [path, h]);
  return useMemo(() => (scene ? (scene.clone(true) as THREE.Group) : null), [scene]);
};

/* ---------- images / fonts ---------- */
const imgCache: Record<string, Promise<HTMLImageElement>> = {};
export const loadImg = (path: string) => {
  if (!imgCache[path]) imgCache[path] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = staticFile(path); });
  return imgCache[path];
};
export const useImg = (path: string) => {
  const [h] = useState(() => delayRender("img " + path));
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => { loadImg(path).then((i) => { setImg(i); continueRender(h); }).catch((e) => cancelRender(e)); }, [path, h]);
  return img;
};

export const FONT_CSS = `
@font-face{font-family:"Plus Jakarta Sans";font-weight:500;src:url(${staticFile("fonts/plus-jakarta-sans-latin-500-normal.woff2")}) format("woff2")}
@font-face{font-family:"Plus Jakarta Sans";font-weight:600;src:url(${staticFile("fonts/plus-jakarta-sans-latin-600-normal.woff2")}) format("woff2")}
@font-face{font-family:"Plus Jakarta Sans";font-weight:700;src:url(${staticFile("fonts/plus-jakarta-sans-latin-700-normal.woff2")}) format("woff2")}
@font-face{font-family:"Plus Jakarta Sans";font-weight:800;src:url(${staticFile("fonts/plus-jakarta-sans-latin-800-normal.woff2")}) format("woff2")}
@font-face{font-family:"Instrument Serif";font-style:italic;font-weight:400;src:url(${staticFile("fonts/instrument-serif-latin-400-italic.woff2")}) format("woff2")}
@font-face{font-family:"Inter";font-weight:600;src:url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format("woff2")}
@font-face{font-family:"Inter";font-weight:700;src:url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format("woff2")}
@font-face{font-family:"Inter";font-weight:800;src:url(${staticFile("fonts/inter-latin-800-normal.woff2")}) format("woff2")}
`;

/** Blocks the render until every brand font is loaded (with a safety timeout). */
export const useFonts = () => {
  const [h] = useState(() => delayRender("fonts", { timeoutInMilliseconds: 60000 }));
  useEffect(() => {
    const style = document.createElement("style"); style.textContent = FONT_CSS; document.head.appendChild(style);
    const want = ['500 20px "Plus Jakarta Sans"', '600 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"', '800 20px "Plus Jakarta Sans"', 'italic 400 20px "Instrument Serif"', '700 20px "Inter"', '800 20px "Inter"'];
    let done = false; const fin = () => { if (!done) { done = true; continueRender(h); } };
    Promise.all(want.map((f) => (document as any).fonts.load(f, "Aa✦"))).then(fin).catch(fin);
    const t = setTimeout(fin, 8000); return () => clearTimeout(t);
  }, [h]);
};

/* ---------- canvas textures ---------- */
export const useCanvasTexture = (w: number, h: number) =>
  useMemo(() => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return { c, g: c.getContext("2d")!, t };
  }, [w, h]);

export const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};

export const FlagsCtx = React.createContext<string>("");
