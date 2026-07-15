# 08 — Próg Miliona i przejście do challenge

**What to build:** Finał, w którym fizyczny licznik, ostatnie paczki, kombinacje i reakcja zespołu tworzą zrozumiałą kulminację, po której gracz świadomie przechodzi do trudniejszego trybu bez utraty wyniku.

**Blocked by:** 01 — Etalonowy prototyp historii klienta; 02 — Bezpieczne wejście do karty i sterowanie jedną ręką; 03 — Storyboard i pięciominutowy kontrakt fabuły v6.

**Status:** ready-for-human

- [x] Licznik zaczyna się od 999 970 i zwiększa się dokładnie o jeden za każdą zebraną paczkę finału.
- [x] HUD osobno pokazuje trzydzieści paczek oraz osiem wymaganych kombinacji.
- [x] Fabuła nie ma game over, a pominięte wymagane paczki pozostają osiągalne.
- [x] Osiągnięcie miliona uruchamia jedną czytelną celebrację z milionową paczką, zespołem AMSO i funkcjonalnym użyciem gradientu.
- [x] Celebracja zatrzymuje się w stabilnym finalnym kadrze i ma wariant reduced motion.
- [x] Karta przejścia wyjaśnia zachowanie wyniku, wzrost tempa oraz game over po pierwszej niezabezpieczonej kolizji.
- [x] Challenge rozpoczyna się dopiero po świadomym CTA i odliczeniu.
- [x] Wynik, paczki i zatwierdzone aktywne bonusy przechodzą do challenge bez resetu.
- [x] Desktop, 390 px, wejścia, licznik oraz seamless lifecycle są objęte testami.
