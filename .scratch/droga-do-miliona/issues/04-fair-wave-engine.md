# 04 — Przebudować generator fal

**What to build:** Zapewnić różnorodne, uczciwe i płynnie wjeżdżające fale przeszkód oraz paczek, które pozostają czytelne na wszystkich obsługiwanych prędkościach i viewportach.

Blocked by: 01

Status: ready-for-agent

- [x] Generator udostępnia 12–16 osiągalnych wzorów paczek o liczebności od 1 do 7.
- [x] Generator udostępnia 16–20 wzorów przeszkód wykorzystujących realne obiekty magazynowe i oba działania gracza.
- [x] Shuffle bag zapobiega bezpośredniemu powtarzaniu tego samego wzoru i pokazuje różnorodność przed nowym cyklem.
- [x] Cała fala, wraz z paczkami, powstaje w całości poza prawą krawędzią i płynnie wjeżdża ze wspólną prędkością świata.
- [x] Minimalny czas reakcji wynika z aktualnej prędkości; wzory pozostają uczciwe w story i challenge.
- [x] Hitboxy paczek nie przecinają przeszkód, a bonus nie wymaga działania sprzecznego z najbliższym zagrożeniem.
- [x] Autopilot, czytanie, odliczanie, celebracja i resize nie powodują pojawienia się nowej fali w widocznym obszarze.
- [x] Deterministyczne testy wielu seedów pokrywają pełny zakres prędkości i minimalny viewport 390 px.
