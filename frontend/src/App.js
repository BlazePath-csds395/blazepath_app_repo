import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import aqiCsv from "./data/aqi_dataset.csv"; // ✅ your file
import "./styles/App.css";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [routeControl, setRouteControl] = useState(null);
  const [enableAqiClick, setEnableAqiClick] = useState(false);
  const [aqiData, setAqiData] = useState([]);

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
        setAqiData(filtered);
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
        enableAqiClick={enableAqiClick}
        setEnableAqiClick={setEnableAqiClick}
      />
      <LeafletMap
        selectedFactor={selectedFactor}
        start={startLocation}
        end={endLocation}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        setRouteControl={setRouteControl}
        enableAqiClick={enableAqiClick}
        aqiData={aqiData}
      />
    </div>
  );
};

export default App;
