# 03 — Stabilna pętla klatek i adaptacyjna jakość dekoracji

**What to build:** Ruch kuriera, fizyka i świat zachowują stabilny rytm przy nierównych klatkach, a słabszy telefon redukuje wyłącznie dekoracje. Gra ma mierzalny budżet zbliżony do 60 FPS bez ukrytego ułatwiania rozgrywki.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [ ] Symulacja używa stałego kroku z ograniczonym nadrabianiem, a renderowanie pozostaje zsynchronizowane z klatkami przeglądarki.
- [ ] Długa pojedyncza klatka nie teleportuje kuriera, paczek ani przeszkód i nie wykonuje nieograniczonej liczby kroków nadrabiających.
- [ ] Efektywna rozdzielczość renderowania jest ograniczona do DPR 2 bez zmiany rozmiaru interfejsu.
- [ ] Często tworzone przeszkody, paczki i cząstki korzystają z ponownego użycia zamiast powodować stałą presję pamięci.
- [ ] Kontroler jakości obserwuje ruchome okno kilku sekund i reaguje dopiero na utrzymujący się brak budżetu.
- [ ] Degradacja może zmniejszyć cząstki i drugorzędne warstwy paralaksy, ale nie prędkość, liczbę przeszkód, fizykę, wejścia ani punktację.
- [ ] Instrumentowany ciężki kadr raportuje średnio co najmniej 58 FPS oraz p95 czasu klatki około 20 ms lub mniej na zatwierdzonej macierzy.
- [ ] Preferencja ograniczonego ruchu i adaptacyjna jakość nie tworzą sprzecznych stanów prezentacji.
- [ ] Testy potwierdzają identyczny wynik gameplay przy pełnej i zredukowanej jakości dekoracji.
