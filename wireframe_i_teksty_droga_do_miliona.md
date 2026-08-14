# WIREFRAME + PRZYKLADY TEKSTOW — "Droga do Miliona"
## Konkretne makiety scen + poprawione, ciekawe formulowanie tresci

---

## 0. ZASADA JAKOSCI TEKSTU (do stosowania wszedzie)

Zamiast suchego faktu podanego jak z encyklopedii, kazdy tekst ma miec:
1. **Haczyk/porownanie** (cos znanego, zaskakujacego skalowania).
2. **Perspektywe gracza** (nie "AMSO sprzedalo", ale "Ty wlasnie pomogles zbudowac...").
3. **Ton lekki, nie korporacyjny** — jak dobry przewodnik w muzeum, nie raport sprzedazowy.

Zle (obecnie): "Sprzedalismy 76 tys. notebookow."
Dobrze: "76 412 laptopow. Gdybys ustawil je jeden na drugim, wieza bylaby wyzsza niz Wawel."

Zle: "Kazdy komputer przechodzi audyt."
Dobrze: "Zanim ten laptop trafi do kogos na biurko — ktos go juz sprawdzil. Dokladnie tak jak Ty przed chwila."

---

## 1. WIREFRAME: SCENA "ROSNACA WIEZA TELEFONOW" (epoka 5, tlo)

Opis wizualny (do przekazania grafikowi):

```
[GORA EKRANU — daleki parallax, nie zaslania gameplay]

         .::.
        [ph][ph]         <- wieza rosnie z kazdym zebranym "telefonem"
       [ph][ph][ph]
      [ph][ph][ph][ph]
  ================================
  ..... podloze magazynu (biegnie gracz) .....
  [KURIER BIEGNIE TUTAJ] -> zbiera ikony po drodze
```

**Mechanika:** wiezyczka rosnie WIZUALNIE (bez tekstu) przez cala sesje. Gracz kątem oka widzi postep, ale to NIE przerywa akcji.

**Moment "aha" — koniec gry (zoom out + tekst):**

```
[Kamera oddala sie, pokazuje cala wieze na tle sylwetki miasta]

        [WIEZA Z TELEFONOW]     [PALAC KULTURY (sylwetka, dla skali)]
             |||                        |||
             |||                        |||
             |||                        |||
        ====================================

Tekst (dopiero teraz, po zbudowaniu wizualnym):
"Twoja wieza: 47 telefonow.
AMSO sprzedaje ich tyle rocznie, ze taka wieza
sięgalaby 240 metrow. Wyzej niz Palac Kultury."
```

Kluczowe: tekst pojawia sie PO tym, jak gracz juz zobaczyl obraz — tekst tylko "domyka" to, co juz zrozumial wizualnie.

---

## 2. WIREFRAME: SCENA "AUDYT" (epoka 4, w trakcie biegu, bez tekstu)

```
[TLO — animacja w trakcie biegu, bez przerywania]

   [stol z narzedziami]  [sylwetka serwisanta nachylona nad laptopem]
         |                        |
   [KURIER BIEGNIE] ------------->  (przebiega w tle za ta scena, mija ja jak uliczna witryne)
```

**Brak tekstu w trakcie.** Sama animacja (2-3 sekundy przebiegu obok tej scenki) opowiada historie. Jesli potrzebny podpis — TYLKO na tabliczce w scenerii, np. mala zawieszka "KONTROLA JAKOSCI" (2 slowa, styl szyldu, nie komunikat).

**Tekst pojawia sie WYLACZNIE, jesli gracz zatrzyma sie/wejdzie w interakcje (opcjonalnie, nice-to-have):** hover/tap na scenke = krotki tooltip:
"Kazdy sprzet u nas przechodzi przez rece serwisanta, zanim trafi do Ciebie."

---

## 3. WIREFRAME: CUTSCENE PRZEJSCIA MIEDZY EPOKAMI (2015 -> 2019)

```
[EKRAN PRZECIEMNIONY, GRA W PAUZIE, 2-3 SEK]

        2015                          2019
   [maly magazyn]      ->        [wiekszy magazyn, regaly]

Tekst (jedno zdanie, lekki ton):
"Zaczynalismy od garazu. Dzis to 3000 m2 —
i wciaz brakuje miejsca na nowe zamowienia."

[Gra automatycznie wraca do akcji po 2-3 sek albo po kliknieciu]
```

**Zasada:** kontrast wizualny (maly -> duzy) MOWI wiecej niz liczba. Tekst tylko dodaje lekki, ludzki komentarz — nie powtarza tego, co juz widac na obrazku.

---

## 4. PRZYKLADY POPRAWIONYCH TEKSTOW (caly zestaw, do uzycia w cutscenach/ekranie koncowym)

| Kontekst | Zle (obecnie, "w lob") | Dobrze (przewodnik, ciekawostka) |
|---|---|---|
| Otwarcie firmy | "2008: Powstaje AMSO." | "2008. Jeden magazyn wielkosci kawalerki. Zero gwarancji, ze to wypali." |
| Skalowanie | "Mamy 3000 m2 magazynu." | "Dzis nasz magazyn zmiescilby 12 boisk do koszykowki. Zaczynalismy od jednego pokoju." |
| Klient B2B | "Klient B2B — 7 lat wspolpracy." | "Zaczelo sie od jednego testowego zamowienia — 10% calej transakcji. 7 lat later, kupuje juz tylko u nas." |
| Audyt jakosci | "Kazdy komputer przechodzi audyt." | "Zanim ten laptop trafil na wirtualna polke — ktos go juz uruchomil, sprawdzil, przetestowal. Tak jak Ty wlasnie to zrobiles w grze." |
| Wieza telefonow | "Wieza smartfonow ma 240m." | Patrz sekcja 1 — pelny przyklad z zoom-out. |
| Waga paczek | "Wysylamy 400 000 kg PC rocznie." | "Kartony, ktore dzis wyslalismy, wazyly razem tyle co 5 Boeingow 737 pelnych pasazerow. Codziennie pakujemy je z takim samym zaangazowaniem." |
| Finalny ekran | "Koniec gry. Wynik: 47." | "Przeszedles kawalek naszej 18-letniej drogi. Razem z Toba — juz ponad milion takich podrozy." |

---

## 5. CO ZMIENIC W OBECNEJ IMPLEMENTACJI (konkretne poprawki tekstu)

1. Kazdy istniejacy popup — sprawdzic wzgledem tabeli z sekcji 4, przepisac na wersje "przewodnik", nie "raport".
2. Kazdy fakt liczbowy musi miec PORÓWNANIE do czegos znanego (Wawel, Palac Kultury, boisko, Boeing) — nigdy sama liczba bez kontekstu.
3. Zero zdan w trzeciej osobie bezosobowej ("Sprzedalismy X") — wprowadzic ton bardziej osobisty/kierowany do gracza ("Ty wlasnie...", "Zaczynalismy od...").
4. Kazdy tekst przechodzi test: "Czy to brzmi jak cos, co powiedzialby zywy czlowiek w rozmowie, czy jak raport marketingowy?" — jesli drugie, przepisac.

---

**Kontakt/wlasciciel projektu po stronie AMSO:** dzial marketingu (Adrian Lach — koordynacja zadania), Kamil Kostur (content/social).
