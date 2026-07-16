# Droga do Miliona v8 — spójny obraz, gwarancja i sterowanie jedną ręką

Status: ready-for-agent

## Problem Statement

Aktualna warstwa wizualna rozgrywki dodaje do przeszkód słowa, plakietki,
piktogramy i symbole, które zamiast wyjaśniać obiekty przeciążają pole gry.
Gracz powinien rozpoznawać kartony, palety, wózki i elementy przenośnika po ich
formie, a nie odczytywać napisy podczas szybkiego biegu.

Cykliczny paralaks tła nie tworzy jeszcze ciągłego świata. Obraz jest
dopasowywany tak, aby cały mieścił się w kontenerze, a jego naprzemienne kopie
są odbijane poziomo. Przy innych proporcjach ekranu lub w chwili zawijania może
pojawić się biała szczelina, czasem dokładnie pośrodku pola gry. Również zmiana
świata przez boczne rozsunięcie dwóch warstw może odsłonić jasną podstawę.
Podczas zatrzymania na historię obraz może pozostać na przypadkowym fragmencie
lub na styku kopii zamiast utworzyć spokojny, centralny kadr pod opowieść.

Stan ochrony kuriera jest niespójny. Na początku gracz widzi pomarańczowy,
okrągły znak niewrażliwości, a później podobną obietnicę komunikuje fioletowa,
przerywana ramka. Dwie formy dla tego samego skutku utrudniają zrozumienie,
kiedy następne zderzenie rzeczywiście zostanie pochłonięte. Dodatkowo widoczna
terminologia miesza nazwę `OCHRONA` z właściwą nazwą bonusu `GWARANCJA 48 M`.

Animacja kończyn kuriera jest bezpośrednio mnożona przez prędkość świata i nie
ma użytecznego górnego ograniczenia. Przy większym tempie postać zaczyna
wyglądać jakby wibrowała, zamiast biec szybciej. Sterowanie także nie daje dwóch
równorzędnych, jednoręcznych układów klawiatury. Gracz powinien móc korzystać z
pary `W/S` albo `↑/↓`, zachowując dotychczasową Spację, klik i dotyk. Wejścia z
biegu nie mogą przypadkowo przechodzić na kartę historii, ale sama przyciskowa
kontynuacja historii nie powinna być sztucznie blokowana czasem.

## Solution

Pole gry zostanie oczyszczone z całego nakładanego na przeszkody języka
opisowego. Przeszkody pozostaną konkretnymi, rozpoznawalnymi przedmiotami
magazynowymi z konstrukcyjnymi detalami. Etykiety na zbieranych paczkach
pozostaną, ponieważ identyfikują nagrodę, a nie przeszkodę.

Tło zawsze wypełni cały kadr z dopuszczalnym niewielkim przycięciem obrzeży.
Cykliczny ruch użyje kolejnych kopii w tej samej orientacji, bez lustrzanego
odbicia. Kopie będą zachodzić na siebie i zostaną połączone krótką strefą
miękkiego mieszania, aby usunąć zarówno białą szczelinę, jak i ostry skok
krawędzi. Nowy świat będzie zawsze leżał pod starym i pojawi się przez crossfade,
bez bocznego rozsuwania warstw. Każdy etap rozpocznie się od pełnego,
wycentrowanego kadru. Gdy rozgrywka przechodzi do historii lub pauzy narracyjnej,
paralaks płynnie dojdzie do zdefiniowanej centralnej kompozycji, tak aby styk
kopii nigdy nie znajdował się w centrum pod tekstem.

Wszystkie stany, w których gra naprawdę pochłonie następne zderzenie, otrzymają
jeden wspólny znak: pomarańczowy, ciągły i lekko pulsujący shield otaczający
kuriera. Znak będzie podążał za postacią i dopasowywał się do biegu, skoku oraz
ślizgu. Krótki bezpieczny start użyje tego samego języka wizualnego bez wpisu
bonusu w HUD. Zebrana `GWARANCJA 48 M` pokaże ten sam shield oraz
`GWARANCJA 48 M ×1` w HUD. Po pochłonięciu zderzenia shield krótko rozbłyśnie,
pęknie i zniknie. Fioletowa, przerywana ramka oraz wszystkie widoczne nazwy
`OCHRONA` zostaną usunięte.

