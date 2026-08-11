# Zoptymalizowany fallback Vercel

## Status

Zastąpione przez ADR 0009.

Przyjęte 2026-08-10.

## Kontekst

Pakiet zewnętrzny IdoSell pozostaje preferowaną integracją, ale CMS może nadal
ingerować w osadzony layout, scroll albo politykę skryptów. Potrzebny jest
niezależny wariant, który nie kopiuje implementacji gameplayu.

## Decyzja

Vercel buduje ten sam runtime i konfigurację poleceniem `npm run build:vercel`
do `dist-vercel/`. Build nie publikuje source map ani plików, których runtime nie
żąda, i obsługuje ścieżkę `/million`. Profil Vercel mapuje `↑` na skok i `↓` na
ślizg. Generator IdoSell zmienia profil na `idosell`, gdzie wszystkie strzałki
są blokowane przed przewinięciem powłoki CMS.

## Konsekwencje

- nie powstaje drugi silnik ani osobna konfiguracja gameplayu;
- oba profile przechodzą osobne testy artefaktu i browser smoke;
- Bramka wydania sprawdza Pakiet zewnętrzny IdoSell oraz Wariant Vercel;
- Vercel może zostać użyty jako bezpośrednia strona kampanii, gdy integracja
  IdoSell nie spełnia wymagań stabilności.
