# AMSO — Droga do Miliona
## Scenariusz implementacyjny v3

> **Status:** aktualne źródło wymagań produkcyjnych  
> **Data:** 13 lipca 2026  
> **Dokument nadrzędny dla fabuły:** [`amso_droga_do_miliona_scenariusz.md`](./amso_droga_do_miliona_scenariusz.md)  
> **Zastępuje:** [`brief_runner_droga_do_miliona_v2_fabula.md`](./brief_runner_droga_do_miliona_v2_fabula.md)  
> **Zakres:** adaptacja biblii narracyjnej do istniejącej gry, dwa tryby rozgrywki, treści ekranowe, logika scen, zapis postępu, wymagania assetowe i kryteria odbioru

---

# 1. Rola dokumentów i hierarchia decyzji

Projekt korzysta z dwóch osobnych dokumentów:

1. `amso_droga_do_miliona_scenariusz.md` pozostaje **biblią narracyjną**. Chroni sens historii, bohaterów, motywy, fakty i ton marki.
2. Niniejszy dokument jest **scenariuszem implementacyjnym**. Określa, co gracz widzi i robi, jak historia mieści się w grze oraz jakie warunki musi spełnić wersja produkcyjna.

W razie konfliktu:

- w sprawach sensu historii, tonu i faktów obowiązuje biblia narracyjna;
- w sprawach struktury sesji, mechaniki, ekranów, stanów i zakresu produkcji obowiązuje v3;
- zmiana sensu historii wymaga aktualizacji obu dokumentów;
- tuning czasu, trudności i częstotliwości obiektów może odbywać się w konfiguracji bez zmiany biblii.

Brief v2 jest archiwalny. Nie należy implementować na jego podstawie zakończenia po pierwszej kolizji, modalnego runtime'u w sklepie, rozbudowanej analityki ani kodu rabatowego.

---

# 2. Cel doświadczenia

Gra ma opowiedzieć, że AMSO dotarło do miliona zamówień dzięki ludziom, którzy wybierali sprawdzony sprzęt dla pracy, nauki i rozwoju własnych planów.

Najważniejszy komunikat brzmi:

> **Milion zamówień to nie tylko liczba. To milion potrzeb, decyzji i historii.**

Gracz nie może stracić dostępu do tego komunikatu przez brak zręczności. Dlatego historia ma gwarantowany finał, a rywalizacja zostaje przeniesiona do osobnego trybu odblokowywanego po jej ukończeniu.

## 2.1. Główna audiencja

- podstawowa: szeroka grupa odwiedzających AMSO.pl, kupujących sprzęt dla siebie, nauki lub pracy;
- druga: małe firmy i osoby rozpoczynające działalność;
- historia dużego klienta B2B jest dowodem zaufania, ale nie narzuca korporacyjnego tonu całej grze.

Gra ma być zrozumiała bez wcześniejszej wiedzy o AMSO. Humor jest ciepły i obserwacyjny, nie dziecinny i nie ośmiesza klientów ani pracowników.

---

# 3. Model produktu: dwa tryby

## 3.1. Tryb fabularny — „Droga do Miliona”

- pierwsze uruchomienie prowadzi do trybu fabularnego;
- docelowy czas pełnej sesji: **150–180 sekund**;
- dokładne czasy są konfigurowalne i muszą zostać dostrojone po playtestach;
- historia składa się z prologu i pięciu epok;
- kolizja daje karę, ale nie kończy historii;
- żadnej sceny ani tekstu nie można pominąć;
- po ukończeniu finału tryb wyzwania zostaje trwale odblokowany na urządzeniu;
- historię można później przejść ponownie.

## 3.2. Tryb wyzwania — „Próba Miliona”

„Próba Miliona” jest nazwą własną trybu. Określenie „tryb wyzwania” używane w dalszej części dokumentu oznacza wyłącznie Próbę Miliona. Wartość `challenge` występuje tylko w kontraktach technicznych i analitycznych.

- odblokowuje się dopiero po obejrzeniu finału trybu fabularnego;
- jest nieskończonym biegiem w świecie współczesnego AMSO, już po milionowym zamówieniu;
- nie zawiera tekstów fabularnych, dat ani przerywników;
- pierwsza kolizja bez aktywnej ochrony kończy bieg;
- prędkość rośnie tylko do przetestowanego maksimum;
- późniejsza trudność rośnie przez uczciwe kombinacje przeszkód;
- zapisuje lokalny rekord punktowy oraz rekord zebranych paczek;
- wynik można udostępnić na Facebooku i Instagramie.

## 3.3. Wybór trybu po odblokowaniu

Po pierwszym ukończeniu historii ekran startowy pokazuje:

> **Wybierz swoją drogę**

Przyciski:

- **Przejdź historię ponownie**
- **Próba Miliona**

Tryb fabularny nigdy nie znika i nie staje się gorszą wersją trybu wyzwania.

---

# 4. Bohater i metafory

## 4.1. Tożsamość gracza

Gracz steruje kurierem. Kurier przez całą historię niesie **pierwszą paczkę AMSO**. Paczka jest wizualnie stałym elementem postaci lub bezpośrednio jej towarzyszy.

Nie należy mówić, że gracz dosłownie „jest zamówieniem”. Związek ma być czytelny wizualnie:

- w prologu pracownik przekazuje kurierowi pierwszą paczkę;
- paczka przechodzi przez wszystkie epoki;
- w finale jej etykieta i iskra stają się częścią zamówienia nr 1 000 000.

## 4.2. Iskra zaufania

Iskra:

- pojawia się przy pierwszej paczce;
- rośnie wraz z serią zebranych paczek;
- słabnie po kolizji, ale nie znika;
- uruchamia bezpieczne przejścia narracyjne;
- łączy historie klientów;
- w finale scala osiem symboli drogi.

Iskra nie jest osobnym collectible. Jest wskaźnikiem serii, postępu emocjonalnego i bezpiecznego przejścia.

## 4.3. Powracające rekwizyty

W każdej kolejnej epoce należy, gdy pozwala kadr, pokazywać:

- pierwszą ręcznie opisaną etykietę;
- kubek z pierwszego magazynu;
- stary laptop przedsiębiorcy kupiony za 300 zł;
- coraz większą konstelację iskier.

---

# 5. Sterowanie i podstawowa pętla

## 5.1. Dwie główne akcje

### Skok

- desktop: `Spacja`;
- touch/pointer: tapnięcie lub kliknięcie w obszar gry.

### Ślizg / przykucnięcie

- desktop: `↓` lub `S`;
- touch: swipe w dół.

Nie dodajemy trzeciej podstawowej akcji. Różnorodność wynika z kompozycji przeszkód, celów epok, power-upów, bezpiecznych przejść i kulminacji.

## 5.2. Nauka sterowania

