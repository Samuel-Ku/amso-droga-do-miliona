# 01 — Czytelne przeszkody bez nakładanych oznaczeń

**What to build:** Oczyścić aktywne pole gry z opisowego i dekoracyjnego
overlayu przeszkód. Gracz ma rozpoznawać magazynowe zagrożenia po konkretnym
kształcie oraz detalach przedmiotu, bez czytania słów, plakietek, piktogramów
lub symboli podczas biegu. Typowane warianty fal i etykiety zbieranych paczek
muszą pozostać funkcjonalne.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Każda rodzina obiektów kolizyjnych jest renderowana bez słów i liter.
- [x] Przeszkody nie zawierają nakładanych plakietek, piktogramów, checkboxów ani dekoracyjnych symboli.
- [x] Kartony, palety, wózki i elementy przenośnika zachowują rozpoznawalne detale konstrukcyjne.
- [x] Wariant semantyczny nadal przechodzi przez falę, walidację i raportowanie, ale nie tworzy tekstu na przeszkodzie.
- [x] Etykiety i oznaczenia zbieranych paczek pozostają widoczne.
- [x] Reprezentatywny test integracyjny obejmuje każdą rodzinę przeszkód i odróżnia ją od kolekcjonerskiej paczki.
- [x] Zmiana nie wpływa na collider, wymaganą akcję, spawn ani punktację.

## Comments

Implementacja usuwa wyłącznie warstwę opisową renderera; modele, hitboxy,
warianty fal i rendering paczek pozostały bez zmian. Pokrycie: `game-engine`.
