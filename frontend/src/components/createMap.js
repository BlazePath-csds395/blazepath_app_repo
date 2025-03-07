import L from "leaflet";
import "leaflet.heat";
import "../styles/LeafletMap.css"; 

let mapInstance = null; // Prevent duplicate maps

function createMap(fireData, radius = 30, minOpacity = 0.2) {
  if (mapInstance !== null) {
    console.warn("Map is already initialized. Updating data...");
    
    // 🔥 If the map exists, only update heatmap data
    let existingHeatLayer = mapInstance.heatLayer;
    if (existingHeatLayer) {
      mapInstance.removeLayer(existingHeatLayer);
    }

    // 🔥 Convert fireData to heatmap format
    const heatData = fireData.map(fire => {
      const [lng, lat] = fire.geometry.coordinates;
      return [lat, lng, fire.properties.intensity || 0.1];
    });

    // 🔥 Create a new heatmap layer
    const heatLayer = L.heatLayer(heatData, {
      radius: radius,
      minOpacity: minOpacity,
      gradient: {
        0.1: "blue",
        0.4: "lime",
        0.6: "red",
        1.0: "yellow"
      }
    });

    // 🔥 Add the updated heatmap to the existing map
    heatLayer.addTo(mapInstance);
    mapInstance.heatLayer = heatLayer;
    return mapInstance;
  }

  // 🔥 Initialize the map (only runs once)
  mapInstance = L.map("map").setView([37.3175, -122.09219], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapInstance);

  // 🔥 Convert fireData to heatmap format
  const heatData = fireData.map(fire => {
    const [lng, lat] = fire.geometry.coordinates;
    return [lat, lng, fire.properties.intensity || 0.1];
  });

  // 🔥 Create heatmap layer
  const heatLayer = L.heatLayer(heatData, {
    radius: radius,
    minOpacity: minOpacity,
    gradient: {
      0.1: "blue",
      0.4: "lime",
      0.6: "red",
      1.0: "yellow"
    }
  });

  // 🔥 Add heatmap to the map
  heatLayer.addTo(mapInstance);
  mapInstance.heatLayer = heatLayer;

  return mapInstance;
}

export default createMap;
