# Runner „Droga do Miliona” — plan rozwoju i wdrożenia

- **Projekt:** mini-gra jubileuszowa AMSO.pl
- **Status dokumentu:** rekomendacja do akceptacji przed rozpoczęciem produkcji
- **Data:** 10 lipca 2026
- **Odbiorcy:** marketing AMSO, e-commerce/IT, analityka, wykonawca gry, QA

## 1. Rekomendacja w skrócie

Rekomendowany jest szybki MVP z jedną mechaniką: kurier biegnie automatycznie, gracz skacze, omija przeszkody i zbiera paczki. Gra działa bez backendu, otwiera się w pełnoekranowym modalu na stronie AMSO i prowadzi po zakończeniu biegu do strony kampanii.

Warstwa techniczna:

- TypeScript oraz natywne HTML5 Canvas 2D;
- Vite wyłącznie jako narzędzie budowania i optymalizacji, bez frameworka uruchamianego w przeglądarce;
- lekki interfejs DOM dla ekranu startowego, HUD, game over i dostępności;
- loader IIFE do około 10 KB oraz ładowany na żądanie moduł ES gry z osobnym arkuszem CSS;
- integracja analityczna przez dataLayer i GTM, z użyciem zalecanych zdarzeń GA4 level_start i post_score;
- brak Phasera, Reacta i backendu w MVP.

Publicznie dostępny panel administracyjny AMSO wskazuje na IdoSell, a nie WordPress lub PrestaShop. Należy to potwierdzić z zespołem e-commerce i przetestować na kopii szablonu lub środowisku testowym przed wdrożeniem produkcyjnym.

Rekomendowany termin:

- **wariant ekspresowy:** 10–12 dni roboczych od zamknięcia M0, czyli około 12–14 dni łącznie z kick-offem, jeśli assety, teksty i dostępy są gotowe;
- **wariant bezpieczny:** 15–20 dni roboczych, w tym produkcja assetów, jedna runda korekt, QA i UAT.

Rekomendowany budżet orientacyjny:

- **21–36 tys. zł netto:** implementacja z dostarczonymi finalnymi assetami, obsługą IdoSell i GTM po stronie AMSO;
- **37–68 tys. zł netto:** pełna realizacja MVP z projektem assetów, integracją, analityką, QA i rezerwą wdrożeniową.

Koszt jest modelem planistycznym, nie ofertą handlową. Założenia kosztowe opisuje sekcja 12.

## 2. Cele, zasady i miary sukcesu

### 2.1. Cel biznesowy

Gra ma:

1. w atrakcyjny sposób utrwalić komunikat o ponad milionie zrealizowanych zamówień;
2. zwiększyć kontakt użytkownika z faktami budującymi zaufanie do AMSO;
3. stworzyć mierzalny pomost między kampanią wizerunkową a stroną „Milion” lub ofertą kampanii;
4. nie pogarszać szybkości, stabilności ani użyteczności sklepu.

### 2.2. Ton doświadczenia

Doświadczenie powinno być:

- celebracyjne i wdzięczne, nie agresywnie sprzedażowe;
- proste do zrozumienia bez instrukcji dłuższej niż jedno zdanie;
- spójne z magazynem, logistyką i drugim obiegiem elektroniki;
- uczciwe w prezentowaniu danych.

Sformułowanie „Razem z Tobą: 1 000 000+” powinno być traktowane jako zatwierdzony komunikat kampanii, a nie pozornie aktualizowany licznik w czasie rzeczywistym. Jeżeli liczba nie pochodzi z API, interfejs nie może sugerować, że użytkownik właśnie zmienił globalną liczbę zamówień.

### 2.3. Podstawowe KPI

| Pytanie biznesowe | KPI | Sposób obliczenia |
|---|---|---|
| Czy easter egg jest zauważany? | zainteresowanie triggerem | game_open_requested / game_trigger_viewed |
| Czy moduł otwiera się niezawodnie? | game ready rate | game_ready / game_open_requested |
| Czy ekran startowy zachęca do gry? | współczynnik startu | level_start / game_ready |
| Czy mechanika angażuje? | czas biegu, wynik, paczki | mediana run_duration_seconds, score i packages_collected |
| Czy gracze chcą próbować ponownie? | retry rate | game_restarted / post_score |
| Czy gra prowadzi dalej w kampanii? | CTA rate | game_cta_clicked / post_score |
| Czy moduł ładuje się stabilnie? | load failure rate | game_load_failed / game_open_requested |
| Czy ładowanie jest wystarczająco szybkie? | game ready time | czas od game_open_requested do game_ready |

Wartości docelowe KPI należy ustalić po pierwszych danych ze środowiska testowego i pierwszych 24–48 godzinach kampanii. Brief nie zawiera wiarygodnego baseline’u, dlatego arbitralne cele procentowe byłyby pozorne.

## 3. Zakres produktu

### 3.1. MVP — zakres obowiązkowy

- modal/overlay uruchamiany bez przeładowania strony;
- ekran startowy z nazwą gry, jednym zdaniem instrukcji i przyciskiem start;
- automatyczny bieg kuriera;
- skok uruchamiany spacją, kliknięciem lub tapnięciem;
- co najmniej trzy wizualnie czytelne warianty przeszkód naziemnych;
- kolekcjonowanie paczek;
- licznik paczek i wynik sesji;
- zatwierdzony, statyczny komunikat „1 000 000+” widoczny na ekranie startowym i game over, z jasnym rozdzieleniem wyniku gracza od skali zamówień AMSO;
- rosnąca prędkość oraz bezpiecznie rosnąca częstotliwość przeszkód;
- kolizja kończąca bieg;
- ekran game over z wynikiem, losowym zatwierdzonym faktem, ponowną grą i CTA;
- zamknięcie przez przycisk X oraz klawisz Escape;
- pauza po utracie widoczności karty lub focusu;
- obsługa desktopu, telefonu i tabletu;
- integracja dataLayer/GTM/GA4;
- konfiguracja treści, faktów, CTA i flagi aktywacji bez ingerowania w silnik;
- feature flag lub kill switch pozwalający włączyć grę dopiero po ogłoszeniu miliona;
- build mieszczący się w budżecie wagowym i niewpływający na początkowe ładowanie sklepu.

### 3.2. Świadomie poza MVP

- zjazd/unik i przeszkody wymagające kucania;
- power-upy;
- muzyka i pełna oprawa dźwiękowa;
- ranking;
- logowanie gracza;
- live API globalnego licznika;
- nagrody i kody rabatowe;
- automatyczne karty do udostępniania;
- zmienne tła dzień/noc;
- tryb offline;
- serwis worker na głównej domenie sklepu;
- dzienny harmonogram faktów sterowany z backendu.

