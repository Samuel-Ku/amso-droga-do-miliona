# 02 — Gęstsze fabularne fale paczek i sprzętu

**What to build:** Zwiększyć obfitość nagród w całej fabule bez utraty czytelności historii. Każda grywalna kombinacja fabularna ma dostarczać 3–6 fizycznych paczek oraz 0–1 sprzęt dobrany do tematu etapu. Sprzęt ma być dodatkową nagrodą, a nie zamiennikiem paczki, i ma leżeć na bezpiecznej, oczywistej trajektorii.

**Blocked by:** 01 — Expand: osobny kontrakt paczki i sprzętu

**Status:** ready-for-human

- [x] Każda aktywna kombinacja fabularna zawiera od 3 do 6 paczek.
- [x] Kombinacja fabularna zawiera najwyżej jeden dodatkowy sprzęt i nigdy nie zmniejsza przez niego liczby paczek.
- [x] Typ sprzętu jest zgodny z etapem fabuły oraz nadal realizuje istniejący cel konkretnego urządzenia.
- [x] Sprzęt i paczki fabularne znajdują się na bezpiecznej, czytelnej trajektorii wymaganej przez daną akcję.
- [x] Żaden collectible fabularny nie przecina przeszkody, innego collectible ani obszaru poza zasięgiem gracza.
- [x] Fala nie zasłania wskazówki wynikającej z kształtu przeszkody ani nie utrudnia czytania karty historii.
- [x] Fale zachowują istniejący rytm pauzy narracyjnej i nie generują nagród podczas autopilota czy karty tekstowej.
- [x] Deterministyczny test pełnej fabuły potwierdza zakresy, cele sprzętowe, licznik paczek i dojście do miliona.

## Comments

Zaimplementowano gęste fale autorskie i test pełnego przejścia fabuła → milion → challenge.
