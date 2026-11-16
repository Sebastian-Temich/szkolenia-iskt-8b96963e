import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { czytajKonfiguracje, obsluzZgloszenie, type Kontekst } from "@/lib/zgloszenia/obsluga";
import { adresKlienta, utworzLimiter, type Limiter } from "@/lib/zgloszenia/limit";
import { utworzLog } from "@/lib/zgloszenia/log";
import { ADRES_RESEND, type Konfiguracja } from "@/lib/zgloszenia/resend";

/**
 * Issue #46, W-12/K1, K3, K4, K5, K7, K9, W-14: obsługa zgłoszenia po stronie serwera z atrapą
 * `fetch` zamiast Resend. Żaden test nie wysyła prawdziwego e-maila (ADR-004 pkt 3).
 */

const KONFIGURACJA: Konfiguracja = {
  kluczResend: "re_test_klucz",
  odbiorca: "biuro@example.com",
  nadawca: "Szkolenia ISKT <formularz@example.com>",
  naglowekIp: undefined,
};

const DANE_OSOBOWE = {
  imie: "Janina Testowa",
  email: "janina@example.com",
  telefon: "+48 600 111 222",
  wiadomosc: "Proszę o termin szkolenia w maju.",
};

const poprawne = (zmiany: Record<string, unknown> = {}) => ({
  zrodlo: "zapis",
  odbiorca: "individual",
  ...DANE_OSOBOWE,
  szkolenie: "genai",
  szkolenieTytul: "Generatywne AI dla biznesu",
  obszar: "AI i narzędzia generatywne",
  zgoda: true,
  strona: "/szkolenia/genai",
  strona_www: "",
  ...zmiany,
});

type Wywolanie = { url: string; init: RequestInit };

function atrapaFetch(odpowiedz: () => Promise<Response> | Response) {
  const wywolania: Wywolanie[] = [];
  const fn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    wywolania.push({ url: String(url), init: init ?? {} });
    return odpowiedz();
  });
  return { fn: fn as unknown as typeof fetch, wywolania };
}

const okResend = () =>
  new Response(JSON.stringify({ id: "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" }), { status: 200 });

let linieLogu: string[];
let limiter: Limiter;

beforeEach(() => {
  linieLogu = [];
  limiter = utworzLimiter();
});

function kontekst(zmiany: Partial<Kontekst> = {}): Kontekst {
  return {
    konfiguracja: KONFIGURACJA,
    fetch: atrapaFetch(okResend).fn,
    limiter,
    log: utworzLog((linia) => linieLogu.push(linia)),
    adres: "203.0.113.7",
    teraz: () => new Date("2026-11-15T10:30:00Z"),
    ...zmiany,
  };
}

const cialo = (w: Wywolanie) => JSON.parse(String(w.init.body)) as Record<string, unknown>;

describe("W-12/K1: wysyłka przez Resend z atrapą fetch", () => {
  it("jedno wywołanie Resend z from, to z konfiguracji, reply_to zgłaszającego i tematem R4", async () => {
    const atrapa = atrapaFetch(okResend);
    const odp = await obsluzZgloszenie(poprawne(), kontekst({ fetch: atrapa.fn }));
    expect(odp).toEqual({ status: 200, tresc: { wynik: "ok" } });
    expect(atrapa.wywolania).toHaveLength(1);
    const [w] = atrapa.wywolania;
    if (!w) throw new Error("test: brak wywołania");
    expect(w.url).toBe(ADRES_RESEND);
    expect(w.init.method).toBe("POST");
    expect(new Headers(w.init.headers).get("authorization")).toBe("Bearer re_test_klucz");
    const b = cialo(w);
    expect(b["from"]).toBe("Szkolenia ISKT <formularz@example.com>");
    expect(b["to"]).toEqual(["biuro@example.com"]);
    expect(b["reply_to"]).toBe("janina@example.com");
    expect(b["subject"]).toBe("[Zapis] Generatywne AI dla biznesu – Janina Testowa");
  });

  it("treść tekstowa i HTML zawierają wszystkie pola, stronę i datę w czasie polskim (R5)", async () => {
    const atrapa = atrapaFetch(okResend);
    await obsluzZgloszenie(poprawne(), kontekst({ fetch: atrapa.fn }));
    const b = cialo(atrapa.wywolania[0] as Wywolanie);
    for (const tresc of [String(b["text"]), String(b["html"])]) {
      for (const fragment of [
        "Osoba indywidualna",
        "Janina Testowa",
        "janina@example.com",
        "+48 600 111 222",
        "Generatywne AI dla biznesu",
        "AI i narzędzia generatywne",
        "Proszę o termin szkolenia w maju.",
        "Zgoda na kontakt",
        "/szkolenia/genai",
        "15 listopada 2026 11:30",
      ]) {
        expect(tresc).toContain(fragment);
      }
    }
  });

  it("temat R4: [Kontakt] OBSZAR, [Firma] SZKOLENIE, [Firma] bez szkolenia z obszarem", async () => {
    const tematy: string[] = [];
    const przypadki = [
      poprawne({ zrodlo: "kontakt", szkolenie: undefined, szkolenieTytul: undefined }),
      poprawne({ zrodlo: "firma", odbiorca: "company" }),
    ];
    for (const dane of przypadki) {
      const atrapa = atrapaFetch(okResend);
      await obsluzZgloszenie(dane, kontekst({ fetch: atrapa.fn }));
      tematy.push(String(cialo(atrapa.wywolania[0] as Wywolanie)["subject"]));
    }
    expect(tematy).toEqual([
      "[Kontakt] AI i narzędzia generatywne – Janina Testowa",
      "[Firma] Generatywne AI dla biznesu – Janina Testowa",
    ]);
  });
});

