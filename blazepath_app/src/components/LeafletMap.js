import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet-routing-machine";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";

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
      createMarker: () => null, // Avoid adding extra markers
      routeWhileDragging: true,
      lineOptions: { styles: [{ color: "#6FA1EC", weight: 4 }] },
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
    <MapContainer
      center={[19.076, 72.8777]}
      zoom={7}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <ClickHandler setStartLocation={setStartLocation} setEndLocation={setEndLocation} />

      {/* Only show markers if start and end exist */}
      {start && <Marker position={[start.lat, start.lng]} />}
      {end && <Marker position={[end.lat, end.lng]} />}

      {start && end && <Routing start={start} end={end} onRouteCreated={setRouteControl} />}
    </MapContainer>
  );
};

export default LeafletMap;
