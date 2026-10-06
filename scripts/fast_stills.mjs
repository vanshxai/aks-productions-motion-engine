// Bundle once, render many stills. usage: node scripts/fast_stills.mjs <CompId> <outDir> <scale> f1 f2 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path"; import fs from "fs";
const [comp, outDir, scale, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_CHROME || null;
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl: "angle" } });
const composition = await selectComposition({ serveUrl, id: comp, puppeteerInstance, browserExecutable });
for (const fr of frames) {
  const t = Date.now();
  await renderStill({ composition, serveUrl, frame: +fr, output: `${outDir}/${String(fr).padStart(5, "0")}.png`, scale: +scale, puppeteerInstance, browserExecutable, chromiumOptions: { gl: "angle" } });
  console.log("frame", fr, Date.now() - t, "ms");
}
await puppeteerInstance.close({ silent: true });
