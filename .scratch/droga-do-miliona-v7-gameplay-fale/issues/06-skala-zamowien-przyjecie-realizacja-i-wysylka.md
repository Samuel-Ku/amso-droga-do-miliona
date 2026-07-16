# 06 — Skala Zamówień — przyjęcie, realizacja i wysyłka

**What to build:** Mikropoziom skali, w którym gracz utrzymuje przepływ zamówienia przez trzy rozpoznawalne strefy, korzysta z widocznej ochrony i po ukończeniu otrzymuje zrozumiałe porównanie rocznej skali.

**Blocked by:** 03 — Odbiór i strojenie pionowego wycinka.

Status: ready-for-human

- [x] Poziom ma strefy `Przyjęcie`, `Realizacja` i `Wysyłka`, każda po trzy autorskie fale.
- [x] Ukończona strefa pozostaje zaliczona; kolizja powtarza wyłącznie bieżącą falę.
- [x] Fale są dłuższe, szybsze i gęstsze niż wcześniej, lecz zachowują jedną akcję na atom, trasę paczek i czas reakcji.
- [x] HUD pokazuje bieżącą rozpoznawalną strefę oraz postęp, na przykład `WYSYŁKA 1/3`.
- [x] W poziomie debiutuje `GWARANCJA` jako jeden wyraźnie naładowany ładunek tarczy.
- [x] Pierwsza demonstracja pokazuje ochronę przyczyna → skutek; pochłonięta kolizja rozbija tarczę, lecz nie tworzy niewidzialnej trwałej ochrony.
- [x] Jednocześnie aktywne mogą być najwyżej dwa bonusy, a żaden bonus nie pojawia się na przeszkodzie ani w niebezpiecznej trajektorii.
- [x] Payoff pokazuje domknięty przepływ przyjęcie → realizacja → wysyłka bez abstrakcyjnych linii i ramek.
- [x] Bezpieczna animacja po poziomie wyjaśnia `28 000 telefonów rocznie ≈ 240 m ≈ PKiN` za pomocą rozpoznawalnych obiektów.
- [x] Test lifecycle potwierdza trwałość ukończonych stref, retry bieżącej fali, ochronę gwarancji, semantyczny HUD i przejście do porównania skali.
