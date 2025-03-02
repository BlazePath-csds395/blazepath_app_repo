import React, { useState } from "react";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);

  return (
    <div className="app">
      <Sidebar onSelectFactor={setSelectedFactor} />
      <LeafletMap selectedFactor={selectedFactor} />
    </div>
  );
};

export default App;
