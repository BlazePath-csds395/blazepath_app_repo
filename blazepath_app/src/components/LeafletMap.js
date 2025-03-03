import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LeafletMap.css";
import geoJsonData from '../data/allFirePerims.json';

const setColor = ({ properties }) => {
  return { weight: 1, fillColor:"FF6912" };
};



async function getFireData() {
  try {
    const response = await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson');
    const responseJson = await response.json();
    console.log(responseJson)
  } catch (error) {
    console.error(error);
  }
}


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
