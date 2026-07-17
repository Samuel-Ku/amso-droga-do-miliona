# Droga do Miliona v10 — spójny świat zamówień

Status: ready-for-agent

## Problem Statement

Ostatnia przebudowa warstwy świata pogorszyła odbiór gry. Tła są wizualnie
rozciągnięte, ich ruch szarpie, a szeroki różowo-kremowy łącznik wygląda jak
przypadkowy pas zasłaniający scenę. Zmiana kadrowania odseparowała dekoracyjną
podłogę świata od fizycznej linii gameplay, więc przeszkody sprawiają wrażenie
zawieszonych w powietrzu. Gra utraciła płynność i estetykę wcześniejszej wersji,
mimo że mobilne dekodowanie obrazów stało się bardziej niezawodne.

Pierwsze collectible w Trybie Wyzwania potrafi pojawić się wewnątrz
przeszkody. Obecne kartonowe paczki są mało atrakcyjne i monotonne, mimo że
historia AMSO dotyczy zarówno realizowanych zamówień, jak i konkretnych
kategorii sprzętu. Nazwy `Paczki` i `PACZEK` przestały też dokładnie opisywać
postęp, jeżeli gracz ma zbierać notebooki, telefony, komputery, monitory oraz
gotowe przesyłki.

Kurier zbudowany z prostych figur nie pasuje jakością do nowych ilustracyjnych
światów. Sylwetka, animacja i znak `A` są słabsze od zaakceptowanego kierunku
postaci kurierskiej. Próby naprawiania pojedynczych części nie zapewniają
spójnego ruchu między biegiem, skokiem, przysiadem i celebracją.

System kamieni milowych także nie spełnia obietnicy nagrody. Celebracja po
zebraniu 10 zamówień wygląda jak prawdziwe święto, ale kolejne progi używają
innych, abstrakcyjnych kompozycji. Koła, pływające linie, fale i serpentyny nie
komunikują rosnącego sukcesu. Różnorodność została pomylona ze zmianą języka
wizualnego zamiast ze zwiększaniem rangi tej samej dobrej celebracji.

Power-upy nadal wyglądają jak elementy z innego systemu. Wewnętrzna nazwa
`drugie_zycie` opisuje inną funkcję niż rzeczywisty mnożnik `2× WYNIK`, a stara
złota paczka dodaje trzeci, słabo wyjaśniony rodzaj bonusu. Wszystkie te
regresje razem sprawiają, że gra wydaje się gorsza i mniej responsywna, choć
fizyka sterowania nie jest głównym źródłem problemu.

## Solution

Warstwa świata odzyska spokojny, około dziesięcioprocentowy parallax i
proporcjonalne kadrowanie `cover`. Obraz nigdy nie zostanie rozciągnięty.
Każdy świat otrzyma zatwierdzony punkt kadrowania oraz wspólną kotwicę ziemi,
aby kurier, collectible i przeszkody stały na jednym poziomie. Światy będą
ustawione dokładnie kraj do kraju i zmienią się na naturalnej granicy ruchu.
Nie będzie crossfade, nakładania, lustrzanego odbicia, neutralnego connectora,
kolorowego pasa ani szczeliny. Mobilny mechanizm pojedynczego dekodowania,
retry, jasnego fallbacku i maksymalnie dwóch aktywnych światów pozostanie.

Ruch tła będzie wyliczany z jednej ciągłej fazy czasu/dystansu, bez
procentowego doganiania przez CSS i bez resetu podczas zmiany świata. W
story pause obraz za 600–800 ms łagodnie przesunie samo kadrowanie do
autorskiego punktu czytania, bez zmiany skali lub przełączania paneli. Po
zamknięciu karty parallax będzie kontynuowany z tej samej fazy.

Obecny geometryczny kurier zostanie zastąpiony spójnym, ilustracyjnym sprite
sheetem. Ekranowy bohater będzie dorosłym kurierem widzianym z boku, w czapce,
z plecakiem i skanerem, bez paczki trzymanej w rękach. Otrzyma pomarańczowy
strój AMSO oraz dokładny biały znak z zatwierdzonego `A.webp`, a nie jego
przybliżenie. Najpierw powstanie jeden etalonowy kadr biegu do zatwierdzenia.
Dopiero potem zostaną wykonane wszystkie klatki biegu, skoku, przysiadu i
krótkiej celebracji z identycznym płótnem i punktem oparcia stóp.

