# Jeden autonomiczny HTML jako artefakt produkcyjny

## Status

Zastąpione przez ADR 0009. Opis autonomicznego HTML poniżej jest wyłącznie
historycznym zapisem decyzji i nie stanowi aktualnego artefaktu QA ani odbioru.

Kampania będzie dostarczana jako jeden autonomiczny HTML zawierający kod i wszystkie assety; nie powstanie osobny wieloplikowy wariant produkcyjny. Ograniczenia wdrożenia wykluczają zewnętrzne pliki i cache sieciowy, dlatego optymalizacja startu oraz pamięci musi działać wewnątrz pojedynczego pliku, zachowując możliwość lokalnego uruchomienia offline.
