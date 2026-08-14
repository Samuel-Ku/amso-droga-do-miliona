# Eksperyment fazy Paneli świata bez mutacji DOM — 2026-08-14

## Decyzja

Nie wdrażać eksperymentu z ticketu optymalizacyjnego 04. Co-klatkowa
publikacja fazy przez `--world-phase-px` pozostaje w runtime, ponieważ dwa
porównywalne przebiegi Chromium wykazały małą, ale powtarzalną regresję p95 i
p99, a dwa przebiegi WebKit nie przeszły obowiązkowej kontroli narzutu
collectora. Żaden próg nie został poluzowany.

## Izolowana zmiana

Eksperyment korzystał z czystego artefaktu Vercel opartego na `3fb9ee5`, bez
równoległych zmian mobilnego layoutu. Zegar wizualny przestał zapisywać
diagnostyczną fazę do inline style hosta. Transformy dwóch Paneli świata nadal
wynikały bezpośrednio z tej samej liczbowej odległości i nie zostały
kwantyzowane. Nie dodano CSS transition, smoothing ani drugiego zegara.

Ograniczony runtime QA otrzymał zamrożony, read-only snapshot zawierający
bieżącą fazę i dwa transformy Paneli świata. Production API zwracało `null`, a
qualification scripts czytały nowy snapshot zamiast właściwości CSS. Test
przeglądarkowy wszystkich siedmiu przejść, w tym `7 → 1`, przeszedł w
Chromium i WebKit wraz z promotion, resize, orientation i fullscreen.

## Pełny replay before/after

Wszystkie cztery przebiegi after używały `full-story-reference-v1`, seed
`1297748482`, publicznych zdarzeń klawiatury, viewportu 1280×720, DPR 1,
profilu full i włączonego audio. Każdy ukończył 46 zatwierdzonych fal, osiągnął
dokładnie 1 000 000 i zachował digest
`82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9`.
Active decode, repeated decode Paneli świata, hot-path image nodes i blank
frames pozostały równe zero.

| Silnik | p95 | p99 | maksimum | klatki >33 ms | Ocena |
| --- | ---: | ---: | ---: | ---: | --- |
| Chromium before | 9,2 ms | 9,3 ms | 25,5 ms | 0 | Punkt odniesienia |
| Chromium after 1 | 9,7 ms | 10,2 ms | 16,8 ms | 0 | Porównywalny; regresja percentyli |
| Chromium after 2 | 9,8 ms | 10,2 ms | 17,2 ms | 0 | Porównywalny; regresja percentyli |
| WebKit before | 18 ms | 19 ms | 83 ms | 21 | Punkt odniesienia |
| WebKit after 1 | 18 ms | 19 ms | 70 ms | 6 | Odrzucony: collector A/B |
| WebKit after 2 | 18 ms | 19 ms | 79 ms | 7 | Odrzucony: collector A/B |

Oba WebKit runs zachowały identyczne p95/p99 i ograniczyły długie odchylenia,
lecz w obu sampled collector execution wyniósł 1 ms wobec control 0 ms przy
zatwierdzonym limicie 0,5 ms. Tych wyników nie można uznać za poprawną Próbę
porównawczą. Powtarzalna regresja percentyli Chromium dodatkowo wyklucza
warunek „brak kosztu/regresji”.

Surowe raporty i porównania pozostają w
`.scratch/optymalizacja-renderingu-runtime/evidence/ticket-04/`.

## Konsekwencje

Production runtime, publiczne API, qualification scripts i testy zostały
przywrócone do stanu sprzed eksperymentu. Kandydat nie został promowany do
czterech obiegów pamięci ani live Vercel, ponieważ obowiązkowa Próba
porównawcza zakończyła się wcześniej wynikiem negatywnym. Hipotezę można
ponownie rozważyć wyłącznie z kontrolowanym pomiarem, który przechodzi
collector A/B i nie pogarsza percentyli Chromium.
