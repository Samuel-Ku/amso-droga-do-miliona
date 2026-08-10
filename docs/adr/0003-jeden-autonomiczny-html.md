# Jeden autonomiczny HTML jako artefakt produkcyjny

## Status

Zastąpione przez ADR 0007 dla produkcyjnego wdrożenia IdoSell. Autonomiczny HTML
pozostaje artefaktem offline QA i odbioru.

Kampania będzie dostarczana jako jeden autonomiczny HTML zawierający kod i wszystkie assety; nie powstanie osobny wieloplikowy wariant produkcyjny. Ograniczenia wdrożenia wykluczają zewnętrzne pliki i cache sieciowy, dlatego optymalizacja startu oraz pamięci musi działać wewnątrz pojedynczego pliku, zachowując możliwość lokalnego uruchomienia offline.
