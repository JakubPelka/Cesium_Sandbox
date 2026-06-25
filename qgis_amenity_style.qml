<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Cesium - Amenity Visualization</title>
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.105/Build/Cesium/Cesium.js"></script>
  <style>
    @import url("https://cesium.com/downloads/cesiumjs/releases/1.105/Build/Cesium/Widgets/widgets.css");
    html,
    body,
    #cesiumContainer {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: sans-serif;
      overflow: hidden;
    }
    #legend {
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="cesiumContainer"></div>

  <script>
    // 1. Ustaw swój Cesium Ion token
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJI...Twój_Token...OVrZ63UfzzM";

    // 2. Funkcja inicjująca widok i ładowanie GeoJSON
    async function initializeViewer() {
      try {
        // Wczytanie domyślnego Cesium World Terrain (ID: 1)
        const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);

        // Tworzenie widoku
        const viewer = new Cesium.Viewer("cesiumContainer", {
          terrainProvider: terrainProvider,
          // Możesz też wyłączyć warstwę bazową, jeżeli chcesz
          // imageryProvider: false
        });

        // (Opcjonalnie) wyłącz test głębi wobec terenu, jeśli punkty „giną” w niektórych miejscach:
        // viewer.scene.globe.depthTestAgainstTerrain = false;
        // Domyślnie jest true – jeżeli obiekt jest faktycznie „poniżej” modelu terenu, nie będzie widoczny.

        // Dodaj budynki OSM
        const osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
        viewer.scene.primitives.add(osmBuildingsTileset);

        // Ustawienie kamery nad wybranym regionem
        viewer.scene.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(13.132, 56.723, 750),
          orientation: {
            heading: Cesium.Math.toRadians(20),
            pitch: Cesium.Math.toRadians(-20),
          },
          duration: 0,
        });

        // Wczytanie pliku amenity.geojson
        // Tu sprawdź, czy ścieżka "./dane/amenity.geojson" jest poprawna w Twoim środowisku
        const geojsonUrl = "./dane/amenity.geojson";

        // Tworzymy pustą legendę (kontener)
        createLegend();

        // Wczytujemy warstwę z atrybutem "amenity"
        // Jeśli w Twoim pliku atrybut ma inną nazwę, zmień "amenity" w parametrze.
        await loadGeoJson(viewer, geojsonUrl, "amenity");
      } catch (error) {
        console.error("Błąd podczas inicjalizacji Cesium:", error);
      }
    }

    // 3. Funkcja wczytująca GeoJSON i stylizująca obiekty
    async function loadGeoJson(viewer, geoJsonUrl, category) {
      try {
        // Wczytujemy plik GeoJSON z dopasowaniem do gruntu
        const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
          clampToGround: true, // Podstawowa opcja „przyklejenia” do terenu
        });
        viewer.dataSources.add(dataSource);

        // Stylizacja i dopasowanie punktów
        dataSource.entities.values.forEach((entity) => {
          // Pobieramy wartość atrybutu, np. "amenity"
          // Jeśli nie istnieje lub jest pusty, przypisz ""
          const typeRaw = entity.properties[category]?.getValue() || "";

          // (Możesz dodać debug, by podejrzeć klucze i wartości)
          // console.log("Entity properties:", entity.properties);

          // Definiujemy styl dla danego obiektu
          // Możesz użyć RELATIVE_TO_GROUND i drobnego uniesienia height: 0.5,
          // jeśli obiekt ginie pod terenem przy clampToGround.
          entity.point = {
            pixelSize: 8,
            color: getColorForAmenity(typeRaw),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,

            // Ścisłe „przyklejenie” do terenu:
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,

            // Jeśli wolisz minimalne uniesienie, zamiast wyżej:
            // heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            // height: 0.5,

            // Aby punkt był zawsze widoczny niezależnie od głębi:
            // disableDepthTestDistance: Number.POSITIVE_INFINITY
          };
        });

        // Dodaj kontrolki w legendzie dla danej warstwy i atrybutów
        addLegendOptions(dataSource, category);
      } catch (error) {
        console.error(`Błąd podczas wczytywania pliku ${geoJsonUrl}:`, error);
      }
    }

    // 4. Funkcja mapująca typ "amenity" na kolor
    function getColorForAmenity(type) {
      // Uwaga: klucz typu musi dokładnie odpowiadać wartości atrybutu z pliku
      // W tym wypadku obslugujemy też pusty "".
      const colors = {
        bbq: Cesium.Color.RED,
        bench: Cesium.Color.YELLOW,
        bicycle_parking: Cesium.Color.BLUE,
        bicycle_rental: Cesium.Color.CYAN,
        charging_station: Cesium.Color.GREEN,
        drinking_water: Cesium.Color.AQUA,
        fuel: Cesium.Color.ORANGE,
        hunting_stand: Cesium.Color.BROWN,
        parking: Cesium.Color.PURPLE,
        post_box: Cesium.Color.PINK,
        public_bath: Cesium.Color.TEAL,
        recycling: Cesium.Color.LIME,
        restaurant: Cesium.Color.GOLD,
        shelter: Cesium.Color.GRAY,
        tent_ground: Cesium.Color.MAROON,
        toilets: Cesium.Color.VIOLET,
        waste_basket: Cesium.Color.NAVY,
        waste_disposal: Cesium.Color.OLIVE,
        "": Cesium.Color.WHITE, // pusty amenity
      };
      return colors[type] || Cesium.Color.WHITE;
    }

    // 5. Funkcja tworząca pusty kontener legendy
    function createLegend() {
      const legend = document.createElement("div");
      legend.id = "legend";
      legend.style.position = "absolute";
      legend.style.top = "10px";
      legend.style.left = "10px";
      legend.style.backgroundColor = "white";
      legend.style.border = "1px solid black";
      legend.style.padding = "10px";
      legend.innerHTML = "<h3>Legenda</h3>";
      document.body.appendChild(legend);
    }

    // 6. Funkcja dodająca opcje do legendy
    function addLegendOptions(dataSource, category) {
      const legend = document.getElementById("legend");

      // Zbierz unikalne wartości atrybutu (także puste "")
      const types = new Set();
      dataSource.entities.values.forEach((entity) => {
        const val = entity.properties[category]?.getValue() || "";
        types.add(val);
      });

      // Dodaj checkbox globalny (włącz/wyłącz całą warstwę dataSource)
      const amenityContainer = document.createElement("div");
      const amenityCheckbox = document.createElement("input");
      amenityCheckbox.type = "checkbox";
      amenityCheckbox.checked = true;
      amenityCheckbox.addEventListener("change", () => {
        dataSource.show = amenityCheckbox.checked;
      });

      const amenityLabel = document.createElement("label");
      amenityLabel.textContent = " Amenity (wszystko)";

      amenityContainer.appendChild(amenityCheckbox);
      amenityContainer.appendChild(amenityLabel);
      legend.appendChild(amenityContainer);

      // Dla każdej rozpoznanej wartości tworzymy osobny checkbox
      types.forEach((typeVal) => {
        const container = document.createElement("div");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.addEventListener("change", () => {
          dataSource.entities.values.forEach((entity) => {
            const eType = entity.properties[category]?.getValue() || "";
            if (eType === typeVal) {
              entity.show = checkbox.checked;
            }
          });
        });

        const label = document.createElement("label");
        // Jeśli typ jest pusty, wyświetl np. (brak)
        label.textContent = typeVal === "" ? " (brak)" : ` ${typeVal}`;
        // Ustaw kolor tekstu na taki sam, jaki ma punkt
        label.style.color = getColorForAmenity(typeVal).toCssColorString();

        container.appendChild(checkbox);
        container.appendChild(label);
        legend.appendChild(container);
      });
    }

    // 7. Uruchamiamy funkcję inicjalizującą
    initializeViewer();
  </script>
</body>
</html>

