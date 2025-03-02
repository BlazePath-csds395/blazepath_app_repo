import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";
import geoJsonData from '../data/allFirePerims.json';

const setColor = ({ properties }) => {
  return { weight: 1, fillColor:"FF6912" };
};

const LeafletMap = ({ selectedFactor }) => {
  return (
    <div className="map-container">
      <MapContainer center={[34.0365485,-118.2507257]} zoom={10} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <GeoJSON data={geoJsonData} style={setColor}/>
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
