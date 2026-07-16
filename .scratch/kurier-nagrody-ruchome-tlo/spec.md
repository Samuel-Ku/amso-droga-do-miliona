# Kurier AMSO, celebracje progów i ruchome tło

Status: ready-for-human

## Problem Statement

Kurier nie korzysta jeszcze z właściwego znaku AMSO ani z zatwierdzonej palety
ubioru. Obecne czerwono-różowe akcenty postaci nie odpowiadają przekazanemu
referencyjnemu wyglądowi: pomarańczowej czapce i koszulce, niebieskiemu pasowi,
czarnym spodniom, białym butom oraz ciemnemu skanerowi z zielonym ekranem.
Brak dokładnego białego znaku `A` na koszulce osłabia rozpoznawalność marki.

Podczas aktywnego biegu wygenerowane tła są statyczne. Przeszkody i paczki
poruszają się w lewo, ale środowisko nie uczestniczy w ruchu, przez co bieg ma
mniej energii i słabsze wrażenie przemieszczania się. Jednocześnie tło nie może
konkurować z obiektami gameplay ani utrudniać czytania kart fabularnych.

Zbieranie paczek zwiększa wynik, lecz dłuższy bieg nie oferuje wystarczająco
widocznych chwil celebracji. Powtarzalna pojedyncza animacja szybko straciłaby
wartość motywacyjną. Gracz potrzebuje zmieniających się, ciekawych nagród
wizualnych za osiąganie coraz większych, okrągłych liczb paczek, bez ujawniania
następnego progu i bez zmiany balansu gry.

## Solution

Kurier otrzyma zatwierdzoną paletę we wszystkich pozach oraz dokładny,
przekazany przez użytkownika biały znak `A`. Znak zostanie automatycznie
przycięty do nieprzezroczystej zawartości, dzięki czemu pozostanie czytelny na
małej koszulce bez dodatkowej tabliczki lub ramki.

Podczas aktywnej rozgrywki tło będzie przesuwać się w lewo jako daleki
paralaks z prędkością równą 10% aktualnej prędkości świata. Pierwsza wersja
użyje dwóch sąsiadujących kopii tego samego tła, z których co druga będzie
odwrócona poziomo. Kopie będą cyklicznie zawijane, aby najpierw sprawdzić, czy
istniejące obrazy dają akceptowalny wizualnie ciągły ruch. W aktywnej grze tło
będzie widoczne w 60%, czyli przezroczyste w 40%. W kartach fabularnych
pozostanie nieruchome i widoczne w 80%.

Gra będzie celebrować progi `10, 50, 100, 500, 1 000, 5 000, 10 000,
50 000, 100 000…`. Po 10 kolejne wartości powstają przez naprzemienne
mnożenie przez 5 i przez 2, więc sekwencja nie wymaga końcowej listy. Każdy
próg może uruchomić się tylko raz w jednym biegu. Przejście z fabuły do Trybu
Wyzwania zachowuje licznik i historię pokazanych celebracji, natomiast nowa
próba rozpoczyna je od początku.

Pięć typów celebracji będzie rotować w stałej kolejności i zwiększać
intensywność w kolejnych cyklach: konfetti, pulsujące koło, łuki i wstęgi,
deszcz małych paczek oraz świetlna fala po trasie. Efekty nie używają gwiazd.
Każda celebracja pokazuje wyłącznie kolorowy komunikat osiągniętego wyniku,
na przykład `50 PACZEK!`; nie pokazuje następnego progu. Trwa około 1,2–1,5
sekundy, nie zatrzymuje gry i nie wpływa na wynik, szybkość, kolizje ani
power-upy. Towarzyszy jej krótki sygnał dźwiękowy respektujący wyciszenie.

## User Stories

