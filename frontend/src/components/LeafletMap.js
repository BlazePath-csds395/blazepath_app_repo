import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  GeoJSON,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "lrm-graphhopper";
import "../styles/LeafletMap.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import currentPerims_exact from "../data/firePerims.json";
import allPerims_exact from "../data/allFirePerims.json";
import currentPerims from "../data/firePerims_SMOOTHED.json";
import allPerims from "../data/allFirePerims_SMOOTHED.json";
import shelters from "../data/shelters.json";
//https://hifld-geoplatform.hub.arcgis.com/datasets/geoplatform::national-shelter-system-facilities/about
import createGraphHopper from "./customRouter.js";
import * as turf from '@turf/turf';


const startIcon = L.icon({
  iconUrl: "/marker_map_icon.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const endIcon = L.icon({
  iconUrl: "/marker_map_icon.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const fireIcon = new L.Icon.Default({
  imagePath: '',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [75, 123],
  iconAnchor: [36, 123],
  popupAnchor: [1, -102],
  shadowSize: [123, 123]
});

const avoidPolygon = [
  [-118.7, 34.02],
  [-118.7, 34.1],
  [-118.5, 34.1],
  [-118.5, 34.02],
  [-118.7, 34.02],
];

const avoidAreaGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [avoidPolygon],
      },
      properties: {
        name: "Avoid Area (Topanga/Malibu)",
      },
    },
  ],
};

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => deg * (Math.PI / 180);
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate avoid polygons from all fire perimeters
const generateFireAvoidPolygonsOLD = () => {
  const avoidPolygons = {};
  
  // Add manual avoid area
  avoidPolygons.manual = avoidPolygon;
  
  // Process fire data from currentPerims
  if (currentPerims && currentPerims.features) {
    currentPerims.features.forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        // Convert coordinates to [lng, lat] format required by GraphHopper
        const coords = feature.geometry.coordinates[0];
        if (coords && coords.length > 2) {
          avoidPolygons[`fire_${index}`] = coords;
        }
      }
    });
  }
  
  return avoidPolygons;
};


const generateFireAvoidPolygons = (start, end) => {
  const avoidPolygons = {};

  // Always include manual polygon
  if (avoidPolygon) {
    avoidPolygons.manual = avoidPolygon;
  }

  if (!currentPerims?.features?.length) return avoidPolygons;
  
  // Convert [lng, lat] for turf

  const from = turf.point([Number(start.lng), Number(start.lat)]);
  const to = turf.point([Number(end.lng), Number(end.lat)]);

  const center = turf.midpoint(from, to);
  
  const maxDistance = 3.5 * turf.distance(from, to, { units: 'kilometers' });

  
  currentPerims.features.forEach((feature, index) => {
    if (feature.geometry?.type === 'Polygon') {
      const centroid = turf.centroid(feature);
      const dist = turf.distance(center, centroid, { units: 'kilometers' });

      if (dist <= maxDistance) {
        const coords = feature.geometry.coordinates[0];
        if (coords && coords.length > 2) {
          avoidPolygons[`fire_${index}`] = coords;
        }
      }
    }
  });

  return avoidPolygons;
};

// Generate avoid options for GraphHopper with all fire polygons
const getAvoidOptions = (start, end) => {
  
  const avoidPolygons = generateFireAvoidPolygons(start, end);
  return {
    avoidPolygons: avoidPolygons
  };
};

