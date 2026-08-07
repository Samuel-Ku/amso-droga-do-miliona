# Leaderboard Worker deployment

## Deploy

1. Uruchom testy `records-worker`, `records-worker-d1`, `records-client` i
   `player-name-policy`.
2. W preview ustaw `CORS_ALLOWED_ORIGINS` jako rozdzieloną przecinkami listę
   dokładnych originów. Produkcyjne `https://amso.pl` i `https://amso.eu` są
   zawsze dozwolone; wildcard nie jest obsługiwany.
3. Wdróż Worker przed frontendem. Zweryfikuj GET, POST, OPTIONS, `Vary: Origin`,
   `cache-control: no-store` oraz `x-moderation-policy-version`.
4. Sprawdź historyczny zmoderowany rekord: publiczne JSON ma zawierać
   `nameModerated: true`, ale nie `name` ani oryginalnego tekstu. D1/R2 pozostaje
   bez zmian.

## Rollback

Przywróć poprzednią wersję Workera. Nie migruj ani nie nadpisuj rekordów.
Frontend degraduje się do lokalnego wyniku, więc niedostępność API nie może
blokować startu ani zakończenia gry.
