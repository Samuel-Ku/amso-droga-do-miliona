# Integracja kampanii z AMSO.pl / IdoSell

## 1. Kanoniczna strona gry

Uruchom `npm run build:single`, a następnie wklej cały fragment z
`million-idosell.html` do pola HTML osobnej strony kampanii w IdoSell. Fragment nie
zawiera `doctype`, `<html>`, `<head>` ani `<body>`, więc nie tworzy drugiej powłoki
dokumentu. To jedyny produkcyjny artefakt frontendu; `dist-demo/` służy wyłącznie
do lokalnego preview. Interfejs pomiarowy aktywuje się tylko przez zatwierdzony
query QA i nie jest dostępny przy zwykłym wejściu.

Artefakt musi przejść `npm run check:autonomic-html`: limit wynosi 14 MiB
surowego fragmentu i 16 MiB po konserwatywnym oszacowaniu kodowania pola
formularza. Ten zapas zapobiega odpowiedzi `413 Request Entity Too Large` po
dodaniu narzutu żądania przez CMS.

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
Open Graph i cały wzajemny zestaw `hreflang`. Autonomiczny HTML celowo nie zawiera
tych pól, więc ten sam plik można wkleić do każdej wersji językowej. Gra wiąże język
z `document.documentElement.lang` podczas mountu, a link udostępniania bierze z
bieżącego URL strony.

## 3. Cache i CSP

- HTML: krótki cache / rewalidacja;
- inline `<script>` i `<style>` z fragmentu muszą otrzymać akceptowane przez IdoSell
  nonce/hash; jeżeli CMS nie obsługuje nonce/hash, polityka musi jawnie dopuścić
  inline script i style dla tej strony;
- `script-src` obejmuje `blob:`, a `img-src` obejmuje `data:`; skrypt uruchamiający
  aplikację dziedziczy nonce z bieżącego skryptu bootstrap;
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
