import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, GeoJSON, LayersControl } from "react-leaflet";
import "leaflet-routing-machine";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";
import currentPerims from '../data/firePerims.json';
import allPerims from '../data/allFirePerims.json';



// This function as an asynch or await function does not seem to function properly.
// It always results in an error -> seems to return a different type of value than expected, even though values themselves are fine.

// async function getFireData() {
//   try {
//     const response = await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson');
//     const responseJson = await response.json();
//     console.log(responseJson)
//   } catch (error) {
//     console.error(error);
//   }
// }

// Load the custom icons from the public folder
const startIcon = L.icon({
  iconUrl: "/marker_map_icon.png", 
  iconSize: [40, 40], // Adjust size of the icon
  iconAnchor: [20, 40], // Anchor position
  popupAnchor: [0, -40], // Adjust popup positioning
});

const endIcon = L.icon({
  iconUrl: "/marker_map_icon.png", 
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const Routing = ({ start, end, onRouteCreated }) => {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Remove existing route if it exists
    if (routingControl) {
      map.removeControl(routingControl);
    }

    console.log("Adding route...");
    const control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      createMarker: () => null, // Prevent default Leaflet markers (Looks like a black box)
      routeWhileDragging: true,
      lineOptions: { styles: [{ color: "#007bff", weight: 4 }] }, // Blue route line
      collapsible: true,
    }).addTo(map);

    setRoutingControl(control);
    onRouteCreated(control);

    return () => {
      if (control) {
        control.getPlan().setWaypoints([]);
        map.removeControl(control);
        console.log("Route removed on unmount.");
      }
    };
  }, [map, start, end, onRouteCreated]);

  return null;
};

const ClickHandler = ({ setStartLocation, setEndLocation }) => {
  const [clickCount, setClickCount] = useState(0);

  useMapEvents({
    click(e) {
      if (clickCount === 0) {
        setStartLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setClickCount(1);
      } else if (clickCount === 1) {
        setEndLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setClickCount(0);
      }
    },
  });

  return null;
};

const LeafletMap = ({ start, end, setStartLocation, setEndLocation, setRouteControl }) => {
  return (
    <MapContainer center={[33.9506059,-118.1142122]} zoom={9.5} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <ClickHandler setStartLocation={setStartLocation} setEndLocation={setEndLocation} />

      {/* Display custom icons instead of default markers */}
      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      {end && <Marker position={[end.lat, end.lng]} icon={endIcon} />}

      {start && end && <Routing start={start} end={end} onRouteCreated={setRouteControl} />}

      {/* display GeoJson representation of the firePerims*/}

      <LayersControl position="topleft">
        <LayersControl.Overlay name="Current Fires">
          <GeoJSON data={currentPerims} style={{ weight: 1, fillColor:"FF6912" }}/>
        </LayersControl.Overlay>
        <LayersControl.Overlay name="All 2025 Fires">
          <GeoJSON data={allPerims} style={{ weight: 1, fillColor:"FF69F2" }}/>
        </LayersControl.Overlay>
      </LayersControl>
      
    </MapContainer>
  );
};

export default LeafletMap;
