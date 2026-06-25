````markdown
# Cesium Sandbox

Status: **EXPERIMENT / SANDBOX**

To repozytorium jest roboczym sandboxem do testów CesiumJS, lokalnych danych 3D Tiles, prostych warstw GeoJSON i eksperymentów z wizualizacją 3D.

Nie jest to uporządkowany projekt produkcyjny ani aktywnie rozwijana aplikacja.

## Local 3D Tiles

Lokalny tileset testowy powinien znajdować się tutaj:

```text
dane/3D/3dtiles-cesium-07/tileset.json
````

Folder `dane/3D/` jest ignorowany przez Git, ponieważ może zawierać bardzo duże dane 3D Tiles.

## Secrets

Tokeny lokalne można trzymać w folderze:

```text
secrets/
```

Przykład:

```text
secrets/cesium_ion_token.txt
```

Folder `secrets/` jest ignorowany przez Git i nie powinien być commitowany.

## Run locally

Nie otwieraj `index.html` przez dwuklik. Uruchom lokalny serwer HTTP z katalogu repozytorium:

```cmd
cd Q:\GitHub\Cesium_Sandbox
python -m http.server 8000
```

Następnie otwórz w przeglądarce:

```text
http://localhost:8000
```

Jeśli przeglądarka trzyma starą wersję plików, użyj:

```text
Ctrl + F5
```

albo otwórz z parametrem testowym:

```text
http://localhost:8000/?v=1
```

## Notes

Aktualny tryb testowy używa płaskiego podkładu OpenStreetMap i lokalnego 3D Tiles. Cesium World Terrain oraz OSM 3D Buildings są wyłączone, żeby łatwiej ocenić jakość własnego tilesetu.

```
```
