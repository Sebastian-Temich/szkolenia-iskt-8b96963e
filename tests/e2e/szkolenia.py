"""Critical public catalog flow; run with python3 tests/e2e/szkolenia.py."""
import asyncio
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1800})
        await page.goto("http://localhost:8080/szkolenia")
        await expect(page.get_by_role("status")).to_have_text("9 szkoleń")
        # Wait for the shared document fonts and hydration before interacting.
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(2000)
        await page.get_by_role("button", name="AI", exact=True).click()
        await expect(page.get_by_role("status")).to_have_text("2 szkolenia")
        await page.get_by_role("searchbox").fill("zzz")
        await expect(page.get_by_role("heading", name="Brak szkoleń dla tych kryteriów")).to_be_visible()
        await page.get_by_role("button", name="Wyczyść filtry").click()
        await expect(page.get_by_role("status")).to_have_text("9 szkoleń")
        await expect(page.get_by_role("searchbox")).to_have_value("")
        await page.get_by_role("button", name="Software", exact=True).click()
        await page.get_by_role("searchbox").fill("python")
        await expect(page.get_by_role("status")).to_have_text("1 szkolenie")
        await page.get_by_role("link").filter(has=page.get_by_role("heading", name="Python od zera")).click()
        await expect(page.get_by_role("heading", name="Czego się nauczysz")).to_be_visible()
        # D11: przed symbolem waluty stoi spacja nierozdzielająca U+00A0, nie zwykła spacja.
        await expect(page.get_by_text("338\u00A0zł", exact=True)).to_be_visible()
        await expect(page.get_by_text("1\u202F690\u00A0zł bez dofinansowania", exact=True)).to_be_visible()
        await expect(page.get_by_role("heading", name="Program szkolenia")).to_be_visible()
        # R3: prawa kolumna drugiej sekcji ma ciemną kartę dofinansowania z makiety.
        await expect(page.get_by_role("complementary", name="Dofinansowanie")).to_be_visible()
        await expect(page.get_by_role("link", name="Sprawdź dofinansowanie")).to_be_visible()
        # R5: powrót ze szczegółu zachowuje filtry, więc wynik zostaje zawężony do jednego.
        # Wcześniej ten skrypt utrwalał utratę filtra jako zachowanie oczekiwane ("9 szkoleń").
        await page.get_by_role("link", name="Katalog", exact=True).last.click()
        await expect(page.get_by_role("status")).to_have_text("1 szkolenie")
        await expect(page.get_by_role("searchbox")).to_have_value("python")
        await expect(page.get_by_role("button", name="Software", exact=True)).to_have_attribute(
            "aria-pressed", "true"
        )
        await page.goto("http://localhost:8080/szkolenia")
        await expect(page.get_by_role("status")).to_have_text("9 szkoleń")
        await page.goto("http://localhost:8080/szkolenia/nie-istnieje")
        await expect(page.get_by_role("heading", name="Nie znaleźliśmy tego szkolenia")).to_be_visible()
        await page.get_by_role("link", name="Wróć do katalogu").click()
        await expect(page.get_by_role("status")).to_have_text("9 szkoleń")
        await browser.close()
        print("PASS: katalog, kategoria, szukanie, czyszczenie, szczegol, powrot z filtrami, 404, katalog")


asyncio.run(main())
