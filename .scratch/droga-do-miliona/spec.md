# Droga do Miliona v5 — przebudowa narracji, świata i finału

Status: ready-for-agent

## Problem Statement

Obecna wersja gry nie opowiada historii AMSO w sposób wystarczająco jasny. Testy
pokazały, że część odbiorców nie rozumie ciągu przyczynowo-skutkowego, nie zawsze
odróżnia historię AMSO od historii klientów, a niektóre fakty pojawiają się bez
kontekstu albo w tempie niedopasowanym do ilości tekstu.

Warstwa wizualna dodatkowo utrudnia odbiór. Abstrakcyjne linie, plamy, chmury,
znaczniki, wielkie ikony i unoszące się liczby nie wyjaśniają wydarzeń. Część
elementów jest przycięta, znajduje się na różnych poziomach, znika na ciemnym tle
albo przypomina obiekt interaktywny mimo że jest dekoracją. Licznik zamówień,
bonusy, gwarancja oraz finałowe symbole nie komunikują swojej funkcji. Czerwone
gwiazdy na paczkach i przy kurierze są estetycznie nieakceptowalne i wywołują
niepożądane skojarzenia.

Rozgrywka również wymaga uporządkowania. Paczki i przeszkody powtarzają zbyt mało
wzorów, potrafią nakładać się na siebie oraz pojawiać już w widocznym obszarze.
Gwarancja może zostać zużyta w bezpiecznym trybie fabularnym, gdzie nie daje
istotnej korzyści. Finał nie stanowi wystarczającego wyzwania i nie komunikuje
jednoznacznie przejścia do trybu, w którym pierwsza niezabezpieczona kolizja kończy
próbę.

Gra musi zostać przebudowana tak, aby tło, animacja, tekst i mechanika wspólnie
opowiadały tę samą historię, a każdy element widoczny na ekranie miał czytelną
funkcję.

## Solution

Gra stanie się około siedmiominutową, sterowaną przez gracza opowieścią o drodze
AMSO od pierwszej paczki do progu miliona zamówień. Krótkie, bezpieczne sekwencje
narracyjne będą przeplatać się z aktywną rozgrywką. Każda sekwencja pokaże
konkretne miejsce, osobę, urządzenie albo proces. Tekst będzie podzielony na
krótkie kroki i nie zmieni się bez działania gracza.

Abstrakcyjne plansze zostaną zastąpione spójnymi, warstwowymi ilustracjami
wektorowymi utrzymanymi w jasnej palecie kampanii. Prawdziwe historie klientów
otrzymają anonimowych bohaterów i jednoznaczne oznaczenie `Historia klienta`, a
historia firmy — `Nasza historia`. Liczby będą najpierw wyjaśniane, a dopiero potem
zamieniane w animowane porównania.

Dotychczasowi abstrakcyjni bossowie zostaną zastąpieni wyzwaniami wynikającymi z
fabuły: `Zator Zamówień`, `Próba Jakości`, `Wyzwanie Dopasowania`, `Szczyt
Zamówień` i `Próg Miliona`. Finał połączy zebranie 30 paczek z ośmioma
sprawdzającymi umiejętności kombinacjami. Licznik wzrośnie od `999 970` do
`1 000 000`, po czym gra uczci wynik i jawnie przejdzie do trudniejszego trybu
wyzwania bez resetowania rezultatu.

System generowania otrzyma większą bibliotekę bezpiecznych wzorów paczek i
przeszkód. Cała fala będzie powstawać poza prawą krawędzią pola i płynnie wjeżdżać
do kadru. Bonusy dostaną jednoznaczne opakowania i opisy, a gwarancja stanie się
stale widoczną, jednoładunkową ochroną przeznaczoną dla trybu wyzwania.

## User Stories

