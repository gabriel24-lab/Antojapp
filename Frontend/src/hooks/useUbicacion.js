import { useState, useCallback } from "react";

/**
 * Hook de ubicación con reverse-geocoding real.
 * Usa la API gratuita de BigDataCloud (sin API key necesaria)
 * para convertir coordenadas GPS → país real.
 *
 * Retorna:
 *   estado:         "idle" | "solicitando" | "concedida" | "denegada" | "error"
 *   coordenadas:    { lat, lng } | null
 *   paisDetectado:  { iso2, nombre } | null   (país real por GPS)
 *   solicitarUbicacion: () => void
 */
export function useUbicacion() {
  const [estado, setEstado] = useState("idle");
  const [coordenadas, setCoordenadas] = useState(null);
  const [paisDetectado, setPaisDetectado] = useState(null);

  const solicitarUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado("error");
      return;
    }
    setEstado("solicitando");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoordenadas({ lat, lng });

        try {
          // BigDataCloud: reverse geocoding gratuito, sin API key
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
          );
          const data = await res.json();

          const iso2   = data.countryCode  || null;   // ej. "CO"
          const nombre = data.countryName  || null;   // ej. "Colombia"

          setPaisDetectado(iso2 ? { iso2, nombre } : null);
        } catch {
          // Si la API falla, dejamos paisDetectado en null (no bloqueante)
          setPaisDetectado(null);
        }

        setEstado("concedida");
      },
      () => {
        setEstado("denegada");
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { estado, coordenadas, paisDetectado, solicitarUbicacion };
}