import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onAbrirAuth, onVerFavoritos, vistaActual }) {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header style={{
      background: "#1A1208",
      position: "sticky", top: 0, zIndex: 100,
      borderBottom: "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        {/* Logo */}
        <button
          onClick={() => onVerFavoritos(false)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
        >
          <img
            src="/Antojapp icon.png"
            alt="Antojapp"
            style={{ width: 84, height: 84, borderRadius: 8, objectFit: "cover" }}
          />
          <span style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20,
            color: "#fff", letterSpacing: "-0.5px"
          }}>
            Antoj<span style={{ color: "#E8460A" }}>app</span>
          </span>
        </button>

        {/* Acciones */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user && (
            <button
              onClick={() => onVerFavoritos(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: vistaActual === "favoritos" ? "rgba(232,70,10,.25)" : "rgba(255,255,255,.07)",
                color: vistaActual === "favoritos" ? "#E8460A" : "rgba(255,255,255,.75)",
                border: "none", padding: "7px 14px", borderRadius: 8,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                transition: "background 0.18s"
              }}
            >
              <span>♥</span> Guardados
            </button>
          )}

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.12)",
                  padding: "6px 12px", borderRadius: 8,
                  color: "#fff", fontSize: 14, cursor: "pointer"
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#E8460A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff"
                }}>
                  {user.nombre?.charAt(0).toUpperCase()}
                </div>
                <span>{user.nombre}</span>
                <span style={{ opacity: 0.5, fontSize: 10 }}>▼</span>
              </button>

              {menuAbierto && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "#fff", borderRadius: 10, border: "1px solid #E2DBD5",
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                  minWidth: 180, overflow: "hidden", zIndex: 200
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0EBE5" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>{user.nombre}</div>
                    <div style={{ fontSize: 12, color: "#A8988A", marginTop: 2 }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => { logout(); setMenuAbierto(false); }}
                    style={{
                      width: "100%", padding: "11px 16px", textAlign: "left",
                      fontSize: 14, color: "#C0392B", fontWeight: 500,
                      background: "none", border: "none", cursor: "pointer"
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary" onClick={onAbrirAuth} style={{ padding: "8px 18px", fontSize: 14 }}>
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}