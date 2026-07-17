# Droga do Miliona v9 — atrakcyjne nagrody, gęstszy gameplay i niezawodny mobile

Status: ready-for-human

## Problem Statement

System nagród nie podtrzymuje ciekawości gracza. Pierwsza animacja konfetti jest
czytelna i przyjemna, ale kolejne warianty — puls, abstrakcyjne wstęgi, deszcz
paczek i fala trasy — nie wyglądają jak świętowanie. Różnorodność została
osiągnięta przez zmianę języka wizualnego, a nie przez rosnącą rangę nagrody.
Gracz nie otrzymuje też wystarczająco wyraźnego, jednorazowego potwierdzenia
ustanowienia nowego osobistego rekordu.

Gameplay jest zbyt rzadki i przewidywalny. Na ekranie zwykle znajduje się jedna
przeszkoda, więc wzrost prędkości nie przekłada się na ciekawe sekwencje decyzji.
Jednocześnie przypadkowe skracanie odstępów grozi wygenerowaniem sytuacji
niemożliwych do przejścia. Paczki mogą pojawiać się w miejscach, których nie da
się zebrać standardowym skokiem lub ślizgiem, albo wizualnie nakładać się na
przeszkody. Power-up `Audyt / więcej czasu na reakcję` dodatkowo rozrzedza
trasę, przez co często nie daje odczuwalnej korzyści.

Sterowanie ślizgiem sprawia wrażenie opóźnionego, ponieważ krótkie naciśnięcie
`S` uruchamia osobny, czasowy wariant akcji. Gracz oczekuje bezpośredniej relacji
między stanem klawisza a pozą kuriera. Sam kurier wymaga także korekt: pas ma
niewłaściwy kolor, mały raster znaku `A` ma poszarpane krawędzie, a linie nóg
wychodzą poza białe stopy.

Znak ochrony również utracił czytelność. Zamiast jednego dużego, przyjemnego
koła pojawiają się dwa mniejsze obrysy, a rozmiar shielda zmienia się wraz ze
skokiem i przysiadem. Na początku gry wyświetlany jest dodatkowy znak z
galaktyką linii i haczyków, mimo że samo koło wystarcza do zakomunikowania
niewrażliwości.

Warstwa świata jest niestabilna wizualnie i technicznie. Nakładające się tła
tworzą nieestetyczne podwójne kompozycje, a przejście między światami potrafi
szarpnąć lub odsłonić szew. Linia, po której biegnie kurier, ma niezamierzone
odstępy od lewej i prawej krawędzi. Na telefonach otwierających autonomiczny
HTML przez Android `content://` obrazy światów mogą w ogóle się nie zdekodować,
pozostawiając czarny ekran. Ten sam tryb może nie udostępniać Fullscreen API,
ale interfejs nadal pokazuje pozornie działającą funkcję `Pełny ekran`.
Dodatkowo szeroki ekran około `960×315 CSS px` jest błędnie blokowany jako za
mały, ponieważ obecna reguła wymaga co najmniej 390 px wysokości landscape.

Gra odczuwalnie gubi płynność. Ruch kuriera, tła i obiektów reaguje na nierówne
klatki, a wiele zduplikowanych obrazów świata zwiększa koszty dekodowania i
pamięci. Docelowe 60 FPS nie ma jeszcze jednoznacznego budżetu ani kontrolowanej
degradacji dekoracji. Na ekranie wyników wartość `Wynik łączny` nie znajduje się
na wspólnej linii z pozostałymi liczbami.

## Solution

Wszystkie celebracje zostaną zbudowane jako jedna rozpoznawalna rodzina oparta
na pierwszej, udanej animacji konfetti. Progi `10, 50, 100, 500, 1 000,
5 000…` będą zmieniały liczbę źródeł, trajektorie, serpentyny, rozbłysk, skalę,
kolor i pełnię wspólnej frazy dźwiękowej, ale każda wersja od pierwszej klatki
będzie wyglądać jak święto. Abstrakcyjne efekty `pulse`, `route-wave` oraz
deszcz paczek zostaną usunięte. Pierwsze przekroczenie rekordu zapisanego przed
startem biegu pokaże `NOWY REKORD` dokładnie raz w danej próbie. Jeżeli rekord
zbiegnie się z okrągłym progiem, oba komunikaty połączą się w jedną silniejszą
celebrację.

Celebracje pozostaną krótkie i nie zablokują sterowania. Cząstki pojawią się
głównie przy krawędziach, a komunikat poza torem przeszkód. Jedynie nowy rekord
otrzyma około 0,25 sekundy bardzo łagodnego spowolnienia prezentacyjnego przy
zachowaniu aktywnych wejść. Większe progi rozbudują tę samą muzyczną sygnaturę,
zamiast odtwarzać niepowiązane sygnały. Interfejs nie pokaże następnego progu.

Generator gameplay zostanie oparty na walidowanych sekwencjach wymagających
skoku i ślizgu. Początek fabuły pozostanie spokojny, dalsze segmenty pokażą do
dwóch jednocześnie widocznych przeszkód, a Tryb Wyzwania stopniowo dojdzie do
trzech. Trudność będzie rosła przez krótkie, nieregularne serie 2–3 działań,
przeplatane czytelnym oknem oddechu. Paczki staną się częścią atomowej definicji
fali i zawsze utworzą osiągalną wskazówkę trajektorii. Walidacja odrzuci każdą
falę z paczką w hitboxie przeszkody, poza fizycznym zasięgiem kuriera lub bez
bezpiecznej drogi.

Power-up `Audyt / więcej czasu na reakcję` zostanie całkowicie usunięty z
generacji, nagród, tekstów i aktywnych efektów. Pozostaną tylko bonusy, których
skutek jest natychmiast widoczny i zrozumiały: `GWARANCJA 48 M`, mnożnik punktów
oraz specjalne paczki punktowe.

`S` i `↓` będą bezpośrednim sterowaniem stanem ślizgu: naciśnięcie natychmiast
przenosi kuriera do przysiadu, przytrzymanie utrzymuje pozę, a zwolnienie od razu
ją kończy. Mobilny gest w dół zachowa krótki ślizg, ponieważ ekran dotykowy nie
ma równoważnego, wygodnego stanu klawisza.

Kurier otrzyma pomarańczowy pas. Biały znak `A` zostanie narysowany jako wektor,
powiększony około 10% i osadzony identycznie we wszystkich pozach. Białe stopy
zostaną opuszczone o 3 px, a czarne linie nóg zakończą się 2 px ponad ich górną
krawędzią.

Ochrona użyje jednego dużego pomarańczowego koła o stałym bazowym rozmiarze i
położeniu względem całej sylwetki kuriera. Koło nie zmniejszy się podczas skoku
ani ślizgu. Pozostanie delikatnie żywe przez wolny, około dwusekundowy oddech:
zmianę promienia najwyżej o 1,5 px oraz subtelną zmianę pomarańczowego blasku.
Nie pojawią się drugie pierścienie, haczyki, linie ani osobny znak startowy.
Startowa niewrażliwość pokaże samo koło, zebranie Gwarancji krótko pokaże nazwę,
a zużycie uruchomi jeden czytelny efekt pęknięcia i całkowicie usunie shield.

Światy będą poruszać się na jednej osi jako panele ustawione dokładnie kraj do
kraju, bez crossfade, przezroczystego nakładania i lustrzanego odbicia. Różne
światy połączy krótki, neutralny fragment przejściowy zgodny z linią horyzontu,
paletą i poziomem trasy obu sąsiadów. Następny świat zostanie przygotowany przed
wejściem na ekran. Faza ruchu nie zresetuje się przy przejściu fabuła →
wyzwanie. Podczas kart historii i pauz aktualna kompozycja łagodnie dojdzie do
czytelnego, centralnego kadru bez ustawienia szwu pod tekstem.

Autonomiczny HTML nie będzie polegał na wielokrotnie zduplikowanych `<img>` z
dużymi WebP data URI. Każdy osadzony świat zostanie zdekodowany raz do zasobu
przeznaczonego do rysowania, a w pamięci pozostanie tylko świat bieżący i
przygotowany następny. Nieudane dekodowanie uruchomi kontrolowaną ponowną próbę.
Jeśli zasobu nadal nie można użyć, gracz zobaczy jasny, stylizowany fallback
zgodny z kampanią — nigdy czarny ekran.

Na urządzeniach bez Fullscreen API przycisk przełączy interfejs w CSS-owy tryb
gry: ukryje header i footer oraz przeznaczy całą dostępną powierzchnię dokumentu
na kampanię. Nie będzie obiecywał ukrycia systemowego paska przeglądarki, którego
strona `content://` nie kontroluje. Landscape o odpowiedniej szerokości będzie
dopuszczony od około 280 px wysokości; portrait zachowa zatwierdzone minimum
390 px szerokości.

Pętla gry otrzyma stały krok symulacji, ograniczenie kosztu renderowania do DPR
2, ponowne wykorzystanie obiektów i przygotowanie zasobów poza momentem
przejścia. Celem jest średnio co najmniej 58 FPS, przy czym 95% klatek powinno
mieścić się w około 20 ms. Gdy urządzenie przez kilka sekund nie utrzyma
budżetu, zmniejszy się wyłącznie liczba cząstek i drugorzędnych warstw
paralaksy. Fizyka, wejścia, liczba przeszkód, wynik i trudność pozostaną bez
zmian.

Linia trasy zostanie narysowana poza obiema krawędziami i przycięta przez pole
gry, dzięki czemu nie pokaże bocznych marginesów. Jej wysokość będzie wspólna
dla kuriera i przeszkód we wszystkich światach. Karty wyników otrzymają wspólny
wiersz etykiety oraz wspólną bazową linię wartości, aby `Wynik łączny` był
wyrównany z pozostałymi liczbami na każdym breakpointcie.

## User Stories

1. Jako gracz chcę, aby każda animacja nagrody jednoznacznie wyglądała jak świętowanie, abym od razu rozumiał sukces.
2. Jako gracz chcę zachować przyjemne konfetti z pierwszej nagrody, abym nie utracił najlepiej działającego efektu.
3. Jako gracz chcę, aby kolejne celebracje rozwijały tę samą estetykę, abym otrzymywał różnorodność bez wizualnego chaosu.
4. Jako gracz chcę zobaczyć inne układy konfetti przy kolejnych progach, abym był ciekawy następnego osiągnięcia.
5. Jako gracz chcę zobaczyć serpentyny i boczne salwy przy większych progach, abym odczuwał rosnącą rangę wyniku.
6. Jako gracz chcę zobaczyć mocniejszy rozbłysk przy 500 i 1 000 paczek, abym rozróżniał duże kamienie milowe.
7. Jako gracz chcę uniknąć abstrakcyjnego pulsu, abym nie mylił nagrody z przypadkowym efektem interfejsu.
8. Jako gracz chcę uniknąć świetlnej fali trasy jako samodzielnej nagrody, abym zawsze widział rzeczywiste świętowanie.
9. Jako gracz chcę uniknąć deszczu paczek, abym nie mylił dekoracji z przedmiotami do zebrania.
10. Jako gracz chcę celebrować progi 10, 50, 100, 500, 1 000 i dalsze, abym miał cele podczas długiej próby.
11. Jako gracz chcę widzieć tylko osiągnięty próg, abym zachował ciekawość następnej nagrody.
12. Jako gracz chcę, aby komunikat progu był kolorowy i zgodny z paletą AMSO, abym odbierał go jako część kampanii.
13. Jako gracz chcę, aby większe progi miały pełniejszą wersję tej samej melodii, abym słyszał ich rangę.
14. Jako gracz z wyciszonym dźwiękiem chcę nadal rozumieć nagrodę wizualnie, abym nie tracił informacji.
15. Jako gracz chcę otrzymać `NOWY REKORD` po pierwszym przekroczeniu zapisanego wyniku, abym rozpoznał osobisty sukces.
16. Jako gracz chcę zobaczyć celebrację nowego rekordu tylko raz w próbie, abym nie otrzymywał jej po każdej kolejnej paczce.
17. Jako gracz chcę połączenia rekordu z okrągłym progiem w jeden efekt, abym nie oglądał dwóch nakładających się komunikatów.
18. Jako gracz chcę zachować sterowanie podczas celebracji, abym nie został ukarany przez nagrodę.
19. Jako gracz chcę, aby konfetti pozostawało głównie przy krawędziach, abym nadal widział przeszkody.
20. Jako gracz ustanawiający rekord chcę krótkiego, łagodnego podkreślenia chwili, abym poczuł jej wyjątkowość bez utraty kontroli.
21. Jako gracz preferujący ograniczony ruch chcę statycznego, czytelnego wariantu sukcesu, abym nie tracił informacji.
22. Jako nowy gracz chcę spokojnego początku z jedną przeszkodą, abym nauczył się sterowania.
23. Jako gracz fabuły chcę później widzieć do dwóch przeszkód jednocześnie, abym doświadczał realnego wyzwania.
24. Jako gracz Trybu Wyzwania chcę stopniowo dojść do trzech widocznych przeszkód, abym czuł wzrost presji.
25. Jako gracz chcę przechodzić zaprojektowane sekwencje skoków i ślizgów, abym podejmował decyzje zamiast czekać na pojedyncze obiekty.
26. Jako gracz chcę, aby odstępy wewnątrz serii malały stopniowo, abym miał czas nauczyć się rytmu.
27. Jako gracz chcę krótkiego oddechu po intensywnej serii, abym utrzymał koncentrację podczas długiej gry.
28. Jako gracz chcę nieregularnego rytmu serii, abym nie mógł przechodzić gry mechanicznym metronomem.
29. Jako gracz chcę, aby każda kombinacja zachowała fizycznie możliwe okno reakcji, abym ufał uczciwości gry.
30. Jako gracz chcę, aby paczki wskazywały prawidłową trajektorię, abym intuicyjnie rozumiał moment akcji.
31. Jako gracz chcę widzieć łuk paczek nad przeszkodą do przeskoczenia, abym wiedział, kiedy skoczyć.
32. Jako gracz chcę widzieć niski rząd paczek przy przeszkodzie do ślizgu, abym rozpoznał poprawną odpowiedź.
33. Jako gracz chcę móc zebrać każdą wygenerowaną paczkę, abym nie czuł frustracji przez niemożliwą nagrodę.
34. Jako gracz chcę, aby paczki nie nakładały się na przeszkody, abym odróżniał nagrody od zagrożeń.
35. Jako gracz chcę, aby trasa odrzucała nieprzechodnie fale, abym nie przegrywał przez generator.
36. Jako gracz chcę usunięcia niewyczuwalnego Audytu, abym otrzymywał tylko zrozumiałe power-upy.
37. Jako gracz chcę, aby `GWARANCJA 48 M` pozostała, abym miał jasną jednorazową ochronę.
38. Jako gracz chcę, aby mnożnik punktów pozostał, abym natychmiast rozumiał wartość bonusu.
39. Jako gracz klawiatury chcę natychmiast przysiadać po naciśnięciu `S`, abym czuł responsywne sterowanie.
40. Jako gracz klawiatury chcę pozostawać w przysiadzie tak długo, jak trzymam `S`, abym bezpośrednio kontrolował pozę.
41. Jako gracz używający strzałek chcę identycznego zachowania `↓`, abym mógł grać prawą ręką.
42. Jako gracz klawiatury chcę natychmiast wstać po zwolnieniu klawisza, abym nie czekał na ukryty timer.
43. Jako gracz mobilny chcę zachować krótki gest w dół, abym mógł wykonać ślizg bez klawiatury.
44. Jako gracz chcę widzieć pomarańczowy pas kuriera, abym otrzymał spójną zatwierdzoną paletę.
45. Jako gracz chcę widzieć większe i gładkie białe `A`, abym rozpoznał markę podczas ruchu.
46. Jako właściciel marki chcę zachować dokładną geometrię znaku `A`, abym nie używał przypadkowego przybliżenia.
47. Jako gracz chcę identycznego położenia znaku w biegu, skoku i ślizgu, abym nie widział drgania logo.
48. Jako gracz chcę, aby nogi kończyły się wewnątrz białych stóp, abym widział poprawną sylwetkę kuriera.
49. Jako gracz chcę rozpoznawać ochronę po jednym dużym pomarańczowym kole, abym nie interpretował dwóch znaków.
50. Jako gracz chcę, aby shield zachował rozmiar w skoku i ślizgu, abym nie widział przypadkowego kurczenia ochrony.
51. Jako gracz chcę subtelnie oddychającego shielda, abym widział, że ochrona jest aktywna.
52. Jako gracz chcę, aby oddech shielda był powolny i niewielki, abym nie odbierał go jako drgania.
53. Jako gracz chcę usunięcia haczyków, linii i dodatkowego pierścienia, abym widział prosty znak ochrony.
54. Jako gracz chcę widzieć samo koło podczas startowej niewrażliwości, abym nie mylił jej z osobnym power-upem.
55. Jako gracz chcę krótko przeczytać `GWARANCJA` po podniesieniu bonusu, abym poznał źródło ochrony.
56. Jako gracz chcę zobaczyć jedno pęknięcie po zużyciu Gwarancji, abym rozumiał, że ładunek zniknął.
57. Jako gracz chcę, aby tła nie przenikały przez siebie, abym nie widział podwójnych kompozycji.
58. Jako gracz chcę, aby kolejne panele świata stykały się kraj do kraju, abym odczuwał ciągłą podróż.
59. Jako gracz chcę neutralnego łącznika między różnymi światami, abym nie widział gwałtownego cięcia.
60. Jako gracz chcę, aby nowy świat był gotowy przed wejściem na ekran, abym nie widział pustej lub czarnej klatki.
61. Jako gracz Trybu Wyzwania chcę ciągłej fazy tła po finale fabuły, abym nie odczuwał przejścia jako restartu.
62. Jako czytelnik historii chcę centralnego, spokojnego kadru pod kartą, abym nie zatrzymywał się na szwie obrazu.
63. Jako użytkownik Androida otwierający lokalny HTML chcę widzieć wszystkie światy, abym nie otrzymywał czarnego ekranu.
64. Jako użytkownik autonomicznego HTML chcę, aby każdy WebP był dekodowany tylko raz, abym nie zużywał niepotrzebnie pamięci.
65. Jako użytkownik słabszego telefonu chcę przechowywać tylko bieżący i następny świat, abym zachował płynność.
66. Jako użytkownik z błędem dekodowania chcę automatycznej ponownej próby, abym nie musiał przeładowywać całej gry.
67. Jako użytkownik z trwałym błędem obrazu chcę jasnego, markowego fallbacku, abym nadal mógł grać bez czarnej pustki.
68. Jako użytkownik `content://` chcę działającej alternatywy dla Fullscreen API, abym wykorzystał całą dostępną powierzchnię.
69. Jako użytkownik przeglądarki bez fullscreen chcę uczciwej informacji o trybie gry, abym nie naciskał pozornie martwej funkcji.
70. Jako użytkownik landscape około 960×315 chcę rozpocząć grę bez błędnej blokady rozmiaru, abym wykorzystał szeroki ekran telefonu.
71. Jako użytkownik portrait chcę zachować minimum 390 px szerokości, abym otrzymał czytelny interfejs.
72. Jako gracz chcę, aby linia trasy dochodziła do obu krawędzi, abym nie widział przypadkowych marginesów.
73. Jako gracz chcę, aby linia trasy zachowała jeden poziom we wszystkich światach, abym nie widział skoku kuriera i przeszkód.
74. Jako gracz chcę stabilnego ruchu zbliżonego do 60 FPS, abym nie odczuwał szarpania wejść i świata.
75. Jako gracz chcę, aby przejście świata nie tworzyło długiej klatki, abym nie odczuwał dyskomfortu.
76. Jako gracz na słabszym urządzeniu chcę redukcji dekoracji zamiast trudności, abym zachował uczciwy wynik.
77. Jako gracz chcę, aby liczba przeszkód nie malała przy spadku FPS, abym otrzymał tę samą rozgrywkę co inni.
78. Jako gracz chcę, aby fizyka była stabilna przy nierównych klatkach, abym miał przewidywalny skok i ślizg.
79. Jako gracz chcę, aby konfetti nie obniżało płynności krytycznej sceny, abym nie został ukarany przez celebrację.
80. Jako gracz oglądający wyniki chcę, aby `Wynik łączny` był wyrównany z innymi wartościami, abym szybko porównał statystyki.
81. Jako użytkownik wąskiego ekranu chcę zachować wspólną linię wartości po zawinięciu etykiet, abym widział uporządkowaną kartę.
82. Jako tester chcę przejść jedną deterministyczną sesję obejmującą wszystkie te stany, abym oceniał rezultat gracza zamiast prywatnej implementacji.

## Implementation Decisions

- Kanoniczna rodzina celebracji zachowuje jeden typ semantyczny: świętowanie
  konfetti. Warianty różnią się konfiguracją emisji, serpentynami, rozbłyskiem,
  skalą komunikatu, paletą i rangą audio; nie zmieniają się w abstrakcyjne
  symbole ani przedmioty podobne do collectible.
- Generator progów pozostaje nieskończoną sekwencją rozpoczynającą się od 10 i
  naprzemiennie mnożącą poprzednią wartość przez 5 oraz 2.
- Stan profilu przechowuje najlepszy wynik paczek. Na początku próby wartość
  zostaje zamrożona jako rekord do pobicia. Zdarzenie `nowy rekord` może
  aktywować się tylko raz do końca tej próby, nawet jeśli wynik dalej rośnie.
- Zdarzenie progu i nowego rekordu ma jeden mechanizm łączenia. Wspólna klatka
  nie tworzy dwóch kolejek, dwóch tekstów ani nakładających się cue.
- Zwykłe progi nie zatrzymują symulacji. Nowy rekord może uruchomić około 0,25 s
  kontrolowanego time dilation, lecz wejścia pozostają aktywne, a bezpieczne
  okno prezentacji nie może wprowadzić niesprawiedliwej kolizji.
- Komunikat zawiera osiągnięty próg albo `NOWY REKORD` i aktualną wartość. Nie
  zawiera `Następny próg`, paska postępu ani stałego CTA.
- Audio używa jednej krótkiej, rosnącej frazy. Wyższe rangi dodają nuty, akord i
  krótki akcent, ale nie zatrzymują muzyki ani nie maskują sygnału kolizji.
- Przy ograniczonym ruchu pozostaje tekst i czytelna zmiana koloru; emisja,
  skala, serpentyny, rozbłysk i time dilation są wyłączone lub zredukowane.
- Generator rozgrywki operuje walidowanymi atomami i sekwencjami akcji, a nie
  niezależnymi losowymi przeszkodami. Każda sekwencja deklaruje wymaganą akcję,
  odstęp reakcji, okno oddechu i powiązany układ paczek.
- Fabuła dopuszcza maksymalnie dwie aktywne, widoczne przeszkody. Tryb Wyzwania
  stopniowo dopuszcza maksymalnie trzy. Limit jest częścią walidacji fali, a nie
  wyłącznie wielkością puli obiektów.
- Wewnątrz serii odstępy odpowiadają około 0,75–1,0 s w środkowej fabule i mogą
  zejść do około 0,55–0,75 s w późnym wyzwaniu, o ile walidacja fizyki potwierdzi
  możliwe przejście. Po serii pozostaje około 1,0–1,4 s oddechu.
- Pakiety są generowane atomowo z przeszkodami. Trasa paczek reprezentuje
  poprawną trajektorię i musi być osiągalna przez zatwierdzoną fizykę bez
  kolizji ich obszarów z przeszkodą.
- Walidator fali jest jedynym miejscem dopuszczającym wzorzec do gry. Sprawdza
  geometrię, czas reakcji, odzyskanie pozy po poprzedniej akcji, liczbę obiektów
  na ekranie i osiągalność wszystkich paczek.
- `Audyt / więcej czasu na reakcję` zostaje usunięty z publicznego zbioru
  power-upów, fal fabularnych, konfiguracji nagród, copy, HUD i runtime. Dane
  profilu nie wymagają migracji, jeśli efekt nie był utrwalany.
- Stan ślizgu klawiatury wynika bezpośrednio z `keydown` i `keyup` dla `S` oraz
  `ArrowDown`. Powtórzenia klawisza nie tworzą nowych timerów. Mobilny gest w dół
  używa jednego krótkiego, deterministycznego czasu ślizgu.
- Paleta kuriera zmienia pas na ten sam pomarańczowy token rodziny stroju.
  Znak `A` używa wektorowego konturu zachowującego zatwierdzoną geometrię i jest
  powiększony około 10% względem obecnego pola.
- Jedna funkcja pozycjonowania znaku obsługuje wszystkie pozy. Stopy są
  przesunięte o 3 px w dół, a końce nóg o 2 px nad ich górną krawędź bez zmiany
  fizycznego hitboxa ani poziomu podłoża.
- Prezentacja ochrony ma jeden obiekt i jeden renderowany obrys. Bazowy promień
  nie zależy od pozy kuriera. Delikatny oddech ma okres około 1,8–2,0 s i
  amplitudę promienia nie większą niż 1,5 px.
- Start i aktywna `GWARANCJA 48 M` używają tej samej geometrii. Start nie dodaje
  stałej nazwy do HUD, pickup pokazuje krótką nazwę, a wykorzystanie generuje
  pojedynczy stan pęknięcia i usuwa ładunek.
- Panele świata są układane sekwencyjnie kraj do kraju bez ujemnego odstępu,
  alpha blendingu i crossfade. Krótkie łączniki świata są pełnoprawnymi,
  niekolizyjnymi fragmentami tła o zgodnej geometrii trasy.
- Pozycja paralaksy pozostaje absolutną częścią sesji. Przejścia fabuła →
  wyzwanie i świat → świat nie zerują fazy ani prędkości.
- Pauza i karta historii nie zatrzymują obrazu na przypadkowej granicy. Warstwa
  płynnie kończy ruch na autorsko określonym centralnym kadrze bez mieszania
  dwóch światów.
- Zasoby światów autonomicznego dokumentu są osadzone, lecz runtime tworzy z
  każdego źródła pojedynczy dekodowany obiekt. W pamięci utrzymuje bieżący i
  następny świat; poprzedni zostaje zwolniony po bezpiecznym przejściu.
- Ładowanie świata ma jawne stany: przygotowanie, gotowy, ponowna próba i
  fallback. Błąd nie może ustawić czarnej podstawy ani zatrzymać gameplay.
- Capability detection rozróżnia prawdziwy Fullscreen API od CSS-owego trybu
  skupienia. Przy braku API główna i startowa kontrolka używają fallbacku oraz
  nie zapisują nieosiągniętego stanu jako prawdziwego fullscreen.
- CSS-owy tryb gry ukrywa nagłówek i stopkę kampanii, wypełnia dostępną wysokość
  i zachowuje dostępny sposób wyjścia. Nie próbuje gwarantować ukrycia chrome
  przeglądarki w `content://`.
- Reguła dostępnego viewportu rozdziela orientacje. Portrait zachowuje minimum
  390 px szerokości. Landscape o odpowiedniej szerokości jest obsługiwany od
  około 280 px użytecznej wysokości.
- Pętla symulacji używa stałego kroku i ograniczonego catch-up, aby długie
  klatki nie powodowały skoku fizyki. Renderowanie pozostaje sterowane przez
  `requestAnimationFrame`.
- Rozdzielczość renderowania jest ograniczona do efektywnego DPR 2. Pule
  przeszkód, paczek i cząstek są ponownie używane, a dekodowanie świata nie
  odbywa się w klatce wejścia panelu.
- Kontroler jakości obserwuje budżet klatek przez ruchome okno kilku sekund.
  Może redukować liczbę cząstek i drugorzędnych warstw paralaksy, lecz nie
  zmienia fizyki, gęstości fal, wejść, punktacji ani wyniku.
- Docelowa metryka to średnio co najmniej 58 FPS oraz 95. percentyl czasu klatki
  nie większy niż około 20 ms na zatwierdzonej macierzy. Przejście świata nie
  może generować widocznego skoku pozycji.
- Linia trasy jest jednym pełnoszerokim elementem wspólnej płaszczyzny i jest
  rysowana poza krawędzie przed przycięciem. Nie resetuje pozycji między
  światami.
- Karty wyników używają wspólnych wierszy siatki dla etykiet i wartości. Liczby
  zachowują jedną bazową linię niezależnie od liczby wierszy nagłówka.

## Testing Decisions

- Głównym szwem jest deterministyczna sesja pełnej kampanii uruchomiona przez
  publiczny interfejs gry. Test przechodzi start, fabułę, przejście do Trybu
  Wyzwania, serię progów, nowy rekord, zmianę świata, pickup Gwarancji, ślizg,
  ekran wyników i restart. Obserwuje snapshoty publiczne, DOM, wejścia oraz
  wynik widoczny graczowi; nie sprawdza prywatnych metod.
- Dobre testy opisują skutek użytkownika. Nie uznaje się za wystarczające testu
  samego selektora, liczby wywołań canvas, prywatnej nazwy wariantu lub obecności
  base64 bez potwierdzenia, że obraz został zdekodowany i pokazany.
- Test lifecycle celebracji potwierdza progi `10, 50, 100, 500, 1 000`, jedną
  rodzinę semantyczną, rosnącą rangę, brak następnego progu, jedno zdarzenie
  rekordu na bieg i połączenie rekordu z progiem.
- Test prezentacji celebracji potwierdza aktywne wejścia, brak zasłonięcia
  strefy przeszkód oraz wyłączenie ruchomych efektów przy `reduced motion`.
  Manualny odbiór ocenia, czy wszystkie warianty faktycznie wyglądają świątecznie.
- Test audio obserwuje jedną rosnącą frazę, pełniejszy wariant dużego progu,
  osobny akcent rekordu, respektowanie wyciszenia i brak zatrzymania podstawowej
  muzyki.
- Właściwościowy test generatora przechodzi wiele deterministycznych seedów i
  wszystkie poziomy prędkości. Każda fala musi mieć bezpieczną drogę, osiągalne
  paczki, zerowe przecięcia collectible–hazard i nie przekraczać limitu dwóch
  lub trzech widocznych przeszkód.
- Integracyjny test sekwencji wykonuje `skok → ślizg`, `ślizg → skok`, dwa skoki
  i trzyakcjową serię wyzwania. Potwierdza minimalne okna reakcji, przerwę po
  serii i nieregularność rytmu bez tworzenia niemożliwych kombinacji.
- Test power-upów potwierdza brak Audytu w konfiguracji, spawnerze, snapshotach,
  HUD i produkcyjnym copy oraz niezmienione działanie Gwarancji i mnożnika.
- Test wejścia wykonuje `keydown`, przytrzymanie i `keyup` osobno dla `S` oraz
  `ArrowDown`. Potwierdza natychmiastowy stan i brak timera. Osobny test touch
  potwierdza jeden krótki ślizg po geście w dół.
- Test prezentacji kuriera potwierdza pomarańczowy pas, wektorowy znak we
  wszystkich pozach, wspólne pozycjonowanie oraz zakończenie nóg nad stopami.
  Nie używa kruchego pełnoekranowego snapshotu jako jedynego kryterium.
- Test shielda przechodzi brak ochrony, start, aktywną Gwarancję, bieg, skok,
  ślizg, oddech, pochłoniętą kolizję i stan po zużyciu. Zewnętrznym kryterium
  jest zawsze jeden stabilny okrąg oraz zgodność widoczności z realną ochroną.
- Test świata przechodzi pełny cykl panelu, łącznik, zmianę wszystkich siedmiu
  światów, pauzę historii i przejście do wyzwania. Potwierdza brak overlapu,
  crossfade, odbicia, szczeliny, czarnej klatki i resetu fazy.
- Test zasobów autonomicznego HTML musi uruchomić rzeczywisty kod dekodowania,
  a nie tylko przeszukać dokument. Obejmuje sukces WebP, pierwszy błąd i retry,
  trwały błąd i jasny fallback oraz zwolnienie poprzedniego świata.
- Mobilny test regresyjny symuluje Android `content://`, viewport landscape
  `960×315`, brak Fullscreen API i niedostępny dekoder obrazu. Gra ma dopuścić
  layout, zaoferować CSS-owy tryb skupienia i zachować widoczny świat/fallback.
- Test capability detection obejmuje prawdziwy fullscreen, odrzuconą obietnicę,
  brak metody i wyjście z CSS-owego trybu gry. Stan profilu nie może twierdzić,
  że aktywowano prawdziwy fullscreen po fallbacku.
- Test wydajności używa deterministycznego najcięższego kadru: trzy przeszkody,
  paczki, shield, celebrację i wejście nowego świata. Mierzy budżet klatek oraz
  potwierdza, że degradacja zmienia wyłącznie dekoracje.
- Manualna macierz wydajności obejmuje 390 px portrait, telefon landscape,
  szeroki desktop, DPR 1–3, Chromium/Edge, Safari/WebKit oraz autonomiczny HTML
  otwarty lokalnie. Kryterium to średnio ≥58 FPS, p95 około ≤20 ms i brak
  widocznego szarpnięcia na granicy świata.
- Test linii trasy potwierdza pokrycie całej szerokości i wspólny poziom z
  kurierem oraz przeszkodami na każdym breakpointcie.
- Test wyników wymusza jedno- i wielowierszowe etykiety i potwierdza wspólną
  bazową linię wszystkich wartości, w tym `Wynik łączny`.
- Prior art stanowią istniejące testy pełnego lifecycle, fairness spawnera,
  authored waves, challenge pressure, milestone celebrations, milestone UI,
  audio, courier presentation, world parallax, single-file assets, responsive
  shell i raportów przeglądarkowych. Należy rozszerzać te szwy zamiast budować
  równoległy system testowy.

## Out of Scope

- Zmiana fabuły, kolejności kart historii, faktów marketingowych lub copy
  klienta poza usunięciem tekstów Audytu i wymaganymi komunikatami systemowymi.
- Dodanie globalnego leaderboardu, kont użytkownika, nagród rzeczowych,
  kuponów, waluty lub systemu zakupów za rekordy.
- Pokazywanie następnego progu, stałego paska postępu albo ekranu kolekcji
  odblokowanych celebracji.
- Zmiana zatwierdzonego maksimum prędkości Trybu Wyzwania 3,5×.
- Przywrócenie bossa, wózka widłowego lub adaptive assist po porażkach.
- Przebudowa całej gry do pixel art albo wygenerowanie nowej fabuły wizualnej.
- Zmiana podstawowych zasad skoku, hitboxa kuriera, punktacji paczek lub reguły
  game over w Trybie Wyzwania poza koniecznym walidowaniem fal.
- Gwarantowane ukrycie systemowego paska adresu w Android `content://`; strona
  może wykorzystać tylko powierzchnię udostępnioną przez przeglądarkę.
- Obniżanie liczby przeszkód, prędkości lub wyniku jako reakcja na słaby FPS.
- Przywrócenie crossfade, przezroczystego overlapu lub lustrzanego odbicia tła.

## Further Notes

- Ta specyfikacja zastępuje sprzeczne decyzje v8 o technologicznym zachodzeniu
  kopii tła, miękkim mieszaniu krawędzi i crossfade światów. Od v9 obrazy nie
  nakładają się wizualnie; ciągłość zapewniają panele kraj do kraju oraz
  dedykowane łączniki.
- Ta specyfikacja zastępuje v8-ową zmianę shielda w owal podczas ślizgu. Od v9
  bazowa geometria pozostaje jednym dużym kołem niezależnym od pozy kuriera,
  z wyłącznie subtelnym oddechem.
- Ta specyfikacja zastępuje poprzednią rotację pięciu niepowiązanych celebracji.
  Od v9 wszystkie warianty należą do jednej rodziny konfetti.
- Ta specyfikacja zastępuje krótkie, czasowe naciśnięcie `S` pełnym sterowaniem
  przez przytrzymanie na klawiaturze.
- Zatwierdzone wcześniej minimum 390 px dotyczy czytelnej szerokości portrait,
  a nie bezwzględnego krótszego boku w landscape. Osobny próg landscape jest
  konieczny ze względu na chrome przeglądarki mobilnej.
- W trakcie diagnozy potwierdzono dwa czerwone przypadki: szeroki viewport
  `960×315` jest obecnie odrzucany, a kontrolka fullscreen pozostaje widoczna
  przy niedostępnym API. Oba przypadki powinny stać się trwałymi testami
  regresyjnymi przed poprawką.
- Wizualna atrakcyjność celebracji, estetyka łączników tła i brak odczuwalnego
  szarpnięcia wymagają krótkiego odbioru ludzkiego po przejściu automatycznych
  kryteriów.
