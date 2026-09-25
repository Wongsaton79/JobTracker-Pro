import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Compass, Loader2, ExternalLink, ShieldCheck, AlertTriangle, Search } from 'lucide-react';

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
  allowRetrospective?: boolean;
  defaultFreeMode?: boolean;
}

// 📐 Haversine Formula for distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔒 Clamp a coordinate so it does not exceed maxRadiusKm from center
function clampToRadius(
  centerLat: number,
  centerLng: number,
  targetLat: number,
  targetLng: number,
  maxRadiusKm: number
): { lat: number; lng: number; wasClamped: boolean; distanceKm: number } {
  const distance = calculateDistanceKm(centerLat, centerLng, targetLat, targetLng);
  if (distance <= maxRadiusKm) {
    return { lat: targetLat, lng: targetLng, wasClamped: false, distanceKm: distance };
  }

  // Constrain along vector from center to target
  const ratio = maxRadiusKm / distance;
  const clampedLat = centerLat + (targetLat - centerLat) * ratio;
  const clampedLng = centerLng + (targetLng - centerLng) * ratio;
  return { lat: clampedLat, lng: clampedLng, wasClamped: true, distanceKm: maxRadiusKm };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  address,
  isEditable = false,
  onLocationChange,
  height = '300px',
  allMarkers,
  onMarkerClick,
  allowRetrospective = true,
  defaultFreeMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const gpsCenterMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [radiusWarning, setRadiusWarning] = useState<string | null>(null);
  const [isFreeMode, setIsFreeMode] = useState<boolean>(defaultFreeMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const MAX_RADIUS_KM = 5.0; // 5 Kilometers limit

  // Reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(
    async (newLat: number, newLng: number) => {
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
    },
    [onLocationChange]
  );

  // Update visual 5km Circle on Leaflet map
  const updateRadiusCircle = useCallback((centerLat: number, centerLng: number) => {
    if (!mapInstanceRef.current) return;

    // Remove old circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    if (gpsCenterMarkerRef.current) {
      gpsCenterMarkerRef.current.remove();
    }

    // 1. Draw 5km radius boundary circle
    const circle = L.circle([centerLat, centerLng], {
      radius: MAX_RADIUS_KM * 1000, // 5000 meters
      color: '#0284C7',
      weight: 2,
      opacity: 0.8,
      fillColor: '#38BDF8',
      fillOpacity: 0.1,
      dashArray: '6, 6',
    }).addTo(mapInstanceRef.current);

    radiusCircleRef.current = circle;

    // 2. Center dot for Current Device GPS
    const gpsCenterIcon = L.divIcon({
      className: 'gps-center-icon',
      html: `
        <div style="background-color: #0284C7; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.4);">
        </div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const gpsMarker = L.marker([centerLat, centerLng], {
      icon: gpsCenterIcon,
      interactive: false,
    }).addTo(mapInstanceRef.current);

    gpsCenterMarkerRef.current = gpsMarker;
  }, []);

  // Fetch Current Device GPS
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);
    setRadiusWarning(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        setIsGettingGps(false);
        setDeviceGps({ lat: currentLat, lng: currentLng });
        setCurrentDistance(0);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([currentLat, currentLng], 15);
          updateRadiusCircle(currentLat, currentLng);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
        }

        reverseGeocode(currentLat, currentLng);
      },
      (err) => {
        setIsGettingGps(false);
        console.warn('GPS location error:', err);
        setGpsError(
          'ไม่สามารถดึงพิกัด GPS ได้ กรุณาอนุญาตสิทธิ์ Location (ตำแหน่งที่ตั้ง) บนเบราว์เซอร์ของคุณ'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [reverseGeocode, updateRadiusCircle]);

  // Initialize Map
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

      // Custom Job Pin Icon
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
          // Handle Pin Dragging with 5km Radius Clamp
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            applyLocationWithRadiusCheck(pos.lat, pos.lng);
          });

          // Handle Map Clicking with 5km Radius Clamp
          map.on('click', (e: L.LeafletMouseEvent) => {
            applyLocationWithRadiusCheck(e.latlng.lat, e.latlng.lng);
          });
        }
      }
    }

    // Auto trigger GPS on editable mode if not yet set
    if (isEditable && !deviceGps) {
      handleGetCurrentLocation();
    }
  }, []);

  // Check distance and clamp if beyond 5km (unless in free/retrospective mode)
  const applyLocationWithRadiusCheck = (targetLat: number, targetLng: number) => {
    let finalLat = targetLat;
    let finalLng = targetLng;

    if (!isFreeMode && deviceGps) {
      const clampResult = clampToRadius(
        deviceGps.lat,
        deviceGps.lng,
        targetLat,
        targetLng,
        MAX_RADIUS_KM
      );

      finalLat = clampResult.lat;
      finalLng = clampResult.lng;
      setCurrentDistance(clampResult.distanceKm);

      if (clampResult.wasClamped) {
        setRadiusWarning(
          `⚠️ ปักหมุดอยู่นอกรัศมี 5 กม. ระบบจำกัดหมุดให้อยู่ในขอบเขต 5.0 กม. จากพิกัด GPS อุปกรณ์ (หากเป็นการลงข้อมูลย้อนหลัง สามารถสลับไปใช้แท็บ "บันทึกย้อนหลัง (ปักหมุดอิสระ)")`
        );
      } else {
        setRadiusWarning(null);
      }
    } else {
      setCurrentDistance(null);
      setRadiusWarning(null);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([finalLat, finalLng]);
    }
    reverseGeocode(finalLat, finalLng);
  };

  // Place Search (Nominatim OpenStreetMap)
  const handleSearchPlace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGpsError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=th&limit=1`,
        { headers: { 'User-Agent': 'JobTrackerPro/1.0' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newLat, newLng], 15);
          }
          applyLocationWithRadiusCheck(newLat, newLng);
        } else {
          setGpsError(`ไม่พบสถานที่ "${searchQuery}" กรุณาระบุชื่ออำเภอหรือจังหวัดเพิ่มเติม`);
        }
      }
    } catch (err) {
      console.warn('Place search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Re-render allMarkers overview if provided
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
  }, [allMarkers, onMarkerClick]);

  const googleMapsUrl = `https://www.google.com/maps?q=${lat || 13.7563},${lng || 100.5018}`;

  return (
    <div className="relative w-full flex flex-col gap-2">
      {/* Location Toolbar for Editable Mode */}
      {isEditable && (
        <div className="flex flex-col rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/80 dark:bg-slate-800/90 overflow-hidden">
          {/* Mode Switch Tabs: Onsite GPS 5KM vs Retrospective Free Pin */}
          {allowRetrospective && (
            <div className="flex border-b border-sky-200 dark:border-slate-700 bg-sky-100/60 dark:bg-slate-900/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsFreeMode(false);
                  if (deviceGps) updateRadiusCircle(deviceGps.lat, deviceGps.lng);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isFreeMode
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>📍 เช็คอินหน้างานสด (GPS 5 กม.)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFreeMode(true);
                  if (radiusCircleRef.current) radiusCircleRef.current.remove();
                  if (gpsCenterMarkerRef.current) gpsCenterMarkerRef.current.remove();
                  setRadiusWarning(null);
                  setCurrentDistance(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFreeMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>📝 บันทึกข้อมูลย้อนหลัง (ปักหมุดอิสระทุกที่)</span>
              </button>
            </div>
          )}

          <div className="p-2.5 space-y-2">
            {!isFreeMode ? (
              // Mode A: Onsite GPS Mode
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        ระบุพิกัดจาก GPS อุปกรณ์ปัจจุบัน
                      </span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded-full font-medium">
                        จำกัดรัศมีไม่เกิน 5 กม.
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {deviceGps ? (
                        currentDistance !== null ? (
                          <span className="text-sky-700 dark:text-sky-400 font-semibold">
                            📍 ระยะห่างจาก GPS ของคุณ: {currentDistance.toFixed(2)} กม. (สูงสุด 5.0 กม.)
                          </span>
                        ) : (
                          'พร้อมจับพิกัดแล้ว • สามารถลากหมุดปรับตำแหน่งในวง 5 กม. ได้'
                        )
                      ) : (
                        'กดปุ่มด้านขวาเพื่อดึงพิกัด GPS อัตโนมัติ'
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingGps}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                >
                  {isGettingGps ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังดึงพิกัด GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>🎯 อัพเดทพิกัด GPS ตอนนี้</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Mode B: Retrospective Free Mode
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>โหมดบันทึกย้อนหลัง: สามารถคลิกบนแผนที่หรือลากหมุดไปที่ไหนก็ได้ตามต้องการ</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    ปักหมุดอิสระ
                  </span>
                </div>

                {/* Quick place search */}
                <form onSubmit={handleSearchPlace} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="พิมพ์ค้นหาชื่ออำเภอ ตำบล หรือสถานที่ เช่น เชียงเงิน ตาก หรือ แม่ท้อ..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>ค้นหา</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Radius 5KM Warning Alert */}
      {radiusWarning && (
        <div className="text-xs bg-rose-50 text-rose-800 p-2 rounded-lg border border-rose-200 flex items-center gap-2 animate-fade-in font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{radiusWarning}</span>
        </div>
      )}

      {/* Map Canvas */}
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
          <div className="absolute top-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            {isFreeMode ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>📝 ปักหมุดอิสระทุกที่ (โหมดบันทึกย้อนหลัง)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>วงกลมเส้นประสีฟ้า = รัศมี 5 กม. จาก GPS สด</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Coordinates status badge */}
      {lat && lng && (
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate font-medium">
              {address ? address : `พิกัด: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </span>
          </div>
          <span className="font-mono text-[11px] shrink-0 text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 ml-2">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