const Routing = ({ start, end, onRouteCreated }) => {
  const map = useMap();
  const [routingControl, setRoutingControl] = useState(null);

  // Safely remove routing control
  const safeRemoveControl = (control) => {
    try {
      if (control && control._map) {
        // Clear waypoints first to avoid removeLayer errors
        if (control.getPlan()) {
          const waypoints = control.getWaypoints();
          // Create empty waypoints array of the same length
          const emptyWaypoints = waypoints.map(() => null);
          control.getPlan().setWaypoints(emptyWaypoints);
        }
        
        // Remove the control
        control._map.removeControl(control);
      }
    } catch (err) {
      console.warn("Error cleaning up routing control:", err);
    }
  };

  useEffect(() => {
    if (!map || !start || !end) return;

    // Safely remove previous routing control
    if (routingControl) {
      safeRemoveControl(routingControl);
    }

    // Create the routing control with GraphHopper
    try {
      const apiKey = process.env.REACT_APP_MAP_API_KEY || '';
      console.log("Using API key (first 4 chars):", apiKey ? apiKey.substring(0, 4) : 'none');
      
      // Get avoid options with all fire areas
      const avoidOptions = getAvoidOptions(start,end);
      console.log(avoidOptions);
      // Create router with fire avoidance
      const router = apiKey ? 
        createGraphHopper(apiKey, {
          serviceUrl: "https://graphhopper.com/api/1/route",
          ...avoidOptions
        }) : 
        undefined; // Fall back to default OSRM if no API key

      const control = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        router: router,
        createMarker: function (i, waypoint, n) {
          const icon = i === 0 ? startIcon : endIcon;
          const marker = L.marker(waypoint.latLng, {
            draggable: true,
            bounceOnAddOptions: {
              duration: 1000,
              height: 800
            },
            icon: icon
          });
          return marker;
        },
        routeWhileDragging: true,
        lineOptions: { styles: [{ color: "#007bff", weight: 4 }] },
        collapsible: true,
        // Add error handling
        errorCallback: function(error) {
          console.error("Routing error:", error);
        },
        // Limit to only 2 waypoints
        maxGeocoderTolerance: 0,
        addWaypoints: false,
        draggableWaypoints: true,
        useZoomParameter: true,
        showAlternatives: false
      }).addTo(map);

      // Ensure we maintain only 2 waypoints at all times
      const plan = control.getPlan();
      const originalSplice = plan.spliceWaypoints;
      plan.spliceWaypoints = function(index, waypointsToRemove, ...newWaypoints) {
        // Only allow two waypoints maximum
        if (plan.getWaypoints().filter(wp => wp && wp.latLng).length + newWaypoints.length - waypointsToRemove > 2) {
          console.warn("Attempt to add more than 2 waypoints blocked");
          return 0;
        }
        return originalSplice.call(this, index, waypointsToRemove, ...newWaypoints);
      };

      setRoutingControl(control);
      onRouteCreated(control);
    } catch (error) {
      console.error("Error setting up routing:", error);
      // Fallback to standard routing if GraphHopper fails
      try {
        const control = L.Routing.control({
          waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
          createMarker: function (i, waypoint, n) {
            const icon = i === 0 ? startIcon : endIcon;
            return L.marker(waypoint.latLng, {
              draggable: true,
              icon: icon
            });
          },
          routeWhileDragging: true,
          lineOptions: { styles: [{ color: "#007bff", weight: 4 }] },
          // Limit to only 2 waypoints
          addWaypoints: false,
          draggableWaypoints: true,
          // Add error handling
          errorCallback: function(error) {
            console.error("Fallback routing error:", error);
          }
        }).addTo(map);

        setRoutingControl(control);
        onRouteCreated(control);
      } catch (fallbackError) {
        console.error("Error setting up fallback routing:", fallbackError);
      }
    }

    // Clean up function
    return () => {
      if (routingControl) {
        safeRemoveControl(routingControl);
      }
    };
  }, [map, start, end, onRouteCreated]);

  return null;
};

