# Scenariusz E2E katalogu szkoleń

`szkolenia.py` to scenariusz Playwright uruchamiany **ręcznie przez QA**. Nie jest częścią
`bun run test` ani CI — w CI nie ma runnera Pythona, a bramka, która zawsze pada, jest gorsza
od jej braku.

## Warunki wstępne

- Python 3.10+ z pakietem `playwright` (`pip install playwright`)
- Przeglądarka Chromium dla Playwrighta: `playwright install chromium`
- Uruchomiony serwer deweloperski pod `http://localhost:8080` (`bun run dev`)

## Uruchomienie

```bash
python3 tests/e2e/szkolenia.py
```

Wynik `PASS: …` oznacza przejście całego scenariusza; każdy błąd przerywa skrypt z opisem kroku.

## Właściciel

Zespół QA ISKT. Zmiany w scenariuszu uzgadniamy z QA razem ze zmianą zachowania katalogu.
