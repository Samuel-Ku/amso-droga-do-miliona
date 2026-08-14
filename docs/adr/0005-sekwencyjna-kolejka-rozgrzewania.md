# Sekwencyjna kolejka rozgrzewania assetów

## Status

Część dotycząca autonomicznego HTML została zastąpiona przez ADR 0009. Zasada sekwencyjnego rozgrzewania pozostaje obowiązująca dla Wdrożenia Vercel.

Wdrożenie Vercel pobiera i dekoduje assety etapami: minimalny zestaw ekranu startowego przy otwarciu, krytyczny zestaw gameplayu po wybraniu Start, a następnie po jednym tle świata podczas bezczynności albo pauz fabularnych. AudioContext powstaje dopiero po pierwszym geście użytkownika; krytyczne sygnały dźwiękowe otrzymują pierwszeństwo, lecz ich brak nie blokuje rozgrywki. Kolejka nie uruchamia równoległego pobierania i dekodowania całego zestawu. Takie planowanie ogranicza skoki CPU i pamięci podczas startu oraz pozwala wypełniać Pamięć światów bez blokowania aktywnej rozgrywki.