Elementów spoza MVP nie należy „przemycać” podczas implementacji. Każdy zwiększa powierzchnię testów i ryzyko przed krótkim deadline’em.

### 3.3. Proponowany model wyniku

Interfejs pokazuje dwie jednoznaczne wartości:

- **Paczki:** liczba zebranych paczek — główny wynik kampanijny;
- **Wynik:** punkty będące sumą dystansu i bonusu za paczki.

Proponowana formuła startowa:

~~~text
wynik = pełne metry dystansu + paczki × 100
~~~

Formułę należy trzymać w konfiguracji. Dzięki temu można ją dostroić bez zmiany pozostałej logiki. Na ekranie game over należy pokazać obie wartości, aby użytkownik rozumiał rezultat.

## 4. Rekomendacja technologiczna

### 4.1. Wybór

**TypeScript + Canvas 2D + lekki DOM, budowane przez Vite.**

Vite służy tu do pracy lokalnej, TypeScriptu, minifikacji, hashowania assetów i przygotowania paczki do osadzenia. Nie jest zależnością runtime. Build dostarcza dwa wejścia: mały runner-loader.iife.js osadzony w storefrontcie oraz runner.es.js ładowany dynamicznie dopiero po intencji użytkownika. Pełny wariant UMD pozostaje jedynie awaryjną opcją ładowaną na żądanie, jeśli ograniczenia szablonu uniemożliwią import modułu ES.

### 4.2. Dlaczego bez frameworka gry

| Kryterium | Canvas + TypeScript | Phaser | React + Canvas |
|---|---:|---:|---:|
| Waga runtime | najlepsza | większa | większa |
| Jedna mechanika skoku | wystarczające | nadmiarowe | nadmiarowe |
| Kontrola integracji ze sklepem | bardzo dobra | dobra | dobra |
| Szybkość stworzenia prostego grayboxa | dobra | bardzo dobra | średnia |
| Koszt utrzymania małego modułu | niski | średni | średni |
| Gotowość na rozbudowaną grę | średnia | bardzo dobra | średnia |

Phaser warto rozważyć dopiero, gdy zatwierdzony zakres obejmie wiele scen, rozbudowane power-upy, rozgałęzioną fizykę, duże atlasy animacji albo kilka poziomów. Dla obecnego MVP narzut biblioteki i dodatkowa warstwa abstrakcji nie zwracają się.

### 4.3. Parametry techniczne gry

- świat gry w stałych współrzędnych i responsywny viewport: 16:9 na desktopie, bezpieczne kadrowanie do węższych proporcji w pionie, bez wymuszania obrotu telefonu;
- HUD w DOM poza obszarem kadrowania, aby wynik i przyciski pozostały czytelne przy szerokości 320–375 px;
- obsługa devicePixelRatio z limitem 2, aby nie przeciążać GPU na telefonach;
- requestAnimationFrame i stały krok symulacji z ograniczeniem liczby kroków po powrocie z nieaktywnej karty;
- obiekty przeszkód i paczek współdzielone w pulach, aby ograniczyć garbage collection;
- lekkie, celowo „wybaczające” hitboxy mniejsze niż kontury grafik;
- preloading tylko assetów potrzebnych do pierwszego biegu;
- kolejne assety ładowane w idle time lub po pierwszej rozgrywce;
- brak zapytań sieciowych podczas biegu;
- deterministyczny generator losowy dostępny w testach.

### 4.4. Kontrakt przeglądarkowy

Build powinien udostępniać idempotentne API:

~~~ts
window.AMSOMillionRunner.init(config)
window.AMSOMillionRunner.open(options?)
window.AMSOMillionRunner.close(reason?)
window.AMSOMillionRunner.destroy()
~~~

Wymagania:

- wielokrotne wywołanie init nie dodaje kolejnych listenerów;
- open po otwarciu przenosi focus do modala;
- close zwraca focus do elementu, który otworzył grę;
- destroy usuwa listenery, blokadę scrolla, Canvas i wstrzymuje audio;
- wyjątek gry nie może przerwać działania nawigacji ani koszyka sklepu.

## 5. Projekt rozgrywki MVP

### 5.1. Stany

~~~text
uninitialized
  → loading
  → ready
  → running
  → paused
  → game_over
  → ready/retry
  → closed
  → destroyed
~~~

Przejścia stanów powinny być jawne. Zdarzenia analityczne są emitowane na przejściach, nie w pętli renderowania, co zapobiega duplikatom.

### 5.2. Sterowanie

- Space, klik lub tap: skok;
- Enter: aktywacja aktualnie zaznaczonego przycisku interfejsu;
- Escape: zamknięcie;
- dotyk w obszarze gry: skok;
- pierwsze tapnięcie nie może jednocześnie zamknąć instrukcji i zmarnować skoku;
- podczas biegu Canvas przechwytuje gest gry i nie przewija strony, ale poza Canvas pozostaje dostępny standardowy zoom przeglądarki.

Rekomendowane są krótki jump buffer oraz coyote time, wstępnie 80–120 ms. To poprawia odczucie sterowania na ekranach dotykowych bez widocznego upraszczania gry.

### 5.3. Krzywa trudności

Początkowa konfiguracja do playtestów:

| Czas biegu | Prędkość świata | Zasady spawnów |
|---|---|---|
| 0–15 s | 1,00× | pojedyncze, szeroko rozstawione przeszkody |
| 15–40 s | do 1,20× | większa różnorodność, nadal pojedyncze przeszkody |
| 40–75 s | do 1,40× | krótsze odstępy, bez niemożliwych sekwencji |
| ponad 75 s | do 1,55× | łagodny wzrost do limitu |

Każdy spawn musi przejść regułę minimalnego czasu reakcji. Paczka nie może wymuszać kolizji; ścieżki paczek powinny uczyć optymalnego momentu skoku.

Parametry prędkości, grawitacji, wysokości skoku, odstępów i hitboxów muszą znajdować się w jednym pliku konfiguracyjnym. Finalne wartości wynikają z playtestów na realnych telefonach, a nie wyłącznie z testów desktopowych.

### 5.4. Zasady uczciwości

- brak przeszkód poza widocznym polem reakcji;
- brak dwóch przeszkód tworzących nieuniknioną kolizję;
- brak kar za przywrócenie karty po zmianie aplikacji;
- pauza po visibilitychange oraz blur;
- wznowienie wymaga jawnego tapnięcia lub kliknięcia;
- pierwsze 5–8 sekund biegu jest tutorialem przez układ obiektów;
- pole kolizji kuriera jest wizualnie i mechanicznie przewidywalne.

