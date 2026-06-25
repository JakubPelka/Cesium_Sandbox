// Cesium Sandbox
// Local test mode:
// - flat OpenStreetMap imagery
// - no Cesium World Terrain
// - no OSM 3D Buildings
// - local 3D Tiles from ./dane/3D/3dtiles-cesium-07/tileset.json
// - optional Cesium Ion token loaded from ./secrets/cesium_ion_token.txt or ./secrets/token1.txt

const LOCAL_TILESET_URL = "./dane/3D/3dtiles-cesium-07/tileset.json";

const START_LAT = 57.444606;
const START_LON = 12.079962;
const START_HEIGHT = 650;

const LOCAL_TILESET_HEIGHT_OFFSET_METERS = 0;

const CESIUM_TOKEN_FILES = [
  "./secrets/cesium_ion_token.txt",
  "./secrets/token1.txt"
];

const viewerOptions = {
  timeline: false,
  animation: false,
  sceneModePicker: true,
  baseLayerPicker: false,
  shadows: false
};

let viewer = null;
let localTileset = null;

const dataSourcesMap = {
  amenity: null,
  leisure: null,
  information: null,
  tourism: null,
  foto: null
};

const categoryTypesMap = {
  amenity: new Set(),
  leisure: new Set(),
  information: new Set(),
  tourism: new Set(),
  foto: new Set()
};

async function loadOptionalCesiumIonToken() {
  for (const tokenFile of CESIUM_TOKEN_FILES) {
    try {
      const response = await fetch(tokenFile, {
        cache: "no-store"
      });

      if (!response.ok) {
        continue;
      }

      const token = (await response.text()).trim();

      if (token.length > 0) {
        Cesium.Ion.defaultAccessToken = token;
        console.log(`Cesium Ion token loaded from ${tokenFile}`);
        return true;
      }
    } catch (error) {
      // Missing local token file is acceptable in sandbox mode.
    }
  }

  console.warn("No local Cesium Ion token file found. Continuing without Ion token.");
  return false;
}

function getOrCreateStatusPanel() {
  let panel = document.getElementById("tilesetStatus");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "tilesetStatus";
    panel.style.position = "absolute";
    panel.style.right = "10px";
    panel.style.top = "10px";
    panel.style.zIndex = "10001";
    panel.style.maxWidth = "420px";
    panel.style.padding = "10px 12px";
    panel.style.background = "rgba(255, 255, 255, 0.92)";
    panel.style.border = "1px solid #222";
    panel.style.borderRadius = "4px";
    panel.style.color = "#111";
    panel.style.fontSize = "13px";
    panel.style.lineHeight = "1.35";
    panel.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.25)";
    document.body.appendChild(panel);
  }

  return panel;
}

function setStatus(message, isError = false) {
  const panel = getOrCreateStatusPanel();
  panel.style.borderColor = isError ? "#b00020" : "#222";
  panel.innerHTML = `
    <strong>Local 3D Tiles</strong><br>
    ${message}
  `;
}

function flyToStartLocation(duration = 0) {
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      START_LON,
      START_LAT,
      START_HEIGHT
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-35),
      roll: 0
    },
    duration: duration
  });
}

function applyTilesetHeightOffset(tileset, offsetMeters) {
  if (!tileset || offsetMeters === 0) return;

  const cartographic = Cesium.Cartographic.fromCartesian(
    tileset.boundingSphere.center
  );

  const surface = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0
  );

  const offset = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    offsetMeters
  );

  const translation = Cesium.Cartesian3.subtract(
    offset,
    surface,
    new Cesium.Cartesian3()
  );

  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

async function createTilesetFromUrl(url) {
  if (Cesium.Cesium3DTileset.fromUrl) {
    return await Cesium.Cesium3DTileset.fromUrl(url);
  }

  return new Cesium.Cesium3DTileset({
    url: url
  });
}