Zwykły pickup stanie się `Zamówieniem`. Gracz będzie zbierał pięć równorzędnych
wizualnie typów: `notebook`, `telefon`, `PC`, `LCD` oraz pomarańczową paczkę z
białymi taśmami. Cztery urządzenia wykorzystają zatwierdzony miękki styl
wektorowej ilustracji: zaokrąglone bryły, szare kontury, jasnoniebieskie ekrany
i ograniczone refleksy. Każdy typ liczy się jako jedno zamówienie i ma
identyczny hitbox oraz wartość mechaniczną. Paczka będzie obracać się przez
zatwierdzone ujęcia, a urządzenia otrzymają spokojny bob i krótki blik bez
pełnego obrotu.

Kolejność zamówień użyje miękko ważonego randomu. Nie będzie jawnego cyklu
pięciu elementów. Krótkie naturalne serie pozostaną możliwe, lecz cztery
identyczne typy z rzędu będą niedozwolone. Typ niewidziany przez około 12–15
pickupów będzie stopniowo otrzymywał większą wagę. Autorskie fale fabularne
mogą wskazać konkretną kategorię.

Tryb Wyzwania zacznie się od 3–5 osiągalnych zamówień bez przeszkody. Pierwsze
zagrożenie wjedzie po czytelnym odstępie. Każda późniejsza fala zostanie
odrzucona, jeśli collectible przecina hitbox przeszkody, leży poza trajektorią
skoku lub przysiadu albo nie zachowuje okna reakcji przy aktualnej prędkości.
Walidacja obejmie całe atomowe połączenie przeszkody i nagród, a nie tylko
oddzielne współrzędne.

W gameplay copy `Paczki` zostaną zastąpione przez `Zamówienia`. HUD, wynik i
kamienie milowe będą mówić o zrealizowanych zamówieniach. Fizyczne paczki
pozostaną paczkami w prawdziwych faktach i fragmentach fabuły, które opisują
wysyłkę lub wagę. Finałowy licznik od `999 970` do `1 000 000` wzrośnie po
każdym zebranym zamówieniu, niezależnie od jego wizualnego typu, i będzie
kontynuowany po przejściu do Trybu Wyzwania.

Pozostaną dwa power-upy. `Gwarancja 48 M` otrzyma ilustracyjny shield w palecie
AMSO i uruchomi jedno duże, pomarańczowe, oddychające koło ochrony wokół
kuriera. `drugie_zycie` zostanie semantycznie przemianowane na `2× WYNIK` i
otrzyma czytelny przestrzenny znak `2×`; bonus będzie podwajał wyłącznie
punkty, nie liczbę zamówień. Stara złota paczka `+350` zostanie całkowicie
usunięta. Power-upy nie będą udawać sprzętu lub zwykłej paczki, ale zachowają
ten sam ilustracyjny materiał, skalę i jakość.

`2× WYNIK` będzie pojawiać się średnio raz na 35–50 zamówień. Gwarancja nie
pojawi się, gdy ładunek jest aktywny, i zachowa cooldown po zużyciu. Power-up
nie zastąpi startowej bezpiecznej serii, nie nałoży się na milestone lub kartę
historii i zawsze otrzyma świadomie osiągalną drogę.

Wszystkie kamienie milowe wykorzystają dokładnie tę samą gramatykę, co udana
celebracja po 10 zamówieniach. Progi `10, 50, 100, 500, 1 000…` będą coraz
silniejszym wykonaniem tej samej kompozycji: kolorowego napisu, prawdziwego
konfetti, dekoracyjnych pomarańczowych paczek, krótkiego flasha ramki i — dla
największych progów — gestu radości kuriera. Nie pojawią się koła, pływające
linie, serpentyny, abstrakcyjne fale ani inna semantyka efektu.

Celebracja uruchomi się tylko w bezpiecznym oknie i nie zatrzyma wejść lub
symulacji. Jej elementy pozostaną głównie w górnej jednej trzeciej ekranu i nie
będą wyglądać jak collectible możliwe do zebrania. Trwanie wzrośnie najwyżej od
około 1,2 do 1,8 sekundy. Przy `prefers-reduced-motion` zostaną kolorowy napis,
krótki flash oraz statyczna kompozycja paczek i konfetti, bez lotu i opadania.
Copy pozostanie krótkie: `10 ZAMÓWIEŃ!`, `50 ZAMÓWIEŃ!` itd., bez następnego
progu i bez dodatkowego objaśnienia.

