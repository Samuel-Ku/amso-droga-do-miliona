# 03 — Crossfade światów i centralny kadr historii

**What to build:** Połączyć ruchomy świat z pauzami narracyjnymi bez odsłaniania
podstawy sceny. Zmiana świata ma być pełnokadrowym przenikaniem, a każdy start
etapu i każda historia mają kończyć ustawianie tła na spokojnym, pełnym,
centralnym kadrze bez granicy cyklu pod tekstem.

**Blocked by:** 02 — Bezszwowy cykl tła bez lustrzanego odbicia.

**Status:** ready-for-human

- [x] Stary i nowy świat zajmują cały kadr przez cały czas zmiany assetu.
- [x] Zmiana świata używa crossfade i nie przesuwa paneli poza lewą lub prawą krawędź.
- [x] Podczas crossfade nie jest widoczna biała ani papierowa podstawa sceny.
- [x] Każdy etap rozpoczyna aktywną grę od pełnego obrazu, a nie od styku cyklu pośrodku.
- [x] Wejście do historii lub pauzy narracyjnej płynnie dochodzi do centralnej kompozycji danego stanu.
- [x] Granica cyklu nie zatrzymuje się w centralnym polu odczytu karty.
- [x] Powrót z historii do gameplay zachowuje absolutną fazę ruchu bez skoku lub resetu paralaksy.
- [x] Test integracyjny przechodzi start, zawinięcie, zmianę świata, historię i powrót do gry.
- [ ] Odbiór wizualny obejmuje portret 390 px, krajobraz i szeroki kontener witryny.

## Comments

Przejścia paneli są pełnokadrowym crossfade, a wejście do historii i pauzy
centruje kafle z łagodnym przejściem. Macierz wizualna pozostaje do odbioru.