async function loadLocalTileset() {
  try {
    setStatus(`Loading:<br><code>${LOCAL_TILESET_URL}</code>`);

    localTileset = await createTilesetFromUrl(LOCAL_TILESET_URL);
    localTileset.show = true;
    localTileset.shadows = viewerOptions.shadows
      ? Cesium.ShadowMode.ENABLED
      : Cesium.ShadowMode.DISABLED;

    viewer.scene.primitives.add(localTileset);
    window.localTileset = localTileset;

    if (localTileset.readyPromise) {
      await localTileset.readyPromise;
    }

    applyTilesetHeightOffset(localTileset, LOCAL_TILESET_HEIGHT_OFFSET_METERS);

    flyToStartLocation(0);

    setStatus(`
      Loaded:<br>
      <code>${LOCAL_TILESET_URL}</code><br>
      Camera start:<br>
      ${START_LAT}, ${START_LON}<br>
      <button id="zoomToLocalTileset" style="margin-top:8px;">Zoom to local 3D Tiles</button>
      <button id="flyToStartLocation" style="margin-top:8px;">Fly to start location</button>
    `);

    const zoomButton = document.getElementById("zoomToLocalTileset");
    if (zoomButton) {
      zoomButton.addEventListener("click", () => {
        viewer.zoomTo(localTileset);
      });
    }

    const startButton = document.getElementById("flyToStartLocation");
    if (startButton) {
      startButton.addEventListener("click", () => {
        flyToStartLocation(1.5);
      });
    }

    console.log("Local 3D Tiles loaded:", LOCAL_TILESET_URL);
  } catch (error) {
    console.error("Could not load local 3D Tiles:", error);

    setStatus(`
      Could not load:<br>
      <code>${LOCAL_TILESET_URL}</code><br><br>
      Check that the file exists and that you started the local HTTP server
      from the repository root.
    `, true);

    flyToStartLocation(0);
  }
}

async function initializeViewer() {
  try {
    await loadOptionalCesiumIonToken();

    viewer = new Cesium.Viewer("cesiumContainer", {
      baseLayer: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker: false,
      timeline: viewerOptions.timeline,
      animation: viewerOptions.animation,
      sceneModePicker: viewerOptions.sceneModePicker,
      geocoder: false,
      homeButton: true,
      navigationHelpButton: true,
      fullscreenButton: true
    });

    window.viewer = viewer;

    viewer.imageryLayers.removeAll();

    const osmImageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdomains: ["a", "b", "c"],
      maximumLevel: 19,
      credit: "© OpenStreetMap contributors"
    });

    viewer.imageryLayers.addImageryProvider(osmImageryProvider);

    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.baseColor = Cesium.Color.LIGHTGRAY;

    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = false;
    }

    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }

    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;

    flyToStartLocation(0);

    await loadLocalTileset();

    await loadGeoJson(viewer, "./dane/gisdata/amenity.geojson", "amenity");
    await loadGeoJson(viewer, "./dane/gisdata/leisure.geojson", "leisure");
    await loadGeoJson(viewer, "./dane/gisdata/information.geojson", "information");
    await loadGeoJson(viewer, "./dane/gisdata/tourism.geojson", "tourism");
    await loadGeoJson(viewer, "./dane/foto/foto.geojson", "foto");

    createLegend();
  } catch (error) {
    console.error("Błąd podczas inicjalizacji Cesium:", error);
    setStatus(`Viewer initialization failed:<br><code>${error.message}</code>`, true);
  }
}

async function loadGeoJson(viewer, geoJsonUrl, category) {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
      clampToGround: true
    });

    viewer.dataSources.add(dataSource);
    dataSourcesMap[category] = dataSource;

    dataSource.entities.values.forEach((entity) => {
      if (category === "foto") {
        entity.billboard = new Cesium.BillboardGraphics({
          image: "./dane/icons/triangle.png",
          scale: 0.02,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        });

        categoryTypesMap[category].add("360 panorama");
      } else {
        const type = entity.properties[category]?.getValue() || "";
        categoryTypesMap[category].add(type);

        entity.point = {
          pixelSize: 8,
          color: getColorForCategory(category, type),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          height: 0.5
        };
      }
    });
  } catch (error) {
    console.warn(`Nie udało się wczytać pliku ${geoJsonUrl}:`, error);
  }
}

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
      waste_disposal: Cesium.Color.OLIVE
    },
    leisure: {
      bathing_place: Cesium.Color.TEAL,
      bird_hide: Cesium.Color.SIENNA,
      firepit: Cesium.Color.RED,
      park: Cesium.Color.GREEN,
      picnic_table: Cesium.Color.ORANGE,
      pitch: Cesium.Color.BLUE,
      sauna: Cesium.Color.GOLD,
      slipway: Cesium.Color.PURPLE
    },
    information: {
      board: Cesium.Color.CYAN,
      guidepost: Cesium.Color.GREEN,
      map: Cesium.Color.BLUE,
      office: Cesium.Color.RED
    },
    tourism: {
      artwork: Cesium.Color.MAGENTA,
      attraction: Cesium.Color.HOTPINK,
      hotel: Cesium.Color.LIME,
      museum: Cesium.Color.GOLD,
      picnic_site: Cesium.Color.AQUA,
      viewpoint: Cesium.Color.BLUE
    }
  };

  return (colors[category] && colors[category][type]) || Cesium.Color.WHITE;
}

