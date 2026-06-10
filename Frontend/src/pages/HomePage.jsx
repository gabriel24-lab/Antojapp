import { useState, useEffect, useCallback } from "react";
import BusinessCard from "../components/BusinessCard";
import API_URL from "../api";

export default function HomePage({ onVerDetalle, onAbrirAuth }) {
  const [negocios,     setNegocios]     = useState([]);
  const [categorias,   setCategorias]   = useState(["Todas"]);
  const [busqueda,     setBusqueda]     = useState("");
  const [categoria,    setCategoria]    = useState("Todas");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState("");

  // Cargar categorías una sola vez al montar
  useEffect(() => {
    fetch(`${API_URL}/negocios/categorias`)
      .then(r => r.json())
      .then(data => setCategorias(["Todas", ...data]))
      .catch(() => {});
  }, []);

  // Cargar negocios cada vez que cambian los filtros (con debounce en búsqueda)
  const cargarNegocios = useCallback(() => {
    setCargando(true);
    setError("");
    const params = new URLSearchParams();
    if (busqueda.trim())           params.set("busqueda",     busqueda.trim());
    if (categoria !== "Todas")     params.set("categoria",    categoria);
    if (soloAbiertos)              params.set("soloAbiertos", "true");

    fetch(`${API_URL}/negocios?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setNegocios(data))
      .catch(() => setError("No se pudo cargar los negocios. ¿Está corriendo el backend?"))
      .finally(() => setCargando(false));
  }, [busqueda, categoria, soloAbiertos]);

  // Debounce en búsqueda (espera 400ms después de que el usuario deja de escribir)
  useEffect(() => {
    const timer = setTimeout(cargarNegocios, busqueda ? 400 : 0);
    return () => clearTimeout(timer);
  }, [cargarNegocios, busqueda]);

  return (
    <main>
      {/* Hero */}
      <section style={{ background: "#1A1208", padding: "52px 20px 44px", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "2px", color: "#E8460A", textTransform: "uppercase", marginBottom: 14 }}>
            Descubre lo que está cerca
          </p>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 44px)",
            color: "#fff", lineHeight: 1.15, marginBottom: 16
          }}>
            ¿Qué se te antoja<br />
            <span style={{ color: "#E8460A" }}>hoy?</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", marginBottom: 28, lineHeight: 1.6 }}>
            Busca por antojo real: "carne jugosa", "algo dulce",<br />
            "desgranado" — no por nombre del restaurante.
          </p>

          {/* Barra de búsqueda */}
          <div style={{ position: "relative", maxWidth: 540, margin: "0 auto" }}>
            <span style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              fontSize: 18, color: "#A8988A", pointerEvents: "none"
            }}>🔍</span>
            <input
              className="input"
              type="text"
              placeholder="Ej: carne asada jugosa, empanadas, corozo…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                paddingLeft: 46, paddingRight: busqueda ? 40 : 14,
                fontSize: 15, borderRadius: 50, height: 52,
                boxShadow: "0 4px 20px rgba(0,0,0,.3)",
                border: "2px solid rgba(255,255,255,.1)"
              }}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", fontSize: 18,
                  color: "#A8988A", cursor: "pointer", lineHeight: 1
                }}
              >×</button>
            )}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2DBD5", position: "sticky", top: 60, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                style={{
                  flexShrink: 0,
                  padding: "7px 16px", borderRadius: 50, fontSize: 13, fontWeight: 500,
                  border: "1.5px solid",
                  borderColor: categoria === cat ? "#E8460A" : "#E2DBD5",
                  background:  categoria === cat ? "#E8460A" : "#fff",
                  color:       categoria === cat ? "#fff"    : "#6B5E52",
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap"
                }}
              >
                {cat}
              </button>
            ))}

            <div style={{ width: 1, height: 22, background: "#E2DBD5", flexShrink: 0, margin: "0 4px" }} />

            <button
              onClick={() => setSoloAbiertos(!soloAbiertos)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 500,
                border: "1.5px solid",
                borderColor: soloAbiertos ? "#1A8C5B" : "#E2DBD5",
                background:  soloAbiertos ? "#E8F6EE" : "#fff",
                color:       soloAbiertos ? "#1A8C5B" : "#6B5E52",
                cursor: "pointer", transition: "all 0.15s"
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: soloAbiertos ? "#1A8C5B" : "#A8988A",
                display: "inline-block"
              }} />
              Solo abiertos
            </button>
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Error de conexión */}
        {error && (
          <div style={{
            background: "#FDECEA", border: "1px solid #C0392B", borderRadius: 10,
            padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#C0392B"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Contador */}
        {!cargando && !error && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: "#6B5E52" }}>
              {busqueda
                ? <><strong style={{ color: "#1A1208" }}>"{busqueda}"</strong> — </>
                : ""}
              <strong style={{ color: "#1A1208" }}>{negocios.length}</strong>
              {negocios.length === 1 ? " negocio" : " negocios"}
            </span>
          </div>
        )}

        {/* Skeleton de carga */}
        {cargando && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card" style={{ height: 320, background: "#F0EBE5", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {/* Grid de negocios */}
        {!cargando && negocios.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {negocios.map(negocio => (
              <BusinessCard
                key={negocio.id}
                negocio={negocio}
                onClick={() => onVerDetalle(negocio)}
                onAbrirAuth={onAbrirAuth}
              />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && !error && negocios.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8988A" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, color: "#6B5E52", marginBottom: 8 }}>
              No encontramos "{busqueda}"
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>
              Intenta con otras palabras: "carne", "frito", "dulce"…
            </p>
            <button
              className="btn-secondary"
              onClick={() => { setBusqueda(""); setCategoria("Todas"); }}
              style={{ marginTop: 20 }}
            >
              Ver todos los negocios
            </button>
          </div>
        )}
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