describe("W-12/K7: escapowanie treści i temat bez nowej linii", () => {
  it("HTML i emoji w polach są escapowane, a nowa linia w imieniu nie trafia do tematu", async () => {
    const atrapa = atrapaFetch(okResend);
    const odp = await obsluzZgloszenie(
      poprawne({
        imie: "Jan\r\nBcc: zly@example.com",
        wiadomosc: '<script>alert("x")</script> <b>pilne</b> 🎉 & więcej',
      }),
      kontekst({ fetch: atrapa.fn }),
    );
    expect(odp.status).toBe(200);
    const b = cialo(atrapa.wywolania[0] as Wywolanie);
    const temat = String(b["subject"]);
    expect(temat).not.toMatch(/[\r\n]/);
    expect(temat).toBe("[Zapis] Generatywne AI dla biznesu – Jan Bcc: zly@example.com");
    const html = String(b["html"]);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>pilne</b>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;pilne&lt;/b&gt; 🎉 &amp; więcej");
  });
});

describe("W-12/K3: błąd usługi i konfiguracji", () => {
  it("Resend zwraca 500: stan błędu (502), log z kodem", async () => {
    const atrapa = atrapaFetch(() => new Response("{}", { status: 500 }));
    const odp = await obsluzZgloszenie(poprawne(), kontekst({ fetch: atrapa.fn }));
    expect(odp).toEqual({ status: 502, tresc: { wynik: "blad" } });
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=resend status=500"]);
  });

  it("Resend nie odpowiada w limicie czasu: stan błędu (502), status=timeout", async () => {
    const wiszacy = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, odrzuc) => {
          init?.signal?.addEventListener("abort", () => odrzuc(init.signal?.reason));
        }),
    );
    const odp = await obsluzZgloszenie(
      poprawne(),
      kontekst({ fetch: wiszacy as unknown as typeof fetch, limitCzasuMs: 20 }),
    );
    expect(odp).toEqual({ status: 502, tresc: { wynik: "blad" } });
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=resend status=timeout"]);
  });

  it("review PR #49: nagłówki 200, ale treść nie dochodzi w limicie czasu: błąd (502), nie sukces", async () => {
    const wolnaTresc = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: () =>
        new Promise((_, odrzuc) => {
          init?.signal?.addEventListener("abort", () => odrzuc(init.signal?.reason));
        }),
    }));
    const odp = await obsluzZgloszenie(
      poprawne(),
      kontekst({ fetch: wolnaTresc as unknown as typeof fetch, limitCzasuMs: 20 }),
    );
    expect(odp).toEqual({ status: 502, tresc: { wynik: "blad" } });
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=resend status=timeout"]);
  });

  it("review PR #49: zerwane połączenie przy odczycie treści po 200: błąd (502)", async () => {
    const zerwana = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: () => Promise.reject(new TypeError("terminated")),
    }));
    const odp = await obsluzZgloszenie(
      poprawne(),
      kontekst({ fetch: zerwana as unknown as typeof fetch }),
    );
    expect(odp).toEqual({ status: 502, tresc: { wynik: "blad" } });
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=resend status=siec"]);
  });

  it("200 z treścią, która nie jest JSON-em: e-mail przyjęty, sukces bez id", async () => {
    const odp = await obsluzZgloszenie(
      poprawne(),
      kontekst({ fetch: atrapaFetch(() => new Response("nie json", { status: 200 })).fn }),
    );
    expect(odp.status).toBe(200);
    expect(linieLogu).toEqual(["zgloszenie wyslane zrodlo=zapis"]);
  });

  it("domyślny limit czasu to 10 s (AbortSignal.timeout(10000))", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await obsluzZgloszenie(poprawne(), kontekst());
    expect(timeout).toHaveBeenCalledWith(10_000);
    timeout.mockRestore();
  });

  it("błąd sieci: stan błędu (502)", async () => {
    const atrapa = atrapaFetch(() => {
      throw new TypeError("fetch failed");
    });
    const odp = await obsluzZgloszenie(poprawne(), kontekst({ fetch: atrapa.fn }));
    expect(odp.status).toBe(502);
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=resend status=siec"]);
  });

  it("brak konfiguracji: stan błędu (503) bez wywołania Resend", async () => {
    const atrapa = atrapaFetch(okResend);
    const odp = await obsluzZgloszenie(
      poprawne(),
      kontekst({ fetch: atrapa.fn, konfiguracja: undefined }),
    );
    expect(odp).toEqual({ status: 503, tresc: { wynik: "blad" } });
    expect(atrapa.wywolania).toHaveLength(0);
    expect(linieLogu).toEqual(["zgloszenie blad zrodlo=zapis powod=konfiguracja"]);
  });

  it("czytajKonfiguracje: brak którejkolwiek zmiennej wymaganej daje brak konfiguracji", () => {
    const pelne = {
      RESEND_API_KEY: "re_x",
      ZGLOSZENIA_ODBIORCA: "biuro@example.com",
      ZGLOSZENIA_NADAWCA: "Szkolenia ISKT <formularz@example.com>",
    };
    expect(czytajKonfiguracje(pelne)).toEqual({
      kluczResend: "re_x",
      odbiorca: "biuro@example.com",
      nadawca: "Szkolenia ISKT <formularz@example.com>",
      naglowekIp: undefined,
    });
    for (const brak of Object.keys(pelne)) {
      expect(czytajKonfiguracje({ ...pelne, [brak]: "" })).toBeUndefined();
    }
    expect(
      czytajKonfiguracje({ ...pelne, ZGLOSZENIA_NAGLOWEK_IP: "cf-connecting-ip" })?.naglowekIp,
    ).toBe("cf-connecting-ip");
  });
});

