# Wdrożenie opcjonalnego Workera rekordów

Worker rekordów jest wdrażany niezależnie od frontendu Vercel. D1 pozostaje źródłem prawdy, a niedostępność Workera nie może blokować startu gry, rozgrywki ani lokalnego wyniku.

Domyślna polityka CORS dopuszcza produkcyjny origin `https://game.amso.pl`. Przed wydaniem należy uruchomić `npm test` i sprawdzić GET, POST oraz OPTIONS z tym nagłówkiem `Origin`.

Rollback frontendu nie wymaga rollbacku Workera. Rollback Workera wykonuje się przez przywrócenie poprzedniej wersji skryptu; migracje D1 muszą pozostać wstecznie kompatybilne albo mieć osobny, jawny plan wycofania.
