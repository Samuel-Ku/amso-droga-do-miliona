# 18 — Przygotować release candidate i przeprowadzić odbiór v5

**What to build:** Złożyć wszystkie pionowe wycinki w jeden kandydat do publikacji, dostarczyć marketingowi poprawiony copydeck i udowodnić jakość przez automatyczne, wizualne, urządzeniowe oraz zrozumieniowe kryteria odbioru.

Blocked by: 17

Status: ready-for-human

- [x] Copydeck zawiera wszystkie sceny, poprawne perspektywy, 300 zł, 100 000 zł, rok, 10% budżetu, siedem lat, dane skali i pola `AKCEPT/ZMIANA/ODRZUĆ`.
- [x] Marketing potwierdził każdą publikowaną liczbę, porównanie i zakres testów serwisowych albo implementacja jawnie oznacza je jako oczekujące.
- [x] Typecheck, pełny zestaw testów, production build i single-file build kończą się powodzeniem.
- [ ] Zbudowany artefakt przechodzi visual QA przy 390, 756, 757, 1280, 1600 i 1920 px bez przycięć, nakładania, różnic poziomu i czarnych ekranów.
- [x] Fale wjeżdżają spoza prawej krawędzi, a paczki i przeszkody pozostają rozdzielone w story oraz challenge.
- [ ] Odbiór obejmuje klawiaturę, czytnik ekranu, reduced motion, fullscreen, resize i fizyczne urządzenia.
- [ ] Co najmniej 4 z 5 testerów rozumie cel gry, rozróżnia AMSO od klientów, streszcza dwie kluczowe historie, wyjaśnia liczby skali i zauważa zmianę zasad challenge.
- [x] Voice-over, dark mode i rozszerzona analityka pozostają poza release candidate.

## Comments

- 2026-07-15: aktywna scena `story.scale:boeing-comparison` jawnie informuje, że porównanie oczekuje na końcową akceptację marketingu. Scena jakości nie publikuje nazw niepotwierdzonych testów komponentów. Pozostałe decyzje redakcyjne nadal wymagają wypełnienia pól akceptacji w copydecku przed publikacją.
- 2026-07-15: środowisko automatyzacji zwróciło pustą listę dostępnych przeglądarek, dlatego visual, urządzeniowe i zrozumieniowe kryteria nie zostały oznaczone jako wykonane.
- 2026-07-15: naprawiono bezpośrednie uruchamianie QA HTML. Trusted single-file validator akceptuje teraz zarówno osadzone AVIF, jak i używany przez świat procesu osadzony SVG; osobny test regresyjny chroni ten kontrakt.
