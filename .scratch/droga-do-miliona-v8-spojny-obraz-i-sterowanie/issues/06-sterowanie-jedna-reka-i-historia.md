# 06 — Sterowanie jedną ręką bez przypadkowego pomijania historii

**What to build:** Udostępnić równorzędne układy jednoręczne `W/S` i `↑/↓`,
zachowując wszystkie dotychczasowe sposoby skoku. Przejście z biegu do historii
ma odrzucać wejście rozpoczęte wcześniej, ale nie może opóźniać świadomego
kliknięcia przycisku `Dalej`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] `W`, `ArrowUp`, Spacja, klik i tap uruchamiają skok podczas aktywnego gameplay.
- [x] `S` i `ArrowDown` uruchamiają ślizg podczas aktywnego gameplay.
- [x] `ArrowUp` i `ArrowDown` nie przewijają strony, gdy aktywna gra przejmuje wejście.
- [x] Poza aktywnym gameplay strzałki zachowują standardowe zachowanie strony.
- [x] Intro i pomoc pokazują równorzędne pary `W/S` oraz `↑/↓`, zachowując informację o Spacji i dotyku.
- [x] Przytrzymane albo powtarzane `W`, `S`, `ArrowUp` i `ArrowDown` nie kontynuują karty historii.
- [x] Spacja rozpoczęta jeszcze w gameplay nie przechodzi na pierwszą klatkę historii.
- [x] Nowe naciśnięcie Spacji rozpoczęte po pokazaniu karty może ją kontynuować.
- [x] Przycisk `Dalej` jest dostępny natychmiast po pokazaniu karty i reaguje na klik lub tap bez timera.
- [x] Test integracyjny obejmuje każdy typ wejścia, zmianę stanu przy trzymanej klawiaturze oraz natychmiastowy klik `Dalej`.
- [x] Obsługa wejścia nie powoduje podwójnego skoku, podwójnej kontynuacji ani regresji ślizgu z przytrzymaniem.

## Comments

Obsługa i pomoc obejmują `W/S`, `↑/↓`, Spację oraz dotyk. Powtarzane
zdarzenie Spacji nie przechodzi karty, a świeże zdarzenie i klik działają od razu.