function createLegend() {
  const oldLegend = document.getElementById("sandboxLegendContainer");
  if (oldLegend) {
    oldLegend.remove();
  }

  const container = document.createElement("div");
  container.id = "sandboxLegendContainer";
  container.style.display = "flex";
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.left = "10px";
  container.style.zIndex = "10000";

  const legend = document.createElement("div");
  legend.id = "legend";
  legend.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
  legend.style.border = "1px solid black";
  legend.style.padding = "10px";
  legend.style.overflowY = "auto";
  legend.style.maxHeight = "90vh";
  legend.style.marginRight = "2px";
  legend.style.fontSize = "13px";
  legend.innerHTML = "<h3>Legenda</h3>";

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

  const flyToContainer = document.createElement("div");
  flyToContainer.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
  flyToContainer.style.border = "1px solid black";
  flyToContainer.style.padding = "10px";
  flyToContainer.style.overflowY = "auto";
  flyToContainer.style.maxHeight = "90vh";
  flyToContainer.style.display = "flex";
  flyToContainer.style.flexDirection = "column";
  flyToContainer.style.fontSize = "13px";
  flyToContainer.innerHTML = "<h3>Fly to:</h3>";

  const createButton = (label, onClick) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.padding = "8px";
    button.style.marginTop = "5px";
    button.style.cursor = "pointer";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "white";
    button.addEventListener("click", onClick);
    return button;
  };

  flyToContainer.appendChild(
    createButton("Start / local 3D Tiles area", () => {
      flyToStartLocation(1.5);
    })
  );

  flyToContainer.appendChild(
    createButton("Zoom to local 3D Tiles", () => {
      if (localTileset) {
        viewer.zoomTo(localTileset);
      }
    })
  );

  flyToContainer.appendChild(
    createButton("Breared kyrka", () => {
      viewer.scene.camera.flyTo({
        destination: new Cesium.Cartesian3(
          3416126.2556646536,
          797136.1557231185,
          5309291.888580554
        ),
        orientation: {
          heading: Cesium.Math.toRadians(46.15048722734269),
          pitch: Cesium.Math.toRadians(-21.05141341723995),
          roll: Cesium.Math.toRadians(0.00006605691081643496)
        },
        duration: 2
      });
    })
  );

  flyToContainer.appendChild(
    createButton("Danska Fall", () => {
      viewer.scene.camera.flyTo({
        destination: new Cesium.Cartesian3(
          3418200.5245831874,
          798075.5709303988,
          5308332.749584518
        ),
        orientation: {
          heading: Cesium.Math.toRadians(321.06081047023997),
          pitch: Cesium.Math.toRadians(-36.96287908451543),
          roll: Cesium.Math.toRadians(0.0009689395535730425)
        },
        duration: 2
      });
    })
  );

  flyToContainer.appendChild(
    createButton("Show / hide local 3D Tiles", () => {
      if (localTileset) {
        localTileset.show = !localTileset.show;
      }
    })
  );

  container.appendChild(legend);
  container.appendChild(flyToContainer);
  document.body.appendChild(container);
}

function toggleVisibility(category, type, isVisible) {
  const dataSource = dataSourcesMap[category];
  if (!dataSource) return;

  dataSource.entities.values.forEach((entity) => {
    if (category === "foto") {
      if (type === "360 panorama") {
        entity.show = isVisible;
      }
      return;
    }

    const entityType = entity.properties[category]?.getValue() || "";
    if (entityType === type) {
      entity.show = isVisible;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializeViewer();
});