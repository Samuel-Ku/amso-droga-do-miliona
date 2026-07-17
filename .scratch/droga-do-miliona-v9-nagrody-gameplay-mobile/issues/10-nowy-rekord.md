# 10 — Nowy osobisty rekord bez podwójnej celebracji

**What to build:** Gracz otrzymuje jeden wyraźny moment `NOWY REKORD` po pierwszym przekroczeniu wyniku zapisanego przed startem próby. Rekord łączy się z równoczesnym okrągłym progiem i nie zalewa gry kolejnymi efektami po każdej paczce.

**Blocked by:** 09 — Świąteczna drabina progów oparta na konfetti.

**Status:** ready-for-human

- [ ] Najlepsza liczba paczek jest zapisana w profilu i zamrażana jako cel w chwili rozpoczęcia próby.
- [ ] Pierwsza paczka ponad ten cel emituje dokładnie jedno zdarzenie `NOWY REKORD` w danym biegu.
- [ ] Dalsze zwiększanie wyniku aktualizuje rekord, ale nie ponawia komunikatu do następnej próby.
- [ ] Nowy zapis profilu jest zachowany po zakończeniu biegu i staje się celem kolejnej próby.
- [ ] Jeśli rekord zbiega się z okrągłym progiem, powstaje jedna silniejsza celebracja, jeden komunikat i jeden cue.
- [ ] Rekord może zastosować około 0,25 s łagodnego time dilation, ale wejścia pozostają aktywne i nie powstaje niesprawiedliwa kolizja.
- [ ] `Reduced motion` usuwa time dilation i intensywny ruch, zachowując czytelny komunikat.
- [ ] Test lifecycle obejmuje rekord bez progu, rekord z progiem, kolejne paczki, restart i utrwalenie nowej wartości.