## 6. Architektura projektu

~~~text
/
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── index.html                    # samodzielny harness demonstracyjny
├── src/
│   ├── loader.ts                 # mały IIFE, config, intent i dynamic import
│   ├── index.ts                  # publiczne API modułu gry
│   ├── config/
│   │   ├── defaults.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── embed/
│   │   ├── loader.ts             # lazy load i obsługa błędów
│   │   ├── modal.ts              # focus, scroll lock, lifecycle
│   │   └── trigger.ts            # data attribute i fallback linku
│   ├── game/
│   │   ├── Game.ts
│   │   ├── state-machine.ts
│   │   ├── loop.ts
│   │   ├── input.ts
│   │   ├── renderer.ts
│   │   ├── physics.ts
│   │   ├── scoring.ts
│   │   ├── difficulty.ts
│   │   ├── entities/
│   │   │   ├── runner.ts
│   │   │   ├── obstacle.ts
│   │   │   └── package.ts
│   │   └── systems/
│   │       ├── collision.ts
│   │       ├── spawning.ts
│   │       └── pooling.ts
│   ├── ui/
│   │   ├── start-screen.ts
│   │   ├── hud.ts
│   │   ├── game-over.ts
│   │   └── accessibility.ts
│   ├── analytics/
│   │   ├── data-layer.ts
│   │   ├── events.ts
│   │   └── consent-safe-adapter.ts
│   ├── content/
│   │   └── render.ts             # bezpieczne renderowanie runtime config
│   └── styles/
│       └── runner.css
├── public/
│   ├── config/
│   │   └── runner-config.json    # flag, copy, CTA i zatwierdzone fakty
│   └── assets/
│       ├── sprites/
│       ├── backgrounds/
│       ├── ui/
│       └── audio/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── INTEGRATION_IDOSELL.md
    ├── TRACKING_PLAN.md
    ├── ASSET_SPEC.md
    └── RELEASE_CHECKLIST.md
~~~

### 6.1. Konfiguracja runtime i kill switch

Treść, CTA i aktywacja znajdują się w małym, zewnętrznym runner-config.json, dzięki czemu zmiana nie wymaga przebudowania silnika:

~~~json
{
  "schemaVersion": 1,
  "enabled": false,
  "claim": "1 000 000+",
  "cta": {
    "id": "million_landing",
    "path": "/million"
  },
  "facts": [
    {
      "id": "orders_1m",
      "text": "Ponad milion zrealizowanych zamówień.",
      "enabled": true,
      "asOf": "YYYY-MM-DD",
      "validFrom": "YYYY-MM-DD",
      "validTo": null
    }
  ]
}
~~~

Loader pobiera konfigurację z tej samej domeny przed podpięciem triggera oraz rewaliduje ją przed otwarciem, jeśli lokalna kopia ma ponad 60 sekund. Plik ma rewalidację lub maksymalny TTL 60 sekund, dzięki czemu ustawienie enabled=false działa jako kill switch bez nowego builda gry także w długo otwartej karcie. Właścicielem publikacji konfiguracji jest e-commerce/IT; marketing zatwierdza treść i moment zmiany flagi. Przy błędzie pobrania, niezgodnej wersji schematu albo błędzie walidacji loader działa fail-closed: nie otwiera gry, a link logo prowadzi normalnie do /million.

Zasady bezpieczeństwa konfiguracji:

- własny lekki walidator bez dodatkowej biblioteki runtime;
- tekst wstawiany przez textContent, nigdy jako HTML;
- cta.path musi być względną ścieżką z jawnej allowlisty;
- brak dowolnego kodu, HTML, URL zewnętrznych lub parametrów skryptu w JSON;
- źródło, osoba zatwierdzająca i historia akceptacji pozostają w wewnętrznym rejestrze, a nie w publicznym JSON;
- do publicznej konfiguracji trafiają wyłącznie fakty z jawnym zatwierdzeniem;
- dane liczbowe nie są zapisane bezpośrednio w silniku.

### 6.2. Macierz weryfikacji faktów

Wszystkie poniższe pozycje mają status **niezatwierdzone do publikacji**, dopóki marketing nie uzupełni źródła, okresu danych i akceptacji.

| Fact ID | Treść robocza z briefu | Co trzeba potwierdzić | Właściciel akceptacji |
|---|---|---|---|
| orders_1m | ponad 1 000 000 zrealizowanych zamówień | data przekroczenia, definicja zamówienia, raport OMS/BI | marketing + e-commerce |
| years_18 | 18 lat na rynku | rok bazowy i poprawność w dacie kampanii | marketing |
| stores_12 | 12 salonów w Polsce | aktualna lista czynnych salonów na dzień launchu | retail + marketing |
| sales_pc_41k | 41 tys. PC w ostatnich 12 miesiącach | dokładny okres, kategoria i raport źródłowy | BI/sprzedaż |
| sales_notebooks_76k | 76 tys. notebooków w ostatnich 12 miesiącach | dokładny okres, kategoria i raport źródłowy | BI/sprzedaż |
| sales_monitors_40k | 40 tys. monitorów LCD w ostatnich 12 miesiącach | dokładny okres, kategoria i raport źródłowy | BI/sprzedaż |
| sales_phones_28k | 28 tys. telefonów w ostatnich 12 miesiącach | dokładny okres, kategoria i raport źródłowy | BI/sprzedaż |
| phones_240m | roczna sprzedaż smartfonów tworzy wieżę około 240 m | liczba sztuk, przyjęta wysokość telefonu i sposób zaokrąglenia | marketing + BI |
| pcs_400t | roczna wysyłka PC waży około 400 000 kg | okres, masa jednostkowa/raport logistyczny | logistyka + BI |
| boeing_5 | 400 000 kg odpowiada pięciu załadowanym Boeingom 737 | wariant samolotu i rodzaj porównywanej masy | marketing/prawny |
| reviews_99 | 99% pozytywnych opinii | platforma lub zbiór platform, okres i liczba opinii | CX/marketing |
| warranty_48m | gwarancja do 48 miesięcy | produkty, warunki i aktualny regulamin | sprzedaż/prawny |

Do runner-config.json trafiają: finalna treść, fact ID, publiczna data „as of” i zakres ważności. Źródło wewnętrzne, osoba zatwierdzająca oraz data akceptacji pozostają w rejestrze akceptacji marketingu. Analogii nie należy publikować, jeśli nie da się odtworzyć ich obliczenia.

