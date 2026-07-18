# 01 — Expand: osobny kontrakt paczki i sprzętu

**What to build:** Wprowadzić działające od wejścia collectible do publicznego wyniku rozróżnienie fizycznej paczki i sprzętu. Paczka ma pozostać podstawową nagrodą wartą 100 punktów oraz jedynym źródłem licznika i celebracji paczek. Notebook, telefon, PC i LCD mają być sprzętem wartym po 250 punktów, nadal realizować właściwe cele fabularne, ale nie zwiększać licznika ani progów paczek. Zmiana ma zostać dodana obok potrzebnej kompatybilności obecnego modelu, aby kolejne pionowe migracje mogły lądować na zielono.

**Blocked by:** None — can start immediately

**Status:** ready-for-human

- [x] Publiczny stan biegu jawnie rozróżnia wynik punktowy, liczbę fizycznych paczek oraz zebrane typy sprzętu.
- [x] Zebranie paczki daje bazowo 100 punktów, zwiększa licznik paczek o jeden i może uruchomić próg celebracji paczek.
- [x] Zebranie notebooka, telefonu, PC albo LCD daje bazowo 250 punktów i nie zwiększa licznika ani celebracji paczek.
- [x] Każdy z czterech typów sprzętu nadal może zrealizować odpowiadający mu cel fabularny.
- [x] Pominięcie sprzętu nie zmienia wyniku, licznika paczek, combo ani wyniku celu fabularnego.
- [x] Podwójny wynik, jeśli jest aktywny, zachowuje dotychczasowy kontrakt mnożenia punktów bez podwajania liczników.
- [x] Fabularny licznik `999 970 → 1 000 000` zachowuje zatwierdzony przebieg niezależnie od nowego licznika celebracji paczek.
- [x] Test przez publiczny snapshot parametryzuje paczkę i wszystkie cztery rodzaje sprzętu, bez asercji na prywatne pola generatora.
- [x] Dotychczasowe fale, power-upy i zapis stanu pozostają kompatybilne po wprowadzeniu rozszerzonego kontraktu.

## Comments

- 2026-07-18: Implemented and verified with typecheck, 292 automated tests, production build, and separate standards/spec reviews. Ready for human gameplay review.
