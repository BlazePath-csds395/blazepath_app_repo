import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet-routing-machine";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";

// Load the custom icons from the public folder
const startIcon = L.icon({
  iconUrl: "/marker_map_icon.png", // Path to your downloaded start marker
  iconSize: [40, 40], // Adjust size of the icon
  iconAnchor: [20, 40], // Anchor position
  popupAnchor: [0, -40], // Adjust popup positioning
});

const endIcon = L.icon({
  iconUrl: "/marker_map_icon.png", // Path to your downloaded end marker
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
      createMarker: () => null, // Prevent default Leaflet markers
      routeWhileDragging: true,
      lineOptions: { styles: [{ color: "#007bff", weight: 4 }] }, // Blue route line
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
    <MapContainer center={[37.7749, -122.4194]} zoom={7} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <ClickHandler setStartLocation={setStartLocation} setEndLocation={setEndLocation} />

      {/* Display custom icons instead of default markers */}
      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      {end && <Marker position={[end.lat, end.lng]} icon={endIcon} />}

      {start && end && <Routing start={start} end={end} onRouteCreated={setRouteControl} />}
    </MapContainer>
  );
};

export default LeafletMap;