## 7. Assety graficzne i dźwiękowe

### 7.1. P0 — blokujące MVP

| Asset | Minimalny zakres | Format produkcyjny | Uwagi |
|---|---|---|---|
| brand kit | kolory, fonty, zasady logo | PDF/SVG/źródła | wymagane zatwierdzenie marki |
| logo jubileuszowe | wariant jasny i ciemny | SVG + eksport | trigger oraz ekran startowy |
| kurier | idle, bieg, skok, fail | sprite atlas PNG/WebP + JSON | źródło 2×, spójny pivot |
| paczka | 1–2 warianty i stan zebrania | PNG/WebP | czytelna na małym ekranie |
| przeszkody | min. 3 sylwetki naziemne | PNG/WebP | bez konieczności kucania |
| podłoże | płynna pętla | PNG/WebP | brak widocznego szwu |
| tło magazynu | 2–3 warstwy parallax | WebP/PNG | nie konkuruje z przeszkodami |
| UI | start, HUD, game over, X, CTA | SVG/CSS/PNG | tekst pozostaje w DOM |
| treści | instrukcja, CTA, wynik, fakty | dokument zatwierdzony | właściciel: marketing |

Rekomendowany kierunek to flat/pixel-inspired: proste bryły i ograniczona paleta, ale bez drobnego klasycznego pixel artu, który traci czytelność na ekranach o różnym DPR. Ostateczny styl wymaga akceptacji kreacji AMSO.

### 7.2. P1 — po stabilnym MVP

- krótki dźwięk skoku;
- dźwięk zebrania paczki;
- dźwięk kolizji;
- klik UI;
- ikona mute/unmute;
- animacja kucania;
- przeszkoda górna;
- dodatkowe warianty paczek i tła;
- proste efekty cząsteczkowe.

Dźwięk nie uruchamia się automatycznie. Może zostać aktywowany dopiero po geście użytkownika i musi mieć widoczny przełącznik. Docelowy łączny budżet SFX: do około 150 KB transferu.

### 7.3. P2 — dodatki kampanijne

- power-upy i ich stany aktywne;
- karta wyniku do social media;
- warianty dzienne;
- ekran kodu/nagrody;
- ambient lub muzyka;
- dodatkowe lokacje magazynowe.

### 7.4. Budżet wagowy

| Element | Cel | Limit alarmowy |
|---|---:|---:|
| JavaScript po kompresji | do 80 KB | 120 KB |
| CSS po kompresji | do 20 KB | 35 KB |
| sprite’y i UI | do 500 KB | 800 KB |
| tła | do 350 KB | 600 KB |
| audio MVP | 0 KB | 150 KB |
| całość przy pierwszym otwarciu | do 1,0 MB | 2,0 MB |

Limit 2 MB jest traktowany jako twardy budżet transferu na zimnym cache. Raport builda powinien być częścią każdego release candidate.

## 8. Integracja z AMSO.pl / IdoSell

### 8.1. Ustalenie platformy

Publiczny adres panelu AMSO identyfikuje zaplecze jako IdoSell. Przed rozpoczęciem integracji zespół techniczny potwierdza:

- wersję i typ używanego szablonu;
- dostęp do kopii szablonu lub stagingu;
- sposób publikowania plików statycznych;
- politykę CSP;
- istniejący kontener GTM i mechanizm consent management;
- możliwość dodania data attribute do jubileuszowego logo;
- proces cache bustingu i rollbacku.

### 8.2. Sposób osadzenia

Najbezpieczniejszy wariant:

1. pliki gry są hostowane na tej samej domenie lub zatwierdzonym CDN;
2. mały loader jest wczytywany z defer;
3. loader pobiera i waliduje mały runner-config.json; przy enabled=false nie przechwytuje linku;
4. moduł ES, CSS i assety są pobierane dopiero po hover/focus/intencji dotykowej albo bezpośrednio po kliknięciu;
5. preload w idle jest dozwolony dopiero po LCP, gdy saveData=false i połączenie nie jest oznaczone jako 2g/slow-2g;
6. logo otrzymuje stabilny atrybut data-amso-million-runner;
7. klik najpierw otwiera lekki stan ładowania; nawigacja jest przechwytywana dopiero po jego poprawnym utworzeniu;
8. jeśli moduł nie załaduje się, loader zamyka modal i przechodzi pod href triggera — użytkownik nie trafia w martwy element.

Przykładowy kontrakt szablonu:

~~~html
<a
  href="/million"
  data-amso-million-runner
  data-runner-source="homepage_logo"
>
  <!-- zatwierdzone logo jubileuszowe -->
</a>

<script
  defer
  src="/assets/milion-runner/runner-loader.iife.js"
  data-runner-config="/assets/milion-runner/runner-config.json"
></script>
~~~

Loader dynamicznie dołącza runner.css i importuje runner.es.js. Pełny kod gry i style nie są pobierane w początkowym krytycznym ładowaniu strony.

Selektor oparty na klasie wizualnej obecnego logo jest zbyt kruchy. Dedykowany atrybut pozostaje stabilny po zmianach CSS i ułatwia testy.

### 8.3. Izolacja od storefrontu

- unikalny prefiks klas amso-million-runner__;
- opcjonalny Shadow DOM po potwierdzeniu kompatybilności z szablonem;
- brak globalnego resetu CSS;
- brak modyfikacji obiektów window poza jednym namespace’em;
- listenery zakładane z AbortController i usuwane przy destroy;
- z-index uzgodniony z koszykiem, wyszukiwarką, cookie bannerem i live chatem;
- przy otwarciu zachowywany poprzedni overflow body, a przy zamknięciu odtwarzany;
- modal nie może zasłonić aktywnego bannera zgód bez możliwości jego obsługi.

### 8.4. Dostępność modala

- role="dialog" i aria-modal="true";
- czytelna nazwa oraz opis sterowania;
- focus trap;
- X o polu dotykowym minimum 44 × 44 px;
- Escape zamyka modal;
- focus wraca do logo/triggera;
- ekran startowy i game over pozostają elementami DOM, nie tekstem narysowanym wyłącznie na Canvas;
- Canvas otrzymuje opis alternatywny;
- stan startu, pauzy i końcowy wynik są ogłaszane przez dyskretny obszar aria-live; bieżący HUD nie jest ogłaszany co klatkę ani przy każdej paczce;
- dostępny jest widoczny przycisk pauzy/wznowienia;
- modal zawiera zwykły link „Przejdź do strony kampanii” jako alternatywę dla osób, które nie mogą lub nie chcą grać;
- powłoka modala i alternatywna ścieżka są projektowane zgodnie z WCAG 2.2 AA;
- prefers-reduced-motion wyłącza dekoracyjne drgania, błyski i parallax o wysokiej amplitudzie.

