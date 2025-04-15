import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";
import ExpandingInput from "./ExpandingInput";


const Sidebar = ({ onSelectFactor, setStartLocation, setEndLocation, removeRoute, startLocation, endLocation }) => {
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
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

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="toggle-button rounded-button" onClick={() => setIsOpen(!isOpen)}>
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
          <button onClick={handleFindRoute} className="input-button rounded-button">
            Find Route
          </button>



          <h3/>
          <button onClick={handleRemoveRoute} className="toggle-button rounded-button">
            Remove Route
          </button>
        </div>
        
      )}
    </div>
  );
};

export default Sidebar;