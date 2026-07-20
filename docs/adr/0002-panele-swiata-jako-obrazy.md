# Panele świata jako obrazy kompozytowane

Warstwa świata będzie używać dwóch transformowanych elementów `<img>` zamiast kopiować dekodowane tła do dwóch dużych canvas. Pozwala to przeglądarce ponownie wykorzystać dekodowany obraz i teksturę, ogranicza duplikację buforów RGBA oraz zachowuje bezszwowy parallax; gameplay pozostaje na canvas. Siedem cyklicznych światów jest dekodowanych stopniowo przed pierwszym użyciem, a następnie pozostaje w pamięci do końca sesji, ponieważ ponowne dekodowanie na kolejnych obiegach powodowałoby szarpnięcia przejść.
