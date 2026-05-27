import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface PropertyMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

/**
 * Interactive map component for property location selection
 * 
 * TODO: Full implementation with react-leaflet
 * 
 * To implement with react-leaflet:
 * 1. Install: npm install react-leaflet leaflet
 * 2. Install types: npm install -D @types/leaflet
 * 3. Add Leaflet CSS to index.html: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
 * 
 * Example implementation:
 * 
 * import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
 * import L from 'leaflet';
 * import 'leaflet/dist/leaflet.css';
 * 
 * // Fix Leaflet default marker icon issue
 * delete (L.Icon.Default.prototype as any)._getIconUrl;
 * L.Icon.Default.mergeOptions({
 *   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
 *   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
 *   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
 * });
 * 
 * function DraggableMarker({ position, onPositionChange }: any) {
 *   const markerRef = useRef<any>(null);
 *   
 *   const eventHandlers = {
 *     dragend() {
 *       const marker = markerRef.current;
 *       if (marker != null) {
 *         const newPos = marker.getLatLng();
 *         onPositionChange(newPos.lat, newPos.lng);
 *       }
 *     },
 *   };
 *   
 *   return (
 *     <Marker
 *       draggable={true}
 *       eventHandlers={eventHandlers}
 *       position={position}
 *       ref={markerRef}
 *     />
 *   );
 * }
 * 
 * Then use in component:
 * <MapContainer center={[lat, lng]} zoom={15} style={{ height: '400px', width: '100%' }}>
 *   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *   <DraggableMarker position={[lat, lng]} onPositionChange={onLocationChange} />
 * </MapContainer>
 */

export function PropertyMapPicker({
  initialLat = -0.1807,
  initialLng = -78.4678,
  onLocationChange,
}: PropertyMapPickerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate map loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    onLocationChange(lat, lng);
  }, [lat, lng, onLocationChange]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Ubicación en el Mapa
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <MapPin className="w-4 h-4" />
          <span>Usar mi ubicación</span>
        </button>
      </div>

      {/* Placeholder for map - will be replaced with react-leaflet */}
      <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
            <div className="text-center p-6">
              <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mapa Interactivo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Próximamente: Arrastre el pin para seleccionar la ubicación exacta
              </p>
              <div className="bg-white rounded-lg p-4 shadow-sm inline-block">
                <p className="text-xs text-gray-500 mb-2">Ubicación actual:</p>
                <p className="text-sm font-mono">
                  <strong>Lat:</strong> {lat.toFixed(6)}
                  <br />
                  <strong>Lng:</strong> {lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}
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
            onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Implementación pendiente:</strong> Este componente será actualizado con react-leaflet
          para proporcionar un mapa interactivo completo con OpenStreetMap. Por ahora, puede usar los
          campos manuales o el botón "Usar mi ubicación" para capturar coordenadas GPS.
        </p>
      </div>
    </div>
  );
}
