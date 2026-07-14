# 18 — Przygotować release candidate i przeprowadzić odbiór v5

**What to build:** Złożyć wszystkie pionowe wycinki w jeden kandydat do publikacji, dostarczyć marketingowi poprawiony copydeck i udowodnić jakość przez automatyczne, wizualne, urządzeniowe oraz zrozumieniowe kryteria odbioru.

Blocked by: 17

Status: ready-for-agent

- [ ] Copydeck zawiera wszystkie sceny, poprawne perspektywy, 300 zł, 100 000 zł, rok, 10% budżetu, siedem lat, dane skali i pola `AKCEPT/ZMIANA/ODRZUĆ`.
- [ ] Marketing potwierdził każdą publikowaną liczbę, porównanie i zakres testów serwisowych albo implementacja jawnie oznacza je jako oczekujące.
- [ ] Typecheck, pełny zestaw testów, production build i single-file build kończą się powodzeniem.
- [ ] Zbudowany artefakt przechodzi visual QA przy 390, 756, 757, 1280, 1600 i 1920 px bez przycięć, nakładania, różnic poziomu i czarnych ekranów.
- [ ] Fale wjeżdżają spoza prawej krawędzi, a paczki i przeszkody pozostają rozdzielone w story oraz challenge.
- [ ] Odbiór obejmuje klawiaturę, czytnik ekranu, reduced motion, fullscreen, resize i fizyczne urządzenia.
- [ ] Co najmniej 4 z 5 testerów rozumie cel gry, rozróżnia AMSO od klientów, streszcza dwie kluczowe historie, wyjaśnia liczby skali i zauważa zmianę zasad challenge.
- [ ] Voice-over, dark mode i rozszerzona analityka pozostają poza release candidate.
