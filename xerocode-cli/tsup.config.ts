import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/index.ts" },
  format: ["cjs"],
  target: "node18",
  platform: "node",
  bundle: true,
  clean: true,
  minify: false,
  sourcemap: false,
  dts: false,
  shims: false,
  // Shebang for direct execution
  banner: { js: "#!/usr/bin/env node" },
  // Force .cjs extension so Node never mis-parses as ESM (safer for npm publish)
  outExtension: () => ({ js: ".cjs" }),
  // Keep node built-ins external; bundle everything else for single-file distro
  external: [],
});
