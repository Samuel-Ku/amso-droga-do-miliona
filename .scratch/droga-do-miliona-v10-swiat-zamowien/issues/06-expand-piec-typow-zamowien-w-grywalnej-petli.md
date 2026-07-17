# 06 — Expand: pięć typów zamówień w grywalnej pętli

**What to build:** Gracz może w jednej działającej sesji zbierać notebooki, telefony, PC, LCD i pomarańczowe paczki. Wszystkie są równorzędnymi zamówieniami, wyglądają inaczej, ale zachowują tę samą uczciwą mechanikę.

**Blocked by:** 05 — Etalonowy zestaw assetów zamówień i power-upów.

**Status:** ready-for-agent

- [ ] Publiczny model może reprezentować pięć wizualnych typów zamówienia bez łamania starszych zapisów i konfiguracji.
- [ ] Każdy zwykły typ zwiększa wspólny licznik dokładnie o jedno i ma tę samą bazową wartość wyniku.
- [ ] Pięć typów korzysta z identycznego hitboxa wycentrowanego niezależnie od przezroczystych marginesów assetu.
- [ ] Paczka płynnie obraca się przez zatwierdzone ujęcia; urządzenia używają spokojnego bobu i krótkiego bliku bez pełnego obrotu.
- [ ] Miękko ważony random dopuszcza naturalne powtórzenia, ale nie generuje czterech identycznych typów z rzędu.
- [ ] Typ niewidziany przez około 12–15 pickupów odzyskuje rosnącą wagę bez tworzenia jawnego cyklu.
- [ ] Autorska fala może wskazać konkretny typ i nie zostaje nadpisana przez random.
- [ ] Wydanie expand utrzymuje zielone testy dzięki tymczasowej kompatybilności legacy package-kontraktu.
- [ ] Deterministyczny test sesji zbiera wszystkie pięć typów i potwierdza identyczny postęp oraz hitbox.

