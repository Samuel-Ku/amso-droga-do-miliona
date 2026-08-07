# Translation review gate

Katalogi DE, EN, ES, CS, IT, FR i UK są wersjonowane i mają ten sam zestaw
wiadomości co PL. Pierwszy przekład został wygenerowany poza runtime, a wynik
jest statycznie wbudowany; gra nie wysyła tekstu do zewnętrznego API.

Przed publicznym wydaniem reviewer sprawdza dla każdego locale: zachowanie
faktów, liczb, lat, marek, znaczenia CTA, pierwsze objaśnienie PKiN, ARIA/live
copy oraz back-translation reprezentatywnej historii. Właściciel produktu
osobno akceptuje EN i UK; nie blokuje to technicznego przygotowania pozostałych
katalogów. Nowy przypadek językowy trafia do katalogu razem z regression testem.

Nie należy oznaczać publicznego release jako gotowego bez ręcznego review,
gotowych neutralnych lockupów od projektanta oraz testów VoiceOver/TalkBack.
