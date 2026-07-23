# Frontend release — mobile landing, result i leaderboard

## Zakres artefaktu

Frontend obejmuje uproszczony ekran „Koniec próby”, mobile-first landing,
responsywną prezentację jednej semantycznej tabeli oraz natychmiastową walidację
nazwy. Nie wdraża Workera ani nie zmienia danych w R2.

## Automatyczna brama

- `typecheck`, pełny suite i produkcyjny build muszą przejść.
- Testy komponentów korzystają z produkcyjnych granic
  `CampaignShell.showLanding`, `CampaignShell.showChallengeResult` i
  `RecordBoard.renderFrom(entries)`.
- Responsive smoke obejmuje 320, 360, 390 i 412 px portrait, compact phone
  landscape, tablet i desktop.
- Na każdym kontrolnym viewporcie należy potwierdzić brak horizontal overflow,
  prawidłową kolejność CTA/leaderboard/instrukcja oraz brak miejsca po ukrytych
  elementach.
- Konsola przeglądarki nie może zawierać błędów ani ostrzeżeń wywołanych zmianą.

## Ręczna brama dostępności

Przed publikacją wymaga fizycznego potwierdzenia:

- [ ] VoiceOver w Safari na iPhonie albo TalkBack na Androidzie odczytuje jedną
  tabelę z caption, column headers i nazwami graczy jako row headers.
- [ ] Mobile card presentation nie usuwa relacji nagłówków tabeli.
- [ ] Odczytywany jest tylko aktywny wariant intro.
- [ ] Skrócone „Zamówienia” i „Rekord” mają pełne dostępne nazwy i wartości.
- [ ] Accordion oraz share trigger komunikują stan rozwinięcia.
- [ ] Usunięta karta Gwarancji i akcja pełnej historii nie występują w drzewie
  dostępności ani kolejności fokusu.
- [ ] Keyboard navigation przechodzi logicznie przez header, CTA, instrukcję,
  result actions, share panel, leaderboard i link wyjścia.

## Kolejność wdrożenia

Frontend może zostać opublikowany przed Workerem, ale do chwili wdrożenia
Workera walidacja w przeglądarce nie zamyka ryzyka bezpośredniego API bypass.
Nie komunikować pełnego uruchomienia moderation przed przejściem Worker gate.

## Monitoring

Po publikacji sprawdzić:

- uruchomienie landingu i challenge result;
- zapis poprawnej neutralnej nazwy;
- neutralne komunikaty dla odrzuconej i zbyt długiej nazwy;
- otwarcie i zamknięcie share panelu;
- brak horizontal scroll na Urządzeniu bazowym i Safari na iPhonie.

## Rollback

Frontend można wycofać niezależnie od Workera do poprzedniego Autonomicznego
HTML. Wycofanie UI nie wymaga migracji R2. Jeśli Worker moderation pozostaje
wdrożony, starszy frontend nadal otrzyma bezpieczne publiczne nazwy i może
otrzymać `400 invalid_name` dla nazwy odrzucanej przez aktualny policy.
