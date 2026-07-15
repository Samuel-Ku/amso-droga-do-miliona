# Raport release candidate v6

## Kontrole wykonane przez agenta

- production flow: 14 kart, 10 scen, 210 sekund aktywnej gry, milion i płynne przejście do challenge;
- wejścia: blokada pierwszego przypadkowego kliknięcia/Spacji, brak kolejkowania, równoważne `S` i `↓`;
- warstwa wizualna: przedmiotowe sceny, jasna paleta, jedna płaszczyzna, brak Boeingów i usuniętych historii w runtime;
- challenge: siedem pozytywnych finalnych stanów bez powrotu do usuniętych historii;
- copydeck: 14 aktywnych rekordów z faktami, czynnościami, finalnymi kadrami, limitami i polami decyzji;
- build: typecheck, pełne testy, produkcyjna paczka, loader, single-file HTML i CSV.

## Kontrole wizualne agenta

- desktop: start, pierwsza karta, blokada CTA oraz brak błędów konsoli;
- 390 × 844: pierwsza karta mieści się w kadrze, CTA odblokowuje się po wymaganym czasie;
- reduced motion: objęte regułami CSS oraz automatycznymi testami prezentacji.

## Otwarte kryterium ludzkie

Ticket 11 pozostaje **ready-for-human**. Agent nie oznacza testu 4/5 jako wykonanego. Należy przeprowadzić procedurę z `qa/test-zrozumialosci-v6.md` dla wszystkich identyfikatorów z `qa/final-frame-matrix-v6.csv` i zapisać odpowiedzi oraz decyzje.
