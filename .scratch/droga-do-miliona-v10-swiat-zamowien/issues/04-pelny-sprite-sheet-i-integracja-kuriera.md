# 04 — Pełny sprite sheet i integracja kuriera

**What to build:** Zatwierdzony kurier staje się kompletnym bohaterem gameplay. Bieg, skok, przysiad i krótka radość korzystają z jednej sylwetki, stałej skali i nieruchomego punktu oparcia stóp.

**Blocked by:** 03 — Etalonowy kadr nowego kuriera AMSO.

**Status:** ready-for-agent

- [ ] Produkcyjny atlas zawiera 6 klatek biegu, 3 fazy skoku, 2 klatki przysiadu i 3 klatki celebracji.
- [ ] Wszystkie klatki mają identyczne płótno, skalę, kierunek, linię stóp i położenie znaku `A`.
- [ ] Bieg nie jest zbyt szybki względem prędkości świata i nie tworzy efektu ślizgania po ziemi.
- [ ] Fazy skoku pokazują odryw, lot i lądowanie bez zmiany hitboxa lub wizualnego pomniejszenia ochrony.
- [ ] Przysiad reaguje na istniejące bezpośrednie sterowanie i nie zmienia jego czasu ani mechaniki.
- [ ] Gest radości jest używany wyłącznie przez duże milestones i nie przerywa aktywnego sterowania.
- [ ] Render pomniejsza asset wysokiej rozdzielczości bez powiększania małego rastra i bez poszarpanych krawędzi.
- [ ] Geometryczny kurier przestaje być podstawową ścieżką renderowania, a fallback pozostaje neutralny i nie udaje finalnego assetu.
- [ ] Screenshot set obejmuje bieg, skok, przysiad, shield i celebrację na desktopie oraz telefonie.

