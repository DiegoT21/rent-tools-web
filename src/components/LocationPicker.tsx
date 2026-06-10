import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin } from "lucide-react";
import { api } from "@/lib/api";

// Fix for default marker icon in Leaflet + React


const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER: [number, number] = [8.9824, -79.5199]; // Ciudad de Panamá

interface LocationPickerProps {
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
}

// Component to handle map clicks and move the marker
function MapEvents({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Component to programmatically move the map view
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  title = "Dirección de Entrega y Devolución",
  description = "O haz clic en el mapa para ajustar la ubicación exacta.",
  searchPlaceholder = "Buscar dirección (ej. Paseo de la Reforma, CDMX)",
  onLocationSelect,
}) => {
  const [position, setPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await api.get("/geo/reverse", {
        params: { lat, lng },
      });

      const resolvedAddress = response.data?.data?.address || response.data?.address;
      if (resolvedAddress) {
        setAddress(resolvedAddress);
        setSearchQuery(resolvedAddress);
        onLocationSelect({
          address: resolvedAddress,
          lat,
          lng,
        });
        return;
      }
    } catch (error) {
      console.error("Error in backend reverse geocoding:", error);
    }

    const fallbackAddress = `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
    setAddress(fallbackAddress);
    setSearchQuery(fallbackAddress);
    onLocationSelect({
      address: fallbackAddress,
      lat,
      lng,
    });
  }, [onLocationSelect]);

  // Forward Geocoding (Search) using Nominatim
  const handleSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error in geocoding search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const newPos: [number, number] = [lat, lon];
    setPosition(newPos);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    onLocationSelect({
      address: result.display_name,
      lat,
      lng: lon
    });
  };

  const onMapClick = useCallback((latlng: L.LatLng) => {
    const newPos: [number, number] = [latlng.lat, latlng.lng];
    setPosition(newPos);
    reverseGeocode(latlng.lat, latlng.lng);
  }, [reverseGeocode]);

  return (
    <div className="space-y-4">
      <div className="relative space-y-2">
        <Label htmlFor="address-search" className="text-slate-600 font-semibold">{title}</Label>
        <div className="relative">
          <Input
            id="address-search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 3) {
                handleSearch(e.target.value);
              } else {
                setSearchResults([]);
              }
            }}
            className="bg-[#f3f4f6] border-transparent rounded-lg h-12 pl-10 focus-visible:ring-primary/20"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-[1001] w-full bg-white mt-1 rounded-lg shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
                <span className="text-sm text-slate-600 truncate">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500">
        {description}
      </div>
      <div className="text-xs text-slate-500">
        Si eliges el pin directamente, guardamos la ubicación y usamos la dirección buscada más reciente o las coordenadas como referencia.
      </div>

      <div className="relative rounded-xl overflow-hidden h-[350px] border border-slate-200 shadow-inner z-[1]">
        <MapContainer
          center={position}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={position} />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const latlng = marker.getLatLng();
                onMapClick(latlng);
              },
            }}
          />
          <MapEvents onClick={onMapClick} />
        </MapContainer>
      </div>
    </div>
  );
};
