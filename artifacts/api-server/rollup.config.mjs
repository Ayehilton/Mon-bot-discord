import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const allDeps = Object.keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
});

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
    entryFileNames: "index.mjs",
    sourcemap: true,
    banner: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
  },
  external: [
    /^node:/,
    /^@workspace\//,
    ...allDeps,
    /\.node$/,
  ],
  plugins: [
    nodeResolve({ preferBuiltins: true, exportConditions: ["workspace", "node"] }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: { noEmit: false, declaration: false, declarationMap: false },
    }),
  ],
};
