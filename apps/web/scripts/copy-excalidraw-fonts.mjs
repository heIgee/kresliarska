import { cpSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const excalidrawDist = dirname(require.resolve("@excalidraw/excalidraw"));
const publicFonts = join(dirname(fileURLToPath(import.meta.url)), "../public/fonts");

cpSync(join(excalidrawDist, "fonts"), publicFonts, { recursive: true });
