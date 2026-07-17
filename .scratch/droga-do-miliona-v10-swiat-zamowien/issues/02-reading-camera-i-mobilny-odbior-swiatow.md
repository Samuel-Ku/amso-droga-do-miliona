# 02 — Reading camera i mobilny odbiór światów

**What to build:** Karta historii otrzymuje spokojny, autorski kadr bez przestawiania całej trasy, a po powrocie gameplay płynnie kontynuuje wcześniejszą fazę. Te same światy niezawodnie działają na desktopie i w lokalnym Androidzie bez czarnego ekranu lub nadmiernego zużycia pamięci.

**Blocked by:** 01 — Proporcjonalne światy bez connectora.

**Status:** ready-for-agent

- [ ] Zatrzymanie na historii przesuwa wyłącznie punkt kadrowania do autorskiego celu w około 600–800 ms.
- [ ] Reading camera nie zmienia skali obrazu, aktywnego panelu ani absolutnej fazy parallaxu.
- [ ] Powrót do gry kontynuuje ruch bez skoku, recenteringu panelu lub ustawienia granicy pod kurierem.
- [ ] Każdy świat jest dekodowany raz, ma ograniczoną próbę ponowną i jasny markowy fallback przy trwałym błędzie.
- [ ] Runtime utrzymuje najwyżej bieżący i przygotowany następny świat; po commitcie poprzedni zasób można zwolnić.
- [ ] Autonomiczny HTML zawiera wszystkie światy i działa bez sieci po otwarciu przez lokalny Android `content://`.
- [ ] Manualna matryca obejmuje Chrome, Safari, Edge, Android, portrait, landscape i wysoki DPR bez czarnych klatek i regularnych szarpnięć.
- [ ] Profil przejścia nie pokazuje regularnej klatki dłuższej niż około 20 ms na urządzeniu referencyjnym.

