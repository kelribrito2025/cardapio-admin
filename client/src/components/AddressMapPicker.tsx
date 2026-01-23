import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

interface InitialAddressData {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | string;
  longitude?: number | string;
}

interface AddressMapPickerProps {
  initialAddress?: InitialAddressData;
  onAddressSelect: (address: AddressData) => void;
  onClose: () => void;
}

function loadMapScript() {
  return new Promise<void>((resolve) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => console.error("Failed to load Google Maps script");
    document.head.appendChild(script);
  });
}

export function AddressMapPicker({
  initialAddress,
  onAddressSelect,
  onClose,
}: AddressMapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      await loadMapScript();
      
      if (!mapContainer.current || !window.google) return;

      // Centro inicial - Brasil ou endereço fornecido
      let initialCenter = { lat: -14.235, lng: -51.9253 }; // Centro do Brasil
      let initialZoom = 4;

      if (initialAddress?.latitude && initialAddress?.longitude) {
        initialCenter = {
          lat: Number(initialAddress.latitude),
          lng: Number(initialAddress.longitude),
        };
        initialZoom = 17;
      } else if (initialAddress?.city) {
        // Tentar geocodificar o endereço inicial
        const geocoder = new google.maps.Geocoder();
        const addressString = [
          initialAddress.street,
          initialAddress.number,
          initialAddress.neighborhood,
          initialAddress.city,
          initialAddress.state,
        ].filter(Boolean).join(", ");
        
        if (addressString) {
          try {
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: addressString }, (results, status) => {
                if (status === "OK" && results) resolve(results);
                else reject(status);
              });
            });
            if (result[0]) {
              initialCenter = {
                lat: result[0].geometry.location.lat(),
                lng: result[0].geometry.location.lng(),
              };
              initialZoom = 17;
            }
          } catch (e) {
            console.log("Geocoding failed, using default center");
          }
        }
      }

      // Criar mapa
      mapRef.current = new google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        streetViewControl: false,
        mapId: "ADDRESS_PICKER_MAP",
      });

      // Criar marcador arrastável
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: initialCenter,
        gmpDraggable: true,
        title: "Arraste para ajustar a localização",
      });

      // Evento de arrastar marcador
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current?.position;
        if (position) {
          const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
          reverseGeocode(lat, lng);
        }
      });

      // Evento de clique no mapa
      mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          markerRef.current?.position && (markerRef.current.position = { lat, lng });
          reverseGeocode(lat, lng);
        }
      });

      // Configurar autocomplete
      if (searchInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: "br" },
          fields: ["address_components", "geometry", "formatted_address"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            mapRef.current?.setCenter({ lat, lng });
            mapRef.current?.setZoom(17);
            markerRef.current && (markerRef.current.position = { lat, lng });
            
            parseAddressComponents(place.address_components || [], lat, lng);
          }
        });
      }

      // Se já tem coordenadas, fazer geocode reverso
      if (initialAddress?.latitude && initialAddress?.longitude) {
        reverseGeocode(Number(initialAddress.latitude), Number(initialAddress.longitude));
      }

      setIsLoading(false);
    };

    initMap();
  }, []);

  // Geocodificação reversa
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results) resolve(results);
          else reject(status);
        });
      });

      if (result[0]) {
        parseAddressComponents(result[0].address_components, lat, lng);
      }
    } catch (e) {
      console.error("Reverse geocoding failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Parsear componentes do endereço
  const parseAddressComponents = (
    components: google.maps.GeocoderAddressComponent[],
    lat: number,
    lng: number
  ) => {
    const address: AddressData = {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      latitude: lat.toString(),
      longitude: lng.toString(),
    };

    for (const component of components) {
      const types = component.types;
      
      if (types.includes("street_number")) {
        address.number = component.long_name;
      } else if (types.includes("route")) {
        address.street = component.long_name;
      } else if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
        address.neighborhood = component.long_name;
      } else if (types.includes("administrative_area_level_2") || types.includes("locality")) {
        address.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        address.state = component.short_name;
      } else if (types.includes("postal_code")) {
        address.zipCode = component.long_name.replace("-", "");
      }
    }

    setSelectedAddress(address);
  };

  // Buscar endereço manualmente
  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: searchQuery + ", Brasil" }, (results, status) => {
          if (status === "OK" && results) resolve(results);
          else reject(status);
        });
      });

      if (result[0]) {
        const lat = result[0].geometry.location.lat();
        const lng = result[0].geometry.location.lng();
        
        mapRef.current?.setCenter({ lat, lng });
        mapRef.current?.setZoom(17);
        markerRef.current && (markerRef.current.position = { lat, lng });
        
        parseAddressComponents(result[0].address_components, lat, lng);
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-3xl mx-4 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Selecionar Localização</h2>
              <p className="text-sm text-gray-500">Clique no mapa ou busque um endereço</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full min-h-[300px]" />
          
          {/* Crosshair indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="w-8 h-8 border-2 border-red-500 rounded-full opacity-30" />
          </div>
        </div>

        {/* Selected Address Preview */}
        {selectedAddress && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {selectedAddress.street}
                  {selectedAddress.number && `, ${selectedAddress.number}`}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedAddress.neighborhood && `${selectedAddress.neighborhood}, `}
                  {selectedAddress.city}
                  {selectedAddress.state && ` - ${selectedAddress.state}`}
                  {selectedAddress.zipCode && ` • CEP: ${selectedAddress.zipCode}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Coordenadas: {selectedAddress.latitude}, {selectedAddress.longitude}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-white">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedAddress && onAddressSelect(selectedAddress)}
            disabled={!selectedAddress}
            className="bg-red-500 hover:bg-red-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}
