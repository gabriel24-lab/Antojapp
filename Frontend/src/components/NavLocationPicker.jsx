import { useState, useRef, useEffect } from "react";
import { useLocationData } from "../hooks/useLocationData";
import AppIcon from "./AppIcon";

/**
 * Selector de ubicación estilo Rappi/Mercado Libre.
 * Va en la navbar. Flujo: País → Departamento/Estado → Ciudad.
 * Carga todos los países del mundo desde la API countriesnow.space.
 */
export default function NavLocationPicker({
  paisSeleccionado,       // iso2 | null
  paisNombre,             // nombre legible del país seleccionado
  departamentoSeleccionado,
  ciudadSeleccionada,
  onCambiar,              // ({ iso2, nombre, departamento, ciudad }) => void
}) {
  const [abierto, setAbierto]     = useState(false);
  const [paso, setPaso]           = useState("pais"); // "pais" | "departamento" | "ciudad"
  const [paisTemp, setPaisTemp]   = useState(null);   // { iso2, nombre }
  const [deptTemp, setDeptTemp]   = useState(null);   // { display, original }
  const [busqueda, setBusqueda]   = useState("");

  // Estados y ciudades cargados dinámicamente
  const [estados, setEstados]       = useState([]);
  const [ciudades, setCiudades]     = useState([]);
  const [loadingEstados, setLoadingEstados]   = useState(false);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  const ref = useRef(null);
  const { countries, loadingCountries, fetchStates, fetchCities } = useLocationData();

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
        resetTemp();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetTemp = () => {
    setPaso("pais");
    setPaisTemp(null);
    setDeptTemp(null);
    setBusqueda("");
    setEstados([]);
    setCiudades([]);
  };

  const abrir = () => {
    setAbierto((v) => {
      if (!v) resetTemp();
      return !v;
    });
  };

  // ── Cargar estados al elegir país ──
  const elegirPais = async (pais) => {
    setPaisTemp(pais);
    setBusqueda("");
    setPaso("departamento");
    setEstados([]);
    setLoadingEstados(true);
    // fetchStates ahora devuelve [{ display, original }, ...]
    const result = await fetchStates(pais.nombre);
    setEstados(result);
    setLoadingEstados(false);
  };

  // ── Cargar ciudades al elegir departamento ──
  // dept = { display: "Cesar", original: "Cesar Department" }
  const elegirDept = async (dept) => {
    setDeptTemp(dept);
    setBusqueda("");
    setPaso("ciudad");
    setCiudades([]);
    setLoadingCiudades(true);
    // Usamos dept.original para que la API lo reconozca correctamente
    const result = await fetchCities(paisTemp.nombre, dept.original);
    setCiudades(result);
    setLoadingCiudades(false);
  };

  const elegirCiudad = (ciudad) => {
    onCambiar({ iso2: paisTemp.iso2, nombre: paisTemp.nombre, departamento: deptTemp.display, ciudad });
    setAbierto(false);
    resetTemp();
  };

  const elegirSoloPais = () => {
    onCambiar({ iso2: paisTemp.iso2, nombre: paisTemp.nombre, departamento: null, ciudad: null });
    setAbierto(false);
    resetTemp();
  };

  const elegirSoloDept = () => {
    onCambiar({ iso2: paisTemp.iso2, nombre: paisTemp.nombre, departamento: deptTemp.display, ciudad: null });
    setAbierto(false);
    resetTemp();
  };

  const limpiarTodo = () => {
    onCambiar({ iso2: null, nombre: null, departamento: null, ciudad: null });
    setAbierto(false);
    resetTemp();
  };

  // ── Filtrado por búsqueda ──
  const q = busqueda.toLowerCase();
  const paisesFiltrados = q
    ? countries.filter((p) => p.nombre.toLowerCase().includes(q))
    : countries;
  const estadosFiltrados = q
    ? estados.filter((e) => e.display.toLowerCase().includes(q))
    : estados;
  const ciudadesFiltradas = q
    ? ciudades.filter((c) => c.toLowerCase().includes(q))
    : ciudades;

  // ── Label del botón trigger ──
  const labelPrincipal = ciudadSeleccionada || paisNombre || null;
  const labelSub       = ciudadSeleccionada
    ? (departamentoSeleccionado || paisNombre)
    : departamentoSeleccionado || null;

  const titulos = {
    pais:         "¿En qué país?",
    departamento: paisTemp ? `Departamento · ${paisTemp.nombre}` : "Departamento / Estado",
    ciudad:       deptTemp ? `Ciudad en ${deptTemp.display}` : "Ciudad",
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* ── Botón trigger ── */}
      <button
        id="nav-location-picker-btn"
        onClick={abrir}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.13)",
          borderRadius: 10, padding: "5px 10px",
          cursor: "pointer", transition: "background 0.15s",
          maxWidth: 200, minWidth: 80,
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
        onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
      >
        <AppIcon name="mapPin" size={14} color="var(--brand)" />
        <div style={{ overflow: "hidden", textAlign: "left", flex: 1, minWidth: 0 }}>
          {labelPrincipal ? (
            <>
              {labelSub && (
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", lineHeight: 1, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {labelSub}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
                {labelPrincipal}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>
              Seleccionar zona
            </div>
          )}
        </div>
        <AppIcon
          name="chevronDown" size={12}
          style={{ opacity: 0.4, flexShrink: 0, marginLeft: 2, transition: "transform 0.2s", transform: abierto ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* ── Dropdown ── */}
      {abierto && (
        <>
          {/* Overlay */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 149 }}
            onClick={() => { setAbierto(false); resetTemp(); }}
          />

          <div style={{
            position: "absolute", left: 0, top: "calc(100% + 8px)",
            background: "var(--surface)", borderRadius: 14,
            border: "1px solid var(--border)",
            boxShadow: "0 12px 40px rgba(0,0,0,.18)",
            width: 300, overflow: "hidden", zIndex: 200,
            animation: "locSlide 0.18s ease",
          }}>

            {/* ── Header ── */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #F0EBE5", background: "#FDFAF8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {paso !== "pais" && (
                  <button
                    onClick={() => {
                      if (paso === "ciudad") { setPaso("departamento"); setBusqueda(""); }
                      else { setPaso("pais"); setBusqueda(""); }
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "var(--text-3)", display: "flex", alignItems: "center" }}
                  >
                    <AppIcon name="chevronLeft" size={14} />
                  </button>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", flex: 1 }}>
                  {titulos[paso]}
                </span>
                {/* Breadcrumb bandera */}
                {paisTemp && paso !== "pais" && (
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{paisTemp.bandera}</span>
                )}
              </div>
              {/* Breadcrumb pills */}
              {(paisTemp || deptTemp) && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {paisTemp && (
                    <span style={{ fontSize: 10, background: "var(--brand-light)", color: "var(--brand)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                      {paisTemp.nombre}
                    </span>
                  )}
                  {deptTemp && (
                    <span style={{ fontSize: 10, background: "#F0EBE5", color: "var(--text-2)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                      {deptTemp.display}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Buscador ── */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #F0EBE5" }}>
              <div style={{ position: "relative" }}>
                <AppIcon name="search" size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder={
                    paso === "pais"         ? "Buscar país…"         :
                    paso === "departamento" ? "Buscar departamento…" :
                                             "Buscar ciudad…"
                  }
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "7px 10px 7px 30px", borderRadius: 8,
                    border: "1.5px solid var(--border)", fontSize: 13, color: "var(--text-1)",
                    background: "var(--surface)", outline: "none", transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* ── Lista ── */}
            <div style={{ maxHeight: 300, overflowY: "auto", padding: "6px 8px" }}>

              {/* PASO: países */}
              {paso === "pais" && (
                <>
                  {!busqueda && (
                    <ItemBtn
                      onClick={limpiarTodo}
                      activo={!paisSeleccionado}
                      icon="globe"
                      label="Todo el mundo"
                      sub="Ver todos los negocios"
                    />
                  )}
                  {loadingCountries ? (
                    <LoadingSkeleton count={8} />
                  ) : (
                    paisesFiltrados.map((p) => (
                      <ItemBtn
                        key={p.iso2 || p.nombre}
                        onClick={() => elegirPais(p)}
                        activo={paisSeleccionado === p.iso2}
                        icon={p.bandera}
                        label={p.nombre}
                        chevron
                      />
                    ))
                  )}
                </>
              )}

              {/* PASO: departamentos */}
              {paso === "departamento" && (
                <>
                  <ItemBtn
                    onClick={elegirSoloPais}
                    activo={paisSeleccionado === paisTemp?.iso2 && !departamentoSeleccionado}
                    icon={paisTemp?.bandera || null}
                    label={`Todo ${paisTemp?.nombre}`}
                    sub="Sin filtro de departamento"
                  />
                  {loadingEstados ? (
                    <LoadingSkeleton count={6} />
                  ) : estadosFiltrados.length > 0 ? (
                    estadosFiltrados.map((d) => (
                      <ItemBtn
                        key={d.original}
                        onClick={() => elegirDept(d)}
                        activo={departamentoSeleccionado === d.display && !ciudadSeleccionada}
                        icon="mapPin"
                        label={d.display}
                        chevron
                      />
                    ))
                  ) : (
                    <EmptyMsg texto="No hay departamentos disponibles" />
                  )}
                </>
              )}

              {/* PASO: ciudades */}
              {paso === "ciudad" && (
                <>
                  <ItemBtn
                    onClick={elegirSoloDept}
                    activo={departamentoSeleccionado === deptTemp?.display && !ciudadSeleccionada}
                    icon="mapPin"
                    label={`Todo ${deptTemp?.display}`}
                    sub="Sin filtro de ciudad"
                  />
                  {loadingCiudades ? (
                    <LoadingSkeleton count={5} />
                  ) : ciudadesFiltradas.length > 0 ? (
                    ciudadesFiltradas.map((c) => (
                      <ItemBtn
                        key={c}
                        onClick={() => elegirCiudad(c)}
                        activo={ciudadSeleccionada === c}
                        icon={null}
                        label={c}
                      />
                    ))
                  ) : (
                    <EmptyMsg texto="No hay ciudades disponibles" />
                  )}
                </>
              )}

              {/* Vacío en búsqueda */}
              {paso === "pais" && !loadingCountries && paisesFiltrados.length === 0 && busqueda && (
                <EmptyMsg texto={`No se encontró "${busqueda}"`} />
              )}
            </div>

            {/* ── Footer: selección actual ── */}
            {paisSeleccionado && (
              <div style={{ padding: "10px 14px", borderTop: "1px solid #F0EBE5", background: "#FDFAF8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
                  <AppIcon name="mapPin" size={11} color="var(--brand)" />
                  <span>
                    {ciudadSeleccionada || departamentoSeleccionado || paisNombre}
                  </span>
                </div>
                <button
                  onClick={limpiarTodo}
                  style={{ fontSize: 11, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "2px 6px" }}
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <style>{`
            @keyframes locSlide {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

// ── Sub-componentes ──

function ItemBtn({ onClick, activo, icon, label, sub, chevron }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
        background: activo ? "var(--brand-light)" : hover ? "var(--bg)" : "transparent",
        transition: "background 0.12s",
      }}
    >
      <span style={{ width: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon === null ? null
          : (icon === "globe" || icon === "mapPin" || icon === "store")
            ? <AppIcon name={icon} size={18} color={activo ? "var(--brand)" : "var(--text-2)"} />
            : <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: activo ? 700 : 500, color: activo ? "var(--brand)" : "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>}
      </div>
      {activo && !chevron && <AppIcon name="check" size={14} color="var(--brand)" style={{ flexShrink: 0 }} />}
      {chevron && <AppIcon name="chevronRight" size={13} style={{ opacity: 0.35, flexShrink: 0 }} />}
    </button>
  );
}

function LoadingSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#F0EBE5", animation: "shimmer 1.2s infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, borderRadius: 4, background: "#F0EBE5", animation: "shimmer 1.2s infinite", width: `${60 + Math.random() * 30}%` }} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}

function EmptyMsg({ texto }) {
  return (
    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
      {texto}
    </div>
  );
}