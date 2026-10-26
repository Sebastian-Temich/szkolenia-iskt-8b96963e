import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { routeTree } from "@/routeTree.gen";

/**
 * Montuje prawdziwy router TanStack na podanym adresie. Bez namiastek: trasy, loadery,
 * validateSearch i ścieżka notFound to kod produkcyjny, więc test sprawdza zachowanie
 * aplikacji, nie wierność atrapy routera.
 */
export function zbudujRouter(sciezka: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [sciezka] }),
    context: {
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    },
  });
}

/** Montuje trasę i czeka, aż loader skończy — stan gotowy widoku. */
export async function zamontujTrase(sciezka: string) {
  const router = zbudujRouter(sciezka);
  await router.load();
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

/** Montuje trasę bez czekania na loader — stan ładowania widoku. */
export function zamontujTraseBezCzekania(sciezka: string) {
  const router = zbudujRouter(sciezka);
  void router.load();
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

/** Adres z historii routera, razem z parametrami wyszukiwania. */
export function adres(router: ReturnType<typeof zbudujRouter>): string {
  return router.history.location.href;
}
