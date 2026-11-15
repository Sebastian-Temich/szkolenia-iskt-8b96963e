import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  KONTA,
  oczekujBrakuPoziomegoPrzewijania,
  otworz,
  powazneNaruszeniaAxe,
  zaloguj,
} from "./pomocnicze";

/**
 * Responsywność serwisu i panelu na telefonie i tablecie (issue #37). Dla każdej strony i
 * szerokości: brak poziomego przewijania strony (tabele panelu przewijają się we własnym
 * kontenerze od 768 px, a na telefonie listy panelu są kartami: #39), menu nagłówka prowadzi do /szkolenia, przyciski główne mają cel dotykowy
 * co najmniej 44×44 px na telefonie, a okno zapisu mieści się w widoku i da się w nim dojść do
 * przycisku wysłania. W chromium zapisuje zrzut pełnej strony do artefaktu CI
 * „responsywnosc-zrzuty” (katalog test-results/responsywnosc-zrzuty, poza repo).
 */

const SZEROKOSCI = [
  { nazwa: "telefon 360", width: 360, height: 740, telefon: true },
  { nazwa: "telefon 390", width: 390, height: 844, telefon: true },
  { nazwa: "tablet 768", width: 768, height: 1024, telefon: false },
  { nazwa: "tablet 1024", width: 1024, height: 1366, telefon: false },
] as const;

/** Najmniejszy cel dotykowy przycisku głównego na telefonie (kryterium issue #37). */
const MIN_CEL_DOTYKOWY = 44;
/** Najmniejszy cel kliknięcia linku (lista kontrolna frontendu, punkt 5; review #37). */
const MIN_CEL_LINKU = 24;
/** Szerokość, od której nagłówek pokazuje pełną nawigację zamiast menu (klasa `xl:`). */
const SZEROKOSC_PELNEJ_NAWIGACJI = 1280;
const KATALOG_ZRZUTOW = "test-results/responsywnosc-zrzuty";

type Strona = {
  nazwa: string;
  plik: string;
  przygotuj: (page: Page) => Promise<void>;
  /** Sprawdzenia strony w stanie po przygotowaniu; zostawiają stronę bez otwartych okien. */
  sprawdz?: (page: Page, okno: { width: number; height: number }) => Promise<void>;
  /** Przyciski główne strony poza menu (cel dotykowy na telefonie). */
  przyciski?: (page: Page) => Locator[];
};

const oknoZapisu = (page: Page) => page.getByRole("dialog", { name: "Zapisz się na szkolenie" });

