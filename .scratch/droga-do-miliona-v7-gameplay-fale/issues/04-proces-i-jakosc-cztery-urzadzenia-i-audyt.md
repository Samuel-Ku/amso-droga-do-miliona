# 04 — Proces i Jakość — cztery urządzenia i AUDYT

**What to build:** Kompletny mikropoziom kontroli jakości, w którym gracz przygotowuje cztery urządzenia w powtarzalnym procesie, widzi trwały rezultat `SPRAWDZONY` i poznaje działanie bonusu `AUDYT`.

**Blocked by:** 03 — Odbiór i strojenie pionowego wycinka.

Status: ready-for-human

- [x] Poziom obejmuje cztery urządzenia, każde wymagające trzech zaliczonych fal.
- [x] Po trzeciej fali urządzenie otrzymuje czytelny, trwały w tym poziomie stempel `SPRAWDZONY`.
- [x] Kolizja lub niezaliczenie resetuje tylko postęp bieżącego urządzenia, nie usuwa ukończonych stempli.
- [x] HUD pokazuje `SPRAWDZONE 2/4 · KROK 1/3` wraz z rozpoznawalnymi miniaturami laptopów.
- [x] Po pierwszym urządzeniu na bezpiecznej trasie debiutuje `AUDYT`; nie nakłada się na przeszkodę ani niebezpieczną falę.
- [x] Pierwsze użycie zatrzymuje grę w naturalnej przerwie, odrzuca wejścia przez około 1,2 sekundy i jednym zdaniem pokazuje, że bonus zwiększa odstępy przez około siedem sekund bez zmiany prędkości kuriera.
- [x] Kolejne użycia `AUDYT` nie zatrzymują gameplay, a widoczny licznik pokazuje pozostały czas.
- [x] Czwarte urządzenie kończy autorska sekwencja skok–ślizg–skok z uczciwymi zapowiedziami i trasą paczek.
- [x] Payoff pokazuje przygotowane urządzenia i przechodzi do następnej historii bez dużego overlayu.
- [x] Test lifecycle potwierdza reset bieżącego urządzenia, trwałość stempli, debiut bonusu, finałową sekwencję i semantyczny HUD.
