# Worker release — moderation nazw leaderboardu

## Zakres artefaktu

Worker używa wspólnego, wersjonowanego moderation-policy jako źródła prawdy dla
POST i GET. Odrzucone historyczne nazwy są neutralizowane wyłącznie w publicznej
kopii odpowiedzi. Wdrożenie nie migruje, nie usuwa i nie nadpisuje rekordów R2.

## Brama przed wdrożeniem

- Pełne regression fixtures policy przechodzą po stronie wspólnego validatora i
  realnej granicy HTTP Workera.
- Bezpośredni POST omijający frontend zwraca `400` i nie wykonuje zapisu.
- GET historycznego niedozwolonego rekordu zwraca `Gracz`, zachowuje id, rank,
  score, orders i updatedAt oraz nie zawiera oryginalnej nazwy w serializowanej
  odpowiedzi.
- Surowy obiekt R2 pozostaje byte-for-byte niezmieniony po publicznym GET.
- Odpowiedzi mają `Cache-Control: no-store` i nagłówek wersji policy, aby zmiana
  reguł nie pozostawiała starej publicznej nazwy w cache.
- Testy XSS potwierdzają brak interpretowania nazwy jako HTML.

## Kolejność wdrożenia

1. Zanotować wdrażaną wersję policy.
2. Wdrożyć Worker niezależnie od frontendowego Autonomicznego HTML.
3. Wykonać kontrolny GET i poprawny POST.
4. Wykonać odrzucony POST bez UI i potwierdzić brak zmiany obiektu R2.
5. Dopiero po tej bramie uznać server-side enforcement za aktywny.

## Monitoring bez ujawniania danych

Logi techniczne mogą zawierać wersję policy, kategorię i sam fakt moderacji.
Nie mogą zawierać oryginalnej nazwy ani konkretnego trafionego hasła.
Monitorować wzrost `invalid_name`, błędy R2 i odpowiedzi 5xx. Potencjalny false
positive powinien otrzymać fixture regresyjny przed korektą policy.

## Rollback

Worker można wycofać niezależnie od frontendu. Preferowany rollback to poprzednia
wersja policy lub poprzedni Worker bundle; nie wykonywać migracji R2. Po zmianie
wersji ponownie sprawdzić publiczny GET. `no-store` zapobiega utrzymaniu starej
odpowiedzi w cache, a oryginalne rekordy pozostają odwracalnie zachowane w R2.