Gra nie blokuje zoomu całej strony. touch-action: none może działać tylko na Canvas i tylko podczas aktywnego biegu. Jeśli w przyszłości gra będzie przyznawać nagrody, równoważna dostępna ścieżka musi zapewniać możliwość uzyskania tego samego rezultatu.

### 8.5. Aktywacja kampanii i rollback

- pliki mogą zostać wdrożone wcześniej, ale trigger pozostaje wyłączony;
- włączenie następuje zmianą enabled w runner-config.json po zgodzie właściciela kampanii;
- nie używać wyłącznie daty z zegara urządzenia jako mechanizmu premiery;
- kill switch propaguje się maksymalnie w czasie TTL konfiguracji, docelowo do 60 sekund;
- podstawowy rollback to enabled=false; awaryjny rollback to usunięcie loadera z kopii szablonu;
- przed premierą wykonuje się smoke test na stagingu; po publicznym ogłoszeniu następuje pełna aktywacja i monitoring produkcyjny.

## 9. Tracking GA4/GTM

### 9.1. Zasada

Każde zdarzenie musi odpowiadać na pytanie biznesowe. Nie należy wysyłać eventu przy zebraniu każdej paczki. Wystarczy przekazać łączną liczbę packages_collected przy końcu biegu; ogranicza to wolumen i upraszcza analizę.

Gra emituje neutralne zdarzenia do dataLayer. GTM odpowiada za wysłanie ich do istniejącego strumienia GA4 z poszanowaniem zgód. Rozgrywka działa niezależnie od tego, czy analytics_storage jest przyznane.

### 9.2. Plan zdarzeń

| Event | Typ | Trigger | Najważniejsze parametry | Decyzja, którą wspiera |
|---|---|---|---|---|
| game_trigger_viewed | custom | trigger widoczny min. 50% przez 1 s, raz na page view | source_location, game_version | rzeczywista ekspozycja |
| game_open_requested | custom | aktywacja triggera, przed lazy load | source_location, game_version | intencja otwarcia i mianownik błędów |
| game_opened | custom | modal wraz ze stanem ładowania stał się widoczny | source_location, game_version | powodzenie warstwy modalnej |
| game_ready | custom | assety i sterowanie są gotowe | source_location, load_time_ms, game_version | niezawodność i wydajność ładowania |
| game_load_failed | custom | raz na nieudaną próbę przygotowania modułu | error_code, source_location, game_version | współczynnik błędów ładowania |
| level_start | GA4 recommended | pierwszy tick rozpoczętego biegu | level_name, character, run_number, source_location | start rozgrywki |
| post_score | GA4 recommended | pojedyncze przejście running → game_over | score, level, character, packages_collected, distance_m, run_duration_seconds, difficulty_level, collision_type, control_method, fact_id | wynik oraz game over |
| game_restarted | custom | kliknięcie „Zagraj ponownie” | previous_score, run_number | chęć ponownej gry |
| game_cta_clicked | custom; rekomendowany key event | kliknięcie CTA na game over | cta_id, destination_path, score, packages_collected, source_location | przejście do kampanii/oferty |
| game_closed | custom | zamknięcie modala | close_state, run_number, elapsed_open_seconds | miejsce rezygnacji |
| game_error | custom | kontrolowany błąd runtime, deduplikowany per error_code w otwarciu | error_code, game_state, game_version | diagnostyka stabilności |
| share | GA4 recommended, P2 | skuteczne uruchomienie share/copy | method, content_type, item_id | dystrybucja wyniku |

Zdarzenie post_score jest jednocześnie wymaganym przez brief eventem „game over” i eventem wyniku. Nie wysyłamy drugiego eventu game_over, aby nie tworzyć dwóch rekordów dla jednego końca biegu.

Run-level CTA rate liczymy z surowych event_count(game_cta_clicked) / event_count(post_score), przy czym z jednego ekranu game over może wyjść najwyżej jeden event CTA. Oznaczenie game_cta_clicked jako key event „raz na sesję” służy osobnemu raportowi sesyjnemu i nie jest używane jako licznik run-level.

### 9.3. Wspólne parametry

| Parametr | Przykład | Uwagi |
|---|---|---|
| game_name | droga_do_miliona | stała |
| game_version | 1.0.0 | wersja release’u |
| source_location | homepage_logo | kontrolowany słownik |
| run_number | 1 | numer biegu w otwarciu modala |
| control_method | keyboard / pointer / touch | wykryty z pierwszej akcji |
| fact_id | phones_240m | bez pełnego tekstu |

Nie wysyłać:

- imienia, e-maila, numeru klienta, numeru zamówienia ani innego PII;
- pełnych komunikatów błędu mogących zawierać URL lub dane użytkownika;
- trwałego identyfikatora gracza tworzonego tylko na potrzeby gry;
- losowego run_id jako custom dimension o wysokiej kardynalności.

### 9.4. Przykład dataLayer dla końca biegu

~~~js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "post_score",
  game_name: "droga_do_miliona",
  game_version: "1.0.0",
  source_location: "homepage_logo",
  run_number: 2,
  score: 2480,
  level: 3,
  character: "amso_courier",
  packages_collected: 17,
  distance_m: 780,
  run_duration_seconds: 42,
  difficulty_level: 3,
  collision_type: "palette",
  control_method: "touch",
  fact_id: "phones_240m"
});
~~~

### 9.5. Konfiguracja GTM

Konwencja nazw:

- Tag: GA4 - Event - Runner Post Score;
- Trigger: Custom - post_score;
- Variable: DL - packages_collected;
- Variable: DL - source_location.

Do przygotowania:

1. jeden trigger Custom Event na każdy event;
2. zmienne dataLayer dla kontrolowanych parametrów;
3. tagi GA4 Event korzystające z istniejącego Google tagu;
4. konfiguracja consent zgodna z wybranym przez AMSO modelem Basic albo Advanced opisanym w sekcji 9.7;
5. po akceptacji marketingu game_cta_clicked oznaczony w GA4 jako key event, liczony raz na sesję;
6. custom dimensions: source_location, game_version, control_method, collision_type, fact_id;
7. custom metrics: packages_collected, distance_m, run_duration_seconds, load_time_ms;
8. wyjątek dla środowiska developerskiego albo osobny strumień testowy;
9. destination_path jako kontrolowana ścieżka bez query string zamiast pełnego cta_url;
10. nawigacja CTA przez eventCallback z eventTimeout 300–500 ms oraz natychmiastowy fallback, gdy GTM lub zgoda nie pozwalają wysłać eventu.

