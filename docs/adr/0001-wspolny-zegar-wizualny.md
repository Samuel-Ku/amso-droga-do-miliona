# Wspólny zegar wizualny dla gameplayu i parallaxu

Ruch gameplay canvas i parallaxu będzie synchronizowany przez jeden zegar `requestAnimationFrame`, natomiast snapshoty HUD pozostaną ograniczone do około 10 Hz. Dotychczasowe przesuwanie tła przez snapshoty i 140 ms CSS transition tworzyło dwa konkurujące rytmy oraz widoczne szarpnięcia; wspólny zegar zwiększa spójność klatek kosztem większego refaktoringu granicy między silnikiem gry a warstwą świata.
