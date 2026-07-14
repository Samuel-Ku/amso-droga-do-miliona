# 01 — Rozszerzyć semantyczne kontrakty v5

**What to build:** Wprowadzić równolegle do działających kontraktów v4 nowe słownictwo, stany narracji, cele i dane prezentacyjne wymagane przez v5, tak aby kolejne pionowe wycinki mogły migrować niezależnie bez przerywania działania obecnej gry.

Blocked by: None

Status: ready-for-agent

- [x] Nowe kontrakty obsługują wielokrokowe sceny sterowane przez gracza, bezpieczne stany narracyjne i jawne przejście story → challenge.
- [x] Model celów potrafi reprezentować 30 paczek, osiem kombinacji i licznik `999 970 → 1 000 000` bez używania ośmiu abstrakcyjnych symboli.
- [x] Model prezentacji rozróżnia `Nasza historia`, `Historia klienta` i `Wyzwanie`.
- [x] Nowe nazwy wyzwań istnieją obok legacy IDs przez okres migracji.
- [x] Konfiguracja v4 nadal przechodzi walidację i uruchamia dotychczasową grę.
- [x] Testy kontraktów dokumentują expand–contract i nie wymagają migracji wszystkich konsumentów w tej samej zmianie.