Każdy pickup otrzyma krótki przyjemny dźwięk. Nieprzerwana seria podniesie jego
wysokość maksymalnie przez pięć kroków. Power-upy dostaną własne sygnały, a
milestones jedną rozpoznawalną fanfarę rozwijaną wraz z rangą progu. Wszystko
pozostanie podporządkowane globalnemu `Wycisz`.

## User Stories

1. Jako gracz chcę widzieć tło w prawidłowych proporcjach, abym nie oglądał rozciągniętych mebli i pomieszczeń.
2. Jako gracz chcę, aby przeszkody wizualnie stały na ziemi, abym ufał ich fizycznemu położeniu.
3. Jako gracz chcę wspólnej linii ziemi dla kuriera, zamówień i przeszkód, abym intuicyjnie oceniał skok i przysiad.
4. Jako gracz chcę subtelnego parallaxu, abym czuł ruch bez dyskomfortu.
5. Jako gracz chcę ruchu tła około 10% prędkości trasy, abym zachował wcześniejsze spokojne tempo świata.
6. Jako gracz chcę ciągłej fazy parallaxu, abym nie widział skoku po zmianie świata.
7. Jako gracz chcę, aby kolejne światy stykały się kraj do kraju, abym widział jedną trasę.
8. Jako gracz chcę usunięcia różowego connectora, abym nie oglądał przypadkowego pionowego pasa.
9. Jako gracz chcę przejścia bez crossfade, abym nie widział dwóch nałożonych kompozycji.
10. Jako gracz chcę przejścia bez szczeliny, abym nigdy nie zobaczył pustego kadru.
11. Jako gracz chcę, aby drugi świat nie był odbity, abym zachował logiczną orientację pomieszczenia.
12. Jako czytelnik historii chcę łagodnego dojścia do autorskiego kadru, abym miał spokojne tło pod tekstem.
13. Jako czytelnik historii chcę zachowania skali podczas zmiany kadru, abym nie widział pompowania obrazu.
14. Jako gracz wracający z historii chcę kontynuować tę samą fazę trasy, abym nie odczuwał restartu świata.
15. Jako użytkownik Androida chcę zawsze widzieć świat, abym nie otrzymywał czarnego ekranu.
16. Jako użytkownik słabszego telefonu chcę maksymalnie dwóch zdekodowanych światów, abym nie tracił pamięci i płynności.
17. Jako użytkownik z błędem zasobu chcę jasnego fallbacku, abym nadal mógł grać.
18. Jako gracz chcę nowego ilustracyjnego kuriera, abym widział bohatera pasującego do jakości światów.
19. Jako gracz chcę dorosłego kuriera w czapce z plecakiem, abym natychmiast rozpoznawał jego rolę.
20. Jako gracz chcę skanera w dłoni kuriera, abym widział związek z obsługą zamówień.
21. Jako gracz chcę, aby kurier nie trzymał stale paczki, abym nie mylił jej ze zbieranym przedmiotem.
22. Jako właściciel marki chcę pomarańczowej formy AMSO, abym zachował zatwierdzoną paletę.
23. Jako właściciel marki chcę dokładnego białego znaku `A`, abym nie używał przypadkowego przybliżenia logo.
24. Jako gracz chcę płynnego sześcioklatkowego biegu, abym widział naturalny ruch nóg i ramion.
25. Jako gracz chcę czytelnych faz skoku, abym odczuwał odryw, lot i lądowanie.
26. Jako gracz chcę spójnego przysiadu, abym natychmiast rozpoznawał stan postaci.
27. Jako gracz chcę krótkiego gestu radości przy największych progach, abym dzielił sukces z bohaterem.
28. Jako gracz chcę stałego punktu oparcia stóp we wszystkich klatkach, abym nie widział drgania postaci.
29. Jako decydent chcę zatwierdzić jeden etalonowy kadr przed całym sprite sheetem, abym ograniczył ryzyko złego kierunku stylistycznego.
30. Jako gracz chcę zbierać różne urządzenia, abym nie widział ciągle tej samej paczki.
31. Jako gracz chcę zbierać notebook, abym rozpoznawał część oferty AMSO.
32. Jako gracz chcę zbierać telefon, abym doświadczał różnorodności asortymentu.
33. Jako gracz chcę zbierać zestaw PC, abym widział sprzęt stacjonarny.
34. Jako gracz chcę zbierać monitor LCD, abym rozpoznawał kolejną kategorię sprzętu.
35. Jako gracz chcę nadal zbierać charakterystyczną pomarańczową paczkę, abym zachował motyw realizacji wysyłki.
36. Jako gracz chcę, aby każdy collectible był rozpoznawalny bez tekstu, abym reagował w ruchu.
37. Jako gracz mobilny chcę widzieć collectible o wielkości co najmniej około 38–44 px, abym odróżniał typy na małym ekranie.
38. Jako gracz chcę identycznej wartości wszystkich zwykłych zamówień, abym nie musiał odgadywać ukrytych zasad.
39. Jako gracz chcę identycznego hitboxu zwykłych zamówień, abym miał przewidywalne zbieranie.
40. Jako gracz chcę, aby paczka obracała się między spójnymi ujęciami, abym widział jej przestrzenną formę.
41. Jako gracz chcę subtelnego bobu urządzeń, abym odróżniał je od dekoracji tła.
42. Jako gracz chcę krótkiego bliku na urządzeniu, abym widział, że można je zebrać.
43. Jako gracz chcę uniknąć pełnego sztucznego obrotu urządzeń, abym nie oglądał niespójnych perspektyw.
44. Jako gracz chcę naturalnie losowej kolejności zamówień, abym nie rozpoznawał mechanicznego cyklu.
45. Jako gracz chcę krótkich naturalnych serii, abym nie odbierał generatora jako ustawionego.
46. Jako gracz chcę uniknąć czterech identycznych typów z rzędu, abym nie odczuwał monotonii.
47. Jako gracz chcę zobaczyć każdy typ w rozsądnym czasie, abym doświadczał całej różnorodności.
48. Jako autor fabuły chcę wymusić kategorię w wybranej fali, abym mógł powiązać gameplay z faktem.
49. Jako nowy gracz Trybu Wyzwania chcę najpierw zebrać 3–5 dostępnych zamówień, abym rozpoznał nowy rytm.
50. Jako gracz chcę widzieć pierwszą przeszkodę dopiero po czytelnym odstępie, abym nie został zaskoczony na wejściu.
51. Jako gracz chcę, aby collectible nigdy nie znajdował się w przeszkodzie, abym nie czuł frustracji.
52. Jako gracz chcę, aby każde zamówienie było fizycznie osiągalne, abym ufał generatorowi.
53. Jako gracz chcę, aby łuk zamówień odpowiadał skokowi, abym rozumiał właściwą akcję.
54. Jako gracz chcę, aby niski układ zamówień odpowiadał przysiadowi, abym rozumiał właściwą akcję.
55. Jako gracz chcę zachowanego okna reakcji przy każdej prędkości, abym nie przegrywał przez niemożliwy spawn.
56. Jako gracz chcę widzieć `ZAMÓWIENIA` w HUD, abym rozumiał wspólny postęp sprzętu i paczek.
57. Jako gracz chcę widzieć `ZREALIZOWANE ZAMÓWIENIA` w wyniku, abym znał znaczenie liczby.
58. Jako gracz chcę, aby każde urządzenie zwiększało licznik miliona, abym rozumiał związek z kampanią.
59. Jako gracz chcę, aby pomarańczowa paczka także zwiększała licznik miliona, abym miał jedną zasadę postępu.
60. Jako czytelnik faktów chcę zachować słowo `paczki` przy wadze i wysyłce, abym nie zniekształcał prawdziwej historii.
61. Jako gracz chcę kontynuować licznik po milionie, abym rozumiał, że historia trwa dalej.
62. Jako gracz chcę rozpoznawać `Gwarancja 48 M` po ilustracyjnym shieldzie, abym świadomie wybierał ochronę.
63. Jako gracz chcę rozpoznawać aktywną Gwarancję po jednym dużym pomarańczowym kole, abym wiedział, że jestem chroniony.
64. Jako gracz chcę rozpoznawać `2× WYNIK` po znaku `2×`, abym wiedział, jaki bonus zbieram.
65. Jako gracz chcę, aby `2× WYNIK` podwajał tylko punkty, abym nie zaburzał licznika zamówień.
66. Jako gracz chcę usunięcia mylącej nazwy `drugie_zycie`, abym nie otrzymywał sprzecznego komunikatu.
67. Jako gracz chcę usunięcia złotej paczki `+350`, abym miał tylko dwa jasno wyjaśnione bonusy.
68. Jako gracz chcę, aby power-up wyglądał inaczej niż zwykłe zamówienie, abym rozpoznawał go przed podniesieniem.
69. Jako gracz chcę, aby power-up był osiągalny świadomą trasą, abym podejmował decyzję zamiast liczyć na przypadek.
70. Jako gracz z aktywną Gwarancją nie chcę kolejnego shielda, abym nie marnował rzadkiej nagrody.
71. Jako gracz chcę umiarkowanie rzadkiego `2× WYNIK`, abym odbierał go jako wydarzenie.
72. Jako gracz chcę, aby pierwsza celebracja 10 zamówień pozostała etalonem, abym zachował udaną nagrodę.
73. Jako gracz chcę coraz większego wykonania tej samej celebracji, abym czuł rosnącą rangę bez chaosu.
74. Jako gracz chcę prawdziwego konfetti przy każdym progu, abym zawsze rozpoznawał świętowanie.
75. Jako gracz chcę dekoracyjnych pomarańczowych paczek w większych celebracjach, abym widział motyw kampanii.
76. Jako gracz chcę mocniejszej celebracji przy 50 zamówieniach, abym odróżniał ją od pierwszego progu.
77. Jako gracz chcę jeszcze większej celebracji przy 100 zamówieniach, abym był ciekawy kolejnych progów.
78. Jako gracz chcę pełnej celebracji przy 500 i 1 000 zamówień, abym odczuwał wyjątkowość wyniku.
79. Jako gracz chcę uniknąć kół i pływających linii, abym nie mylił nagrody z abstrakcyjną dekoracją.
80. Jako gracz chcę uniknąć serpentyn i fal, abym zachował jeden czytelny język celebracji.
81. Jako gracz chcę krótkiego kolorowego napisu z aktualnym progiem, abym wiedział, co osiągnąłem.
82. Jako gracz nie chcę widzieć następnego progu, abym zachował ciekawość.
83. Jako gracz chcę zachować sterowanie podczas celebracji, abym nie został ukarany przez nagrodę.
84. Jako gracz chcę celebracji w bezpiecznym oknie, abym nie przegapił przeszkody przez konfetti.
85. Jako gracz chcę, aby dekoracyjne paczki pozostały w górnej części ekranu, abym nie próbował ich zbierać.
86. Jako gracz preferujący ograniczony ruch chcę statycznej wersji święta, abym otrzymał tę samą informację bez intensywnej animacji.
87. Jako gracz chcę przyjemnego pickup-sound, abym czuł każde zrealizowane zamówienie.
88. Jako gracz zbierający serię chcę delikatnie rosnącej wysokości dźwięku, abym słyszał utrzymany rytm.
89. Jako gracz nie chcę negatywnego sygnału za pominięcie zamówienia, abym nie odczuwał niepotrzebnej kary.
90. Jako gracz chcę osobnych sygnałów power-up, abym rozumiał bonus bez czytania.
91. Jako gracz chcę jednej rozwijanej fanfary progów, abym rozpoznawał rodzinę nagród.
92. Jako gracz z wyciszonym dźwiękiem chcę zachować pełną informację wizualną, abym mógł grać bez audio.
93. Jako gracz chcę zachowania obecnego skoku i przysiadu, abym nie musiał ponownie uczyć się sterowania w tym wydaniu.
94. Jako gracz chcę zachowania obecnej krzywej prędkości, abym oceniał zmianę prezentacji bez dodatkowej zmiennej.
95. Jako tester chcę deterministycznej pełnej sesji, abym mógł powtórzyć sprawdzenie generatora, zamówień i nagród.
96. Jako tester wizualny chcę stałego zestawu screenshotów, abym porównywał kompozycję zamiast pamięci.
97. Jako tester mobilny chcę sprawdzić świat i collectible na realnym telefonie, abym wykrył problemy niewidoczne w desktopowym emulatorze.
98. Jako właściciel kampanii chcę spójnej jakości kuriera, zamówień, power-upów i świata, abym mógł bez obaw opublikować grę.

