# Zewnętrzny pakiet CSS/JS dla produkcyjnego IdoSell

## Status

Przyjęte 2026-08-10; zastępuje ADR 0003 w granicy produkcyjnego wdrożenia IdoSell
i aktualizuje frontendową część ADR 0006.

## Kontekst

Produkcyjna strona CMS odrzuciła autonomiczny fragment kampanii: zapis dużego
payloadu kończy się `413 Request Entity Too Large` albo pustą zawartością strony.
IdoSell wspiera natomiast kod HTML strony oraz osobno linkowane dodatki CSS/JS.

## Decyzja

Frontend produkcyjny jest publikowany jako mały `idosell-snippet.html` z inline
watchdogiem błędu oraz dwa pliki na otwartej domenie HTTPS: `million.css` i
`million.js`. Skrypt aplikacji jest klasycznym bundle bez importów, zawiera
wymagane obrazy jako data URI i nie zależy od ścieżek assetów hosta.

Ten sam zestaw obsługuje wszystkie wersje językowe na podstawie `<html lang>`
ustawionego przez IdoSell. CMS nadal odpowiada za title, canonical, Open Graph i
hreflang. Autonomiczny `million-idosell.html` pozostaje deterministycznym
artefaktem offline QA; jest źródłem generowania paczki zewnętrznej, ale nie jest
wklejany do formularza CMS.

## Konsekwencje

- aktualizacja produkcji wymaga atomowej podmiany CSS i JS albo wersjonowanego URL;
- CSP strony dopuszcza domenę statyczną, `data:` dla obrazów i domenę Workera dla
  opcjonalnego leaderboardu;
- awaria hosta statycznego pokazuje fallback watchdog i nie uszkadza powłoki sklepu;
- release testuje zarówno autonomiczny artefakt offline, jak i wygenerowany
  zewnętrzny package/preview, uruchamiając preview w przeglądarce;
- Worker rekordów pozostaje niezależną usługą zgodnie z ADR 0006.
