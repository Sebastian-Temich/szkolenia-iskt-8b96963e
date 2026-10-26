import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Dopasowujemy trasy bez uruchamiania loaderów i renderu: loadery mogą potrzebować serwera
// lub sieci, których w testach brak, a jsdom nie wczytuje arkuszy, na które czeka React.
describe("Routing aplikacji", () => {
  it("dopasowuje stronę dla / zamiast przechodzić do widoku nie znaleziono", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
