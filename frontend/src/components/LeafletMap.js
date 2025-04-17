import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  GeoJSON,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "lrm-graphhopper";
import "../styles/LeafletMap.css";

import currentPerims from "../data/firePerims.json";
import allPerims from "../data/allFirePerims.json";
import createGraphHopper from "./customRouter.js";

const startIcon = L.icon({
  iconUrl: "/marker_map_icon.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const endIcon = L.icon({
  iconUrl: "/marker_map_icon.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const avoidPolygon = [
  [-118.7, 34.02],
  [-118.7, 34.1],
  [-118.5, 34.1],
  [-118.5, 34.02],
  [-118.7, 34.02],
];

const avoidAreaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [avoidPolygon],
      },
      properties: {
        name: "Avoid Area (Topanga/Malibu)",
      },
    },
  ],
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => deg * (Math.PI / 180);
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Routing = ({ start, end, onRouteCreated }) => {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    if (routingControl) {
      map.removeControl(routingControl);
    }

    const control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      router: createGraphHopper(process.env.REACT_APP_MAP_API_KEY, {
        serviceUrl: "https://graphhopper.com/api/1/route",
        avoidPolygons: {
          stop: avoidPolygon,
        },
      }),
      createMarker: () => null,
      routeWhileDragging: false,
      lineOptions: { styles: [{ color: "#007bff", weight: 4 }] },
      collapsible: true,
    }).addTo(map);

    setRoutingControl(control);
    onRouteCreated(control);

    return () => {
      if (control) {
        control.getPlan().setWaypoints([]);
        map.removeControl(control);
      }
    };
  }, [map, start, end, onRouteCreated]);

  return null;
};

const ClickHandler = ({
  enableAqiClick,
  aqiData,
  setClickedPoint,
  setStartLocation,
  setEndLocation,
}) => {
  const [clickCount, setClickCount] = useState(0);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      if (enableAqiClick) {
        let minDist = Infinity,
          nearest = null;

        for (const row of aqiData) {
          const d = getDistance(lat, lng, row.Latitude, row.Longitude);
          if (d < minDist) {
            minDist = d;
            nearest = row;
          }
        }

        if (nearest) {
          setClickedPoint({
            lat: nearest.Latitude,
            lng: nearest.Longitude,
            info: nearest,
          });
        }
        return;
      }

      // Normal routing click
      if (clickCount === 0) {
        setStartLocation({ lat, lng });
        setClickCount(1);
      } else {
        setEndLocation({ lat, lng });
        setClickCount(0);
      }
    },
  });

  return null;
};

function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.poly_IncidentName) {
    layer.bindPopup(feature.properties.poly_IncidentName);
  }
}

const LeafletMap = ({
  start,
  end,
  setStartLocation,
  setEndLocation,
  setRouteControl,
  enableAqiClick,
  aqiData,
}) => {
  const [clickedPoint, setClickedPoint] = useState(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!enableAqiClick) {
      setClickedPoint(null);
    }
  }, [enableAqiClick]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [clickedPoint]);

  return (
    <MapContainer
      center={[33.9506, -118.1142]}
      zoom={9.5}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <ClickHandler
        enableAqiClick={enableAqiClick}
        aqiData={aqiData}
        setClickedPoint={setClickedPoint}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
      />

      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      {end && <Marker position={[end.lat, end.lng]} icon={endIcon} />}

      {clickedPoint && (
        <Marker
          position={[clickedPoint.lat, clickedPoint.lng]}
          icon={startIcon}
          ref={markerRef}
        >
          <Popup>
            <strong>AQI Info</strong>
            <br />
            AQI: {clickedPoint.info.Calculated_AQI} (
            {clickedPoint.info.AQI_Category})<br />
            Main Pollutant: {clickedPoint.info.Main_Pollutant}
            <br />
            PM2.5: {clickedPoint.info["PM2.5"]}
            <br />
            CO: {clickedPoint.info.CO}
            <br />
            NO2: {clickedPoint.info.NO2}
            <br />
            O3: {clickedPoint.info.O3}
            <br />
            SO2: {clickedPoint.info.SO2}
          </Popup>
        </Marker>
      )}

      {start && end && (
        <Routing start={start} end={end} onRouteCreated={setRouteControl} />
      )}

      <LayersControl position="topleft" collapsed={false}>
        <LayersControl.Overlay name="Current Fires">
          <GeoJSON
            data={currentPerims}
            style={{
              fillColor: "#222222",
              color: "#111111",
              fillOpacity: 0.6,
              weight: 1,
            }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="All 2025 Fires">
          <GeoJSON
            data={allPerims}
            style={{
              fillColor: "#1a1a1a",
              color: "#0f0f0f",
              fillOpacity: 0.75,
              weight: 1,
            }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Avoid Area (Topanga)">
          <GeoJSON
            data={avoidAreaGeoJSON}
            style={{
              color: "#FF0000",
              fillColor: "#FF6666",
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "5, 5",
            }}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(feature.properties.name || "Avoid Area");
            }}
          />
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
};

export default LeafletMap;
