# Droga do Miliona v7 — czytelne fale, tempo i finał

Status: ready-for-human

## Problem Statement

Obecna rozgrywka nie tworzy jeszcze spójnej, około pięciominutowej drogi od
pierwszej paczki do miliona. Segmenty są krótkie i kończą się głównie dlatego,
że upłynął czas. W `Zatorze Zamówień` mogą pojawić się przeszkody bez paczek, a
następny etap nadchodzi zanim gracz zrozumie cel i poczuje, że faktycznie
rozładował zator. Podobne problemy dotyczą pozostałych etapów: mechanika, HUD i
tło nie zawsze jasno pokazują, co gracz robi dla opowiadanej historii.

Tempo fabuły jest zbyt łagodne, a Tryb Wyzwania zbyt szybko osiąga niski limit
prędkości. Jednoczesne zwiększanie szybkości, gęstości i złożoności prowadziłoby
jednak do losowych lub fizycznie niemożliwych sytuacji. Gra potrzebuje
kontrolowanej progresji opartej na czasie reakcji i sprawdzonych kombinacjach,
a nie na samym skracaniu odstępów.

Obecny finał działa jak krótka walka z bossem i wykorzystuje wózek widłowy, ale
nie wynika to z historii miliona zamówień. Finał jest przez to mniej czytelny i
mniej wymagający niż wcześniejsze fragmenty. Licznik miliona, paczki, kombinacje
i przejście do Trybu Wyzwania nie tworzą jeszcze jednego logicznego skutku.

System informacji zwrotnej także wymaga uporządkowania. Combo rośnie od każdej
paczki zamiast nagradzać wykonanie całej fali, bonusy nie zawsze pokazują swój
skutek, a duże komunikaty mogą zasłaniać grę. Abstrakcyjne znaczniki celów nie
wyjaśniają graczowi, czym jest zator, kontrola jakości, rozwój klienta lub
przepływ zamówień. Po kolizji fabuła stosuje ukryte ułatwienie, chociaż
zatwierdzona zasada zakłada powtórzenie tej samej, uczciwej próby bez
adaptacyjnej pomocy.

Przejścia między biegiem i historią nie zachowują jeszcze jednego ruchu świata.
Tło powinno prowadzić opowieść, płynnie wprowadzać kolejne miejsce z prawej
strony, a następnie niezauważalnie ustawiać kadr pod tekst. Obecne zatrzymanie
fazy i nagła zmiana planszy nie realizują tego kontraktu.

## Solution

Gra zostanie zbudowana jako sześć spójnych mikropoziomów: `Pierwsza paczka`,
`Zator Zamówień`, `Proces i Jakość`, `Rozwój Firmy Klienta`, `Skala Zamówień`
oraz `Próg Miliona`. Obowiązkowa interakcja potrwa około pięciu minut, natomiast
czytanie historii pozostanie bez limitu czasu. Każdy poziom będzie miał minimalny
czas, konkretny cel oraz autorskie fale. Sam upływ czasu nigdy nie ukończy etapu;
niewykonana fala wróci w tej samej postaci.

Wspólny język fal połączy przeszkodę, jednoznaczną akcję i trasę nagrody. Każda
fala fabularna pokaże przeszkodę z wyprzedzeniem 1,6–2,0 sekundy, poprowadzi
gracza 2–5 paczkami po trajektorii skoku albo ślizgu i zakończy się krótkim
oddechem. Fala zostanie zaliczona po wykonaniu właściwej akcji i zebraniu co
najmniej 60% jej paczek. Pełne zebranie będzie wynikiem perfekcyjnym. Kolizja lub
niezaliczenie powtórzy niezmienioną falę, bez ukrytej adaptacji.

Fabuła otrzyma kontrolowaną, wyraźnie rosnącą prędkość od około 0,95× do 1,85×.
Tryb Wyzwania użyje proceduralnego składania wyłącznie wcześniej zwalidowanych
klocków fal i dojdzie do 3,5× w około trzy minuty. Trudność będzie rosła na kilku
osiach — prędkości, gęstości, złożoności, precyzji i presji — ale nie na
wszystkich jednocześnie. Minimalny czas reakcji zostanie zachowany przez
wysuwanie punktu pojawienia się dalej poza prawą krawędź przy większej
prędkości.

Finał przestanie być walką z bossem. Wózek widłowy, życie bossa i ataki bossa
zostaną usunięte. `Próg Miliona` będzie najróżnorodniejszą autorską sekwencją
całej gry, z nieregularnym, ale deterministycznym rytmem, dwunastoma różnymi
kombinacjami oraz konfigurowalnym celem 40–60 paczek. Pierwszy balans przyjmie 50
paczek, więc licznik rozpocznie od 999 950 i wzrośnie dokładnie o jeden za każdą
zebraną paczkę. Pominięte paczki wrócą w bezpiecznych fragmentach, aby fabuła
zawsze mogła dojść do miliona.

HUD otrzyma jeden semantyczny slot celu, przedstawiający rozpoznawalny przedmiot,
krótki rzeczownik działania i licznik. Combo będzie naliczane za ukończone fale,
nie za pojedyncze paczki. Bonusy otrzymają czytelny skutek, licznik czasu i
jednorazową demonstrację pierwszego użycia. Duże komunikaty ukończenia rozdziału
zostaną zastąpione domknięciem wskaźnika, dźwiękiem, bezpieczną trasą nagród i
zmianą świata w tle.

