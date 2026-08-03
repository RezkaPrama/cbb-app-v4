import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// npx expo install react-native-webview

interface VisitLocation {
  id: number;
  latitude: string | number;
  longitude: string | number;
  name_store: string;
  address_store?: string | null;
  purpose?: string | null;
  result?: string | null;
  timestamp_checkin?: string | null;
  timestamp_checkout?: string | null;
}

interface LeafletMapViewProps {
  locations: VisitLocation[];
  selectedLocationId?: number | null;
  onSelectLocation?: (id: number) => void;
  height?: number | string;
  theme?: 'dark' | 'light';
}

// Format timestamp ke waktu Indonesia (WIB/WITA/WIT)
// Ganti timeZone sesuai kebutuhan:
//   WIB  → 'Asia/Jakarta'
//   WITA → 'Asia/Makassar'
//   WIT  → 'Asia/Jayapura'
function formatWaktuIndonesia(
  ts: string | null | undefined,
  fallback: string = '--',
): string {
  if (!ts) return fallback;
  const match = ts.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : fallback;
}

function buildHtml(locations: VisitLocation[], theme: 'dark' | 'light'): string {
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const markerColor = theme === 'dark' ? '#38bdf8' : '#2563eb';

  const validLocations = locations
    .filter((loc) => loc.latitude && loc.longitude)
    .map((loc) => ({
      id: loc.id,
      lat: parseFloat(loc.latitude as string),
      lng: parseFloat(loc.longitude as string),
      name_store: loc.name_store || 'Toko',
      address_store: loc.address_store || '-',
      purpose: loc.purpose || '-',
      result: loc.result || 'Kunjungan sedang berlangsung',
      checkin: formatWaktuIndonesia(loc.timestamp_checkin),
      checkout: loc.timestamp_checkout
        ? formatWaktuIndonesia(loc.timestamp_checkout)
        : 'Belum',
    }))
    .filter((loc) => !isNaN(loc.lat) && !isNaN(loc.lng))
    .sort((a, b) => (a.checkin ?? '--').localeCompare(b.checkin ?? '--'));

  const locationsJson = JSON.stringify(validLocations);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${theme === 'dark' ? '#0f172a' : '#f1f5f9'}; }
    .seq-marker { position: relative; width: 26px; height: 26px; }
    .seq-ring {
      position: absolute; top: 1px; left: 1px; width: 24px; height: 24px;
      border-radius: 50%; background: ${markerColor}33;
    }
    .seq-ring.selected { background: rgba(239,68,68,0.35); animation: pulseRing 1.6s ease-out infinite; }
    @keyframes pulseRing {
      0% { transform: scale(0.8); opacity: 0.8; }
      70% { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .seq-dot {
      position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: #fff; border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      background: linear-gradient(135deg, #2563eb, #38bdf8);
    }
    .seq-dot.selected { background: #ef4444; transform: scale(1.15); }
    .leaflet-popup-content { font-family: -apple-system, Roboto, sans-serif; }
    .popup-badge {
      display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 9px;
      font-weight: 800; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;
    }
    .popup-title { font-weight: 800; font-size: 13px; color: #0f172a; margin: 6px 0 2px; }
    .popup-address { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .popup-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 11px; color: #475569; }
    .popup-time { font-size: 10px; font-weight: 700; color: #64748b; }
    .popup-tz { font-size: 9px; font-weight: 600; color: #94a3b8; margin-left: 3px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([-6.9147, 107.6098], 12);
    L.tileLayer('${tileUrl}', { maxZoom: 20 }).addTo(map);

    var markers = {};
    var locations = ${locationsJson};
    var selectedId = null;

    function buildIcon(num, isSelected) {
      return L.divIcon({
        html: '<div class="seq-marker">' +
              '<div class="seq-ring' + (isSelected ? ' selected' : '') + '"></div>' +
              '<div class="seq-dot' + (isSelected ? ' selected' : '') + '">' + num + '</div>' +
              '</div>',
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });
    }

    function renderMarkers() {
      Object.values(markers).forEach(function(m) { map.removeLayer(m); });
      markers = {};

      var latlngs = [];

      locations.forEach(function(loc, index) {
        var num = index + 1;
        var isSelected = selectedId === loc.id;
        var marker = L.marker([loc.lat, loc.lng], { icon: buildIcon(num, isSelected) }).addTo(map);

        var popupHtml =
          '<div class="leaflet-popup-content">' +
            '<span class="popup-badge">Stop ' + num + '</span> ' +
            '<span class="popup-time">' + loc.checkin + ' - ' + loc.checkout + '<span class="popup-tz">WIB</span></span>' +
            '<div class="popup-title">' + loc.name_store + '</div>' +
            '<div class="popup-address">' + loc.address_store + '</div>' +
            '<div class="popup-box"><b>Tujuan:</b> ' + loc.purpose + '<br/><b>Hasil:</b> ' + loc.result + '</div>' +
          '</div>';

        marker.bindPopup(popupHtml);
        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: loc.id }));
        });

        markers[loc.id] = marker;
        latlngs.push([loc.lat, loc.lng]);
      });

      if (window.routeLine) { map.removeLayer(window.routeLine); window.routeLine = null; }
      if (latlngs.length > 1) {
        window.routeLine = L.polyline(latlngs, {
          color: '${markerColor}', weight: 4, opacity: 0.8, dashArray: '8,8'
        }).addTo(map);
      }

      if (latlngs.length > 0) {
        try {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30], maxZoom: 15 });
        } catch (e) {}
      }
    }

    window.focusMarker = function(id) {
      selectedId = id;
      renderMarkers();
      var loc = locations.find(function(l) { return l.id === id; });
      if (loc) {
        map.setView([loc.lat, loc.lng], 15, { animate: true });
        setTimeout(function() {
          var m = markers[id];
          if (m) m.openPopup();
        }, 250);
      }
    };

    renderMarkers();
    setTimeout(function() { map.invalidateSize(); }, 200);
  </script>
</body>
</html>
  `;
}

export default function LeafletMapView({
  locations,
  selectedLocationId,
  onSelectLocation,
  height = '100%',
  theme = 'light',
}: LeafletMapViewProps) {
  const webViewRef = useRef<WebView>(null);

  // HTML hanya dibangun ulang (dan WebView reload) kalau "locations" atau
  // "theme" berubah referensinya. Pastikan parent meng-memo-kan array
  // locations (lihat pemakaian di TrackingHistoryScreen) supaya peta tidak
  // reload setiap kali ada re-render yang tidak berhubungan dengan data.
  const html = useMemo(() => buildHtml(locations, theme), [locations, theme]);

  useEffect(() => {
    if (selectedLocationId != null) {
      webViewRef.current?.injectJavaScript(
        `window.focusMarker && window.focusMarker(${selectedLocationId}); true;`
      );
    }
  }, [selectedLocationId]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'select' && onSelectLocation) {
        onSelectLocation(payload.id);
      }
    } catch (e) {
      // pesan tidak valid, diabaikan
    }
  };

  return (
    <View style={[styles.container, { height } as ViewStyle]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', borderRadius: 12 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});