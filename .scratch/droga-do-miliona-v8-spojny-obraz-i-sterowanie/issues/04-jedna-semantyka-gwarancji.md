# 04 — Jedna semantyka `GWARANCJI 48 M`

**What to build:** Ujednolicić mechaniczną i wizualną obietnicę pochłonięcia
zderzenia. Każda rzeczywista niewrażliwość ma używać jednego pomarańczowego
shielda podążającego za kurierem, a bonus ma wszędzie nazywać się
`GWARANCJA 48 M`. Zużycie jednego ładunku musi być jednoznacznie widoczne.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Shield jest widoczny wyłącznie wtedy, gdy silnik rzeczywiście pochłonie następne zderzenie.
- [x] Bezpieczny start pokazuje pomarańczowy ciągły shield bez wpisu bonusu w HUD.
- [x] Zebrany bonus pokazuje ten sam shield oraz `GWARANCJA 48 M ×1` w HUD.
- [x] Fioletowy kolor i przerywany obrys zostają całkowicie usunięte z prezentacji niewrażliwości.
- [x] Shield podąża za kurierem w biegu i skoku oraz zmienia się w niższy owal podczas ślizgu.
- [x] Shield obejmuje sylwetkę kuriera, ale nie paczkę niesioną lub znajdującą się obok.
- [x] Pochłonięte zderzenie uruchamia krótki rozbłysk i pęknięcie, po czym shield i `×1` znikają.
- [x] Reduced motion przekazuje zużycie bez intensywnego pulsu lub animowanego pęknięcia.
- [x] Wszystkie widoczne dla gracza użycia `OCHRONA` odnoszące się do bonusu są zastąpione przez `GWARANCJA 48 M`.
- [x] Test przechodzi brak ochrony, bezpieczny start, aktywną Gwarancję, skok, ślizg, kolizję i stan po zużyciu.

## Comments

Wspólna prezentacja ochrony jest wyliczana z realnego stanu mechaniki;
bezpieczny start trwa 1,5 s i rzeczywiście blokuje kolizję.