1. Jako osoba odwiedzająca stronę kampanii chcę od razu zrozumieć, że gram w historię drogi AMSO do miliona zamówień, abym wiedziała, czego dotyczy doświadczenie.
2. Jako osoba uruchamiająca grę po raz pierwszy chcę zobaczyć krótkie intro, abym rozumiała cel gry i jej związek z kampanią.
3. Jako nowy gracz chcę przejść niemożliwy do przegrania samouczek, abym nauczył się skoku, ślizgu i zbierania paczek.
4. Jako nowy gracz chcę zobaczyć wzrost licznika po zebraniu pierwszej paczki, abym rozumiał związek paczek z drogą do miliona.
5. Jako nowy gracz chcę otrzymać krótkie wyjaśnienie przeszkód i bonusów, abym rozumiał ich funkcje przed właściwą grą.
6. Jako powracający gracz chcę pominąć pełne intro i zobaczyć tylko krótkie przypomnienie, abym szybciej wrócił do gry.
7. Jako powracający gracz chcę móc ponownie otworzyć pełną instrukcję, abym mógł odświeżyć zasady na żądanie.
8. Jako gracz chcę sterować tempem każdej sceny tekstowej, abym miał wystarczająco dużo czasu na przeczytanie treści.
9. Jako gracz chcę widzieć tylko jedną myśl w jednym kroku narracji, abym nie musiał przyswajać zbyt dużej ilości tekstu naraz.
10. Jako gracz chcę mieć pewność, że podczas czytania nie pojawiają się przeszkody, abym mógł bezpiecznie skupić się na historii.
11. Jako gracz chcę, aby podczas autopolita nie pojawiały się niemożliwe do zebrania paczki, abym nie czuł frustracji.
12. Jako gracz chcę rozpoznać scenę dotyczącą AMSO po etykiecie `Nasza historia`, abym nie przypisywał firmie doświadczeń klientów.
13. Jako gracz chcę rozpoznać opowieść klienta po etykiecie `Historia klienta`, abym wiedział, czyją historię właśnie poznaję.
14. Jako gracz chcę zobaczyć anonimowych, ale ludzkich bohaterów historii klientów, abym mógł zrozumieć ich sytuację bez naruszania prywatności.
15. Jako gracz chcę zobaczyć pierwszy mały sklep i magazyn wielkości kawalerki, abym rozumiał skalę początku AMSO.
16. Jako gracz chcę zobaczyć pierwszą paczkę przygotowywaną własnymi rękami, abym poznał ludzki początek historii.
17. Jako gracz chcę zobaczyć narastający zator paczek i zadań, abym rozumiał, dlaczego firma potrzebowała procesów.
18. Jako gracz chcę pokonać `Zator Zamówień`, abym przez rozgrywkę uczestniczył w przejściu od improwizacji do uporządkowanego procesu.
19. Jako gracz chcę zobaczyć ten sam magazyn przed i po uporządkowaniu, abym rozumiał skutek ukończenia wyzwania.
20. Jako gracz chcę zobaczyć konkretne etapy `PRZYJĘCIE`, `KONTROLA`, `PAKOWANIE` i `WYSYŁKA`, abym rozumiał, czym jest proces zamówienia.
21. Jako gracz chcę zobaczyć urządzenie przechodzące przez ręce serwisanta, abym rozumiał, że sprzęt jest sprawdzany przed sprzedażą.
22. Jako gracz chcę zobaczyć uruchomienie, przygotowanie i zapakowanie urządzenia, abym rozumiał sens obietnicy jakości.
23. Jako gracz chcę ukończyć `Próbę Jakości`, abym zbudował zaufanie poprzez działanie, a nie abstrakcyjny komunikat.
24. Jako gracz chcę widzieć postęp czterech serii kontroli, abym wiedział, ile pozostało do ukończenia próby.
25. Jako gracz chcę, aby błąd powtarzał tylko bieżącą serię jakości, abym nie tracił całego postępu fabuły.
26. Jako gracz chcę zobaczyć sprawdzony laptop jako narzędzie kreatywnego startu klientki, abym zrozumiał praktyczną wartość sprzętu.
27. Jako gracz chcę obserwować rozwój skromnego stanowiska w studio i portfolio, abym widział skutek decyzji klientki.
28. Jako gracz chcę poznać klienta rozpoczynającego działalność z budżetem do 400 zł, abym rozumiał punkt wyjścia drugiej historii.
29. Jako gracz chcę zobaczyć, że klient wybrał laptop za 300 zł, abym znał konkretny pierwszy krok.
30. Jako gracz chcę zobaczyć powrót tego klienta po roku z budżetem 100 000 zł, abym odczuł skalę rozwoju jego firmy.
31. Jako gracz chcę widzieć pierwszy laptop także w rozwiniętej firmie, abym rozumiał ciągłość historii.
32. Jako gracz chcę poznać firmę, która przeznaczyła 10% przygotowanego budżetu na test, abym rozumiał jej początkową ostrożność.
33. Jako gracz chcę zobaczyć urządzenia używane przez pracowników po zamówieniu testowym, abym rozumiał, co zbudowało zaufanie.
34. Jako gracz chcę zobaczyć realizację pozostałej części zakupu po udanym teście, abym wiedział, że próba zakończyła się decyzją zakupową.
35. Jako gracz chcę zobaczyć przejście siedmiu lat i współczesne biuro, abym rozumiał upływ czasu.
36. Jako gracz chcę dowiedzieć się, że po siedmiu latach klient nadal wybiera sprzęt poleasingowy, abym poznał finał tej historii.
37. Jako gracz chcę przechodzić historie klientów jako animowane sekwencje w jednym środowisku, abym nie odbierał ich jako oderwanych kart marketingowych.
38. Jako gracz chcę ukończyć `Wyzwanie Dopasowania`, abym zrozumiał, że dobry wybór oznacza dopasowanie sprzętu do potrzeb, planów i budżetu.
39. Jako gracz chcę złożyć trzy różne zestawy dla trzech poznanych klientów, abym zobaczył, że różne potrzeby wymagają różnych rozwiązań.
40. Jako gracz chcę najpierw poznać pochodzenie liczby 28 000 smartfonów rocznie, abym wiedział, co przedstawia późniejsza animacja.
41. Jako gracz chcę zobaczyć, jak roczna liczba smartfonów tworzy wieżę około 240 metrów obok PKiN, abym mógł wyobrazić sobie skalę.
42. Jako gracz chcę najpierw poznać pochodzenie 400 000 kg komputerów wysyłanych rocznie, abym rozumiał podstawę porównania.
43. Jako gracz chcę zobaczyć porównanie tej masy z pięcioma załadowanymi Boeingami 737, abym mógł wyobrazić sobie skalę logistyki.
44. Jako gracz chcę zobaczyć zespół i magazyn za tymi liczbami, abym nie traktował faktów jak oderwanej infografiki.
45. Jako gracz chcę zobaczyć okres, kategorię i jednostkę przy każdej liczbie, abym rozumiał jej zakres.
46. Jako gracz chcę przejść `Szczyt Zamówień`, abym doświadczył konsekwencji rosnącej skali firmy.
47. Jako gracz chcę przejść trzy coraz trudniejsze fazy szczytu zamówień, abym odczuł eskalację bez nagłego i zbyt krótkiego bossa.
48. Jako gracz chcę widzieć realne zamówienia komputerów, notebooków, monitorów i telefonów, abym rozumiał zadanie logistyczne.
49. Jako gracz chcę zobaczyć pracowników obsługujących opanowany przepływ zamówień, abym rozumiał, że skalę wspierają procesy i zespół.
50. Jako gracz chcę wejść do finału `Próg Miliona`, abym odczuł kulminację bez traktowania miliona jako końca historii.
51. Jako gracz chcę zobaczyć licznik zaczynający się od `999 970`, abym rozumiał, ile paczek pozostało do progu miliona.
52. Jako gracz chcę, aby każda zebrana paczka zwiększała licznik dokładnie o jeden, abym rozumiał sens mechaniki.
53. Jako gracz chcę zebrać 30 paczek i ukończyć osiem kombinacji, abym musiał wykazać się zarówno konsekwencją, jak i umiejętnością.
54. Jako gracz chcę, aby pominięta paczka wróciła w bezpiecznym wzorze, abym nie został zablokowany przez pojedynczy błąd.
55. Jako gracz chcę widzieć osobno postęp `PACZKI 0/30` i `KOMBINACJE 0/8`, abym rozumiał oba warunki finału.
56. Jako gracz chcę zobaczyć czytelną tablicę zamówień z podpisem `ZAMÓWIEŃ`, abym wiedział, co zliczają cyfry.
57. Jako gracz chcę widzieć równe, stabilne cyfry licznika, abym bez trudu odczytywał jego wartość.
58. Jako gracz chcę zobaczyć świąteczną przemianę `1 000 000`, abym odczuł znaczenie osiągnięcia.
59. Jako gracz chcę zobaczyć reakcję zespołu i milionową paczkę, abym rozumiał, że świętujemy realny moment historii.
60. Jako gracz chcę otrzymać komunikat, że droga trwa dalej, abym nie uznał miliona za koniec gry.
61. Jako gracz chcę zobaczyć jawny ekran przejścia do `TRYBU WYZWANIA`, abym wiedział, że zmieniają się zasady.
62. Jako gracz chcę przeczytać, że zachowuję wynik i paczki, abym nie obawiał się utraty postępu.
63. Jako gracz chcę przeczytać, że tempo wzrośnie, a pierwsza niezabezpieczona kolizja zakończy próbę, abym świadomie podjął wyzwanie.
64. Jako gracz chcę potwierdzić przejście przyciskiem `Podejmuję wyzwanie`, abym nie został zaskoczony nagłą zmianą trybu.
65. Jako gracz chcę rozpocząć challenge po odliczeniu `3–2–1`, abym odzyskał gotowość do sterowania.
66. Jako gracz chcę kontynuować ten sam wynik po przejściu do challenge, abym traktował oba tryby jako jedną drogę.
67. Jako gracz chcę, aby pierwsza niezabezpieczona kolizja w challenge kończyła próbę, abym odczuwał realne ryzyko.
68. Jako gracz chcę widzieć aktywną gwarancję wokół kuriera i w HUD, abym wiedział, że mam ochronę.
69. Jako gracz chcę zachować gwarancję podczas bezpiecznego trybu fabularnego, abym nie tracił jej bez istotnej korzyści.
70. Jako gracz chcę, aby gwarancja ochroniła mnie przed jedną kolizją w challenge, abym rozumiał jej konkretną wartość.
71. Jako gracz chcę zobaczyć rozbicie osłony i komunikat o uratowaniu próby, abym wiedział, że gwarancja została zużyta.
72. Jako gracz chcę, aby gwarancje nie kumulowały się ponad jedną, abym miał prosty i przewidywalny stan ochrony.
73. Jako gracz chcę rozpoznawać zwykłą paczkę jako karton z etykietą kategorii, abym nie mylił jej z bonusem.
74. Jako gracz chcę rozpoznawać paczkę `BONUS` po firmowej taśmie i etykiecie, abym wiedział, że daje dodatkowe punkty.
75. Jako gracz chcę zobaczyć `+350 pkt` po zebraniu bonusu, abym rozumiał jego wartość.
76. Jako gracz chcę rozpoznawać `AUDYT`, `2× PUNKTY` i `OCHRONA 48 M` po pełnych nazwach, abym nie musiał interpretować pojedynczych liter.
77. Jako gracz chcę otrzymać jedno krótkie wyjaśnienie przy pierwszym zebraniu każdego bonusu, abym później rozpoznawał go bez przerywania gry.
78. Jako gracz chcę widzieć serię w HUD jako `SERIA ×N`, abym rozumiał wpływ czystej gry na wynik.
79. Jako gracz chcę widzieć subtelne pasy ruchu przy wysokiej serii, abym odczuwał wzrost bez niezrozumiałej gwiazdy przy postaci.
80. Jako gracz chcę grać bez czerwonych i pięcioramiennych gwiazd, abym nie napotykał nieakceptowalnej symboliki.
81. Jako gracz chcę zbierać tylko paczki, a nie osiem abstrakcyjnych symboli, abym rozumiał przedmioty finału.
82. Jako gracz chcę widzieć różne liczby i układy paczek, abym nie miał poczucia ciągłego powtarzania tego samego wzoru.
83. Jako gracz chcę napotykać różne sekwencje przeszkód, abym musiał korzystać zarówno ze skoku, jak i ślizgu.
84. Jako gracz chcę, aby ten sam wzór nie pojawiał się dwa razy z rzędu, abym odczuwał kontrolowane urozmaicenie.
85. Jako gracz chcę, aby trudniejsze wzory pojawiały się dopiero po nauczeniu odpowiednich działań, abym nie był karany za nieznaną mechanikę.
86. Jako gracz chcę, aby przeszkody i paczki wjeżdżały płynnie z prawej strony, abym nie widział ich nagłego pojawiania się przed postacią.
87. Jako gracz chcę mieć czas reakcji wyliczany z aktualnej prędkości, abym otrzymywał uczciwe kombinacje także w challenge.
88. Jako gracz chcę, aby paczki nigdy nie nakładały się na przeszkody, abym widział możliwą do wykonania trasę.
89. Jako gracz chcę, aby bonus nie wymagał działania sprzecznego z najbliższą przeszkodą, abym mógł podjąć świadomą decyzję.
90. Jako gracz chcę grać w jednym spójnym świecie magazynu, serwisu i klientów, abym nie odbierał tła jako przypadkowych dekoracji.
91. Jako gracz chcę widzieć wszystkie obiekty osadzone na wspólnej linii podłoża, abym rozumiał przestrzeń i kolizje.
92. Jako gracz chcę odróżniać dekorację od przeszkody po kontraście i sylwetce, abym nie wykonywał niepotrzebnych uników.
93. Jako gracz chcę widzieć ilustrację i tekst obok siebie na szerokim ekranie, abym mógł śledzić oba elementy historii.
94. Jako użytkownik telefonu chcę zobaczyć ilustrację nad tekstem, abym zachował czytelność w pionowym układzie.
95. Jako użytkownik strony AMSO chcę, aby gra mieściła się w kontenerze o maksymalnej szerokości 1600 px, abym odbierał ją jako część strony.
96. Jako użytkownik szerokiego monitora chcę, aby gra pozostawała wyśrodkowana powyżej 1600 px, abym nie widział nadmiernie rozciągniętej sceny.
97. Jako użytkownik urządzenia o szerokości 390 px chcę móc korzystać ze wszystkich funkcji gry, abym nie był wykluczony przez układ.
98. Jako użytkownik urządzenia poniżej 390 px chcę otrzymać czytelny komunikat o wymaganej przestrzeni, zamiast uszkodzonego interfejsu.
99. Jako użytkownik preferujący ograniczony ruch chcę zobaczyć zrozumiałe statyczne stany końcowe animacji, abym mógł poznać całą historię bez intensywnego ruchu.
100. Jako gracz chcę korzystać z zawsze jasnej palety kampanii, abym nie widział znikających ilustracji w automatycznym dark mode.
101. Jako gracz kończący próbę chcę zobaczyć duży `Wynik łączny`, abym od razu znał rezultat całej drogi.
102. Jako gracz kończący próbę chcę zobaczyć osobny `Wynik wyzwania`, abym wiedział, ile zdobyłem po progu miliona.
103. Jako gracz kończący próbę chcę porównywać `Twój rekord wyzwania`, abym porównywał wyniki uzyskane na tych samych zasadach.
104. Jako gracz po pierwszej próbie chcę zobaczyć `Pierwszy wynik wyzwania`, zamiast mylącego rekordu, abym rozumiał, że nie mam jeszcze porównania.
105. Jako gracz chcę zachować jednorazowy bonus ukończenia fabuły w wyniku łącznym, ale nie w rekordzie challenge, abym miał uczciwe porównanie kolejnych prób.
106. Jako gracz chcę zobaczyć liczbę paczek i przebyty dystans jako dane drugorzędne, abym otrzymał kontekst bez przeładowania ekranu.
107. Jako gracz chcę widzieć informację o uratowaniu próby tylko wtedy, gdy gwarancja rzeczywiście zadziałała, abym nie widział pustej statystyki zero.
108. Jako gracz chcę zachować duży znak `1 000 000 ZAMÓWIEŃ` na ekranie wyniku, abym widział powiązanie z kampanią.
109. Jako gracz chcę otrzymać jeden główny przycisk ponownej próby, jeden przycisk udostępnienia i tekstowy link do historii, abym łatwo wybrał następny krok.
110. Jako gracz chcę udostępnić wynik na Facebooku lub Instagramie, abym mógł podzielić się rezultatem w wybranych kanałach kampanii.
111. Jako użytkownik klawiatury chcę obsługiwać dialogi, przyciski, pauzę i grę bez myszy, abym mógł korzystać z całego doświadczenia.
112. Jako użytkownik czytnika ekranu chcę otrzymywać komunikaty o celu, bonusach, ochronie i zmianie trybu, abym rozumiał stan gry bez polegania wyłącznie na obrazie.
113. Jako marketing AMSO chcę edytować tekst jako treść HTML/konfiguracyjną niezależną od ilustracji, abym mógł dopracować copy bez ponownego rysowania scen.
114. Jako marketing AMSO chcę otrzymać osobny copydeck z perspektywą, faktami i miejscem na akceptację każdej sceny, abym mógł zatwierdzić materiał przed publikacją.
115. Jako marketing AMSO chcę potwierdzić dokładny zakres testów serwisowych przed ich nazwaniem, abym nie publikował niezweryfikowanych obietnic.
116. Jako marketing AMSO chcę potwierdzić każdą liczbę, okres i porównanie, abym miał pewność, że kampania podaje aktualne dane.
117. Jako właściciel kampanii chcę mierzyć uruchomienia obu trybów i pełne ukończenie historii, abym znał podstawowe wykorzystanie bez rozbudowanego śledzenia zachowania.
118. Jako właściciel produktu chcę móc korygować czasy i poziom trudności w konfiguracji po testach, abym nie musiał przebudowywać fabuły.

