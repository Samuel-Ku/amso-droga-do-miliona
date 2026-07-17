# 09 — Contract: wspólny język Zamówień

**What to build:** Cały gameplay mówi jednym językiem: gracz realizuje zamówienia, niezależnie od tego, czy zbiera urządzenie, czy gotową paczkę. Po zakończeniu migracji legacy package-semantyka pozostaje wyłącznie tam, gdzie opisuje fizyczną wysyłkę lub prawdziwy fakt.

**Blocked by:** 06 — Expand: pięć typów zamówień w grywalnej pętli; 08 — Dwa czytelne power-upy bez golden package.

**Status:** ready-for-agent

- [ ] HUD używa etykiety `ZAMÓWIENIA`, a ekran wyniku `ZREALIZOWANE ZAMÓWIENIA`.
- [ ] Publiczne snapshoty, profil, rekord i wynik używają kanonicznego licznika zamówień.
- [ ] Finałowy licznik rozpoczyna odpowiedni odcinek od `999 970`, zwiększa się po każdym zwykłym typie i nie resetuje się przy handoffie do challenge.
- [ ] Milion jest nadal momentem fabularnym, nie game over; wynik i licznik rosną dalej.
- [ ] Analytics i raport QA otrzymują jednoznaczną semantykę zamówień bez podwójnego raportowania legacy paczek.
- [ ] Copy faktów zachowuje słowo `paczki` przy fizycznej wysyłce, wadze lub prawdziwej historii.
- [ ] Stare profile/configi są odczytywane przez kontrolowaną migrację, ale nowy zapis nie emituje legacy gameplay-nazw.
- [ ] Po migracji kontraktowej nie ma aktywnego modelu golden package ani mylącego `drugie_zycie`.
- [ ] Test pełnej sesji obejmuje fabułę, milion, challenge, wynik, restart i trwałość nowego rekordu zamówień.

