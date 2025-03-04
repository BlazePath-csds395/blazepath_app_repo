import React, { useState } from "react";
import "../styles/Sidebar.css";

const Sidebar = ({ onSelectFactor }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState("");

  const factors = ["AQI", "CO2 Level", "Traffic", "Weather"];

  const handleFactorChange = (event) => {
    const factor = event.target.value;
    setSelectedFactor(factor);
    onSelectFactor(factor);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "←" : "→"}
      </button>
      {isOpen && (
        <div className="sidebar-content">
          <h3>Select Factor</h3>
          <select value={selectedFactor} onChange={handleFactorChange} className="dropdown">
            <option value="" disabled>Select a factor</option>
            {factors.map((factor) => (
              <option key={factor} value={factor}>
                {factor}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
