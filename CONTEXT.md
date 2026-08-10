# Droga do Miliona

Interaktywna kampania AMSO opowiadająca historię drogi do miliona zamówień przez fabularny endless runner i następujący po nim Tryb Wyzwania.

## Language

**Urządzenie bazowe**:
Minimalny profil wydajnościowy kampanii: telefon Android klasy średniej z około 2022 roku, 4 GB RAM, przeglądarka Chrome lub Edge i ekran 60 Hz. Safari na iPhonie jest drugą obowiązkową platformą odbioru.
_Avoid_: Słaby telefon, dowolny telefon

**Płynny bieg**:
Rozgrywka, w której podczas 60-sekundowej próby na Urządzeniu bazowym co najmniej 95% klatek trwa najwyżej 18 ms, 99% najwyżej 33 ms, a żadna aktywna klatka nie przekracza 100 ms. Pomiar obejmuje przejścia światów i ma pierwszeństwo przed skracaniem czasu pierwszego uruchomienia oraz redukcją rozmiaru pliku.
_Avoid_: Dobra wydajność, działa płynnie

**Obniżona jakość wizualna**:
Automatyczny wariant renderowania, który może zmniejszyć rozdzielczość tła do około 75% i ograniczyć dekoracje, ale zachowuje tło, parallax, kuriera oraz pełny kontrakt rozgrywki. Włącza się po dwóch kolejnych 2-sekundowych oknach niespełniających budżetu p95, wraca po 15 sekundach stabilności, a zmianę stosuje wyłącznie poza widoczną granicą paneli; nie zmienia fizyki, prędkości, liczby paczek ani przeszkód. Działa bez komunikatu i bez ustawienia dla gracza; tylko Raport wydajności pokazuje aktywny poziom i udostępnia wymuszenie `full` albo `reduced` do QA.
_Avoid_: Tryb łatwy, adaptive assist

**Raport wydajności**:
Lokalny raport diagnostyczny uruchamiany wyłącznie w trybie QA, zawierający rozkład czasu klatek, długie klatki, poziom jakości, parametry canvas oraz czasy dekodowania assetów. Nie jest analityką marketingową i nie jest wysyłany poza urządzenie.
_Avoid_: Analityka performance, tracking gracza

**Zegar wizualny**:
Wspólny rytm `requestAnimationFrame`, który synchronizuje ruch gameplay canvas i parallaxu. Aktualizacje HUD pozostają rzadsze i nie sterują pozycją świata.
_Avoid_: Snapshot loop, CSS smoothing

**Panel świata**:
Jedna kompozytowana warstwa obrazu reprezentująca bieżący albo następny świat podczas parallaxu. Panel korzysta z dekodowanego assetu bez pośredniej kopii do osobnego canvas.
_Avoid_: Canvas tła, kopia świata

**Autonomiczny HTML**:
Artefakt offline QA i odbioru zawierający kod, konfigurację i wszystkie wymagane assety bez zewnętrznych plików. Jest źródłem produkcyjnego Pakietu zewnętrznego IdoSell, lecz nie jest wklejany do formularza CMS z powodu limitu payloadu.
_Avoid_: QA-only implementation, ręcznie rozjechany build

**Pakiet zewnętrzny IdoSell**:
Produkcyjny zestaw generowany z Autonomicznego HTML: mały snippet CMS z inline watchdogiem oraz stabilne pliki `million.css` i `million.js` na otwartej domenie HTTPS. Skrypt zawiera obrazy jako data URI, a IdoSell pozostaje właścicielem powłoki dokumentu i metadanych.
_Avoid_: Wklejenie całego bundle do CMS, zależne ścieżki assetów

**Wariant Vercel**:
Niezależny fallback publikacyjny pod `/million`, budowany do `dist-vercel/` bez source map i bez nieużywanych assetów źródłowych. Dzieli gameplay oraz lokalizacje z Pakietem zewnętrznym IdoSell, lecz jako samodzielna strona przywraca `↑` dla skoku i `↓` dla ślizgu; profil IdoSell nadal blokuje wszystkie strzałki, aby chronić scroll CMS.
_Avoid_: Druga implementacja gry, kopia z rozjechanym gameplayem

**Gotowość startowa**:
Stan, w którym Autonomiczny HTML pokazuje interaktywny ekran startowy w ciągu 3 sekund od zimnego otwarcia, a gameplay jest gotowy najwyżej 2 sekundy po wybraniu Start na Urządzeniu bazowym. Assety dalszych światów mogą być osadzone, lecz nie są wcześniej dekodowane.
_Avoid_: Załadowana strona, widoczny loader

**Pamięć światów**:
Sesyjny cache, który dekoduje każdy z siedmiu cyklicznych światów dopiero przed pierwszym użyciem, a następnie zachowuje go do końca sesji. Zapobiega ponownemu dekodowaniu i szarpnięciom przy kolejnych obiegach Trybu Wyzwania.
_Avoid_: Cache dwóch światów, ponowne dekodowanie

