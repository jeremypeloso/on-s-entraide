"use client";

import { useEffect, useRef } from "react";

/**
 * Carte OpenStreetMap/CARTO (Leaflet importé en package npm) affichant la zone
 * d'intervention : un marqueur sur la commune de départ et un cercle du rayon
 * de l'abonnement.
 */
export default function ZoneMap({
  lat,
  lng,
  radiusKm,
  label,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
  label?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      // Import dynamique : Leaflet touche `window`, il ne doit charger que côté client
      const mod: any = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelled || !mapRef.current) return;

      console.log("ZoneMap init:", { lat, lng, radiusKm, leafletVersion: L?.version });

      if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
        console.error("ZoneMap: coordonnées invalides", { lat, lng });
        return;
      }

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapInstance.current = map;

      // Vue initiale obligatoire : sans elle, la carte reste grise et
      // circle.getBounds() plante (projection impossible)
      map.setView([lat, lng], 10);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: "#FF6B5B",
        weight: 2,
        fillColor: "#FF6B5B",
        fillOpacity: 0.12,
      }).addTo(map);

      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#FFFFFF",
        weight: 2,
        fillColor: "#E8503F",
        fillOpacity: 1,
      }).addTo(map);
      if (label) marker.bindTooltip(label, { direction: "top", offset: [0, -8] });

      map.fitBounds(circle.getBounds(), { padding: [20, 20] });

      // Le conteneur vient d'être monté : forcer le recalcul de taille
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          mapInstance.current.fitBounds(circle.getBounds(), { padding: [20, 20] });
        }
      }, 150);
    }

    initMap().catch((e) => console.error("ZoneMap:", e));
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, radiusKm, label]);

  return (
    <div
      ref={mapRef}
      className="w-full h-72 rounded-2xl overflow-hidden border border-neutral-200 z-0"
    />
  );
}
