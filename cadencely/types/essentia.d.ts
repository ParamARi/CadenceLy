declare module "essentia.js/dist/essentia-wasm.web.js" {
  const EssentiaWASM: {
    ready: Promise<unknown>;
    locateFile?: (path: string) => string;
    EssentiaJS?: unknown;
  };
  export default EssentiaWASM;
}

declare module "essentia.js/dist/essentia.js-core.umd.js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Essentia: any;
  export default Essentia;
}
