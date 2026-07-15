# Droga do Miliona v6 — czytelna opowieść przedmiotowa

Status: ready-for-agent

## Problem Statement

Obecna warstwa fabularna gry nie przekazuje drogi AMSO do miliona zamówień
wystarczająco jasno. Wiele elementów świata wygląda jak abstrakcyjne ramki,
linie, prostokąty lub symbole bez rozpoznawalnego znaczenia. Nie są one ani
informacyjne, ani stylistycznie spójne z kampanią. Gracz nie potrafi bez tekstu
rozpoznać, czy widzi sortowanie paczek, historię klienta, porównanie skali,
stanowisko pracy czy etap procesu.

Problem nie wynika z braku technologii pixel art. Pixel art nie jest celem
projektu i sam nie rozwiąże nieczytelnej metafory. Gra potrzebuje jednoznacznych
przedmiotów, ludzi, miejsc i działań, które prowadzą odbiorcę przez historię
firmy. Dekoracja bez znaczenia obciąża interfejs i konkuruje z tekstem oraz
rozgrywką.

Fabuła jest także zbyt rozbudowana. Czterdzieści dwa kroki tekstowe oraz trzy
pełne historie klientów odciągają uwagę od głównej bohaterki — AMSO — i wydłużają
pierwsze przejście. Dwie historie klientów zostały wcześniej połączone w odbiorze,
mimo że dotyczą różnych klientów. Sekcja skali powtarza kilka podobnych
porównań, a trudne do zrozumienia porównanie z Boeingami nie jest potrzebne w
głównej grze.

Przejście z aktywnej gry do karty fabularnej ma dodatkowy problem wejścia.
Gracz, który naciska spację w momencie zmiany stanu, może przypadkowo przewinąć
pierwszy krok historii, zanim zdąży zobaczyć animację i przeczytać tekst. Ten sam
kontrakt musi uwzględniać sterowanie jedną ręką: klawisz `S` pozostaje pełnoprawną
alternatywą dla strzałki w dół podczas ślizgu.

## Solution

Gra zostanie skrócona do około pięciu minut do osiągnięcia miliona, bez
ograniczania czasu czytania przez gracza. Główną osią pozostanie droga AMSO:
pierwsza paczka, wzrost i zator, uporządkowanie procesu, jakość i drugie życie
sprzętu, wpływ na ludzi, skala logistyki oraz milionowe zamówienie. Jedna historia
klienta — start z budżetem do 400 zł, laptop za 300 zł i powrót po roku z budżetem
100 000 zł — stanie się krótkim emocjonalnym przykładem wpływu AMSO. Pozostałe
historie zostaną skondensowane do krótkiego montażu wielu ludzkich planów.

Około czternastu kroków fabularnych zastąpi obecne czterdzieści dwa. Każdy krok
będzie zawierał jeden fakt, jedną czynność i jeden czytelny finał wizualny.
Nagłówek będzie miał do 7–8 słów, a tekst główny do 180–220 znaków. Tekst i liczby
pozostaną edytowalne w konfiguracji oraz marketingowym CSV, niezależnie od
ilustracji.

Warstwa wizualna pozostanie wektorowa i wykorzysta istniejący system świata,
stanów oraz kamer. Każdy rozdział otrzyma jedno spójne, wielowarstwowe
środowisko SVG. Kolejne kroki będą ujawniać lub zmieniać rozpoznawalne przedmioty
i ludzi: stół, laptop, paczkę, skaner, regał, stanowisko kontroli, taśmę,
pracownika, klienta i zespół. Abstrakcyjne ramki, swobodne linie i geometryczne
nakładki bez znaczenia zostaną usunięte, a gradient będzie sygnalizował wyłącznie
aktywny przepływ, sukces, postęp lub kulminację.

Każda karta uruchomi jedną krótką animację trwającą 1,5–3 sekundy, po czym
zatrzyma się w jednoznacznym stanie końcowym. Na początku karty przejście dalej
będzie zablokowane przez około 1,5 sekundy. Spacja, Enter, klik i tap wykonane w
tym czasie zostaną odrzucone, a nie odłożone do późniejszego wykonania. W trybie
ograniczonego ruchu animacja zostanie zastąpiona szybkim przejściem do stanu
końcowego, z zachowaniem około 500 ms ochrony przed przypadkowym wejściem.

Przed integracją powstanie osobny interaktywny prototyp klienta rozwijającego
firmę. Po jego zatwierdzeniu powstanie storyboard wszystkich około czternastu
kroków, a następnie rozdziały będą integrowane i odbierane pojedynczo.

## User Stories

1. Jako gracz chcę od razu rozpoznać przedmioty na scenie, abym rozumiał historię bez odgadywania znaczenia figur.
2. Jako gracz chcę widzieć konkretne działania, abym rozumiał związek przyczyny i skutku między kolejnymi krokami.
3. Jako gracz chcę widzieć drogę AMSO jako główną linię fabularną, abym wiedział, czyją historię opowiada gra.
4. Jako gracz chcę odróżniać historię AMSO od historii klienta, abym nie przypisywał klientowi działań firmy ani odwrotnie.
5. Jako gracz chcę poznać początek od pierwszej własnoręcznie zapakowanej paczki, abym rozumiał punkt startowy drogi do miliona.
6. Jako gracz chcę zobaczyć mały sklep i magazyn, abym odczuł kontrast między początkiem a późniejszą skalą.
7. Jako gracz chcę zobaczyć narastający zator realnych paczek i stanowisk, abym rozumiał problem wywołany wzrostem.
8. Jako gracz chcę zobaczyć uporządkowanie przyjęcia, kontroli, pakowania i wysyłki, abym rozumiał, jak AMSO odpowiedziało na zator.
9. Jako gracz chcę zobaczyć urządzenie przechodzące przez czytelny proces przygotowania, abym rozumiał znaczenie jakości.
10. Jako gracz chcę zobaczyć oznaczenie `SPRAWDZONY` jako rezultat realnego procesu, abym nie odbierał go jako pustego hasła.
11. Jako gracz chcę zobaczyć urządzenie wracające do obiegu, abym rozumiał ideę drugiego życia sprzętu.
12. Jako gracz chcę poznać jedną spójną historię klienta, abym otrzymał emocjonalny przykład wpływu AMSO bez utraty głównego wątku.
13. Jako gracz chcę zobaczyć klienta rozpoczynającego działalność z budżetem do 400 zł, abym znał jego rzeczywisty punkt wyjścia.
14. Jako gracz chcę zobaczyć wybór laptopa za 300 zł, abym rozumiał pierwszy konkretny krok klienta.
15. Jako gracz chcę zobaczyć powrót tego samego klienta po roku z budżetem 100 000 zł, abym odczuł rozwój jego firmy.
16. Jako gracz chcę widzieć tego samego anonimowego bohatera i pierwszy laptop w kolejnych krokach, abym nie pomylił historii z innym klientem.
17. Jako gracz chcę zobaczyć krótkie migawki innych planów i zastosowań sprzętu, abym wiedział, że główna historia jest jedną z wielu.
18. Jako gracz chcę otrzymać komunikat, że w milionie zamówień kryje się wiele podobnych historii, abym połączył skalę z ludźmi.
19. Jako gracz chcę widzieć stylizowanych pracowników AMSO, abym rozumiał rolę zespołu w rozwoju firmy.
20. Jako gracz chcę widzieć anonimowych, ale konsekwentnie przedstawionych klientów, abym rozumiał ich rolę bez ujawniania tożsamości.
21. Jako gracz chcę widzieć kuriera tylko podczas rozgrywki, abym nie mylił awatara z bohaterami opowieści.
22. Jako gracz chcę, aby scena fabularna zatrzymywała kuriera i usuwała go z kadru, abym mógł skupić się na właściwych uczestnikach historii.
23. Jako gracz chcę zobaczyć skalę rocznej sprzedaży telefonów w jednym czytelnym porównaniu, abym nie był przeciążony kilkoma podobnymi infografikami.
24. Jako gracz chcę zobaczyć wieżę z około 28 000 telefonów obok sylwetki PKiN, abym potrafił wyobrazić sobie około 240 metrów wysokości.
25. Jako gracz chcę wiedzieć, że liczba telefonów dotyczy okresu rocznego, abym właściwie interpretował porównanie.
26. Jako gracz chcę wrócić po porównaniu skali do magazynu, procesu i zespołu, abym widział ludzi stojących za liczbami.
27. Jako gracz chcę dojść do licznika 999 970 zamówień, abym rozumiał punkt startowy finału.
28. Jako gracz chcę, aby każda zebrana paczka zwiększała licznik o jeden, abym rozumiał fizyczny sens ostatnich trzydziestu zamówień.
29. Jako gracz chcę zobaczyć świętowanie miliona jako kulminację historii AMSO, abym odczuł wagę osiągnięcia.
30. Jako gracz chcę płynnie przejść po milionie do trybu wyzwania, abym rozumiał, że droga trwa dalej.
31. Jako gracz chcę ukończyć całą fabułę w około pięć minut, abym otrzymał pełną historię bez nadmiernego wydłużania kampanii.
32. Jako gracz chcę sam decydować, kiedy przejść dalej po przeczytaniu karty, abym nie był ograniczony timerem tekstu.
33. Jako gracz chcę widzieć około czternastu znaczących kroków zamiast czterdziestu dwóch drobnych kart, abym zachował ciągłość opowieści.
34. Jako gracz chcę, aby każdy krok zawierał tylko jeden główny fakt, abym nie musiał dzielić uwagi między kilka wątków.
35. Jako gracz chcę widzieć krótkie nagłówki i zwięzły tekst, abym mógł szybko połączyć słowa z animacją.
36. Jako gracz chcę, aby ilustracja pokazywała czynność, a tekst wyjaśniał jej znaczenie, abym nie czytał opisu tego, co już widzę.
37. Jako gracz chcę oglądać jedno środowisko rozwijające się w kolejnych krokach rozdziału, abym odczuwał ciągłość miejsca i czasu.
38. Jako gracz chcę zobaczyć jedną krótką animację po otwarciu karty, abym zauważył zmianę stanu.
39. Jako gracz chcę, aby animacja zatrzymała się w czytelnym stanie końcowym, abym mógł spokojnie analizować scenę i czytać.
40. Jako gracz chcę, aby animacje nie zapętlały się bez potrzeby, abym nie był rozpraszany podczas czytania.
41. Jako gracz chcę, aby przypadkowa spacja z rozgrywki nie zamykała pierwszej karty, abym nie stracił początku historii.
42. Jako gracz chcę, aby wczesne naciśnięcie Enter zostało odrzucone, abym nie przewinął sceny przez rozpędzone sterowanie.
43. Jako gracz dotykowy chcę, aby przypadkowy tap podczas wejścia do sceny został odrzucony, abym nie pominął animacji.
44. Jako gracz korzystający z myszy chcę, aby przypadkowy klik podczas wejścia do sceny został odrzucony, abym nie pominął treści.
45. Jako gracz chcę widzieć przycisk `Dalej` od początku w stanie nieaktywnym, abym rozumiał, że przejście stanie się dostępne po animacji.
46. Jako gracz chcę, aby przycisk `Dalej` uaktywnił się po kluczowej czynności animacji, abym wiedział, kiedy scena jest gotowa.
47. Jako gracz chcę, aby wczesne wejście nie wykonywało się automatycznie po odblokowaniu, abym zachował świadomą kontrolę.
48. Jako gracz chcę, aby po powrocie do rozgrywki klawisze działały natychmiast i przewidywalnie, abym nie stracił kontroli nad kurierem.
49. Jako gracz grający jedną ręką chcę wykonywać ślizg klawiszem `S`, abym nie musiał przenosić ręki na strzałkę w dół.
50. Jako gracz chcę, aby `S` i strzałka w dół były równoważnymi wejściami ślizgu, abym mógł wybrać wygodne sterowanie.
51. Jako gracz chcę, aby stan klawisza `S` został bezpiecznie wyzerowany podczas wejścia i wyjścia z karty, abym nie rozpoczął rozgrywki w niezamierzonym ślizgu.
52. Jako gracz chcę zachować spację i tap jako wejścia skoku, abym nie musiał uczyć się nowego sterowania po zmianie grafiki.
53. Jako gracz chcę przejść krótkie, niemożliwe do przegrania szkolenie, abym poznał skok i ślizg przed trudniejszymi wzorami.
54. Jako gracz chcę ukończyć `Zator Zamówień`, abym doświadczył problemu wynikającego ze wzrostu.
55. Jako gracz chcę ukończyć `Próbę Jakości`, abym uczestniczył w przygotowaniu urządzenia do dalszej drogi.
56. Jako gracz chcę przejść jedno klientowskie wyzwanie rozwoju firmy, abym połączył ruch z etapami historii klienta.
57. Jako gracz chcę zbierać podczas klientowskiego wyzwania pierwszy laptop, stanowisko i wyposażenie zespołu, abym widział, jak zebrane elementy budują firmę.
58. Jako gracz chcę, aby klientowskie wyzwanie nie udawało mechaniki wyboru, której gra nie posiada, abym rozumiał związek nazwy z działaniem.
59. Jako gracz chcę ukończyć `Szczyt Zamówień`, abym odczuł skalę logistyki przed finałem.
60. Jako gracz chcę zebrać trzydzieści paczek i ukończyć osiem kombinacji w finale, abym zasłużył na osiągnięcie miliona.
61. Jako gracz chcę zachować bezpieczne zasady fabuły bez game over, abym zawsze mógł poznać całą historię.
62. Jako gracz chcę odczuć realne ryzyko dopiero w trybie wyzwania, abym rozumiał zmianę zasad po milionie.
63. Jako gracz chcę zachować dotychczasowy wynik przy przejściu do wyzwania, abym odbierał oba tryby jako jedną drogę.
64. Jako gracz chcę widzieć wyłącznie elementy mające znaczenie fabularne lub funkcjonalne, abym nie interpretował dekoracji jako mechaniki.
65. Jako gracz chcę, aby paczka wyglądała jak paczka, skaner jak skaner, a konwejer jak konwejer, abym rozpoznawał scenę bez instrukcji.
66. Jako gracz chcę, aby gradient oznaczał aktywny przepływ, sukces, postęp lub kulminację, abym mógł nauczyć się jego znaczenia.
67. Jako gracz chcę, aby nieaktywny świat korzystał ze stabilnych, naturalnych kolorów przedmiotów, abym łatwo odróżniał stan od akcentu.
68. Jako gracz chcę, aby krótkie etykiety i liczby były częścią dostępnej treści, a nie obrazu, abym mógł je odczytać i powiększyć.
69. Jako pracownik marketingu chcę edytować tytuły, teksty, CTA i liczby bez zmiany ilustracji, abym mógł prowadzić niezależny proces redakcyjny.
70. Jako pracownik marketingu chcę otrzymać w CSV limity długości i miejsce na decyzję, abym przygotował tekst zgodny z rytmem gry.
71. Jako pracownik marketingu chcę zachować pełne materiały o innych klientach poza głównym przebiegiem gry, abym mógł wykorzystać je na landingu lub w kampanii.
72. Jako właściciel kampanii chcę usunąć porównanie z Boeingami z głównej gry, abym nie publikował zbędnego i trudnego do odczytania porównania.
73. Jako właściciel kampanii chcę zachować porównanie z PKiN, abym miał jeden czytelny dowód skali.
74. Jako użytkownik desktopu chcę widzieć ilustrację i tekst w jednej spójnej kompozycji, abym mógł śledzić działanie oraz jego znaczenie.
75. Jako użytkownik telefonu od 390 px chcę otrzymać osobno wykadrowaną kompozycję, abym nie tracił kluczowych przedmiotów poza ekranem.
76. Jako użytkownik telefonu chcę, aby główna czynność i jej rezultat mieściły się w całości w kadrze, abym rozumiał scenę bez przewijania ilustracji.
77. Jako użytkownik szerokiego ekranu chcę, aby scena pozostała w kontenerze strony i nie rozciągała się bez ograniczeń, abym odbierał ją jako część serwisu AMSO.
78. Jako użytkownik preferujący ograniczony ruch chcę zobaczyć ten sam znaczący stan końcowy bez intensywnej animacji, abym nie stracił treści.
79. Jako użytkownik preferujący ograniczony ruch chcę zachować krótki bufor przed przypadkowym przejściem dalej, abym nie pominął sceny.
80. Jako użytkownik klawiatury chcę widzieć poprawny stan fokusu nieaktywnego i aktywnego CTA, abym rozumiał dostępność działania.
81. Jako użytkownik czytnika ekranu chcę otrzymać nazwę głównej czynności oraz jej wynik, abym poznał historię bez polegania na ilustracji.
82. Jako projektant chcę najpierw zatwierdzić jeden interaktywny prototyp, abym sprawdził język wizualny przed przebudową wszystkich rozdziałów.
83. Jako projektant chcę zobaczyć storyboard wszystkich kroków przed integracją, abym wykrył powtórzenia i niejasne metafory.
84. Jako projektant chcę odbierać każdy rozdział osobno na desktopie i 390 px, abym ograniczył koszt późnych poprawek.
85. Jako tester chcę oceniać sceny bez tekstu, abym mierzył czytelność ilustracji zamiast skuteczności opisu.
86. Jako tester chcę, aby co najmniej cztery z pięciu osób poprawnie nazwały główny przedmiot i działanie po pięciu sekundach, abym miał jednoznaczny próg akceptacji.
87. Jako tester chcę przejść pełny production flow od pierwszej paczki do challenge, abym wykrył błędy kolejności, czasu i zachowania wyniku.
88. Jako właściciel produktu chcę móc dostroić czasy segmentów po testach, abym osiągnął około pięciu minut bez zmiany architektury opowieści.

## Implementation Decisions

- Projekt zachowuje jasną, nowoczesną, wektorową estetykę kampanii. Pełne
  przejście na pixel art nie jest częścią rozwiązania.
- Abstrakcyjne geometryczne nakładki zostają usunięte, nie zachowane jako
  dekoracyjne akcenty. Każdy widoczny element musi reprezentować przedmiot,
  osobę, czynność, trasę, stan lub wynik.
- Istniejąca warstwa prezentacji świata pozostaje punktem integracji. Światy są
  wielowarstwowymi SVG, a manifest wskazuje środowisko, stan, kamerę, kadrowanie,
  obecność postaci i znaczącą animację dla każdego kroku.
- Jeden rozdział korzysta z jednego ciągłego środowiska. Kolejne kroki nie są
  niezależnymi obrazkami; zmieniają warstwy i stan tego samego miejsca.
- Warstwy otrzymują nazwy wynikające z domeny sceny, na przykład pracownik,
  paczka, skaner, stanowisko kontroli, laptop, portfolio, regał i konwejer.
- Postacie są uproszczonymi ilustracjami bez cech portretowych. Historia AMSO
  pokazuje zespół, a historia klienta anonimowego, konsekwentnie wyglądającego
  bohatera.
- Kurier pozostaje wyłącznie awatarem aktywnej rozgrywki i jest nieobecny w
  kadrach czytania.
- Gradient pomarańczowy–koralowy–magenta jest semantycznym akcentem aktywnego
  przepływu, sukcesu, postępu lub kulminacji. Nie jest swobodną linią,
  przypadkową ramką ani podstawową barwą neutralnego przedmiotu.
- Tekst nie jest wypalany w obrazie rastrowym. Krótkie etykiety, liczby i CTA
  pochodzą z konfiguracji, pozostają dostępne dla technologii asystujących i są
  objęte eksportem marketingowym.
- Docelowa sekwencja ma około czternastu kroków: dwa dla początku, dwa dla zatoru
  i procesu, dwa dla jakości i drugiego życia, trzy dla głównej historii klienta,
  dwa dla skali i trzy dla dojścia do miliona, celebracji oraz zmiany trybu.
- Główna fabuła opowiada o AMSO. Historia klienta jest dowodem wpływu firmy, a
  nie nową osią opowieści.
- Główna historia klienta zachowuje potwierdzone fakty: start działalności,
  budżet do 400 zł, laptop za 300 zł oraz powrót po roku z budżetem 100 000 zł.
- Historia testowego zamówienia na 10% budżetu i siedmiu lat dalszego wyboru
  sprzętu poleasingowego dotyczy innego klienta. Nie wolno jej łączyć z główną
  historią. Jej szczegółowa wersja wychodzi z głównego flow gry i pozostaje w
  materiałach marketingowych lub na landingu.
- Historia kreatywnego startu oraz pozostałe przykłady są krótkim montażem wielu
  planów. Montaż nie wprowadza nowej pełnej osi fabularnej.
- Sekcja skali zachowuje około 28 000 telefonów rocznie i wieżę około 240 metrów
  obok PKiN. Porównanie 400 000 kg z pięcioma Boeingami 737 zostaje usunięte z
  głównej gry.
- Pierwsze przejście celuje w około pięć minut do miliona: około 3–3,5 minuty
  aktywnej rozgrywki oraz około 1,5–2 minuty standardowego oglądania kroków
  narracyjnych. Czytanie pozostaje bez limitu czasu.
- Aktywne segmenty obejmują krótkie szkolenie, `Zator Zamówień`, `Próbę Jakości`,
  jedno wyzwanie rozwoju klienta, `Szczyt Zamówień` i finałowy `Próg Miliona`.
- Trzy wyzwania dopasowania zostają zastąpione jednym segmentem rozwoju klienta.
  Zebrane przedmioty kolejno budują pierwszy laptop, stanowisko pracy i
  wyposażenie zespołu. Nazwa segmentu nie sugeruje mechaniki wyboru, której gra
  nie implementuje.
- Finał zachowuje cel trzydziestu paczek i ośmiu kombinacji, bez game over w
  fabule. Po milionie wynik jest zachowany, a challenge stosuje regułę pierwszej
  niezabezpieczonej kolizji kończącej próbę.
- Jedna karta zawiera jeden fakt i jedną znaczącą zmianę wizualną. Nagłówek ma do
  7–8 słów, a tekst główny do 180–220 znaków. Limity są walidowane i eksportowane
  do marketingowego CSV.
- Po wejściu do karty animacja odtwarza się raz przez 1,5–3 sekundy, następnie
  pozostawia stabilny stan końcowy. CTA nie zależy od zakończenia czytania, lecz
  od osiągnięcia minimalnego punktu animacji.
- Bramka kontynuacji ma stan zablokowany i aktywny. Przez około 1,5 sekundy po
  wejściu odrzuca Space, Enter, klik i tap. Wczesne wejścia nie są kolejkowane.
  CTA jest widoczne, ale poprawnie nieaktywne i niedostępne do aktywacji.
- Tryb ograniczonego ruchu przechodzi bez intensywnej animacji do tego samego
  stanu końcowego i zachowuje około 500 ms ochrony przed przypadkowym wejściem.
- Wejście i wyjście z karty zeruje aktywne stany skoku i ślizgu, aby zwolnienie
  klawisza nie zostało utracone na granicy trybów.
- Podczas aktywnej gry `S` i strzałka w dół pozostają równoważnymi wejściami
  ślizgu. `S` jest wymaganym kontraktem dostępności gry jedną ręką. Space i tap
  pozostają wejściami skoku.
- Każda scena ma konfigurację kamery desktopowej i mobilnej. W wariancie od 390
  px można usunąć wyłącznie drugorzędne otoczenie; główna czynność i jej wynik
  muszą w całości pozostać w kadrze.
- Pierwszym artefaktem jest osobny interaktywny prototyp głównej historii klienta
  z widokiem desktopowym i 390 px. Nie modyfikuje on production flow.
- Drugim punktem kontrolnym jest storyboard wszystkich około czternastu kroków.
  Dopiero po jego akceptacji rozdziały trafiają do głównego flow.
- Marketing może równolegle edytować tekst w CSV. Prototyp używa skróconego copy
  roboczego, a jego warstwa tekstowa nie jest sprzężona z geometrią SVG.

## Testing Decisions

- Testy automatyczne sprawdzają zachowanie widoczne dla użytkownika: kolejność
  kroków, osiągalność celów, działanie wejść, stan CTA, przejście trybów,
  prezentowane treści i kontrakt responsywny. Nie sprawdzają konkretnych ścieżek
  SVG ani liczby prymitywów rysunkowych.
- Najwyższym automatycznym szwem jest istniejący integracyjny harness pełnego
  lifecycle gry. Przechodzi production flow od pierwszej paczki przez wszystkie
  zatwierdzone segmenty, milion i przejście do challenge.
- Test lifecycle sprawdza, że flow zawiera docelowe około czternastu kroków,
  właściwe segmenty gry, około 3–3,5 minuty skonfigurowanej aktywnej rozgrywki,
  bezpieczną fabułę, zachowanie wyniku i brak resetu przy przejściu do challenge.
- Drugim szwem jest test prezentacji karty w DOM. Używa kontrolowanego zegara i
  prawdziwych zdarzeń klawiatury, myszy oraz dotyku.
- Test karty potwierdza, że Space, Enter, klik i tap przed otwarciem bramki są
  odrzucane, nie wykonują kontynuacji po upływie czasu, a CTA staje się aktywne
  dopiero po zatwierdzonym punkcie animacji.
- Test wejść potwierdza, że `S` oraz strzałka w dół wywołują ten sam ślizg po
  powrocie do gry, a ich stany nie pozostają aktywne po zamknięciu karty.
- Test ograniczonego ruchu potwierdza ten sam stan końcowy, brak intensywnego
  ruchu i skrócony bufor ochronny.
- Test konfiguracji treści potwierdza maksymalną liczbę słów nagłówka,
  180–220-znakowy limit tekstu, jeden CTA oraz jednoznaczną perspektywę każdego
  kroku.
- Test manifestu potwierdza mapowanie każdego kroku na istniejący świat, unikalny
  znaczący stan, kamerę desktopową, kamerę mobilną i opis czynności dostępny dla
  czytnika ekranu.
- Test mobilnego layoutu potwierdza obsługę 390 px oraz brak wyjścia oznaczonych
  jako krytyczne warstw poza bezpieczny kadr. Test desktopowy potwierdza osadzenie
  w kontenerze kampanii.
- Test eksportu marketingowego potwierdza, że wszystkie aktywne kroki, fakty,
  limity i pola decyzji trafiają do CSV, a usunięte kroki nie są eksportowane jako
  aktywne copy gry.
- Istniejące testy prezentacji historii, manifestu scen, świata wizualnego,
  production content, konfiguracji i pełnego trybu gry są wzorcem dla nowych
  przypadków. Preferowane jest rozszerzenie tych szwów zamiast tworzenia wielu
  nowych testów jednostkowych.
- Testy automatyczne nie zastępują odbioru wizualnego. Każdy z około czternastu
  finalnych kadrów przechodzi test pięciu sekund bez copy na desktopie i 390 px.
  Co najmniej cztery z pięciu osób muszą prawidłowo nazwać główny przedmiot i
  działanie.
- Kryterium ludzkie odrzuca scenę, jeśli testerzy odpowiadają wyłącznie nazwami
  figur, takimi jak „ramki”, „linie”, „kwadraty”, albo podają wzajemnie sprzeczne
  interpretacje.
- Akceptacja odbywa się etapami: prototyp klienta, storyboard całej historii,
  następnie każdy rozdział na desktopie i 390 px.

## Out of Scope

- Pełna przebudowa gry w pixel art, tworzenie kompletnego retro sprite sheetu i
  instalacja Aseprite MCP jako warunku wdrożenia.
- Zmiana głównej identyfikacji AMSO, zatwierdzonej jasnej palety kampanii,
  typografii strony lub konstrukcji docelowego kontenera 1600 px.
- Dodanie nowych sposobów sterowania, nowych pasów ruchu lub mechaniki wyboru
  zestawu sprzętu.
- Zmiana zasad challenge, systemu wyniku, gwarancji, bonusów, udostępniania i
  analityki poza dostosowaniem ich do skróconej sekwencji.
- Publikowanie szczegółowej historii klienta testującego 10% budżetu w głównym
  flow gry. Materiał pozostaje dostępny dla landingu i marketingu.
- Porównanie 400 000 kg sprzętu z pięcioma Boeingami 737 w głównej grze.
- Finalna redakcja marketingowa tekstów. Marketing pracuje równolegle w CSV.
- Modyfikacja production flow podczas pierwszego etapu prototypowania.

## Further Notes

- Spec zastępuje decyzje v5 dotyczące około siedmiu minut przejścia, czterdziestu
  dwóch kroków copy, trzech pełnych historii klientów, trzech wyzwań dopasowania
  oraz obecności porównania z Boeingami. Pozostałe zaakceptowane kontrakty v5
  obowiązują, o ile nie są sprzeczne z niniejszym dokumentem.
- Dwie historie biznesowe dotyczą różnych klientów. Nie wolno ich scalać w copy,
  animacji, montażu ani materiałach marketingowych.
- Pixel Art Creator może być narzędziem produkcji pojedynczych sprite’ów, ale nie
  jest wymagany ani rekomendowany jako główny kierunek artystyczny tej zmiany.
- Najważniejszym ryzykiem jest stworzenie ładniejszych, ale nadal niejednoznacznych
  obrazów. Dlatego test bez tekstu jest kryterium produktu, a nie opcjonalną
  konsultacją estetyczną.
- Pełny audyt obejmuje wszystkie aktywne sceny, nie tylko pięć zgłoszonych
  zrzutów. Każdy element bez funkcji lub znaczenia zostaje usunięty albo
  zastąpiony przedmiotowym odpowiednikiem.
