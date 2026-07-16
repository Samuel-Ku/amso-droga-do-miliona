# 08 — Tryb Wyzwania — progresja do 3,5×

**What to build:** Uczciwy, szybko przyspieszający endless runner po milionie, który proceduralnie łączy tylko sprawdzone wzory, zachowuje minimalny czas reakcji i zwiększa trudność na kilku kontrolowanych osiach.

**Blocked by:** 07 — Próg Miliona — finał bez bossa.

Status: ready-for-human

- [x] Pierwsze przejście z fabuły zachowuje wynik, paczki, combo i aktywne bonusy oraz jasno komunikuje nowe zasady.
- [x] Niezabezpieczona kolizja w wyzwaniu kończy bieg dopiero po krótkim efekcie uderzenia; aktywna gwarancja pochłania jedną kolizję, pęka i pozwala kontynuować.
- [x] Retry po game over rozpoczyna czyste wyzwanie z wynikiem 0, paczkami 0, combo ×1 i bez bonusów, ale zachowuje rekord oraz statystyki profilu.
- [x] Prędkość zaczyna około 1,85×, dochodzi do około 2,4× po 60 sekundach, 3,0× po 120 sekundach i maksymalnie 3,5× po 180 sekundach.
- [x] Po osiągnięciu 3,5× trudność rośnie przez długość sekwencji, cadence, precyzję i krótsze oddechy bez dalszego zwiększania prędkości.
- [x] Cykl 20–30 sekund zwiększa jedną dominującą oś: prędkość, gęstość, złożoność, precyzję albo presję; nie zwiększa wszystkich jednocześnie.
- [x] Proceduralny assembler korzysta wyłącznie z autorskich klocków, które przeszły walidację wykonalności.
- [x] Punkt spawnu przesuwa się dalej poza prawą krawędź wraz ze wzrostem prędkości, zapewniając co najmniej około 1,2 sekundy reakcji.
- [x] Burst zawsze kończy się oddechem, a generator nie tworzy niewykonalnego skok–ślizg ani kolizji paczki z przeszkodą.
- [x] Wieloseedowy test generatywny potwierdza wykonalność przy 3,5×, a lokalne QA zapisuje czas, prędkość i powód śmierci.
- [x] Mediana pierwszej próby po fabule może być oceniona względem celu 60–90 sekund bez ukrytego DDA.
