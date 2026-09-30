import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Real 3D (@remotion/three) needs WebGL. "angle" uses the GPU on a Mac and a fast software path elsewhere.
Config.setChromiumOpenGlRenderer("angle");
// Optional: point at an existing Chrome/Chromium instead of letting Remotion download one.
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
