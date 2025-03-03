import React, { useState } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState({ lat: 19.076, lng: 72.8777 }); // Default: Mumbai
  const [endLocation, setEndLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Default: Pune

  return (
    <div className="app">
      <Sidebar
        onSelectFactor={setSelectedFactor}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
      />
      <LeafletMap selectedFactor={selectedFactor} start={startLocation} end={endLocation} />
    </div>
  );
};

export default App;
