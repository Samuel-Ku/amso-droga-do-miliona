# 07 — Zintegrowany odbiór balansu v11

**What to build:** Dostarczyć gotowy do przekazania build, w którym nowy balans paczek i sprzętu działa jako jedna spójna pętla od fabuły do wyniku challenge. Odbiór ma potwierdzić nie tylko liczby, ale również czytelność tras, motywację, zapis rekordu, wydajność i działanie autonomicznego HTML na desktopie oraz urządzeniu mobilnym.

**Blocked by:** 04 — Czytelne trasy ryzyko–nagroda i walidacja geometrii; 05 — Dwupoziomowy feedback `+100 / +250` i audio; 06 — Nowa wersja rekordu Trybu Wyzwania

**Status:** ready-for-human

- [x] Jedna deterministyczna sesja przez publiczny snapshot przechodzi fabułę, milion, challenge, game over, wynik i ponowienie próby.
- [x] Sesja obejmuje paczkę, notebook, telefon, PC i LCD oraz potwierdza wynik 100/250, osobny licznik paczek i realizację celów sprzętowych.
- [x] Sesja potwierdza zakres 3–6 paczek plus 0–1 sprzęt w fabule oraz 5–8 paczek plus 1–2 sprzęty w challenge.
- [x] Test długiej sesji potwierdza kontrolowany rozkład około 80/20, brak sąsiedniego sprzętu oraz limity czasu 8/12 sekund.
- [x] Testy geometrii potwierdzają brak przecięć, osiągalność tras, najwyżej siedem widocznych collectible i pobłażliwy hitbox sprzętu.
- [x] Test pominięcia sprzętu potwierdza brak kary punktowej, przerwania combo, celebracji paczek i negatywnego audio.
- [x] Test rekordu potwierdza oddzielenie starej ekonomii, zachowanie fabuły oraz trwałość nowego wyniku v11.
- [ ] Ręczny odbiór na desktopie i realnym telefonie potwierdza rozpoznawalność pięciu collectible, czytelność przeszkód i atrakcyjność `+250`.
- [ ] Najgęstsze fale nie pogarszają płynności ani nie powodują widocznego szarpania animacji.
- [x] Typecheck, pełny pakiet testów i produkcyjna kompilacja przechodzą bez błędów.
- [ ] Autonomiczny HTML zostaje przebudowany, uruchamia się lokalnie bez błędów konsoli i zawiera bieżące assety.
- [x] Raport odbioru zapisuje zakres testów, wynik, znane ograniczenia oraz decyzję release / no-release.

## Comments

Automatyczny odbiór zakończony: 302 testy, typecheck i `build:all` przechodzą. Ręczny desktop/telefon i obserwacja płynności pozostają bramką człowieka; raport: `ACCEPTANCE.md`.
