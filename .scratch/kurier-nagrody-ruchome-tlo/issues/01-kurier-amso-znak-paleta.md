# 01 — Kurier AMSO z właściwym znakiem i paletą

**What to build:** Kurier podczas biegu, skoku i ślizgu ma wyglądać jak jedna
spójna postać AMSO: używać dokładnego białego znaku `A` przekazanego przez
użytkownika oraz zatwierdzonej pomarańczowo-niebiesko-czarnej palety. Znak ma
być czytelny także w autonomicznej wersji gry bez połączenia sieciowego.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Przezroczyste marginesy przekazanego znaku zostają przycięte bez zmiany geometrii `A`.
- [x] Białe `A` jest wyśrodkowane bezpośrednio na pomarańczowej koszulce, bez dodatkowej tabliczki ani ramki.
- [x] Czapka, koszulka i rękawy są pomarańczowe, pas niebieski, spodnie czarne, a buty białe.
- [x] Skaner jest ciemnoszary i ma zielony ekran.
- [x] Wcześniejsze czerwono-różowe akcenty ubioru nie pozostają na kurierze.
- [x] Bieg, skok i ślizg używają tej samej palety oraz tego samego znaku.
- [x] Brak obrazu znaku nie blokuje startu gry ani nie ukrywa sylwetki kuriera.
- [x] Znak jest częścią planu zasobów i autonomicznego HTML, bez zewnętrznego żądania sieciowego.
- [x] Testy zachowania renderera obejmują co najmniej pozycję zwykłą i ślizg, bez testowania piksel po pikselu.
