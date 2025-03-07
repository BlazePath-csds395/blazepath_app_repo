import React, { useEffect, useState } from "react";
import createMap from "./createMap"; // Import the map function
import "../styles/LeafletMap.css";

const LeafletMap = () => {
  const [fireData, setFireData] = useState([]);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/sample.geojson`)
      .then(response => response.json())
      .then(data => {
        if (data.features) {
          setFireData(data.features);
        }
      })
      .catch(error => console.error("🔥 Error fetching fire data:", error));
  }, []);

  useEffect(() => {
    if (fireData.length > 0) {
      createMap(fireData); // Call createMap only after data loads
    }
  }, [fireData]);

  return <div id="map" className="map-container" />;
};

export default LeafletMap;
