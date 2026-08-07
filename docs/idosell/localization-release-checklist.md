# Localization release checklist

Automatyczna część: `npm test`, `npm run build`, `npm run build:single`,
`npm run check:localization` oraz — z aktualnym plikiem wskazanym przez
`AMSO_PERFORMANCE_EVIDENCE` — `npm run check:performance-release`.

## Macierz preview

Przejdź PL, DE, EN, ES, CS, IT, FR i UK przez: landing, instrukcję, każdą kartę
historii, countdown, aktywny HUD/canvas, pauzę, error, result, name prompt,
leaderboard, share panel i wygenerowaną share card. Sprawdź 320, 360, 390 i
412 px, compact phone landscape, tablet oraz desktop; bez poziomego scrolla,
clippingu i drugiej aktywnej wersji copy.

## Ręczne bramki

- Product review EN i UK; semantic review/back-translation pozostałych języków.
- VoiceOver dla PL/EN/UK oraz TalkBack na reprezentatywnym Androidzie.
- Gotowe neutralne main/compact lockupy od projektanta zamiast wersjonowanych
  neutralnych SVG placeholderów.
- Zamknięty preview IdoSell: `LANGID`, direct URL, `<html lang>`, canonical,
  reciprocal `hreflang`, `x-default`, CTA/share URL oraz propagacja cache.
- Scenariusz wzorcowy i Kontrakt niezmienności gameplayu dla tego samego seeda
  i śladu wejść między locale; lokalizacja nie może zmienić wyniku, kolizji ani
  kolejności zdarzeń.

Publikacja wszystkich wersji jest jednoczesną, ręczną decyzją. Otwarte ręczne
bramki nie są automatycznie uznawane za zaliczone.