Nie dodawać wewnętrznych UTM do linku z gry na inną stronę AMSO, ponieważ mogą nadpisać źródło sesji. Atrybucję zapewnia event game_cta_clicked i source_location.

### 9.6. Walidacja danych

Przed publikacją:

- GTM Preview pokazuje dokładnie jedno odpalenie na przejście stanu;
- GA4 DebugView otrzymuje wszystkie wymagane parametry;
- game_open_requested odpala przed próbą pobrania modułu, a game_ready dopiero po pełnej gotowości;
- game_load_failed odpala najwyżej raz na nieudaną próbę i nie jest zastępowany wieloma eventami game_error;
- post_score nie odpala po ręcznym zamknięciu aktywnej gry;
- game_closed zawiera close_state="running" w takim przypadku;
- retry tworzy nowy level_start i zwiększa run_number;
- wszystkie stany zgód zachowują się zgodnie z wybranym modelem z sekcji 9.7 i żaden z nich nie blokuje gry;
- żadna wartość dataLayer nie zawiera PII;
- CTA jest rejestrowane przed nawigacją;
- środowisko testowe nie zanieczyszcza raportów produkcyjnych.

### 9.7. Consent Mode v2

Przed implementacją analityka i osoba odpowiedzialna za prywatność potwierdzają istniejący model AMSO:

- **Basic Consent Mode:** tagi Google nie uruchamiają się przed zgodą. Eventy gry sprzed zgody są świadomie tracone i nie są później odtwarzane;
- **Advanced Consent Mode:** CMP ustawia stany domyślne przed załadowaniem GTM, a tagi Google korzystają z własnych built-in consent checks. Nie dodaje się im dodatkowego blokowania wyłącznie przez analytics_storage; zachowanie cookieless pings musi odpowiadać polityce AMSO.

W Tag Assistant należy sprawdzić analytics_storage, ad_storage, ad_user_data i ad_personalization dla stanów default, denied oraz granted. Gra nie zapisuje własnego identyfikatora i działa tak samo niezależnie od wyboru użytkownika.

## 10. Plan realizacji i kamienie milowe

### 10.1. Harmonogram standardowy

| Etap | Zakres | Czas kalendarzowy | Nakład |
|---|---|---:|---:|
| 0. Kick-off i lock decyzji | P0 decyzje, CTA, fakty, dostęp, DoD | 2 dni | 1,5–2,5 PD |
| 1. Spike integracyjny i graybox | loader IdoSell, modal, bieg, skok, kolizja | 3–4 dni | 3–4,5 PD |
| 2. Branded MVP | paczki, przeszkody, scoring, UI, fakty, assety | 4–6 dni | 7–10 PD równolegle dev/design |
| 3. Integracja i analityka | dataLayer, GTM, consent, CTA, feature flag | 2–3 dni | 2,5–4 PD |
| 4. QA, tuning i UAT | urządzenia, przeglądarki, wydajność, poprawki | 3–4 dni | 3,5–5 PD |
| 5. Release | smoke test, aktywacja, monitoring, rollback | 1 dzień | 1–2 PD |

Łącznie: około **15–20 dni roboczych** i **19–28 osobodni**, ponieważ projektowanie assetów, development i przygotowanie GTM mogą częściowo działać równolegle.

### 10.2. Harmonogram ekspresowy

Możliwy w 10–12 dni roboczych liczonych dopiero od zamknięcia M0, przekazania stagingu/GTM i dostarczenia finalnych assetów. Minimalna obsada to jeden senior frontend/game developer na pełen etat, projektant około 0,5 etatu oraz dostępni part-time QA i specjalista GTM. Wariant jest możliwy wyłącznie, gdy:

- styl, logo, postać i tło są gotowe w dniu 1;
- marketing zatwierdza fakty, CTA i komunikat licznika w ciągu 24 godzin;
- dostęp do kopii szablonu i GTM jest natychmiastowy;
- zakres pozostaje jump-only;
- nie ma kodów, rankingu, API, share ani offline;
- UAT ma jedną krótką rundę poprawek.

Każde oczekiwanie na decyzję lub materiał dłuższe niż uzgodnione 24 godziny przesuwa termin co najmniej dzień za dzień.

### 10.3. Kamienie milowe i bramki

**M0 — scope lock**

- podpisany zakres MVP;
- właściciele decyzji;
- finalny CTA;
- zatwierdzony fakt lub lista faktów;
- ustalony trigger i termin premiery.

**M1 — graybox playable**

- pełna pętla start → bieg → kolizja → retry;
- sterowanie desktop/touch;
- testowy build osadzony na stronie zbliżonej do IdoSell.

**M2 — branded beta**

- finalne assety;
- scoring, trudność, fakt, CTA;
- wszystkie eventy widoczne w dataLayer.

**M3 — release candidate**

- testy automatyczne zielone;
- GTM/DebugView zatwierdzone;
- budżet wagowy i performance spełnione;
- checklista treści oraz dostępności podpisana.

**M4 — launch**

- pisemna zgoda właściciela kampanii po ogłoszeniu miliona;
- aktywacja flagi;
- smoke test produkcyjny;
- monitoring błędów i eventów.

## 11. Testy i jakość

### 11.1. Testy jednostkowe

- ruch pionowy, grawitacja i lądowanie;
- jump buffer i coyote time;
- AABB/hitbox i „wybaczający” margines;
- reguły spawnów i minimalny czas reakcji;
- brak niemożliwych sekwencji;
- naliczanie dystansu, paczek i score;
- progi trudności;
- wybór wyłącznie aktywnych faktów;
- walidacja runner-config.json, allowlista CTA i fail-closed;
- przejścia maszyny stanów;
- dokładnie jeden event na przejście.

### 11.2. Testy integracyjne

- init/open/close/destroy oraz wielokrotne init;
- blokada i przywrócenie scrolla;
- zwracanie focusu;
- pause/resume po blur i visibilitychange;
- przerwanie ładowania assetu;
- enabled=false, błędny JSON, niezgodny schemaVersion i wygasły cache konfiguracji;
- brak dataLayer i późne pojawienie się GTM;
- consent denied/granted;
- klik CTA i fallback nawigacji;
- lokalizacja assetów przy innym base path;
- brak konfliktu z globalnym CSS.

