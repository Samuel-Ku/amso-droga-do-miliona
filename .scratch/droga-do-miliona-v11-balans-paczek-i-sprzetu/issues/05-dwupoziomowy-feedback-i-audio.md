# 05 — Dwupoziomowy feedback `+100 / +250` i audio

**What to build:** Natychmiast wyjaśnić graczowi różnicę wartości paczki i sprzętu bez dodawania stałej instrukcji do HUD. Paczka ma otrzymać krótki, spokojniejszy feedback `+100`, a sprzęt mocniejszy, kolorowy `+250` i odrębny przyjemny dźwięk. Pominięcie dobrowolnej premii nie może brzmieć jak porażka.

**Blocked by:** 01 — Expand: osobny kontrakt paczki i sprzętu

**Status:** ready-for-agent

- [ ] Zebranie paczki pokazuje krótkie `+100` i odtwarza podstawowy sygnał pickup.
- [ ] Zebranie dowolnego sprzętu pokazuje wyraźniejsze `+250`, silniejszy efekt oraz odrębny przyjemny sygnał.
- [ ] Oba komunikaty znikają po około 0,6 sekundy i nie tworzą stałej legendy na HUD.
- [ ] Feedback nie zasłania gracza, konturu przeszkody, licznika ani aktywnej celebracji milestone.
- [ ] Różnica między paczką i sprzętem jest czytelna przez liczbę, intensywność i dźwięk, a nie wyłącznie kolor.
- [ ] Pominięcie sprzętu nie emituje negatywnego dźwięku, komunikatu ani efektu utraty combo.
- [ ] Globalne `Wycisz` natychmiast obejmuje oba sygnały bez wpływu na stan rozgrywki.
- [ ] DOM/canvas i audio tests sprawdzają zachowanie przez publiczne zdarzenia pickup, bez odwołania do prywatnej kolejki renderera.
