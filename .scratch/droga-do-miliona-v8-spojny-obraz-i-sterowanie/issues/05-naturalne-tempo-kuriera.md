# 05 — Naturalne tempo animacji kuriera

**What to build:** Zachować wrażenie przyspieszania kuriera bez nienaturalnego
drgania kończyn. Cykl kroku ma rosnąć płynnie wraz z prędkością świata, ale
pozostać w czytelnym, ludzkim zakresie także przy maksymalnym tempie wyzwania.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Początkowa prędkość świata daje około 2 pełnych cykli kroku na sekundę.
- [x] Maksymalna prędkość świata nie przekracza około 4 pełnych cykli kroku na sekundę.
- [x] Częstotliwość rośnie monotonicznie i płynnie między dolną i górną granicą.
- [x] Kurier nie wibruje wizualnie przy prędkości 3,5×.
- [x] Poza biegu w powietrzu pozostaje niezależna od cyklu kroku.
- [x] Poza ślizgu pozostaje stabilna i zgodna z istniejącym hitboxem.
- [x] Reduced motion nie wprowadza kołysania ani szybkiego ruchu kończyn.
- [x] Wąski test częstotliwości obejmuje prędkość początkową, pośrednią i maksymalną.
- [x] Zmiana nie modyfikuje fizyki, prędkości świata ani wykrywania kolizji.

## Comments

Cykl kroku jest liniowo ograniczony do 2–4 Hz i nie dotyka fizyki ani
hitboxów. Pokrycie: `courier-presentation`.
