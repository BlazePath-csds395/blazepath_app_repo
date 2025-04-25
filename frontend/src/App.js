import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import LeafletMap from "./components/LeafletMap";
import Sidebar from "./components/Sidebar";
import aqiCsv from "./data/aqi_dataset.csv"; // ✅ your file
import "./styles/App.css";

// API base URL for the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

const App = () => {
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [routeControl, setRouteControl] = useState(null);
  const [drawFireMode, setDrawFireMode] = useState(false);
  const [userReportedFires, setUserReportedFires] = useState([]);
  const [enableAqiClick, setEnableAqiClick] = useState(false);
  const [aqiData, setAqiData] = useState([]);

  // Handle toggling the draw fire mode
  const toggleDrawFireMode = (newValue) => {
    // Clean up any leftover draw controls before changing modes
    if (drawFireMode && !newValue) {
      document.querySelectorAll('.leaflet-draw').forEach(el => {
        el.remove();
      });
    }
    setDrawFireMode(newValue);
  };

  // Handle removing the route properly
  const removeRoute = () => {
    if (routeControl) {
      // Safely remove the routing control
      try {
        // Clear waypoints to avoid errors
        if (routeControl.getPlan && routeControl.getPlan()) {
          const emptyWaypoints = routeControl.getWaypoints().map(() => null);
          routeControl.getPlan().setWaypoints(emptyWaypoints);
        }
        
        // Remove the control
        if (routeControl._map) {
          routeControl._map.removeControl(routeControl);
        }
        
        // Also remove any routing lines that might be left behind
        if (routeControl._map) {
          routeControl._map.eachLayer(layer => {
            if (layer._route || (layer._path && layer._path.classList && layer._path.classList.contains('leaflet-routing-line'))) {
              routeControl._map.removeLayer(layer);
            }
          });
        }
        
        // Remove any remaining routing containers from DOM
        document.querySelectorAll('.leaflet-routing-container').forEach(el => {
          el.remove();
        });
      } catch (err) {
        console.warn("Error removing route:", err);
      }
      setRouteControl(null);
    }
    
    // Clear locations to reset the click handler state
    setStartLocation(null);
    setEndLocation(null);
    
    // If in drawing mode, disable it to avoid conflicts
    if (drawFireMode) {
      toggleDrawFireMode(false);
    }
  };

  useEffect(() => {
    // Load AQI data from CSV
    fetch(aqiCsv)
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
        });
        const filtered = parsed.data.filter(
          (row) =>
            row.Latitude &&
            row.Longitude &&
            row.Calculated_AQI &&
            (row.Is_Land === true || row.Is_Land === "True")
        );
        setAqiData(filtered);
      });
    
    // Load user-reported fires from the backend
    const fetchFires = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/fires`);
        if (response.ok) {
          const data = await response.json();
          setUserReportedFires(data.features || []);
        } else {
          console.error("Error fetching fire reports from backend");
          // Fall back to localStorage if backend fails
          const savedFires = localStorage.getItem('userReportedFires');
          if (savedFires) {
            try {
              setUserReportedFires(JSON.parse(savedFires));
            } catch (error) {
              console.error("Error loading saved fires:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error connecting to backend:", error);
        // Fall back to localStorage if backend is unreachable
        const savedFires = localStorage.getItem('userReportedFires');
        if (savedFires) {
          try {
            setUserReportedFires(JSON.parse(savedFires));
          } catch (error) {
            console.error("Error loading saved fires:", error);
          }
        }
      }
    };
    
    fetchFires();
  }, []);

  // Update handleFireReported to use the backend API
  const handleFireReported = async (newFire) => {
    try {
      if (Array.isArray(newFire)) {
        // This is an update to existing fires (for endorsements/rejections)
        // We'll handle these individually with PUT requests
        setUserReportedFires(newFire);
        
        // Find the updated fire (the one with changed endorsement/rejection)
        const originalFires = [...userReportedFires];
        for (const fire of newFire) {
          const original = originalFires.find(f => f.id === fire.id);
          if (original && (
              original.properties.endorsements !== fire.properties.endorsements || 
              original.properties.rejections !== fire.properties.rejections
            )) {
            // This is the updated fire, send to backend
            await fetch(`${API_BASE_URL}/api/fires/${fire.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                properties: {
                  endorsements: fire.properties.endorsements,
                  rejections: fire.properties.rejections
                }
              }),
            });
            break;
          }
        }
      } else {
        // Handle single new fire report
        const fireWithId = {
          ...newFire,
          id: `fire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Send to backend
        const response = await fetch(`${API_BASE_URL}/api/fires`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fireWithId),
        });
        
        const result = await response.json();
        
        if (result.success) {
          const updatedFires = [...userReportedFires, fireWithId];
          setUserReportedFires(updatedFires);
        }
      }
    } catch (error) {
      console.error("Error saving fire report:", error);
      // Fall back to localStorage in case of API errors
      if (Array.isArray(newFire)) {
        setUserReportedFires(newFire);
        localStorage.setItem('userReportedFires', JSON.stringify(newFire));
      } else {
        const fireWithId = {
          ...newFire,
          id: `fire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        const updatedFires = [...userReportedFires, fireWithId];
        setUserReportedFires(updatedFires);
        localStorage.setItem('userReportedFires', JSON.stringify(updatedFires));
      }
    }
  };

  // Save fires to a local file
  const saveFiresToFile = async () => {
    if (userReportedFires.length === 0) {
      alert("No fire reports to save");
      return;
    }

    try {
      // Get the file from the backend API
      window.open(`${API_BASE_URL}/api/fires/download`, '_blank');
    } catch (error) {
      console.error("Error downloading fire reports:", error);
      // Fall back to client-side download
      const dataStr = JSON.stringify({
        type: "FeatureCollection",
        features: userReportedFires
      }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.download = `blazepath-fires-${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="app">
      <Sidebar
        onSelectFactor={setSelectedFactor}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        removeRoute={removeRoute}
        startLocation={startLocation}
        endLocation={endLocation}
        enableAqiClick={enableAqiClick}
        setEnableAqiClick={setEnableAqiClick}
        drawFireMode={drawFireMode}
        setDrawFireMode={toggleDrawFireMode}
        userReportedFires={userReportedFires}
        saveFiresToFile={saveFiresToFile}
      />
      <LeafletMap
        selectedFactor={selectedFactor}
        start={startLocation}
        end={endLocation}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        setRouteControl={setRouteControl}
        enableAqiClick={enableAqiClick}
        aqiData={aqiData}
        drawFireMode={drawFireMode}
        onFireReported={handleFireReported}
        userReportedFires={userReportedFires}
      />
    </div>
  );
};

export default App;
