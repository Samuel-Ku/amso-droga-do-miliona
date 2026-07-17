# 07 — Fabularne serie i zawsze osiągalne paczki

**What to build:** Fabuła przechodzi od pojedynczej przeszkody do czytelnych, dwuelementowych sekwencji, a paczki zawsze wskazują prawidłową i fizycznie osiągalną trajektorię. Generator nie może zaoferować nagrody wewnątrz przeszkody ani poza zasięgiem kuriera.

**Blocked by:** 06 — Pełne usunięcie Audytu.

**Status:** ready-for-human

- [ ] Początek fabuły zachowuje pojedyncze przeszkody i spokojne okno nauki.
- [ ] Dalsze segmenty fabuły mogą mieć maksymalnie dwie jednocześnie widoczne przeszkody.
- [ ] Dostępne są co najmniej sekwencje `skok → ślizg`, `ślizg → skok` i dwa skoki z czytelnym rytmem.
- [ ] Każda przeszkoda i prowadzące paczki są tworzone jako jedna atomowa fala.
- [ ] Łuk paczek dla skoku i niski rząd dla ślizgu można zebrać zatwierdzoną fizyką bez kolizji.
- [ ] Żaden collectible nie przecina hitboxa przeszkody ani innego niezbieralnego obiektu.
- [ ] Walidator odrzuca falę bez bezpiecznej drogi, z niedostatecznym czasem reakcji lub nieosiągalną paczką.
- [ ] Po dwuelementowej serii pozostaje około 1,0–1,4 s czytelnego oddechu.
- [ ] Test właściwościowy obejmuje wiele seedów, wszystkie rodzaje przeszkód i pełny zakres prędkości fabuły.