const ClickHandler = ({
  enableAqiClick,
  aqiData,
  setClickedPoint,
  setStartLocation,
  setEndLocation,
  drawFireMode,
  start,
  end,
  setRouteControl
}) => {
  const [clickCount, setClickCount] = useState(0);
  const map = useMap();

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
  };

  // Reset click count when locations change
  useEffect(() => {
    if (!start && !end) {
      setClickCount(0);
    } else if (start && end) {
      setClickCount(2);
    } else if (start && !end) {
      setClickCount(1);
    }
  }, [start, end]);

  // Function to clear existing route before updating markers
  const clearExistingRoute = () => {
    // Remove routing control completely, which includes instructions panel
    if (setRouteControl) {
      // Get the current routing control
      map.eachLayer(layer => {
        // Clear routing lines
        if (layer._route || (layer._path && layer._path.classList && layer._path.classList.contains('leaflet-routing-line'))) {
          map.removeLayer(layer);
        }
        
        // Clear routing markers
        if (layer instanceof L.Marker && layer.options && (
          (layer.options.icon === startIcon || layer.options.icon === endIcon) ||
          (layer._icon && (layer._icon.src.includes('marker-icon') || layer._icon.src.includes('marker_map_icon')))
        )) {
          map.removeLayer(layer);
        }
      });

      // Remove routing instructions panel
      const routingContainer = document.querySelector('.leaflet-routing-container');
      if (routingContainer) {
        routingContainer.remove();
      }
      
      setRouteControl(null);
    }
  };

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      // If in drawing mode, don't handle clicks for routing
      if (drawFireMode) {
        return;
      }

      if (enableAqiClick) {
        let minDist = Infinity,
          nearest = null;

        for (const row of aqiData) {
          const d = getDistance(lat, lng, row.Latitude, row.Longitude);
          if (d < minDist) {
            minDist = d;
            nearest = row;
          }
        }

        if (nearest) {
          setClickedPoint({
            lat: nearest.Latitude,
            lng: nearest.Longitude,
            info: nearest,
          });
        }
        return;
      }

      // Handle routing clicks
      if (clickCount === 0) {
        // First click - set start location
        setStartLocation({ lat, lng });
        setClickCount(1);
      } else if (clickCount === 1) {
        // Second click - set end location
        setEndLocation({ lat, lng });
        setClickCount(2);
      } else {
        // Subsequent clicks - update closest marker
        // First clear any existing routes to prevent multiple routes
        clearExistingRoute();
        
        if (start && end) {
          // Calculate distance to start and end
          const distToStart = calculateDistance(lat, lng, start.lat, start.lng);
          const distToEnd = calculateDistance(lat, lng, end.lat, end.lng);
          
          // Update the closest marker
          if (distToStart < distToEnd) {
            setStartLocation({ lat, lng });
          } else {
            setEndLocation({ lat, lng });
          }
        } else {
          // Something went wrong with state tracking, reset
          setStartLocation({ lat, lng });
          setEndLocation(null);
          setClickCount(1);
        }
      }
    },
  });

  return null;
};

