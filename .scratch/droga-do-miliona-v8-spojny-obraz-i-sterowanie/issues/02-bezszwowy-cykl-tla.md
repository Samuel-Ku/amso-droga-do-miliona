# 02 — Bezszwowy cykl tła bez lustrzanego odbicia

**What to build:** Zapewnić ciągły paralaks tła, który na każdej obsługiwanej
proporcji wypełnia cały kadr, przesuwa kolejne kopie w tej samej orientacji i
ukrywa ich granicę. Pełny cykl nie może odsłonić białej podstawy ani stworzyć
lustrzanego powtórzenia sceny.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Obraz świata wypełnia pole gry jak `cover`; niewielkie przycięcie obrzeży jest dozwolone.
- [x] Wszystkie cykliczne kopie mają tę samą poziomą orientację.
- [x] Sąsiednie kopie zachodzą na siebie o 2–3 piksele w przestrzeni ekranu.
- [x] Granica kopii ma miękką strefę mieszania o szerokości odpowiadającej 24–40 pikselom.
- [x] Pełne zawinięcie paralaksy nie pokazuje białej szczeliny przy ułamkowych transformacjach.
- [ ] Zachowanie jest równoważne na 390 px, szerokim desktopie oraz standardowym i wysokim DPR.
- [x] Tryb ograniczonego ruchu zachowuje pełne pokrycie i tę samą orientację kopii.
- [x] Test świata potwierdza brak lustrzanego `scaleX` oraz ciągłość pełnego cyklu bez wiązania się z prywatną implementacją.

## Comments

Automatycznie potwierdzone: `cover`, zgodna orientacja, 32 px maski oraz 3 px
pełnego zachodzenia. Macierz urządzeń pozostaje do odbioru wizualnego.
