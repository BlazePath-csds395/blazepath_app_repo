import React, { useState, useEffect } from "react";
import createMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

function App() {
  const [radius, setRadius] = useState(30);
  const [minOpacity, setMinOpacity] = useState(0.2);

  // Function to update radius
  const updateRadius = (value) => {
    console.log("Updating radius to:", value);
    setRadius(value);
  };

  // Function to update minOpacity
  const updateMinOpacity = (value) => {
    console.log("Updating minOpacity to:", value);
    setMinOpacity(value);
  };

  useEffect(() => {
    createMap(radius, minOpacity);
  }, [radius, minOpacity]);

  return (
    <div style={{ display: "flex" }}>
      {/* Pass the update functions to Sidebar */}
      <Sidebar setRadius={updateRadius} setMinOpacity={updateMinOpacity} />
      <div id="map" style={{ width: "80vw", height: "100vh" }}></div>
    </div>
  );
}

export default App;