- prolog i początek epoki 1 uczą skoku na bezpiecznym układzie paczek;
- epoka 2 wprowadza ślizg pod pojedynczą, wyraźnie zapowiedzianą przeszkodą górną;
- epoki 3–4 łączą obie akcje;
- finał sprawdza obie akcje, lecz nie blokuje zakończenia fabuły.

Copy samouczka:

> **Tapnij lub naciśnij Spację, żeby skoczyć.**

> **Przesuń palcem w dół albo naciśnij ↓, żeby zrobić ślizg.**

Podpowiedź znika dopiero po poprawnym wykonaniu akcji. Pierwsza próba nie może prowadzić do kolizji.

---

# 6. Kolizje, seria i bezpieczne odzyskanie kontroli

## 6.1. Kolizja w trybie fabularnym

Kolizja:

- nie kończy biegu;
- nie odejmuje zdobytych punktów ani paczek;
- resetuje mnożnik serii do `×1`;
- na moment osłabia iskrę;
- wywołuje wizualny hit-stop trwający około 100–150 ms;
- daje około 2 sekund niewrażliwości;
- usuwa lub bezpiecznie rozbija przeszkody na drodze w czasie ochrony;
- blokuje spawnowanie nowych przeszkód do końca ochrony.

Po kolizji nie wolno zmieniać:

- poziomej prędkości świata;
- grawitacji;
- prędkości pionowej;
- trajektorii rozpoczętego skoku.

Dzięki temu kara nigdy nie powoduje automatycznej drugiej kolizji.

## 6.2. Adaptacja trudności fabuły

- startowa trudność jest wspólna dla wszystkich;
- po dwóch kolizjach w jednej epoce gra tymczasowo zwiększa odstępy między przeszkodami;
- po dłuższej czystej serii łagodnie wraca do standardowych parametrów;
- adaptacja jest niewidoczna dla gracza;
- nie zmienia treści, długości ani finału.

## 6.3. Kolizja w trybie wyzwania

- bez ochrony: natychmiastowy Game Over;
- z aktywną „Gwarancją 48 miesięcy”: ochrona pochłania dokładnie jedno uderzenie;
- po pochłonięciu uderzenia ochrona znika i uruchamia krótki bezpieczny odcinek;
- gwarancje nie kumulują się;
- tryb wyzwania nie stosuje adaptacyjnego ułatwiania.

---

# 7. „Korytarz zaufania” — bezpieczna narracja

Korytarz zaufania jest jednym, konsekwentnym sygnałem: **teraz można bezpiecznie odwrócić uwagę od sterowania i przeczytać historię**.

## 7.1. Zachowanie

1. Iskra rozszerza się w świetlną sferę wokół kuriera.
2. Sterowanie przechodzi w autopilot.
3. Przeszkody przed graczem zmieniają się w pozytywne elementy świata zamiast znikać bez przyczyny.
4. HUD wyniku zostaje wizualnie wyciszony.
5. Tekst pojawia się w stałej, czytelnej strefie.
6. Przed oddaniem kontroli sfera się zwęża.
7. Droga pozostaje pusta jeszcze przez około 2 sekundy.
8. Powrót sterowania zapowiada krótki impuls i komunikat:

> **Biegniemy dalej.**

Przy pierwszym korytarzu pojawia się dodatkowa informacja:

> **Bezpieczny odcinek — historia biegnie dalej.**

## 7.2. Transformacje przeszkód

- kable porządkują się w instalację;
- znaki zapytania zmieniają się w oznaczenia jakości;
- rachunki składają się w oszczędności i skarbonkę;
- kartony trafiają na właściwe linie sortowania;
- trasy dostaw układają się w czytelną sieć.

## 7.3. Reduced motion

Przy `prefers-reduced-motion`:

- sfera jest statyczna;
- obiekty zmieniają stan bez gwałtownych przelotów;
- kamera nie wykonuje szybkich najazdów;
- czas na przeczytanie tekstu pozostaje taki sam.

---

# 8. Power-upy jako wartości AMSO

Power-upy mają własny kształt, kolor i krótką nazwę. Nie mogą wyglądać jak zwykłe paczki.

## 8.1. Audyt jakości

- debiut: epoka 2;
- działanie: przez ograniczony czas podświetla nadchodzące przeszkody i łagodnie spowalnia wyłącznie tempo spawnów, bez zmiany aktywnej trajektorii gracza;
- znaczenie: kontrola i przewidywalność.

Copy pierwszego użycia:

> **Audyt jakości — zobacz przeszkody wcześniej.**

## 8.2. Drugie życie sprzętu

- debiut: epoka 3;
- działanie: czasowo podwaja punkty za zebrane paczki;
- znaczenie: większa wartość z rozsądnego wyboru.

Copy pierwszego użycia:

> **Drugie życie — każda paczka liczy się podwójnie.**

## 8.3. Gwarancja 48 miesięcy

- debiut: epoka 4;
- działanie w fabule: pochłania kolizję bez resetu serii;
- działanie w trybie wyzwania: jednorazowo chroni przed Game Over;
- jednocześnie można mieć tylko jedną ochronę.

Copy pierwszego użycia:

> **Gwarancja 48 miesięcy — jedno bezpieczne uderzenie.**

## 8.4. Finał

W Fali Miliona wszystkie trzy wartości powracają jako kompetencje, których gracz nauczył się wcześniej. Nie wprowadza się wtedy nowej mechaniki.

---

# 9. Collectibles i wynik

## 9.1. Hierarchia obiektów

1. **Paczka** — podstawowy collectible.
2. **Kategoria produktu** — mała ikona na paczce: notebook, telefon, PC albo monitor.
3. **Power-up** — odrębny wizualnie bonus.
4. **Osiem symboli drogi** — tylko podczas finału.
5. **Iskra** — wizualny stan serii, nigdy osobny przedmiot do zebrania.

## 9.2. Wynik

- główny komunikacyjnie wynik: liczba dostarczonych paczek;
- drugorzędny wynik arcade: punkty za dystans, paczki i serię;
- kolizja resetuje serię, ale nie zabiera wyniku;
- „Drugie życie sprzętu” podwaja punkty za paczki w aktywnym oknie;
- w trybie wyzwania rekord jest punktowy, a rekord paczek jest pokazywany obok;
- dokładna formuła i maksymalny mnożnik pozostają konfigurowalne do playtestów.

---

# 10. Przebieg trybu fabularnego

Podane czasy są wartościami startowymi i obejmują rozgrywkę, korytarze zaufania oraz teksty danej części. Ich suma wynosi 175 sekund. Całość po tuningu musi mieścić się w 150–180 sekundach. Tuning nie może skracać maksymalnego okna ekspozycji tekstu bez potwierdzenia w testach czytelności.

## 10.1. Budżet czasu i limity ekspozycji copy