1. Jako gracz chcę rozpoznać kuriera jako postać AMSO, abym łączył rozgrywkę z marką kampanii.
2. Jako gracz chcę widzieć dokładny biały znak `A` na koszulce kuriera, abym nie otrzymał przybliżonej lub błędnej wersji logo.
3. Jako właściciel marki chcę użyć przekazanego znaku bez zmiany jego geometrii, abym zachował zgodność identyfikacji.
4. Jako gracz chcę, aby znak `A` był czytelny mimo małego rozmiaru postaci, abym rozpoznał go podczas biegu.
5. Jako gracz chcę widzieć pomarańczową czapkę i koszulkę, abym otrzymał wygląd zgodny z zatwierdzonym odniesieniem.
6. Jako gracz chcę widzieć niebieski pas kuriera, abym odróżniał go od pomarańczowej koszulki.
7. Jako gracz chcę widzieć czarne spodnie i białe buty, abym zachował czytelną sylwetkę postaci.
8. Jako gracz chcę widzieć ciemny skaner z zielonym ekranem, abym rozpoznawał narzędzie pracy kuriera.
9. Jako gracz chcę widzieć tę samą paletę podczas biegu, skoku i ślizgu, abym nie odbierał zmiany pozy jako zmiany postaci.
10. Jako gracz chcę, aby gradient różowo-czerwony zniknął z ubioru kuriera, abym widział zatwierdzoną paletę zamiast wcześniejszej wersji.
11. Jako gracz chcę odczuwać ruch magazynu podczas biegu, abym miał silniejsze wrażenie przemieszczania się.
12. Jako gracz chcę, aby tło poruszało się wolniej niż przeszkody, abym odbierał je jako daleki plan, a nie obiekt gameplay.
13. Jako gracz chcę, aby ruch tła przyspieszał razem z grą, abym odczuwał wzrost tempa.
14. Jako gracz chcę, aby tło przesuwało się płynnie w lewo, abym nie widział zatrzymań między klatkami.
15. Jako gracz chcę, aby tło cyklicznie kontynuowało ruch, abym nie dochodził do pustej krawędzi obrazu.
16. Jako gracz chcę, aby sąsiednie kopie tła ograniczały widoczność ostrego szwu, abym nie tracił immersji.
17. Jako gracz chcę, aby zmiana epoki zachowywała tempo i pozycję ruchu, abym nie widział nagłego restartu paralaksy.
18. Jako gracz chcę, aby nowe tło przenikało ze starym podczas zmiany świata, abym otrzymał ciągły wizualnie bieg.
19. Jako gracz chcę, aby tło zatrzymywało się na pauzie, abym jednoznacznie rozumiał stan gry.
20. Jako czytelnik historii chcę nieruchomego tła na karcie fabularnej, abym mógł spokojnie czytać tekst.
21. Jako czytelnik historii chcę widzieć tło w 80%, abym zachował czytelność ilustracji.
22. Jako aktywny gracz chcę widzieć tło w 60%, abym łatwo odróżniał paczki, przeszkody i kuriera.
23. Jako gracz chcę otrzymać celebrację po zebraniu 10 paczek, abym szybko zauważył pierwsze osiągnięcie.
24. Jako gracz chcę otrzymać celebracje na 50, 100, 500 i 1 000 paczek, abym miał wyraźne kamienie milowe dłuższego biegu.
25. Jako gracz długiej próby chcę otrzymywać progi 5 000, 10 000, 50 000 i dalej, abym nie wyczerpał systemu nagród.
26. Jako gracz chcę, aby każdy próg świętowano tylko raz w biegu, abym nie otrzymywał powtarzających się komunikatów.
27. Jako gracz przechodzący z fabuły do Trybu Wyzwania chcę zachować postęp progów, abym odbierał oba tryby jako jedną drogę.
28. Jako gracz rozpoczynający nową próbę chcę ponownie zdobywać celebracje od 10 paczek, abym otrzymał pełną informację zwrotną nowego biegu.
29. Jako gracz chcę zobaczyć osiągniętą liczbę paczek, abym wiedział, za co otrzymuję celebrację.
30. Jako gracz chcę widzieć komunikat w rodzaju `1 000 PACZEK!`, abym od razu rozumiał znaczenie efektu.
31. Jako gracz chcę, aby napis był kolorowy i zgodny z gradientem AMSO, abym odbierał go jako sukces kampanii.
32. Jako gracz chcę, aby napis miał wystarczający kontrast na każdym tle, abym mógł go przeczytać w ruchu.
33. Jako gracz chcę, aby gra nie ujawniała następnego progu, abym zachował ciekawość kolejnej celebracji.
34. Jako gracz chcę zobaczyć różne typy animacji, abym był ciekawy następnej nagrody.
35. Jako gracz chcę, aby dwie kolejne celebracje nie wyglądały identycznie, abym nie odczuwał monotonii.
36. Jako gracz chcę zobaczyć konfetti bez symboli gwiazd, abym otrzymał neutralne i zgodne z marką świętowanie.
37. Jako gracz chcę zobaczyć pulsujące koło, łuki i wstęgi, abym doświadczał różnych form sukcesu.
38. Jako gracz chcę zobaczyć deszcz małych paczek, abym łączył celebrację z podstawową czynnością gry.
39. Jako gracz chcę zobaczyć falę światła po trasie, abym łączył większy próg z dalszą drogą.
40. Jako gracz chcę, aby późniejsze cykle były intensywniejsze, abym odczuwał rosnącą rangę wyników.
41. Jako gracz chcę, aby celebracja trwała krótko, abym zauważył sukces bez utraty rytmu biegu.
42. Jako gracz chcę, aby celebracja nie zatrzymywała gry, abym zachował pełną kontrolę nad kurierem.
43. Jako gracz chcę, aby cząstki znajdowały się za kurierem i przeszkodami, abym nie stracił informacji gameplay.
44. Jako gracz chcę, aby kolorowy napis znajdował się poniżej HUD, abym nie zasłaniał wyniku ani celu.
45. Jako gracz chcę, aby efekt nie zasłaniał nadchodzącej przeszkody, abym nie poniósł niesprawiedliwej kolizji.
46. Jako gracz chcę usłyszeć krótki sygnał osiągnięcia, abym otrzymał także dźwiękowe potwierdzenie sukcesu.
47. Jako gracz z wyciszonym dźwiękiem chcę, aby celebracja pozostała bezgłośna, abym zachował swoją preferencję.
48. Jako gracz chcę, aby większe progi miały pełniejszy sygnał, abym usłyszał różnicę rangi nagrody.
49. Jako gracz chcę, aby celebracje nie zmieniały punktów ani mechaniki, abym zachował dotychczasowy balans.
50. Jako gracz preferujący ograniczony ruch chcę zobaczyć statyczny kolorowy komunikat, abym nie stracił informacji o osiągnięciu.
51. Jako gracz preferujący ograniczony ruch chcę uniknąć konfetti, fal i skalowania, abym nie był narażony na intensywny ruch.
52. Jako użytkownik autonomicznego HTML chcę widzieć znak `A` bez dodatkowego połączenia sieciowego, abym mógł uruchomić grę lokalnie.
53. Jako użytkownik telefonu od 390 px chcę zachować czytelnego kuriera, napis i gameplay, abym otrzymał ten sam efekt co na desktopie.
54. Jako tester chcę przejść cały bieg od fabuły do Trybu Wyzwania, abym potwierdził ciągłość progów i tła.

