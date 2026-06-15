import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BusinessCard from "../components/BusinessCard";
import AppIcon from "../components/AppIcon";
import API_URL from "../api";

export default function PerfilPage({ onVerDetalle, onAbrirPanel, onIrInicio, onEditarPerfil }) {
  const { user, logout } = useAuth();
  const [negociosGuardados, setNegociosGuardados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const esPropietario = user?.rol === "negocio";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user || esPropietario) return;
    setCargando(true);
    fetch(`${API_URL}/favoritos`, {
      credentials: "include"
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setNegociosGuardados(data))
      .catch(() => setNegociosGuardados([]))
      .finally(() => setCargando(false));
  }, [user, esPropietario]);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, color: "var(--text-1)" }}>
          Cargando perfil...
        </h2>
      </div>
    );
  }

  return (
    <main style={{ 
      maxWidth: 900, 
      margin: "0 auto", 
      padding: "32px var(--content-px, 16px) 80px",
      animation: "fadeUp 0.4s ease-out forwards"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        marginBottom: 40,
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decoración de fondo */}
        <div style={{
          position: "absolute", top: -50, right: -50,
          width: 150, height: 150, borderRadius: "50%",
          background: esPropietario ? "var(--green)" : "var(--brand)",
          opacity: 0.1, filter: "blur(40px)", pointerEvents: "none"
        }} />

        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: user.foto_perfil ? `url(${user.foto_perfil}) center/cover` : (esPropietario ? "var(--green)" : "var(--brand)"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, fontWeight: 800, color: "var(--surface)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          marginBottom: 16,
          zIndex: 1
        }}>
          {!user.foto_perfil && user.nombre?.charAt(0).toUpperCase()}
        </div>
        
        <h1 style={{ 
          fontFamily: "'Manrope', sans-serif", 
          fontWeight: 800, 
          fontSize: 28, 
          color: "var(--surface)", 
          marginBottom: 4,
          zIndex: 1
        }}>
          {user.nombre}
        </h1>
        
        <p style={{ fontSize: 15, color: "var(--text-3)", marginBottom: 12, zIndex: 1 }}>
          {user.email}
        </p>

        <div style={{
          fontSize: 12, fontWeight: 700,
          color: esPropietario ? "var(--green)" : "var(--brand)",
          background: esPropietario ? "var(--green-bg)" : "var(--brand-light)",
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 12,
          zIndex: 1, marginBottom: 24
        }}>
          <AppIcon name={esPropietario ? "store" : "utensils"} size={14} />
          {esPropietario ? "Propietario" : "Cliente"}
        </div>

        <div style={{ display: "flex", gap: 12, zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
          {esPropietario && (
            <button 
              className="btn-primary" 
              onClick={onAbrirPanel}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
            >
              <AppIcon name="barChart" size={16} /> Ir a mi panel
            </button>
          )}
          <button 
            className="btn-secondary" 
            onClick={onEditarPerfil}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
          >
            <AppIcon name="edit" size={16} /> Editar perfil
          </button>
        </div>
      </div>

      {!esPropietario && (
        <div style={{ animation: "fadeUp 0.5s ease-out forwards", opacity: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <AppIcon name="heart" size={24} color="var(--brand)" fill="currentColor" />
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-1)" }}>
              Tus guardados
            </h2>
          </div>

          {cargando && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 16 }}>
              {[1, 2].map(i => (
                <div key={i} className="card" style={{ height: 320, background: "#F0EBE5", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          )}

          {!cargando && negociosGuardados.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: 16 }}>
              {negociosGuardados.map(negocio => (
                <BusinessCard
                  key={negocio.id}
                  negocio={negocio}
                  onClick={() => onVerDetalle(negocio)}
                  onAbrirAuth={() => {}}
                />
              ))}
            </div>
          )}

          {!cargando && negociosGuardados.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              background: "rgba(255,255,255,0.02)", 
              borderRadius: 16,
              border: "1px dashed rgba(255,255,255,0.1)"
            }}>
              <div style={{ marginBottom: 12, color: "var(--text-3)" }}>
                <AppIcon name="utensils" size={40} />
              </div>
              <p style={{ fontSize: 15, color: "var(--text-3)", marginBottom: 16 }}>
                Aún no has guardado ningún negocio.
              </p>
              <button className="btn-secondary" onClick={onIrInicio}>
                Explorar negocios
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}