`Maks. ekspozycja` oznacza czas, po którym scenariusz automatycznie przechodzi dalej. Gracz nie musi niczego naciskać. Kilka krótkich elementów może być widocznych równocześnie w bezpiecznej scenie, dlatego wartości w tabeli nie sumują się wprost do czasu epoki.

| ID treści | Ekran / treść | Maks. ekspozycja |
|---|---|---:|
| `prolog.first_ready` | „Dobra. Pierwsza gotowa.” | 2,5 s |
| `prolog.small_start` | Wszystko zaczęło się od kilku półek… | 4,5 s |
| `prolog.checked` | Dobry sprzęt nie musi być nowy… | 4 s |
| `epoch_1.title` | Początek / Mały magazyn, wielkie wyzwanie | 3 s |
| `epoch_1.challenge` | Wyzwanie: Kablowy Chaos | 2 s |
| `epoch_1.outro` | Na początku nie mieliśmy dużo miejsca… | 5 s |
| `epoch_2.title` | Drugie życie sprzętu / Zaufanie zaczyna się… | 3 s |
| `epoch_2.laptop` | On nie skończył swojej pracy… | 4,5 s |
| `epoch_2.challenge` | Wyzwanie: Chmura Wątpliwości | 2 s |
| `epoch_2.questions` | Trzy pytania Chmury Wątpliwości | 4 s łącznie |
| `epoch_2.future` | Sprzęt może mieć przeszłość… | 4 s |
| `epoch_2.test` | Drugie życie zaczyna się… | 4 s |
| `epoch_3.title` | Ludzie rosną razem ze sprzętem / Za każdą paczką… | 3,5 s |
| `epoch_3.designer_start` | Chcę pracować kreatywnie / Budżet: ograniczony | 3 s |
| `epoch_3.designer_new` | Dobry start nie zawsze musi być nowy | 3,5 s |
| `epoch_3.designer_step` | Czasem jeden rozsądny zakup… | 4,5 s |
| `epoch_3.business_300` | Potrzebuję laptopa… 300 zł | 3,5 s |
| `epoch_3.business_300k` | Budżet: 300 000 zł | 2,5 s |
| `epoch_3.business_trust` | Zmienił się biznes… | 4 s |
| `epoch_3.b2b_10` | Zaczęło się od testowych 10% | 3 s |
| `epoch_3.b2b_7years` | Siedem lat później… | 4,5 s |
| `epoch_3.challenge` | Wyzwanie: Budżetożerca | 2 s |
| `epoch_3.boss_line` | Dobry sprzęt musi kosztować fortunę | 3 s |
| `epoch_3.outro` | Rozsądny wybór nie oznacza… | 4 s |
| `epoch_4.title` | Skala potrzebuje systemu | 2,5 s |
| `epoch_4.warehouse` | 3 000 m² / niemal 400 zamówień dziennie | 4 s łącznie |
| `epoch_4.phones` | Około 240 metrów / wyżej niż PKiN | 4 s łącznie |
| `epoch_4.weight` | Około 400 000 kg / pięć Boeingów | 4,5 s łącznie |
| `epoch_4.products` | Cztery roczne liczby kategorii | 5 s łącznie |
| `epoch_4.stories` | Każde urządzenie ma swój numer… | 4,5 s |
| `epoch_4.challenge` | Wyzwanie: Logistyczna Hydra | 2 s |
| `epoch_4.outro` | Większy magazyn nie wystarczył… | 5 s |
| `epoch_4.changed` | Trochę się tu zmieniło | 2,5 s |
| `epoch_5.title` | Droga do Miliona | 2 s |
| `epoch_5.returning_lines` | Pięć krótkich kwestii postaci | 5 s łącznie |
| `epoch_5.counter` | 999 970 → 999 999 | 4 s |
| `epoch_5.challenge` | Finał: Fala Miliona | 2 s |
| `epoch_5.order_label` | Zamówienie nr 1 000 000 | 3 s |
| `final.number` | Milion zamówień to nie tylko liczba | 3,5 s |
| `final.moments` | To milion momentów… | 6 s |
| `final.first` | Pierwszą paczkę wysłaliśmy sami | 3,5 s |
| `final.together` | Do miliona dotarliśmy razem | 3,5 s |
| `final.thanks` | Dziękujemy za 1 000 000 zamówień / podpis | 5 s |

Copy pierwszego użycia power-upów oraz podpowiedzi sterowania pozostaje widoczne maksymalnie 4 sekundy i znika wcześniej po poprawnym użyciu. Teksty błędów, pauzy, checkpointu i menu nie przechodzą automatycznie dalej.

## PROLOG — Pierwsza paczka

**Czas startowy:** 10 sekund  
**Sterowanie:** wyłączone, następnie pierwszy bezpieczny skok  
**Cel:** przekazać kurierowi pierwszą paczkę i ustanowić iskrę.

### Obraz

Mały sklep i magazyn wielkości kawalerki. Pracownik odbiera telefon, sprawdza urządzenie i kończy pakowanie. Na pudełku zapisuje pierwszą etykietę. Obok stoją półki, drukarka, taśma i charakterystyczny kubek.

### Akcja

Pracownik zamyka paczkę:

> **„Dobra. Pierwsza gotowa.”**

Z paczki pojawia się mała iskra. Pracownik przekazuje przesyłkę kurierowi.

### Tekst ekranowy

> **Wszystko zaczęło się od kilku półek, małego magazynu i prostego pomysłu.**

Następnie:

> **Dobry sprzęt nie musi być nowy. Musi być sprawdzony.**

Po pierwszym bezpiecznym skoku rozpoczyna się epoka 1.

---

## EPOKA 1 — Pierwsza paczka i Kablowy Chaos

**Czas startowy:** 20 sekund  
**Akcje:** skok, zbieranie paczek  
**Wyzwanie:** Kablowy Chaos

### Otwarcie

Tytuł:

> **Początek**  
> **Mały magazyn, wielkie wyzwanie**

W tle przybywa zamówień, kończą się etykiety, dzwoni telefon, kurier przyjeżdża wcześniej, a ktoś szuka właściwej ładowarki.

### Rozgrywka

- pojedyncze, szeroko rozstawione przeszkody;
- paczki prowadzą po bezpiecznej trajektorii skoku;
- żadnych przeszkód górnych;
- pierwsze 5–8 sekund jest tutorialem.

### Kulminacja

Tytuł:

> **Wyzwanie: Kablowy Chaos**

Z kabli, ładowarek, taśmy i etykiet powstaje nieporadny stwór. Gracz przeskakuje dwie czytelne wiązki przewodów i zbiera trzy znaczniki porządku: etykietę, przegródkę i listę etapów.

Niepowodzenie nie blokuje sceny. Pominięty znacznik wraca przed końcem odcinka.

### Korytarz zaufania i transformacja

Kablowy Chaos rozplątuje się w opisaną instalację i uporządkowane półki.

Tekst:

> **Na początku nie mieliśmy dużo miejsca. Musieliśmy za to mieć coraz lepszy plan.**

Ściana magazynu odsuwa się. Pojawia się kolejny regał i drugi pracownik.

---

## EPOKA 2 — Drugie życie sprzętu

**Czas startowy:** 20 sekund  
**Akcje:** skok, debiut ślizgu  
**Wyzwanie:** Chmura Wątpliwości  
**Power-up:** Audyt jakości

### Otwarcie

Tytuł:

> **Drugie życie sprzętu**  
> **Zaufanie zaczyna się od sprawdzenia.**

Świat przechodzi do przestrzeni serwisowej. Na początku jest szary. Każde przygotowane urządzenie dodaje światła i koloru.

### Scena serwisowa

Pracownik otwiera używany laptop:

> **„On nie skończył swojej pracy. Potrzebuje tylko dobrego nowego początku.”**

Laptop uruchamia się. Iskra przechodzi przez ekran i wraca do pierwszej paczki.

### Rozgrywka

- bezpieczne wprowadzenie ślizgu;
- pierwsza przeszkoda górna jest poprzedzona linią paczek pod belką;
- pojawia się „Audyt jakości”;
- podświetlenie pokazuje, kiedy skoczyć i kiedy wykonać ślizg.

### Kulminacja

Tytuł:

> **Wyzwanie: Chmura Wątpliwości**

Nad trasą pojawia się chmura ze znaków zapytania. Krótkie etykiety:

> **Używany?**  
> **A jeśli przestanie działać?**  
> **Skąd wiadomo, co przeszedł?**

Gracz zbiera trzy dowody: test, gwarancję i znak jakości. Każdy dowód rozjaśnia część chmury. Pominięty dowód pojawia się ponownie.

### Korytarz zaufania i transformacja

Chmura zmienia się w jasne oznaczenie jakości.

Tekst:

> **Sprzęt może mieć przeszłość i jednocześnie świetną przyszłość.**

Następnie:

> **Drugie życie zaczyna się od pierwszego porządnego testu.**

---

## EPOKA 3 — Ludzie rosną razem ze sprzętem

**Czas startowy:** 45 sekund  
**Akcje:** skok, ślizg, zbieranie paczek  
**Wyzwanie:** Budżetożerca  
**Power-up:** Drugie życie sprzętu

Wszystkie historie są prawdziwe, lecz przedstawiane anonimowo. Nie używa się nazw firm, logotypów, portretów ani danych pozwalających rozpoznać klientów.

### Otwarcie

Tytuł:

> **Ludzie rosną razem ze sprzętem**

Tekst:

> **Za każdą paczką stoi czyjś plan.**

### Historia A — Pierwszy krok do kariery

**Czas orientacyjny:** 12 sekund

Kurier dostarcza laptop do małego pokoju. Na kartce widnieje:

> **Chcę pracować kreatywnie.**  
> **Budżet: ograniczony.**

W korytarzu zaufania pokój płynnie zmienia się w domowe studio, a następnie profesjonalne miejsce pracy. Na ścianie pojawia się portfolio.

Tekst:

> **Dobry start nie zawsze musi być nowy.**

> **Czasem jeden rozsądny zakup wystarcza, żeby zrobić pierwszy krok.**

### Historia B — Od 300 zł do 300 000 zł

**Czas orientacyjny:** 16 sekund

W małym lokalu przedsiębiorca mówi:

> **„Potrzebuję laptopa. Mam maksymalnie 300 zł.”**

Sprzedawca zaczyna szukać rozwiązania. Kurier dostarcza prosty laptop. Podczas biegu lokal zyskuje pierwszego pracownika, nowe biurka i większą przestrzeń. Stary laptop pozostaje na półce.

Na końcu dokument zamówienia pokazuje:

> **Budżet: 300 000 zł**

Tekst:

> **Zmienił się biznes. Zmienił się budżet. Zaufanie zostało.**

### Historia C — Zamówienie na próbę

**Czas orientacyjny:** 14 sekund

W nowoczesnym biurze podświetla się 10 ze 100 stanowisk:

> **Zaczęło się od testowych 10%.**

Kalendarz przechodzi przez siedem lat. Co roku przybywają kolejne urządzenia AMSO. Znak zapytania przy ofercie znika.

Tekst:

> **Siedem lat później sprzęt poleasingowy nadal jest ich pierwszym wyborem.**

### Kulminacja

Tytuł:

> **Wyzwanie: Budżetożerca**

Z rachunków, cen i czerwonych cyfr powstaje stwór. Mówi:

> **„Dobry sprzęt musi kosztować fortunę!”**

Gracz zbiera symbole trzech efektów: start kariery, rozwój firmy i oszczędności B2B. W tej sekwencji po raz pierwszy działa power-up „Drugie życie sprzętu”.

### Korytarz zaufania i transformacja

Budżetożerca kurczy się do małej skarbonki.

Tekst:

> **Rozsądny wybór nie oznacza rezygnacji z jakości.**

Trzy historie zmieniają się w trzy punkty światła. Dołączają do nich setki kolejnych.

---

## EPOKA 4 — Skala potrzebuje systemu

**Czas startowy:** 35 sekund  
**Akcje:** skok i ślizg w łączonych, uczciwych sekwencjach  
**Wyzwanie:** Logistyczna Hydra  
**Power-up:** Gwarancja 48 miesięcy

### Otwarcie i rozwój magazynu

Tytuł:

> **Skala potrzebuje systemu**

Wracamy do magazynu z prologu. Podczas ruchu:

1. przybywają półki;
2. dochodzą pracownicy;
3. przestrzeń rozszerza się;
4. pojawiają się strefy testów, pakowania i wysyłki;
5. wjeżdża wózek widłowy;
6. otwierają się kolejne bramy.

Licznik w świecie dochodzi do:

> **3 000 m² magazynu**

Następnie:

> **Niemal 400 zamówień dziennie**

### Liczby, które ożywają

Liczby nie są czytane przez narratora. Sekwencja jest wizualna i nie wymaga zapamiętania wszystkich wartości.

#### Wieża smartfonów

> **Około 240 metrów**  
> **Wyżej niż Pałac Kultury i Nauki**

Pracownik patrzy w górę i zakłada kask. Wieża bezpiecznie składa się do pudełek.

#### Pięć Boeingów

> **Około 400 000 kg komputerów PC rocznie**  
> **Tyle co pięć załadowanych Boeingów 737**

#### Rzeka urządzeń

W tle, bez osobnych pauz głosowych, pojawiają się:

- około 41 tys. komputerów PC;
- około 76 tys. notebooków;
- około 40 tys. monitorów;
- około 28 tys. telefonów.

Zamknięcie:

> **Każde urządzenie ma swój numer. Dla klienta każde z nich ma jednak własną historię.**

### Kulminacja

Tytuł:

