# 02 — Cykliczna paralaksa tła podczas biegu

**What to build:** Podczas aktywnego gameplay wygenerowane tło przesuwa się
płynnie w lewo jako daleki plan. Dwie sąsiednie kopie, z których co druga jest
odbita poziomo, tworzą pierwszy testowany wariant cyklicznego ruchu. Ruch
reaguje na tempo gry, lecz nie przeszkadza w fabule ani czytelności gameplay.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Paralaksa działa wyłącznie podczas aktywnego biegu w fabule i Trybie Wyzwania.
- [x] Tło porusza się w lewo z prędkością równą 10% aktualnej prędkości świata.
- [x] Dwie kopie planszy zawijają się cyklicznie bez pokazania pustej krawędzi.
- [x] Co druga kopia jest odbita poziomo, aby ograniczyć widoczność szwu.
- [x] Zmiana świata zachowuje fazę i prędkość paralaksy oraz używa płynnego crossfade.
- [x] Tło zatrzymuje się podczas pauzy, karty fabularnej, countdownu, wyniku i poza aktywnym gameplay.
- [x] W gameplay plansza ma opacity `0.6`, a nieruchome sceny fabularne zachowują `0.8`.
- [x] Trasa, kurier, paczki, przeszkody i HUD nie dziedziczą opacity planszy.
- [x] `Reduced motion` wyłącza przesuwanie bez ukrywania tła.
- [x] Test lifecycle potwierdza ruch, zatrzymanie, zmianę prędkości i zachowanie fazy między światami.
