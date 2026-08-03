import React, { useEffect, useRef } from 'react';
import { CrmLocationSalesDb } from '../../utils/types';

interface LeafletMapProps {
  locations: CrmLocationSalesDb[];
  selectedLocationId?: number | null;
  onSelectLocation?: (id: number) => void;
  height?: string;
  theme?: 'dark' | 'light';
}

declare const L: any; // Leaflet is rendered via globally injected CDN script tag

export default function LeafletMap({
  locations,
  selectedLocationId,
  onSelectLocation,
  height = '350px',
  theme = 'dark',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    // If Leaflet is not yet loaded on window, wait a second and retry
    if (typeof L === 'undefined') {
      const timer = setTimeout(() => {
        // trigger state or component refresh if needed, usually CDN is fast
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!mapContainerRef.current) return;

    // 1. Recycle/Initialize Leaflet Map
    if (!mapInstanceRef.current) {
      // Set initial coordinate over Bandung/Java
      const defaultCenter = [-6.9147, 107.6098];
      const defaultZoom = 12;

      try {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Add sleek map theme based on outer context
        const tileUrl = theme === 'dark' 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributions &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20
        }).addTo(mapInstanceRef.current);
      } catch (e) {
        console.error("Leaflet init error: ", e);
      }
    } else {
      // If layout or theme changes, update tile layer
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ...',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 2. Clear old markers and old polylines
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // 3. Render locations
    if (locations && locations.length > 0) {
      const latlngs: any[] = [];
      
      // Parse, filter valid coordinates, and sort chronologically by check-in time
      const validVisits = [...locations]
        .filter(loc => loc.latitude && loc.longitude)
        .sort((a, b) => {
          const tA = a.timestamp_checkin || '';
          const tB = b.timestamp_checkin || '';
          return tA.localeCompare(tB);
        });

      // Assemble pins & polyline coordinates
      validVisits.forEach((loc, index) => {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const currentLatLng = [lat, lng];
        latlngs.push(currentLatLng);

        // Sequence Number Index starts at 1
        const sequenceNum = index + 1;
        const isSelected = selectedLocationId === loc.id;

        // Custom HTML Marker matching styled circular badge
        const numberMarkerHtml = `
          <div class="relative flex items-center justify-center">
            <!-- Pulsing outer ring -->
            <div class="absolute w-8 h-8 rounded-full ${isSelected ? 'bg-red-500/40 animate-ping' : 'bg-blue-500/20'}" style="animation-duration: 2s"></div>
            <!-- Inner colored ball with sequence number -->
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border-2 text-white shadow-md z-10 transition-transform ${
              isSelected 
                ? 'bg-red-500 border-white scale-125' 
                : 'bg-gradient-to-tr from-blue-600 to-sky-500 border-blue-100 hover:scale-110'
            }">
              ${sequenceNum}
            </div>
            <!-- Pin Pointer Tail -->
            <div class="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 ${isSelected ? 'bg-red-500' : 'bg-sky-500'} border-r border-b border-white z-0"></div>
          </div>
        `;

        const numIcon = L.divIcon({
          html: numberMarkerHtml,
          className: 'custom-leaflet-sequence-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14]
        });

        const checkinShort = loc.timestamp_checkin ? loc.timestamp_checkin.split(' ')[1].substring(0, 5) : '--';
        const checkoutShort = loc.timestamp_checkout ? loc.timestamp_checkout.split(' ')[1].substring(0, 5) : 'Belum';

        const popupContent = `
          <div class="text-slate-800 p-1 font-sans text-xs min-w-[210px]">
            <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
              <span class="bg-blue-100 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Stop ${sequenceNum}</span>
              <span class="text-[9.5px] font-bold text-slate-500">📍 ${checkinShort} - ${checkoutShort}</span>
            </div>
            <h6 class="font-extrabold text-sm text-slate-900 leading-snug">${loc.name_store || 'Unknown'}</h6>
            <p class="text-[10px] text-slate-500 mt-1 mb-1.5 leading-normal max-w-[220px]">${loc.address_store || '-'}</p>
            <div class="bg-slate-50 border border-slate-100 p-2 rounded text-[10px] text-slate-600 leading-snug">
              <div class="mb-1"><b>Tujuan:</b> ${loc.purpose || '-'}</div>
              <div><b>Hasil:</b> ${loc.result || 'Kunjungan Sedang Berlangsung'}</div>
            </div>
          </div>
        `;

        const marker = L.marker(currentLatLng, { icon: numIcon }).addTo(map);
        marker.bindPopup(popupContent);
        
        // Listen to marker click to update selection state
        marker.on('click', () => {
          if (onSelectLocation) {
            onSelectLocation(loc.id);
          }
        });

        markersRef.current[loc.id.toString()] = marker;
      });

      // 4. Trace the Route path using Polyline connecting visits
      if (latlngs.length > 1) {
        polylineRef.current = L.polyline(latlngs, {
          color: theme === 'dark' ? '#38bdf8' : '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
          lineJoin: 'round'
        }).addTo(map);
      }

      // 5. Fit map bounds to encompass all path elements
      try {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (e) {
        // safe bounds crash recovery
      }
    }

    // Force redraw on DOM assembly
    const redrawTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(redrawTimer);
  }, [locations, theme, selectedLocationId, L]);

  // Handle zooming when selection is changed externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocationId || locations.length === 0) return;

    const focusedLoc = locations.find(l => l.id === selectedLocationId);
    if (focusedLoc && focusedLoc.latitude && focusedLoc.longitude) {
      const lat = parseFloat(focusedLoc.latitude);
      const lng = parseFloat(focusedLoc.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 15, { animate: true, duration: 1 });
        
        // Open popup with slight delayed offset to allow pan transitions
        setTimeout(() => {
          const marker = markersRef.current[selectedLocationId.toString()];
          if (marker) {
            marker.openPopup();
          }
        }, 150);
      }
    }
  }, [selectedLocationId]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900" style={{ height }}>
      {typeof L === 'undefined' ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-bold font-mono">MEMUAT LEAFLET ENGINE CDN...</p>
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      )}
      
      {/* Visual Marker Guide Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 py-1.5 px-2.5 rounded-xl z-20 flex flex-col space-y-1 shadow-md pointer-events-none">
        <div className="flex items-center space-x-1.5 font-semibold">
          <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
          <span>Rangkaian Kunjungan Sales</span>
        </div>
        <div className="text-[8.5px] text-slate-400 font-mono tracking-tight">Koneksi Urutan Sign-In Lapangan</div>
      </div>
    </div>
  );
}