> **Wyzwanie: Logistyczna Hydra**

Hydra składa się z bram, etykiet i tras. Jej głowy pokazują: pomylony produkt, błędny adres, brak etykiety, opóźnienie i niewłaściwe zabezpieczenie.

Gracz przechodzi krótką sekwencję skoku i ślizgu, zbierając skaner, etykietę i mapę trasy. „Gwarancja 48 miesięcy” jest dostępna przed najtrudniejszym układem.

### Korytarz zaufania i transformacja

Głowy hydry stają się elementami sprawnego sortowania.

Tekst:

> **Większy magazyn nie wystarczył. Potrzebowaliśmy coraz lepszych procesów i coraz większego zespołu.**

Pracownik z prologu spogląda z antresoli:

> **„Trochę się tu zmieniło.”**

---

## EPOKA 5 — Droga do Miliona

**Czas startowy:** 45 sekund  
**Akcje:** skok, ślizg, osiem symboli historii  
**Finał:** Fala Miliona

### Otwarcie

Tytuł:

> **Droga do Miliona**

Świat łączy miejsca z wcześniejszych epok. W tle wracają:

- graficzka w profesjonalnym studio;
- przedsiębiorca w większym biurze ze starym laptopem na półce;
- firma korzystająca ze sprzętu AMSO;
- serwisant, magazynier, sprzedawca i kurierzy.

Krótkie kwestie:

> **„Od tego zaczynałam.”**  
> **„Ten sprzęt pomógł nam ruszyć.”**  
> **„Zamówiliśmy na próbę. Zostaliśmy na lata.”**  
> **„Sprawdzone. Można pakować.”**  
> **„Kolejna gotowa.”**

Licznik pokazuje:

> **999 970 → 999 980 → 999 990 → 999 999**

### Finał: Fala Miliona

Tytuł:

> **Finał: Fala Miliona**

Fala powstaje z pudełek, urządzeń, tras, etykiet, znaków zapytania i wiadomości klientów. W środku pozostaje przestrzeń w kształcie jednej paczki.

Finał ma kilka faz wykorzystujących poznane akcje i wszystkie trzy poznane power-upy:

1. **Porządek** — skok przez kable; Kablowy Chaos układa je w sieć.
2. **Jakość** — gracz otrzymuje „Audyt jakości”, widzi bezpieczną trasę i wykonuje ślizg pod chmurą; Chmura Wątpliwości pokazuje znak jakości.
3. **Rozsądny wybór** — „Drugie życie sprzętu” podwaja wartość serii paczek; skarbonka wzmacnia wynik.
4. **Logistyka** — przed trzema zapowiedzianymi falami gracz otrzymuje „Gwarancję 48 miesięcy”; Hydra sortuje przesyłki po wykonaniu skoku i ślizgu.

W trakcie finału gracz zbiera osiem symboli:

1. pierwszą etykietę;
2. znak testu jakości;
3. symbol gwarancji;
4. pierwszy projekt graficzki;
5. wizytówkę rozwiniętej firmy;
6. symbol testowych 10%;
7. skaner magazynowy;
8. fragment mapy dostaw.

Pominięty symbol wraca w bezpiecznej trajektorii. Nie można zablokować finału.

### Milionowa paczka

Licznik zatrzymuje się na `999 999`. Świat na moment cichnie. Osiem symboli trafia do otwartego pudełka. Na końcu pierwsza paczka przekazuje swoją etykietę i największą iskrę.

Etykieta:

> **ZAMÓWIENIE NR 1 000 000**

Paczka rusza w drogę. Licznik zmienia się na:

> **1 000 000**

### Zakończenie

Kamera pokazuje magazyn, miasta, mapę Polski i tysiące punktów światła. Punkty układają się w liczbę `1 000 000`.

Plansze końcowe:

> **Milion zamówień to nie tylko liczba.**

> **To milion momentów, w których ktoś potrzebował sprzętu do pracy, nauki, firmy albo realizacji własnego planu.**

> **Pierwszą paczkę wysłaliśmy sami.**

> **Do miliona dotarliśmy razem.**

Finał:

> **DZIĘKUJEMY ZA 1 000 000 ZAMÓWIEŃ**

Podpis:

> **AMSO. Sprzęt z przeszłością. Na przyszłość.**

---

# 11. Wynik fabuły i odblokowanie wyzwania

Po planszy podziękowania pojawia się wynik. Nie stosuje się gorszych zakończeń.

Nagłówek:

> **Twoja Droga do Miliona**

Wartości:

- **Dostarczone paczki:** `{packages}`
- **Wynik:** `{score}`
- **Najlepsza seria:** `×{combo}`

Główna akcja:

> **Gramy dalej — tryb wyzwania**

Opis:

> **Biegnij do pierwszego niezabezpieczonego zderzenia i ustanów rekord.**

Drugorzędna akcja:

> **Poznaj pełną historię AMSO**

Neutralna akcja:

> **Wróć na stronę kampanii**

Po pełnej, pięciosekundowej ekspozycji planszy `final.thanks` zapisuje się `storyCompleted: true`, emituje `story_completed` i dopiero wtedy odblokowuje się tryb wyzwania. Samo uruchomienie finału, etykiety milionowego zamówienia lub wcześniejszej planszy nie odblokowuje trybu.

---

# 12. Tryb wyzwania — szczegółowe zasady

## 12.1. Świat

Tryb nie odtwarza epok historycznych. Pokazuje współczesny magazyn, serwis, trasy dostaw i miasto jako jeden nieskończony świat po milionowym zamówieniu.

Powracające elementy są dekoracją i nagrodą dla osób znających historię:

- uporządkowane kable;
- znak jakości;
- skarbonka;
- sprawna infrastruktura hydry;
- kubek z pierwszego magazynu;
- pierwsza etykieta.

## 12.2. Krzywa trudności

- start jest łagodny, ale szybszy niż epoka 1 fabuły;
- prędkość rośnie do maksymalnej wartości potwierdzonej na realnych telefonach;
- po osiągnięciu limitu rośnie złożoność, nie szybkość;
- każda sekwencja spełnia minimalny czas reakcji;
- nie wolno generować dwóch przeszkód tworzących nieuniknioną kolizję;
- po trudnej sekwencji następuje krótki odcinek oddechu;
- paczka ani power-up nie mogą prowadzić w wymuszoną kolizję.

## 12.3. Logistyczne fale

Co około 45–60 sekund pojawia się zapowiedziana fala:

> **Uwaga: fala logistyczna**

Fala:

- składa się z trzech czytelnych kombinacji skoku i ślizgu;
- nie używa postaci bossów z fabuły;
- po przejściu daje duży bonus i krótki strumień złotych paczek;
- w kolejnych cyklach ma trudniejsze, ale nadal możliwe wzory;
- kończy bieg przy niezabezpieczonej kolizji.

## 12.4. Game Over