**Budżet pamięci**:
Maksymalnie około 220 MB pamięci karty na Urządzeniu bazowym po uwzględnieniu Autonomicznego HTML i Pamięci światów. Po pierwszym pełnym obiegu światów trzy kolejne obiegi mogą zwiększyć użycie łącznie najwyżej o 10 MB.
_Avoid_: Najmniejsze zużycie pamięci, brak cache

**Scenariusz wzorcowy**:
Deterministyczna 60-sekundowa próba wydajności obejmująca maksymalną zatwierdzoną gęstość trasy, skoki, przysiady, collectible, power-up, celebrację, Gwarancję i co najmniej dwie zmiany świata. Towarzyszy jej osobny pomiar zimnego startu oraz czterech pełnych obiegów światów.
_Avoid_: Losowy benchmark, ręczny przebieg

**Budżet Autonomicznego HTML**:
Maksymalnie 14 MiB surowego HTML oraz 16 MiB po oszacowaniu kodowania formularza dla artefaktu offline QA; produkcyjne IdoSell korzysta z Pakietu zewnętrznego IdoSell. Produkcyjne WebP zachowują zatwierdzoną rozdzielczość, a kompresja jest akceptowana wyłącznie wtedy, gdy różnica pozostaje niewidoczna w porównaniu story i gameplay na docelowym ekranie.
_Avoid_: Najmniejszy plik, kompresja bez odbioru wizualnego

**Kolejka rozgrzewania**:
Sekwencyjny mechanizm dekodowania assetów wewnątrz Autonomicznego HTML. Ekran startowy uruchamia wyłącznie minimum interfejsu; po wybraniu Start kolejka przygotowuje kuriera, bieżący świat i krytyczne assety gameplayu, a kolejne światy dekoduje pojedynczo podczas bezczynności lub pauz fabularnych. AudioContext jest tworzony dopiero po pierwszym geście użytkownika, najpierw przygotowuje krytyczne sygnały, a resztę audio później w tej samej kolejce. Brak gotowego dźwięku nigdy nie opóźnia startu gameplayu. Kolejka nie uruchamia równoległego dekodowania całego zestawu.
_Avoid_: Preload wszystkiego, równoległy decode

**Bramka wydania**:
Warunek dopuszczenia kampanii do publikacji. Automatycznie sprawdza poprawność konfiguracji, Autonomiczny HTML, Pakiet zewnętrzny IdoSell, Wariant Vercel, Scenariusz wzorcowy i brak błędów konsoli; następnie wymaga ręcznego raportu ze Scenariusza wzorcowego na Urządzeniu bazowym oraz Safari na iPhonie, obejmującego płynność, pamięć, start i przejścia światów. Wynik wyłącznie desktopowego lub headless benchmarku nie zastępuje testu mobilnego.
_Avoid_: CI performance, test na komputerze

**Kontrakt niezmienności gameplayu**:
Zasada, według której ten sam seed i zapis wejścia po optymalizacji muszą wygenerować te same przeszkody i collectible oraz zakończyć się tymi samymi podniesieniami, kolizjami, wynikiem i przejściami światów, z tolerancją najwyżej jednego kroku symulacji 120 Hz. Optymalizacja nie może wprowadzić dodatkowego czasu blokady sterowania.
_Avoid_: Podobny przebieg, nieodczuwalna zmiana

**Kontrakt wierności wizualnej**:
Granica optymalizacji, która chroni wszystkie tła światów i płynny parallax, zatwierdzone animacje kuriera, Gwarancję, power-upy, collectible, celebracje rekordów oraz czytelność scen fabularnych. Obniżona jakość wizualna może redukować drugorzędne cząstki, cienie, glow i rozdzielczość bufora tła, ale nie może usuwać chronionych elementów ani zmieniać ich znaczenia.
_Avoid_: Uproszczona grafika, usunięte efekty

**Próba porównawcza**:
Ocena pojedynczej optymalizacji na podstawie raportów before/after wykonanych w tym samym Scenariuszu wzorcowym. Zmiana pozostaje tylko wtedy, gdy poprawia wskazaną metrykę bez pogorszenia Budżetu pamięci, Kontraktu niezmienności gameplayu ani Kontraktu wierności wizualnej; w przeciwnym razie jest wycofywana. Tymczasowe query-parametry mogą izolować warianty w QA, lecz nie są ustawieniami produkcyjnymi.
_Avoid_: Optymalizacja na oko, szybszy kod

**Gotowość wydajnościowa**:
Stan zakończenia etapu optymalizacji: spełnione są budżety klatki, startu, pamięci i rozmiaru Autonomicznego HTML; Bramka wydania przechodzi na Urządzeniu bazowym oraz Safari na iPhonie; cztery cykle Trybu Wyzwania nie wykazują szarpnięć ani ponownego dekodowania światów; zachowane są oba kontrakty jakościowe; sterowanie nie zawiesza się, konsola pozostaje bez błędów, a Autonomiczny HTML i preview Pakietu zewnętrznego IdoSell zachowują się jednakowo. Raport wydajności zawiera wyniki before/after.
_Avoid_: Optymalizacja zakończona, działa szybciej
