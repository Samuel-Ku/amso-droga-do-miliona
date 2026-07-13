# AMSO — Droga do Miliona

Dedykowana, responsywna strona kampanii z dwiema odmianami runnera:

- **Droga do Miliona** — 18 scen czytanych we własnym tempie i co najmniej 5 minut aktywnej gry;
- **Próba Miliona** — odblokowywany endless runner, jedna niezabezpieczona kolizja kończy bieg.

Aktualnym źródłem wymagań jest
[`scenariusz_implementacyjny_droga_do_miliona_v4_czytelnosc.md`](./scenariusz_implementacyjny_droga_do_miliona_v4_czytelnosc.md).
Treść historii pozostaje w
[`amso_droga_do_miliona_scenariusz.md`](./amso_droga_do_miliona_scenariusz.md).

## Uruchomienie

~~~bash
npm install
npm run dev
~~~

Kontrole jakości:

~~~bash
npm run typecheck
npm test
npm run build:all
~~~

`npm run build:demo` tworzy dedykowaną stronę w `dist-demo/`.
`npm run build:single` dodatkowo składa wersję testową do
`droga-do-miliona-qa.html`, którą można otworzyć bez serwera.

## Co jest zaimplementowane

- zewnętrzny config z całym polskim copy, 18 scenami i tuningiem czasu/trudności;
- trzyczęściowe intro, pięć epok i finał uruchamiany wyłącznie przyciskiem gracza;
- pełnoekranowe, czytelne sceny, autopilot 0,3×, pusta trasa i odliczanie 3–2–1;
- skok oraz ślizg na klawiaturze, pointerze i touchu;
- fabularna regeneracja po kolizji bez zmiany prędkości ani trajektorii;
- cele wszystkich epok z postępem w HUD, typowana kolejka zamówień, trzy power-upy
  i finalna Fala Miliona;
- cztery różne mikro-kulminacje, transformacje przeszkód i pozytywne motywy;
- osiem fizycznie zbieranych symboli finału z uczciwym ponownym spawnem po pominięciu;
- przejście do Próby Miliona w tym samym biegu, bez resetu wyniku, paczek i aktywnych bonusów;
- brak checkpointów story; profil zapisuje ukończenie, rekord, mute i preferencję fullscreen;
- logistyczne fale 45–60 s, limit prędkości 1,55× i share card FB/IG;
- lekka muzyka/efekty Web Audio uruchamiane dopiero po geście użytkownika;
- tylko trzy, zależne od zgody eventy analityczne.

Voice-over pozostaje świadomie odłożony jako stretch goal.

## Najważniejsze pliki

~~~text
src/CampaignController.ts          # koordynacja dedykowanej strony
src/ui/CampaignShell.ts            # responsywny DOM, ekrany i share card
src/game/RunnerGame.ts             # pętla gry i tryby
src/game/story-timeline.ts         # player-paced sekwencja scen i 300 s aktywnej gry
src/game/story-objectives.ts       # cele i postęp pięciu epok
src/game/logistic-wave.ts          # fale Próby Miliona
src/profile.ts                     # localStorage z bezpiecznym fallbackiem
src/analytics/                     # minimalny kontrakt dataLayer
public/assets/milion-runner/
  runner-config.json               # produkcyjne copy i parametry kampanii
~~~

Kanoniczne doświadczenie montuje `mountCampaign()` na osobnej stronie. Stare
triggery sklepu korzystają wyłącznie z adaptera przekierowującego do `/milion`;
pełna modalna kopia gry nie jest utrzymywana.

## Przed publikacją

Wymagane są jeszcze playtesty na realnych telefonach (minimum 390 × 844,
412/430 px oraz minimum 844 × 390 w landscape), potwierdzenie maksymalnej
prędkości i ewentualny tuning wartości w
`runner-config.json`. Lista odbiorowa znajduje się w [`docs/QA_V4.md`](./docs/QA_V4.md).