## Implementation Decisions

- Warstwa świata zachowuje istniejący kontrakt wyboru świata, stanu i fazy,
  ale usuwa osobny connector. W runtime istnieją dwa sąsiednie panele o
  zerowym overlapie i wspólnej absolutnej fazie.
- Każdy panel zachowuje proporcje obrazu przez semantykę `cover`. Kadrowanie
  korzysta z zatwierdzonych punktów portrait, landscape i desktop oraz wspólnej
  kotwicy ziemi. Niedozwolone jest niezależne rozciąganie osi X i Y.
- Parallax ma współczynnik około `0.10`. Transformacja jest wyliczana z
  absolutnego dystansu/czasu biegu w każdej klatce, bez animowanego doganiania
  poprzedniego transformu przez CSS.
- Przejście świata jest dokonywane wyłącznie na naturalnej krawędzi panelu.
  Nowy panel wjeżdża z prawej w chwili, gdy stary wyjeżdża z lewej. Nie ma
  crossfade, lustrzanego odbicia, gradientowego łącznika ani białej szczeliny.
- Reading camera modyfikuje tylko punkt kadrowania w czasie 600–800 ms. Nie
  zmienia fazy parallaxu, rozmiaru panelu lub aktywnego zasobu.
- Store obrazów zachowuje jeden zdekodowany obiekt na świat, ograniczoną próbę
  ponownego dekodowania i maksymalnie dwa silnie referencjonowane światy.
