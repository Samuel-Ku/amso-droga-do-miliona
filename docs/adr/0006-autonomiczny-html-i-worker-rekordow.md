# Autonomiczny HTML i Worker rekordów mają osobne granice wdrożenia

## Status

Przyjęte — doprecyzowuje ADR 0003; zaktualizowane 2026-08-06 dla D1.

## Decyzja

Produkcyjny frontend kampanii nadal jest jednym autonomicznym plikiem HTML. Kod gry, style i assety nie wymagają dodatkowych plików ani połączenia sieciowego, więc podstawowa rozgrywka i ekran wyniku działają offline.

Worker rekordów jest opcjonalną usługą sieciową, a nie drugim wariantem frontendu ani częścią wieloplikowego artefaktu kampanii. Gdy sieć lub Worker są niedostępne, leaderboard może być niedostępny, ale nie blokuje to uruchomienia gry, zakończenia próby ani lokalnego wyniku.

Źródłem prawdy leaderboardu jest D1. Przechowuje po jednym najlepszym wyniku
anonimowego gracza, egzekwuje globalnie unikalną kanoniczną nazwę i obsługuje
dokładne miejsce poza publicznym topem. Dotychczasowy obiekt R2 pozostaje
read-only źródłem idempotentnego importu legacy oraz krótkoterminowego rollbacku;
nie jest równoległym write modelem.

Jeżeli frontend korzysta z leaderboardu, Worker pozostaje źródłem prawdy dla walidacji nazwy przed zapisem i moderacji nazw zwracanych przy odczycie. Frontend i Worker korzystają z tego samego wersjonowanego źródła polityki na etapie budowania, lecz są wdrażane i wycofywane niezależnie.

## Konsekwencje

- ADR 0003 pozostaje obowiązujący dla artefaktu frontendowego.
- Wdrożenie Workera ma osobne release notes, testy kontraktu i rollback.
- Migracje D1 i import legacy są jawne, idempotentne i wdrażane przed frontendem korzystającym z nowego kontraktu.
- Publiczne odpowiedzi nie ujawniają anonimowego identyfikatora właściciela nazwy.
- Awaria sieci nie może powodować awarii podstawowej gry.
- Zmiana wersji moderation-policy wymaga wdrożenia Workera oraz uwzględnienia wersji polityki w cache leaderboardu.