Nagłówek:

> **Koniec próby**

Wartości:

- **Dostarczone paczki:** `{packages}`
- **Wynik:** `{score}`
- **Rekord:** `{bestScore}`
- **Przebyta droga:** `{distance}`
- **Gwarancja uratowała bieg:** `{warrantySaves}`

Główna akcja:

> **Spróbuj jeszcze raz**

Drugorzędna akcja:

> **Udostępnij wynik**

Pozostałe:

- **Przejdź historię ponownie**
- **Wróć na stronę kampanii**

---

# 13. Udostępnianie wyniku

Udostępnianie dotyczy wyłącznie trybu wyzwania. Nie publikuje niczego automatycznie i nie zbiera danych osobowych.

## 13.1. Karta wyniku

Karta powstaje lokalnie w przeglądarce. Copy:

> **AMSO — Droga do Miliona**  
> **Mój wynik: {score}**  
> **Dostarczone paczki: {packages}**  
> **Teraz Twoja kolej.**

Tekst publikacji:

> **Sprawdź, jak daleko dojdziesz w Drodze do Miliona.**

Karta zawiera kanoniczny adres strony gry, nie tymczasowy link do konkretnej sesji.

## 13.2. Facebook

- na mobile: systemowe menu udostępniania, jeśli pozwala przekazać kartę i URL;
- na desktop: przycisk udostępnienia kanonicznego URL na Facebooku;
- jeśli platforma nie przyjmie dynamicznej grafiki, wynik pozostaje na zapisanej karcie, a udostępniany link korzysta ze standardowego Open Graph strony gry.

## 13.3. Instagram

- na mobile: przekazanie karty przez systemowe menu, jeśli urządzenie to obsługuje;
- fallback: pobranie/zapisanie gotowej karty i krótka instrukcja dodania jej do relacji lub posta;
- nie obiecujemy bezpośredniej publikacji z desktopowej strony internetowej.

---

# 14. Ekrany wejścia i komunikaty systemowe

## 14.1. Landing gry

Nagłówek:

> **AMSO — Droga do Miliona**

Lead:

> **Jedna paczka rozpoczęła historię. Przebiegnij z nami drogę do zamówienia nr 1 000 000.**

Główna akcja dla nowego gracza:

> **Rozpocznij historię**

Informacja:

> **Około 3 minut · skok i ślizg · historia ma gwarantowany finał**

Gra ładuje krytyczne assety dopiero po wyrażeniu intencji użytkownika.

## 14.2. Orientacja i fullscreen

Przed pierwszym startem na telefonie:

> **Chcesz zobaczyć szerszy kadr?**  
> **Obróć telefon i włącz pełny ekran. Możesz też grać pionowo.**

Akcje:

- **Włącz pełny ekran**
- **Zostań w pionie**

Propozycja pojawia się raz i nie wraca w środku sesji. Obrót urządzenia:

- nie resetuje postępu;
- automatycznie włącza bezpieczną pauzę na czas przebudowy;
- zachowuje aktywną epokę i zebrane obiekty.

## 14.3. Pauza

> **Gra wstrzymana**  
> **Twój postęp jest bezpieczny.**

Akcje:

- **Wznów**
- **Wróć do menu**

Utrata widoczności karty lub focusu automatycznie pauzuje grę. Wznowienie wymaga świadomego kliknięcia lub tapnięcia.

## 14.4. Checkpoint

Po ponownym wejściu z niedokończoną historią:

> **Wrócić na Drogę do Miliona?**

Akcje:

- **Kontynuuj od: {epochName}**
- **Zacznij od początku**

Gra wraca na początek zapisanej epoki i powtarza jej krótkie otwarcie. Dla checkpointu `finale` etykieta brzmi **„Kontynuuj od: Zakończenie”**, a gra powtarza całą sekwencję plansz końcowych.

## 14.5. Ładowanie

> **Przygotowujemy pierwszą paczkę…**

Wskaźnik pokazuje rzeczywisty stan gotowości krytycznych assetów, nie sztuczny procent.

## 14.6. Błąd ładowania

> **Nie udało się przygotować gry.**  
> **Sprawdź połączenie i spróbuj ponownie.**

Akcje:

- **Spróbuj ponownie**
- **Wróć na stronę kampanii**

---

# 15. Checkpointy i localStorage

Minimalny profil lokalny przechowuje:

- wersję schematu;
- informację o ukończeniu historii;
- jeden punkt wznowienia `storyCheckpoint`;
- najlepszy wynik trybu wyzwania;
- największą liczbę paczek w trybie wyzwania;
- preferencję dźwięku;
- informację, czy pokazano propozycję fullscreen.

Zasady:

- `storyCheckpoint` przyjmuje jedną z wartości: `prologue`, `epoch_1`…`epoch_5`, `finale` albo `completed`;
- przy wejściu do epoki zapisuje się odpowiadającą jej wartość `epoch_N`;
- po ukończeniu epoki 1–4 zapisuje się początek następnej epoki;
- po ukończeniu epoki 5, przed planszami końcowymi, zapisuje się `finale`;
- wznowienie `epoch_N` uruchamia od początku wskazaną epokę, a `finale` powtarza całą sekwencję zakończenia;
- po pełnej ekspozycji `final.thanks` zapisuje się `completed` oraz `storyCompleted: true`;
- nie zapisujemy dokładnej pozycji w trakcie epoki;
- `storyCompleted` jest jedynym źródłem prawdy o odblokowaniu trybu wyzwania; nie przechowujemy osobnej flagi unlock;
- brak localStorage nie może uniemożliwić jednorazowego przejścia historii;
- nie ma synchronizacji między urządzeniami;
- nie ma konta ani backendu.

---

# 16. Audio i opcjonalny voice-over

## 16.1. Zakres podstawowy

- lekka muzyka;
- krótkie efekty skoku, ślizgu, paczki, power-upu, kolizji i transformacji;
- sygnał wejścia do korytarza zaufania;
- sygnał powrotu sterowania;
- widoczna kontrola mute;
- zapamiętanie preferencji lokalnie;
- pełna zrozumiałość gry bez dźwięku.

Audio rozpoczyna się dopiero po działaniu użytkownika.

## 16.2. Voice-over — stretch goal

Voice-over nie wchodzi do kryteriów gotowości pierwszej wersji. Architektura ma jednak umożliwiać jego późniejsze dodanie:

- każda kwestia ma stabilny identyfikator;
- sceny mają konfigurowalne punkty synchronizacji;
- brak ścieżki głosowej nie blokuje przejścia;
- przyszły narrator opowiada historię, lecz nie czyta suchych ciągów liczb;
- wszystkie istotne treści nadal pozostają widoczne tekstowo.

Jeśli voice-over powstanie, rekomendowany jest jeden ciepły polski narrator i kilka krótkich kwestii postaci zamiast pełnych dialogów.