// Drawing Control for user-reported fires
const DrawControl = ({ drawFireMode, onFireReported }) => {
  const map = useMap();
  const [drawControl, setDrawControl] = useState(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const tempLayerRef = useRef(null);
  const [pendingDrawing, setPendingDrawing] = useState(null);

  // Clear previous controls when component is mounted or unmounted
  useEffect(() => {
    // Create a confirmation control when there's a pending drawing
    if (pendingDrawing) {
      // Create confirmation UI
      const confirmationContainer = L.DomUtil.create('div', 'fire-confirmation-container');
      confirmationContainer.style.position = 'absolute';
      confirmationContainer.style.zIndex = '1000';
      confirmationContainer.style.backgroundColor = 'white';
      confirmationContainer.style.padding = '10px';
      confirmationContainer.style.borderRadius = '5px';
      confirmationContainer.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      confirmationContainer.style.top = '10px';
      confirmationContainer.style.left = '50%';
      confirmationContainer.style.transform = 'translateX(-50%)';
      
      // Confirmation text
      const confirmText = document.createElement('div');
      confirmText.innerHTML = '<strong>Save this fire report?</strong>';
      confirmText.style.marginBottom = '10px';
      confirmText.style.textAlign = 'center';
      
      // Confirmation buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      
      const confirmButton = document.createElement('button');
      confirmButton.innerHTML = 'Save';
      confirmButton.style.padding = '5px 15px';
      confirmButton.style.marginRight = '5px';
      confirmButton.style.backgroundColor = '#4CAF50';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.cursor = 'pointer';
      
      const cancelButton = document.createElement('button');
      cancelButton.innerHTML = 'Cancel';
      cancelButton.style.padding = '5px 15px';
      cancelButton.style.backgroundColor = '#f44336';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      
      buttonContainer.appendChild(confirmButton);
      buttonContainer.appendChild(cancelButton);
      
      confirmationContainer.appendChild(confirmText);
      confirmationContainer.appendChild(buttonContainer);
      
      document.querySelector('.leaflet-container').appendChild(confirmationContainer);
      
      // Add event listeners
      confirmButton.addEventListener('click', () => {
        // Save the drawing
        const drawnItems = drawnItemsRef.current;
        if (tempLayerRef.current) {
          drawnItems.addLayer(tempLayerRef.current);
          
          // Extract GeoJSON from the drawn layer
          const geoJSON = tempLayerRef.current.toGeoJSON();
          
          // Add metadata to the GeoJSON
          geoJSON.properties = {
            ...geoJSON.properties,
            reportedBy: "user",
            timestamp: new Date().toISOString(),
            verified: false,
            endorsements: 0,
            rejections: 0
          };
          
          // Pass the new fire report to parent component
          onFireReported(geoJSON);
          
          // Reset
          tempLayerRef.current = null;
          setPendingDrawing(null);
          
          // Remove confirmation UI
          document.querySelector('.leaflet-container').removeChild(confirmationContainer);
        }
      });
      
      cancelButton.addEventListener('click', () => {
        // Remove the temporary drawing
        if (tempLayerRef.current) {
          map.removeLayer(tempLayerRef.current);
          tempLayerRef.current = null;
        }
        
        setPendingDrawing(null);
        
        // Remove confirmation UI
        document.querySelector('.leaflet-container').removeChild(confirmationContainer);
        
        // Properly re-initialize the drawing tools after cancellation
        setTimeout(() => {
          // First, remove any existing drawing controls
          if (drawControl) {
            map.removeControl(drawControl);
            setDrawControl(null);
          }
          
          // Then create a new drawing control
          const drawControlOptions = {
            position: 'topright',
            draw: {
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: {
                icon: fireIcon
              },
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Error:</strong> Shape edges cannot cross!'
                },
                shapeOptions: {
                  color: '#ff0000'
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#ff0000'
                }
              }
            },
            edit: {
              featureGroup: drawnItemsRef.current,
              remove: true
            }
          };
          
          // Create and add the new control
          const newControl = new L.Control.Draw(drawControlOptions);
          map.addControl(newControl);
          setDrawControl(newControl);
          
          // Make sure the draw UI is visible
          document.body.classList.add('draw-fire-mode');
        }, 100); // Small timeout to ensure DOM has updated
      });
      
      return () => {
        // Clean up confirmation UI if component unmounts
        if (document.querySelector('.fire-confirmation-container')) {
          document.querySelector('.leaflet-container').removeChild(confirmationContainer);
        }
      };
    }
    
    return () => {
      // Remove any existing draw controls when component unmounts
      document.querySelectorAll('.leaflet-draw').forEach(el => {
        el.remove();
      });
    };
  }, [pendingDrawing, map, onFireReported]);

  useEffect(() => {
    if (!map) return;

    // Initialize the FeatureGroup for drawn items
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // Remove existing controls before adding new ones
    if (drawControl) {
      map.removeControl(drawControl);
      setDrawControl(null);
    }

    // Only add the draw control if in drawing mode
    if (!drawFireMode) return;

    // Configure the draw control
    const drawControlOptions = {
      position: 'topright',
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: {
          icon: fireIcon
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#ff0000'
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#ff0000'
          }
        }
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    };

    // Create the draw control
    const control = new L.Control.Draw(drawControlOptions);
    map.addControl(control);
    setDrawControl(control);

    // Handle draw events - now stores drawing temporarily and shows confirmation
    const handleDrawCreated = (e) => {
      const layer = e.layer;
      
      // Add layer to map temporarily (but not to drawnItems yet)
      map.addLayer(layer);
      tempLayerRef.current = layer;
      
      // Set pending drawing to trigger confirmation UI
      setPendingDrawing(e.layerType);
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      if (control) {
        map.removeControl(control);
      }
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [map, drawFireMode, onFireReported]);

  return null;
};

