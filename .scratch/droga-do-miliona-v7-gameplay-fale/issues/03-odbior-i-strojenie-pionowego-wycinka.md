# 03 — Odbiór i strojenie pionowego wycinka

**What to build:** Zweryfikowany pakiet testowy `Pierwszej paczki` i `Zatoru Zamówień`, który pozwala ludziom ocenić czytelność, tempo, uczciwość i przejście narracyjne przed powieleniem wzorca na resztę gry.

**Blocked by:** 02 — Zator Zamówień — pełny pionowy wycinek.

Status: ready-for-human

- [x] Powstaje uruchamialny pakiet testowy dla desktopu, telefonu 390 px, Safari i przeglądarki Chromium.
- [ ] Testerzy przechodzą oba mikropoziomy bez dodatkowego wyjaśniania semantycznego HUD.
- [ ] 70–85% fal jest zaliczanych za pierwszym razem; wynik poza zakresem zostaje opisany jako zbyt łatwy, zbyt trudny albo nieczytelny.
- [ ] Zostają zmierzone czas szkolenia, czas zatoru, próby na falę, zebranie paczek, pomyłki akcji, powtórzenia i odczuwane tempo.
- [ ] Zostaje potwierdzone, że próg 60% jest zrozumiały, a retry tej samej fali pomaga się jej nauczyć bez frustracji.
- [ ] Testerzy potwierdzają czytelność `RUCHY 2/4` oraz `FALE ZATORU 3/8` bez abstrakcyjnych znaczników.
- [ ] Przejście payoff → settle → karta historii nie zasłania treści, nie przeskakuje tła i nie przewija karty resztkowym wejściem.
- [ ] Na telefonie pierwsza akcja ma odpowiedni dodatkowy bufor wejścia, a logika trudności i punktacji pozostaje taka sama jak na desktopie.
- [ ] Raport wskazuje zatwierdzone korekty wartości konfiguracyjnych albo jawnie potwierdza obecny balans.
- [ ] W komentarzu do ticketu zostaje zapisana decyzja `zaakceptowano do skalowania` przed rozpoczęciem ticketów 04–06.

## Comments

2026-07-16: Pakiet autonomiczny został zbudowany i przeszedł walidację automatyczną (35 plików testowych, 230 testów). Smoke test Playwright Chromium/WebKit dla desktopu, 390 px i reduced motion potwierdził start bez błędów, dekodowanie WebP i brak overflow. Manualna macierz rzeczywistych przeglądarek/urządzeń, czytelność HUD, first-attempt rate i FPS pozostaje do wykonania zgodnie z `qa/raport-rc-v7.md`. Decyzja `zaakceptowano do skalowania` nie została jeszcze wydana.
