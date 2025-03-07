import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";

const Sidebar = ({ onSelectFactor, setStartLocation, setEndLocation, removeRoute, startLocation, endLocation }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState("");
  const [startLat, setStartLat] = useState("");
  const [startLng, setStartLng] = useState("");
  const [endLat, setEndLat] = useState("");
  const [endLng, setEndLng] = useState("");

  const factors = ["AQI", "CO2 Level", "Traffic", "Weather"];

  const handleFactorChange = (event) => {
    const factor = event.target.value;
    setSelectedFactor(factor);
    onSelectFactor(factor);
  };

  const handleSetStartLocation = () => {
    if (!startLat || !startLng) {
      alert("Please enter valid latitude and longitude for Start Location.");
      return;
    }
    setStartLocation({ lat: parseFloat(startLat), lng: parseFloat(startLng) });
  };

  const handleSetEndLocation = () => {
    if (!endLat || !endLng) {
      alert("Please enter valid latitude and longitude for End Location.");
      return;
    }
    setEndLocation({ lat: parseFloat(endLat), lng: parseFloat(endLng) });
  };

  // Reset input fields when the removeRoute function is called
  const handleRemoveRoute = () => {
    removeRoute();
    setStartLat("");
    setStartLng("");
    setEndLat("");
    setEndLng("");
  };

  // Sync input values with startLocation and endLocation
  useEffect(() => {
    if (startLocation) {
      setStartLat(startLocation.lat);
      setStartLng(startLocation.lng);
    } else {
      setStartLat("");
      setStartLng("");
    }

    if (endLocation) {
      setEndLat(endLocation.lat);
      setEndLng(endLocation.lng);
    } else {
      setEndLat("");
      setEndLng("");
    }
  }, [startLocation, endLocation]);

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Collapse" : "→"}
      </button>
      {isOpen && (
        <div className="sidebar-content">
          <h3>Select Factor</h3>
          <select value={selectedFactor} onChange={handleFactorChange} className="dropdown">
            <option value="" disabled>Select a factor</option>
            {factors.map((factor) => (
              <option key={factor} value={factor}>{factor}</option>
            ))}
          </select>

          <h3>Start Location</h3>
          <input
            type="number"
            placeholder="Start Latitude"
            value={startLat}
            onChange={(e) => setStartLat(e.target.value)}
          />
          <input
            type="number"
            placeholder="Start Longitude"
            value={startLng}
            onChange={(e) => setStartLng(e.target.value)}
          />
          <button onClick={handleSetStartLocation}>Set Start</button>

          <h3>End Location</h3>
          <input
            type="number"
            placeholder="End Latitude"
            value={endLat}
            onChange={(e) => setEndLat(e.target.value)}
          />
          <input
            type="number"
            placeholder="End Longitude"
            value={endLng}
            onChange={(e) => setEndLng(e.target.value)}
          />
          <button onClick={handleSetEndLocation}>Set End</button>

          <button onClick={handleRemoveRoute} className="remove-route-button">
            Remove Route
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
