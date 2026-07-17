# 12 — Release candidate v9 i zintegrowany odbiór

**What to build:** Powstaje autonomiczny release candidate v9, który łączy wszystkie zatwierdzone zachowania w jednej deterministycznej sesji i przechodzi macierz mobilną, przeglądarkową, wizualną oraz wydajnościową. Ekran wyników jest uporządkowany i gotowy do przekazania.

**Blocked by:** 01 — Android landscape i CSS-owy tryb gry; 02 — Mobilne dekodowanie światów bez czarnego ekranu; 03 — Stabilna pętla klatek i adaptacyjna jakość dekoracji; 04 — Bezpośredni ślizg i poprawiony kurier AMSO; 05 — Jeden duży, oddychający shield Gwarancji; 06 — Pełne usunięcie Audytu; 07 — Fabularne serie i zawsze osiągalne paczki; 08 — Tryb Wyzwania z seriami do trzech przeszkód; 09 — Świąteczna drabina progów oparta na konfetti; 10 — Nowy osobisty rekord bez podwójnej celebracji; 11 — Bezszwowe światy kraj do kraju.

**Status:** ready-for-human

- [ ] `Wynik łączny` i pozostałe wartości kart wyników korzystają ze wspólnej strefy etykiety oraz jednej bazowej linii na wszystkich breakpointach.
- [ ] Pełny build, typowanie i automatyczne testy projektu przechodzą bez regresji.
- [ ] Autonomiczny HTML uruchamia się lokalnie, zawiera wszystkie krytyczne zasoby i nie pokazuje czarnego świata.
- [ ] Jedna deterministyczna sesja przechodzi start, fabułę, dwa rodzaje ślizgu, dwie i trzy przeszkody, osiągalne paczki, Gwarancję, progi, rekord, zmianę wszystkich światów, challenge i wynik.
- [ ] Sesja potwierdza brak Audytu, podwójnego shielda, abstrakcyjnych celebracji, nakładania światów i bocznych marginesów trasy.
- [ ] Macierz obejmuje portrait od 390 px, landscape około 960×315, szeroki desktop, DPR 1–3, Chromium/Edge, Safari/WebKit i lokalny Android `content://`.
- [ ] Najcięższa scena z trzema przeszkodami, paczkami, shieldem, celebracją i przejściem świata osiąga średnio co najmniej 58 FPS oraz p95 około 20 ms lub mniej na zatwierdzonej macierzy.
- [ ] Obniżenie jakości na słabszym urządzeniu zmienia tylko dekoracje i nie wpływa na wynik ani trudność.
- [ ] Manualny odbiór potwierdza świąteczność progów, estetykę łączników, czytelność shielda, gładki znak `A` i brak szarpnięć.
- [ ] Raport odbioru dokumentuje urządzenia, silniki, orientacje, wyniki FPS, znane ograniczenie systemowego paska `content://` i rezultat każdego kryterium.
