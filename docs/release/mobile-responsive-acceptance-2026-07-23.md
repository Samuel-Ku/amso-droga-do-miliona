# Responsive acceptance — 2026-07-23

Zakres ręcznej walidacji: mobile-first landing, kompaktowy phone landscape i desktop. Sprawdzono produkcyjny build w Chrome z wymuszonymi wymiarami viewportu oraz konsolę przeglądarki.

| Viewport | Wynik |
| --- | --- |
| 320 px portrait | Bez poziomego scrolla; landing-art nie zajmuje miejsca; CTA przed leaderboardem; przyciski headera równe i mają 44 px wysokości. |
| 360 px portrait | Bez poziomego scrolla; kolejność CTA → leaderboard → instrukcja zachowana; przyciski 44 px. |
| 390 px portrait | Bez poziomego scrolla; układ jednokolumnowy i skrócone mobile copy aktywne. |
| 412 px portrait | Bez poziomego scrolla; pełna dostępna szerokość wykorzystana bez obcinania treści. |
| 843 × 390 px landscape | Aktywny compact phone landscape; krótka wysokość sekcji; CTA i leaderboard dostępne bez wymuszenia długiego single-column landing. |
| 768 × 1024 px tablet | Bez poziomego scrolla; pozostaje dwukolumnowy landing (304 px + 321 px); ilustracja pozostaje widoczna. |
| 1440 × 900 px desktop | Dotychczasowy układ dwukolumnowy; ilustracja i pełne desktop copy widoczne; bez poziomego scrolla. |

Result screen sprawdzono dodatkowo przez publiczne granice `CampaignShell.showChallengeResult()` i `RecordBoard.renderFrom()` z długimi wartościami liczbowymi oraz 14-znakową szeroką nazwą gracza:

| Szerokość | Karty wyniku | Actions i share panel |
| --- | --- | --- |
| 320 px | Widoczne wyłącznie orders, total i best; główna karta ma pełną szerokość 236 px, a dwie dolne karty automatycznie przechodzą do jednego słupka. | Przyciski w jednym słupku; otwarcie panelu nie zmienia ich szerokości ani położenia. |
| 360 px | Trzy wymagane metryki; główna karta 276 px, dolne karty po 134 px w dwóch kolumnach. | Bez overflow; panel otwiera się pod actions. |
| 390 px | Główna karta 306 px, dolne po 149 px. | Bez overflow; geometria actions stabilna. |
| 412 px | Główna karta 328 px, dolne po 160 px. | Bez overflow; geometria actions stabilna. |

Długa nazwa zachowuje pełną wartość w atrybucie `title`, a żaden wariant nie powoduje poziomego scrolla. We wszystkich sprawdzonych wariantach konsola nie zawierała błędów ani ostrzeżeń. Osobny test kontraktowy z `ResizeObserver` potwierdza mobile root geometry dla kontenera 500 px osadzonego w viewporcie 1200 px.

Do ręcznej walidacji przed produkcyjnym rolloutem pozostaje test semantyki tabeli w VoiceOver lub TalkBack oraz kontrola na fizycznym urządzeniu mobilnym. Automatyczne testy potwierdzają jeden semantyczny `<table>`, `caption`, `scope="col"`, `scope="row"`, zgodną kolejność DOM i dostępne etykiety danych.
