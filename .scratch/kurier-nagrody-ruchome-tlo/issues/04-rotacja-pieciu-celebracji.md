# 04 — Rotacja pięciu celebracji i rosnąca intensywność

**What to build:** Każdy kolejny próg może zaskoczyć gracza inną celebracją.
Pięć zatwierdzonych typów działa w przewidywalnej rotacji, a kolejne pełne cykle
zwiększają intensywność bez wydłużania efektu, naruszania bezpiecznej strefy ani
zmiany mechaniki gry.

**Blocked by:** 03 — Pierwsza celebracja progu paczek end-to-end.

**Status:** ready-for-human

- [x] Progi deterministycznie rotują przez konfetti, pulsujące koło, łuki i wstęgi, deszcz małych paczek oraz falę po trasie.
- [x] Dwa kolejne progi nie pokazują tego samego typu celebracji.
- [x] Po pięciu progach kolejny cykl zwiększa intensywność, ale zachowuje czas 1,2–1,5 sekundy.
- [x] Żadna celebracja nie używa gwiazdy ani symbolu przypominającego gwiazdę.
- [x] Deszcz paczek jednoznacznie przypomina paczki z gry, lecz nie można go pomylić z obiektami do zebrania.
- [x] Fala świetlna korzysta z istniejącej programowej trasy i nie zmienia jej geometrii.
- [x] Wszystkie cząstki pozostają za paczkami, przeszkodami, kurierem i osłoną gwarancji.
- [x] Kolorowy napis pozostaje czytelny i poniżej HUD dla każdego wariantu.
- [x] Cue audio rozwija jedną rodzinę brzmieniową; większe progi mogą dodawać nuty bez zatrzymywania muzyki.
- [x] `Reduced motion` zastępuje każdy typ tym samym statycznym komunikatem bez pulsowania, fal, deszczu i przesunięć.
- [x] Publiczny stan celebracji ujawnia próg, typ, poziom intensywności i czas, dzięki czemu testy nie zależą od pojedynczych cząstek.