Cykl biegu kuriera pozostanie powiązany z prędkością świata, lecz będzie płynnie
ograniczony do około 2–4 pełnych cykli kroku na sekundę. Skok i ślizg zachowają
odrębne, stabilne pozy. Sterowanie obsłuży skok przez `W`, `↑`, Spację, klik i
tap, a ślizg przez `S` i `↓`. Strzałki nie będą przewijać strony podczas
aktywnej gry. Klawisze trzymane lub powtarzane jeszcze w biegu nie przejdą na
kartę historii. Przycisk `Dalej` będzie dostępny natychmiast, a nowe, świadome
naciśnięcie Spacji po pojawieniu się karty również będzie mogło ją kontynuować.

## User Stories

1. Jako gracz chcę rozpoznawać przeszkody po ich wyglądzie, abym nie musiał czytać podczas biegu.
2. Jako gracz chcę widzieć konkretne kartony, palety, wózki i elementy przenośnika, abym rozumiał świat magazynu.
3. Jako gracz chcę, aby słowa zniknęły z przeszkód, abym skupił się na wymaganej akcji.
4. Jako gracz chcę, aby plakietki zniknęły z przeszkód, abym nie mylił ich z nagrodami.
5. Jako gracz chcę, aby piktogramy i symbole zniknęły z przeszkód, abym nie interpretował abstrakcyjnych znaków w ruchu.
6. Jako gracz chcę zachować konstrukcyjne detale przedmiotów, abym nadal rozróżniał ich rodzaje.
7. Jako gracz chcę zachować etykiety na zbieranych paczkach, abym odróżniał nagrody od zagrożeń.
8. Jako gracz chcę, aby tło zawsze wypełniało pole gry, abym nie widział białych marginesów.
9. Jako gracz chcę, aby niewielkie przycięcie obrzeży zastąpiło puste pole, abym widział pełny świat na każdym ekranie.
10. Jako gracz chcę widzieć kopie tła w tej samej orientacji, abym nie zauważał lustrzanego powtarzania sceny.
11. Jako gracz chcę, aby kopie tła zachodziły na siebie, abym nie widział subpikselowej szczeliny.
12. Jako gracz chcę, aby krawędzie kopii miękko się mieszały, abym nie widział ostrego uskoku ilustracji.
13. Jako gracz chcę, aby cykliczne tło płynnie poruszało się w lewo, abym odczuwał ciągłą podróż.
14. Jako gracz chcę, aby kolejny świat przenikał przez poprzedni, abym nie widział odsłoniętej podstawy sceny.
15. Jako gracz chcę, aby światy nie rozsuwały się na boki, abym nie widział białej szczeliny podczas przejścia.
16. Jako gracz chcę rozpoczynać etap od pełnego obrazu, abym nie zaczynał na styku dwóch kopii.
17. Jako czytelnik historii chcę widzieć wycentrowany kadr, abym rozumiał ilustrację pod tekstem.
18. Jako czytelnik historii chcę, aby tło płynnie dochodziło do kompozycji pauzy, abym nie widział nagłego skoku.
19. Jako czytelnik historii chcę, aby styk kopii nie zatrzymywał się pośrodku, abym nie widział sztucznego podziału sceny.
20. Jako gracz wracający do biegu chcę zachować ciągłość paralaksy, abym nie odbierał powrotu jako resetu świata.
21. Jako użytkownik ekranu od 390 px chcę tła bez szczelin, abym otrzymał tę samą jakość co na desktopie.
22. Jako użytkownik szerokiego ekranu chcę tła bez pustych pasów, abym otrzymał spójny kadr w kontenerze witryny.
23. Jako użytkownik Safari, Chrome, Edge lub Opery chcę zobaczyć tę samą kompozycję, abym nie zależał od sposobu zaokrąglania pikseli w przeglądarce.
24. Jako gracz chcę rozpoznawać realną niewrażliwość po jednym znaku, abym wiedział, czy zderzenie zostanie pochłonięte.
25. Jako gracz chcę widzieć pomarańczowy shield podczas bezpiecznego startu, abym rozumiał chwilowy brak zagrożenia.
26. Jako gracz chcę, aby startowy shield nie udawał zebranego bonusu, abym nie oczekiwał nieposiadanej Gwarancji.
27. Jako gracz chcę zobaczyć ten sam pomarańczowy shield po zebraniu Gwarancji, abym nie uczył się drugiego symbolu ochrony.
28. Jako gracz chcę widzieć `GWARANCJA 48 M ×1` w HUD, abym znał nazwę i liczbę dostępnych użyć.
29. Jako gracz chcę, aby shield był widoczny tylko przy realnym pochłonięciu następnego zderzenia, abym ufał informacji wizualnej.
30. Jako gracz chcę, aby shield podążał za kurierem podczas biegu, abym łączył go z postacią.
31. Jako gracz chcę, aby shield podążał za kurierem podczas skoku, abym nie widział odłączonego efektu.
32. Jako gracz chcę, aby shield stawał się niższym owalem podczas ślizgu, abym nadal widział chronioną sylwetkę.
33. Jako gracz chcę, aby shield nie obejmował paczki obok kuriera, abym nie mylił chronionego obiektu.
34. Jako gracz chcę zobaczyć rozbłysk i pęknięcie Gwarancji po kolizji, abym rozumiał zużycie jednego ładunku.
35. Jako gracz chcę, aby zużyty shield zniknął, abym nie oczekiwał kolejnego ratunku.
36. Jako gracz chcę, aby fioletowa przerywana ramka zniknęła, abym nie widział sprzecznego oznaczenia.
37. Jako gracz chcę wszędzie czytać `GWARANCJA 48 M`, abym nie mylił tego bonusu z osobną `OCHRONĄ`.
38. Jako gracz chcę widzieć naturalny bieg kuriera, abym nie odbierał kończyn jako drgających.
39. Jako gracz chcę, aby tempo kroków rosło razem z prędkością świata, abym czuł przyspieszenie.
40. Jako gracz chcę, aby cykl biegu nie przekraczał około czterech kroków na sekundę, abym zachował czytelną postać przy 3,5×.
41. Jako gracz chcę płynnej zmiany tempa animacji, abym nie widział przeskoków między prędkościami.
42. Jako gracz chcę zachować jednoznaczne pozy skoku i ślizgu, abym rozumiał aktualną akcję.
43. Jako gracz używający lewej ręki chcę skakać przez `W` i ślizgać się przez `S`, abym grał jedną ręką.
44. Jako gracz używający prawej ręki chcę skakać przez `↑` i ślizgać się przez `↓`, abym grał jedną ręką.
45. Jako dotychczasowy gracz chcę nadal skakać Spacją, abym nie utracił znanego sterowania.
46. Jako gracz korzystający z myszy chcę nadal skakać kliknięciem, abym zachował wybrany sposób wejścia.
47. Jako gracz mobilny chcę nadal skakać tapem, abym nie potrzebował klawiatury.
48. Jako gracz używający strzałek chcę, aby strona nie przewijała się podczas biegu, abym nie tracił pola gry.
49. Jako czytelnik historii chcę, aby przytrzymane `W`, `S`, `↑` lub `↓` nie przewijało karty, abym nie pomijał treści przypadkiem.
50. Jako czytelnik historii chcę, aby Spacja naciśnięta jeszcze w biegu nie przechodziła na kartę, abym nie przeskakiwał pierwszego kadru.
51. Jako czytelnik historii chcę móc użyć nowego naciśnięcia Spacji, abym miał wygodną alternatywę dla przycisku.
52. Jako czytelnik historii chcę móc od razu kliknąć `Dalej`, abym nie czekał na sztuczny timer.
53. Jako użytkownik preferujący ograniczony ruch chcę zachować czytelny shield bez intensywnego pulsu i pęknięcia, abym otrzymał tę samą informację bez nadmiaru ruchu.
54. Jako tester chcę sprawdzić wszystkie zachowania w jednej deterministycznej sesji kampanii, abym oceniał efekt gracza zamiast szczegółów implementacji.