Tło zachowa paralaksę i stanie się ciągłą częścią narracji. Kolejny świat wjedzie
z prawej strony z aktualną prędkością tła. Po zakończeniu biegu kamera płynnie
przejdzie z kadru rozgrywki do centralnego kadru historii, a tekst pojawi się
dopiero po ustawieniu bezpiecznego pola odczytu. Powrót do gry ponownie połączy
ruch bez skoku fazy. Tryb ograniczonego ruchu zachowa widoczne tło i wolną,
liniową paralaksę, ale usunie intensywne ruchy kamery.

## User Stories

1. Jako gracz chcę przejść jedną spójną drogę od pierwszej paczki do miliona, abym rozumiał rozwój AMSO.
2. Jako gracz chcę spędzić około pięciu minut na obowiązkowej interakcji, abym odczuł drogę bez przeciągania kampanii.
3. Jako czytelnik chcę sam decydować o czasie czytania, abym nie tracił fragmentów historii.
4. Jako gracz chcę widzieć sześć nazwanych mikropoziomów, abym rozumiał strukturę podróży.
5. Jako gracz chcę, aby etap kończył się po osiągnięciu celu, a nie wyłącznie po timerze, abym czuł sprawczość.
6. Jako gracz chcę powtórzyć nieukończoną falę, abym mógł nauczyć się jej rozwiązania.
7. Jako gracz chcę ponownie otrzymać tę samą falę po błędzie, abym nie był ukrycie wspomagany.
8. Jako gracz chcę widzieć przeszkodę z odpowiednim wyprzedzeniem, abym mógł świadomie zareagować.
9. Jako gracz chcę widzieć paczki wyznaczające trajektorię, abym rozumiał oczekiwany skok lub ślizg.
10. Jako gracz chcę, aby każda fala fabularna zawierała paczki, abym nie omijał przeszkód bez związku z zamówieniami.
11. Jako gracz chcę wykonywać jedną czytelną akcję w pojedynczym wzorze, abym nie musiał zgadywać rozwiązania.
12. Jako gracz chcę otrzymać krótki oddech po serii działań, abym zachował rytm i koncentrację.
13. Jako gracz chcę zaliczyć falę po poprawnej akcji i zebraniu 60% paczek, abym miał jasny standard powodzenia.
14. Jako gracz chcę otrzymać dodatkową nagrodę za wszystkie paczki, abym miał cel mistrzowski bez blokowania fabuły.
15. Jako gracz chcę unikać fizycznie niemożliwych przejść, abym ufał zasadom gry.
16. Jako gracz chcę, aby wygląd przeszkody zawsze oznaczał tę samą akcję, abym mógł uczyć się świata wzrokiem.
17. Jako gracz chcę widzieć różne magazynowe warianty przeszkód, abym nie odczuwał monotonii.
18. Jako gracz chcę, aby przeszkody wjeżdżały spoza prawej krawędzi, abym nie widział nagłego pojawiania się obiektów.
19. Jako nowy gracz chcę przejść cztery prowadzone fale, abym poznał skok i ślizg przed trudniejszą grą.
20. Jako nowy gracz chcę najpierw zebrać łuk paczek bez przeszkody, abym zrozumiał podstawowy ruch.
21. Jako nowy gracz chcę przećwiczyć osobno skok i ślizg, abym nie pomylił sterowania.
22. Jako nowy gracz chcę zakończyć szkolenie krótką sekwencją skok–ślizg, abym przygotował się do zatoru.
23. Jako nowy gracz chcę widzieć podpowiedź tylko do pierwszego sukcesu, abym szybko przeszedł do samodzielnej gry.
24. Jako nowy gracz chcę nie tracić punktów ani combo podczas szkolenia, abym mógł bezpiecznie nauczyć się sterowania.
25. Jako gracz chcę rozładować osiem fal zatoru, abym mechanicznie odczuł przywracanie przepływu.
26. Jako gracz chcę zobaczyć narastanie, rozładunek i płynny przepływ, abym rozumiał fabularną przemianę zatoru.
27. Jako gracz chcę, aby zator trwał 45–50 sekund przy poprawnej grze, abym miał czas zrozumieć i opanować etap.
28. Jako gracz chcę widzieć `FALE ZATORU 3/8`, abym znał konkretny postęp.
29. Jako gracz chcę zobaczyć kartony układające się w uporządkowaną paczkę na przenośniku, abym rozumiał rezultat etapu.
30. Jako gracz chcę przygotować cztery urządzenia po trzy fale, abym rozumiał powtarzalność procesu jakości.
31. Jako gracz chcę widzieć stempel `SPRAWDZONY` po trzech poprawnych falach, abym rozumiał wynik kontroli.
32. Jako gracz chcę zachować ukończone urządzenia po kolizji, abym tracił tylko bieżący postęp.
33. Jako gracz chcę widzieć `SPRAWDZONE 2/4 · KROK 1/3`, abym rozumiał oba poziomy celu.
34. Jako gracz chcę poznać bonus `AUDYT` po pierwszym urządzeniu, abym połączył go z jakością.
35. Jako gracz chcę zakończyć próbę sekwencją skok–ślizg–skok, abym odczuł kulminację procesu.
36. Jako gracz chcę przejść trzy fazy rozwoju klienta, abym zrozumiał pełną potwierdzoną historię.
37. Jako gracz chcę zobaczyć początek działalności i laptop za 300 zł, abym znał punkt startowy klienta.
38. Jako gracz chcę zobaczyć powrót po roku z budżetem 100 000 zł, abym odczuł rozwój firmy klienta.
39. Jako gracz chcę dowiedzieć się o siedmiu latach dalszego wyboru sprzętu poleasingowego, abym rozumiał trwałość decyzji.
40. Jako gracz chcę widzieć `ROZWÓJ 2/3`, abym nie mylił historii klienta z historią AMSO.
41. Jako gracz chcę poznawać fakty klienta tylko w bezpiecznych animacjach, abym nie czytał podczas omijania przeszkód.
42. Jako gracz chcę poznać bonus `DRUGIE ŻYCIE` w drugiej fazie, abym zobaczył jego związek z dalszym wykorzystaniem sprzętu.
43. Jako gracz chcę przeprowadzić zamówienie przez przyjęcie, realizację i wysyłkę, abym rozumiał skalę procesu.
44. Jako gracz chcę ukończyć po trzy fale w każdej strefie, abym opanował cały przepływ.
45. Jako gracz chcę zachować ukończoną strefę po błędzie, abym powtarzał wyłącznie bieżącą falę.
46. Jako gracz chcę widzieć nazwę bieżącej strefy i jej licznik, abym wiedział, co właśnie robię.
47. Jako gracz chcę zobaczyć po etapie porównanie 28 000 telefonów z około 240 metrami i PKiN, abym zrozumiał roczną skalę.
48. Jako gracz chcę, aby finał był najbardziej różnorodnym i intensywnym fragmentem, abym odczuł kulminację drogi.
49. Jako gracz chcę przejść finał bez bossa i wózka widłowego, abym skupiał się na milionowym zamówieniu.
50. Jako gracz chcę otrzymać nieregularny, ale uczciwy rytm finału, abym nie mógł grać automatycznie.
51. Jako gracz chcę spotkać pojedyncze akcje, dublety, serie, łuki i oddechy, abym wykorzystywał całe opanowane sterowanie.
52. Jako gracz chcę, aby identyczny wzór nie występował dwa razy z rzędu, abym odczuwał różnorodność.
53. Jako gracz chcę zobaczyć pierwszą akcję finału co najmniej 1,6 sekundy wcześniej, abym nie został zaskoczony niesprawiedliwie.
54. Jako gracz chcę widzieć zapowiedź dalszych akcji w serii, abym mógł planować ruch.
55. Jako gracz chcę otrzymać odpoczynek po intensywnej serii, abym nie tracił kontroli przez kumulację presji.
56. Jako gracz chcę zebrać około 50 finałowych paczek, abym fizycznie doprowadził licznik do miliona.
57. Jako właściciel produktu chcę dostroić finał do 40–60 paczek, abym mógł poprawić tempo po testach.
58. Jako gracz chcę, aby licznik startował z wartości wynikającej z celu, abym zawsze kończył dokładnie na 1 000 000.
59. Jako gracz chcę zwiększać licznik o jeden każdą zebraną paczką, abym rozumiał związek między akcją i liczbą.
60. Jako gracz chcę ponownie spotkać pominiętą paczkę w bezpiecznej strefie, abym mógł ukończyć fabułę bez game over.
61. Jako gracz chcę przez kilka sekund biec po osiągnięciu miliona, abym mógł odczuć sukces przed zatrzymaniem.
62. Jako gracz chcę zobaczyć świętowanie miliona i jasną zmianę zasad, abym rozumiał wejście do Trybu Wyzwania.
63. Jako gracz chcę zachować wynik, paczki, combo i aktywne bonusy przy pierwszym wejściu do wyzwania, abym odbierał bieg jako ciągłość.
64. Jako gracz chcę po game over rozpocząć czyste wyzwanie, abym mógł porównywać kolejne próby.
65. Jako gracz chcę zachować rekord osobisty po restarcie, abym miał długoterminowy cel.
66. Jako gracz Trybu Wyzwania chcę dojść od około 1,85× do maksymalnie 3,5×, abym odczuł realną progresję umiejętności.
67. Jako gracz Trybu Wyzwania chcę osiągać około 2,4× po minucie i 3,0× po dwóch, abym czuł regularne przyspieszenie.
68. Jako gracz Trybu Wyzwania chcę, aby po 3,5× rosła złożoność zamiast prędkości, abym zachował fizyczną wykonalność.
69. Jako gracz Trybu Wyzwania chcę, aby gra zwiększała jedną główną oś trudności naraz, abym mógł rozpoznać nowe wymaganie.
70. Jako gracz Trybu Wyzwania chcę mieć co najmniej 1,2 sekundy reakcji, abym nie przegrywał przez niewidoczne spawny.
71. Jako gracz Trybu Wyzwania chcę, aby szybkie obiekty pojawiały się dalej po prawej, abym zachował czas reakcji.
72. Jako gracz chcę używać wyłącznie skoku i ślizgu, abym nie musiał uczyć się trzeciej mechaniki.
73. Jako gracz jedną ręką chcę używać `S` tak samo jak strzałki w dół, abym wygodnie wykonywał ślizg.
74. Jako gracz chcę rozpocząć ślizg krótkim naciśnięciem i przedłużyć przytrzymaniem, abym miał precyzyjną kontrolę.
75. Jako gracz dotykowy chcę wykonać ślizg gestem w dół, abym otrzymał odpowiednik krótkiego naciśnięcia.
76. Jako gracz chcę korzystać z krótkiego bufora ślizgu, abym nie tracił poprawnego wejścia tuż przed przeszkodą.
77. Jako gracz chcę, aby animacja i hitbox ślizgu były zgodne, abym ufał kolizjom.
78. Jako gracz chcę otrzymywać combo za zaliczone fale, abym był nagradzany za pełne wykonanie.
79. Jako gracz chcę otrzymać osobny bonus za perfekcyjną falę, abym odróżniał sukces od mistrzostwa.
80. Jako gracz chcę stracić combo po niezaliczonej fali, abym rozumiał ryzyko serii.
81. Jako gracz chcę zachować mnożnik maksymalnie ×8, abym miał czytelny limit rozwoju serii.
82. Jako gracz chcę, aby paczki nadal dawały bazowy wynik, abym czuł wartość każdego zebrania.
83. Jako gracz chcę widzieć `×2 WYNIK` podczas `DRUGIEGO ŻYCIA`, abym nie mylił bonusu z dodatkową próbą.
84. Jako gracz chcę, aby `AUDYT` przez około 7 sekund zwiększał odstępy bez spowalniania kuriera, abym rozumiał jego działanie.
85. Jako gracz chcę widzieć jedną naładowaną tarczę `GWARANCJI`, abym wiedział, że kolizja zostanie pochłonięta.
86. Jako gracz chcę zobaczyć pęknięcie tarczy po ochronie, abym rozumiał utratę ładunku.
87. Jako gracz chcę poznać bonus w bezpiecznej demonstracji przy pierwszym użyciu, abym rozumiał skutek bez czytania instrukcji w biegu.
88. Jako gracz chcę, aby pierwsze 1,2 sekundy demonstracji odrzucały wejścia, abym nie pominął jej przypadkową spacją.
89. Jako gracz chcę później zbierać ten sam bonus bez zatrzymywania gry, abym zachował rytm.
90. Jako gracz chcę znaleźć opis bonusów w pauzie, abym mógł przypomnieć sobie zasady.
91. Jako gracz chcę widzieć jeden semantyczny cel zamiast kilku abstrakcyjnych wskaźników, abym rozumiał aktualne zadanie.
92. Jako gracz chcę widzieć realne miniatury paczek, urządzeń, stanowisk i stref, abym łączył licznik z fabułą.
93. Jako gracz chcę otrzymywać informację o zaliczeniu fali bez wielkiego overlayu, abym nie tracił widoczności trasy.
94. Jako gracz chcę, aby ukończenie rozdziału było pokazane zmianą świata, dźwiękiem i trasą nagród, abym odczuł sukces bez napisu `CEL WYKONANY`.
95. Jako gracz chcę, aby celebracja progu paczek czekała na bezpieczny moment, abym nie został zasłonięty w trudnej serii.
96. Jako gracz chcę, aby jednocześnie pojawiał się najwyżej jeden duży efekt, abym zachował czytelność.
97. Jako gracz chcę, aby tło płynnie przesuwało się w lewo, abym odczuwał ciągłą podróż.
98. Jako gracz chcę widzieć następny świat wjeżdżający z prawej z tą samą prędkością, abym nie widział nagłej zmiany planszy.
99. Jako czytelnik chcę, aby tło zostało wycentrowane przed pojawieniem się tekstu, abym otrzymał spokojny i równy kadr.
100. Jako czytelnik chcę, aby punkt skupienia ilustracji nie znajdował się pod panelem tekstu, abym widział sens sceny.
101. Jako gracz chcę płynnie wrócić z karty do ruchomego świata, abym nie widział resetu paralaksy.
102. Jako użytkownik ograniczonego ruchu chcę zachować wolną liniową paralaksę, abym nadal widział ciągłość świata.
103. Jako użytkownik ograniczonego ruchu chcę uniknąć pulsów, wstrząsów i agresywnych ruchów kamery, abym komfortowo korzystał z gry.
104. Jako użytkownik telefonu od 390 px chcę otrzymać tę samą logikę fal i punktacji, abym nie grał w uproszczoną wersję.
105. Jako użytkownik dotykowy chcę otrzymać około 100 ms dodatkowej zapowiedzi pierwszej akcji, abym skompensował opóźnienie wejścia.
106. Jako użytkownik szerokiego ekranu chcę grać w kontenerze do 1600 px, abym zachował zgodność z witryną AMSO.
107. Jako użytkownik Safari, Chrome, Edge lub Opery chcę otrzymać ten sam kontrakt tła i rozgrywki, abym nie zależał od przeglądarki.
108. Jako tester chcę skopiować lokalny raport QA bez danych osobowych, abym mógł analizować balans bez backendu.
109. Jako właściciel produktu chcę dostrajać czasy, prędkości i cele w konfiguracji, abym reagował na testy bez przebudowy silnika.
110. Jako tester chcę otrzymać precyzyjny błąd dla niewykonalnej fali, abym mógł poprawić dane przed wydaniem gry.

