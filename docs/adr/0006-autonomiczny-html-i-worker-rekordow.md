# Autonomiczny HTML i Worker rekordów mają osobne granice wdrożenia

## Status

Przyjęte — zaktualizowane 2026-08-10 przez ADR 0007 dla granicy frontendu;
kontrakt Workera i D1 pozostaje bez zmian.

## Decyzja

Produkcyjny frontend IdoSell korzysta z Pakietu zewnętrznego IdoSell opisanego w
ADR 0007. Autonomiczny HTML pozostaje artefaktem offline QA, więc podstawowa
rozgrywka i ekran wyniku nadal mogą być odebrane bez Workera.

Worker rekordów jest opcjonalną usługą sieciową, a nie drugim wariantem frontendu ani częścią wieloplikowego artefaktu kampanii. Gdy sieć lub Worker są niedostępne, leaderboard może być niedostępny, ale nie blokuje to uruchomienia gry, zakończenia próby ani lokalnego wyniku.

Źródłem prawdy leaderboardu jest D1. Przechowuje po jednym najlepszym wyniku
anonimowego gracza, egzekwuje globalnie unikalną kanoniczną nazwę i obsługuje
dokładne miejsce poza publicznym topem. Dotychczasowy obiekt R2 pozostaje
read-only źródłem idempotentnego importu legacy oraz krótkoterminowego rollbacku;
nie jest równoległym write modelem.

Jeżeli frontend korzysta z leaderboardu, Worker pozostaje źródłem prawdy dla walidacji nazwy przed zapisem i moderacji nazw zwracanych przy odczycie. Frontend i Worker korzystają z tego samego wersjonowanego źródła polityki na etapie budowania, lecz są wdrażane i wycofywane niezależnie.

## Konsekwencje

- ADR 0007 określa produkcyjną granicę artefaktu frontendowego IdoSell.
- Wdrożenie Workera ma osobne release notes, testy kontraktu i rollback.
- Migracje D1 i import legacy są jawne, idempotentne i wdrażane przed frontendem korzystającym z nowego kontraktu.
- Publiczne odpowiedzi nie ujawniają anonimowego identyfikatora właściciela nazwy.
- Awaria sieci nie może powodować awarii podstawowej gry.
- Zmiana wersji moderation-policy wymaga wdrożenia Workera oraz uwzględnienia wersji polityki w cache leaderboardu.
