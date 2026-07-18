# Odbiór Droga do Miliona v11 — balans paczek i sprzętu

Data: 2026-07-18

## Wynik automatyczny

- `npm test`: 40 plików, 302 testy — PASS.
- `npm run typecheck` — PASS.
- `npm run build:all` — PASS.
- Autonomiczny `droga-do-miliona-qa.html`: przebudowany; 42 obrazy osadzone w 42 odwołaniach.
- Test pojedynczego pliku potwierdza osadzone assety i politykę bezpiecznych zasobów.
- Deterministyczna sesja przechodzi fabułę, milion, challenge, game over i ponowienie.
- Generator: fabuła 3–6 paczek + maks. 1 sprzęt; challenge 5–8 + 1–2 sprzęty.
- Długa próbka challenge: około 80/20, brak sąsiedniego sprzętu, rotacja czterech typów i limity 8/12 s.
- Geometria: wiele seedów, wszystkie rodziny przeszkód i prędkości do 3,5×; maks. 7 widocznych collectible.
- Ekonomia i profil: 100/250, osobny licznik paczek, pominięcie bez kary i rekord v11 z idempotentną migracją.
- DOM/audio: osobny feedback i dźwięk paczki/sprzętu, 600 ms oraz globalne wyciszenie.

## Znane ograniczenia

- W środowisku wykonawczym nie był dostępny sterowalny browser, więc nie wykonano ręcznej kontroli konsoli lokalnego HTML.
- Nie wykonano ręcznego odbioru czytelności na desktopie i realnym telefonie.
- Płynność najgęstszych tras jest chroniona stałymi pulami i testami logiki, ale widoczny FPS/szarpanie wymaga obserwacji na docelowych urządzeniach.

## Decyzja

**QA candidate: TAK. Production release: NO-RELEASE do czasu ręcznego odbioru desktop + realny telefon.**

Po ręcznym potwierdzeniu rozpoznawalności pięciu collectible, czytelności przeszkód, atrakcyjności `+250`, braku błędów konsoli i płynności można zmienić decyzję na release bez dalszych zmian kodu.