## Implementation Decisions

- Kampania zachowuje podział na biblię narracyjną, scenariusz implementacyjny i
  osobny copydeck marketingowy. Konfiguracja runtime nie staje się źródłem prawdy
  dla niezatwierdzonych faktów.
- Pełne pierwsze przejście ma celować w około 7 minut bez czasu dodatkowo
  poświęconego przez gracza na czytanie: 35–45 sekund intro i samouczka, około 4
  minut aktywnej gry, 2–2,5 minuty kroków narracyjnych oraz maksymalnie 15 sekund
  celebracji i przejścia do challenge. Czasy pozostają konfigurowalne po testach.
- Tekst fabularny występuje wyłącznie w bezpiecznych, sterowanych przez gracza
  scenach. Nie ma dolnego tekstu podczas aktywnej gry. Jeden krok zawiera jedną
  myśl i zwykle 12–24 słowa. Copy nie znika bez działania użytkownika.
- Pierwsze uruchomienie zawiera interaktywny, niemożliwy do przegrania samouczek:
  skok, ślizg, zebranie pierwszej paczki, wzrost licznika i krótkie objaśnienie
  bonusów. Powtórne uruchomienie pokazuje skrót z opcją ponownego otwarcia pełnej
  instrukcji.
- Tryb fabularny nie ma game over. Kolizja może powtórzyć bieżącą niezakończoną
  kombinację, ale nie cofa ukończonych etapów historii. Nie zapisuje się częściowego
  postępu; dopiero pełne ukończenie ustawia stan ukończenia historii i odblokowuje
  bezpośredni start challenge.