- Produkcyjny kurier jest rastrowym sprite sheetem, nie figurą rysowaną na
  żywo. Najpierw powstaje pojedynczy etalon biegu. Po jego ręcznym zatwierdzeniu
  atlas obejmuje 6 klatek biegu, 3 fazy skoku, 2 klatki przysiadu i 3 klatki
  celebracji.
- Wszystkie klatki kuriera mają identyczne płótno, punkt stóp i skalę. Render
  pomniejsza asset wysokiej rozdzielczości; nie powiększa małego rastra.
- Znak na piersi wykorzystuje dokładną geometrię zatwierdzonego białego `A`.
  Nie wolno generować lub rysować podobnego znaku z pamięci.
- Model zwykłego collectible zostaje przemianowany domenowo z paczki na
  zamówienie, a jego typ wizualny obejmuje `notebook`, `telefon`, `pc`, `lcd`
  oraz `parcel`. Każdy typ daje `+1` zamówienie i tę samą bazową wartość wyniku.
- Cztery urządzenia używają osobnych, przezroczystych assetów WebP na płótnie
  256×256. Wspólny atlas zapewnia jedno ładowanie i identyczne skalowanie.
- Pomarańczowa paczka używa osobnego sprite sheetu z kolejnymi perspektywami.
  Urządzenia nie wymagają obrotowych sprite'ów; ich ruch składa się z bobu i
  krótkiego bliku.