## Implementation Decisions

- Jednostką projektowania rozgrywki jest autorska fala. Fala deklaruje akcję,
  wizualny wariant przeszkody, ścieżkę 2–5 paczek, telegraph, oddech, warunek
  zaliczenia, warunek perfekcyjny i semantyczny efekt fabularny.
- Wspólny silnik fal obsługuje fabułę i dostarcza zwalidowane klocki Trybowi
  Wyzwania. Fabuła uruchamia jawne skrypty; wyzwanie proceduralnie składa tylko
  klocki, które przeszły walidację wykonalności.
- Atomy fal wymagają jednej głównej akcji. Sekwencje wieloakcyjne są składane z
  atomów i muszą jawnie zapowiadać kolejne działanie.
- Fala fabularna ma 1,6–2,0 sekundy zapowiedzi, 0,8–1,2 sekundy oddechu po akcji
  i dłuższą strefę nagrody po 3–5 wzorach. W wyzwaniu minimalna zapowiedź wynosi
  1,2 sekundy.
- Zaliczenie wymaga właściwej akcji i co najmniej 60% paczek. Progi całkowite są
  jednoznaczne: 2 z 3 i 3 z 4. Zebranie wszystkich paczek oznacza perfekcyjną
  falę.
- Niezaliczenie powtarza dokładnie tę samą falę. Projekt usuwa wszystkie formy
  `adaptive assist`, automatyczne poszerzanie odstępów po serii porażek oraz
  inne ukryte ułatwienia zależne od gracza.
