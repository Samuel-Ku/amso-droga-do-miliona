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
- [ ] Najgęstsza zwalidowana sekwencja przy 3,5×, aktywnym tle, HUD i dozwolonym efekcie nagrody spełnia ustalony budżet wydajności bez krytycznych utrat klatek.
- [x] Lokalny, kopiowalny raport QA zawiera metryki segmentów, fal, zbierania, combo, kolizji, challenge i wydajności bez PII oraz połączenia z backendem.
- [x] Walidacja konfiguracji zwraca precyzyjne błędy QA zamiast uruchamiać niepoprawną lub niemożliwą falę.
- [x] Autonomiczny HTML uruchamia tę samą zatwierdzoną konfigurację i wszystkie niezbędne zasoby bez połączenia sieciowego.
- [x] Końcowy raport odbioru dokumentuje wyniki automatyczne, macierz manualną, znane ograniczenia i wartości balansu gotowe do dalszych playtestów.

## Comments

2026-07-16: Build, walidacja konfiguracji, pakiet autonomiczny, copydeck CSV, raport lokalny oraz pełna automatyczna suita (35 plików, 227 testów) są zielone. Smoke Chromium/WebKit na desktopie, 390 px i reduced motion przeszedł bez błędów, ale czas przejścia, rzeczywista macierz Safari/Windows/urządzeń oraz budżet FPS przy 3,5× pozostają świadomie otwarte do manualnego odbioru w tickecie 03 i `qa/raport-rc-v7.md`.
