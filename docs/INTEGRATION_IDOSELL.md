# Integracja kampanii z AMSO.pl / IdoSell

## 1. Kanoniczna strona gry

Produkcyjne wdrożenie IdoSell korzysta z małego fragmentu HTML oraz zewnętrznych
plików CSS/JS. Uruchom `npm run build:idosell-external` i przekaż wygenerowany
`amso-million-idosell-external.zip` osobie publikującej pliki na otwartej domenie
HTTPS. Instrukcja operatora znajduje się w `README.txt` wewnątrz paczki.

Do pola kodu HTML strony CMS wklej wyłącznie zawartość `idosell-snippet.html` po
zamianie `__AMSO_PUBLIC_BASE_URL__` na publiczny URL katalogu. Nie używaj edytora
wizualnego/WYSIWYG. Alternatywnie link CSS i skrypt aplikacji można dodać przez
`Sklep > Dodatki HTML i JavaScript`, ograniczając dodatek do stron `/million`;
inline watchdog pozostaje wtedy w małym snippecie strony.

Fragment nie dodaje znacznika `<main>`, ponieważ główny landmark dokumentu należy
do szablonu IdoSell. Kampania używa neutralnego `<div role="region">`. Wszystkie
jej publiczne klasy CSS i identyfikatory zaczynają się od unikalnego prefiksu
`amso-million-runner-2026`, aby style i skrypty sklepu nie mogły pomylić elementów.

Plik `million-idosell.html` pozostaje autonomicznym artefaktem odbiorowym i
offline QA. Nie należy go wklejać do IdoSell: formularz CMS odrzuca tak duży
payload odpowiedzią `413 Request Entity Too Large` albo nie zapisuje zawartości.
`dist-demo/` służy wyłącznie do lokalnego preview/developmentu.

Użyj wspólnego angielskiego slugu `million`: `amso.pl/million`, `amso.eu/million`
oraz odpowiednio `/en/million`, `/es/million`, `/cs/million`, `/it/million`,
`/fr/million` i `/uk/million`.

CTA, jubileuszowe logo i udostępniane linki powinny być zwykłymi linkami:

~~~html
<a href="/million">Zagraj w „Drogę do Miliona”</a>
~~~

Zachowuje to działanie Ctrl/Cmd-click, otwieranie w nowej karcie i bezpieczny fallback
bez JavaScriptu.

## 2. Pola należące do IdoSell

IdoSell ustawia `LANGID`, `<html lang>`, title, meta description, self-canonical,
Open Graph i cały wzajemny zestaw `hreflang`. Snippet i zewnętrzny bundle celowo
nie zawierają tych pól, więc ten sam Pakiet zewnętrzny IdoSell można podłączyć do
każdej wersji językowej. Gra wiąże język z `document.documentElement.lang` podczas
mountu, a link udostępniania bierze z bieżącego URL strony.

## 3. Cache, CORS i CSP

- snippet HTML: krótki cache / rewalidacja;
- `million.css` i `million.js`: długi cache dopiero po
  wersjonowaniu URL; podczas podmiany wydania aktualizuj CSS i JS razem;
- mały watchdog błędu pozostaje inline w snippecie, więc awaria hosta statycznego
  nadal kończy się czytelnym fallbackiem; jego dokładny hash `sha256-...` znajduje
  się w `idosell-snippet.html` i `README.txt` paczki i musi wejść do `script-src`
  (alternatywnie IdoSell może nadać temu elementowi własny nonce);
- host zwraca poprawne typy `text/css` i `text/javascript` oraz pozwala stronie
  AMSO pobrać pliki; `million.js` jest klasycznym skryptem i nie importuje modułów;
- `script-src` i `style-src` dopuszczają domenę hostującą paczkę, a `img-src`
  obejmuje `data:` dla osadzonych grafik;
- gdy leaderboard jest aktywny, `connect-src` obejmuje
  `https://droga-do-miliona-records.s-kutsenko.workers.dev`;
- Web Audio nie pobiera zewnętrznych ścieżek;
- share card powstaje lokalnie; Facebook otwiera własny share URL.

## 4. Zgody

Gra nie wymaga cookies, konta ani backendu. Profil zapisuje tylko lokalny postęp i
preferencje. Analitykę włącz dopiero po zgodzie, ustawiając jeden z kontraktów
opisanych w [`TRACKING_PLAN.md`](./TRACKING_PLAN.md).

## 5. Smoke test

- każda wersja `/million` pokazuje landing, a nie modal;
- przed pierwszym startem na telefonie pojawia się jednorazowa propozycja fullscreen;
- story zawsze dochodzi do podziękowania, także po wielu kolizjach;
- challenge jest niedostępny przed podziękowaniem i trwały po odświeżeniu;
- zmiana karty/orientacji pauzuje i wymaga świadomego wznowienia;
- odrzucenie zgody nie blokuje gry i nie tworzy eventów;
- linki kampanii oraz karta FB/IG zawierają kanoniczny URL.
