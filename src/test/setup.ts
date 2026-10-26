import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/dom";
import { vi } from "vitest";

// Limit oczekiwania na loader warstwy mock (400 ms razy liczba nawigacji w teście), a nie maskowanie błędu.
configure({ asyncUtilTimeout: 5000 });

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Vitest zwraca pusty napis dla importów `?url` arkuszy CSS, przez co powłoka __root
// renderowała <link href=""> i React ostrzegał o pustym href. W przeglądarce Vite podaje
// prawdziwy adres, więc w testach podstawiamy adres arkusza zamiast tłumić ostrzeżenie.
vi.mock("../styles.css?url", () => ({ default: "/src/styles.css" }));
