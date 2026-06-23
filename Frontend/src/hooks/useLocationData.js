import { useState, useEffect, useCallback } from "react";

const BASE = "https://countriesnow.space/api/v0.1";

// Cache en memoria para evitar repetir peticiones
const cache = {
  countries: null,
  states: {},
  cities: {},
};

/**
 * Hook para cargar países, departamentos/estados y ciudades
 * desde la API gratuita countriesnow.space (sin API key).
 */
export function useLocationData() {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [errorCountries, setErrorCountries] = useState(null);

  // Cargar países al montar
  useEffect(() => {
    if (cache.countries) {
      setCountries(cache.countries);
      setLoadingCountries(false);
      return;
    }
    setLoadingCountries(true);
    fetch(`${BASE}/countries/flag/images`)
      .then((r) => r.json())
      .then((data) => {
        // data.data = [{ name, iso2, flag, ... }]
        const list = (data.data || [])
          .map((c) => ({
            iso2: c.iso2,
            nombre: c.name,
            bandera: getFlagEmoji(c.iso2),
          }))
          .filter((c) => c.iso2)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        cache.countries = list;
        setCountries(list);
        setLoadingCountries(false);
      })
      .catch(() => {
        // Fallback: endpoint alternativo más simple
        fetch(`${BASE}/countries`)
          .then((r) => r.json())
          .then((data) => {
            const list = (data.data || [])
              .map((c) => ({
                iso2: c.iso2 || null,
                nombre: c.country,
                bandera: c.iso2 ? getFlagEmoji(c.iso2) : "🌐",
              }))
              .sort((a, b) => a.nombre.localeCompare(b.nombre));
            cache.countries = list;
            setCountries(list);
            setLoadingCountries(false);
          })
          .catch((err) => {
            setErrorCountries(err.message);
            setLoadingCountries(false);
          });
      });
  }, []);

  /**
   * Obtener departamentos/estados de un país por nombre.
   * Retorna objetos { display, original } donde:
   *   - display: nombre limpio para mostrar en UI ("Cesar")
   *   - original: nombre exacto que espera la API ("Cesar Department")
   * @param {string} countryName - Nombre del país en inglés
   * @returns {Promise<{ display: string, original: string }[]>}
   */
  const fetchStates = useCallback(async (countryName) => {
    if (!countryName) return [];
    if (cache.states[countryName]) return cache.states[countryName];
    try {
      const res = await fetch(`${BASE}/countries/states`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName }),
      });
      const data = await res.json();
      const states = (data.data?.states || [])
        .map((s) => ({ display: cleanStateName(s.name), original: s.name }))
        .filter((s) => s.display)
        .sort((a, b) => a.display.localeCompare(b.display));
      cache.states[countryName] = states;
      return states;
    } catch {
      return [];
    }
  }, []);

  /**
   * Obtener ciudades de un estado/departamento específico.
   * @param {string} countryName
   * @param {string} stateName - Nombre original del estado tal como lo devuelve la API
   * @returns {Promise<string[]>}
   */
  const fetchCities = useCallback(async (countryName, stateName) => {
    if (!countryName || !stateName) return [];
    const key = `${countryName}::${stateName}`;
    if (cache.cities[key]) return cache.cities[key];
    try {
      const res = await fetch(`${BASE}/countries/state/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      const data = await res.json();
      const cities = (data.data || []).filter(Boolean).sort();
      cache.cities[key] = cities;
      return cities;
    } catch {
      return [];
    }
  }, []);

  return {
    countries,
    loadingCountries,
    errorCountries,
    fetchStates,
    fetchCities,
  };
}

// Convertir código ISO2 a emoji de bandera
function getFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return "🌐";
  const codePoints = [...iso2.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0),
  );
  return String.fromCodePoint(...codePoints);
}

// Limpiar sufijos que la API agrega a los nombres de estados/departamentos
// Ej: "Antioquia Department" → "Antioquia", "New York State" → "New York"
const STATE_SUFFIXES = [
  " Department",
  " State",
  " Province",
  " Region",
  " Oblast",
  " Territory",
  " District",
  " County",
  " Prefecture",
  " Governorate",
  " Canton",
  " Autonomous",
  " Municipality",
];
function cleanStateName(name) {
  if (!name) return "";
  for (const suffix of STATE_SUFFIXES) {
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length).trim();
  }
  return name.trim();
}