describe("W-12/K4: pole-pułapka", () => {
  it("wypełniona pułapka: udawany sukces bez wywołania Resend", async () => {
    const atrapa = atrapaFetch(okResend);
    const odp = await obsluzZgloszenie(
      poprawne({ strona_www: "https://spam.example.com" }),
      kontekst({ fetch: atrapa.fn }),
    );
    expect(odp).toEqual({ status: 200, tresc: { wynik: "ok" } });
    expect(atrapa.wywolania).toHaveLength(0);
    expect(linieLogu).toEqual(["zgloszenie odrzucone zrodlo=zapis powod=pulapka"]);
  });
});

describe("Walidacja serwera (W-12/K2, serwer rozstrzyga)", () => {
  it("błędne pola dają 400 z nazwami pól bez wywołania Resend", async () => {
    const atrapa = atrapaFetch(okResend);
    const odp = await obsluzZgloszenie(
      poprawne({ email: "zly", telefon: "12", zgoda: false }),
      kontekst({ fetch: atrapa.fn }),
    );
    expect(odp).toEqual({
      status: 400,
      tresc: { wynik: "walidacja", pola: ["email", "telefon", "zgoda"] },
    });
    expect(atrapa.wywolania).toHaveLength(0);
    expect(linieLogu).toEqual([
      "zgloszenie odrzucone zrodlo=zapis powod=walidacja pola=email,telefon,zgoda",
    ]);
  });

  it("okno bez wybranego szkolenia daje błąd pola szkolenie", async () => {
    const odp = await obsluzZgloszenie(
      poprawne({ zrodlo: "firma", szkolenie: "", szkolenieTytul: undefined }),
      kontekst(),
    );
    expect(odp.tresc).toEqual({ wynik: "walidacja", pola: ["szkolenie"] });
  });

  it("dane spoza formularza (nie obiekt) dają 400", async () => {
    expect((await obsluzZgloszenie("x", kontekst())).status).toBe(400);
    expect((await obsluzZgloszenie(null, kontekst())).status).toBe(400);
  });
});