- Hitbox collectible jest niezależny od przezroczystych marginesów assetu i
  pozostaje identyczny dla pięciu zwykłych typów. Jego środek pokrywa się ze
  wspólnym środkiem płótna.
- Dystrybucja typów jest miękko ważona. Niedawno widziany typ czasowo traci
  część wagi, seria czterech jest zakazana, a typ niewidziany przez 12–15
  pickupów otrzymuje rosnącą wagę. Nie istnieje jawna kolejność pięciu typów.
- Story wave może jawnie wskazać typ zamówienia. Losowy wybór nie nadpisuje
  autorskiego typu wymaganego przez fakt lub cel.
- Start Trybu Wyzwania jest osobnym deterministycznym intro patternem: 3–5
  zwykłych zamówień, bez aktywnej przeszkody i bez power-upu, po czym następuje
  pełne okno reakcji przed pierwszą przeszkodą.
- Walidator fali ocenia całą trajektorię przy aktualnej prędkości, rzeczywisty
  hitbox przeszkody, hitbox collectible, zasięg skoku/przysiadu i minimalny czas
  reakcji. Nieprawidłowa fala nie jest częściowo aktywowana; jest odrzucana.
- Gameplay counter, HUD, wynik i milestones używają pojęcia `Zamówienia`.
  Konfiguracja faktów zachowuje słowo `paczki` tam, gdzie dotyczy fizycznej
  wysyłki, wagi lub prawdziwego cytatu.
