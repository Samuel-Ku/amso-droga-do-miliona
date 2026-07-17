# 02 — Mobilne dekodowanie światów bez czarnego ekranu

**What to build:** Autonomiczny HTML niezawodnie pokazuje ilustracje światów także po otwarciu przez Android `content://`. Każdy osadzony WebP jest dekodowany tylko raz, awaria uruchamia kontrolowaną ponowną próbę, a trwały błąd pozostawia grywalny, jasny fallback zgodny z kampanią.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [ ] Autonomiczny dokument nadal zawiera wszystkie wymagane obrazy świata bez zewnętrznego połączenia sieciowego.
- [ ] Runtime tworzy jeden dekodowany zasób na świat zamiast wielu niezależnych kopii tego samego obrazu.
- [ ] W pamięci pozostają maksymalnie bieżący i przygotowany następny świat; poprzedni jest zwalniany po zakończeniu przejścia.
- [ ] Następny świat jest gotowy przed wejściem na ekran i nie powoduje pustej ani czarnej klatki.
- [ ] Pierwszy błąd dekodowania uruchamia ograniczoną ponowną próbę bez blokowania gameplay.
- [ ] Trwały błąd pokazuje jasny, markowy fallback zachowujący czytelną trasę i kontrast obiektów gry.
- [ ] Stan błędu jednego świata nie zastępuje całej kampanii globalnym ekranem awarii.
- [ ] Test uruchamia rzeczywisty kontrakt dekodowania dla sukcesu, retry i trwałego błędu; samo wyszukanie base64 nie spełnia kryterium.
- [ ] Test obejmuje schemat lokalnego dokumentu odpowiadający Android `content://`.
