import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet-routing-machine";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";

const Routing = ({ start, end, onRouteCreated }) => {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);

  useEffect(() => {
    if (!map) return;

    console.log("Adding route...");

    const control = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng),
      ],
      show: false,
      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: "#6FA1EC", weight: 4 }],
      },
    }).addTo(map);

    setRoutingControl(control);
    onRouteCreated(control); // Pass the control instance to the parent component

    return () => {
      if (control) {
        control.getPlan().setWaypoints([]); // Clear waypoints
        map.removeControl(control);
        console.log("Route removed on unmount.");
      }
    };
  }, [map, start, end, onRouteCreated]);

  return null;
};

const LeafletMap = ({ selectedFactor, start, end, setRouteControl }) => {
  return (
    <MapContainer
      center={[start.lat, start.lng]}
      zoom={7}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <Routing start={start} end={end} onRouteCreated={setRouteControl} />
    </MapContainer>
  );
};

export default LeafletMap;