const STRONY: Strona[] = [
  {
    nazwa: "/",
    plik: "strona-glowna",
    przygotuj: async (page) => {
      await otworz(page, "/");
      await expect(
        page.getByRole("region", { name: "Najczęściej wybierane" }).locator("h3"),
      ).toHaveCount(4);
    },
  },
  {
    nazwa: "/szkolenia z filtrem AI",
    plik: "szkolenia-filtr-ai",
    przygotuj: async (page) => {
      await otworz(page, "/szkolenia?kategoria=AI");
      await expect(page.getByRole("status")).toHaveText("2 szkolenia");
      await expect(page.getByRole("button", { name: "AI", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    },
  },
  {
    nazwa: "/szkolenia/genai z otwartym oknem zapisu",
    plik: "szkolenie-genai-okno-zapisu",
    przygotuj: async (page) => {
      await otworz(page, "/szkolenia/genai");
      await page.getByRole("button", { name: /Zapisz się na szkolenie/ }).click();
      const okno = oknoZapisu(page);
      await expect(okno).toBeVisible();
      await expect(okno.getByLabel("Szkolenie", { exact: true }).locator("option")).toHaveCount(9);
    },
    sprawdz: async (page, wymiary) => {
      const okno = oknoZapisu(page);
      // Okno otwiera się z animacją powiększenia, więc czekamy na stan końcowy.
      await expect
        .poll(async () => {
          const box = await okno.boundingBox();
          if (!box) return "brak okna";
          const poza = [
            box.x < -0.5 && `lewa krawędź ${box.x}`,
            box.y < -0.5 && `górna krawędź ${box.y}`,
            box.x + box.width > wymiary.width + 0.5 &&
              `prawa krawędź ${box.x + box.width} > ${wymiary.width}`,
            box.y + box.height > wymiary.height + 0.5 &&
              `dolna krawędź ${box.y + box.height} > ${wymiary.height}`,
          ].filter(Boolean);
          return poza.length ? poza.join(", ") : "mieści się";
        })
        .toBe("mieści się");
      // Formularz w oknie nie może być szerszy od okna (poziome przewijanie wewnątrz okna).
      const szerokosci = await okno.evaluate((el) => ({
        tresc: el.scrollWidth,
        okno: el.clientWidth,
      }));
      expect(
        szerokosci.tresc,
        `okno zapisu: scrollWidth ${szerokosci.tresc} > ${szerokosci.okno}`,
      ).toBeLessThanOrEqual(szerokosci.okno);
      // Gość przewija okno do końca formularza; przycisk wysłania musi być wtedy cały widoczny.
      // (scrollIntoViewIfNeeded dosuwa przycisk do krawędzi i zostawia ułamek piksela poza nią.)
      await okno.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
      const wyslij = okno.getByRole("button", { name: /Wyślij zgłoszenie/ });
      await expect(wyslij).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    },
    przyciski: (page) => [
      page.getByRole("button", { name: /Zapisz się na szkolenie/ }),
      page.getByRole("button", { name: /Zapytaj o termin dla firmy/ }),
    ],
  },
  {
    nazwa: "/trenerzy",
    plik: "trenerzy",
    przygotuj: async (page) => {
      await otworz(page, "/trenerzy");
      await expect(page.getByRole("link", { name: /Zobacz CV/ })).toHaveCount(6);
    },
  },
  {
    nazwa: "/trenerzy/nowak (profil trenera)",
    plik: "trener-nowak",
    przygotuj: async (page) => {
      await otworz(page, "/trenerzy/nowak");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("dr Anna Nowak");
    },
  },
  {
    nazwa: "/panel (logowanie)",
    plik: "panel-logowanie",
    przygotuj: async (page) => {
      await otworz(page, "/panel");
      await expect(page.getByLabel("Hasło", { exact: true })).toBeVisible();
    },
    przyciski: (page) => [page.getByRole("button", { name: "Zaloguj się" })],
  },
  {
    nazwa: "/panel lista szkoleń (redaktor)",
    plik: "panel-lista-szkolen",
    przygotuj: async (page) => {
      await zaloguj(page, KONTA.redaktor);
      await expect(page.getByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
      await expect(page.getByText("Generatywne AI dla biznesu").first()).toBeVisible();
    },
    sprawdz: (page, okno) => sprawdzListePanelu(page, okno, "Lista szkoleń"),
    przyciski: (page) => akcjePierwszejKarty(page, "Lista szkoleń", "Generatywne AI dla biznesu"),
  },
  {
    nazwa: "/panel/trenerzy lista trenerów (redaktor)",
    plik: "panel-lista-trenerow",
    przygotuj: async (page) => {
      await zaloguj(page, KONTA.redaktor);
      await expect(page.getByRole("heading", { level: 1, name: "Szkolenia" })).toBeVisible();
      await otworz(page, "/panel/trenerzy");
      await expect(page.getByRole("heading", { level: 1, name: "Trenerzy" })).toBeVisible();
      await expect(page.getByText("dr Anna Nowak").first()).toBeVisible();
    },
    sprawdz: (page, okno) => sprawdzListePanelu(page, okno, "Lista trenerów"),
    przyciski: (page) => akcjePierwszejKarty(page, "Lista trenerów", "dr Anna Nowak"),
  },
];

/** Szerokość, od której panel pokazuje tabelę zamiast kart (md, issue #39). */
const SZEROKOSC_TABELI_PANELU = 768;

/**
 * Lista panelu: na telefonie karty bez tabeli i bez poziomego przewijania kontenera listy
 * (#39); od 768 px tabela, która może przewijać się poziomo tylko we własnym kontenerze (#37).
 */
async function sprawdzListePanelu(page: Page, okno: { width: number }, nazwaListy: string) {
  if (okno.width < SZEROKOSC_TABELI_PANELU) {
    const lista = page.getByRole("list", { name: nazwaListy });
    await expect(lista).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    const wymiary = await lista.evaluate((el) => ({
      tresc: el.scrollWidth,
      szerokosc: el.clientWidth,
      prawa: el.getBoundingClientRect().right,
      okno: document.documentElement.clientWidth,
    }));
    expect(
      wymiary.tresc,
      `lista kart: scrollWidth ${wymiary.tresc} > ${wymiary.szerokosc}`,
    ).toBeLessThanOrEqual(wymiary.szerokosc);
    expect(wymiary.prawa).toBeLessThanOrEqual(wymiary.okno);
    return;
  }
  await expect(page.getByRole("list", { name: nazwaListy })).toHaveCount(0);
  const tabela = page.getByRole("table");
  await expect(tabela).toBeVisible();
  const kontener = await tabela.evaluate((t) => {
    const rodzic = t.parentElement;
    if (!rodzic) return { overflowX: "brak rodzica", szerokosc: 0, okno: 0 };
    return {
      overflowX: getComputedStyle(rodzic).overflowX,
      szerokosc: rodzic.getBoundingClientRect().right,
      okno: document.documentElement.clientWidth,
    };
  });
  expect(["auto", "scroll"]).toContain(kontener.overflowX);
  expect(kontener.szerokosc).toBeLessThanOrEqual(kontener.okno);
}

/** Akcje pierwszej karty listy panelu (cele dotykowe ≥ 44×44 px na telefonie, #39). */
function akcjePierwszejKarty(page: Page, nazwaListy: string, nazwa: string): Locator[] {
  const karta = page.getByRole("list", { name: nazwaListy }).getByRole("listitem").first();
  return [
    karta.getByRole("link", { name: `Edytuj: ${nazwa}` }),
    karta.getByRole("button", { name: `Wycofaj: ${nazwa}` }),
    karta.getByRole("button", { name: `Usuń: ${nazwa}` }),
  ];
}

async function oczekujCeluDotykowego(przycisk: Locator, minimum = MIN_CEL_DOTYKOWY) {
  await expect(przycisk).toBeVisible();
  const box = await przycisk.boundingBox();
  expect(box, "przycisk bez wymiarów").not.toBeNull();
  if (!box) return;
  const opis = `${Math.round(box.width)}×${Math.round(box.height)} px`;
  expect(box.width, `szerokość celu ${opis}`).toBeGreaterThanOrEqual(minimum);
  expect(box.height, `wysokość celu ${opis}`).toBeGreaterThanOrEqual(minimum);
}

for (const szerokosc of SZEROKOSCI) {
  test.describe(`Responsywność ${szerokosc.nazwa} (${szerokosc.width}×${szerokosc.height})`, () => {
    test.use({ viewport: { width: szerokosc.width, height: szerokosc.height } });

    for (const strona of STRONY) {
      test(`${strona.nazwa}: bez poziomego przewijania, menu prowadzi do /szkolenia${
        szerokosc.telefon ? ", cele dotykowe ≥ 44 px" : ""
      }`, async ({ page }, testInfo) => {
        await strona.przygotuj(page);
        await oczekujBrakuPoziomegoPrzewijania(page);

        if (testInfo.project.name === "chromium") {
          const sciezka = `${KATALOG_ZRZUTOW}/${strona.plik}-${szerokosc.width}x${szerokosc.height}.png`;
          await page.screenshot({ path: sciezka, fullPage: true });
          await testInfo.attach(`${strona.plik}-${szerokosc.width}`, {
            path: sciezka,
            contentType: "image/png",
          });
        }

        await strona.sprawdz?.(page, szerokosc);

        const menu = page.getByRole("button", { name: "Otwórz menu" });
        if (szerokosc.telefon) {
          for (const przycisk of [...(strona.przyciski?.(page) ?? []), menu]) {
            await oczekujCeluDotykowego(przycisk);
          }
        }

        if (szerokosc.width < SZEROKOSC_PELNEJ_NAWIGACJI) {
          await menu.click();
          const nawigacja = page.getByRole("navigation", { name: "Nawigacja mobilna" });
          await expect(nawigacja).toBeVisible();
          await oczekujBrakuPoziomegoPrzewijania(page);
          // Review #37 (iteracja 2): linki menu mają cel kliknięcia co najmniej 24×24 px.
          const linki = nawigacja.getByRole("link");
          await expect(linki).toHaveCount(6);
          for (const link of await linki.all()) {
            await oczekujCeluDotykowego(link, MIN_CEL_LINKU);
          }
          await nawigacja.getByRole("link", { name: "Katalog", exact: true }).click();
          await expect(page).toHaveURL(/\/szkolenia(\?.*)?$/);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(nawigacja).toHaveCount(0);
        }
      });
    }
  });
}

/** Panel na telefonie: karty zamiast tabeli (issue #39). */
for (const szerokosc of SZEROKOSCI) {
  test.describe(`Panel: lista szkoleń ${szerokosc.nazwa} (#39)`, () => {
    test.use({ viewport: { width: szerokosc.width, height: szerokosc.height } });

    if (szerokosc.width < SZEROKOSC_TABELI_PANELU) {
      test("karty bez tabeli; pierwsza karta ma tytuł i kategorię, a edycja otwiera formularz", async ({
        page,
      }) => {
        await zaloguj(page, KONTA.redaktor);
        const lista = page.getByRole("list", { name: "Lista szkoleń" });
        await expect(lista).toBeVisible();
        await expect(page.getByRole("table")).toHaveCount(0);
        const karta = lista.getByRole("listitem").first();
        await expect(
          karta.getByRole("heading", { level: 2, name: "Generatywne AI dla biznesu" }),
        ).toBeVisible();
        await expect(karta.getByText("AI", { exact: true })).toBeVisible();
        await karta.getByRole("link", { name: "Edytuj: Generatywne AI dla biznesu" }).click();
        await expect(page).toHaveURL(/\/panel\/szkolenia\/genai$/);
        await expect(
          page.getByRole("heading", { level: 1, name: "Edycja: Generatywne AI dla biznesu" }),
        ).toBeVisible();
      });
    } else {
      test("tabela zamiast kart", async ({ page }) => {
        await zaloguj(page, KONTA.redaktor);
        await expect(page.getByRole("table")).toBeVisible();
        await expect(page.getByRole("list", { name: "Lista szkoleń" })).toHaveCount(0);
      });
    }

    if (szerokosc.width === 390) {
      test("axe: lista kart bez naruszeń serious i critical", async ({ page }) => {
        await zaloguj(page, KONTA.redaktor);
        await expect(page.getByRole("list", { name: "Lista szkoleń" })).toBeVisible();
        expect(await powazneNaruszeniaAxe(page)).toEqual([]);
      });
    }
  });
}
