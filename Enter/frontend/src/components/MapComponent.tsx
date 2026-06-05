'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const blueIcon = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 24 36" width="24" height="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#2563EB"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const redIcon = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 24 36" width="24" height="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#EF4444"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

interface MapComponentProps {
  salons: any[];
  userLocation: [number, number] | null;
  onMarkerClick: (slug: string) => void;
  editable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

function SetViewOnChange({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 13);
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggableMarker({ position, onDragEnd }: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDragEnd(latlng.lat, latlng.lng);
      }
    },
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
    />
  );
}

function DirectionsBtn({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-2 w-full block text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors">
      Get Directions
    </a>
  );
}

export default function MapComponent({ salons, userLocation, onMarkerClick, editable, onLocationChange }: MapComponentProps) {
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (editable && onLocationChange) {
      onLocationChange(lat, lng);
    }
  }, [editable, onLocationChange]);

  const handleDragEnd = useCallback((lat: number, lng: number) => {
    if (editable && onLocationChange) {
      onLocationChange(lat, lng);
    }
  }, [editable, onLocationChange]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[#D4AF37]/20 relative z-0">
      <MapContainer
        center={userLocation || defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {editable && <MapClickHandler onClick={handleMapClick} />}

        {userLocation && !editable && (
          <Marker position={userLocation} icon={redIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {userLocation && editable && (
          <DraggableMarker position={userLocation} onDragEnd={handleDragEnd} />
        )}

        {salons.map((salon) => (
          <Marker
            key={salon.id || salon._id}
            position={[salon.lat, salon.lng]}
            icon={blueIcon}
            eventHandlers={{
              click: () => onMarkerClick(salon.slug),
            }}
          >
            <Popup>
              <div className="text-[#0D0D0D] font-medium p-1 min-w-[160px]">
                <h3 className="font-bold text-sm mb-1">{salon.name}</h3>
                <p className="text-xs text-[#64748B]">{salon.address}</p>
                <div className="text-xs text-[#666] mt-1 flex items-center justify-between">
                  <span>⭐ {salon.rating || 'N/A'}</span>
                  {salon.shopNumber && <span className="font-mono text-[#94A3B8]">#{salon.shopNumber}</span>}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={(e) => { e.preventDefault(); onMarkerClick(salon.slug); }}
                    className="flex-1 text-center text-xs font-semibold py-1.5 px-2 rounded-lg bg-[#D4AF37] text-white hover:bg-[#C09A2E] transition-colors">
                    View & Book
                  </button>
                  {salon.lat && salon.lng && <DirectionsBtn lat={salon.lat} lng={salon.lng} label={salon.name} />}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && <SetViewOnChange coords={userLocation} />}
      </MapContainer>
    </div>
  );
}