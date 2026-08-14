# Zamrożony story countdown — raport odbioru

> Historyczny raport wydania. Frontendowe dowody loadera i autonomicznego HTML zostały zastąpione przez ADR 0009 oraz bieżące bramki Vercel.

## Zakres

Zmiana zastępuje wcześniejszy kontrakt, w którym Panel świata rozpoczynał ruch
razem z pierwszą cyfrą countdownu. Obowiązujący kontrakt utrzymuje przygotowany
początkowy kadr przez cały countdown i uruchamia gameplay atomowo dopiero po
jego zakończeniu.

## Automatyczna walidacja

- 57 plików testowych i 555 testów zakończonych powodzeniem.
- TypeScript typecheck zakończony powodzeniem.
- Produkcyjny build i build loadera zakończone powodzeniem.
- Autonomiczny HTML zbudowany z 45 osadzonymi obrazami w 94 odwołaniach.
- Budżet Autonomicznego HTML spełniony: 16.32 MB.
- Test przejścia `scene → reframe → countdown → play` potwierdza wyłączone
  sterowanie i niezmienny visual-frame distance podczas countdownu.
- Test Paneli świata potwierdza pozycję lokalną `0` na wszystkich cyfrach oraz
  pierwszy ciągły krok dopiero po publicznym `returnToGame`.
- Test gotowości prezentacji potwierdza wyłączone `Dalej` przed gotowością
  assetu oraz odblokowanie po zakończeniu publicznego oczekiwania.
- Test błędu assetu potwierdza, że semantyczny fallback kończy gotowość
  prezentacji zamiast blokować historię.
- Porównanie dwóch przebiegów z tym samym seedem potwierdza, że jump i slide
  wysłane podczas countdownu nie pozostawiają zbuforowanego skutku w pierwszym
  aktywnym snapshotcie ani w dalszym przebiegu.
- Publiczne snapshoty na każdej cyfrze zachowują dystans, wynik, kolizje,
  ochronę, recovery, trudność, cele, power-upy wraz z ich timerem demo i stan
  authored wave.
- Testy audio potwierdzają pojedynczą sekwencję 3–2–1, malejącą wysokość
  sygnałów oraz brak odtwarzania przed startem i po wyciszeniu.
- Testy Paneli świata obejmują zwykły i ograniczony ruch, a także przejście
  między stanami tego samego świata i zmianę na inny świat.

Suite wypisuje znany diagnostyczny `ECONNREFUSED` dla opcjonalnego lokalnego
endpointu rekordów na porcie 3000; nie powoduje on błędu testu.

## Odbiór w przeglądarce

Rzeczywisty flow kampanii uruchomiono z landingu, przechodząc przez dwie
autorskie strony pierwszej sceny do countdownu. Dla skonfigurowanych cyfr `2`
i `1` warstwa świata raportowała:

- `motionState: reading`;
- `--world-phase-px: 0px`;
- transformaty Paneli `0%` i `100%`, bez zmiany między próbkami.

Po przejściu do `game` pierwsza zarejestrowana pozycja wynosiła około `1.98 px`,
więc świat ruszył małym krokiem od lokalnego początku zamiast przeskoczyć do
absolutnej fazy poprzedniego segmentu. Widoczny kurier pozostawał podczas
countdownu na pierwszej klatce biegu. Konsola aplikacji nie zawierała błędów ani
ostrzeżeń; widoczne wpisy pochodziły wyłącznie z narzędzia rozszerzenia
przeglądarki i klienta developerskiego.

## Otwarte manualne bramki wydania

- Urządzenie bazowe: rzeczywisty Android klasy średniej, odbiór obrazu, audio i
  płynności startu.
- Safari na fizycznym iPhonie: odbiór statycznego countdownu, pierwszego kroku,
  dźwięku i fallbacku.
Te bramki wymagają fizycznych urządzeń i pozostają otwarte. Wynik desktopowego
browser QA ani headless testów nie zastępuje ich zgodnie z Bramką wydania.
