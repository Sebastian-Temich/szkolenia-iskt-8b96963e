// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { readFile } from "node:fs/promises";

export default defineConfig({
  vite: {
    plugins: [
      {
        name: "iskt-verbatim-brand-comments",
        enforce: "pre",
        async load(id) {
          const path = id.split("?")[0];
          if (!path?.endsWith("/src/styles.css")) return;
          if (id.includes("?url")) return;
          // The supplied prose contains an accidental CSS comment terminator.
          // Repair only the compiler input; keep the owner's file byte-for-byte.
          const source = await readFile(path, "utf8");
          return source.replaceAll("--ink-*/--green-*", "--ink-* / --green-*");
        },
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
