# 15 — Przekazać wynik do `Trybu Wyzwania` i aktywować gwarancję

**What to build:** Po celebracji miliona jawnie zmienić reguły, zachować wynik i przeprowadzić gracza do ryzykownego challenge, w którym widoczna gwarancja może uratować dokładnie jedną kolizję.

Blocked by: 05

Status: ready-for-agent

- [x] Modal `TRYB WYZWANIA` mówi o zachowaniu wyniku, rosnącym tempie i końcu próby po pierwszej niezabezpieczonej kolizji.
- [x] `Podejmuję wyzwanie` uruchamia bezpieczne odliczanie `3–2–1`, po którym znika copy fabularne.
- [x] Wynik, paczki i aktywne bonusy przechodzą bez resetu do challenge.
- [x] Zebrana gwarancja pokazuje kontur wokół kuriera i trwały HUD `OCHRONA ×1`.
- [x] Ochrona nie zużywa się przy kolizjach w story i nie kumuluje się ponad jedną sztukę.
- [x] Pierwsza kolizja w challenge rozbija osłonę, pokazuje komunikat o uratowaniu próby i pozwala biec dalej.
- [x] Następna niezabezpieczona kolizja kończy próbę; bez gwarancji kończy ją już pierwsza kolizja.
- [x] Zmiana trybu oraz stany ochrony są komunikowane klawiaturze i technologiom asystującym.