---

# 17. Język i zarządzanie treścią

## 17.1. Język startowy

- produkcja startuje wyłącznie po polsku;
- nie pokazujemy pustego przełącznika języka;
- struktura danych używa kluczy lokalizacyjnych, aby później można było dodać pełne tłumaczenia.

## 17.2. Konfiguracja treści

Poza kodem powinny znajdować się:

- wszystkie teksty ekranowe;
- etykiety CTA;
- nazwy epok i wyzwań;
- czasy ekspozycji;
- fakty i liczby;
- czasy przejść;
- parametry trudności;
- dostępność voice-over dla konkretnej kwestii.

Niniejszy dokument jest redakcyjnym źródłem copy. Zmiany w konfiguracji produkcyjnej muszą pozostać z nim zgodne.

## 17.3. Fakty

Historie i liczby użyte w scenariuszu zostały potwierdzone przez marketing jako prawdziwe. W grze zachowujemy anonimowość klientów i nie dodajemy nazw, logotypów ani wizerunków bez osobnej zgody.

---

# 18. Art direction i assety

## 18.1. Kierunek

- stylizowana grafika 2D;
- wyraźne sylwetki i paleta AMSO;
- trzy lub cztery warstwy paralaksy;
- modułowe elementy scen zamiast pełnych filmów;
- transformacje przez dodawanie, porządkowanie i wymianę elementów;
- postacie jako charakterystyczne, nieportretowe archetypy;
- tekst renderowany przez UI, nie wypalony w grafikach.

## 18.2. Minimalna lista assetów

### Wspólne

- kurier: bieg, skok, ślizg, kolizja, bezpieczne odzyskanie;
- pierwsza paczka i ręczna etykieta;
- iskra: mała, rosnąca, osłabiona, sfera korytarza;
- cztery kategorie paczek;
- trzy power-upy;
- osiem symboli finałowych;
- efekty serii, ochrony, zebrania i transformacji.

### Prolog i epoka 1

- mały sklep/magazyn w warstwach;
- pracownik i zestaw czynności;
- kable, ładowarki, taśma, etykiety;
- Kablowy Chaos i forma uporządkowanej instalacji.

### Epoka 2

- serwis w wersji szarej i rozświetlonej;
- laptop przed i po przygotowaniu;
- Chmura Wątpliwości;
- symbole testu, gwarancji i jakości.

### Epoka 3

- pokój/studio graficzki w trzech stanach;
- lokal przedsiębiorcy w trzech stanach;
- stare urządzenie pozostające na półce;
- biuro B2B, kalendarz i wizualizacja 10%;
- Budżetożerca i skarbonka.

### Epoka 4

- magazyn w kilku skalach;
- regały, bramy, strefy, wózek i zespół;
- wieża smartfonów i sylwetka Pałacu Kultury;
- pięć samolotów jako lekka ilustracja porównawcza;
- rzeka kategorii produktów;
- Logistyczna Hydra i infrastruktura sortowania.

### Epoka 5

- płynne połączenie wcześniejszych miejsc;
- powracające postacie w rozwiniętych stanach;
- Fala Miliona w kilku fazach;
- otwarta i zamknięta milionowa paczka;
- mapa Polski, punkty światła i finałowa liczba.

### Tryb wyzwania i share

- modułowy współczesny świat bez widocznego końca;
- warianty logistycznych fal;
- złote paczki nagrody;
- szablon karty Facebook/Instagram.

---

# 19. Responsywność i fullscreen

## 19.1. Wspierane układy

- portrait jest pełnoprawnym, kompletnym trybem;
- landscape ma szerszy cinematic layout;
- fullscreen jest opcjonalny;
- gra nie wymusza obrotu urządzenia;
- orientacja nie zmienia zawartości historii.

## 19.2. Portrait

- HUD u góry;
- trasa w środkowej części;
- tekst w stabilnej dolnej strefie;
- kluczowe postacie i akcje w centralnej safe zone;
- boczne dekoracje mogą być kadrowane;
- sceny liczb mają osobną pionową kompozycję.

## 19.3. Minimalna szerokość

Pełne wsparcie zaczyna się od **360 CSS px**. Obowiązkowe testy:

- 360 px;
- 375 px;
- 390 px;
- 412 lub 430 px;
- reprezentatywny landscape mobile;
- desktop.

Poniżej 360 px interfejs nie może się rozsypać. Pokazuje uproszczony komunikat:

> **Potrzebujemy trochę więcej miejsca. Obróć urządzenie, żeby rozpocząć grę.**

---

# 20. Ładowanie assetów

Assety są dzielone na paczki per epoka.

Przed startem trzeba załadować:

- prolog;
- epokę 1;
- kuriera i wspólne animacje;
- podstawowe UI;
- pierwsze efekty audio.

Pozostałe epoki ładują się w tle. Zasady:

- kolejna epoka nie zaczyna się bez krytycznych assetów;
- ewentualne oczekiwanie jest maskowane istniejącym korytarzem zaufania;
- gra nie pokazuje fałszywego procentu;
- assety po pierwszym przejściu mogą korzystać ze standardowego cache przeglądarki;
- awaria pojedynczego niekrytycznego efektu nie może zatrzymać historii;
- awaria krytycznego assetu prowadzi do bezpiecznego ekranu ponowienia.

---

# 21. Minimalna analityka

Nie implementujemy rozbudowanego śledzenia zachowań. Za zgodą analityczną wysyłamy tylko:

## `game_started`

Parametr:

- `mode`: `story` albo `challenge`.

## `story_completed`

Bez wyniku i danych osobowych. Pozwala obliczyć stosunek zakończeń do uruchomień historii.

## `game_load_failed`

Parametr:

- bezpieczny kod błędu technicznego bez URL-i, treści i danych użytkownika.

Nie wysyłamy:

- pojedynczych paczek;
- kolizji;
- epok;
- power-upów;
- checkpointów;
- wyników udostępnianych kart;
- osobnego identyfikatora gracza.

Raport pokazuje liczbę uruchomień, nie gwarantowaną liczbę unikalnych osób.

---

# 22. Dedykowany landing zamiast runtime'u modalnego

Kanonicznym miejscem gry jest osobna strona. Wszystkie wejścia prowadzą do niej:

- CTA na promocyjnym landing page;
- jubileuszowy logotyp;
- link udostępniany w social media;
- powrót do gry z kampanii.

Zasady:

- gra nie otwiera się automatycznie;
- pełne assety ładują się po intencji użytkownika;
- nie utrzymujemy równolegle pełnej wersji modalnej w sklepie;
- dotychczasowy modal może służyć wyłącznie jako techniczny fallback w okresie migracji;
- landing kampanii jest właściwym miejscem dla promocji handlowej.

---

# 23. Poza zakresem v3

