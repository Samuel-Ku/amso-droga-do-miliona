# QA produkcyjne — Droga do Miliona v4

Automatyczne bramki:

~~~bash
npm run typecheck
npm test
npm run build:all
~~~

## Macierz urządzeń

Sprawdź co najmniej 390 × 844, 412/430 px portrait, 844 × 390 landscape mobile
oraz desktop 1280 i 1920 px. Widok mniejszy niż 390 px (lub niższy niż 390 px
w landscape) ma zatrzymać grę i pokazać blokadę rozmiaru. Na realnych telefonach potwierdź
gest ślizgu, fullscreen, obrót bez resetu i płynność przy 1,55×.

## Scenariusze krytyczne

1. Nowy profil widzi wyłącznie „Rozpocznij historię”.
2. Każda z 18 scen pozostaje bez zmian aż do naciśnięcia przycisku.
3. Podczas sceny HUD jest ukryty, tekst pozostaje w czytelnej bocznej karcie
   (w portrait — dolnym panelu), a większość wspólnego tła nadal opowiada historię.
   Przeszkód, paczek, nagród i symboli nie ma wtedy na trasie.
4. Minuta oczekiwania na pierwszej scenie nie zwiększa czasu ani wyniku.
5. Po scenie rozgrywkę poprzedza pełne `Wracamy do gry · 3–2–1`.
6. Aktywne czasy epok wynoszą 45/55/60/65/75 s, razem 300 s.
7. Story zaczyna się przy 0,8× i kończy przy 1,15×; challenge dochodzi do 1,55×.
8. Kolizja w story nie kończy biegu. Pierwsza niechroniona kolizja w challenge
   kończy próbę, a niewykorzystana gwarancja chroni dokładnie raz.
9. Ostatnie CTA przełącza ten sam bieg do challenge; wynik, paczki, combo i aktywne
   power-upy nie są resetowane.
10. Bonus ukończenia jest przyznany tylko przy pierwszym pełnym przejściu.
11. Reload niedokończonego story wraca do intro z wynikiem zero; nie ma opcji resume.
12. Nagrody i symbole nie przecinają hitboxów przeszkód; pominięty symbol wraca,
    ale nigdy nie jest zbierany automatycznie.
13. Bezpośredni challenge po odblokowaniu zaczyna od zera i bez power-upów.
14. Share card działa dla Facebooka i Instagrama i niczego nie publikuje automatycznie.
15. W `Fali zamówień` marker kolejki przechodzi kolejno przez PC, notebook, monitor
    i telefon; tylko marker zwiększa licznik 0/6, a następne markery są bonusowe.
16. HUD pokazuje na żywo cztery wartości licznika, trzy fazy Hydry oraz pięć faz
    Fali Miliona z liczbą zebranych symboli.
17. Boss Fali Miliona pozostaje nieaktywny przez licznik i pierwsze cztery fazy;
    startuje dopiero w końcowej 1/5 czasu segmentu także po zmianie jego długości.
18. Wszystkie 7 światów ma konkretną ilustrację i semantic fallback; challenge
    zmienia świat mniej więcej co 45 s dopiero na czystej trasie.
19. `dist-vercel/` i produkcyjne `https://game.amso.pl/` uruchamiają ten sam runtime,
    a wszystkie wymagane assety zwracają 200 bez błędów konsoli.

## Treść

- porównaj wszystkie 18 scen z zatwierdzonym dokumentem v4;
- zweryfikuj anonimowość trzech historii klientów;
- potwierdź liczby marketingowe przed publikacją;
- voice-over pozostaje poza zakresem tej wersji.
