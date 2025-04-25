import { useEffect, useRef } from 'react';
import { LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
  const groupRef = useRef();
  const heatRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (!points || !groupRef.current) return;

    const heat = L.heatLayer([], {
      radius: 20,
      blur: 15,
      minOpacity: 0.6,
      gradient: {
        0.0: 'blue',
        1.0: 'red',
      },
    });

    heatRef.current = heat;
    groupRef.current.addLayer(heat);

    const updateZoomStyle = () => {
      const zoom = map.getZoom();

      // ⬇️ Downsample more at low zoom
      const factor = zoom < 7 ? 30 : zoom < 9 ? 3 : 1;
      const visiblePoints = points.filter((_, i) => i % factor === 0);

      // 🎛️ Zoom-responsive style
      const minOpacity = zoom < 7 ? 0.15 : Math.min(1.0, (zoom - 6) / 7);     // 0.05–1
      const radius = zoom < 7 ? 4 : Math.min(30, zoom * 2);                   // 4–26
      const blur = zoom < 7 ? 30 : zoom < 10 ? 20 : 10;                       // 30→20→10

      // Refresh the layer
      heat.setLatLngs([]);
      heat.setLatLngs(visiblePoints);
      heat.setOptions({ radius, minOpacity, blur });
    };

    map.on('zoomend', updateZoomStyle);
    updateZoomStyle();

    return () => {
      map.off('zoomend', updateZoomStyle);
      if (groupRef.current) groupRef.current.clearLayers();
    };
  }, [points, map]);

  return <LayerGroup ref={groupRef} />;
};

export default HeatmapLayer;
