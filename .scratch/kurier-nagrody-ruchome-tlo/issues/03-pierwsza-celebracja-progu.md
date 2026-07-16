# 03 — Pierwsza celebracja progu paczek end-to-end

**What to build:** Zebranie okrągłej liczby paczek uruchamia krótką, czytelną
celebrację bez zatrzymywania biegu i bez zmiany balansu. Pierwszy pełny tracer
bullet obejmuje generator progów, stan jednego biegu, kolorowy komunikat,
konfetti oraz sygnał audio.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] Progi tworzą sekwencję `10, 50, 100, 500, 1 000, 5 000, 10 000…` przez naprzemienne mnożenie przez 5 i 2.
- [x] Każdy próg może uruchomić się dokładnie raz w jednym biegu.
- [x] Przejście story → challenge zachowuje licznik i już pokazane celebracje.
- [x] Restart, nowa próba i ponowne przejście fabuły rozpoczynają system progów od początku.
- [x] Zapisany rekord profilu nie wywołuje celebracji przy otwarciu gry.
- [x] Pierwszy wariant pokazuje konfetti bez gwiazd oraz komunikat w rodzaju `10 PACZEK!`.
- [x] Liczba jest formatowana zgodnie z polskim zapisem, a komunikat nie pokazuje następnego progu.
- [x] Napis używa gradientu AMSO, jasnej podkładki i ciemnego konturu.
- [x] Celebracja trwa 1,2–1,5 sekundy, nie blokuje wejść i nie zmienia punktów, combo, kolizji, spawnu ani power-upów.
- [x] Cząstki są za obiektami gameplay, a napis znajduje się poniżej HUD i nie zasłania przeszkód.
- [x] Jedno osiągnięcie wywołuje jeden krótki cue respektujący wyciszenie.
- [x] Przy `reduced motion` pozostaje statyczny kolorowy komunikat bez konfetti i skalowania.
- [x] Integracyjny test lifecycle obejmuje pierwsze progi, pojedyncze wywołanie, zmianę trybu i reset biegu.
