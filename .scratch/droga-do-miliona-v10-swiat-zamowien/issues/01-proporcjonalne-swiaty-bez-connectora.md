# 01 — Proporcjonalne światy bez connectora

**What to build:** Gracz ponownie widzi spokojny, proporcjonalny świat, w którym tło porusza się płynnie, a kurier i przeszkody stoją na wspólnej ziemi. Kolejny świat wjeżdża naturalnie z prawej dokładnie wtedy, gdy poprzedni wyjeżdża z lewej, bez różowego pasa, nakładania lub odsłonięcia pustego kadru.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Obrazy świata zachowują proporcje przez semantykę `cover` na portrait, landscape i desktop; żadna oś nie jest rozciągana niezależnie.
- [ ] Zatwierdzone punkty kadrowania utrzymują dekoracyjną podłogę w relacji ze wspólną linią gameplay, więc przeszkody nie wyglądają na zawieszone.
- [ ] Parallax porusza się około 10% dystansu trasy i jest obliczany z jednej absolutnej fazy bez CSS-owego doganiania.
- [ ] Sąsiednie światy są ustawione kraj do kraju z zerowym overlapem, bez crossfade i bez odbicia poziomego.
- [ ] Connector, gradientowy pas i każdy neutralny fragment pomiędzy światami zostają całkowicie usunięte.
- [ ] Pełny cykl paneli nie pokazuje białej szczeliny ani koloru podstawy na żadnej klatce.
- [ ] Linia ziemi dochodzi poza obie krawędzie viewportu i zachowuje jeden poziom dla kuriera, collectibles oraz przeszkód.
- [ ] Automatyczny test DOM potwierdza proporcje, fazę 10%, brak connectora/overlapu/crossfade i zamknięcie granicy paneli.

