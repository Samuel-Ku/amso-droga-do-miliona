# 10 — Rosnące celebracje jednej rodziny

**What to build:** Każdy próg zamówień wygląda jak coraz większe wykonanie pierwszej, udanej celebracji. Gracz widzi prawdziwe konfetti, kolorowy wynik, pomarańczowe paczki i przy największych progach gest kuriera — nigdy abstrakcyjne koła lub przypadkowe linie.

**Blocked by:** 04 — Pełny sprite sheet i integracja kuriera; 06 — Expand: pięć typów zamówień w grywalnej pętli; 09 — Contract: wspólny język Zamówień.

**Status:** ready-for-agent

- [ ] Progi zachowują otwartą sekwencję `10, 50, 100, 500, 1 000, 5 000…` i copy `N ZAMÓWIEŃ!`.
- [ ] Próg 10 zachowuje dotychczasową udaną bazową kompozycję konfetti i kolorowego napisu.
- [ ] Progi 50, 100, 500 i 1 000 zwiększają liczbę źródeł konfetti, dekoracyjnych paczek, flash, skalę napisu i rangę gestu bez zmiany języka efektu.
- [ ] Celebracje nie używają serpentyn, kół, pływających linii, abstrakcyjnych fal ani samodzielnych geometrycznych animacji.
- [ ] Dekoracyjne paczki pozostają głównie w górnej jednej trzeciej, mają inny rozmiar od collectibles i nie uczestniczą w kolizji.
- [ ] Celebracja jest kolejkowana do bezpiecznego okna, trwa około 1,2–1,8 s i nie zatrzymuje wejść ani symulacji.
- [ ] Komunikat nie pokazuje `Następny próg`, dodatkowego objaśnienia ani paska postępu.
- [ ] Reduced motion zachowuje kolorowy napis, flash i statyczną kompozycję paczek/konfetti bez lotu i opadania.
- [ ] Nowy rekord łączy się z równoczesnym progiem w jeden moment, a nie dwie nakładające się celebracje.
- [ ] Manualny screenshot review progów 10, 50, 100, 500 i 1 000 potwierdza rosnącą świąteczność każdej wersji.

