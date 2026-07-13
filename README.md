# AMSO — Droga do Miliona

Dedykowana, responsywna strona kampanii z dwiema odmianami runnera:

- **Droga do Miliona** — niepomijalna historia (175 s), pięć epok, checkpointy i gwarantowany finał;
- **Próba Miliona** — odblokowywany endless runner, jedna niezabezpieczona kolizja kończy bieg.

Aktualnym źródłem wymagań jest
[`scenariusz_implementacyjny_droga_do_miliona_v3.md`](./scenariusz_implementacyjny_droga_do_miliona_v3.md).
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

- zewnętrzny config v3 z całym polskim copy i tuningiem czasu/trudności;
- prolog, pięć epok, 43 stabilnie identyfikowane beaty i 25-sekundowy finał;
- korytarze zaufania, autopilot, bezpieczne oddanie kontroli i reduced motion;
- skok oraz ślizg na klawiaturze, pointerze i touchu;
- fabularna regeneracja po kolizji bez zmiany prędkości ani trajektorii;
- seria, iskra, trzy power-upy, adaptacyjne odstępy i finalna Fala Miliona;
- cztery różne mikro-kulminacje, transformacje przeszkód i pozytywne motywy;
- osiem fizycznie zbieranych symboli finału oraz gwarantowane domknięcie;
- krytyczne paczki assetów ładowane przed właściwym rozdziałem, z retry;
- trwałe checkpointy, unlock Próby Miliona, rekordy, mute i preferencja fullscreen;
- logistyczne fale 45–60 s, limit prędkości 1,55× i share card FB/IG;
- lekka muzyka/efekty Web Audio uruchamiane dopiero po geście użytkownika;
- tylko trzy, zależne od zgody eventy analityczne.

Voice-over pozostaje świadomie odłożony jako stretch goal.

## Najważniejsze pliki

~~~text
src/CampaignController.ts          # koordynacja dedykowanej strony
src/ui/CampaignShell.ts            # responsywny DOM, ekrany i share card
src/game/RunnerGame.ts             # pętla gry i tryby
src/game/story-timeline.ts         # 175-sekundowa, niepomijalna oś fabuły
src/game/logistic-wave.ts          # fale Próby Miliona
src/profile.ts                     # localStorage z bezpiecznym fallbackiem
src/analytics/                     # minimalny kontrakt dataLayer
public/assets/milion-runner/
  runner-config.json               # produkcyjne copy i parametry v3
~~~

Kanoniczne doświadczenie montuje `mountCampaign()` na osobnej stronie. Stare
triggery sklepu korzystają wyłącznie z adaptera przekierowującego do `/milion`;
pełna modalna kopia gry nie jest utrzymywana.

## Przed publikacją

Wymagane są jeszcze playtesty na realnych telefonach (360, 375, 390, 412/430 px
oraz landscape), potwierdzenie maksymalnej prędkości i ewentualny tuning wartości w
`runner-config.json`. Lista odbiorowa znajduje się w [`docs/QA_V3.md`](./docs/QA_V3.md).
