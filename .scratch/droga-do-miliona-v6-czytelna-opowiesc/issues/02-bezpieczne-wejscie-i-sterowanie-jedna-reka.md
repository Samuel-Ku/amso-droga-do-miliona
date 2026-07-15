# 02 — Bezpieczne wejście do karty i sterowanie jedną ręką

**What to build:** Bezpieczne przejście z aktywnej gry do karty fabularnej, które nie pozwala rozpędzonemu wejściu przypadkowo pominąć pierwszego kroku, a po powrocie zachowuje pełne sterowanie jedną ręką.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Po wejściu do karty Space, Enter, klik i tap są odrzucane przez około 1,5 sekundy.
- [x] Wejścia wykonane podczas blokady nie są kolejkowane i nie uruchamiają kontynuacji po jej zakończeniu.
- [x] CTA jest od początku widoczne, ale semantycznie i funkcjonalnie nieaktywne do czasu osiągnięcia zatwierdzonego punktu animacji.
- [x] Po aktywacji CTA każde świadome wejście kontynuuje scenę najwyżej raz.
- [x] W trybie ograniczonego ruchu blokada trwa około 500 ms i prowadzi do tego samego stanu końcowego.
- [x] Wejście i wyjście z karty zeruje utrzymywany stan skoku oraz ślizgu.
- [x] Podczas aktywnej gry `S` i strzałka w dół wywołują ten sam ślizg oraz poprawnie obsługują keyup.
- [x] Space i tap pozostają wejściami skoku podczas aktywnej gry.
- [x] Automatyczne testy używają kontrolowanego zegara i rzeczywistych zdarzeń klawiatury, myszy oraz dotyku.
