import React, { useState } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState({ lat: 19.076, lng: 72.8777 }); // Default: Mumbai
  const [endLocation, setEndLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Default: Pune
  const [routeControl, setRouteControl] = useState(null);

  const removeRoute = () => {
    if (routeControl) {
      console.log("Removing route...");
      routeControl.getPlan().setWaypoints([]); // Clear waypoints
      routeControl._map.removeControl(routeControl); // Remove the routing control
      setRouteControl(null); // Reset state
      console.log("Route removed successfully.");
    } else {
      console.log("No route to remove.");
    }
  };

  return (
    <div className="app">
      <Sidebar
        onSelectFactor={setSelectedFactor}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        removeRoute={removeRoute} // Pass the remove function
      />
      <LeafletMap 
        selectedFactor={selectedFactor} 
        start={startLocation} 
        end={endLocation} 
        setRouteControl={setRouteControl} // Pass state setter
      />
    </div>
  );
};

export default App;
