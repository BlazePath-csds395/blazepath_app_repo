import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";

const LeafletMap = ({ selectedFactor }) => {
  return (
    <div className="map-container">
      <MapContainer center={[37.7749, -122.4194]} zoom={13} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      </MapContainer>
      <div className="map-controls">
        <button className="control-button">📍</button>
        <button className="control-button">+</button>
        <button className="control-button">-</button>
        <button className="control-button">👤</button>
      </div>
    </div>
  );
};

export default LeafletMap;