- Autopilot, czytanie, odliczanie, celebracja i przejścia blokują generowanie
  przeszkód, zwykłych paczek i bonusów. Świat może zachować ruch wizualny, ale trasa
  jest jednoznacznie bezpieczna.
- Każda scena ma jeden z jednoznacznych znaczników: `Nasza historia`, `Historia
  klienta` albo `Wyzwanie`. Narracja AMSO używa perspektywy pierwszej osoby liczby
  mnogiej. Historie klientów używają trzeciej osoby i anonimowych postaci.
- Prawdziwe historie klientów są rozpisane na animowane kroki w jednym środowisku,
  nie na automatycznie zmieniające się karty. Krótkie historie AMSO mają 1–2 kroki,
  historia kreatywnego startu 3–4, historia rozwoju firmy 4, a historia testowego
  budżetu 5.
- Historia rozwoju firmy zachowuje fakty: klient rozpoczynał działalność, szukał
  laptopa do 400 zł, wybrał urządzenie za 300 zł, a po roku wrócił z budżetem
  100 000 zł. Pierwszy laptop pozostaje widoczny jako łącznik obu etapów.
- Historia B2B zachowuje fakty: pierwsze testowe zamówienie wykorzystało 10%
  przygotowanego budżetu, po udanym teście klient zrealizował pozostałą część
  zakupu, a siedem lat po tamtym zamówieniu nadal wybiera sprzęt poleasingowy. Nie
  wolno nazywać tego nieprzerwaną siedmioletnią współpracą bez osobnego
  potwierdzenia.
