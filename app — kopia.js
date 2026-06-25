// Ustawienie tokenu Cesium Ion (podmień na swój w razie potrzeby)
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MTBiZjhmMy1hNTI4LTQ4NTctYWI3NC0zYTk2Yjg3MzUxYzkiLCJpZCI6NjU0MTEsImlhdCI6MTYzMDE0OTY2M30.yiRGU3qAkT8TcvH5rRmyxP2RMSme2lnBOVrZ63UfzzM";

	// Opcje Viewer - zmienne sterujące
	const viewerOptions = {
	  timeline: false, // Wyłącz timeline
	  animation: false, // Wyłącz animację
	  sceneModePicker: true, // Wyłącz przełącznik trybów
	  baseLayerPicker: true, // Wyłącz wybór warstw bazowych
	  shadows: true,
	  terrainShadows: Cesium.ShadowMode.ENABLED,
	};

const shadowMap = viewer.shadowMap;
shadowMap.maximumDistance = 10000.0

    // Zmienna przechowująca Viewer
    let viewer = null;
	

    // Przechowujemy referencje do wczytanych dataSources,
    // aby nie wczytywać GeoJSON ponownie
    const dataSourcesMap = {
      amenity: null,
      leisure: null,
      information: null,
      tourism: null,
	  foto:null,
    };

    // Zestawy typów (podkategorii) faktycznie występujących w każdej kategorii
    const categoryTypesMap = {
      amenity: new Set(),
      leisure: new Set(),
      information: new Set(),
      tourism: new Set(),
	  foto: new Set (),
    };

    // Funkcja inicjalizująca CesiumJS
	async function initializeViewer() {
	  try {
		// Wczytanie terenu (ID=1 to podstawowy asset w Ion)
		const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);

		// Tworzenie Viewer z dynamicznymi opcjami
		viewer = new Cesium.Viewer("cesiumContainer", {
		  terrainProvider: terrainProvider,
		  timeline: viewerOptions.timeline,
		  animation: viewerOptions.animation,
		  sceneModePicker: viewerOptions.sceneModePicker,
		  baseLayerPicker: viewerOptions.baseLayerPicker,
		});

		// Wyłączenie globu może powodować błąd WebGL, więc nie modyfikujemy tej opcji
		viewer.scene.globe.depthTestAgainstTerrain = false;

		// Dodanie budynków OSM
		const osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
		viewer.scene.primitives.add(osmBuildingsTileset);

		// Ustawienie pozycji kamery na podstawie przechwyconych danych
		viewer.scene.camera.flyTo({
		  destination: new Cesium.Cartesian3(3417033.1891163304, 797065.9847368638, 5309224.057201362), // Współrzędne w układzie ECEF
		  orientation: {
			heading: Cesium.Math.toRadians(7.834103914516273), // Przekonwertowane stopnie na radiany
			pitch: Cesium.Math.toRadians(-33.89194640070617), // Przekonwertowane stopnie na radiany
			roll: Cesium.Math.toRadians(0.0017616063568893605), // Przekonwertowane stopnie na radiany
		  },
		  duration: 0, // Brak animacji
		});










		// Wczytanie danych GeoJSON
		await loadGeoJson(viewer, './dane/gisdata/amenity.geojson', 'amenity');
		await loadGeoJson(viewer, './dane/gisdata/leisure.geojson', 'leisure');
		await loadGeoJson(viewer, './dane/gisdata/information.geojson', 'information');
		await loadGeoJson(viewer, './dane/gisdata/tourism.geojson', 'tourism');
		await loadGeoJson(viewer, './dane/foto/foto.geojson', 'foto');

		// Utworzenie legendy
		createLegend();

	  } catch (error) {
		console.error("Błąd podczas inicjalizacji Cesium:", error);
	  }
	}

    // Funkcja do wczytania danych GeoJSON
async function loadGeoJson(viewer, geoJsonUrl, category) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
      clampToGround: true,
    });
    viewer.dataSources.add(dataSource);

    // Zachowaj referencję
    dataSourcesMap[category] = dataSource;

    dataSource.entities.values.forEach((entity) => {
      // W zależności od kategorii ustawiamy styl
      if (category === 'foto') {
        // 1) Ustaw billboard z ikoną trójkąta
        entity.billboard = new Cesium.BillboardGraphics({
          image: './dane/icons/triangle.png', // ścieżka do ikonki trójkąta
          scale: 0.02,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
		
        });

         categoryTypesMap[category].add("360 panorama");
		
      } else {
        // Dla pozostałych warstw (amenity, leisure, etc.) zostawiasz oryginalny styl:
        const type = entity.properties[category]?.getValue() || "";
        categoryTypesMap[category].add(type);

        entity.point = {
          pixelSize: 8,
          color: getColorForCategory(category, type),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          height: 0.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
      }
    });
  } catch (error) {
    console.error(`Błąd podczas wczytywania pliku ${geoJsonUrl}:`, error);
  }
}

    // Funkcja mapująca (kategoria, typ) -> Cesium.Color
    function getColorForCategory(category, type) {
      const colors = {
        amenity: {
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
        },
        leisure: {
          bathing_place: Cesium.Color.TEAL,
          bird_hide: Cesium.Color.SIENNA,
          firepit: Cesium.Color.RED,
          park: Cesium.Color.GREEN,
          picnic_table: Cesium.Color.ORANGE,
          pitch: Cesium.Color.BLUE,
          sauna: Cesium.Color.GOLD,
          slipway: Cesium.Color.PURPLE,
        },
        information: {
          board: Cesium.Color.CYAN,
          guidepost: Cesium.Color.GREEN,
          map: Cesium.Color.BLUE,
          office: Cesium.Color.RED,
        },
        tourism: {
          artwork: Cesium.Color.MAGENTA,
          attraction: Cesium.Color.HOTPINK,
          hotel: Cesium.Color.LIME,
          museum: Cesium.Color.GOLD,
          picnic_site: Cesium.Color.AQUA,
          viewpoint: Cesium.Color.BLUE,
        },
      };

      // Jeśli dana kategoria/typ nie istnieje w zdefiniowanej liście, zwróć biały
      return (colors[category] && colors[category][type]) || Cesium.Color.WHITE;
    }

   // Funkcja tworząca legendę z możliwością włączania/wyłączania widoczności i przyciskiem "Fly to"