## Implementation Decisions

- Źródłem znaku na koszulce jest przekazany przez użytkownika plik WebP z
  przezroczystością. Przezroczyste marginesy zostają przycięte bez zmiany
  geometrii białego `A`.
- Znak jest zasobem kampanii ładowanym przed aktywną grą i osadzanym także w
  autonomicznym HTML. Awaria zasobu nie może zablokować uruchomienia gry;
  kurier zachowuje czytelną pomarańczową koszulkę.
- Rysowanie kuriera pozostaje w istniejącym rendererze canvas. Wspólne tokeny
  palety i jedna funkcja znaku są używane przez pozycję stojącą, skok i ślizg,
  aby warianty nie rozchodziły się wizualnie.
- Paleta kuriera jest stała: pomarańczowe nakrycie głowy, koszulka i rękawy;
  niebieski pas; czarne spodnie; białe buty i znak; ciemnoszary skaner z zielonym
  ekranem; naturalny kolor skóry i brązowe detale twarzy.
- System ruchu tła działa wyłącznie podczas aktywnego stanu gameplay, zarówno w
  segmentach fabularnych, jak i w Trybie Wyzwania. Nie działa na landing page,
  kartach fabularnych, pauzie, countdownie ani ekranach wyników.
- Pierwszy wariant zapętlenia składa dwie kopie bieżącej planszy w poziomie.
  Kolejne kopie są naprzemiennie odbijane w osi X. Po wyjściu kopii poza lewą
  krawędź jest ona przenoszona za prawą kopię bez zmiany prędkości.
