# 11 — Bezszwowe światy kraj do kraju

**What to build:** Środowisko porusza się jako ciąg paneli ustawionych kraj do kraju, bez crossfade i podwójnych kompozycji. Neutralne łączniki zachowują linię horyzontu i trasę, a przejścia świata, fabuły i Trybu Wyzwania nie szarpią fazy paralaksy.

**Blocked by:** 02 — Mobilne dekodowanie światów bez czarnego ekranu; 03 — Stabilna pętla klatek i adaptacyjna jakość dekoracji.

**Status:** ready-for-human

- [ ] Sąsiednie panele nie nakładają się, nie korzystają z alpha blendingu i nie są odbijane poziomo.
- [ ] Każda para różnych światów ma krótki neutralny łącznik zgodny z paletą, horyzontem i poziomem trasy.
- [ ] Panel i łącznik poruszają się jedną fazą i jedną prędkością paralaksy bez resetu współrzędnych.
- [ ] Przejście fabuła → Tryb Wyzwania zachowuje ciągłość ruchu i nie odsłania podstawy sceny.
- [ ] Karta historii i pauza płynnie dochodzą do autorskiego centralnego kadru bez zatrzymania granicy pod tekstem.
- [ ] Powrót do gameplay kontynuuje fazę bez nagłego skoku.
- [ ] Linia trasy jest jednym pełnoszerokim elementem, wychodzi poza obie krawędzie i zachowuje wspólną wysokość we wszystkich światach.
- [ ] Fallback obrazu zachowuje tę samą linię trasy i nie tworzy czarnej przerwy.
- [ ] Test przechodzi pełny cykl wszystkich siedmiu światów, łączniki, pauzę i challenge bez overlapu, szczeliny, crossfade i szarpnięcia.
- [ ] Manualny odbiór obejmuje portrait, landscape, szeroki desktop, wysoki DPR oraz Chromium i WebKit.
