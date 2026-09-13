import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Search, Loader2, ExternalLink } from 'lucide-react';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  address?: string;
  isEditable?: boolean;
  onLocationChange?: (lat: number, lng: number, address?: string) => void;
  height?: string;
  allMarkers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    status: string;
    color: string;
    contactPerson: string;
    price: number;
  }>;
  onMarkerClick?: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  address,
  isEditable = false,
  onLocationChange,
  height = '320px',
  allMarkers,
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Initialize or re-center Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = lat || 13.7563;
      const initialLng = lng || 100.5018;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Custom Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="background-color: #0284C7; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
            <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">📍</div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      if (!allMarkers) {
        const marker = L.marker([initialLat, initialLng], {
          draggable: isEditable,
          icon: customIcon,
        }).addTo(map);

        markerRef.current = marker;

        if (isEditable) {
          marker.on('dragend', async () => {
            const position = marker.getLatLng();
            reverseGeocode(position.lat, position.lng);
          });

          map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
          });
        }
      }
    } else {
      // Re-center when lat/lng props change
      if (lat && lng && !allMarkers) {
        mapInstanceRef.current.setView([lat, lng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    }

    return () => {
      // Keep map reference stable or cleanup on unmount
    };
  }, []);

  // Handle allMarkers update for overview mode
  useEffect(() => {
    if (!mapInstanceRef.current || !allMarkers) return;

    if (!markersGroupRef.current) {
      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    } else {
      markersGroupRef.current.clearLayers();
    }

    const bounds = L.latLngBounds([]);

    allMarkers.forEach((item) => {
      const pinHtml = `
        <div style="background-color: ${item.color || '#3B82F6'}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid white; cursor: pointer;">
          <div style="transform: rotate(45deg); color: white; font-size: 12px; font-weight: bold;">🏢</div>
        </div>
      `;
      const icon = L.divIcon({
        className: 'marker-pin',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(markersGroupRef.current!);
      bounds.extend([item.lat, item.lng]);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      popupContent.innerHTML = `
        <p class="font-bold text-slate-800 text-sm mb-1">${item.title}</p>
        <p class="text-xs text-slate-600 mb-1">👤 ${item.contactPerson}</p>
        <p class="text-xs font-semibold text-emerald-600 mb-2">฿${item.price.toLocaleString()}</p>
        <div class="flex gap-1.5">
          <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer" 
             class="text-xs bg-sky-600 text-white px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-sky-700">
             Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(item.id);
      });
    });

    if (allMarkers.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [allMarkers]);

  // Reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (newLat: number, newLng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1&accept-language=th`,
        { headers: { 'User-Agent': 'JobTrackerPro/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const displayAddress = data.display_name || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`;
        if (onLocationChange) {
          onLocationChange(newLat, newLng, displayAddress);
        }
      } else {
        if (onLocationChange) onLocationChange(newLat, newLng);
      }
    } catch {
      if (onLocationChange) onLocationChange(newLat, newLng);
    }
  };

  // GPS Current Location Detection
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        setIsGettingGps(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([currentLat, currentLng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
        }

        reverseGeocode(currentLat, currentLng);
      },
      (err) => {
        setIsGettingGps(false);
        console.error(err);
        setGpsError('ไม่สามารถดึงพิกัด GPS ได้ กรุณาเปิดสิทธิ์ Location หรือเลือกตำแหน่งบนแผนที่แทน');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address/Location
  const handleSearchLocation = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGpsError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ' Thailand'
        )}&limit=1&accept-language=th`,
        { headers: { 'User-Agent': 'JobTrackerPro/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([foundLat, foundLng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([foundLat, foundLng]);
        }
        if (onLocationChange) {
          onLocationChange(foundLat, foundLng, data[0].display_name);
        }
      } else {
        setGpsError(`ไม่พบสถานที่ "${searchQuery}" กรุณาลองระบุชื่อสถานที่/ถนนให้ชัดเจนขึ้น หรือเลื่อนหมุดบนแผนที่`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setGpsError('เกิดข้อผิดพลาดในการเชื่อมต่อค้นหาสถานที่ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${lat || 13.7563},${lng || 100.5018}`;

  return (
    <div className="relative w-full flex flex-col gap-2">
      {isEditable && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search bar (using div and onKeyDown to prevent nested form submissions) */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (gpsError) setGpsError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchLocation(e);
                }
              }}
              placeholder="ค้นหาชื่อสถานที่ / ถนน / เขต / ซอย..."
              className="w-full text-xs sm:text-sm pl-8 pr-16 py-2 border border-slate-300 rounded-lg bg-white shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            <button
              type="button"
              onClick={(e) => handleSearchLocation(e)}
              disabled={isSearching}
              className="absolute right-1 px-2.5 py-1 text-xs bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-1"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'ค้นหา'}
            </button>
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingGps}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-xs active:scale-95 shrink-0"
          >
            {isGettingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังจับพิกัด GPS...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>พิกัด GPS ปัจจุบัน</span>
              </>
            )}
          </button>
        </div>
      )}

      {gpsError && (
        <div className="text-xs bg-amber-50 text-amber-800 p-2 rounded-md border border-amber-200">
          ⚠️ {gpsError}
        </div>
      )}

      {/* Map Container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Google Maps direct link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-[400] flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white/95 text-slate-700 hover:text-sky-700 rounded-md shadow-md border border-slate-200 hover:bg-white backdrop-blur-xs transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
          <span>เปิดใน Google Maps</span>
        </a>

        {isEditable && (
          <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] text-slate-600 shadow-xs border border-slate-200">
            💡 คลิกหรือลากหมุดบนแผนที่เพื่อเปลี่ยนตำแหน่ง
          </div>
        )}
      </div>

      {/* Coordinates status badge */}
      {lat && lng && (
        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">
              {address ? address : `พิกัด: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </span>
          </div>
          <span className="font-mono text-[11px] shrink-0 text-slate-600">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