- Fabuła nie ma game over. Po zderzeniu następuje 120–160 ms uderzenia, bieżąca
  seria jest tracona, aktywna fala zostaje bezpiecznie oczyszczona i wraca po
  krótkim odzyskaniu kontroli. Wynik kolizji pojawia się po animacji uderzenia.
- `GWARANCJA` może raz ochronić bieżącą serię w fabule. W wyzwaniu pochłania
  jedną kolizję i pęka; kolejna niezabezpieczona kolizja kończy próbę.
- Mechaniczne rodziny przeszkód pozostają dwie. Niskie obiekty magazynowe
  wymagają skoku, a belki, bramki, zasłony i niskie odcinki przenośnika wymagają
  ślizgu. Powstaje łącznie 8–9 rozpoznawalnych wariantów wizualnych bez zmiany
  znaczenia akcji i bez niewidzialnych colliderów.
- Sześć mikropoziomów zastępuje osiem obecnych fragmentów. Docelowe czasy przy
  poprawnej grze wynoszą: około 25 s, 45–50 s, 40–45 s, 35–40 s, 45–50 s oraz
  65–75 s. Czytanie i pauza nie są wliczane do aktywnego czasu.
- `Pierwsza paczka` składa się z czterech prowadzonych fal: łuk paczek, skok,
  ślizg i krótka sekwencja skok–ślizg. Podpowiedź znika po pierwszym sukcesie,
  a onboarding nie karze wyniku ani combo.
