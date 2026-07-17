# Raport RC v10 — Świat Zamówień

Data: 2026-07-17
Artefakt: `droga-do-miliona-qa.html`

## Wynik automatyczny

- `npm test`: 40 plików, 266 testów — PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run build:single`: PASS; autonomiczny HTML ma 4 989 573 bajty i 25 osadzonych plików graficznych.
- Test autonomicznego bundla: 15 unikalnych WebP, 2 AVIF, brak zewnętrznych ścieżek do finalnych assetów — PASS.
- Chrome Headless 150, desktop 1600×900: landing, start historii, dekodowanie obu paneli świata, licznik `999 970`, brak wyjątków runtime — PASS.

## Zakres potwierdzony kodem i testami

- dwa sąsiadujące panele świata bez overlapu, connectora i resetu fazy przy zmianie świata lub story pause;
- najwyżej dwa zdekodowane światy w pamięci i jeden świat podgrzewany do przodu;
- pięć zwykłych typów zamówień, ważona różnorodność i zakaz serii czterech identycznych typów;
- osobne assety WebP 256×256 urządzeń, cztery ujęcia paczki, atlas runtime i galeria review;
- dokładny dostarczony znak `A.webp` nakładany na sprite kuriera;
- osobny kadr referencyjny kuriera jest pokazany przed pełnym sprite sheetem w galerii; użytkownik zatwierdził kierunek assetów w rozmowie słowami „ці ассети мені подобаються” przed poleceniem implementacji;
- bezpieczny start challenge bez przeszkody i power-upu;
- power-upy tylko z kontrolowanego harmonogramu, bez `golden` i bez `drugie_zycie` na wyjściu;
- migracja rekordów `bestChallengePackages` i progu `packageTarget` wyłącznie jako aliasów wejściowych;
- jedna rodzina celebracji `order-confetti`, rosnąca intensywność, skala tekstu i fanfara;
- milionowy licznik nie resetuje się przy przejściu do challenge.

## Artefakty odbioru

- Galeria: `assets-review.html`.
- Autonomiczny build: `../../droga-do-miliona-qa.html`.
- Assety produkcyjne: `../../public/assets/milion-runner/`.

## Manualna matryca do odbioru przez człowieka

Poniższych pozycji nie oznaczono jako zaliczone bez fizycznych urządzeń:

| Środowisko | Orientacja / DPR | Status |
| --- | --- | --- |
| Chrome desktop | landscape, DPR 1–2 | automatyczny smoke PASS; pełny manual pending |
| Safari macOS / iOS | portrait + landscape, DPR 2–3 | pending |
| Edge Windows | landscape, DPR 1–2 | pending |
| Android Chrome `content://` | portrait + landscape, DPR 2–3 | pending |

Manualny odbiór powinien objąć: bieg, skok, przysiad, oba power-upy, shield,
pięć collectibles, milestone 10/100/500, granicę świata, story pause, fullscreen,
stabilność animacji i czytelność wszystkich assetów przy docelowym rozmiarze.

## Znane ograniczenie

Pełna zgodność Safari, Edge i Android `content://` wymaga jeszcze ręcznego odbioru.
Automatyczna regresja oraz smoke test Chrome nie wykazały blokera publikacji w kodzie.
