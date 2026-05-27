import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Navigation, Satellite, Map } from "lucide-react";

interface PropertyMapPickerLeafletProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

/**
 * Interactive map component for property location selection using Leaflet
 * 
 * This component provides:
 * - Draggable marker for precise location selection
 * - Satellite and street map layers
 * - Current location button
 * - Manual coordinate input as fallback
 * - High accuracy for field appraisals (addressing GPS margin of error)
 */
export function PropertyMapPickerLeaflet({
  initialLat = -0.1807,
  initialLng = -78.4678,
  onLocationChange,
}: PropertyMapPickerLeafletProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [loading, setLoading] = useState(true);
  const [mapLayer, setMapLayer] = useState<"street" | "satellite">("satellite");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    let leaflet: any;
    let map: any;
    let marker: any;
    let streetLayer: any;
    let satelliteLayer: any;

    const initMap = async () => {
      try {
        // Import Leaflet dynamically
        leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        // Fix Leaflet default marker icon issue
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (!containerRef.current) return;

        // Initialize map
        map = leaflet.map(containerRef.current, {
          center: [lat, lng],
          zoom: 17,
          zoomControl: true,
        });

        // Street map layer (OpenStreetMap)
        streetLayer = leaflet.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }
        );

        // Satellite layer (Esri World Imagery)
        satelliteLayer = leaflet.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: '© Esri',
            maxZoom: 19,
          }
        );

        // Add initial layer
        satelliteLayer.addTo(map);

        // Create draggable marker
        marker = leaflet.marker([lat, lng], {
          draggable: true,
        }).addTo(map);

        // Update position on drag
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          setLat(position.lat);
          setLng(position.lng);
          onLocationChange(position.lat, position.lng);
        });

        // Update position on map click
        map.on("click", (e: any) => {
          const { lat: newLat, lng: newLng } = e.latlng;
          marker.setLatLng([newLat, newLng]);
          setLat(newLat);
          setLng(newLng);
          onLocationChange(newLat, newLng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setLoading(false);
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng]);
    }
  }, [lat, lng]);

  // Toggle map layer
  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      const leaflet = await import("leaflet");
      
      const streetLayer = leaflet.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }
      );

      const satelliteLayer = leaflet.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '© Esri',
          maxZoom: 19,
        }
      );

      // Remove all layers
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof leaflet.TileLayer) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Add selected layer
      if (mapLayer === "satellite") {
        satelliteLayer.addTo(mapRef.current);
      } else {
        streetLayer.addTo(mapRef.current);
      }
    };

    loadLeaflet();
  }, [mapLayer]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          onLocationChange(newLat, newLng);
          
          if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            mapRef.current.setView([newLat, newLng], 17);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  const handleManualCoordinateChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    onLocationChange(newLat, newLng);
    
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapRef.current.setView([newLat, newLng]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Ubicación en el Mapa
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMapLayer(mapLayer === "satellite" ? "street" : "satellite")}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            {mapLayer === "satellite" ? (
              <>
                <Map className="w-4 h-4" />
                <span>Calles</span>
              </>
            ) : (
              <>
                <Satellite className="w-4 h-4" />
                <span>Satélite</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-50"
          >
            <Navigation className="w-4 h-4" />
            <span>Mi Ubicación</span>
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="h-96 w-full" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 mb-2">
          <strong>Instrucciones:</strong> Haga clic en el mapa o arrastre el marcador para ajustar la ubicación exacta.
          Use la vista satelital para mayor precisión en la identificación del predio.
        </p>
        <p className="text-xs text-blue-700">
          <strong>Normativa SBS:</strong> La ubicación GPS precisa es crítica para el avalúo. Ajuste manualmente el pin
          sobre la imagen satelital para compensar el margen de error del GPS del dispositivo móvil.
        </p>
      </div>

      {/* Manual coordinate inputs as fallback */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitud
          </label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => handleManualCoordinateChange(parseFloat(e.target.value) || 0, lng)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitud
          </label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => handleManualCoordinateChange(lat, parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
