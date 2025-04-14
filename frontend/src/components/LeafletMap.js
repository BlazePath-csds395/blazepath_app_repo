// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, useMap, useMapEvents, GeoJSON, LayersControl, LayerGroup } from "react-leaflet";
// import "leaflet-routing-machine";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "../styles/LeafletMap.css";
// import currentPerims from '../data/firePerims.json';
// import allPerims from '../data/allFirePerims.json';

// import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// // This function as an asynch or await function does not seem to function properly.
// // It always results in an error -> seems to return a different type of value than expected, even though values themselves are fine.

// // async function getFireData() {
// //   try {
// //     const response = await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson');
// //     const responseJson = await response.json();
// //     console.log(responseJson)
// //   } catch (error) {
// //     console.error(error);
// //   }
// // }

// // Load the custom icons from the public folder
// const Icon = L.icon({
//   iconUrl: "/marker_map_icon.png",
//   iconSize: [40, 40], // Adjust size of the icon
//   iconAnchor: [20, 40], // Anchor position
//   popupAnchor: [0, -40], // Adjust popup positioning
// });

// const Routing = ({ start, end, onRouteCreated }) => {
//   const map = useMap();
//   const [routingControl, setRoutingControl] = useState(null);

//   useEffect(() => {
//     if (!map || !start || !end) return;

//     // Remove existing route if it exists
//     if (routingControl) {
//       map.removeControl(routingControl);
//     }

//     console.log("Adding route...");
//     const control = L.Routing.control({
//       waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
//       createMarker:
//       function (i, waypoint, n) {
//         const marker = L.marker(waypoint.latLng, {
//           draggable: true,
//           bounceOnAddOptions: {
//             duration: 1000,
//             height: 800
//           },
//           icon: Icon
//         });
//         return marker;
//       },
//       routeWhileDragging: true,
//       lineOptions: { styles: [{ color: "#007bff", weight: 4 }] }, // Blue route line
//       collapsible: true,
//     }).addTo(map);

//     setRoutingControl(control);
//     onRouteCreated(control);

//     return () => {
//       if (control) {
//         control.getPlan().setWaypoints([]);
//         map.removeControl(control);
//         console.log("Route removed on unmount.");
//       }
//     };
//   }, [map, start, end, onRouteCreated]);

//   return null;
// };

// const ClickHandler = ({ setStartLocation, setEndLocation }) => {
//   const [clickCount, setClickCount] = useState(0);

//   useMapEvents({
//     click(e) {
//       if (clickCount === 0) {
//         setStartLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
//         setClickCount(1);
//       } else if (clickCount === 1) {
//         setEndLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
//         setClickCount(0);
//       }
//     },
//   });

//   return null;
// };

// function onEachFeature(feature, layer) {
//   //When loading each GeoJSON for the fire perimeters
//   if (feature.properties && feature.properties.poly_IncidentName) { //check to see if name is present
//     layer.bindPopup(feature.properties.poly_IncidentName); //if so, add the name as a popup
//   }

//   //Chose popup instead of Tooltip because it looks somewhat better. Also makes it so that when fires are visible, you cannot route to there.
// }

// const LeafletMap = ({ start, end, setStartLocation, setEndLocation, setRouteControl }) => {
//   return (
//     <MapContainer center={[33.9506059,-118.1142122]} zoom={9.5} style={{ height: "100vh", width: "100%" }}>
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       />

//       <ClickHandler setStartLocation={setStartLocation} setEndLocation={setEndLocation} />

//       {start && end && <Routing start={start} end={end} onRouteCreated={setRouteControl} />}

//       {/* display GeoJson representation of the firePerims*/}
//       <LayersControl position="topleft" collapsed={false}>
//         <LayersControl.Overlay name="Current Fires">
//           <GeoJSON data={currentPerims} style={{ weight: 1, fillColor:"FF0000", color:"FF0000", fillOpacity: 0.8 }} onEachFeature={onEachFeature}/>
//         </LayersControl.Overlay>
//         <LayersControl.Overlay checked name="All 2025 Fires">
//           <GeoJSON data={allPerims} style={{ fillColor:"FF69F2", color:"FF0000", fillOpacity: 0.6  }} onEachFeature={onEachFeature}/>
//         </LayersControl.Overlay>
//       </LayersControl>

//     </MapContainer>
//   );
// };

// export default LeafletMap;

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  GeoJSON,
  LayersControl,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import currentPerims from "../data/firePerims.json";
import allPerims from "../data/allFirePerims.json";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "../styles/LeafletMap.css";

const Icon = L.icon({
  iconUrl: "/marker_map_icon.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

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

const AQIClickHandler = ({ data, enableAqiClick, setClickedPoint }) => {
  useMapEvents({
    click(e) {
      if (!enableAqiClick || !data || data.length === 0) return;

      const { lat, lng } = e.latlng;
      let minDist = Infinity,
        nearest = null;

      for (const row of data) {
        const d = getDistance(
          lat,
          lng,
          parseFloat(row.Latitude),
          parseFloat(row.Longitude)
        );
        if (d < minDist) {
          minDist = d;
          nearest = row;
        }
      }

      setClickedPoint({
        lat: parseFloat(nearest.Latitude),
        lng: parseFloat(nearest.Longitude),
        info: nearest,
      });

      // ✅ No longer reset enableAqiClick here
    },
  });

  return null;
};

const RoutingClickHandler = ({
  setStartLocation,
  setEndLocation,
  enableAqiClick,
}) => {
  const [clickCount, setClickCount] = useState(0);

  useMapEvents({
    click(e) {
      if (enableAqiClick) return; // skip routing clicks if AQI mode is on

      if (clickCount === 0) {
        setStartLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setClickCount(1);
      } else {
        setEndLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        setClickCount(0);
      }
    },
  });

  return null;
};

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
      createMarker: (i, waypoint) =>
        L.marker(waypoint.latLng, { draggable: true, icon: Icon }),
      routeWhileDragging: true,
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

function onEachFeature(feature, layer) {
  if (feature.properties?.poly_IncidentName) {
    layer.bindPopup(feature.properties.poly_IncidentName);
  }
}

const LeafletMap = ({
  start,
  end,
  setStartLocation,
  setEndLocation,
  setRouteControl,
  heatmapData,
  enableAqiClick,
  setEnableAqiClick,
}) => {
  const [clickedPoint, setClickedPoint] = useState(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [clickedPoint]);

  useEffect(() => {
    if (!enableAqiClick) {
      setClickedPoint(null);
    }
  }, [enableAqiClick]);

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

      <RoutingClickHandler
        enableAqiClick={enableAqiClick}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
      />

      <AQIClickHandler
        data={heatmapData}
        enableAqiClick={enableAqiClick}
        setEnableAqiClick={setEnableAqiClick}
        setClickedPoint={setClickedPoint}
      />

      {clickedPoint && (
        <Marker
          position={[clickedPoint.lat, clickedPoint.lng]}
          icon={Icon}
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

      <Routing start={start} end={end} onRouteCreated={setRouteControl} />

      <LayersControl position="topleft" collapsed={false}>
        <LayersControl.Overlay name="Current Fires">
          <GeoJSON
            data={currentPerims}
            style={{ fillColor: "red", color: "red", fillOpacity: 0.8 }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="All 2025 Fires">
          <GeoJSON
            data={allPerims}
            style={{ fillColor: "#FF69F2", color: "red", fillOpacity: 0.6 }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
};

export default LeafletMap;
