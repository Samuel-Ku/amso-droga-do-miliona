# 10 — Release candidate v6 i pakiet testowy

**What to build:** Kompletny kandydat v6 gotowy do samodzielnego uruchomienia, automatycznej regresji, redakcji marketingowej i ludzkiego testu zrozumiałości.

**Blocked by:** 09 — Usunięcie abstrakcyjnych warstw i ciągłość świata.

**Status:** ready-for-human

- [x] Autonomiczny QA HTML otwiera production flow bez zewnętrznego serwera i bez błędu konfiguracji.
- [x] Pełny automatyczny lifecycle przechodzi około czternastu kroków, wszystkie zatwierdzone segmenty, milion i challenge.
- [x] Test wejść potwierdza blokadę karty, brak kolejkowania oraz równoważność `S` i strzałki w dół podczas ślizgu.
- [x] Macierz desktop, 390 px i reduced motion przechodzi automatyczne oraz wizualne kontrole możliwe do wykonania przez agenta.
- [x] Każdy aktywny krok ma przygotowany finalny kadr bez copy do testu pięciu sekund.
- [x] Kadry testowe mają jednoznaczne identyfikatory scen i wariant viewportu, ale nie zdradzają oczekiwanej odpowiedzi testerowi.
- [x] Marketingowy CSV zawiera aktualne aktywne copy, limity, fakty i pola decyzji.
- [x] Typecheck, pełny zestaw testów, produkcyjna paczka, loader i single-file build kończą się powodzeniem.
- [x] Raport QA wymienia wszystkie kryteria wymagające jeszcze ludzkiego testu zamiast oznaczać je automatycznie jako wykonane.