- `Zator Zamówień` ma jeden cel `Rozładuj 8 fal zatoru` i trzy fazy: narastanie,
  rozładunek oraz płynny przepływ. Każda z ośmiu fal zawiera przeszkodę oraz 3–4
  paczki.
- `Proces i Jakość` obejmuje cztery urządzenia po trzy fale. Kolizja resetuje
  tylko bieżące urządzenie. Po trzech falach urządzenie otrzymuje trwały w tym
  etapie stempel `SPRAWDZONY`. Czwarte urządzenie kończy sekwencja
  skok–ślizg–skok.
- `Rozwój Firmy Klienta` ma trzy fazy zgodne z potwierdzoną historią: laptop za
  300 zł na początku działalności, budżet 100 000 zł po roku oraz siedem lat
  dalszego wyboru sprzętu poleasingowego. Fakty pojawiają się wyłącznie w
  bezpiecznych animacjach, nie pod aktywną rozgrywką.
- `Skala Zamówień` ma trzy strefy: przyjęcie, realizacja i wysyłka, każda po trzy
  fale. Ukończona strefa nie jest cofana przez późniejszy błąd. Po etapie
  osobna animacja tłumaczy roczne 28 000 telefonów jako około 240 metrów i PKiN.
- `Próg Miliona` usuwa model bossa, wózek widłowy, pasek życia i ataki bossa.
  Jest deterministycznym autorskim mastery runem z dwunastoma różnymi
  kombinacjami i nieregularną częstotliwością.
- Finał miesza pojedyncze akcje, dublety, trzyakcjowe serie, długie łuki,
  nagradzające cisze i uczciwie zapowiedziane zmiany tempa. Identyczny wzór nie
  występuje bezpośrednio po sobie, burst ma odpoczynek, a pozorny odpoczynek nie
  ukrywa przeszkody.
