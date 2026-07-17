# 06 — Pełne usunięcie Audytu

**What to build:** Gra przestaje oferować power-up `Audyt / więcej czasu na reakcję`, którego efekt tworzył pustą trasę bez czytelnej wartości. Wszystkie dostępne bonusy mają natychmiast widoczne i zrozumiałe działanie.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [ ] Audyt nie pojawia się w zwykłych, fabularnych ani specjalnych falach nagród.
- [ ] Runtime nie przechowuje aktywnego stanu Audytu i nie zmienia przez niego tempa spawnu.
- [ ] Audyt znika z publicznej konfiguracji power-upów, HUD, wskazówek, copy i komunikatów dostępności.
- [ ] Usunięcie nie zmienia działania `GWARANCJA 48 M`, mnożnika punktów ani specjalnych paczek punktowych.
- [ ] Starszy zapis profilu, jeśli zawiera nieużywany ślad Audytu, nie blokuje uruchomienia gry.
- [ ] Autonomiczny HTML i produkcyjny bundle nie zawierają widocznych tekstów obiecujących Audyt.
- [ ] Testy power-upów i fal potwierdzają brak Audytu od konfiguracji do widocznego gameplay.
