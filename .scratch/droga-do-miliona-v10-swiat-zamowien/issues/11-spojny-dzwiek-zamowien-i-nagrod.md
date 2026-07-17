# 11 — Spójny dźwięk zamówień i nagród

**What to build:** Dźwięk wzmacnia rytm zbierania i rangę nagród bez chaosu. Zamówienia używają jednej przyjemnej frazy, power-upy są natychmiast rozpoznawalne, a milestones rozwijają jedną świąteczną fanfarę.

**Blocked by:** 08 — Dwa czytelne power-upy bez golden package; 10 — Rosnące celebracje jednej rodziny.

**Status:** ready-for-agent

- [ ] Każde zwykłe zamówienie uruchamia krótki pickup-sound niezależnie od wizualnego typu.
- [ ] Nieprzerwana seria podnosi wysokość motywu maksymalnie przez pięć kroków i nie rośnie bez końca.
- [ ] Pominięcie collectible nie uruchamia ostrego negatywnego sygnału.
- [ ] `Gwarancja 48 M` i `2× WYNIK` mają osobne, natychmiast rozpoznawalne cue.
- [ ] Wszystkie milestones korzystają z jednej fanfary, której liczba nut i pełnia rosną wraz z rangą.
- [ ] Audio celebracji nie maskuje kolizji, ochrony ani sygnału końca próby.
- [ ] Globalne `Wycisz` natychmiast obejmuje pickup, power-up i milestone bez zmiany stanu gameplay.
- [ ] Test audio potwierdza pięć stopni, reset serii, dwa power-up cue, rangi fanfary i mute.