## Implementation Decisions

- Warstwa prezentacji przeszkód przestaje renderować semantyczne etykiety,
  plakietki, piktogramy i dekoracyjne symbole na obiektach kolizyjnych. Typowany
  wariant przeszkody pozostaje częścią modelu fal i analityki, lecz nie generuje
  tekstu w aktywnym gameplay.
- Przedmioty kolizyjne zachowują konkretne detale wizualne wynikające z ich
  rodzaju. Etykiety i oznaczenia paczek kolekcjonerskich pozostają poza tym
  zakresem.
- Obraz świata używa wypełnienia odpowiadającego `cover`, a nie dopasowania
  zachowującego całą ilustrację. Centralny punkt kompozycji jest ważniejszy niż
  pokazanie skrajnych obrzeży obrazu.
- Cykl paralaksy składa się z dwóch lub większej liczby kopii w tej samej
  orientacji. Żadna kopia nie otrzymuje poziomego odbicia.
- Sąsiednie kopie otrzymują 2–3 piksele technologicznego zachodzenia oraz
  24–40 pikseli miękkiego mieszania krawędzi. Rozwiązanie nie może odsłaniać
  koloru podstawy przy ułamkowych transformacjach i różnych DPR.
- Przejście między assetami świata jest crossfadem warstw zajmujących cały
  kadr. Warstwy nie wjeżdżają i nie wyjeżdżają poza ekran.