- Faza paralaksy jest ciągłą wartością należącą do trwającego biegu. Zmiana
  świata zachowuje fazę i prędkość; nowa plansza wchodzi przez istniejący
  crossfade zamiast rozpoczynać animację od zera.
- Prędkość paralaksy wynosi 10% aktualnej prędkości świata. Zmiana trudności
  automatycznie wpływa na ruch tła bez osobnego zegara tempa.
- Opacity aktywnej planszy wynosi `0.6` w gameplay i `0.8` w nieruchomych
  scenach fabularnych. Linia trasy, kurier, paczki, przeszkody i HUD nie są
  objęte opacity tła.
- Preferencja ograniczonego ruchu zatrzymuje paralaksę. Pauza i utrata aktywnego
  stanu rozgrywki także zatrzymują fazę bez jej resetowania.
- Generator progów zaczyna od 10 i naprzemiennie mnoży poprzedni próg przez 5
  i przez 2. Wynikiem jest nieskończona sekwencja `10, 50, 100, 500, 1 000…`.
- Stan biegu przechowuje aktualny następny próg oraz zbiór już pokazanych progów.
  Zdarzenie celebracji jest emitowane dokładnie raz przy przekroczeniu wartości.
- Licznik progów używa łącznej liczby paczek bieżącego biegu. Story → challenge
  nie zeruje go. Restart, nowa próba i powtórzenie historii tworzą nowy stan
  celebracji. Rekord profilu nie uruchamia celebracji po załadowaniu strony.
- Typ celebracji wynika deterministycznie z indeksu progu modulo pięć. Pełny
  cykl zwiększa poziom intensywności, ale nie zmienia czasu ani obszaru
  bezpieczeństwa efektu.
- Pięć typów to: konfetti, pulsujące koło, łuki i wstęgi, deszcz małych paczek
  oraz świetlna fala po programowej trasie. Żaden typ nie używa gwiazdy ani
  symbolu przypominającego gwiazdę.
- Warstwa cząstek jest rysowana po tle i trasie, ale przed paczkami,
  przeszkodami, kurierem oraz osłoną gwarancji. Komunikat tekstowy jest osobną
  warstwą nad sceną, poniżej HUD.
- Komunikat zawiera wyłącznie osiągniętą liczbę sformatowaną dla języka polskiego
  oraz słowo `PACZEK!`. Nie zawiera kolejnego progu, postępu do celu ani CTA.
- Napis korzysta z gradientu pomarańczowy–koralowy–magenta oraz kontrastowej
  jasnej podkładki i ciemnego konturu. Pozostaje czytelny na wszystkich siedmiu
  planszach oraz przy szerokości 390 px.
- Celebracja trwa od 1,2 do 1,5 sekundy według typu. Jest równoległa do gameplay,
  nie blokuje wejść i nie zmienia spawnu, kolizji, wyniku, combo ani power-upów.
- Silnik audio otrzymuje rodzinę krótkich cue osiągnięcia. Kolejne poziomy mogą
  dodawać nuty do tej samej frazy. Cue respektuje istniejący stan wyciszenia i
  nie zatrzymuje muzyki.
- Przy `reduced motion` zdarzenie i tekst pozostają, ale warstwa cząstek, skala,
  puls, fala i przesunięcia są wyłączone. Komunikat jest statyczny i znika po
  tym samym czasie.
- Jeśli zapętlenie z odbiciem okaże się wizualnie nieakceptowalne, zmiana metody
  panoramowania wymaga nowej decyzji. Pierwsza implementacja nie dodaje
  automatycznie powiększenia planszy.

## Testing Decisions

- Testy mają opisywać zachowanie widoczne dla gracza, a nie liczbę prymitywów
  canvas, konkretne selektory CSS ani wewnętrzne nazwy funkcji.
- Głównym szwem jest istniejący integracyjny harness pełnego lifecycle gry.
  Symuluje zbieranie paczek, aktywne klatki, przejście story → challenge,
  restart oraz rendering przy rzeczywistych snapshotach stanu.
- Test lifecycle potwierdza dokładną sekwencję pierwszych progów, pojedyncze
  uruchomienie każdego progu, ciągłość po zmianie trybu oraz reset po nowym biegu.
