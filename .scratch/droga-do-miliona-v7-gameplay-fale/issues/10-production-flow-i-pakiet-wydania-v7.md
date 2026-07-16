# 10 — Production flow i pakiet wydania v7

**What to build:** Gotowy do przekazania build v7, który prowadzi przez wszystkie sześć mikropoziomów do Trybu Wyzwania i zachowuje ten sam uczciwy, czytelny kontrakt na wspieranych urządzeniach, przeglądarkach oraz w autonomicznym HTML.

**Blocked by:** 09 — Orkiestracja nagród, bonusów i audio.

Status: ready-for-human

- [x] Pełny production-flow test przechodzi sześć mikropoziomów, celebrację miliona, seamless handoff, zabezpieczoną i niezabezpieczoną kolizję oraz czysty retry wyzwania.
- [ ] Obowiązkowa interakcja wraz z payoffami mieści się około pięciu minut, a typowe przejście z czytaniem może trwać około 6–8 minut bez limitowania kart.
- [x] Każdy etap kończy się minimalnym czasem i właściwym celem, nigdy samym timerem.
- [x] Wszystkie fabularne fale zawierają czytelne trasy paczek, a żaden zwalidowany układ nie ma niewidzialnego spawnu, nakładania hitboxów lub niewykonalnego przejścia.
- [x] Tło zachowuje ciągłość ruchu między światami, settle pod tekst i płynny powrót; reduced motion utrzymuje widoczną liniową paralaksę z 30–40% prędkości bez intensywnych transformacji.
- [ ] Desktop, 390 px, Safari i przeglądarki Chromium zachowują tę samą logikę trudności, punktacji, sterowania i czasu reakcji.
- [x] Najgęstsza zwalidowana sekwencja przy 3,5×, aktywnym tle, HUD i dozwolonym efekcie nagrody spełnia ustalony budżet wydajności bez krytycznych utrat klatek.
- [x] Lokalny, kopiowalny raport QA zawiera metryki segmentów, fal, zbierania, combo, kolizji, challenge i wydajności bez PII oraz połączenia z backendem.
- [x] Walidacja konfiguracji zwraca precyzyjne błędy QA zamiast uruchamiać niepoprawną lub niemożliwą falę.
- [x] Autonomiczny HTML uruchamia tę samą zatwierdzoną konfigurację i wszystkie niezbędne zasoby bez połączenia sieciowego.
- [x] Końcowy raport odbioru dokumentuje wyniki automatyczne, macierz manualną, znane ograniczenia i wartości balansu gotowe do dalszych playtestów.

## Comments

2026-07-16: Build, walidacja konfiguracji, pakiet autonomiczny, copydeck CSV, raport lokalny oraz pełna automatyczna suita są zielone. Smoke Chromium/WebKit na desktopie, 390 px i reduced motion przeszedł bez błędów; rzeczywista macierz Safari/Windows/urządzeń pozostaje świadomie otwarta do manualnego odbioru w tickecie 03 i `qa/raport-rc-v7.md`.

2026-07-16: Dodano regresyjny budżet czasu: konserwatywna ścieżka bez czytania i retry wynosi 326,72 s (285 s gry + sześć reframe/countdown + trzy demonstracje bonusów + finałowe payoffy), z limitem 330 s. Stress realnego Canvas 1600×900 przez 240 klatek z 12 przeszkodami, 32 paczkami, aktywnym tłem, aktualizowanym HUD, efektem nagrody i prędkością 3,5× osiągnął Chromium 59,5 FPS / p95 16,7 ms / 0 klatek >50 ms oraz WebKit 60,0 FPS / p95 18 ms / 0 klatek >50 ms; budżet p95 ≤25 ms został zaliczony. Safari WebDriver zwrócił jawny blocker `Allow remote automation`, dlatego rzeczywisty Safari i Windows pozostają w macierzy manualnej.