function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.poly_IncidentName) {
    layer.bindPopup(feature.properties.poly_IncidentName);
  }
}

function onEachUserFire(feature, layer) {
  if (feature.properties) {
    let popupContent = '';
    
    if (feature.properties.reportedBy) {
      const reportTime = new Date(feature.properties.timestamp).toLocaleString();
      const lastEndorsedTime = feature.properties.lastEndorsedAt ? 
        new Date(feature.properties.lastEndorsedAt).toLocaleString() : 'Not endorsed yet';
      
      // Check if user has already endorsed this fire
      const endorsedFires = JSON.parse(localStorage.getItem('endorsedFires') || '[]');
      const hasEndorsed = endorsedFires.includes(feature.id);
      
      popupContent += `<div>
        <p><strong>User Reported Fire</strong></p>
        <p><strong>Reported:</strong> ${reportTime}</p>
        <p><strong>Endorsements:</strong> <span id="endorsement-count-${feature.id}">${feature.properties.endorsements || 0}</span></p>
        <p><strong>Last Endorsed At:</strong> <span id="last-endorsed-${feature.id}">${lastEndorsedTime}</span></p>
        <div class="endorsement-buttons">
          <button class="endorse-btn" id="endorse-btn-${feature.id}" data-id="${feature.id}" 
            onclick="window.endorseFire('${feature.id}')" 
            ${hasEndorsed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            ${hasEndorsed ? '✓' : '👍'}
          </button>
          <button class="reject-btn" data-id="${feature.id}" onclick="window.rejectFire('${feature.id}')">👎</button>
        </div>
      </div>`;
    }
    
    layer.bindPopup(popupContent);
  }
}

