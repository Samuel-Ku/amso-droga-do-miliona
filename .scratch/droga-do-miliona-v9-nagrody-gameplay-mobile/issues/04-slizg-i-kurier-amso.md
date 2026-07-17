# 04 — Bezpośredni ślizg i poprawiony kurier AMSO

**What to build:** Klawiatura daje natychmiastową, bezpośrednią kontrolę nad przysiadem, a kurier otrzymuje spójną, czytelną prezentację marki we wszystkich pozach: pomarańczowy pas, większy wektorowy znak `A` i poprawnie zakończone nogi.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [ ] Naciśnięcie `S` albo `ArrowDown` natychmiast włącza przysiad bez osobnego trybu krótkiego naciśnięcia.
- [ ] Kurier pozostaje w przysiadzie tak długo, jak odpowiedni klawisz jest trzymany, i natychmiast wstaje po jego zwolnieniu.
- [ ] Powtórzenia klawisza nie uruchamiają dodatkowego timera ani nie przedłużają pozy po `keyup`.
- [ ] Mobilny gest w dół nadal uruchamia jeden krótki, deterministyczny ślizg.
- [ ] Pas kuriera jest pomarańczowy w biegu, skoku i przysiadzie.
- [ ] Biały znak `A` zachowuje zatwierdzoną geometrię, jest renderowany wektorowo i ma około 10% większe pole niż obecnie.
- [ ] Znak pozostaje stabilnie pozycjonowany we wszystkich pozach i nie ma poszarpanych krawędzi przy ruchu.
- [ ] Białe stopy są opuszczone o 3 px, a czarne nogi kończą się 2 px ponad ich górną krawędzią bez zmiany hitboxa.
- [ ] Test wejścia obejmuje keydown, przytrzymanie i keyup dla obu układów klawiatury oraz osobno gest touch.
