# 09 — Orkiestracja nagród, bonusów i audio

**What to build:** Jedną czytelną hierarchię informacji zwrotnej na całej trasie, w której wynik fali, combo, bonus, milestone, payoff i muzyka wzmacniają motywację bez zasłaniania przeszkód lub przeciążania interfejsu.

**Blocked by:** 04 — Proces i Jakość — cztery urządzenia i AUDYT; 05 — Rozwój Firmy Klienta — trzy fazy i DRUGIE ŻYCIE; 06 — Skala Zamówień — przyjęcie, realizacja i wysyłka; 07 — Próg Miliona — finał bez bossa; 08 — Tryb Wyzwania — progresja do 3,5×.

Status: ready-for-human

- [x] Informacja zwrotna respektuje kolejność: zebranie paczki, wynik fali, combo, pierwsze użycie bonusu, milestone paczek i payoff rozdziału.
- [x] Jednocześnie aktywny jest najwyżej jeden duży efekt, a milestone czeka na bezpieczną strefę lub łączy się z payoffem rozdziału.
- [x] Kompaktowe komunikaty rozróżniają zaliczenie, perfekcję i retry bez zasłaniania nadchodzącej trasy.
- [x] Combo pokazuje stan falowy i limit ×8, a perfekcja ma osobny czytelny bonus.
- [x] `AUDYT`, `×2 WYNIK` i `GWARANCJA` mają spójne etykiety, liczniki lub stan ładunku oraz widoczny efekt przyczyna → skutek.
- [x] Menu pauzy zawiera krótką sekcję `Bonusy`, która opisuje działanie wszystkich trzech bez uruchamiania voice-over.
- [x] Zakończenia rozdziałów nie używają `CEL WYKONANY`; payoff wynika ze wskaźnika, dźwięku, bezpiecznej trasy nagród i przemiany świata.
- [x] Muzyka pozostaje ciągła, rozdziały zmieniają warstwę rytmiczną, burst dodaje perkusję, a oddech ją usuwa.
- [x] Zaliczenie, perfekcja, retry, payoff i milion mają rozróżnialne cue, które respektują wyciszenie i posiadają równoważną informację wizualną.
- [x] Reduced motion zachowuje treść nagród i statusy bonusów bez intensywnych pulsów, fal, wstrząsów ani skalowania.
- [x] Test pełnego flow potwierdza kolejkę efektów, brak nakładania dużych celebracji, spójne audio i brak wpływu efektów na spawn, kolizje lub sterowanie.

## Comments

2026-07-16: Warstwy audio są sterowane semantyką aktywnej mikrofali: oddech usuwa perkusję, burst ją dodaje, rozdział zmienia warstwę rytmiczną, a cztery akty finału stopniowo wzbogacają aranżację. Osobne cue obsługują zaliczenie, perfekcję, retry, payoff i milion; test audio potwierdza hierarchię oraz respektowanie wyciszenia.