const LeafletMap = ({
  start,
  end,
  setStartLocation,
  setEndLocation,
  setRouteControl,
  enableAqiClick,
  aqiData,
  drawFireMode,
  onFireReported,
  userReportedFires,
}) => {
  const [clickedPoint, setClickedPoint] = useState(null);
  const markerRef = useRef(null);

  // Set global function for endorsement buttons in popups
  useEffect(() => {
    if (!userReportedFires) return;

    window.endorseFire = (fireId) => {
      // Check if user has already endorsed this fire
      const endorsedFires = JSON.parse(localStorage.getItem('endorsedFires') || '[]');
      if (endorsedFires.includes(fireId)) {
        console.log("You've already endorsed this fire");
        return;
      }
      
      const now = new Date();
      const currentTime = now.toISOString();
      
      const updatedFires = userReportedFires.map(fire => {
        if (fire.id === fireId) {
          const updatedFire = {
            ...fire,
            properties: {
              ...fire.properties,
              endorsements: (fire.properties.endorsements || 0) + 1,
              lastEndorsedAt: currentTime
            }
          };
          
          // Update the DOM directly for real-time updates
          const countElement = document.getElementById(`endorsement-count-${fireId}`);
          const timeElement = document.getElementById(`last-endorsed-${fireId}`);
          const endorseButton = document.getElementById(`endorse-btn-${fireId}`);
          
          if (countElement) {
            countElement.textContent = updatedFire.properties.endorsements;
          }
          
          if (timeElement) {
            timeElement.textContent = now.toLocaleString();
          }
          
          if (endorseButton) {
            endorseButton.disabled = true;
            endorseButton.style.opacity = 0.5;
            endorseButton.style.cursor = 'not-allowed';
            endorseButton.innerHTML = '✓';
          }
          
          // Save this fire ID to localStorage to prevent multiple endorsements
          endorsedFires.push(fireId);
          localStorage.setItem('endorsedFires', JSON.stringify(endorsedFires));
          
          return updatedFire;
        }
        return fire;
      });
      
      onFireReported(updatedFires);
    };
    
    window.rejectFire = (fireId) => {
      // Update rejection count
      const updatedFires = userReportedFires.map(fire => {
        if (fire.id === fireId) {
          return {
            ...fire,
            properties: {
              ...fire.properties,
              rejections: (fire.properties.rejections || 0) + 1
            }
          };
        }
        return fire;
      });
      
      onFireReported(updatedFires);
    };
    
    return () => {
      // Clean up global functions
      delete window.endorseFire;
      delete window.rejectFire;
    };
  }, [userReportedFires, onFireReported]);

  useEffect(() => {
    if (!enableAqiClick) {
      setClickedPoint(null);
    }
  }, [enableAqiClick]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [clickedPoint]);

  return (
    <MapContainer
      center={[33.9506, -118.1142]}
      zoom={9.5}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <ClickHandler
        enableAqiClick={enableAqiClick}
        aqiData={aqiData}
        setClickedPoint={setClickedPoint}
        setStartLocation={setStartLocation}
        setEndLocation={setEndLocation}
        drawFireMode={drawFireMode}
        start={start}
        end={end}
        setRouteControl={setRouteControl}
      />

      {drawFireMode && (
        <DrawControl drawFireMode={drawFireMode} onFireReported={onFireReported} />
      )}

      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      {end && <Marker position={[end.lat, end.lng]} icon={endIcon} />}

      {clickedPoint && (
        <Marker
          position={[clickedPoint.lat, clickedPoint.lng]}
          icon={startIcon}
          ref={markerRef}
        >
          <Popup>
            <strong>AQI Info</strong>
            <br />
            AQI: {clickedPoint.info.Calculated_AQI} (
            {clickedPoint.info.AQI_Category})<br />
            Main Pollutant: {clickedPoint.info.Main_Pollutant}
            <br />
            PM2.5: {clickedPoint.info["PM2.5"]}
            <br />
            CO: {clickedPoint.info.CO}
            <br />
            NO2: {clickedPoint.info.NO2}
            <br />
            O3: {clickedPoint.info.O3}
            <br />
            SO2: {clickedPoint.info.SO2}
          </Popup>
        </Marker>
      )}

      {start && end && (
        <Routing start={start} end={end} onRouteCreated={setRouteControl} />
      )}

      <LayersControl position="topleft" collapsed={false}>
        <LayersControl.Overlay checked name="Current Fires">
          <GeoJSON
            data={currentPerims_exact}
            style={{
              fillColor: "#222222",
              color: "#111111",
              fillOpacity: 0.6,
              weight: 1,
            }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="All 2025 Fires">
          <GeoJSON
            data={allPerims_exact}
            style={{
              fillColor: "#1a1a1a",
              color: "#0f0f0f",
              fillOpacity: 0.75,
              weight: 1,
            }}
            onEachFeature={onEachFeature}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Avoid Area (Topanga)">
          <GeoJSON
            data={avoidAreaGeoJSON}
            style={{
              color: "#FF0000",
              fillColor: "#FF6666",
              fillOpacity: 0.4,
              weight: 2,
              dashArray: "5, 5",
            }}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(feature.properties.name || "Avoid Area");
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Shelters">
          <GeoJSON
            data={shelters}
            icon={startIcon}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(feature.properties.name);
            }}
          />
        </LayersControl.Overlay>

        {userReportedFires && userReportedFires.length > 0 && (
          <LayersControl.Overlay checked name="User Reported Fires">
            <GeoJSON
              key={`user-fires-${userReportedFires.length}`}
              data={{
                type: "FeatureCollection",
                features: userReportedFires
              }}
              style={{
                color: "#FF6600",
                fillColor: "#FF9900",
                fillOpacity: 0.7,
                weight: 2,
              }}
              onEachFeature={onEachUserFire}
            />
          </LayersControl.Overlay>
        )}
      </LayersControl>
    </MapContainer>
  );
};

export default LeafletMap;
