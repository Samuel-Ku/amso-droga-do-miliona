# 03 — Kontrolowany worek nagród Trybu Wyzwania

**What to build:** Zastąpić niekontrolowane mieszanie collectible przewidywalnym, ale różnorodnym workiem nagród dla challenge. Każda kombinacja ma zawierać 5–8 paczek i 1–2 dodatkowe sprzęty, a dłuższa sesja ma zbliżać się do proporcji 80% paczek / 20% sprzętu. Gracz ma szybko odkryć premię sprzętową i nie czekać na nią zbyt długo.

**Blocked by:** 01 — Expand: osobny kontrakt paczki i sprzętu

**Status:** ready-for-agent

- [ ] Każda kombinacja Trybu Wyzwania zawiera od 5 do 8 paczek oraz od 1 do 2 dodatkowych sprzętów.
- [ ] Sprzęt nie zastępuje żadnej paczki w zatwierdzonym zakresie 5–8.
- [ ] Duża deterministyczna próbka zbliża się do proporcji około 80% paczek i 20% sprzętu.
- [ ] Dwa sprzęty nie występują jako bezpośrednio sąsiadujące collectible.
- [ ] Notebook, telefon, PC i LCD są mieszane bez długiego powtarzania jednego typu.
- [ ] Pierwszy osiągalny sprzęt pojawia się nie później niż około 8 sekund po rozpoczęciu challenge.
- [ ] Po pierwszym sprzęcie przerwa do kolejnego osiągalnego sprzętu nie przekracza około 12 sekund.
- [ ] Worek jest deterministyczny dla ustalonego seeda i daje powtarzalne fale w testach.
- [ ] Reset lub ponowienie challenge rozpoczyna świeżą, poprawną sekwencję bez dziedziczenia zaległej premii.
