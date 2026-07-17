# 09 — Świąteczna drabina progów oparta na konfetti

**What to build:** Każdy okrągły próg paczek wywołuje atrakcyjne, jednoznaczne świętowanie należące do tej samej rodziny co udana pierwsza animacja. Kolejne rangi zaskakują kompozycją i skalą, ale nie zamieniają się w abstrakcyjne efekty.

**Blocked by:** 03 — Stabilna pętla klatek i adaptacyjna jakość dekoracji.

**Status:** ready-for-human

- [ ] Progi tworzą sekwencję `10, 50, 100, 500, 1 000, 5 000…` przez naprzemienne mnożenie przez 5 i 2.
- [ ] Każdy wariant korzysta z konfetti jako wspólnej semantyki świętowania.
- [ ] 50, 100, 500 i 1 000 rozwijają liczbę źródeł, trajektorie, serpentyny, rozbłysk, kolor i skalę bez użycia gwiazd.
- [ ] Samodzielne warianty `pulse`, `route-wave` i `package-rain` nie są już emitowane.
- [ ] Komunikat pokazuje wyłącznie osiągniętą liczbę paczek i nie zawiera następnego progu.
- [ ] Efekt trwa około 1,0–1,6 s, nie pauzuje gry i pozostawia wolne centrum toru przeszkód.
- [ ] Jedna muzyczna fraza rośnie wraz z rangą; duże progi dodają pełniejszy akord, ale nie maskują sygnałów gameplay.
- [ ] Wyciszenie i `reduced motion` zachowują informację bez niechcianego dźwięku lub intensywnych cząstek.
- [ ] Adaptacyjna jakość może ograniczyć liczbę cząstek bez zmiany treści, czasu i rangi nagrody.
- [ ] Manualny odbiór progów 10–1 000 potwierdza, że wszystkie warianty wyglądają świątecznie i motywująco.