- Milionowy licznik rozpoczyna końcowy odcinek od `999 970`; każdy zwykły typ
  dodaje jeden. Stan nie jest resetowany przy handoffie do Trybu Wyzwania.
- Kanoniczne power-upy to `gwarancja_48` i semantyczny mnożnik wyniku. Migracja
  usuwa mylącą nazwę `drugie_zycie` z runtime, configu, snapshotów, copy i
  testów. Jeżeli potrzebna jest kompatybilność danych, stara wartość może być
  odczytana wyłącznie jako alias wejściowy, ale nie jest emitowana.
- `Gwarancja 48 M` nie stackuje się. Jej spawn zależy od braku aktywnego
  ładunku i cooldownu. `2× WYNIK` nie wpływa na liczbę zamówień.
- Zwykły losowy power-up występuje średnio raz na 35–50 zamówień, lecz jego
  spawn zawsze podporządkowuje się walidacji osiągalności i bezpiecznym stanom
  prezentacji.
- Rodzaj `golden` i wynik `+350` zostają usunięte z generatora, modelu,
  rendererów, autorskich nagród, copy i testów. Nie jest zastępowany trzecim
  bonusem.
- Director milestone operuje liczbą zamówień. Progi pozostają otwartą drabiną
  `10, 50, 100, 500, 1 000…`, a copy używa `ZAMÓWIEŃ`.
- Każdy milestone odtwarza tę samą bazową oś czasu co próg 10. Wyższa ranga
  zwiększa wyłącznie liczbę źródeł konfetti, dekoracyjnych paczek, flash, skalę
  napisu, siłę fanfary i opcjonalny gest kuriera. Nie przełącza się na inny
  język efektów.
- Dekoracyjne paczki milestone są renderowane w górnej trzeciej części, mają
  wyraźnie inny rozmiar i nie wchodzą do modelu kolizji lub collectible.
- Celebracja jest kolejkowana do bezpiecznego okna, trwa 1,2–1,8 s i nie
  blokuje wejść ani symulacji. Wariant reduced-motion jest statyczny poza
  krótką zmianą koloru/flash.
- Pickup audio korzysta z jednej frazy podnoszonej maksymalnie przez pięć
  kolejnych zebranych zamówień. Power-upy i milestones mają osobne sygnały,
  wszystkie sterowane przez istniejący globalny mute.
- Fizyka skoku, bezpośrednie przytrzymanie `S`/`↓`, dotykowy przysiad i obecna
  krzywa prędkości nie są zmieniane przez tę specyfikację.

## Testing Decisions

- Testy oceniają zachowanie widoczne przez publiczne inputy, snapshoty,
  callbacki i DOM. Nie sprawdzają prywatnych pól, liczby pomocniczych klas ani
  dokładnej kolejności wewnętrznych wywołań.
- Głównym wysokim seamem jest deterministyczna pełna sesja `RunnerGame`.
  Jedna powtarzalna próba obejmuje start fabuły, handoff, bezpieczny początek
  Trybu Wyzwania, pięć typów zamówień, power-upy, milionowy licznik i kilka
  progów celebracji.
- Test pełnej sesji potwierdza, że zwykły collectible zawsze daje dokładnie
  jedno zamówienie, `2× WYNIK` zmienia tylko punkty, Gwarancja nie stackuje się,
  a usunięty golden bonus nigdy nie pojawia się w snapshotach lub eventach.
- Property/deterministic tests generatora używają wielu seedów i pełnego
  zakresu istniejących prędkości. Każda fala musi zachować osiągalny tor,
  odstęp od hitboxu przeszkody i okno reakcji. Test nie dopuszcza pierwszego
  collectible Trybu Wyzwania wewnątrz przeszkody.
- Test dystrybucji sprawdza brak czterech identycznych typów z rzędu oraz
  mechanizm odzyskiwania typu niewidzianego w długim oknie, ale nie wymaga
  jednego sztywnego porządku.
