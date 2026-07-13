# Integracja kampanii z AMSO.pl / IdoSell

## 1. Kanoniczna strona gry

Opublikuj zawartość `dist-demo/` jako osobną stronę pod kanonicznym adresem kampanii
(docelowo `/milion`). To pełnoekranowe doświadczenie v3; nie uruchamia się
automatycznie i tworzy silnik Canvas dopiero po wybraniu trybu przez użytkownika.

CTA, jubileuszowe logo i udostępniane linki powinny być zwykłymi linkami:

~~~html
<a href="/milion">Zagraj w „Drogę do Miliona”</a>
~~~

Zachowuje to działanie Ctrl/Cmd-click, otwieranie w nowej karcie i bezpieczny fallback
bez JavaScriptu.

## 2. Opcjonalny fallback migracyjny

`npm run build` nadal tworzy adapter migracyjny oraz publiczne API strony w `dist/`:

~~~text
/assets/milion-runner/runner-loader.iife.js
/assets/milion-runner/runner.js
/assets/milion-runner/runner.css
/assets/milion-runner/runner-config.json
~~~

Adapter nie zawiera drugiej modalnej wersji kampanii. Istniejący trigger po intencji
użytkownika wywołuje wyłącznie przekierowanie do dedykowanej strony podczas migracji
szablonów.

## 3. Cache i CSP

- HTML i `runner-config.json`: krótki cache / rewalidacja;
- hashowane JS/CSS dedykowanej strony: długi `immutable` cache;
- `script-src`, `style-src` i `connect-src`: co najmniej `self`;
- Web Audio nie pobiera zewnętrznych ścieżek;
- share card powstaje lokalnie; Facebook otwiera własny share URL.

## 4. Zgody

Gra nie wymaga cookies, konta ani backendu. Profil zapisuje tylko lokalny postęp i
preferencje. Analitykę włącz dopiero po zgodzie, ustawiając jeden z kontraktów
opisanych w [`TRACKING_PLAN.md`](./TRACKING_PLAN.md).

## 5. Smoke test

- `/milion` pokazuje landing, a nie modal;
- przed pierwszym startem na telefonie pojawia się jednorazowa propozycja fullscreen;
- story zawsze dochodzi do podziękowania, także po wielu kolizjach;
- challenge jest niedostępny przed podziękowaniem i trwały po odświeżeniu;
- zmiana karty/orientacji pauzuje i wymaga świadomego wznowienia;
- odrzucenie zgody nie blokuje gry i nie tworzy eventów;
- linki kampanii oraz karta FB/IG zawierają kanoniczny URL.
