import { useState, useEffect, useCallback, useRef } from "react";
import BusinessCard from "../components/BusinessCard";
import LocationPermissionModal from "../components/LocationPermissionModal";
import { NEGOCIOS, PAISES } from "../data/mockData";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

export default function HomePage({
  onVerDetalle, onAbrirAuth, busqueda, onBusqueda, modoNegocios,
  // Ubicación controlada desde App (via Navbar)
  paisSeleccionado, paisNombre, departamentoSeleccionado, ciudadSeleccionada,
  onCambiarUbicacion,
}) {
  const [negocios,     setNegocios]     = useState([]);
  const [categorias,   setCategorias]   = useState(["Todas"]);
  const [categoria,    setCategoria]    = useState("Todas");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState("");
  const [usandoMock,   setUsandoMock]   = useState(false);

  const [modalUbicacion, setModalUbicacion] = useState(false);

  const resultadosRef = useRef(null);

  // Modal de permiso al cargar (solo una vez)
  useEffect(() => {
    const ya = sessionStorage.getItem("ubicacion_preguntado");
    if (!ya) setTimeout(() => setModalUbicacion(true), 800);
  }, []);

  // Scroll en modo Negocios / Inicio
  useEffect(() => {
    if (modoNegocios && resultadosRef.current) {
      setTimeout(() => resultadosRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } else if (!modoNegocios) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);
    }
  }, [modoNegocios]);

  // Cargar categorías
  useEffect(() => {
    fetch(`${API_URL}/negocios/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(["Todas", ...data]))
      .catch(() => {});
  }, []);

  // Cargar negocios con debounce
  const cargarNegocios = useCallback(() => {
    setCargando(true); setError("");
    const p = new URLSearchParams();
    if (busqueda?.trim())      p.set("busqueda",    busqueda.trim());
    if (categoria !== "Todas") p.set("categoria",   categoria);
    if (soloAbiertos)          p.set("soloAbiertos", "true");
    fetch(`${API_URL}/negocios?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setNegocios(data); setUsandoMock(false); setCargando(false); })
      .catch(() => {
        let mock = NEGOCIOS;
        if (busqueda?.trim()) {
          const q = busqueda.trim().toLowerCase();
          mock = mock.filter(n =>
            n.nombre.toLowerCase().includes(q) ||
            n.descripcion.toLowerCase().includes(q) ||
            n.categoria.toLowerCase().includes(q) ||
            n.etiquetas?.some(t => t.toLowerCase().includes(q))
          );
        }
        if (categoria !== "Todas") mock = mock.filter(n => n.categoria === categoria);
        if (soloAbiertos)          mock = mock.filter(n => n.abierto);
        setNegocios(mock);
        setUsandoMock(true);
        setCargando(false);
        setCategorias(["Todas", ...new Set(NEGOCIOS.map(n => n.categoria))]);
      });
  }, [busqueda, categoria, soloAbiertos]);

  useEffect(() => {
    const t = setTimeout(cargarNegocios, busqueda ? 380 : 0);
    return () => clearTimeout(t);
  }, [cargarNegocios, busqueda]);

  // Filtrado por ubicación (frontend)
  // El usuario puede elegir con distintos niveles de granularidad:
  //   - Solo país              → muestra todos los negocios del país
  //   - País + departamento    → muestra los del departamento/estado
  //   - País + depto + ciudad  → muestra solo los de esa ciudad
  const negociosFiltrados = negocios.filter(n => {
    if (!paisSeleccionado) return true;
    if (n.pais !== paisSeleccionado) return false;
    if (departamentoSeleccionado && n.departamento !== departamentoSeleccionado) return false;
    if (ciudadSeleccionada && n.ciudad !== ciudadSeleccionada) return false;
    return true;
  });

  // El modal ahora maneja GPS + departamento + ciudad internamente
  const handleConfirmarUbicacion = ({ iso2, nombre, departamento, ciudad }) => {
    setModalUbicacion(false);
    sessionStorage.setItem("ubicacion_preguntado", "1");
    onCambiarUbicacion({ iso2, nombre, departamento, ciudad });
  };
  const handleSaltarUbicacion = () => {
    setModalUbicacion(false);
    sessionStorage.setItem("ubicacion_preguntado", "1");
  };

  return (
    <div>
      {modalUbicacion && (
        <LocationPermissionModal
          onConfirmar={handleConfirmarUbicacion}
          onSaltar={handleSaltarUbicacion}
        />
      )}

      {/* ── Hero ── */}
      {!modoNegocios && (
        <section style={{ background: "#1A1208", padding: "52px 20px 44px", textAlign: "center" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "2px", color: "#E8460A", textTransform: "uppercase", marginBottom: 14 }}>
              Descubre lo que está cerca
            </p>
            <h1 style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 44px)", color: "#fff", lineHeight: 1.15, marginBottom: 16,
            }}>
              Tu antojo comienza <br /><span style={{ color: "#E8460A" }}>aquí</span>
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
              Comida, tiendas, servicios y emprendimientos de tu zona en un solo lugar
            </p>
            <div style={{ position: "relative", maxWidth: 540, margin: "0 auto" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#A8988A", pointerEvents: "none" }}>
                <AppIcon name="search" size={19} />
              </span>
              <input
                className="input" type="text"
                placeholder="Carne asada, empanadas, corozo, ramen…"
                value={busqueda}
                onChange={e => onBusqueda(e.target.value)}
                style={{ paddingLeft: 46, paddingRight: busqueda ? 40 : 14, fontSize: 15, borderRadius: 50, height: 52, boxShadow: "0 4px 20px rgba(0,0,0,.3)", border: "2px solid rgba(255,255,255,.1)" }}
              />
              {busqueda && (
                <button onClick={() => onBusqueda("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#A8988A", cursor: "pointer", padding: 2 }}>
                  <AppIcon name="x" size={18} />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Filtros sticky ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2DBD5", position: "sticky", top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoria(cat)} style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 50, fontSize: 13, fontWeight: 500,
                border: "1.5px solid", whiteSpace: "nowrap",
                borderColor: categoria === cat ? "#E8460A" : "#E2DBD5",
                background:  categoria === cat ? "#E8460A" : "#fff",
                color:       categoria === cat ? "#fff"    : "#6B5E52",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                {cat}
              </button>
            ))}
            <div style={{ width: 1, height: 22, background: "#E2DBD5", flexShrink: 0, margin: "0 4px" }} />
            <button onClick={() => setSoloAbiertos(!soloAbiertos)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 500,
              border: "1.5px solid",
              borderColor: soloAbiertos ? "#1A8C5B" : "#E2DBD5",
              background:  soloAbiertos ? "#E8F6EE" : "#fff",
              color:       soloAbiertos ? "#1A8C5B" : "#6B5E52",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: soloAbiertos ? "#1A8C5B" : "#A8988A", display: "inline-block" }} />
              Solo abiertos
            </button>
          </div>
        </div>
      </section>

      {/* ── Layout principal: solo grid (sin sidebar) ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 60px" }}>
        <section ref={resultadosRef}>
          {/* Banner modo mock */}
          {usandoMock && (
            <div style={{
              background: "#FFF9EC", border: "1px solid #F0D58C", borderRadius: 10,
              padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#8A6A00",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AppIcon name="info" size={14} />
              Mostrando negocios de ejemplo
            </div>
          )}

          {error && (
            <div style={{ background: "#FDECEA", border: "1px solid #C0392B", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#C0392B", display: "flex", alignItems: "center", gap: 8 }}>
              <AppIcon name="alert" size={18} /> {error}
            </div>
          )}

          {/* Contador + filtro activo */}
          {!cargando && !error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 14, color: "#6B5E52", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {busqueda ? <><strong style={{ color: "#1A1208" }}>"{busqueda}"</strong> — </> : ""}
                <strong style={{ color: "#1A1208" }}>{negociosFiltrados.length}</strong>{" "}
                {negociosFiltrados.length === 1 ? "negocio" : "negocios"}
                {paisSeleccionado && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "#FFF0EB", color: "#E8460A",
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  }}>
                    <AppIcon name="mapPin" size={11} />
                    {ciudadSeleccionada
                      ? `${ciudadSeleccionada}${departamentoSeleccionado ? `, ${departamentoSeleccionado}` : ""}`
                      : departamentoSeleccionado
                        ? `${departamentoSeleccionado}, ${paisNombre}`
                        : paisNombre
                    }
                  </span>
                )}
              </p>
              {paisSeleccionado && (
                <button
                  onClick={() => onCambiarUbicacion({ iso2: null, nombre: null, departamento: null, ciudad: null })}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: "1px solid #E2DBD5", background: "#fff", color: "#6B5E52", fontSize: 12, cursor: "pointer" }}
                >
                  <AppIcon name="x" size={11} /> Quitar filtro de zona
                </button>
              )}
            </div>
          )}

          {/* Skeletons */}
          {cargando && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 320, background: "#F0EBE5", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          )}

          {/* Grid */}
          {!cargando && negociosFiltrados.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {negociosFiltrados.map(negocio => (
                <BusinessCard key={negocio.id} negocio={negocio} onClick={() => onVerDetalle(negocio)} onAbrirAuth={onAbrirAuth} />
              ))}
            </div>
          )}

          {/* Vacío */}
          {!cargando && !error && negociosFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8988A" }}>
              <div style={{ marginBottom: 16 }}><AppIcon name="utensils" size={48} /></div>
              <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, color: "#6B5E52", marginBottom: 8 }}>
                {busqueda
                  ? `No encontramos "${busqueda}" aquí`
                  : paisSeleccionado
                    ? `No hay negocios en ${ciudadSeleccionada || paisNombre || paisSeleccionado} aún`
                    : "No hay negocios disponibles"
                }
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>
                {paisSeleccionado
                  ? "Prueba cambiando la zona desde el selector arriba."
                  : "Intenta con otras palabras: \"carne\", \"frito\", \"dulce\"…"
                }
              </p>
              <button
                className="btn-secondary"
                onClick={() => { onBusqueda(""); setCategoria("Todas"); onCambiarUbicacion({ iso2: null, nombre: null, departamento: null, ciudad: null }); }}
                style={{ marginTop: 20 }}
              >
                Ver todos los negocios
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}