- backend i konta graczy;
- synchronizacja między urządzeniami;
- globalny ranking;
- kod rabatowy w grze;
- bezpośrednie publikowanie na kontach social bez zgody użytkownika;
- pełna wersja modalna równoległa do dedykowanej strony;
- dodatkowe języki w pierwszym wydaniu;
- obowiązkowy voice-over;
- pomijanie scen fabularnych;
- różne lub negatywne zakończenia historii;
- nieskończone zwiększanie prędkości;
- trzecia podstawowa akcja sterowania.

---

# 24. Wpływ na istniejące demo

Istniejący kod dostarcza wartościowe elementy do ponownego użycia:

- Canvas i pętlę gry;
- skok i ślizg;
- przeszkody naziemne i górne;
- deterministyczne spawnowanie;
- pięć konfigurowalnych epok;
- power-upy;
- bazowy system bossa;
- localStorage;
- obsługę pauzy i focusu.

V3 wymaga jednak zmiany lub rozbudowy:

- jednego trybu na osobne `story` i `challenge` (wartości techniczne odpowiadające fabule i Próbie Miliona);
- kolizji kończącej bieg na karę i odzyskanie w fabule;
- odblokowania trybu wyzwania po finale;
- checkpointów epok;
- korytarza zaufania i autopilota;
- czterech mikro-kulminacji oraz wielofazowej Fali Miliona;
- scen klientowskich i transformacji tła;
- systemu bundli assetowych;
- dedykowanego page shell zamiast głównego modala;
- minimalizacji analityki do trzech zdarzeń;
- nowego ekranu wyniku i share card.

Nie należy przepisywać działającej fizyki bez konkretnej potrzeby. Najpierw trzeba zachować i rozszerzyć stabilne moduły sterowania, kolizji, viewportu oraz deterministycznego spawnowania.

---

# 25. Kryteria odbioru produkcyjnego

## 25.1. Historia

- [ ] Fabułę można zawsze ukończyć niezależnie od liczby kolizji.
- [ ] Wszystkie trzy historie klientów są obecne i zrozumiałe bez dodatkowego kontekstu.
- [ ] Czterej wcześniejsi przeciwnicy zmieniają się w pozytywne kompetencje.
- [ ] Fala Miliona wykorzystuje osiem symboli i zawsze kończy się zamówieniem nr 1 000 000.
- [ ] Nie ma gorszego zakończenia.
- [ ] Gracz nie może pominąć scen w trybie fabularnym.

## 25.2. Sterowanie i uczciwość

- [ ] Skok i ślizg działają na keyboardzie i touchu.
- [ ] Samouczek nie może doprowadzić do kolizji.
- [ ] Kolizja fabularna nie zmienia trajektorii skoku ani prędkości świata.
- [ ] Po kolizji nie jest możliwa automatyczna druga kolizja.
- [ ] Wszystkie sekwencje trybu wyzwania są mechanicznie przechodnie.
- [ ] Maksymalna prędkość została potwierdzona na realnych telefonach.
- [ ] Power-up nigdy nie prowadzi do wymuszonej kolizji.

## 25.3. Postęp i tryby

- [ ] Checkpoint przywraca początek właściwej epoki.
- [ ] Obrót i fullscreen nie resetują postępu.
- [ ] Tryb wyzwania odblokowuje się wyłącznie po pełnej ekspozycji ostatniej planszy finału.
- [ ] Tryb wyzwania pozostaje dostępny po ponownym uruchomieniu przeglądarki.
- [ ] Brak localStorage nie blokuje jednorazowej historii.

## 25.4. Treść i dostępność

- [ ] Polskie copy odpowiada treści tego dokumentu.
- [ ] Tekst jest czytelny przy 360 CSS px.
- [ ] Wszystkie ważne informacje są zrozumiałe bez audio.
- [ ] Mute działa i zapamiętuje preferencję.
- [ ] `prefers-reduced-motion` ogranicza ruch bez utraty informacji.
- [ ] Pauza po utracie focusu wymaga świadomego wznowienia.

## 25.5. Responsywność i przeglądarki

- [ ] Przetestowano 360, 375, 390, 412/430 px, landscape mobile i desktop.
- [ ] Portrait zawiera pełną historię.
- [ ] Fullscreen jest opcjonalny i ma działający fallback viewportowy.
- [ ] Układ poniżej 360 px pokazuje kontrolowany komunikat zamiast uszkodzonej gry.
- [ ] Testy wykonano w Safari na iOS (bieżąca i poprzednia główna wersja), Chrome na Androidzie oraz bieżących Chrome, Edge, Firefox i Safari na desktopie.

## 25.6. Share i prywatność

- [ ] Karta wyniku powstaje lokalnie.
- [ ] Facebook i Instagram mają działającą ścieżkę podstawową oraz fallback.
- [ ] Share nie zawiera danych osobowych.
- [ ] Gra wysyła wyłącznie trzy zatwierdzone zdarzenia analityczne i respektuje consent.

## 25.7. Tuning i UAT

- [ ] Pełna historia mieści się po testach w zatwierdzonym przedziale 150–180 sekund.
- [ ] Test czytelności obejmuje co najmniej 8 osób, które nie znały scenariusza; co najmniej 7 z 8 potwierdza, że zdążyło przeczytać każdą automatyczną planszę.
- [ ] Po sesji co najmniej 7 z 8 osób bez podpowiedzi poprawnie opisuje sens każdej z trzech historii klientów.
- [ ] Wszystkie osoby w teście kończą fabułę i widzą pełną planszę podziękowania, niezależnie od liczby kolizji.
- [ ] Marketing zatwierdził finalne copy i reprezentację liczb.
- [ ] QA potwierdziło brak niemożliwych sekwencji w trybie wyzwania dla co najmniej 100 deterministycznych seedów na każdym profilu trudności.

---

# 26. Elementy strojenia po playtestach

Poniższe parametry pozostają celowo otwarte do testów i nie są luką w specyfikacji:

- dokładna długość każdej epoki w ramach 150–180 sekund;
- czas ekspozycji poszczególnych plansz;
- maksymalna prędkość trybu wyzwania;
- minimalny czas reakcji;
- częstotliwość logistycznych fal;
- czas działania power-upów;
- maksymalny mnożnik serii;
- dokładny próg adaptacyjnego ułatwienia;
- szczegółowa formuła wyniku;
- budżety wagowe assetów po przygotowaniu pierwszego vertical slice.

Każdy z tych parametrów musi być konfigurowalny. Zmiana nie może naruszyć zasad: gwarantowanego finału fabuły, uczciwości trybu wyzwania, czytelności tekstu ani bezpieczeństwa po kolizji.

---

# 27. Jednozdaniowa definicja wersji v3

> **Najpierw każdy gracz bezpiecznie przechodzi prawdziwą historię od pierwszej paczki do miliona, a potem może sprawdzić swoje umiejętności w bezkompromisowej Próbie Miliona.**
