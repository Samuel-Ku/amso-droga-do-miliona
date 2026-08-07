# IdoSell: wielojęzyczna kampania „Droga do Miliona”

Wersja pakietu: `2026-08-07.1`. Źródłem pól CMS i URL jest
`src/localization/idosell-deployment.ts`.

## Konfiguracja

1. Utwórz polską stronę na `amso.pl/droga-do-miliona` oraz stronę bazową DE na
   `amso.eu/road-to-a-million`.
2. Wersje EN, ES, CS, IT, FR i UK utwórz pod prefiksem języka i wspólnym slugiem
   `road-to-a-million` zgodnie z tabelą w kodzie.
3. Dla każdej strony ustaw self-canonical oraz cały wzajemny zestaw `hreflang`.
   `x-default` wskazuje EN.
4. IdoSell pozostaje właścicielem `LANGID`, nawigacji i `<html lang>`. Gra nie
   odczytuje cookie i nie zapisuje własnej preferencji języka.
5. Wklej ten sam zbudowany Autonomiczny HTML do wszystkich wersji. Język jest
   wiązany jeden raz z `document.documentElement.lang` podczas mountu.

## Preview

- Sprawdź wejście bez cookie i przejście z wcześniej wybranego języka.
- Sprawdź canonical, osiem reciprocal `hreflang`, `x-default`, CTA, powrót i URL
  karty udostępniania.
- Przejdź landing, historię, HUD, pauzę, wynik, leaderboard i share card.
- Po zmianie Workera wyczyść cache leaderboardu; odpowiedzi mają `no-store` i
  wersję moderation-policy w nagłówku.

## Deployment i rollback

Frontend i Worker wdrażaj osobno. Najpierw Worker, potem zamknięty preview HTML,
a na końcu jednoczesną publikację ośmiu stron. Rollback frontendu polega na
przywróceniu poprzedniego Autonomicznego HTML w IdoSell. Rollback Workera polega
na przywróceniu poprzedniej wersji Workera; awaria leaderboardu nie blokuje gry
ani lokalnego wyniku.

Publikacja pozostaje ręczną operacją operatora IdoSell.
