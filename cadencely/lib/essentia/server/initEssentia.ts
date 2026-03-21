/**
 * Load Essentia WASM + JS core on the Node server (Next.js route handlers).
 */
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let essentiaPromise: Promise<any> | null = null;

export function getServerEssentia() {
  if (!essentiaPromise) {
    essentiaPromise = (async () => {
      const require = createRequire(import.meta.url);
      const essentiaRoot = path.dirname(
        require.resolve("essentia.js/package.json")
      );
      const dist = path.join(essentiaRoot, "dist");

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const EssentiaWASM = require("essentia.js/dist/essentia-wasm.umd.js");

      EssentiaWASM.locateFile = (file: string) => {
        const full = path.join(dist, file);
        if (fs.existsSync(full)) return full;
        if (file.endsWith(".wasm")) {
          const webWasm = path.join(dist, "essentia-wasm.web.wasm");
          if (fs.existsSync(webWasm)) return webWasm;
        }
        return full;
      };

      await EssentiaWASM.ready;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Essentia = require("essentia.js/dist/essentia.js-core.umd.js");
      return new Essentia(EssentiaWASM);
    })();
  }
  return essentiaPromise;
}