function createLegend() {
  // Kontener nadrzędny dla legendy i przycisków "Fly to"
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "10px";

  // Kontener legendy
  const legend = document.createElement("div");
  legend.id = "legend";
  legend.style.backgroundColor = "white";
  legend.style.border = "1px solid black";
  legend.style.padding = "10px";
  legend.style.overflowY = "auto";
  legend.style.maxHeight = "90%";
  legend.style.marginRight = "2px"; // Odstęp między kolumnami
  legend.innerHTML = "<h3>Legenda</h3>";

  // Iterujemy po kategoriach (amenity, leisure, itd.)
  Object.keys(categoryTypesMap).forEach((category) => {
    if (!dataSourcesMap[category]) return;

    const section = document.createElement("div");
    section.style.marginBottom = "10px";

    const header = document.createElement("h4");
    header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    header.style.marginBottom = "5px";
    section.appendChild(header);

    categoryTypesMap[category].forEach((type) => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.marginBottom = "5px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.style.marginRight = "8px";
      checkbox.addEventListener("change", () => {
        toggleVisibility(category, type, checkbox.checked);
      });

      const symbol = document.createElement("div");
      symbol.style.width = "12px";
      symbol.style.height = "12px";
      symbol.style.marginRight = "8px";
      symbol.style.borderRadius = "50%";
      symbol.style.border = "1px solid black";
      symbol.style.backgroundColor = getColorForCategory(category, type).toCssColorString();

      const label = document.createElement("span");
      label.textContent = type === "" ? "(brak)" : type;
      label.style.color = "black";

      item.appendChild(checkbox);
      item.appendChild(symbol);
      item.appendChild(label);
      section.appendChild(item);
    });

    legend.appendChild(section);
  });

// Funkcja do włączania/wyłączania widoczności obiektów dla danej kategorii i typu
    function toggleVisibility(category, type, isVisible) {
      const dataSource = dataSourcesMap[category];
      if (!dataSource) return;

      dataSource.entities.values.forEach((entity) => {
        const entityType = entity.properties[category]?.getValue() || "";
        if (entityType === type) {
          entity.show = isVisible;
        }
      });
    }


  // Kontener dla przycisków "Fly to"
  const flyToContainer = document.createElement("div");
  flyToContainer.style.backgroundColor = "white";
  flyToContainer.style.border = "1px solid black";
  flyToContainer.style.padding = "10px";
  flyToContainer.style.overflowY = "auto";
  flyToContainer.style.maxHeight = "90%";
  flyToContainer.style.display = "flex";
  flyToContainer.style.flexDirection = "column";
  flyToContainer.innerHTML = "<h3>Fly to:</h3>";

  const createButton = (label, onClick) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.padding = "10px";
    button.style.marginTop = "5px";
    button.style.cursor = "pointer";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "white";
    button.addEventListener("click", onClick);
    return button;
  };

  flyToContainer.appendChild(
    createButton("Start Vy", () => {
      viewer.scene.camera.flyTo({
        destination: new Cesium.Cartesian3(3417033.1891163304, 797065.9847368638, 5309224.057201362),
        orientation: {
          heading: Cesium.Math.toRadians(7.834103914516273),
          pitch: Cesium.Math.toRadians(-33.89194640070617),
          roll: Cesium.Math.toRadians(0.0017616063568893605),
        },
        duration: 2,
      });
    })
  );

  flyToContainer.appendChild(
    createButton("Breared kyrka", () => {
      viewer.scene.camera.flyTo({
        destination: new Cesium.Cartesian3(3416126.2556646536, 797136.1557231185, 5309291.888580554),
        orientation: {
          heading: Cesium.Math.toRadians(46.15048722734269),
          pitch: Cesium.Math.toRadians(-21.05141341723995),
          roll: Cesium.Math.toRadians(0.00006605691081643496),
        },
        duration: 2,
      });
    })
  );

  flyToContainer.appendChild(
    createButton("Danska Fall", () => {
      viewer.scene.camera.flyTo({
        destination: new Cesium.Cartesian3(3418200.5245831874, 798075.5709303988, 5308332.749584518),
        orientation: {
          heading: Cesium.Math.toRadians(321.06081047023997),
          pitch: Cesium.Math.toRadians(-36.96287908451543),
          roll: Cesium.Math.toRadians(0.0009689395535730425),
        },
        duration: 2,
      });
    })
  );

  // Przełącznik widoczności modelu kościoła
  const toggleChurchButton = createButton("Show Church Model", () => {
    churchModel.show = !churchModel.show;
  });

  flyToContainer.appendChild(toggleChurchButton);

  container.appendChild(legend);
  container.appendChild(flyToContainer);
  document.body.appendChild(container);
}

// Funkcja dodająca model kościoła
let churchModel;
async function initializeChurchModel() {
  try {
    churchModel = await Cesium.Cesium3DTileset.fromIonAssetId(2975115);
    viewer.scene.primitives.add(churchModel);
  } catch (error) {
    console.error("Error loading church model:", error);
  }
}

// Wywołanie po załadowaniu DOM
document.addEventListener("DOMContentLoaded", async () => {
  await initializeViewer();
  await initializeChurchModel();
  createLegend();
});



