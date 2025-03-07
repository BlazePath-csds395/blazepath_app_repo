import React from "react";
import "../styles/Sidebar.css";

function Sidebar({ setRadius, setMinOpacity }) {
  const handleRadiusChange = (e) => {
    const value = Number(e.target.value);
    console.log("Sidebar updating radius:", value);
    setRadius(value);
  };

  const handleMinOpacityChange = (e) => {
    const value = Number(e.target.value);
    console.log("Sidebar updating minOpacity:", value);
    setMinOpacity(value);
  };

  return (
    <div className="sidebar">
      <h2>Heatmap Controls</h2>

      {/* Radius Control */}
      <label>
        Radius:
        <input
          type="number"
          defaultValue={30}
          min="5"
          max="100"
          onChange={handleRadiusChange}
        />
      </label>

      <br />

      {/* Min Opacity Control */}
      <label>
        Min Opacity:
        <input
          type="number"
          defaultValue={0.2}
          step="0.1"
          min="0"
          max="1"
          onChange={handleMinOpacityChange}
        />
      </label>
    </div>
  );
}

export default Sidebar;
