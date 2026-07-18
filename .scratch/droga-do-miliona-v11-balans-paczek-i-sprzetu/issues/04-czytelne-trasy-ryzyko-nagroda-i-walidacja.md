# 04 — Czytelne trasy ryzyko–nagroda i walidacja geometrii

**What to build:** Ułożyć zwiększoną liczbę paczek i sprzętu w różnorodne, czytelne trasy endless runnera. Fabularna linia ma pozostać bezpieczna, a challenge ma oferować dobrowolną, trudniejszą linię ze sprzętem. Każdy układ musi być zwalidowany dla aktualnej prędkości, skoku i przysiadu, a ekran nie może zostać przeciążony.

**Blocked by:** 02 — Gęstsze fabularne fale paczek i sprzętu; 03 — Kontrolowany worek nagród Trybu Wyzwania

**Status:** ready-for-agent

- [ ] Grywalna biblioteka obejmuje łuk, niską linię, schodki rosnące, schodki opadające, dwie krótkie grupy, premiowany finał i alternatywną trasę.
- [ ] Sprzęt challenge znajduje się na trudniejszej, ale dobrowolnej i osiągalnej linii, podczas gdy podstawowe paczki pozostają możliwe do zebrania prostszą trasą.
- [ ] Sprzęt w fabule pozostaje na bezpiecznej linii bez wymagania precyzyjnego ryzyka podczas czytania historii.
- [ ] Walidacja uwzględnia hitbox gracza, przeszkody i collectible, aktualną prędkość, czas reakcji, zasięg skoku/przysiadu oraz granice obszaru gry.
- [ ] Żaden zatwierdzony układ nie wymaga kolizji z przeszkodą ani niemożliwej zmiany akcji.
- [ ] Przed konturem przeszkody pozostaje wolna strefa, dzięki której gracz rozpoznaje wymagany skok lub przysiad.
- [ ] W widocznej części ekranu znajduje się jednocześnie najwyżej siedem collectible.
- [ ] Kolejne grupy wjeżdżają spoza prawej krawędzi, nie nakładają się na aktywną grupę i nie pojawiają się nagle przed graczem.
- [ ] Wszystkie cztery typy sprzętu używają wspólnej strefy zebrania o wielkości około 115% strefy paczki, niezależnej od przezroczystych marginesów assetu.
- [ ] Property tests obejmują wiele seedów, wszystkie rodziny przeszkód oraz pełny zakres prędkości fabuły i challenge.
- [ ] Najgęstszy układ nie powoduje nieograniczonego wzrostu puli obiektów ani regresji stabilnej pętli gry.
