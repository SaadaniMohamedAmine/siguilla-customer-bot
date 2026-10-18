import { build } from "esbuild";
await build({
  entryPoints: ["widget/src/index.ts"],
  outfile: "public/widget/v1.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  legalComments: "none",
  sourcemap: false,
  treeShaking: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
console.log("[widget] built public/widget/v1.js");