- Cel paczek finału jest konfiguracją w zakresie 40–60, z wartością startową 50.
  Początek licznika jest automatycznie wyliczany jako milion minus cel. Każda
  zebrana paczka dodaje dokładnie jeden; pominięte paczki wracają w bezpiecznych
  odcinkach.
- Po milionie gracz zachowuje kontrolę przez kilka sekund nagradzającego biegu,
  następnie ogląda celebrację i jawne przejście zasad do Trybu Wyzwania.
- Pierwsze przejście story → challenge zachowuje wynik, paczki, combo i aktywne
  bonusy. Retry po game over zeruje wynik, paczki i bonusy, ustawia combo ×1,
  lecz zachowuje rekord i statystyki profilu.
- Początkowa krzywa prędkości fabuły wynosi kolejno: 0,95→1,15; 1,10→1,35;
  1,22→1,48; 1,34→1,58; 1,45→1,70; 1,55→1,85. Wartości są konfigurowalne i
  podlegają korekcie po playtestach.
- Po karcie fabularnej następuje 3–4-sekundowy bezpieczny powrót. Prędkość
  zaczyna blisko 95% końca poprzedniego etapu, osiąga ten koniec w 8–10 sekund i
  następnie go przekracza.
- Tryb Wyzwania zaczyna około 1,85×, dochodzi do około 2,4× po 60 sekundach,
  około 3,0× po 120 sekundach i maksymalnie 3,5× po 180 sekundach. Po osiągnięciu
  limitu zwiększa długość sekwencji, presję i zmienność rytmu bez naruszania
  minimalnego czasu reakcji.
- Proceduralne cykle wyzwania trwają około 20–30 sekund. W jednym cyklu rośnie
  jedna dominująca oś: prędkość, gęstość, złożoność, precyzja albo presja. Burst
  zawsze kończy się oddechem.
- Punkt pojawienia się przeszkody wynika z aktualnej prędkości i minimalnego
  czasu reakcji, dlatego przy 3,5× obiekt powstaje odpowiednio dalej poza prawą
  krawędzią zamiast nagle przed graczem.
- Combo jest stanem falowym. Zaliczenie zwiększa je o jeden, perfekcyjna fala
  zwiększa je o jeden i przyznaje oddzielny bonus, a niezaliczenie resetuje.
  Mnożnik następnej fali ma limit ×8. Pojedyncze paczki nadal przyznają bazowe
  punkty.
- `AUDYT` przez około siedem sekund zwiększa odstępy generatora bez zmiany
  prędkości świata. `DRUGIE ŻYCIE` przez około siedem sekund podwaja wynik i ma
  stałą etykietę `×2 WYNIK`. `GWARANCJA` jest jednym widocznym ładunkiem tarczy.
- Bonusy pojawiają się po trudnej serii na czytelnej trasie, nigdy na przeszkodzie
  ani wewnątrz niebezpiecznej fali. Jednocześnie aktywne mogą być najwyżej dwa.
- Pierwsze użycie każdego bonusu uruchamia jednorazową demonstrację w naturalnej
  bezpiecznej przerwie. Przez pierwsze około 1,2 sekundy wejścia są odrzucane.
  Kolejne zebrania nie zatrzymują rozgrywki, a pauza zawiera sekcję pomocy
  `Bonusy`.
- `S` i strzałka w dół są równoważne. Krótkie naciśnięcie daje minimum około
  300 ms ślizgu, przytrzymanie go wydłuża, puszczenie kończy po minimum, a bufor
  wejścia wynosi około 100–120 ms. Gest w dół odpowiada krótkiemu naciśnięciu.
- HUD ma jeden slot celu. Używa realnego przedmiotu, krótkiego działania i
  licznika: `RUCHY 2/4`, `FALE ZATORU 3/8`, `SPRAWDZONE 2/4 · KROK 1/3`,
  `ROZWÓJ 2/3`, nazwa strefy przepływu oraz fizyczny licznik miliona.
- Duży napis `CEL WYKONANY` nie jest używany. Ukończenie etapu zamyka wskaźnik,
  odtwarza akord, zatrzymuje spawn, pozwala obiektom opuścić kadr, uruchamia
  4–6-sekundową trasę nagród i pokazuje rezultat w tle przed kartą historii.
- Hierarchia informacji zwrotnej to: zebranie paczki, zaliczenie/perfect/retry
  fali, combo, pierwsza demonstracja bonusu, próg paczek w bezpiecznej strefie i
  rezultat rozdziału. Jednocześnie występuje najwyżej jeden duży efekt.
- Tło zachowuje dwupłytową paralaksę w gameplay. Kolejny świat wjeżdża z prawej
  przy aktualnej prędkości zamiast korzystać z nagłej zamiany lub fade to black.
- Przejście do historii ma fazy `kamera biegu → settle → kamera historii`.
  Każda scena deklaruje punkt skupienia i bezpieczny kadr odczytu. Tekst pojawia
  się dopiero po wycentrowaniu tła, a powrót do gry łączy się z zachowaną fazą
  ruchu.
- W trybie ograniczonego ruchu tło pozostaje widoczne i przesuwa się liniowo z
  30–40% normalnej prędkości. Zoom, bounce, pulse, shake i agresywny settle są
  wyłączone, a centrowanie historii używa łagodnego przenikania.
