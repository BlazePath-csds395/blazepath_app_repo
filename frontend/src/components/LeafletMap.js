import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";
import geoJsonData from '../data/allFirePerims.json';

const setColor = ({ properties }) => {
  return { weight: 1, fillColor: "FF6912" };
};

// Prevent the Polyline from disappearing on pan/zoom
const RouteLayer = ({ route }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const map = useMap(); // Access the map instance

  useEffect(() => {
    if (!route?.from || !route?.to) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${route.from.lng},${route.from.lat};${route.to.lng},${route.to.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
          setRouteCoords(coordinates);
        } else {
          alert("No route found!");
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [route]); // Run only when the route changes

  return routeCoords.length > 0 ? <Polyline positions={routeCoords} color="blue" /> : null;
};

const LeafletMap = ({ route, selectedFactor }) => {
  const mapRef = useRef(null);

  return (
    <div className="map-container">
      <MapContainer
        center={[34.0365485, -118.2507257]}
        zoom={10}
        className="map"
        whenCreated={(map) => (mapRef.current = map)} // Store map instance
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {route?.from && <Marker position={route.from} />}
        {route?.to && <Marker position={route.to} />}
        <RouteLayer route={route} />
        <GeoJSON data={geoJsonData} style={setColor} />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
