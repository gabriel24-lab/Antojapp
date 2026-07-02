import { useState, useEffect, useRef } from "react";
import { useLocationData } from "../hooks/useLocationData";

// ── Helpers UI locales (mismo estilo que FormularioNegocio) ────
const Label = ({ children, required }) => (
  <label
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-2)",
      display: "block",
      marginBottom: 6,
    }}
  >
    {children}
    {required && (
      <span style={{ color: "var(--brand)", marginLeft: 3 }}>*</span>
    )}
  </label>
);

/**
 * Selector País → Departamento/Estado → Ciudad para UNA sede.
 * Cada sede tiene su propia ubicación mundial (una empresa puede tener
 * sedes en países o ciudades distintas, no se asume que comparten una).
 *
 * Usa la misma API gratuita (countriesnow.space) que NavLocationPicker,
 * a través del hook useLocationData ya existente en el proyecto.
 *
 * props:
 *  - pais (iso2 | null), paisNombre, departamento, ciudad
 *  - onChange({ pais, pais_nombre, departamento, ciudad })
 */
export default function SedeUbicacionSelector({
  pais,
  paisNombre,
  departamento,
  ciudad,
  onChange,
}) {
  const { countries, loadingCountries, fetchStates, fetchCities } =
    useLocationData();

  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  // "original" es el nombre exacto que la API espera para buscar ciudades
  // (ej: "Cesar Department"), distinto del nombre limpio que se muestra.
  const [deptOriginal, setDeptOriginal] = useState(null);

  const cargaInicialHecha = useRef(false);

  // Al editar una sede ya existente: si ya viene con país/departamento
  // guardados, recargamos las listas para que los selects los muestren.
  useEffect(() => {
    if (cargaInicialHecha.current) return;
    if (!paisNombre) return;
    cargaInicialHecha.current = true;

    (async () => {
      setLoadingEstados(true);
      const listaEstados = await fetchStates(paisNombre);
      setEstados(listaEstados);
      setLoadingEstados(false);

      const match = listaEstados.find((e) => e.display === departamento);
      if (match && ciudad) {
        setDeptOriginal(match.original);
        setLoadingCiudades(true);
        const listaCiudades = await fetchCities(paisNombre, match.original);
        setCiudades(listaCiudades);
        setLoadingCiudades(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paisNombre]);

  const elegirPais = async (iso2) => {
    if (!iso2) {
      onChange({
        pais: null,
        pais_nombre: null,
        departamento: null,
        ciudad: null,
      });
      setEstados([]);
      setCiudades([]);
      setDeptOriginal(null);
      return;
    }
    const paisObj = countries.find((c) => c.iso2 === iso2);
    onChange({
      pais: iso2,
      pais_nombre: paisObj?.nombre || null,
      departamento: null,
      ciudad: null,
    });
    setEstados([]);
    setCiudades([]);
    setDeptOriginal(null);
    if (paisObj) {
      setLoadingEstados(true);
      const lista = await fetchStates(paisObj.nombre);
      setEstados(lista);
      setLoadingEstados(false);
    }
  };

  const elegirDepartamento = async (display) => {
    if (!display) {
      onChange({ pais, pais_nombre: paisNombre, departamento: null, ciudad: null });
      setDeptOriginal(null);
      setCiudades([]);
      return;
    }
    const deptObj = estados.find((e) => e.display === display);
    onChange({
      pais,
      pais_nombre: paisNombre,
      departamento: display,
      ciudad: null,
    });
    setDeptOriginal(deptObj?.original || null);
    setCiudades([]);
    if (deptObj) {
      setLoadingCiudades(true);
      const lista = await fetchCities(paisNombre, deptObj.original);
      setCiudades(lista);
      setLoadingCiudades(false);
    }
  };

  const elegirCiudad = (c) => {
    onChange({
      pais,
      pais_nombre: paisNombre,
      departamento,
      ciudad: c || null,
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))",
        gap: 12,
      }}
    >
      <div>
        <Label required>País</Label>
        <select
          className="input"
          value={pais || ""}
          onChange={(e) => elegirPais(e.target.value)}
          disabled={loadingCountries}
          style={{ cursor: "pointer" }}
        >
          <option value="">
            {loadingCountries ? "Cargando países…" : "Selecciona un país..."}
          </option>
          {countries.map((c) => (
            <option key={c.iso2} value={c.iso2}>
              {c.bandera} {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Departamento / Estado</Label>
        <select
          className="input"
          value={departamento || ""}
          onChange={(e) => elegirDepartamento(e.target.value)}
          disabled={!pais || loadingEstados}
          style={{ cursor: pais ? "pointer" : "not-allowed" }}
        >
          <option value="">
            {loadingEstados
              ? "Cargando…"
              : !pais
                ? "Elige primero un país"
                : estados.length
                  ? "Selecciona..."
                  : "No disponible"}
          </option>
          {estados.map((e) => (
            <option key={e.original} value={e.display}>
              {e.display}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label required>Ciudad</Label>
        {/* Fallback: si el país no trae departamentos/estados en la API
            (pasa con países pequeños), dejamos escribir la ciudad a mano
            en vez de bloquear el formulario. */}
        {!loadingEstados && pais && estados.length === 0 ? (
          <input
            className="input"
            value={ciudad || ""}
            onChange={(e) => elegirCiudad(e.target.value)}
            placeholder="Escribe la ciudad"
          />
        ) : (
          <select
            className="input"
            value={ciudad || ""}
            onChange={(e) => elegirCiudad(e.target.value)}
            disabled={!pais || !departamento || loadingCiudades}
            style={{ cursor: pais ? "pointer" : "not-allowed" }}
          >
            <option value="">
              {loadingCiudades
                ? "Cargando…"
                : !pais
                  ? "Elige primero un país"
                  : !departamento
                    ? "Elige primero un departamento"
                    : ciudades.length
                      ? "Selecciona..."
                      : "No disponible, escríbela en Dirección"}
            </option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