- Test prezentacji obserwuje publiczne zdarzenie/snapshot celebracji: osiągnięty
  próg, typ rotacji, poziom intensywności, czas aktywności i sformatowany tekst.
  Nie sprawdza tablicy cząstek ani współrzędnych pojedynczego konfetti.
- Test renderera używa istniejącego kontrolowanego canvas context i potwierdza,
  że logo jest rysowane w obu pozach, zatwierdzone kolory są używane, a elementy
  gameplay powstają po warstwie cząstek. Test nie wykonuje porównania piksel po
  pikselu.
- Test paralaksy na poziomie pełnego kadru potwierdza, że aktywny bieg przesuwa
  fazę w lewo proporcjonalnie do prędkości, pauza i karta fabularna ją
  zatrzymują, a zmiana świata zachowuje fazę.
- Test responsywny obejmuje desktop oraz 390×844 i potwierdza, że komunikat nie
  koliduje z HUD, kurierem ani strefą pojawiania się przeszkód.
- Test `reduced motion` potwierdza nieruchome tło i statyczny komunikat bez
  aktywnej warstwy cząstek, przy zachowaniu treści i czasu ekspozycji.
- Test audio wykorzystuje istniejący mock silnika cue: celebracja wywołuje jeden
  właściwy sygnał, większy poziom wybiera pełniejszy wariant, a wyciszenie nie
  uruchamia słyszalnego wyjścia.
- Test planu zasobów i autonomicznego HTML potwierdza, że przycięty znak `A`
  jest częścią właściwego bundle, ma poprawny typ obrazu i nie pozostawia
  zewnętrznego URL w pliku QA.
- Manualny odbiór wizualny obejmuje co najmniej progi 10, 50, 100, 500 i 1 000
  na desktopie oraz 390 px. Sprawdza czytelność logo, szew cyklicznego tła,
  kontrast komunikatu, brak gwiazd oraz brak zasłoniętych przeszkód.
- Kryterium akceptacji ruchu tła: podczas ciągłego biegu tester nie zauważa
  pustej krawędzi ani wyraźnego skoku przy zawinięciu. Jeśli odbicie tworzy
  nieakceptowalny wzór, wynik testu jest podstawą do kolejnej decyzji projektowej,
  a nie do ukrytego dodania skalowania.
- Prior art stanowią istniejące testy lifecycle gry, scoringu i zbierania paczek,
  progresji kontrolera, warstwy świata, audio cue, asset bundle, single-file QA,
  responsive canvas oraz `reduced motion`.

## Out of Scope

- Dodawanie punktów, mnożnika, ochrony, dodatkowego życia lub innej przewagi za
  osiągnięcie progu.
- Pokazywanie następnego progu, paska postępu do progu lub stałego elementu HUD.
- Zatrzymywanie gry, spowalnianie przeszkód albo tworzenie bezpiecznego korytarza
  podczas celebracji.
- Voice-over lub wypowiadanie liczb paczek.
- Zmiana modelu punktacji, combo, spawnu, kolizji, power-upów lub trudności.
- Regenerowanie siedmiu plansz albo dodawanie linii trasy do bitmap.
- Powiększanie plansz do 115%, ograniczone panoramowanie lub generowanie nowych
  bezszwowych teł w pierwszej wersji.
- Zmiana wyglądu paczek, przeszkód, osłony gwarancji lub postaci fabularnych.
- Zmiana treści fabuły i marketingowego CSV.

## Further Notes

- Referencja kuriera jest materiałem kierunkowym dla palety i podziału stroju.
  Przekazany przez użytkownika przezroczysty WebP jest wiążącym źródłem kształtu
  białego znaku `A`.
- Plik referencyjny postaci może zawierać tło i kompresję; nie jest gotowym
  sprite’em do wklejenia. Kurier nadal jest rysowany przez istniejący renderer.
- „40% przezroczyste” zostało jednoznacznie zatwierdzone jako `opacity: 0.6`
  podczas gameplay. Nieruchome sceny fabularne zachowują `opacity: 0.8`.
- Sekwencja efektów ma budować ciekawość przez zmienność samej celebracji, a nie
  przez zapowiedź następnej wartości.
