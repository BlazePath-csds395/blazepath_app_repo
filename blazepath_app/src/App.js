import React, { useState } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [routeControl, setRouteControl] = useState(null);

  const removeRoute = () => {
    if (routeControl) {
      console.log("Removing route...");
      routeControl.getPlan().setWaypoints([]); // Clear waypoints
      routeControl._map.removeControl(routeControl); // Remove routing control
      setRouteControl(null);
      console.log("Route removed successfully.");
    } else {
      console.log("No route to remove.");
    }

    // Clear start and end locations (for the map)
    setStartLocation(null);
    setEndLocation(null);
  };

  return (
    <div className="app">
      <Sidebar
        onSelectFactor={setSelectedFactor}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        removeRoute={removeRoute}
        startLocation={startLocation}
        endLocation={endLocation}
      />
      <LeafletMap
        selectedFactor={selectedFactor}
        start={startLocation}
        end={endLocation}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        setRouteControl={setRouteControl}
      />
    </div>
  );
};

export default App;
