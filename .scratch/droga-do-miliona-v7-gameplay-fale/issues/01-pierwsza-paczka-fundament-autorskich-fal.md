# 01 — Pierwsza paczka — fundament autorskich fal

**What to build:** Pierwszy kompletny, grywalny mikropoziom v7, w którym gracz uczy się skoku i ślizgu na czterech autorskich falach, a wspólny kontrakt fal mierzy czytelną akcję, zebranie paczek i wynik całej próby.

**Blocked by:** None — can start immediately.

Status: ready-for-human

- [x] `Pierwsza paczka` prowadzi gracza kolejno przez łuk paczek bez przeszkody, skok, ślizg oraz krótką sekwencję skok–ślizg.
- [x] Każda fala deklaruje akcję, wariant przeszkody, trasę 2–5 paczek, czas zapowiedzi, oddech i warunki zaliczenia oraz perfekcji.
- [x] Fala jest zaliczona wyłącznie po poprawnej akcji i zebraniu co najmniej 60% paczek; zebranie wszystkich oznacza perfekcję.
- [x] Nieudana fala wraca bez zmiany parametrów i bez adaptive assist.
- [x] Walidator odrzuca zbyt krótki czas reakcji, kolizję trasy nagrody z przeszkodą, niewykonalną sekwencję i nieznany wariant z precyzyjnym komunikatem QA.
- [x] Combo zwiększa się na granicy zaliczonej fali, perfekcja przyznaje osobny bonus, niezaliczenie resetuje combo, a pojedyncze paczki zachowują bazowe punkty.
- [x] Podpowiedzi szkoleniowe znikają po pierwszym sukcesie, a onboarding nie karze wyniku ani combo.
- [x] `S` i strzałka w dół uruchamiają ten sam hybrydowy ślizg: minimum około 300 ms, przedłużenie przytrzymaniem i bufor około 100–120 ms; swipe down odpowiada krótkiemu naciśnięciu.
- [x] HUD pokazuje jeden semantyczny cel `RUCHY 2/4` z czytelnymi miniaturami ruchów.
- [x] Publiczny snapshot i lokalny raport QA zawierają wynik fali, próby, zebranie, pomyłkę akcji, combo i czas segmentu.
- [x] Test lifecycle przechodzi cały mikropoziom, w tym success, perfect, retry i zakończenie dopiero po minimalnym czasie oraz celu.
