import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BusinessCard from "../components/BusinessCard";
import API_URL from "../api";

export default function FavoritosPage({ onVerDetalle, onAbrirAuth }) {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    setCargando(true);
    fetch(`${API_URL}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setNegocios(data))
      .catch(() => setNegocios([]))
      .finally(() => setCargando(false));
  }, [user]);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>♥</div>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, color: "#1A1208", marginBottom: 10 }}>
          Guarda tus antojos favoritos
        </h2>
        <p style={{ fontSize: 15, color: "#6B5E52", marginBottom: 24, lineHeight: 1.6 }}>
          Crea una cuenta para guardar negocios y compartir<br />tu lista con quien quieras.
        </p>
        <button className="btn-primary" onClick={onAbrirAuth}>
          Crear cuenta gratis
        </button>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: "#1A1208", marginBottom: 6 }}>
          Tus guardados
        </h1>
        <p style={{ fontSize: 14, color: "#6B5E52" }}>
          {cargando
            ? "Cargando..."
            : negocios.length === 0
              ? "Aún no has guardado ningún negocio."
              : `${negocios.length} ${negocios.length === 1 ? "negocio guardado" : "negocios guardados"}`}
        </p>
      </div>

      {cargando && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: 320, background: "#F0EBE5", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      )}

      {!cargando && negocios.length > 0 && (
        <>
          {/* Botón compartir */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#FFF0EB", border: "1px solid #E8460A22",
            borderRadius: 12, padding: "12px 16px", marginBottom: 24
          }}>
            <div style={{ fontSize: 14, color: "#6B5E52" }}>
              Comparte tu lista de antojos por WhatsApp
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: 13, padding: "8px 16px" }}
              onClick={() => {
                const texto = `Mis lugares favoritos en Antojapp:\n${negocios.map(n => `• ${n.nombre}`).join("\n")}\n\nDescúbrelos en antojapp.co`;
                window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
              }}
            >
              📲 Compartir en WhatsApp
            </button>
          </div>

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
        </>
      )}

      {!cargando && negocios.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#A8988A" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p style={{ fontSize: 15 }}>
            Toca el <span style={{ color: "#E8460A" }}>♥</span> en cualquier negocio para guardarlo aquí.
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
