import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "node:fs";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(artifactDir, "package.json"), "utf-8"));
const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("Building with rollup...");

  const bundle = await rollup({
    input: path.resolve(artifactDir, "src/index.ts"),
    external: [
      /^node:/,
      /^@workspace\//,
      ...allDeps
        .filter((d) => !d.startsWith("@workspace/"))
        .map((d) => new RegExp(`^${d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`)),
      /\.node$/,
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true, exportConditions: ["workspace", "node"], extensions: [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".json", ".node"] }),
      commonjs(),
      typescript({
        tsconfig: path.join(artifactDir, "tsconfig.json"),
        include: ["**/*.ts", "**/*.tsx"],
        compilerOptions: { noEmit: false, declaration: false, declarationMap: false, skipLibCheck: true },
        noCheck: true,
      }),
    ],
  });

  await bundle.write({
    dir: distDir,
    format: "esm",
    entryFileNames: "index.mjs",
    sourcemap: true,
    banner: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
  });

  await bundle.close();
  console.log("Build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
