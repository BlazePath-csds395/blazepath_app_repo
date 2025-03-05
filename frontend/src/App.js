import React, { useState } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App = () => {
  const [route, setRoute] = useState(null);
  const [selectedFactor, setSelectedFactor] = useState(null);

  return (
    <div className="app">
      <Sidebar onSetRoute={setRoute} onSelectFactor={setSelectedFactor} />
      <LeafletMap route={route} selectedFactor={selectedFactor} />
    </div>
  );
};

export default App;