### 11.3. E2E

Automatycznie w Playwright:

- Chromium, Firefox i WebKit;
- viewport desktop 1366 × 768 i 1920 × 1080;
- mały telefon 320/375 px szerokości;
- współczesny telefon Android;
- iPhone i iPad presets;
- portret i landscape bez wymuszania obrotu oraz bez obcięcia HUD/CTA;
- klawiatura, mysz i dotyk;
- start, skok, paczka, kolizja, retry, CTA, close;
- eventy dataLayer i brak duplikacji;
- brak pobrania runner.es.js przed dozwoloną intencją/preloadem;
- screenshoty start, bieg i game over.

Manualnie na realnych urządzeniach:

- Safari na iOS;
- Chrome na średniej klasy Androidzie;
- Chrome/Edge na Windows;
- Safari na macOS;
- przynajmniej jeden wolniejszy telefon z ostatnich 3–4 lat.

Docelowy zakres wersji przeglądarek należy ustalić na podstawie ostatnich 90 dni danych AMSO. Punkt startowy: dwie najnowsze stabilne wersje Chrome, Edge, Firefox i Safari. Starsze wersje dodajemy tylko wtedy, gdy mają istotny udział ruchu.

### 11.4. Performance

Profil referencyjny należy zapisać w repozytorium przed M1. Punkt startowy: release build, zimny cache, aktualny Chrome, realny telefon klasy Pixel 6a lub uzgodnione urządzenie odpowiadające medianie ruchu AMSO oraz zapisane profile Fast 4G/Slow 4G. Game ready time jest zawsze mierzony od aktywacji triggera do pierwszej sterowalnej klatki.

Warunki akceptacji:

- brak pobierania pełnych assetów gry przed intencją użytkownika; ewentualny idle preload dopiero po LCP, przy saveData=false i bez 2g/slow-2g;
- brak pogorszenia CLS strony;
- loader do około 10 KB po kompresji;
- gotowość do startu do 1 s na szybkim 4G i do 2,5 s na symulowanym wolnym 4G;
- co najmniej 95% interwałów requestAnimationFrame nie przekracza 20 ms podczas dwuminutowego, seedowanego biegu na urządzeniu referencyjnym;
- zero przypisanych grze Long Tasks ponad 50 ms podczas tego biegu;
- backing buffer Canvas nie przekracza 4 MP na mobile ani 8 MP na desktopie;
- po 10 cyklach open → play → destroy nie pozostają odłączone węzły DOM ani listenery, a retained heap po wymuszonym GC w teście Chromium nie rośnie o więcej niż 5 MB;
- transfer pierwszego otwarcia nie przekracza 2 MB.

Narzędzia: Lighthouse/WebPageTest dla strony hosta, Chrome Performance, PerformanceObserver, raport Vite, test throttlingu i manualny profil na Androidzie.

### 11.5. Testy treści

- każda liczba ma właściciela i datę zatwierdzenia;
- analogie 240 m i pięć Boeingów nie są publikowane bez akceptacji;
- zapis „1 000 000+” jest spójny we wszystkich ekranach;
- CTA prowadzi pod finalny adres;
- brak obietnicy nagrody, jeśli mechanizm nagród nie istnieje;
- komunikaty nie sugerują licznika live bez API;
- polskie znaki i łamanie tekstu działają przy 320 px.

## 12. Kosztorys

### 12.1. Założenia

Model zakłada:

- 8 godzin na osobodzień;
- stawkę mieszaną 220–280 zł netto/h jako parametr kalkulacji, nie twierdzenie o cenie rynkowej;
- jedną rundę zmian po branded beta;
- jeden język;
- brak backendu, nagród i rankingu;
- assety 2D o umiarkowanej liczbie klatek;
- wsparcie zespołu AMSO przy IdoSell, GTM i akceptacji treści.

### 12.2. Scenariusze

| Scenariusz | Zakres | Szacowany nakład | Koszt orientacyjny |
|---|---|---:|---:|
| Lean implementation | gotowe assety i copy; AMSO obsługuje CMS/GTM | 96–128 h | 21–36 tys. zł netto |
| Full MVP | projekt assetów, development, integracja, tracking, QA | 152–220 h | 33–62 tys. zł netto |
| Full MVP + rezerwa 10% | jak wyżej, z buforem wdrożeniowym | 167–242 h | 37–68 tys. zł netto |

### 12.3. Podział nakładu full MVP

| Obszar | Godziny |
|---|---:|
| discovery, game design, PM | 12–20 |
| frontend i silnik gry | 72–96 |
| projekt i eksport assetów | 32–48 |
| integracja IdoSell i GA4/GTM | 16–24 |
| QA, tuning, dostępność | 16–24 |
| release i dokumentacja | 4–8 |
| **Razem** | **152–220** |

### 12.4. Dodatki wyceniane osobno

| Dodatek | Nakład orientacyjny | Zależności |
|---|---:|---|
| kucanie + przeszkoda górna | 1–2 PD | nowa animacja i testy touch |
| 3 power-upy | 4–7 PD | assety, balans, dodatkowe stany |
| SFX i mute | 1–2 PD | pliki/licencje |
| share wyniku | 1–3 PD | copy, Web Share, fallback |
| tryb offline | 1–3 PD | osobny scope service workera |
| live licznik | 3–6 PD | bezpieczne API i cache |
| kody rabatowe | 5–10 PD | backend, pula kodów, antyfraud, regulamin |
| ranking | 8–15 PD | backend, prywatność, moderacja, utrzymanie |

Jeśli nagrody są częścią kampanii, logika JavaScript po stronie klienta nie wystarcza. Kody muszą być wydawane przez backend z limitem, walidacją i ochroną przed ponownym użyciem.

## 13. Ryzyka i działania zapobiegawcze

| Ryzyko | Skutek | Ograniczenie |
|---|---|---|
| opóźnione assety lub akceptacje | brak czasu na QA | scope lock M0, graybox równolegle, deadline na feedback |
| niepotwierdzona integracja IdoSell | błędy na produkcji | spike na kopii szablonu przed branded MVP |
| konflikt CSS/z-index | niedostępny koszyk lub banner zgód | izolowany root, matryca warstw, E2E na realnej stronie |
| fałszywie brzmiący „globalny licznik” | ryzyko wizerunkowe | stały, zatwierdzony claim albo prawdziwe API |
| niezweryfikowane fakty | błąd kampanii | approval metadata i blokada publikacji konfiguracji |
| zbyt trudna gra na touch | niski retry i frustracja | real-device playtest, coyote time, łagodne hitboxy |
| eventy bez zgody | ryzyko compliance | GTM Consent Mode, brak PII, gra niezależna od analityki |
| podwójne eventy | błędne raporty | eventy na przejściach stanów, test dataLayer |
| kupony w frontendzie | nadużycia | wyłącznie backend w osobnym etapie |
| service worker sklepu | błędny cache e-commerce | brak offline w MVP; ewentualny SW tylko w ograniczonym scope |
| premiera przed komunikatem | utrata efektu kampanii | runtime flag enabled i właściciel aktywacji |

