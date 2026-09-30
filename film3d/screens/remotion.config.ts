import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Cloud/Linux without GPU: "swangle". On a Mac use "angle" (GPU).
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as any) || "swangle");
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setDelayRenderTimeoutInMilliseconds(120000);