- Sekwencja skali najpierw podaje źródło, zakres i okres liczby, a dopiero potem
  pokazuje porównanie. Obejmuje około 28 000 smartfonów sprzedawanych rocznie,
  wieżę około 240 metrów wyższą od PKiN, około 400 000 kg komputerów wysyłanych
  rocznie oraz porównanie z pięcioma załadowanymi Boeingami 737. Finał sekwencji
  wraca do ludzi i magazynu stojących za liczbami.
- Roczne liczby kategorii — około 41 tys. PC, 76 tys. notebooków, 40 tys.
  monitorów i 28 tys. telefonów — mogą uzupełniać scenę skali, ale nie mogą być
  wielkimi, oderwanymi etykietami podczas aktywnej gry.
- `Kablowy Chaos` zostaje zastąpiony przez `Zator Zamówień`. Ten sam mały magazyn
  pokazuje stan przed wyzwaniem, realny zator paczek i stanowisk podczas niego oraz
  uporządkowany przepływ po ukończeniu.
- `Chmura Wątpliwości` i `Pan Wątpliwość` zostają zastąpione przez `Próbę
  Jakości`. Cztery serie działań przeprowadzają urządzenia przez widoczny proces
  serwisowy i kończą się statusem `SPRAWDZONY`. Konkretne testy sprzętowe wymagają
  potwierdzenia serwisu lub marketingu.
