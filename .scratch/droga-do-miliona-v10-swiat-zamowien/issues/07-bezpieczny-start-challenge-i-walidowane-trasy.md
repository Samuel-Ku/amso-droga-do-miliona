# 07 — Bezpieczny start challenge i walidowane trasy

**What to build:** Tryb Wyzwania zaczyna się czytelnie i nigdy nie umieszcza pierwszego ani kolejnych zamówień wewnątrz przeszkody. Każda fala daje fizycznie osiągalną drogę przy aktualnej prędkości.

**Blocked by:** 06 — Expand: pięć typów zamówień w grywalnej pętli.

**Status:** ready-for-agent

- [ ] Pierwszy pattern Trybu Wyzwania zawiera 3–5 zwykłych zamówień bez aktywnej przeszkody i bez power-upu.
- [ ] Pierwsza przeszkoda pojawia się dopiero po pełnym, widocznym oknie reakcji.
- [ ] Generator traktuje przeszkodę i wszystkie prowadzące zamówienia jako jeden atom aktywowany albo odrzucany w całości.
- [ ] Żaden hitbox collectible nie przecina hitboxa przeszkody, innego collectible ani strefy poza grywalnym zasięgiem.
- [ ] Łuk skoku i niski route przysiadu są możliwe do zebrania przy istniejącej fizyce i pełnym zakresie prędkości.
- [ ] Nieprawidłowa fala jest odrzucana przed wejściem na ekran, a generator wybiera bezpieczną alternatywę.
- [ ] Walidacja zachowuje dotychczasowy limit przeszkód, maksymalną prędkość i okna oddechu; nie ułatwia mechaniki globalnie.
- [ ] Property tests obejmują wiele seedów, wszystkie pięć typów, wszystkie przeszkody i pełny zakres prędkości fabuły/challenge.