- Drugim wysokim seamem jest `WorldVisualLayer` uruchamiany w środowisku DOM.
  Testuje proporcjonalny `cover`, wspólną fazę 10%, panele kraj do kraju,
  nieobecność connectora/crossfade/overlapu, reading camera, retry, fallback i
  ograniczenie dwóch zasobów.
- Test przejścia świata obserwuje końcowe pozycje paneli i brak odsłoniętego
  tła. Nie wiąże się z konkretną techniką canvas lub `<img>`, o ile kontrakt
  dekodowania i płynności zostaje spełniony.
- Testy milestone sprawdzają wspólną semantykę celebracji, rosnącą intensywność,
  copy `ZAMÓWIEŃ`, brak kolejnego progu, aktywne sterowanie i reduced-motion.
  Nie snapshotują każdej cząstki.
- Testy audio potwierdzają pięciostopniowy pickup motif, osobne cue dwóch
  power-upów, rozwijaną fanfarę i podporządkowanie `Wycisz`.
- Test asset manifestu potwierdza obecność osobnych urządzeń, paczki, dwóch
  power-upów, zatwierdzonego `A` i kompletnego sprite sheetu kuriera oraz brak
  starego geometrycznego/rastrowego fallbacku jako ścieżki podstawowej.
- Jakość estetyczna jest sprawdzana przez stały screenshot set desktop/mobile:
  bieg, skok, przysiad, shield, pięć collectibles, oba power-upy, próg 10,
  próg 100/500, granica światów i story pause.
- Manualna matryca obejmuje Chrome, Safari, Edge i Android, w tym lokalny
  autonomiczny HTML. Kryteria: identyczny świat, brak czarnego kadru, szczeliny,
  overlapu i connectora, brak deformacji, czytelne collectible oraz brak
  regularnych szarpnięć.
- Przejście świata nie może generować regularnej klatki dłuższej niż około
  20 ms na urządzeniu referencyjnym. Profil pamięci musi potwierdzić najwyżej
  dwa zdekodowane światy.
- Wzorem dla tych testów są istniejące deterministyczne testy trybów gameplay,
  fairness spawning, milestones, UI milestone, audio oraz DOM-owe testy
  parallaxu i mobilnego dekodowania.

## Out of Scope

- Zmiana fizyki skoku, coyote time, jump buffer lub hitboxu kuriera.
- Zmiana bezpośredniego sterowania `S`, `↓`, dotyku lub strzałki skoku.
- Dalsze zwiększanie maksymalnej prędkości i przebudowa krzywej trudności.
- Zmiana pięciominutowej struktury fabuły, kolejności faktów lub historii
  klientów.
- Dodanie trzeciego power-upu, adaptive assist, boss fightu lub wózka
  widłowego.
- Voice-over, nowe kanały social sharing i dodatkowa analityka.
- Zmiana minimalnych breakpointów, Fullscreen API lub CSS Trybu Gry poza
  regresyjną weryfikacją istniejącego zachowania.
- Automatyczne uznanie jakości ilustracji na podstawie unit-testu; etalonowy
  kadr kuriera i finalny screenshot set wymagają odbioru wizualnego.

## Further Notes

- Zaakceptowany concept sheet notebooka, telefonu, PC i LCD definiuje styl,
  ale produkcyjne pliki muszą powstać osobno z przezroczystością i wspólnym
  kadrem. Nie należy wycinać finalnych assetów z jednego obrazu koncepcyjnego.
- Referencje kuriera i urządzeń służą jako kierunek stylu, nie jako pliki do
  bezpośredniego kopiowania. Produkcyjne ilustracje powinny być niezależnymi
  assetami zgodnymi z marką AMSO.
- Pomarańczowa paczka z białymi taśmami jest zatwierdzonym motywem zarówno
  zwykłego collectible, jak i dekoracyjnego elementu celebracji. Te dwa użycia
  muszą różnić się położeniem, skalą i brakiem hitboxu w celebracji.
- Specyfikacja świadomie zastępuje decyzje v9 o neutralnym connectorze,
  wielu odmiennych kompozycjach konfetti, geometrycznym kurierze, golden
  package oraz gameplay copy `PACZKI`.
- Wydanie nie jest gotowe wyłącznie po przejściu testów automatycznych. Musi
  przejść uzgodniony odbiór wizualny i realną matrycę przeglądarek/telefonu.

