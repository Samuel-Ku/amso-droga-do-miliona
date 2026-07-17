# 01 — Android landscape i CSS-owy tryb gry

**What to build:** Użytkownik otwierający autonomiczną grę na telefonie może rozpocząć zabawę w szerokim, niskim viewportcie, a kontrolka pełnego ekranu zawsze wykonuje dostępną akcję. Gdy przeglądarka nie oferuje prawdziwego Fullscreen API, interfejs przechodzi w uczciwie opisany CSS-owy tryb gry, który wykorzystuje całą dostępną powierzchnię dokumentu.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [ ] Portrait zachowuje minimum 390 px szerokości, natomiast landscape około 960×315 CSS px nie jest blokowany komunikatem o zbyt małym ekranie.
- [ ] Landscape jest blokowany dopiero poniżej zatwierdzonego minimum około 280 px użytecznej wysokości albo przy niewystarczającej szerokości.
- [ ] Przy dostępnym Fullscreen API główna i startowa kontrolka wchodzą do prawdziwego fullscreen i poprawnie z niego wychodzą.
- [ ] Przy braku metody, wyłączonym API albo odrzuconej obietnicy kontrolka uruchamia CSS-owy tryb gry zamiast pozostać martwa.
- [ ] CSS-owy tryb gry ukrywa header i footer, wypełnia dostępną wysokość i zapewnia widoczny sposób wyjścia.
- [ ] Profil nie zapisuje CSS-owego fallbacku jako aktywowanego prawdziwego fullscreen.
- [ ] Interfejs nie obiecuje ukrycia systemowego paska przeglądarki w `content://`.
- [ ] Test regresyjny obejmuje Android `content://`, landscape 960×315, brak API, odrzucone wejście i poprawne wyjście z obu trybów.