- `Budżetożerca` zostaje zastąpiony przez `Wyzwanie Dopasowania`. Trzy krótkie
  sekwencje składają zamówienia odpowiadające potrzebom trzech poznanych klientów.
  Teza brzmi: rozsądny wybór to sprzęt dopasowany do potrzeb, planów i budżetu, a
  nie po prostu najtańszy sprzęt.
- `Logistyczna Hydra` zostaje zastąpiona przez `Szczyt Zamówień`. Wyzwanie ma trzy
  fazy po około 20–25 sekund i pokazuje rosnący rzeczywisty przepływ zamówień
  różnych kategorii. Kolizja powtarza niezakończoną kombinację, ale nie kończy
  historii.
- `Fala Miliona` zostaje zastąpiona przez `Próg Miliona`. Nie stosuje się osobnego
  zbioru ośmiu abstrakcyjnych symboli. Gracz zbiera 30 paczek i kończy osiem
  kombinacji. Oba warunki są niezależnie widoczne i wymagane do celebracji.
- Licznik zaczyna się od `999 970` i rośnie dokładnie o jeden za każdą zebraną
  paczkę fabularną. Pominięta paczka wraca w następnym bezpiecznym, autorskim
  wzorze. Licznik jest fizyczną tablicą zamówień z podpisem `ZAMÓWIEŃ`, stałą
  szerokością cyfr i stabilną pozycją w świecie lub bezpiecznej strefie HUD.
- Przy `1 000 000` cyfry przechodzą w gradient pomarańczowy–koralowy–magenta,
  ramka tablicy rozświetla się, pojawiają się firmowe taśmy i etykiety zamiast
  uniwersalnego konfetti, zespół reaguje, a kurier prezentuje milionową paczkę.
  Celebracja trwa 3–4 sekundy w stanie bezpiecznym.
- Po celebracji pojawia się modal `TRYB WYZWANIA` z informacją, że wynik i paczki
  pozostają, tempo wzrasta, a pierwsza niezabezpieczona kolizja kończy próbę.
  Przycisk `Podejmuję wyzwanie` uruchamia odliczanie `3–2–1`. Wynik nie jest
  resetowany, a tekst fabularny nie pojawia się już podczas challenge.
- Gwarancja jest trwałym, jednoładunkowym zabezpieczeniem. Przedmiot ma formę
  gwarancyjnej karty z tarczą i etykietą `OCHRONA 48 M`. Po zebraniu kurier ma
  widoczny kontur ochronny, a HUD pokazuje `OCHRONA ×1`. Ochrona nie zużywa się w
  fabule, przechodzi do challenge, pochłania pierwszą kolizję, pokazuje komunikat
  o uratowaniu próby i nie kumuluje się ponad jedną sztukę.
- Wszystkie specjalne przedmioty zachowują formę paczek lub dokumentów ze świata
  dostawy: `BONUS`, `AUDYT`, `2× PUNKTY`, `OCHRONA 48 M`. Pierwsze zebranie
  pokazuje krótkie objaśnienie. HUD używa pełnych, zrozumiałych nazw.
- Paczka `BONUS` daje 350 punktów wobec 100 punktów standardowej paczki. Ma
  firmową taśmę i etykietę `BONUS`; po zebraniu pokazuje `+350 pkt`.
- Combo jest komunikowane jako `SERIA ×N` w HUD. Subtelne gradientowe smugi ruchu
  mogą wzmacniać wysoką serię. Usuwa się `iskrę zaufania` przy kurierze.
- W całej kampanii obowiązuje zakaz czerwonych i pięcioramiennych gwiazd, w tym na
  paczkach, przy kurierze, w nagrodach i dekoracjach.
- Generator paczek korzysta z 12–16 zatwierdzonych wzorów o liczebności od 1 do 7:
  szeregi, łuki, schody, fale, grupy rozdzielone odstępem, trasy przed i po akcji,
  rozgałęzienia i rzadkie grupy bonusowe. Ważony worek wzorów zapobiega
  bezpośrednim powtórzeniom i daje różnorodność przed rozpoczęciem kolejnego cyklu.
- Generator przeszkód korzysta z 16–20 zatwierdzonych, tematycznych wzorów
  złożonych z realnych obiektów magazynu: kartonów, palet, wózków, stołów i
  jednoznacznych konstrukcji do ślizgu. Wzory obejmują pojedyncze przeszkody,
  pary, naprzemienne sekwencje i kombinacje tematyczne dla głównych wyzwań.
- Cała fala — przeszkoda wraz z powiązanymi paczkami — powstaje w całości poza
  prawą krawędzią pola z dodatkowym zapasem i wjeżdża ze wspólną prędkością świata.
  Przeskalowanie viewportu nie może przenieść nowej fali bezpośrednio przed gracza.
- Minimalny czas reakcji jest obliczany na podstawie aktualnej prędkości. Paczki
  nie nachodzą na hitboxy przeszkód, bonus nie wymaga działania sprzecznego z
  przeszkodą, a każdy wzór ma potwierdzoną osiągalną trasę.
- Wszystkie główne obiekty świata stoją na wspólnej linii podłoża. Dekoracje są
  mniej kontrastowe niż przeszkody, nie naśladują hitboxów i nie wykorzystują
  przypadkowych krzywych, pinezek, chmur, wielkich ołówków ani unoszących się
  znaczników.
- Dziesięć głównych scen otrzymuje spójne, warstwowe SVG w stylu kampanii: ciepłe
  jasne tło, czarne kontury, czarna typografia i akcenty pomarańczowy, koralowy oraz
  magenta. Ludzie są stylizowani i anonimowi, a przedmioty pozostają realnie
  rozpoznawalne. Tekst nie jest osadzany w plikach graficznych.
- Na szerokim ekranie scena narracyjna używa około 58% przestrzeni na ilustrację i
  42% na tekst. Strony mogą się zmieniać między scenami, ale zachowują wspólną
  siatkę i bezpieczne strefy. Na urządzeniu pionowym ilustracja znajduje się nad
  tekstem.
- Kampania działa wyłącznie w jasnej palecie (`color-scheme: only light`). Dark
  mode nie jest wspierany i nie może automatycznie zmieniać ani ukrywać tła.
- Przy ograniczonym ruchu każda animacja ma kompletny, czytelny stan statyczny.
  Treść, kolejność i możliwość przejścia pozostają identyczne.
- Kontener kampanii ma szerokość 100%, maksymalnie 1600 px i pozostaje wyśrodkowany.
  Respektuje 15-pikselowe boczne odstępy strony. Breakpoint układu poziomego i
  pionowego jest zgodny z granicą 757 px. Minimalny obsługiwany wymiar viewportu to
  390 px. Szeroki układ dąży do proporcji 16:9 i maksymalnie około 1600 × 900;
  pionowy układ korzysta z wysokości bezpiecznego viewportu. Fullscreen jest
  opcjonalny.
- Wynik końcowy rozdziela `Wynik łączny`, `Wynik wyzwania` i `Twój rekord
  wyzwania`. Rekord nie zawiera jednorazowego bonusu pierwszego ukończenia fabuły.
  Po pierwszym challenge widnieje `Pierwszy wynik wyzwania`, a rekord pojawia się
  dopiero od kolejnej porównywalnej próby.
- Ekran wyniku zachowuje duży znak `1 000 000 ZAMÓWIEŃ`, ale wyrównuje go do
  wspólnej siatki. Wynik jest główny; paczki i dystans drugorzędne; wykorzystanie
  gwarancji pojawia się tylko, gdy wartość jest większa od zera. Akcje to główny
  przycisk ponownej próby, drugorzędne udostępnienie oraz tekstowy link do ponownego
  przejścia historii.
- Udostępnianie obejmuje Facebook i Instagram. Treść udostępnienia nie używa
  odrzuconego hasła `Gramy dalej po milionie`.
- Warstwa analityczna pozostaje minimalna i zależna od zgody: liczba uruchomień
  trybu fabularnego, liczba uruchomień challenge oraz liczba pełnych ukończeń
  historii. Nie dodaje się szczegółowej telemetrii zachowania.
- Copydeck marketingowy musi zostać zaktualizowany równolegle ze scenariuszem:
  poprawić 300 000 zł na 100 000 zł, doprecyzować rok, 10% budżetu i siedem lat,
  opisać źródła liczb skali, rozdzielić perspektywy i dodać pola akceptacji.

## Testing Decisions

- Podstawową automatyczną granicą testu jest zewnętrznie obserwowalny przepływ
  kampanii: silnik emituje stan, kontroler tłumaczy go na prezentację, a powłoka
  pokazuje użytkownikowi właściwy tekst, HUD, modal i rezultat. Testy nie powinny
  wiązać się z prywatnymi metodami ani szczegółami rysowania.
- Jeden scenariusz przepływu obejmuje pierwsze intro, samouczek, sceny fabularne,
  główne wyzwania, 30 paczek, osiem kombinacji, celebrację miliona, modal zmiany
  trybu, chronioną i niechronioną kolizję oraz ekran wyniku.
- Testy trybu sprawdzają, że fabuła nie kończy się po kolizji, challenge kończy się
  po pierwszej niezabezpieczonej kolizji, ochrona nie zużywa się w fabule,
  przechodzi między trybami i zużywa się dokładnie raz w challenge.
- Testy celu finałowego sprawdzają licznik `999 970 → 1 000 000`, dokładnie 30
  zebranych paczek, niezależny postęp ośmiu kombinacji, ponowne pojawienie się
  pominiętej paczki i brak dawnych ośmiu symboli.
- Testy prezentacji sprawdzają pełne etykiety bonusów, widoczną ochronę, komunikat
  jej zużycia, `SERIA ×N`, modal `TRYB WYZWANIA`, trzy rodzaje wyniku oraz warunkowe
  ukrycie pustej statystyki gwarancji.
- Testy treści sprawdzają jednoznaczne znaczniki perspektywy, poprawne wartości
  300 zł, 100 000 zł, 10% budżetu, rok, siedem lat, 240 m, 400 000 kg i pięć
  Boeingów 737. Nie zatwierdzają marketingowej prawdziwości danych — potwierdzają
  zgodność implementacji z zaakceptowanym copydeckiem.
- Istniejące testy przebiegu kontrolera, osi czasu historii, celów fabularnych,
  reguł trybów, wyniku, profilu, prezentacji HUD, manifestu scen i ładowania assetów
  stanowią wzorzec dla nowych testów.
- Deterministyczne testy generatora działają na wielu seedach i pełnym zakresie
  prędkości. Sprawdzają 12–16 wzorów paczek, 16–20 wzorów przeszkód, brak
  bezpośrednich powtórzeń, liczbę paczek 1–7, minimalny czas reakcji, osiągalność,
  brak kolizji hitboxów oraz wspólne położenie całej fali poza prawą krawędzią przy
  aktywacji.
- Testy viewportu obejmują granicę 390 px oraz breakpoint 756/757 px. Sprawdzają
  wyśrodkowanie i ograniczenie do 1600 px, brak wyjścia poza 15-pikselowe odstępy,
  stabilność po resize i brak wpływu systemowej ciemnej palety.
- Zbudowany artefakt QA przechodzi wizualny odbiór w przeglądarce przy szerokościach
  390, 756, 757, 1280, 1600 i 1920 px. Oceniane są: czytelność, wspólna linia
  podłoża, bezpieczne strefy copy, brak przycięć i nakładania, poprawny kontrast,
  generowanie całej fali poza prawą krawędzią oraz czytelne cyfry licznika.
- Każda z dziesięciu ilustracji jest sprawdzana w stanie początkowym, kluczowym i
  końcowym, a także w wariancie ograniczonego ruchu. Błąd opcjonalnego assetu musi
  prowadzić do czytelnego jasnego fallbacku, nigdy czarnego ekranu.
- Test zrozumienia obejmuje co najmniej pięć osób. Kryterium akceptacji: co najmniej
  cztery bez podpowiedzi wyjaśniają cel gry, rozróżniają AMSO od klientów,
  streszczają historie 300 zł → 100 000 zł oraz 10% budżetu → siedem lat,
  wyjaśniają pochodzenie 240 m i 400 000 kg, znają sterowanie i zauważają zmianę
  zasad po wejściu do challenge.
- Odbiór klawiatury i technologii asystujących sprawdza kolejność fokusu, trapping
  w modalach, działanie bez wskaźnika, komunikaty live region oraz niepoleganie
  wyłącznie na kolorze.
- Pełna weryfikacja przed publikacją obejmuje typecheck, cały zestaw testów,
  produkcyjny build, pojedynczy artefakt QA oraz test na fizycznych urządzeniach.

## Out of Scope

- Voice-over i nagrywanie narracji. Architektura może pozostawić punkty integracji,
  ale decyzja o produkcji głosu wraca dopiero po wdrożeniu i testach całości.
- Dark mode oraz osobny zestaw ciemnych ilustracji.
- Backendowy ranking, konta graczy, synchronizacja rekordu między urządzeniami i
  publiczna tabela wyników.
- Rozbudowana analityka zdarzeń, śledzenie pojedynczych scen, paczek, kolizji lub
  danych osobowych gracza.
- Ujawnianie tożsamości klientów albo dodawanie szczegółów pozwalających ich
  rozpoznać.
- Publikowanie niepotwierdzonych nazw konkretnych testów serwisowych.
- Przebudowa całego landing page kampanii. Zewnętrzny landing może dodać CTA do
  strony gry, ale jego projekt nie jest częścią tej specyfikacji.
- Obsługa viewportów o wymiarze mniejszym niż 390 px.
- Zmiana podstawowego modelu sterowania poza skokiem i ślizgiem.

## Further Notes

- Wszystkie historie i liczby są traktowane jako materiał przekazany przez
  marketing, ale wymagają formalnego `AKCEPT` w copydecku przed publikacją.
- Porównania liczb muszą zachować jawny okres i kategorię. `Dane roczne` nie może
  zostać skrócone do samej efektownej liczby.
- Porównanie 400 000 kg z Boeingami wymaga ostatecznego zatwierdzenia dokładnego
  brzmienia `załadowane` i podstawy porównania.
- Scena jakości nie może wymieniać ekranu, portów, baterii ani innych konkretnych
  testów, dopóki zakres nie zostanie potwierdzony przez właściwy zespół.
- Polskie copy w tej specyfikacji opisuje sens i wymagany kontekst. Finalne
  brzmienie należy dopracować w copydecku bez zmiany perspektywy, faktów ani
  kolejności przyczynowo-skutkowej.
- Poprzednia implementacja i jej dokumenty pozostają materiałem historycznym. Ta
  specyfikacja jest aktualnym źródłem wymagań dla kolejnej przebudowy.

## Comments

- Poprzednia automatyczna implementacja została zakończona 2026-07-13 i skierowana
  do odbioru marketingowego oraz QA.
- Specyfikację v5 opublikowano 2026-07-14 po sesji `$grill-me` opartej na testach
  użytkowników i jedenastu zrzutach problematycznych miejsc.
