# QA produkcyjne — Droga do Miliona v3

Automatyczne bramki:

~~~bash
npm run typecheck
npm test
npm run build:all
~~~

Pakiet automatyczny obejmuje 100 deterministycznych seedów generatora, geometrię
skoku/ślizgu, minimalne okna reakcji, wszystkie trzy power-upy, osiem symboli
finału oraz bramki krytycznych paczek assetów. Nie zastępuje to odbioru na
fizycznych urządzeniach.

## Macierz urządzeń

Sprawdź co najmniej:

- 360 × 800;
- 375 × 812;
- 390 × 844;
- 412/430 px portrait;
- reprezentatywny landscape mobile;
- desktop przy 1280 i 1920 px;
- szerokość poniżej 360 px (komunikat o obrocie, bez rozsypania layoutu).

Na minimum dwóch realnych telefonach potwierdź płynność, gest ślizgu, fullscreen,
obrót bez resetu i maksymalną prędkość challenge. Jeśli reakcja jest zbyt krótka,
dostosuj `speedStartMultiplier`, `speedMaxMultiplier` i odstępy w zewnętrznym
`runner-config.json`; nie skracaj `final.thanks` poniżej 5 s.

## Scenariusze krytyczne

1. Nowy profil widzi wyłącznie „Rozpocznij historię”.
2. Kolizje w story nie kończą biegu, nie zmieniają aktywnego skoku ani wyniku.
3. Korytarz zaufania na krótko przemienia widoczne zagrożenia w pozytywny motyw,
   następnie je usuwa, wycisza HUD i czytelnie oddaje kontrolę.
4. Checkpoint każdej epoki i finału wraca na początek właściwej części.
5. `final.thanks` jest widoczne pełne 5 s; dopiero potem odblokowuje challenge.
6. Replay historii nie blokuje ponownie challenge.
7. Challenge kończy pierwsza niechroniona kolizja; gwarancja ratuje dokładnie raz.
8. Fala logistyczna ma trzy czytelne wzory i pojawia się w oknie 45–60 s.
9. Share card zawiera wynik, paczki i kanoniczny URL; nic nie publikuje automatycznie.
10. Bez localStorage, audio, zgody analitycznej lub reduced motion historia nadal działa.
11. Każda epoka czeka wyłącznie na swój krytyczny bundle; błąd pokazuje retry,
    a zasoby opcjonalne nie blokują historii.

## Treść

- porównaj wszystkie 43 ID copy z dokumentem v3;
- zweryfikuj anonimowość trzech historii klientów;
- sprawdź liczby marketingowe na aktualnej akceptacji;
- nie dodawaj voice-overu liczb bez osobnej decyzji produkcyjnej.
