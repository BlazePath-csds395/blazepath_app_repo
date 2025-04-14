// import React, { useState } from "react";
// import LeafletMap from "./components/LeafletMap";
// import Sidebar from "./components/Sidebar";
// import "./styles/App.css";

// const App = () => {
//   const [selectedFactor, setSelectedFactor] = useState(null);
//   const [startLocation, setStartLocation] = useState(null);
//   const [endLocation, setEndLocation] = useState(null);
//   const [routeControl, setRouteControl] = useState(null);

//   const removeRoute = () => {
//     if (routeControl) {
//       console.log("Removing route...");
//       routeControl.getPlan().setWaypoints([]); // Clear waypoints
//       routeControl._map.removeControl(routeControl); // Remove routing control
//       setRouteControl(null);
//       console.log("Route removed successfully.");
//     } else {
//       console.log("No route to remove.");
//     }

//     // Clear start and end locations (for the map)
//     setStartLocation(null);
//     setEndLocation(null);
//   };

//   return (
//     <div className="app">
//       <Sidebar
//         onSelectFactor={setSelectedFactor}
//         setStartLocation={setStartLocation}
//         setEndLocation={setEndLocation}
//         removeRoute={removeRoute}
//         startLocation={startLocation}
//         endLocation={endLocation}
//       />
//       <LeafletMap
//         selectedFactor={selectedFactor}
//         start={startLocation}
//         end={endLocation}
//         setStartLocation={setStartLocation}
//         setEndLocation={setEndLocation}
//         setRouteControl={setRouteControl}
//       />
//     </div>
//   );
// };

// export default App;

import React, { useState, useEffect } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";
import Papa from "papaparse";

import aqiCsv from "./data/aqi_dataset.csv"; // your CSV file

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [routeControl, setRouteControl] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [enableAqiClick, setEnableAqiClick] = useState(false);

  const removeRoute = () => {
    if (routeControl) {
      routeControl.getPlan().setWaypoints([]);
      routeControl._map.removeControl(routeControl);
      setRouteControl(null);
    }
    setStartLocation(null);
    setEndLocation(null);
  };

  useEffect(() => {
    fetch(aqiCsv)
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
        });
        const filtered = parsed.data.filter(
          (row) =>
            row.Latitude &&
            row.Longitude &&
            row.Calculated_AQI &&
            (row.Is_Land === true || row.Is_Land === "True")
        );
        setHeatmapData(filtered);
      });
  }, []);

  return (
    <div className="app">
      <Sidebar
        onSelectFactor={setSelectedFactor}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        removeRoute={removeRoute}
        startLocation={startLocation}
        endLocation={endLocation}
        setEnableAqiClick={setEnableAqiClick}
        aqiClickMode={enableAqiClick}
      />
      <LeafletMap
        selectedFactor={selectedFactor}
        start={startLocation}
        end={endLocation}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        setRouteControl={setRouteControl}
        enableAqiClick={enableAqiClick}
        setEnableAqiClick={setEnableAqiClick}
        heatmapData={heatmapData}
      />
    </div>
  );
};

export default App;
