import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BusinessCard from "../components/BusinessCard";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

export default function FavoritosPage({ onVerDetalle, onAbrirAuth }) {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCargando(true);
    fetch(`${API_URL}/favoritos`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNegocios(data))
      .catch(() => setNegocios([]))
      .finally(() => setCargando(false));
  }, [user]);

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ marginBottom: 16, color: "var(--brand)" }}>
          <AppIcon name="heart" size={52} fill="currentColor" />
        </div>
        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 22,
            color: "var(--text-1)",
            marginBottom: 10,
          }}
        >
          Guarda tus antojos favoritos
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-2)",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Crea una cuenta para guardar negocios y compartir
          <br />
          tu lista con quien quieras.
        </p>
        <button className="btn-primary" onClick={onAbrirAuth}>
          Crear cuenta gratis
        </button>
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px var(--content-px, 16px) 80px",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: "var(--text-1)",
            marginBottom: 6,
          }}
        >
          Tus guardados
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)" }}>
          {cargando
            ? "Cargando..."
            : negocios.length === 0
              ? "Aún no has guardado ningún negocio."
              : `${negocios.length} ${negocios.length === 1 ? "negocio guardado" : "negocios guardados"}`}
        </p>
      </div>

      {cargando && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(290px, 100%), 1fr))",
            gap: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card"
              style={{
                height: 320,
                background: "#F0EBE5",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      )}

      {!cargando && negocios.length > 0 && (
        <>
          {/* Botón compartir */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              background: "var(--brand-light)",
              border: "1px solid #E8460A22",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 14, color: "var(--text-2)" }}>
              Comparte tu lista de antojos por WhatsApp
            </div>
            <button
              className="btn-primary"
              style={{ fontSize: 13, padding: "8px 16px" }}
              onClick={() => {
                const texto = `Mis lugares favoritos en Antojapp:\n${negocios.map((n) => `• ${n.nombre}`).join("\n")}\n\nDescúbrelos en antojapp.co`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(texto)}`,
                  "_blank",
                );
              }}
            >
              <AppIcon name="share" size={16} /> Compartir en WhatsApp
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(290px, 100%), 1fr))",
              gap: 16,
            }}
          >
            {negocios.map((negocio) => (
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
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-3)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <AppIcon name="utensils" size={48} />
          </div>
          <p style={{ fontSize: 15 }}>
            Toca el{" "}
            <AppIcon
              name="heart"
              size={16}
              color="var(--brand)"
              fill="currentColor"
            />{" "}
            en cualquier negocio para guardarlo aquí.
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
