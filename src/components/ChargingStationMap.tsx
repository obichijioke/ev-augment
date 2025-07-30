'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Star, Clock, Zap, Navigation, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ChargingStation {
  id: number;
  name: string;
  network: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  distance: number;
  rating: number;
  reviews: number;
  isOpen: boolean;
  hours: string;
  phone: string;
  website: string;
  image: string;
  connectors: Array<{
    type: string;
    count: number;
    power: number;
    available: number;
    pricing: string;
  }>;
  amenities: string[];
  lastUpdated: string;
  lat?: number;
  lng?: number;
}

interface ChargingStationMapProps {
  stations: ChargingStation[];
  selectedStation?: ChargingStation | null;
  onStationSelect?: (station: ChargingStation) => void;
}

// Component to handle map events and updates
function MapController({ stations, selectedStation }: { stations: ChargingStation[], selectedStation?: ChargingStation | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation && selectedStation.lat && selectedStation.lng) {
      map.setView([selectedStation.lat, selectedStation.lng], 15);
    } else if (stations.length > 0) {
      // Fit map to show all stations
      const validStations = stations.filter(s => s.lat && s.lng);
      if (validStations.length > 0) {
        const bounds = L.latLngBounds(validStations.map(s => [s.lat!, s.lng!]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, stations, selectedStation]);

  return null;
}

// Custom marker icons for different networks
const createCustomIcon = (network: string, isOpen: boolean) => {
  const color = isOpen ? getNetworkColor(network) : '#6B7280';
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        font-weight: bold;
      ">
        ⚡
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getNetworkColor = (network: string) => {
  switch (network) {
    case 'Tesla':
      return '#DC2626';
    case 'Electrify America':
      return '#2563EB';
    case 'ChargePoint':
      return '#059669';
    case 'EVgo':
      return '#7C3AED';
    case 'Blink':
      return '#D97706';
    default:
      return '#6B7280';
  }
};

const getConnectorIcon = (type: string) => {
  switch (type) {
    case 'Tesla Supercharger':
      return '🔌';
    case 'CCS':
      return '⚡';
    case 'CHAdeMO':
      return '🔋';
    case 'J1772':
      return '🔌';
    default:
      return '⚡';
  }
};

const ChargingStationMap: React.FC<ChargingStationMapProps> = ({ 
  stations, 
  selectedStation, 
  onStationSelect 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add mock coordinates to stations (in a real app, these would come from the API)
  const stationsWithCoords = stations.map((station, index) => ({
    ...station,
    lat: 37.7749 + (index * 0.01) - 0.02, // San Francisco area coordinates
    lng: -122.4194 + (index * 0.01) - 0.02
  }));

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading Map...</h3>
            <p>Please wait while the map loads.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-96 lg:h-[600px] relative">
        <MapContainer
          center={[37.7749, -122.4194]} // San Francisco
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController stations={stationsWithCoords} selectedStation={selectedStation} />
          
          {stationsWithCoords.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat!, station.lng!]}
              icon={createCustomIcon(station.network, station.isOpen)}
              eventHandlers={{
                click: () => {
                  onStationSelect?.(station);
                }
              }}
            >
              <Popup className="custom-popup" maxWidth={400}>
                <div className="p-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{station.name}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          station.network === 'Tesla' ? 'bg-red-100 text-red-800' :
                          station.network === 'Electrify America' ? 'bg-blue-100 text-blue-800' :
                          station.network === 'ChargePoint' ? 'bg-green-100 text-green-800' :
                          station.network === 'EVgo' ? 'bg-purple-100 text-purple-800' :
                          station.network === 'Blink' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {station.network}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          station.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {station.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{station.address}, {station.city}, {station.state}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{station.hours}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        <span>{station.rating} ({station.reviews})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Connectors</h4>
                    <div className="space-y-1">
                      {station.connectors.map((connector, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <span>{getConnectorIcon(connector.type)}</span>
                            <span>{connector.type}</span>
                            <span className="text-gray-500">({connector.power}kW)</span>
                          </div>
                          <span className={connector.available > 0 ? 'text-green-600' : 'text-red-600'}>
                            {connector.available}/{connector.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Navigation className="h-4 w-4 mr-1" />
                      Navigate
                    </button>
                    <Link 
                      href={`/charging/${station.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Map Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Busy/Closed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <span>Unknown</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Showing {stationsWithCoords.length} charging stations
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChargingStationMap;