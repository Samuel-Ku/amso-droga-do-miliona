# Droga do Miliona v11 — balans paczek i sprzętu

Status: ready-for-agent

## Problem Statement

Trasy zawierają zbyt mało paczek, przez co zbieranie nie daje wystarczającego
poczucia obfitości ani rytmu nagradzania. Notebook, telefon, PC i LCD są już
widoczne jako collectible, ale zachowują się niemal tak samo jak paczka: pojawiają
się bez czytelnej hierarchii wartości i dają tę samą liczbę punktów. Gracz nie ma
więc powodu, aby traktować sprzęt jako rzadszą, bardziej ekscytującą zdobycz.

Samo zwiększenie liczby obiektów mogłoby pogorszyć czytelność przeszkód,
produkować niemożliwe trajektorie i przeciążyć ekran. Potrzebny jest kontrolowany
balans, który zwiększy liczbę paczek, doda sprzęt jako premię za trudniejszą
trajektorię, zachowa uczciwość endless runnera i nie pomiesza licznika paczek z
wynikiem punktowym.

## Solution

Gra rozdzieli zwykłą paczkę od czterech rodzajów sprzętu. Paczka pozostanie
podstawowym collectible i będzie warta 100 punktów. Każdy notebook, telefon, PC
i LCD będzie dodatkowym, rzadszym collectible wartym 250 punktów. Sprzęt nie
zastępuje paczek w zatwierdzonych zakresach: w fabule kombinacja zawiera 3–6
paczek oraz 0–1 sprzęt, a w Trybie Wyzwania 5–8 paczek oraz 1–2 sprzęty.

Generator będzie używał kontrolowanego worka nagród zamiast czystego losowania.
W dłuższej sesji sprzęt stanowi około 20% collectible, nie pojawia się dwa razy
pod rząd, a jego cztery warianty są mieszane. W Trybie Wyzwania pierwszy sprzęt
pojawia się nie później niż po około 8 sekundach, a późniejsza przerwa bez sprzętu
nie przekracza około 12 sekund.

Sprzęt w fabule będzie leżał na bezpiecznej trajektorii zgodnej z celem sceny.
W Trybie Wyzwania będzie premią za trudniejszą, ale zwalidowaną i osiągalną
trajektorię. Paczki i sprzęt utworzą czytelne łuki, schodki, krótkie grupy, grupy
przed i po przeszkodzie oraz rozwidlenia łatwa trasa / premiowana trasa. Na
ekranie nie będzie więcej niż siedem widocznych collectible, a żadna nagroda nie
przetnie przeszkody ani nie zasłoni informacji o wymaganym skoku lub przysiadzie.

Paczka zwiększa wynik o 100 i licznik paczek. Sprzęt zwiększa wynik o 250 i może
realizować fabularny cel konkretnego typu sprzętu, ale nie zwiększa licznika
paczek ani progów celebracji paczek. Pominięcie sprzętu nie powoduje kary.
Zebranie obu klas jest rozróżnione krótkim feedbackiem `+100` / `+250`, siłą
efektu i dźwiękiem, bez stałej legendy na HUD.

Po wdrożeniu nowej ekonomii rekord Trybu Wyzwania rozpoczyna nową wersję.
Postęp fabuły i pozostała statystyka przejścia nie są resetowane.

## User Stories

1. Jako gracz chcę widzieć więcej paczek na trasie, aby zbieranie było stałym i satysfakcjonującym elementem biegu.
2. Jako gracz fabularny chcę otrzymywać 3–6 paczek w kombinacji, aby trasa była bogatsza bez zagłuszania historii.
3. Jako gracz Trybu Wyzwania chcę otrzymywać 5–8 paczek w kombinacji, aby tryb był wyraźnie bardziej intensywny.
4. Jako gracz chcę, aby sprzęt pojawiał się dodatkowo względem paczek, aby różnorodność nie zmniejszała liczby podstawowych nagród.
5. Jako gracz fabularny chcę widzieć 0–1 sprzęt w kombinacji, aby technika wzmacniała temat sceny bez nadmiaru.
6. Jako gracz Trybu Wyzwania chcę widzieć 1–2 sprzęty w kombinacji, aby regularnie podejmować decyzję o trudniejszej trasie.
7. Jako gracz chcę otrzymywać 100 punktów za paczkę, aby podstawowa wartość była prosta i przewidywalna.
8. Jako gracz chcę otrzymywać 250 punktów za każdy sprzęt, aby rzadszy collectible był wyraźnie cenniejszy.
9. Jako gracz chcę, aby notebook, telefon, PC i LCD miały tę samą wartość, aby nie zapamiętywać tabeli punktów.
10. Jako gracz chcę widzieć wszystkie cztery typy sprzętu, aby collectible nie wyglądały stale tak samo.
11. Jako gracz chcę, aby sprzęt stanowił około 20% nagród w dłuższej sesji, aby pozostał wyjątkowy.
12. Jako gracz chcę, aby paczki stanowiły około 80% nagród w dłuższej sesji, aby główny motyw zbierania pozostał czytelny.
13. Jako gracz chcę uniknąć dwóch sprzętów pojawiających się bezpośrednio po sobie, aby premia nie spowszedniała.
14. Jako gracz chcę, aby cztery warianty sprzętu były mieszane, aby kolejne premie były wizualnie różnorodne.
15. Jako gracz rozpoczynający Tryb Wyzwania chcę zobaczyć pierwszy sprzęt w ciągu około 8 sekund, aby szybko odkryć nowe zasady punktacji.
16. Jako gracz Trybu Wyzwania chcę, aby przerwa bez sprzętu nie przekraczała około 12 sekund, aby premia regularnie wracała.
17. Jako gracz fabularny chcę, aby sprzęt pojawiał się zgodnie z opowiadaną sceną, aby nie wyglądał jak przypadkowy bonus.
18. Jako gracz fabularny chcę zbierać sprzęt po bezpiecznej, oczywistej trajektorii, aby móc śledzić narrację.
19. Jako gracz Trybu Wyzwania chcę znajdować sprzęt na trudniejszej trasie, aby 250 punktów było nagrodą za umiejętność.
20. Jako gracz chcę, aby każda premiowana trajektoria była osiągalna przy aktualnej prędkości, aby ryzyko było uczciwe.
21. Jako gracz chcę, aby collectible nigdy nie przecinał hitboxa przeszkody, aby zebranie nie wymagało kolizji.
22. Jako gracz chcę, aby collectible nie przecinały się wzajemnie, aby każdy obiekt był rozpoznawalny.
23. Jako gracz chcę mieć wolną strefę czytelności przed przeszkodą, aby od razu rozumieć wymagany ruch.
24. Jako gracz chcę widzieć łuki paczek nad niskimi przeszkodami, aby trasa naturalnie sugerowała skok.
25. Jako gracz chcę widzieć niskie linie paczek przed górną przeszkodą, aby trasa sugerowała przysiad.
26. Jako gracz chcę widzieć schodki rosnące i opadające, aby zbieranie miało rytm wysokości.
27. Jako gracz chcę widzieć krótkie grupy przed i po przeszkodzie, aby nie każda kombinacja była jednym rzędem.
28. Jako gracz chcę widzieć sprzęt na końcu trudniejszej kombinacji, aby pełnił rolę czytelnego finału nagrody.
29. Jako gracz Trybu Wyzwania chcę czasem wybierać między łatwą trasą z paczkami a trudniejszą trasą ze sprzętem, aby moje decyzje miały znaczenie.
30. Jako gracz chcę widzieć maksymalnie siedem collectible w obszarze ekranu, aby większa liczba paczek nie tworzyła chaosu.
31. Jako gracz chcę, aby kolejna grupa wjeżdżała płynnie z prawej strony, aby nagrody nie pojawiały się nagle przede mną.
32. Jako gracz chcę, aby kolejna grupa nie nakładała się na poprzednią, aby trasa pozostawała czytelna.
33. Jako gracz chcę mieć o 15% większą strefę zebrania sprzętu niż paczki, aby telefon i szeroki monitor były równie łatwe do zebrania.
34. Jako gracz chcę, aby wszystkie typy sprzętu korzystały z jednej pobłażliwej strefy zebrania, aby ich różne proporcje nie zmieniały trudności.
35. Jako gracz chcę zobaczyć krótkie `+100` po zebraniu paczki, aby rozumieć podstawową nagrodę.
36. Jako gracz chcę zobaczyć kolorowe `+250` po zebraniu sprzętu, aby natychmiast rozpoznać premię.
37. Jako gracz chcę, aby feedback sprzętu był silniejszy od feedbacku paczki, aby rzadsza nagroda cieszyła bardziej.
38. Jako gracz chcę usłyszeć odrębny przyjemny dźwięk sprzętu, aby rozpoznawać premię bez odrywania wzroku od trasy.
39. Jako gracz chcę, aby feedback punktowy znikał po około 0,6 sekundy, aby nie zasłaniał następnej przeszkody.
40. Jako gracz chcę uniknąć stałej legendy punktów na HUD, aby ekran pozostał prosty.
41. Jako gracz chcę, aby paczka zwiększała licznik paczek, aby progi 10, 50, 100, 500 i 1000 zachowały jednoznaczne znaczenie.
42. Jako gracz chcę, aby sprzęt nie zwiększał licznika paczek, aby celebracja „50 paczek” zawsze oznaczała pięćdziesiąt fizycznych paczek.
43. Jako gracz chcę, aby sprzęt nie uruchamiał progów celebracji paczek, aby komunikat nagrody był zgodny z tym, co zebrałem.
44. Jako gracz fabularny chcę, aby notebook, telefon, PC lub LCD realizował odpowiadający mu cel sceny, aby nowe rozdzielenie liczników nie blokowało historii.
45. Jako gracz chcę, aby pominięty sprzęt nie zabierał punktów, aby trudniejsza linia była dobrowolnym ryzykiem.
46. Jako gracz chcę, aby pominięty sprzęt nie przerywał serii paczek, aby bonus nie stawał się ukrytą karą.
47. Jako gracz chcę, aby pominięty sprzęt nie odtwarzał negatywnego dźwięku, aby gra nie karała mnie emocjonalnie za bezpieczny wybór.
48. Jako powracający gracz chcę rozpocząć nowy rekord Trybu Wyzwania po zmianie ekonomii, aby porównywać wyniki liczone według tych samych zasad.
49. Jako powracający gracz chcę zachować ukończenie fabuły, aby zmiana balansu nie zmuszała mnie do ponownego przechodzenia historii.
50. Jako powracający gracz chcę zachować ogólną statystykę przejścia poza rekordem challenge, aby aktualizacja nie usuwała mojego postępu.
51. Jako tester chcę odtworzyć identyczne fale z ustalonego seeda, aby sprawdzać balans bez wpływu losowości.
52. Jako tester chcę zmierzyć długoterminową proporcję 80/20, aby worek nagród zachowywał zatwierdzony balans.
53. Jako tester chcę sprawdzić minimalną i maksymalną liczbę paczek w obu trybach, aby zakresy 3–6 i 5–8 nie były tylko deklaracją.
54. Jako tester chcę sprawdzić gwarancję pierwszego sprzętu i maksymalnej przerwy, aby premia nie znikała z sesji.
55. Jako tester chcę zwalidować każdą trajektorię przy pełnym zakresie prędkości, aby wzrost tempa nie tworzył niemożliwych nagród.
56. Jako tester chcę sprawdzić maksymalnie siedem widocznych collectible, aby gęste fale nie przeciążały małego ekranu.
57. Jako tester chcę sprawdzić wynik, licznik paczek i cele fabularne po zebraniu każdego typu, aby trzy skutki nie mieszały się ze sobą.
58. Jako tester chcę sprawdzić brak skutku po pominięciu sprzętu, aby opcjonalna nagroda nie wprowadzała kary.
59. Jako tester chcę sprawdzić migrację rekordu niezależnie od postępu fabuły, aby aktualizacja resetowała tylko właściwe dane.
60. Jako tester mobilny chcę rozpoznać paczkę i cztery rodzaje sprzętu przy docelowym rozmiarze, aby decyzje były możliwe na telefonie.
61. Jako tester dostępności chcę, aby różnica `+100/+250` nie opierała się wyłącznie na kolorze, aby była czytelna również bez rozróżniania barw.
62. Jako tester wydajności chcę zachować stabilny budżet klatek przy gęstszych falach, aby większa liczba collectible nie powodowała szarpania gry.

## Implementation Decisions

- Model collectible rozróżnia co najmniej klasę `parcel` oraz klasę `equipment`.
  Cztery typy sprzętu pozostają jawne: notebook, telefon, PC i LCD.
- Bazowa wartość paczki wynosi 100 punktów. Każdy typ sprzętu ma wspólną
  wartość 250 punktów.
- Licznik paczek jest osobnym stanem od wyniku punktowego i od realizacji
  fabularnego celu konkretnego typu sprzętu.
- Zebranie paczki aktualizuje wynik oraz licznik paczek. Zebranie sprzętu
  aktualizuje wynik i ewentualny cel fabularny, ale nie licznik paczek ani
  dyrektor celebracji paczek.
- Dla fal fabularnych kontrakt gęstości wynosi 3–6 paczek plus 0–1 sprzęt.
  Dla fal Trybu Wyzwania wynosi 5–8 paczek plus 1–2 sprzęty.
- Sprzęt jest dodatkiem do liczby paczek, a nie zamiennikiem pozycji w
  zatwierdzonym zakresie paczek.
- Rozkład sprzętu używa deterministycznego worka wagowego. Długoterminowy cel
  wynosi około 20% sprzętu, bez dwóch sprzętów bezpośrednio po sobie i z
  mieszaniem czterech wariantów.
- Tryb Wyzwania gwarantuje pierwszy sprzęt do około 8 sekund od rozpoczęcia oraz
  nie dopuszcza przerwy dłuższej niż około 12 sekund bez sprzętu.
- Generator wzorców obsługuje łuk, niską linię, schodki rosnące, schodki
  opadające, dwie krótkie grupy, premiowany finał oraz alternatywną trasę.
- Walidator geometrii ocenia całą falę: hitboxy przeszkód, collectible i gracza,
  zasięg skoku/przysiadu, aktualną prędkość, czas reakcji, strefę czytelności
  przed przeszkodą oraz granice grywalnego obszaru.
- Sprzęt w fabule korzysta z bezpiecznej trajektorii. W challenge może używać
  trudniejszej trajektorii wyłącznie po przejściu tej samej walidacji osiągalności.
- Maksymalnie siedem collectible może jednocześnie znajdować się w widocznym
  obszarze gry. Obiekty oczekujące poza prawą krawędzią nie mogą wejść w aktywną
  grupę z naruszeniem limitu lub minimalnego odstępu.
- Hitbox podnoszenia sprzętu jest ujednolicony między czterema assetami i ma
  około 115% rozmiaru hitboxa standardowej paczki. Nie wynika z przezroczystych
  marginesów konkretnego obrazu.
- Feedback zebrania ma dwa poziomy. Paczka emituje `+100`; sprzęt emituje
  kolorowe, silniejsze `+250`. Oba znikają po około 0,6 sekundy i nie tworzą
  stałej legendy HUD.
- Różnica feedbacku nie opiera się wyłącznie na kolorze: wartość liczbowa,
  intensywność ruchu/światła i sygnał dźwiękowy wspólnie kodują rangę nagrody.
- Pominięcie sprzętu nie zmienia wyniku, licznika paczek, combo ani stanu audio.
- Rekord Trybu Wyzwania otrzymuje nową wersję magazynowanego klucza lub jawną
  migrację do pustego rekordu. Postęp fabuły i pozostałe dane nie są usuwane.
- Zmiana świadomie zastępuje część wcześniejszego kontraktu v10 „wszystkie
  collectible są jednym Zamówieniem”. W zakresie gameplay nowe pojęcia są
  rozdzielone: fizyczna paczka steruje licznikiem paczek, sprzęt jest premią
  punktową i możliwym celem fabularnym.
- Fabularny licznik `999 970 → 1 000 000` nie jest przeprojektowywany przez tę
  specyfikację. Jeżeli korzysta obecnie z ogólnego licznika collectible,
  implementacja ma zachować jego zatwierdzony przebieg niezależnie od nowego
  licznika celebracji paczek.

## Testing Decisions

- Głównym i najwyższym seamem jest deterministyczna sesja przez publiczny
  snapshot silnika biegu. Test nie sprawdza prywatnej kolejki generatora, lecz
  widoczne fale, zbieranie, wynik, licznik paczek, cele, pominięcia i zapis
  rekordu.
- Jeden integracyjny scenariusz z ustalonym seedem obejmuje oba tryby, wszystkie
  pięć wizualnych typów collectible, co najmniej jeden próg paczek, przejście do
  challenge, zakończenie próby i ponowne uruchomienie.
- Testy generatora oparte na zachowaniu sprawdzają zakresy 3–6 i 5–8 paczek,
  zakresy sprzętu, brak sąsiedniego sprzętu, rotację wariantów oraz proporcję
  zbliżoną do 80/20 na dużej, deterministycznej próbce.
- Test zegara challenge sprawdza sprzęt do 8 sekund i brak przerwy powyżej 12
  sekund. Tolerancja powinna uwzględniać wejście obiektu spoza prawej krawędzi,
  ale mierzyć moment, w którym collectible jest realnie dostępny graczowi.
- Property tests wykorzystują wiele seedów, pełny zakres prędkości i wszystkie
  rodziny przeszkód. Asercje dotyczą osiągalności, braku przecięć i zachowania
  strefy reakcji, a nie konkretnych współrzędnych jednej implementacji.
- Test widoczności symuluje przesuwanie fal i potwierdza, że liczba collectible
  wewnątrz viewportu nigdy nie przekracza siedmiu.
- Test zbierania parametryzuje paczkę i cztery rodzaje sprzętu: paczka daje 100 i
  zwiększa licznik paczek; sprzęt daje 250, nie zwiększa licznika paczek i nadal
  może zamknąć odpowiadający cel fabularny.
- Test pominięcia przepuszcza sprzęt poza lewą krawędź i potwierdza brak kary,
  przerwania serii oraz negatywnego sygnału.
- Istniejące testy DOM pozostają prior art dla krótkiego feedbacku. Sprawdzają
  treść `+100/+250`, czas życia, brak stałej legendy oraz bezpieczną pozycję poza
  przeszkodami i głównym HUD.
- Istniejące testy audio pozostają prior art dla sygnałów pickup. Sprawdzają
  rozróżnialny sygnał sprzętu, obsługę globalnego wyciszenia i brak sygnału po
  pominięciu.
- Test magazynu stanu rozpoczyna nowy rekord challenge dla nowej wersji
  ekonomii, zachowując ukończenie fabuły i pozostałe statystyki.
- Test wydajności uruchamia najgęstsze zatwierdzone fale i potwierdza brak
  wzrostu puli/DOM w czasie oraz zachowanie istniejącego budżetu stabilnej pętli.
- Testy powinny oceniać wyłącznie zachowanie widoczne przez publiczny snapshot,
  renderowany DOM/canvas, audio contract i magazyn stanu. Nie powinny wiązać się
  z nazwami prywatnych pól, kolejnością wewnętrznych metod ani dokładną strukturą
  worka losującego.

## Out of Scope

- Zmiana wartości lub działania Gwarancji i pozostałych power-upów.
- Dodawanie nowego rodzaju power-upu.
- Przeprojektowanie assetów paczki, notebooka, telefonu, PC lub LCD.
- Zmiana fizyki skoku, przysiadu, prędkości maksymalnej lub kolizji przeszkód.
- Zmiana treści fabuły, kart narracyjnych albo kolejności światów.
- Przeprojektowanie celebracji progów poza zmianą źródła ich licznika.
- Zmiana listy progów 10, 50, 100, 500, 1000 i dalszych progów otwartych.
- Reset ukończenia fabuły, analityki uruchomień lub pełnej historii lokalnej.
- Backendowy ranking, synchronizacja rekordu między urządzeniami lub konto
  gracza.
- Zmiana fabularnego znaczenia miliona lub danych marketingowych kampanii.

## Further Notes

- Specyfikacja jest wynikiem zakończonej sesji `grill-me`; wszystkie wartości i
  zasady zostały jawnie zatwierdzone przez użytkownika.
- Określenie „około 20%” opisuje zachowanie długiej sesji. Pojedyncza krótka fala
  podporządkowuje się przede wszystkim zakresom 0–1 / 1–2 oraz gwarancjom czasu.
- Limity czasu sprzętu dotyczą Trybu Wyzwania, ponieważ fabuła zachowuje
  autorskie, tematyczne fale.
- Nowy kontrakt licznika paczek jest celowym odejściem od wcześniejszego v10.
  Spec i przyszłe tickety v11 mają pierwszeństwo w tym ograniczonym zakresie.
- Po implementacji balans powinien przejść ręczny test na desktopie i realnym
  telefonie. Szczególnie należy ocenić, czy siedem widocznych collectible nadal
  pozwala natychmiast rozpoznać przeszkodę oraz czy `+250` jest atrakcyjne, ale
  nie zasłania trasy.
