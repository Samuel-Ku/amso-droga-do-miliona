# Test zrozumiałości v6 — instrukcja dla prowadzącego

Status: **gotowy do testu ludzkiego; niezatwierdzony**.

## Cel

Sprawdzić, czy finalny kadr każdego z 14 kroków bez tekstu pozwala w pięć sekund rozpoznać główny przedmiot i czynność. Test wykonujemy osobno dla desktopu oraz szerokości 390 px.

## Materiały

- lista anonimowych identyfikatorów: `qa/final-frame-matrix-v6.csv`;
- przeglądarka 28 finalnych kadrów bez copy: `qa/test-kadrow-v6.html`;
- samodzielny build gry: `droga-do-miliona-qa.html`;
- klucz oczekiwanych przedmiotów i czynności: pola `finalFrame` oraz `action` w produkcyjnej konfiguracji scen — prowadzący nie pokazuje ich testerowi.

## Procedura

1. Zbierz co najmniej pięć osób spoza zespołu implementacyjnego.
2. Otwórz `qa/test-kadrow-v6.html`. Dla każdej osoby pokaż każdy kadr przez dokładnie pięć sekund, najpierw desktop, potem 390 px. Plik pokazuje wyłącznie ilustrację, anonimowy identyfikator oraz wariant viewportu.
3. Po każdym kadrze zapytaj: „Co było głównym przedmiotem i co się działo?”. Nie podawaj listy odpowiedzi.
4. Zapisz odpowiedź dosłownie przy identyfikatorze `FFxx-D` albo `FFxx-M`.
5. Oznacz trafienie osobno dla przedmiotu i czynności, porównując dopiero po odpowiedzi z ukrytym kluczem w produkcyjnej konfiguracji scen.
6. Kadr przechodzi, gdy minimum 4 z 5 osób rozpoznają zarówno przedmiot, jak i czynność.
7. Odpowiedzi ograniczone do „ramki”, „linie”, „kwadraty” lub wzajemnie sprzeczne interpretacje oznaczają niezaliczenie.
8. Każdy niezaliczony kadr popraw i przetestuj ponownie pod nowym numerem rewizji.

## Raport wyników

| ID kadru | Tester | Odpowiedź własnymi słowami | Przedmiot 0/1 | Czynność 0/1 | Cytat / uwaga |
|---|---|---|---:|---:|---|
| FF01-D | T1 |  |  |  |  |

Release v6 można zatwierdzić dopiero wtedy, gdy wszystkie 28 wariantów przejdzie próg 4/5.
