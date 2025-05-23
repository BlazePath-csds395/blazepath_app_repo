import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";

const Sidebar = ({
  onSelectFactor,
  setStartLocation,
  setEndLocation,
  removeRoute,
  startLocation,
  endLocation,
  enableAqiClick,
  setEnableAqiClick,
  drawFireMode,
  setDrawFireMode,
  userReportedFires,
  saveFiresToFile
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState("");
  const [startLat, setStartLat] = useState("");
  const [startLng, setStartLng] = useState("");
  const [endLat, setEndLat] = useState("");
  const [endLng, setEndLng] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");

  const factors = ["AQI", "CO2 Level", "Traffic", "Weather"];

  const fetchCoordinates = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      const data = await response.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } else {
        alert(`Address not found: ${address}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  const handleFindRoute = async () => {
    if (!fromAddress || !toAddress) return alert("Enter both addresses!");

    const fromCoords = await fetchCoordinates(fromAddress);
    const toCoords = await fetchCoordinates(toAddress);

    if (fromCoords && toCoords) {
      setStartLocation({ lat: fromCoords.lat, lng: fromCoords.lng });
      setEndLocation({ lat: toCoords.lat, lng: toCoords.lng });
    }
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
    setFromAddress("");
    setToAddress("");
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

  const handleFactorChange = (event) => {
    const factor = event.target.value;
    setSelectedFactor(factor);
    onSelectFactor(factor);
  };

  // Helper function to disable other modes when one is enabled
  const toggleMode = (mode, setValue) => {
    if (mode === 'aqi' && setValue) {
      setDrawFireMode(false);
    } else if (mode === 'drawFire' && setValue) {
      setEnableAqiClick(false);
    }
  };

  const handleAqiModeToggle = (e) => {
    const newValue = e.target.checked;
    setEnableAqiClick(newValue);
    toggleMode('aqi', newValue);
  };

  const handleDrawFireModeToggle = (e) => {
    const newValue = e.target.checked;
    setDrawFireMode(newValue);
    toggleMode('drawFire', newValue);
    
    // This will add a class to the body that our CSS can target
    // to show/hide the draw controls
    if (newValue) {
      document.body.classList.add('draw-fire-mode');
    } else {
      document.body.classList.remove('draw-fire-mode');
    }
  };

  const clearLocalFires = () => {
    if (window.confirm("Are you sure you want to clear all local fire reports? This will not affect data stored on the server.")) {
      // Clear localStorage
      localStorage.removeItem('userReportedFires');
      
      // Reload the page to reset React state
      window.location.reload();
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button
        className="toggle-button rounded-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Collapse" : "→"}
      </button>
      {isOpen && (
        <div className="sidebar-content">
          
          <h3>Enter Start & Destination</h3>
          <input
            type="text"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="From (Start Address)"
            className="address-input"
          />
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="To (Destination Address)"
            className="address-input"
          />
          <button
            onClick={handleFindRoute}
            className="input-button rounded-button"
          >
            Find Route
          </button>

          <h3 />
          <button
            onClick={handleRemoveRoute}
            className="toggle-button rounded-button"
          >
            Remove Route
          </button>

          {/* Mode Toggles */}
          <div className="mode-toggles" style={{ marginTop: "1.5em" }}>
            <h3>Map Modes</h3>
            
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={enableAqiClick}
                onChange={handleAqiModeToggle}
              />
              <span>Enable AQI Info Click Mode</span>
            </label>
            
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={drawFireMode}
                onChange={handleDrawFireModeToggle}
              />
              <span>Report Fire Drawing Mode</span>
            </label>

            {drawFireMode && (
              <div className="mode-info">
                <p>Use the drawing tools on the map to:</p>
                <ul>
                  <li>Add a marker for a spot fire</li>
                  <li>Draw a polygon around a fire area</li>
                  <li>Draw a rectangle for a fire zone</li>
                </ul>
                <p>After drawing, your fire is automatically saved.</p>
                <p><strong>Community Fire Reports:</strong> {userReportedFires ? userReportedFires.length : 0}</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="save-button"
                    onClick={saveFiresToFile}
                    disabled={!userReportedFires || userReportedFires.length === 0}
                  >
                    Export Fire Reports
                  </button>
                  
                  <button
                    className="save-button"
                    onClick={clearLocalFires}
                    style={{ backgroundColor: '#f44336' }}
                    disabled={!userReportedFires || userReportedFires.length === 0}
                  >
                    Clear Local Fires
                  </button>
                </div>
              </div>
            )}
          </div>

          
          
        </div>
      )}
    </div>
  );
};


/* currently unused latitude stuff
<h3>Start Location</h3>
          <input
            className="latlong-input"
            type="number"
            placeholder="Start Latitude"
            value={startLat != "" ? Math.round(startLat * 10000) / 10000 : ""}
            onChange={(e) => setStartLat(e.target.value)}
          />
          <input
            className="latlong-input"
            type="number"
            placeholder="Start Longitude"
            value={startLng != "" ? Math.round(startLng * 10000) / 10000 : ""}
            onChange={(e) => setStartLng(e.target.value)}
          />
          <br />
          <button
            onClick={handleSetStartLocation}
            className="input-button rounded-button"
          >
            Set Start
          </button>

          <h3>End Location</h3>
          <input
            className="latlong-input"
            type="number"
            placeholder="End Latitude"
            value={endLat != "" ? Math.round(endLat * 10000) / 10000 : ""}
            onChange={(e) => setEndLat(e.target.value)}
          />
          <input
            className="latlong-input"
            type="number"
            placeholder="End Longitude"
            value={endLng != "" ? Math.round(endLng * 10000) / 10000 : ""}
            onChange={(e) => setEndLng(e.target.value)}
          />
          <button
            onClick={handleSetEndLocation}
            className="input-button rounded-button"
          >
            Set End
          </button>
*/
export default Sidebar;
