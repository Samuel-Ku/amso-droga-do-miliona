# Minimalna analityka v3

Gra nie wysyła danych bezpośrednio do GA4. `DataLayerTracker` zapisuje zdarzenia do
`window.dataLayer` wyłącznie wtedy, gdy host jawnie udostępni zgodę
(`window.AMSOAnalyticsConsent === true` albo `data-analytics-consent="granted"` na
elemencie `html`). Brak lub błąd odczytu zgody oznacza brak telemetryki.

| Event | Parametry | Moment |
|---|---|---|
| `game_started` | `mode: story \| challenge` | start faktycznej rozgrywki |
| `story_completed` | brak | po pełnych 5 s `final.thanks` |
| `game_load_failed` | bezpieczny `error_code` | kontrolowany błąd inicjalizacji |

Każdy event zawiera wyłącznie stałe `game_name` i bezpieczne `game_version`.

Nie wysyłamy wyników, kolizji, epok, paczek, power-upów, share, checkpointów,
URL-i, danych osobowych ani identyfikatora gracza. Raport mierzy uruchomienia, nie
unikalnych użytkowników.

