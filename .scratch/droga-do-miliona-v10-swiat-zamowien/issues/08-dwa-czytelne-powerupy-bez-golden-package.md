# 08 — Dwa czytelne power-upy bez golden package

**What to build:** Gracz widzi tylko dwa specjalne bonusy o jasnym działaniu: jednorazową ochronę `Gwarancja 48 M` i czasowy mnożnik `2× WYNIK`. Stara złota paczka oraz myląca semantyka drugiego życia znikają z całej gry.

**Blocked by:** 05 — Etalonowy zestaw assetów zamówień i power-upów; 06 — Expand: pięć typów zamówień w grywalnej pętli.

**Status:** ready-for-agent

- [ ] `Gwarancja 48 M` używa zatwierdzonego shield assetu i po zebraniu aktywuje jedno duże pomarańczowe oddychające koło.
- [ ] Gwarancja nie stackuje się, nie pojawia się przy aktywnym ładunku i respektuje cooldown po zużyciu.
- [ ] `2× WYNIK` używa zatwierdzonego assetu, podwaja wyłącznie punkty i nie zmienia liczby zamówień.
- [ ] Myląca wartość `drugie_zycie` nie jest emitowana przez runtime, snapshoty ani konfigurację; ewentualny alias wejściowy nie wycieka do UI.
- [ ] Golden package, `+350`, związane copy i wszystkie ścieżki losowania zostają usunięte bez dodawania trzeciego bonusu.
- [ ] `2× WYNIK` występuje średnio raz na 35–50 zamówień, ale tylko w osiągalnym i bezpiecznym miejscu.
- [ ] Power-up nie pojawia się w startowym patternie challenge, podczas historii ani na aktywnym milestone.
- [ ] Po zebraniu pojawia się krótka duża nazwa bonusu bez drobnego tekstu na poruszającym się obiekcie.
- [ ] Test end-to-end potwierdza oba bonusy, brak stackowania, wpływ wyłącznie na właściwy stan i całkowity brak golden package.

