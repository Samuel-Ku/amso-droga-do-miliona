# 07 — Zintegrowany odbiór v8 i autonomiczny build

**What to build:** Złożyć wszystkie zachowania v8 w jeden gotowy do przekazania
build i przejść deterministyczny odbiór użytkownika. Gra lokalna i osadzona ma
pokazywać ten sam czysty gameplay, ciągłe tło, Gwarancję, naturalnego kuriera i
sterowanie na wszystkich obsługiwanych formatach bez regresji v7.

**Blocked by:** 01 — Czytelne przeszkody bez nakładanych oznaczeń; 02 — Bezszwowy cykl tła bez lustrzanego odbicia; 03 — Crossfade światów i centralny kadr historii; 04 — Jedna semantyka `GWARANCJI 48 M`; 05 — Naturalne tempo animacji kuriera; 06 — Sterowanie jedną ręką bez przypadkowego pomijania historii.

**Status:** ready-for-human

- [x] Pełny build, walidacja konfiguracji i komplet automatycznych testów przechodzą bez błędów.
- [x] Autonomiczny HTML uruchamia grę lokalnie bez sieci i zawiera aktualne zasoby oraz logikę v8.
- [ ] Jedna deterministyczna sesja przechodzi od intro przez gameplay i historię do Trybu Wyzwania.
- [ ] Sesja potwierdza przeszkody bez overlayów, bezszwowy ruch tła, centralne pauzy i crossfade światów.
- [ ] Sesja potwierdza pełny cykl `GWARANCJA 48 M ×1` oraz brak widocznego `OCHRONA` i fioletowego shielda.
- [ ] Sesja potwierdza naturalny krok przy początku i przy 3,5× oraz wszystkie mapowania wejścia.
- [ ] Macierz obejmuje desktop, kontener do 1600 px, telefon 390 px, portret, krajobraz, standardowy i wysoki DPR.
- [ ] Macierz obejmuje Chromium i WebKit/Safari oraz nie zgłasza błędów konsoli, overflow ani czarnego ekranu.
- [ ] Reduced motion zachowuje pełne tło, czytelny shield i kompletną informację bez intensywnych efektów.
- [x] Raport QA nie zawiera danych osobowych i opisuje kroki ludzkiego odbioru miękkiego styku, centralnego kadru oraz naturalności animacji.
- [ ] Ludzkie kryterium wizualne potwierdza brak widocznej szczeliny, lustrzanego odbicia, przypadkowego centrum i drgania kuriera.
- [x] Nie występują regresje fal v7, punktacji, kolizji, finału, przejścia do wyzwania ani celebracji progów.

## Comments

`npm run build:all`, walidacja konfiguracji i 244 testy przechodzą. HTML,
CSV oraz kadry QA zostały zregenerowane. Interaktywny odbiór wizualny macierzy
pozostaje do wykonania, ponieważ środowisko implementacyjne nie udostępniło
przeglądarki.

Aktualizacja 2026-07-16: po dodaniu kontrolowanego handoffu przeglądarkowego
przechodzi 246 testów. Procedura, anonimowa macierz standalone/site-container
oraz kryteria odbioru znajdują się w `qa/raport-rc-v8.md`.