- Faza paralaksy pozostaje absolutna podczas biegu, aby powrót po zmianie stanu
  nie powodował skoku. Wejście do historii uruchamia łagodne przejście do
  centralnej kompozycji danego stanu, zamiast zamrażać przypadkową fazę.
- Każdy start etapu i każda pauza narracyjna kończą ustawianie obrazu na pełnym
  kadrze. Granica cyklu nie może znajdować się w centralnym polu odczytu.
- Jeden stan prezentacji shielda jest wyliczany z faktycznej zdolności silnika
  do pochłonięcia następnego zderzenia. Dekoracyjny shield bez odpowiadającej mu
  reguły kolizji jest niedozwolony.
- Krótka niewrażliwość startowa i aktywna `GWARANCJA 48 M` używają tej samej
  pomarańczowej, ciągłej geometrii. Różnią się wyłącznie obecnością wpisu
  `GWARANCJA 48 M ×1` w HUD i czasem życia mechaniki.
- Shield jest wycentrowany na aktualnej sylwetce kuriera i zmienia obrys z
  koła na niższy owal podczas ślizgu. Zachowuje pomarańczowy kolor i nie używa
  przerywanej linii.
- Zużycie Gwarancji emituje jednorazowy stan wizualny rozbłysku oraz pęknięcia,
  po którym shield i ładunek HUD znikają. Tryb ograniczonego ruchu zastępuje
  animowane pęknięcie krótką statyczną zmianą stanu.
- Kanoniczną nazwą widoczną dla gracza jest `GWARANCJA 48 M`. Wszystkie
  produkcyjne teksty `OCHRONA` odnoszące się do bonusu zostają zastąpione;
  wewnętrzne identyfikatory mogą pozostać stabilne, jeśli nie są widoczne.
- Częstotliwość cyklu kroku jest obliczana jako płynna, monotoniczna funkcja
  prędkości świata, ograniczona do około 2 cykli na sekundę przy początku oraz
  4 cykli przy maksymalnej prędkości. Nie używa nieograniczonego mnożnika
  prędkości.
- Pozy powietrzna i ślizgu pozostają niezależne od cyklu biegu; animacja
  ograniczonego ruchu może wyłączyć bob i ruch kończyn bez zmiany hitboxów.
- Publiczny kontrakt wejścia mapuje `W`, `ArrowUp`, Spację, klik i tap na skok
  oraz `S` i `ArrowDown` na ślizg. Mapowanie obowiązuje wyłącznie w aktywnym
  gameplay.
- Domyślne przewijanie `ArrowUp` i `ArrowDown` jest blokowane tylko wtedy, gdy
  aktywna gra przejmuje te klawisze. Poza gameplay strona zachowuje normalne
  zachowanie przeglądarki.
- Przejście gameplay → historia czyści lub odrzuca klawisze trzymane, zdarzenia
  powtarzane oraz wejście Spacji rozpoczęte przed pojawieniem się karty.
- Karta historii nie ma minimalnego czasu blokady przycisku. `Dalej` reaguje
  natychmiast na klik lub tap. Spacja kontynuuje dopiero po nowym zdarzeniu
  naciśnięcia rozpoczętym po pokazaniu karty.
- Intro i pomoc pokazują równorzędne układy `W/S` i `↑/↓` oraz zachowują
  informację o Spacji i sterowaniu dotykowym.

## Testing Decisions

- Głównym testowym szwem jest deterministycznie uruchomiona kampania jako
  kompletny interfejs. Test obserwuje zachowanie dostępne graczowi: zawartość
  pola gry, ruch i zatrzymanie tła, stan shielda, widoczny HUD oraz reakcje na
  wejścia. Nie sprawdza prywatnych nazw funkcji ani kolejności wywołań canvas.
- Test integracyjny renderuje reprezentatywne przeszkody ze wszystkich rodzin
  i potwierdza brak nakładanych słów, plakietek, piktogramów oraz symboli przy
  zachowaniu rozpoznawalnych obiektów i etykiet paczek kolekcjonerskich.
