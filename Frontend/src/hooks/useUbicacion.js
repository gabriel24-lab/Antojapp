import { useState, useCallback } from "react";
import { PAISES } from "../data/mockData";

// Coordenadas aproximadas de capitales / ciudades para detectar país
const CENTROS_PAIS = [
  { codigo: "CO", lat: 4.711,  lng: -74.072,  radio: 12 },  // Colombia
  { codigo: "MX", lat: 23.634, lng: -102.552, radio: 18 },  // México
  { codigo: "PE", lat: -9.19,  lng: -75.015,  radio: 14 },  // Perú
  { codigo: "ES", lat: 40.416, lng: -3.703,   radio: 8  },  // España
  { codigo: "JP", lat: 36.204, lng: 138.252,  radio: 10 },  // Japón
  { codigo: "IT", lat: 41.871, lng: 12.567,   radio: 7  },  // Italia
  { codigo: "US", lat: 37.09,  lng: -95.712,  radio: 22 },  // EE.UU.
];

function distanciaGrados(lat1, lng1, lat2, lng2) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

function detectarPaisPorCoordenadas(lat, lng) {
  let mejorPais = null;
  let menorDist = Infinity;
  for (const c of CENTROS_PAIS) {
    const dist = distanciaGrados(lat, lng, c.lat, c.lng);
    if (dist < c.radio && dist < menorDist) {
      menorDist = dist;
      mejorPais = c.codigo;
    }
  }
  return mejorPais;
}

export function useUbicacion() {
  const [estado, setEstado] = useState("idle"); // idle | solicitando | concedida | denegada | error
  const [coordenadas, setCoordenadas] = useState(null);
  const [paisDetectado, setPaisDetectado] = useState(null);

  const solicitarUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado("error");
      return;
    }
    setEstado("solicitando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoordenadas({ lat, lng });
        const pais = detectarPaisPorCoordenadas(lat, lng);
        setPaisDetectado(pais);
        setEstado("concedida");
      },
      () => {
        setEstado("denegada");
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return { estado, coordenadas, paisDetectado, solicitarUbicacion };
}
