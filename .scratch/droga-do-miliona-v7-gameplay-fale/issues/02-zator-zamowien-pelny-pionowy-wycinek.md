# 02 — Zator Zamówień — pełny pionowy wycinek

**What to build:** Pełną drogę od końca szkolenia przez osiem znaczących fal zatoru do uporządkowanego przepływu i czytelnej karty historii, tak aby wzorzec v7 można było ocenić end to end.

**Blocked by:** 01 — Pierwsza paczka — fundament autorskich fal.

Status: ready-for-human

- [x] `Zator Zamówień` ma jeden cel `Rozładuj 8 fal zatoru` i trwa około 45–50 sekund przy poprawnej grze.
- [x] Każda z ośmiu fal zawiera rozpoznawalną przeszkodę, jednoznaczną akcję oraz 3–4 możliwe do zebrania paczki.
- [x] Fale tworzą trzy czytelne fazy: narastanie, rozładunek i płynny przepływ.
- [x] Sam timer nie kończy etapu; niezaliczona fala wraca w tej samej postaci, a zakończenie wymaga minimalnego czasu i ośmiu sukcesów.
- [x] Kolizja pokazuje krótkie uderzenie, usuwa aktywne zagrożenie, traci bieżącą serię i powtarza falę bez game over oraz bez ukrytego ułatwienia.
- [x] HUD pokazuje realne kartony przechodzące w uporządkowaną paczkę oraz licznik `FALE ZATORU 3/8`.
- [x] Po ukończeniu nie pojawia się duży napis `CEL WYKONANY`; wskaźnik domyka się, spawn zatrzymuje, obiekty opuszczają kadr, a gracz otrzymuje 4–6 sekund trasy nagród.
- [x] Kolejny świat wjeżdża z prawej przy zachowanej prędkości paralaksy, a kamera przechodzi przez settle do bezpiecznego kadru historii przed pokazaniem tekstu.
- [x] Powrót z karty ponownie łączy ruch tła bez resetu fazy i daje 3–4 sekundy bezpiecznego wejścia do gameplay.
- [x] Production-flow test przechodzi `Pierwszą paczkę`, retry w zatorze, wszystkie osiem fal, payoff, settle i wejście do następnej karty.
- [x] Lokalny raport QA zawiera próby na falę, współczynnik zebrania, powtórzenia, pomyłki skok/ślizg, czas segmentu, FPS i utracone klatki.