## 14. Decyzje wymagane od AMSO

### P0 — przed rozpoczęciem sprintu

1. Czy gra jest na stronie głównej, /million, czy w obu miejscach?
2. Który dokładnie element jest triggerem i jaki ma fallback link?
3. Czy zespół potwierdza IdoSell i zapewnia kopię szablonu/staging?
4. Kto publikuje pliki i kto ma uprawnienia do GTM?
5. Pixel-art czy flat/pixel-inspired? Rekomendacja: flat/pixel-inspired.
6. Czy MVP pozostaje jump-only? Rekomendacja: tak.
7. Czy głównym wynikiem są paczki, a punkty wynikiem pomocniczym? Rekomendacja: tak.
8. Czy „1 000 000+” jest stałym claimem? Rekomendacja: tak, bez symulowanego live countera.
9. Jaki jest finalny tekst, cta_id i dozwolona ścieżka destination_path?
10. Które fakty są zatwierdzone wraz z datą aktualności?
11. Jaka jest dokładna data i osoba zatwierdzająca aktywację?
12. Czy dźwięk jest wymagany w MVP? Rekomendacja: nie.
13. Czy game_cta_clicked ma być key eventem liczonym raz na sesję? Rekomendacja: tak.

### P1 — przed branded beta

1. Czy zapisujemy najlepszy wynik lokalnie?
2. Czy po pierwszym release planowany jest share?
3. Czy marketing potrzebuje dziennych wariantów faktów?
4. Jakie są wyniki ruchu przeglądarek/urządzeń z ostatnich 90 dni?

### P2 — osobny business case

1. Czy nagroda realnie zwiększa cel kampanii, czy zmienia projekt w promocję?
2. Kto finansuje, wydaje i rozlicza kody?
3. Czy potrzebny jest regulamin, limit wieku lub dodatkowa zgoda?
4. Czy ranking uzasadnia koszty prywatności, utrzymania i moderacji?

## 15. Definition of Done MVP

MVP jest gotowy dopiero, gdy wszystkie poniższe warunki są spełnione.

### Produkt

- użytkownik przechodzi pełną pętlę start → gra → game over → retry/CTA;
- Space, klik i tap reagują niezawodnie;
- paczki zwiększają licznik;
- kolizje kończą bieg;
- trudność rośnie, ale generator nie tworzy niemożliwych sekwencji;
- ekran startowy i game over pokazują zatwierdzony claim „1 000 000+” bez sugerowania licznika live;
- ekran game over pokazuje paczki, wynik, fakt, retry i CTA.

### Integracja

- trigger otwiera modal bez przeładowania;
- awaria gry zachowuje fallback linku;
- close/Escape działa i zwraca focus;
- strona odzyskuje scroll i stan po destroy;
- koszyk, wyszukiwarka, cookie banner oraz live chat nadal działają;
- istnieje sprawdzony kill switch.

### Analityka

- game_trigger_viewed, game_open_requested, game_opened, game_ready, game_load_failed, level_start, post_score, game_restarted, game_cta_clicked, game_closed i game_error mają zaakceptowany kontrakt;
- DebugView pokazuje poprawne wartości;
- nie ma duplikatów ani PII;
- tagi respektują zatwierdzony model Consent Mode v2 i wszystkie wymagane stany zgód;
- game_cta_clicked jest skonfigurowany jako key event zgodnie z decyzją marketingu.

### Jakość

- wszystkie testy krytyczne przechodzą;
- realne iOS oraz Android przeszły smoke test;
- spełniony jest limit 2 MB;
- nie ma istotnego regresu Core Web Vitals strony przed otwarciem gry;
- powłoka modala i alternatywna ścieżka spełniają uzgodniony zakres WCAG 2.2 AA;
- treści i dane mają zatwierdzenie marketingu.

### Release

- feature flag pozostaje wyłączona do komunikatu miliona;
- właściciel kampanii wydał zgodę na aktywację;
- istnieje backup poprzedniego szablonu i procedura rollback;
- monitoring eventów i błędów jest przypisany na dzień premiery.

## 16. Rekomendowany skład odpowiedzialności

| Rola | Odpowiedzialność |
|---|---|
| Adrian Lach / marketing | scope, harmonogram, CTA, decyzja launch/kill |
| Kamil Kostur / content-social | copy, fakty, ton, ewentualny share |
| Kreacja AMSO | brand kit, postać, tła, przeszkody, akceptacja wizualna |
| E-commerce/IT | IdoSell, hosting, CSP, publikacja, rollback |
| Analityka | GTM, GA4, Consent Mode, walidacja danych |
| Wykonawca gry | kod, build, dokumentacja, testy automatyczne |
| QA/UAT | macierz urządzeń, regres storefrontu, podpis release candidate |

Jedna osoba po stronie AMSO powinna mieć ostateczne prawo decyzji przy konflikcie terminu, jakości i zakresu.

## 17. Źródła techniczne

- [AMSO — publiczny panel wskazujący IdoSell](https://amso.pl/panel/main.php)
- [Vite — build produkcyjny i library mode](https://vite.dev/guide/build.html#library-mode)
- [MDN — Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Google Analytics — zalecane eventy, w tym post_score](https://developers.google.com/analytics/devguides/collection/ga4/reference/recommended-events)
- [Google Analytics — konfiguracja eventów](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Google Tag Platform — Consent Mode](https://developers.google.com/tag-platform/security/guides/consent)

---

## Decyzja rekomendowana do zatwierdzenia

Uruchomić standardowy sprint MVP w wariancie **jump-only, bez backendu, bez nagród i bez dźwięku**, oparty o **TypeScript + Canvas 2D + Vite**, osadzany w **IdoSell** przez stabilny atrybut triggera i globalne API modułu. Równolegle rozpocząć produkcję lekkich assetów flat/pixel-inspired oraz przygotowanie GTM. Dodatki oceniać dopiero po stabilnym release candidate albo na podstawie danych z pierwszej wersji.
