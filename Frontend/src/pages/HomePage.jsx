import { useState, useEffect, useCallback, useRef } from "react";
import BusinessCard from "../components/BusinessCard";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

export default function HomePage({ onVerDetalle, onAbrirAuth, busqueda, onBusqueda, modoNegocios }) {
  const [negocios,     setNegocios]     = useState([]);
  const [categorias,   setCategorias]   = useState(["Todas"]);
  const [categoria,    setCategoria]    = useState("Todas");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState("");
  const resultadosRef = useRef(null);

  // Scroll automático a resultados en modo "Negocios"
  useEffect(() => {
    if (modoNegocios && resultadosRef.current) {
      setTimeout(() => resultadosRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [modoNegocios]);

  // Cargar categorías una vez
  useEffect(() => {
    fetch(`${API_URL}/negocios/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(["Todas", ...data]))
      .catch(() => {});
  }, []);

  // Cargar negocios con debounce en búsqueda
  const cargarNegocios = useCallback(() => {
    setCargando(true); setError("");
    const p = new URLSearchParams();
    if (busqueda?.trim())      p.set("busqueda",     busqueda.trim());
    if (categoria !== "Todas") p.set("categoria",    categoria);
    if (soloAbiertos)          p.set("soloAbiertos", "true");
    fetch(`${API_URL}/negocios?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setNegocios(data))
      .catch(() => setError("No se pudo cargar los negocios. ¿Está corriendo el backend?"))
      .finally(() => setCargando(false));
  }, [busqueda, categoria, soloAbiertos]);

  useEffect(() => {
    const t = setTimeout(cargarNegocios, busqueda ? 380 : 0);
    return () => clearTimeout(t);
  }, [cargarNegocios, busqueda]);

  return (
    <div>
      {/* Hero — oculto en modo Negocios */}
      {!modoNegocios && (
        <section style={{ background: "#1A1208", padding: "52px 20px 44px", textAlign: "center" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "2px", color: "#E8460A", textTransform: "uppercase", marginBottom: 14 }}>
              Descubre lo que está cerca
            </p>
            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 44px)", color: "#fff", lineHeight: 1.15, marginBottom: 16,
            }}>
              ¿Qué se te antoja<br /><span style={{ color: "#E8460A" }}>hoy?</span>
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
              Busca por antojo real: "carne jugosa", "algo dulce",<br />"desgranado" — no por nombre del restaurante.
            </p>
            {/* Barra hero */}
            <div style={{ position: "relative", maxWidth: 540, margin: "0 auto" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#A8988A", pointerEvents: "none" }}>
                <AppIcon name="search" size={19} />
              </span>
              <input
                className="input" type="text"
                placeholder="Ej: carne asada, empanadas, corozo…"
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

      {/* Filtros sticky */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2DBD5", position: "sticky", top: 64, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
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

      {/* Resultados */}
      <section ref={resultadosRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>
        {error && (
          <div style={{ background: "#FDECEA", border: "1px solid #C0392B", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#C0392B", display: "flex", alignItems: "center", gap: 8 }}>
            <AppIcon name="alert" size={18} /> {error}
          </div>
        )}
        {!cargando && !error && (
          <p style={{ fontSize: 14, color: "#6B5E52", marginBottom: 20 }}>
            {busqueda ? <><strong style={{ color: "#1A1208" }}>"{busqueda}"</strong> — </> : ""}
            <strong style={{ color: "#1A1208" }}>{negocios.length}</strong> {negocios.length === 1 ? "negocio" : "negocios"}
          </p>
        )}
        {cargando && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 320, background: "#F0EBE5", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}
        {!cargando && negocios.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {negocios.map(negocio => (
              <BusinessCard key={negocio.id} negocio={negocio} onClick={() => onVerDetalle(negocio)} onAbrirAuth={onAbrirAuth} />
            ))}
          </div>
        )}
        {!cargando && !error && negocios.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8988A" }}>
            <div style={{ marginBottom: 16 }}><AppIcon name="utensils" size={48} /></div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, color: "#6B5E52", marginBottom: 8 }}>
              {busqueda ? `No encontramos "${busqueda}"` : "No hay negocios disponibles"}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>Intenta con otras palabras: "carne", "frito", "dulce"…</p>
            <button className="btn-secondary" onClick={() => { onBusqueda(""); setCategoria("Todas"); }} style={{ marginTop: 20 }}>
              Ver todos los negocios
            </button>
          </div>
        )}
      </section>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}
