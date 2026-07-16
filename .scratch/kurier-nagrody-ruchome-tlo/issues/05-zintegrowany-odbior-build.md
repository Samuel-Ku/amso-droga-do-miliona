# 05 — Zintegrowany odbiór wizualny i autonomiczny build

**What to build:** Gotowa wersja łączy kuriera AMSO, cykliczną paralaksę i pięć
celebracji w jednym pełnym biegu. Artefakt autonomiczny działa lokalnie, a
desktop i telefon od 390 px zachowują czytelność, uczciwość gameplay i
zatwierdzoną dostępność ruchu.

**Blocked by:** 01 — Kurier AMSO z właściwym znakiem i paletą; 02 — Cykliczna paralaksa tła podczas biegu; 03 — Pierwsza celebracja progu paczek end-to-end; 04 — Rotacja pięciu celebracji i rosnąca intensywność.

**Status:** ready-for-human

- [x] Pełny production flow od fabuły do Trybu Wyzwania zachowuje licznik paczek, fazę tła i historię celebracji.
- [x] Autonomiczny HTML uruchamia się lokalnie i zawiera wszystkie wymagane obrazy, kod oraz audio bez zewnętrznych zależności kampanii.
- [x] Kurier i znak `A` są czytelne na desktopie oraz przy 390×844 w biegu, skoku i ślizgu.
- [x] Progi 10, 50, 100, 500 i 1 000 pokazują pięć właściwych celebracji w zatwierdzonej kolejności.
- [x] Żaden efekt nie zasłania kuriera, paczki do zebrania ani nadchodzącej przeszkody.
- [x] Napis nie koliduje z HUD i pozostaje czytelny na wszystkich siedmiu planszach.
- [x] Pauza, karty fabularne i `reduced motion` zatrzymują tło zgodnie ze specyfikacją.
- [x] Wyciszenie blokuje słyszalne cue, ale nie usuwa wizualnej celebracji.
- [x] Podczas ciągłego biegu nie pojawia się pusta krawędź ani wyraźny skok przy zawinięciu tła.
- [x] Jeśli lustrzany szew jest nieakceptowalny, wynik zostaje udokumentowany bez ukrytego dodawania powiększenia lub innej niezatwierdzonej metody.
- [x] Pełny zestaw testów, typecheck, build produkcyjny i build autonomiczny przechodzą bez regresji.
