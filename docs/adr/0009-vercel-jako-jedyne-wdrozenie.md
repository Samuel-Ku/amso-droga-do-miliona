# Vercel jako jedyny cel wdrożenia frontendu

## Status

Przyjęte 2026-08-11. Zastępuje produkcyjne granice opisane w ADR 0003, 0007 i 0008 oraz część frontendową ADR 0006.

## Decyzja

Frontend kampanii ma jeden artefakt produkcyjny: `dist-vercel/`, publikowany przez Vercel pod `https://game.amso.pl/`. Nie generujemy fragmentu CMS, autonomicznego HTML ani zewnętrznego pakietu IdoSell.

Osiem lokalizacji działa w jednym runtime. Parametr `lang` ma pierwszeństwo przed zapisaną preferencją i językiem przeglądarki. Linki kampanii i share prowadzą do domeny produkcyjnej Vercel z odpowiednim parametrem języka.

Testy przeglądarkowe uruchamiają dokładnie `dist-vercel/` przez HTTP. Test końcowy i pomiary po wdrożeniu używają `https://game.amso.pl/`. Tryb `?qa=performance` pozostaje ograniczoną instrumentacją tego samego bundle, a nie osobną kompilacją QA.

Worker rekordów pozostaje niezależną granicą wdrożenia; jego awaria nie blokuje podstawowej gry.

## Konsekwencje

- release gate buduje i sprawdza wyłącznie Vercel;
- optymalizacje i dowody before/after dotyczą runtime Vercel;
- stare materiały IdoSell pozostają wyłącznie historią w zastąpionych ADR, nie są częścią aktywnych skryptów ani dokumentacji operacyjnej.
