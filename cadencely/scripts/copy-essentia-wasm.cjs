/**
 * Copy Essentia WebAssembly binary into public/ so the browser can load it at /essentia/essentia-wasm.web.wasm
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../node_modules/essentia.js/dist/essentia-wasm.web.wasm");
const destDir = path.join(__dirname, "../public/essentia");
const dest = path.join(destDir, "essentia-wasm.web.wasm");

if (!fs.existsSync(src)) {
  console.warn("[copy-essentia-wasm] essentia-wasm.web.wasm not found; skip (is essentia.js installed?)");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("[copy-essentia-wasm] Copied to public/essentia/essentia-wasm.web.wasm");
