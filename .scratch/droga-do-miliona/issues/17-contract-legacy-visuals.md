# 17 — Usunąć legacy kontrakty i abstrakcyjne wizualizacje

**What to build:** Zakończyć migrację v5 przez usunięcie nieużywanych nazw, adapterów, symboli i abstrakcyjnych rendererów, pozostawiając jeden spójny model kampanii bez martwych ścieżek.

Blocked by: 03

Status: ready-for-agent

- [x] Legacy nazwy bossów, celów i HUD nie występują w aktywnej konfiguracji ani komunikatach użytkownika.
- [x] Compatibility adapter z expand-fazy zostaje usunięty po migracji wszystkich konsumentów.
- [x] Abstrakcyjne story symbols, chmury, hydra, piggy bank, wielki ołówek, pinezki i przypadkowe krzywe nie są już renderowane.
- [x] Dark mode i automatyczne warianty ciemnego tła zostają usunięte; kampania jawnie używa tylko light mode.
- [x] Kod nie zawiera fallbackowej pięcioramiennej gwiazdy ani czerwonych gwiazd.
- [x] Walidacja konfiguracji odrzuca stare wymagane formy tam, gdzie pełna migracja jest zakończona.
- [x] Cały zestaw testów pozostaje zielony po contract-fazie.
