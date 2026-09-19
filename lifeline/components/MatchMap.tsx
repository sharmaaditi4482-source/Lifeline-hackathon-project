"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MatchResult } from "@/lib/types";

// Global null-safe wrapper for Leaflet DOM position to prevent _leaflet_pos TypeError
if (typeof window !== "undefined" && L && L.DomUtil) {
  const origGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: any) {
    if (!el) return new L.Point(0, 0);
    try {
      return origGetPosition ? origGetPosition.call(L.DomUtil, el) : (el._leaflet_pos || new L.Point(0, 0));
    } catch {
      return el._leaflet_pos || new L.Point(0, 0);
    }
  };
}

/* ── Custom SVG markers (clean vector dots) ── */

function createMarkerIcon(color: string, filled: boolean, size = 16, label?: string): L.DivIcon {
  const svg = filled
    ? `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        </svg>
        ${label ? `<span style="position:absolute;color:white;font-size:9px;font-weight:bold;font-family:monospace;">${label}</span>` : ""}
      </div>`
    : `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="white" stroke="${color}" stroke-width="2.5"/>
        </svg>
      </div>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const hospitalIcon = createMarkerIcon("#1C1917", true, 20, "🏥");
const bestMatchIcon = createMarkerIcon("#A8201A", true, 20, "★");
const otherMatchIcon = createMarkerIcon("#A8201A", false, 16);

/* ── Types ── */

interface MatchWithLocation extends MatchResult {
  location?: { lat: number; lng: number; label: string };
}

interface MatchMapProps {
  hospitalLocation: { lat: number; lng: number; label: string };
  matches: MatchWithLocation[];
}

export default function MatchMap({ hospitalLocation, matches }: MatchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Safely remove any prior Leaflet instance & reset DOM container ID
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch {}
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    let map: L.Map | null = null;
    try {
      map = L.map(mapContainerRef.current, {
        center: [hospitalLocation.lat, hospitalLocation.lng],
        zoom: 11,
        scrollWheelZoom: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Hospital Marker
      L.marker([hospitalLocation.lat, hospitalLocation.lng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;padding:2px;">
            <strong style="color:#1C1917;font-size:13px;">🏥 Emergency Request Hub</strong><br/>
            <span style="color:#78716C;font-family:monospace;font-size:11px;">${hospitalLocation.label}</span>
          </div>`
        );

      // Match Markers & Polyline Connections
      const allPoints: [number, number][] = [
        [hospitalLocation.lat, hospitalLocation.lng],
      ];

      matches.forEach((m, i) => {
        if (m.location && map) {
          allPoints.push([m.location.lat, m.location.lng]);
          const scorePercent = Math.round(m.score * 100);
          const estTransitMins = Math.max(4, Math.round(m.distanceKm * 2.2));

          const marker = L.marker([m.location.lat, m.location.lng], {
            icon: i === 0 ? bestMatchIcon : otherMatchIcon,
          }).addTo(map);

          marker.bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;padding:2px;">
              <strong style="color:#1C1917;font-size:13px;">${m.sourceName}</strong>
              <span style="color:#A8201A;font-size:10px;font-weight:bold;margin-left:4px;">${i === 0 ? "★ TOP MATCH" : ""}</span><br/>
              <div style="margin-top:4px;color:#44403C;font-family:monospace;font-size:11px;">
                Group: <strong style="color:#A8201A;">${m.bloodGroup}</strong> · <strong>${m.distanceKm} km</strong> · ETA: <strong>~${estTransitMins} mins</strong>
              </div>
              <div style="margin-top:2px;color:#78716C;font-family:monospace;font-size:10px;">
                Algorithm Score: <strong style="color:#1C1917;">${scorePercent}/100</strong> (${m.sourceType === "donor" ? "Donor" : "Bank Reserve"})
              </div>
            </div>`
          );

          // Draw transit vector from hospital to best match
          if (i === 0) {
            L.polyline(
              [
                [hospitalLocation.lat, hospitalLocation.lng],
                [m.location.lat, m.location.lng],
              ],
              {
                color: "#A8201A",
                weight: 3,
                dashArray: "6, 8",
                opacity: 0.85,
              }
            ).addTo(map);
          }
        }
      });

      // Auto-fit all coordinates in viewport safely without animation collision
      if (allPoints.length > 1 && map) {
        try {
          const bounds = L.latLngBounds(allPoints.map(([lat, lng]) => L.latLng(lat, lng)));
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: false });
        } catch {}
      }
    } catch {}

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [hospitalLocation, matches]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className="w-full overflow-hidden rounded-2xl border border-ink-10 relative z-0 shadow-sm"
        style={{ height: "320px" }}
      />
      {matches && matches.length > 0 && (
        <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md border border-ink-10 text-[10px] font-mono flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
          <span className="font-semibold text-ink">
            Top ETA: ~{Math.max(4, Math.round(matches[0].distanceKm * 2.2))} mins ({matches[0].distanceKm} km)
          </span>
        </div>
      )}
    </div>
  );
}