- Muzyka jest ciągła i warstwowa. Rozdział zmienia jedną warstwę rytmiczną,
  burst dodaje perkusję, oddech ją usuwa, sukces fali ma krótki sygnał w górę,
  perfekcja bogatszy, a retry neutralny i niski. Każdy akt finału dodaje warstwę,
  a milion domyka harmonię.
- Konfiguracja przechowuje skrypty fal, przeszkody i akcje, ścieżki paczek,
  cadence, bezpieczne odstępy, krzywe prędkości, próg 60%, cel finału, bonusy,
  czasy payoff/settle oraz współczynniki mobile i reduced motion. Silnik posiada
  fizykę, kolizje, walidację i zasady uczciwości.
- Walidator odrzuca niewykonalne przejścia, zbyt krótki czas reakcji, kolizję
  ścieżki nagrody z przeszkodą, nieznany wariant oraz sekwencję niewykonalną przy
  zadanej prędkości. Błąd QA wskazuje konkretny poziom, falę i warunek.
- Lokalne QA zapisuje do kopiowalnego JSON: czas segmentu, próby na falę,
  współczynnik zbierania, pomyłki skok/ślizg, powtórzenia fal, combo, czas i
  prędkość śmierci w wyzwaniu, powód kolizji, FPS i utracone klatki. Nie powstaje
  serwer, PII ani nowy produkcyjny tracking.

## Testing Decisions

- Testy opisują widoczne zachowanie gry i publiczne snapshoty stanu, nie
  prywatne metody, selektory, liczbę prymitywów canvas ani dokładne współrzędne
  cząstek.
- Najwyższym głównym szwem jest istniejący integracyjny lifecycle pełnego
  production flow. Pierwszy tracer obejmuje start `Pierwszej paczki`, wszystkie
  osiem fal `Zatoru Zamówień`, powtórzenie po błędzie, domknięcie celu, payoff,
  wycentrowanie tła i wejście do następnej karty.
- Ten sam szew po rozszerzeniu przechodzi wszystkie sześć mikropoziomów,
  celebrację miliona, zachowanie stanu przy story → challenge, game over oraz
  czysty retry Trybu Wyzwania.
- Drugim, niższym szwem jest czysty walidator i symulator fal. Dla każdej fali
  sprawdza przewidywany czas reakcji, wykonalność trajektorii skoku/ślizgu,
  odseparowanie hitboxów, próg 60%, brak niewykonalnych przejść i możliwość
  ukończenia przy maksymalnej zadanej prędkości.
- Test skryptu fabularnego potwierdza, że etap nie kończy się samym timerem,
  niezaliczona fala wraca bez zmiany parametrów, a ukończenie wymaga minimalnego
  czasu i celu.
- Test `Zatoru Zamówień` potwierdza osiem fal z przeszkodą i 3–4 paczkami, trzy
  fazy przemiany, poprawny licznik i brak przejścia po zaledwie kilku akcjach.
- Test jakości potwierdza trzy fale na urządzenie, trwałość ukończonych stempli,
  reset wyłącznie bieżącego urządzenia i finałową sekwencję trzech akcji.
- Test rozwoju klienta potwierdza kolejność trzech potwierdzonych faktów,
  nieobecność tekstu podczas aktywnej gry i debiut `DRUGIEGO ŻYCIA` w drugiej
  fazie.
- Test skali potwierdza trzy strefy po trzy fale, zachowanie ukończonej strefy i
  poprawne przejście do animacji 28 000 telefonów / około 240 m / PKiN.
- Test finału potwierdza automatyczne wyliczenie licznika, różne cele 40, 50 i 60,
  inkrementację wyłącznie przez zebraną paczkę, bezpieczny powrót pominiętej
  paczki, dwanaście kombinacji, brak kolejnych identycznych wzorów i brak modelu
  bossa lub wózka widłowego.
- Test trudności sprawdza zaakceptowane punkty krzywych fabuły oraz wyzwania,
  limit 3,5×, dalszy wzrost innych osi po limicie i brak jednoczesnego wzrostu
  wszystkich osi w jednym cyklu.
- Test generatywny używa wielu deterministycznych seedów i potwierdza, że każdy
  proceduralny układ Trybu Wyzwania składa się wyłącznie ze zwalidowanych
  klocków, zachowuje co najmniej 1,2 sekundy reakcji i jest wykonalny przy 3,5×.
- Test wejścia sprawdza równoważność `S` i strzałki w dół, minimum 300 ms,
  przedłużenie przytrzymaniem, bufor 100–120 ms, gest w dół oraz zgodność hitboxu
  z animacją.
- Test combo obserwuje zaliczenie, perfect, niezaliczenie, ochronę gwarancji,
  bazowe punkty paczek i limit ×8 na granicach fal.
- Test bonusów potwierdza czas efektów, widoczny licznik, jeden ładunek tarczy,
  maksymalnie dwa aktywne bonusy, bezpieczne położenie, pojedynczą demonstrację i
  1,2-sekundowe odrzucenie resztkowego wejścia.
- Test kolizji rozróżnia fabułę, zabezpieczone wyzwanie i niezabezpieczone
  wyzwanie oraz sprawdza kolejność uderzenie → skutek → powtórzenie lub wynik.
- Test HUD sprawdza semantyczny tekst i stan dla każdego poziomu na desktopie i
  390 px. Manualny test z nowymi użytkownikami wymaga, aby większość poprawnie
  wyjaśniła cel bez dodatkowej instrukcji.
- Test przejścia świata obserwuje ciągłość fazy i prędkości, wejście następnego
  świata z prawej, settle do zadeklarowanego kadru, pojawienie tekstu po settle i
  płynny powrót do gameplay.
- Test `reduced motion` potwierdza widoczne tło, 30–40% prędkości liniowej, brak
  intensywnych transformacji oraz zachowanie wszystkich informacji.
- Test audio korzysta z istniejącego mocka cue i sprawdza hierarchię sygnałów,
  warstwy finału, wyciszenie oraz to, że brak audio nie usuwa informacji
  wizualnej.
- Test responsywny i ręczny obejmuje desktop, telefon 390 px, Safari oraz
  przeglądarki Chromium. Ten sam seed ma być logicznie równie wykonalny, choć
  kadr nie musi być pikselowo identyczny.
- Test wydajności mierzy FPS i utracone klatki podczas najgęstszej poprawnej
  sekwencji przy 3,5×, aktywnej paralaksie, HUD i dozwolonym efekcie nagrody.
- Kryterium balansu fabuły: 70–85% fal powinno być zaliczanych za pierwszym
  razem przez testerów docelowych. Wynik powyżej 85% wskazuje zbyt małe
  wyzwanie, a poniżej 70% zbyt dużą trudność lub nieczytelność.
- Kryterium czasu: obowiązkowa interakcja wraz z payoffami mieści się około pięciu
  minut, a typowe pierwsze przejście z czytaniem trwa około 6–8 minut.
- Kryterium wyzwania: mediana pierwszej próby po fabule wynosi 60–90 sekund, a
  finał jest oceniany jako najbardziej różnorodny i intensywny poziom.
- Prior art stanowią istniejące testy lifecycle silnika i kontrolera kampanii,
  uczciwości spawnu, autorskich wzorów nagród, fizyki, punktacji, bonusów,
  progresji fabuły, bramki wejścia kart, paralaksy, audio, responsywnego canvas i
  autonomicznego HTML.

## Out of Scope

- Voice-over i nagrywanie narracji.
- Trzeci ruch, zmiana pasów, walka, atak lub dodatkowy przycisk akcji.
- Boss, pasek życia bossa, wózek widłowy i osobne ataki bossa.
- Ukryty `adaptive assist`, dynamiczne ułatwienia po dwóch porażkach lub
  personalizowanie fizyki dla konkretnego gracza.
- Game over w fabularnych mikropoziomach.
- Losowe generowanie głównej fabuły; fabuła korzysta z autorskich skryptów.
- Backend telemetryczny, konta, PII, serwerowe leaderboardy i nowe zdarzenia
  produkcyjne poza już zatwierdzonym minimalnym trackingiem.
- Voice-over liczb, dodatkowe teksty pod aktywną rozgrywką i duże overlaye
  `CEL WYKONANY`.
- Zmiana zatwierdzonej osi historii firmy lub dopisywanie niepotwierdzonych
  faktów marketingowych.
- Uznanie 50 finałowych paczek za publiczny fakt marketingowy; jest to parametr
  balansu gry.
- Gwarantowanie identycznego układu pikseli na desktopie i telefonie.
- Rozbudowa udostępniania społecznościowego, CTA landingu i ekranu wyników poza
  zmianami koniecznymi do poprawnego przejścia Trybu Wyzwania.

## Further Notes

- Specyfikacja zastępuje gameplayowe decyzje v6 dotyczące ośmiu krótkich
  fragmentów, finału 30 paczek, walki z bossem, limitu 2,2× i adaptacyjnego
  poszerzania odstępów. Zachowuje zatwierdzoną czytelność fabuły, jedną główną
  historię klienta, sterowanie jedną ręką, minimum 390 px oraz istniejący system
  celebracji paczek.
- Pierwsza implementacja ma być pionowym wycinkiem: wspólny silnik i walidator
  fal, combo falowe, spawn zależny od czasu reakcji, lokalny raport QA oraz pełne
  przebudowanie `Pierwszej paczki` i `Zatoru Zamówień`. Dopiero playtest tego
  wycinka na desktopie, 390 px, Safari i Chromium odblokowuje skalowanie wzorca
  na pozostałe poziomy.
- Po wycinku należy zweryfikować 60-procentowy próg, tempo powtórek, krzywą
  przyspieszenia, czytelność semantycznego HUD oraz przejście tła do kadru
  historii. Wartości konfiguracyjne mogą być zmienione na podstawie wyników, ale
  zasady zaliczenia, brak adaptacyjnej pomocy i cel opowiadania historii pozostają
  stałe.
- Najważniejszym testowym szwem pozostaje pełny production flow, a walidator fal
  jest celowo jedynym dodatkowym niskim szwem. Pozostałe testy powinny korzystać
  z tych granic lub z istniejących publicznych snapshotów zamiast tworzyć nowe
  interfejsy wyłącznie dla testów.
