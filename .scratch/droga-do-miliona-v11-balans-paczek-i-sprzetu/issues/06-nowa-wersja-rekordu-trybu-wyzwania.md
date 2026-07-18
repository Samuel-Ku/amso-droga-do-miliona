# 06 — Nowa wersja rekordu Trybu Wyzwania

**What to build:** Rozpocząć porównywalny rekord challenge dla ekonomii 100/250 i większej gęstości nagród, nie kasując ukończenia fabuły ani pozostałych danych gracza. Pierwsza próba po aktualizacji ma być traktowana jako pierwszy wynik nowej wersji balansu.

**Blocked by:** 01 — Expand: osobny kontrakt paczki i sprzętu

**Status:** ready-for-agent

- [ ] Rekord Trybu Wyzwania jest wersjonowany tak, aby wynik starej ekonomii nie był porównywany z wynikiem v11.
- [ ] Pierwszy ukończony challenge po aktualizacji pokazuje semantykę pierwszego wyniku, a kolejne próby mogą ustanawiać nowy rekord.
- [ ] Ukończenie fabuły pozostaje zapisane i gracz nadal może uruchomić challenge bez ponownego przechodzenia historii.
- [ ] Statystyka uruchomień, ukończeń i inne dane poza rekordem challenge nie są resetowane.
- [ ] Fabularny licznik miliona i jednorazowy bonus fabularny zachowują dotychczasowe znaczenie.
- [ ] Migracja jest idempotentna: ponowne uruchomienie tej samej wersji nie kasuje już zdobytego rekordu v11.
- [ ] Test magazynu stanu obejmuje stare dane, pierwsze uruchomienie v11, zapis nowego rekordu i kolejne uruchomienie.