describe("W-12/K5: limit zgłoszeń", () => {
  it("szóste zgłoszenie z jednego adresu w 10 min daje „Za dużo prób” bez wywołania Resend", async () => {
    const atrapa = atrapaFetch(okResend);
    const wyniki: number[] = [];
    for (let i = 0; i < 6; i++) {
      const odp = await obsluzZgloszenie(
        poprawne(),
        kontekst({ fetch: atrapa.fn, teraz: () => new Date(Date.UTC(2026, 10, 15, 10, i)) }),
      );
      wyniki.push(odp.status);
    }
    expect(wyniki).toEqual([200, 200, 200, 200, 200, 429]);
    expect(atrapa.wywolania).toHaveLength(5);
    expect(linieLogu.at(-1)).toBe("zgloszenie odrzucone zrodlo=zapis powod=limit");
  });

  it("po 10 minutach od pierwszego zgłoszenia adres może wysłać znowu (okno przesuwne)", async () => {
    for (let i = 0; i < 5; i++) {
      await obsluzZgloszenie(
        poprawne(),
        kontekst({ teraz: () => new Date(Date.UTC(2026, 10, 15, 10, i)) }),
      );
    }
    const poOknie = await obsluzZgloszenie(
      poprawne(),
      kontekst({ teraz: () => new Date(Date.UTC(2026, 10, 15, 10, 10)) }),
    );
    expect(poOknie.status).toBe(200);
  });

  it("zmieniany x-forwarded-for nie zeruje limitu: adres pochodzi z połączenia", async () => {
    const statusy: number[] = [];
    for (let i = 0; i < 6; i++) {
      const naglowki = new Headers({ "x-forwarded-for": `198.51.100.${i}` });
      const adres = adresKlienta({
        naglowekIp: undefined,
        naglowki,
        adresPolaczenia: "203.0.113.7",
      });
      statusy.push((await obsluzZgloszenie(poprawne(), kontekst({ adres }))).status);
    }
    expect(statusy).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("nagłówek platformy jest czytany tylko przy ustawionej ZGLOSZENIA_NAGLOWEK_IP", () => {
    const naglowki = new Headers({
      "x-forwarded-for": "198.51.100.1",
      "cf-connecting-ip": "192.0.2.44",
    });
    expect(adresKlienta({ naglowekIp: undefined, naglowki, adresPolaczenia: "203.0.113.7" })).toBe(
      "203.0.113.7",
    );
    expect(
      adresKlienta({ naglowekIp: "cf-connecting-ip", naglowki, adresPolaczenia: "203.0.113.7" }),
    ).toBe("192.0.2.44");
    expect(adresKlienta({ naglowekIp: undefined, naglowki, adresPolaczenia: undefined })).toBe(
      "nieznany",
    );
  });

  it("W-19/O-37b: ZGLOSZENIA_NAGLOWEK_IP=x-vercel-forwarded-for: adres z nagłówka Vercel, nie z x-forwarded-for", () => {
    const konfiguracja = czytajKonfiguracje({
      RESEND_API_KEY: "re_x",
      ZGLOSZENIA_ODBIORCA: "biuro@example.com",
      ZGLOSZENIA_NADAWCA: "Szkolenia ISKT <formularz@example.com>",
      ZGLOSZENIA_NAGLOWEK_IP: "x-vercel-forwarded-for",
    });
    expect(konfiguracja?.naglowekIp).toBe("x-vercel-forwarded-for");
    const naglowki = new Headers({
      "x-forwarded-for": "198.51.100.1",
      "x-vercel-forwarded-for": "192.0.2.55",
    });
    expect(
      adresKlienta({
        naglowekIp: konfiguracja?.naglowekIp,
        naglowki,
        adresPolaczenia: "10.0.0.1",
      }),
    ).toBe("192.0.2.55");
  });

  it("W-19/O-37b: przy x-vercel-forwarded-for zmieniany x-forwarded-for nie zeruje limitu", async () => {
    const statusy: number[] = [];
    for (let i = 0; i < 6; i++) {
      const naglowki = new Headers({
        "x-forwarded-for": `198.51.100.${i}`,
        "x-vercel-forwarded-for": "192.0.2.55",
      });
      const adres = adresKlienta({
        naglowekIp: "x-vercel-forwarded-for",
        naglowki,
        // Na Vercel adres gniazda to adres proxy platformy, różny przy kolejnych żądaniach.
        adresPolaczenia: `10.0.0.${i}`,
      });
      expect(adres).toBe("192.0.2.55");
      const odp = await obsluzZgloszenie(
        poprawne(),
        kontekst({ adres, teraz: () => new Date(Date.UTC(2026, 10, 15, 10, i)) }),
      );
      statusy.push(odp.status);
    }
    expect(statusy).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("51. wysyłka w godzinie z różnych adresów daje „Za dużo prób”", async () => {
    const atrapa = atrapaFetch(okResend);
    const statusy: number[] = [];
    for (let i = 0; i < 51; i++) {
      const odp = await obsluzZgloszenie(
        poprawne(),
        kontekst({
          fetch: atrapa.fn,
          adres: `192.0.2.${i}`,
          teraz: () => new Date(Date.UTC(2026, 10, 15, 10, 0, i)),
        }),
      );
      statusy.push(odp.status);
    }
    expect(statusy.slice(0, 50).every((s) => s === 200)).toBe(true);
    expect(statusy[50]).toBe(429);
    expect(atrapa.wywolania).toHaveLength(50);
  });

  it("81. wysyłka w dobie daje „Za dużo prób” (limit dobowy, plan Resend)", () => {
    const l = utworzLimiter();
    const godzina = 60 * 60 * 1000;
    const wyniki: boolean[] = [];
    // Wysyłka co 15 minut: 4 na godzinę (pod limitem godzinowym), 81. po 20 h od pierwszej.
    for (let i = 0; i < 81; i++) wyniki.push(l.wysylka(i * (godzina / 4)));
    expect(wyniki.slice(0, 80).every(Boolean)).toBe(true);
    expect(wyniki[80]).toBe(false);
  });
});

describe("W-12/K9, W-14: logi bez danych osobowych, brak zapisu do bazy", () => {
  it("logi sukcesu, błędu, odrzucenia i walidacji nie zawierają imienia, e-maila, telefonu ani treści", async () => {
    const konsola = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = utworzLog();
    const przebiegi: Partial<Kontekst>[] = [
      {},
      { fetch: atrapaFetch(() => new Response("{}", { status: 500 })).fn },
      { konfiguracja: undefined },
    ];
    for (const zmiany of przebiegi) {
      await obsluzZgloszenie(poprawne(), kontekst({ ...zmiany, log, limiter: utworzLimiter() }));
    }
    await obsluzZgloszenie(poprawne({ strona_www: "x" }), kontekst({ log }));
    await obsluzZgloszenie(poprawne({ email: "zle" }), kontekst({ log }));
    const lim = utworzLimiter();
    for (let i = 0; i < 6; i++) await obsluzZgloszenie(poprawne(), kontekst({ log, limiter: lim }));

    const wpisy = konsola.mock.calls.map((args) => args.map(String).join(" "));
    konsola.mockRestore();
    expect(wpisy.some((w) => w.startsWith("zgloszenie wyslane zrodlo=zapis id_resend="))).toBe(
      true,
    );
    expect(wpisy).toContain("zgloszenie blad zrodlo=zapis powod=resend status=500");
    expect(wpisy).toContain("zgloszenie blad zrodlo=zapis powod=konfiguracja");
    expect(wpisy).toContain("zgloszenie odrzucone zrodlo=zapis powod=pulapka");
    expect(wpisy).toContain("zgloszenie odrzucone zrodlo=zapis powod=walidacja pola=email");
    expect(wpisy).toContain("zgloszenie odrzucone zrodlo=zapis powod=limit");
    const calosc = wpisy.join("\n");
    for (const wartosc of [
      ...Object.values(DANE_OSOBOWE),
      "zle",
      "Janina",
      "600 111",
      "203.0.113.7",
    ]) {
      expect(calosc).not.toContain(wartosc);
    }
  });

  it("logger odrzuca wartości spoza białej listy", () => {
    const linie: string[] = [];
    const log = utworzLog((l) => linie.push(l));
    log("blad", {
      zrodlo: "janina@example.com",
      status: "Janina Testowa",
      id_resend: "jan kowalski <a@b.pl>",
      pola: ["imie", "Janina Testowa"],
    });
    expect(linie).toEqual(["zgloszenie blad status=inny pola=imie"]);
  });

  it("moduł zgłoszeń nie importuje klienta Supabase ani niczego z bazy (R6)", () => {
    const katalog = path.resolve(__dirname, "../lib/zgloszenia");
    const pliki = readdirSync(katalog).filter((p) => p.endsWith(".ts"));
    expect(pliki.length).toBeGreaterThan(0);
    for (const plik of pliki) {
      const kod = readFileSync(path.join(katalog, plik), "utf8");
      expect(kod, plik).not.toMatch(/supabase/i);
      expect(kod, plik).not.toMatch(/@\/lib\/szkolenia|@\/lib\/panel/);
    }
  });
});
