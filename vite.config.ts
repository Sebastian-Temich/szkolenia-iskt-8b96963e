// Build bez @lovable.dev/vite-tanstack-config (ADR-006 pkt 1, issue #70). Konfiguracja odtwarza
// zachowania wrappera Lovable, których aplikacja potrzebuje: devtools tylko w dev, tanstackStart z
// ochroną importów serwerowych, nitro (tu preset vercel, region fra1), React, Tailwind, ścieżki z
// tsconfig, alias @, wstrzyknięcie VITE_*, dedupe React/TanStack Query, lightningcss i port 8080.
// Pominięte celowo: diagnostyka i proxy podglądu Lovable (działały tylko w piaskownicy Lovable).
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type PluginOption, type UserConfig } from "vite";

const katalogSrc = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Wtyczka naprawy komentarza w src/styles.css (reguła z Lovable): dostarczony opis zawiera
 * przypadkowe zakończenie komentarza CSS. Naprawiamy tylko wejście kompilatora; plik właściciela
 * zostaje bajt w bajt.
 */
const naprawaKomentarzaStyles: PluginOption = {
  name: "iskt-verbatim-brand-comments",
  enforce: "pre",
  async load(id) {
    const path = id.split("?")[0];
    if (!path?.endsWith("/src/styles.css")) return;
    if (id.includes("?url")) return;
    const source = await readFile(path, "utf8");
    return source.replaceAll("--ink-*/--green-*", "--ink-* / --green-*");
  },
};

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const devtools =
    mode === "development"
      ? [
          (await import("@tanstack/devtools-vite")).devtools({
            logging: false,
            eventBusConfig: { enabled: false },
            enhancedLogs: { enabled: false },
            consolePiping: { enabled: false },
            removeDevtoolsOnBuild: false,
            injectSource: { enabled: true },
          }),
        ]
      : [];

  // Zmienne VITE_* wpisane w kod klienta i serwera w czasie budowania (jak w wrapperze Lovable).
  const envDefine = Object.fromEntries(
    Object.entries(loadEnv(mode, process.cwd(), "VITE_")).map(([klucz, wartosc]) => [
      `import.meta.env.${klucz}`,
      JSON.stringify(wartosc),
    ]),
  );

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      tsconfigPaths: true,
      alias: { "@": katalogSrc },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: "::", port: 8080 },
    plugins: [
      ...devtools,
      naprawaKomentarzaStyles,
      tailwindcss(),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        // src/server.ts (obsługa błędów SSR) jako wejście serwera; nitro buduje z niego funkcję.
        server: { entry: "server" },
      }),
      // nitro tylko przy budowaniu (jak w wrapperze Lovable): `pnpm dev` zostaje zwykłym serwerem Vite.
      ...(command === "build"
        ? [nitro({ preset: "vercel", vercel: { functions: { regions: ["fra1"] } } })]
        : []),
      viteReact(),
    ],
  };
});