- Test świata obejmuje start etapu, pełny cykl paralaksy, zawinięcie,
  crossfade do następnego świata, wejście do historii i powrót do gry. Kryterium
  zewnętrzne to ciągłe pokrycie kadru, brak białej szczeliny i brak
  lustrzanego odbicia.
- Macierz wizualna obejmuje co najmniej szeroki desktop, kontener witryny do
  1600 px, telefon 390 px, standardowy i wysoki DPR oraz proporcje portretowe i
  krajobrazowe. Odbiór przeglądarkowy obejmuje silniki Safari/WebKit i Chromium.
- Test stanu Gwarancji przechodzi przez brak ochrony, bezpieczny start, aktywną
  `GWARANCJĘ 48 M ×1`, skok, ślizg, pochłoniętą kolizję i stan po zużyciu.
  Widoczny shield musi dokładnie odpowiadać wynikowi kolizji.
- Test wejścia wykonuje osobno `W/S`, `ArrowUp/ArrowDown`, Spację, klik i tap.
  Potwierdza właściwe akcje, blokadę przewijania tylko w gameplay oraz brak
  reakcji kart na wejścia rozpoczęte przed zmianą stanu.
- Test historii potwierdza, że przycisk `Dalej` jest aktywny natychmiast, a
  świeże naciśnięcie Spacji kontynuuje kartę bez przywracania przypadkowego
  auto-repeatu z biegu.
- Dokładne reguły matematyczne mają wąskie testy uzupełniające: cykl kroku jest
  monotoniczny i pozostaje w granicach około 2–4 Hz, faza tła nie umieszcza
  styku w centralnym kadrze pauzy, a shield nie pojawia się bez realnego
  pochłonięcia następnego zderzenia.
- Istniejące testy cyklicznego tła, wspólnej płaszczyzny świata, prezentacji
  historii, trybów kolizji, renderera canvas i bramki wejścia historii stanowią
  prior art. Należy rozszerzyć je na zachowania v8 zamiast budować równoległy
  harness dla tych samych kontraktów.
- Dobre testy opisują wynik użytkownika i pozostają odporne na refaktoryzację
  modułów. Snapshot całego wygenerowanego HTML, konkretne wartości prywatnych
  transformacji lub sam fakt wywołania funkcji nie są wystarczającymi
  kryteriami akceptacji.

## Out of Scope

- Przebudowa wszystkich ilustracji na pixel art lub generowanie nowego zestawu
  światów.
- Zmiana fizyki skoku, długości ślizgu, hitboxów, spawnu fal, prędkości świata
  lub balansu Trybu Wyzwania.
- Zmiana fabuły, kolejności mikropoziomów, liczby paczek finału albo copy
  historii poza kanoniczną nazwą `GWARANCJA 48 M` i tekstami sterowania.
- Usuwanie etykiet z paczek kolekcjonerskich, nagród i rekwizytów fabularnych,
  które nie są przeszkodami aktywnego gameplay.
- Nowy rodzaj power-upu, dodatkowe ładunki Gwarancji lub zmiana jej skutku.
- Usuwanie kliknięcia, tapu lub Spacji jako dotychczasowych metod skoku.
- Czasowa blokada przycisku `Dalej` po pokazaniu historii.
- Zmiana zatwierdzonej palety kuriera, logo `A`, systemu celebracji progów lub
  audio poza efektem zużycia Gwarancji.

## Further Notes

- Specyfikacja zastępuje wcześniejsze sprzeczne ustalenie o lustrzanym
  odwracaniu co drugiej kopii tła. Od v8 wszystkie kopie mają tę samą
  orientację.
- Specyfikacja zastępuje wcześniejsze sprzeczne ustalenie o blokowaniu
  pierwszych sekund każdej sceny. Natychmiastowy klik lub tap przycisku `Dalej`
  jest zamierzony; blokowane jest wyłącznie przypadkowe przeniesienie wejścia z
  gameplay.
- Wewnętrzne pojęcie wariantu semantycznego przeszkody pozostaje użyteczne dla
  fal, walidacji i raportów QA, mimo że jego etykieta nie jest renderowana na
  obiekcie.
- Wizualny odbiór miękkiego łączenia tła oraz naturalności kroku wymaga krótkiej
  kontroli ludzkiej po przejściu testów automatycznych.
