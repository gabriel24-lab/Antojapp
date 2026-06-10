import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({
  onAbrirAuth,
  onVerFavoritos,
  onAbrirPanel,
  onAbrirFormulario,
  vistaActual,
  busqueda,
  onBusqueda,
  onIrInicio,
  onIrNegocios,
}) {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esPropietario = user?.rol === "negocio";

  const navBtn = (activo) => ({
    background: activo ? "rgba(232,70,10,.2)" : "none",
    color: activo ? "#E8460A" : "rgba(255,255,255,.7)",
    border: "none", padding: "6px 13px", borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <header style={{
      background: "#1A1208",
      position: "sticky", top: 0, zIndex: 100,
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px", height: 64,
        display: "flex", alignItems: "center", gap: 12,
      }}>

        {/* ── Logo ── */}
        <button
          onClick={onIrInicio}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <img src="/Antojapp icon.png" alt="Antojapp" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 19, color: "#fff", letterSpacing: "-0.5px" }}>
            Antoj<span style={{ color: "#E8460A" }}>app</span>
          </span>
        </button>

        {/* ── Links de navegación ── */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }}>
          <button style={navBtn(vistaActual === "home")} onClick={onIrInicio}>
            Inicio
          </button>
          <button style={navBtn(vistaActual === "negocios")} onClick={onIrNegocios}>
            Negocios
          </button>
        </nav>

        {/* ── Barra de búsqueda ── */}
        <div style={{ flex: 1, maxWidth: 380, position: "relative", margin: "0 8px" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 15, color: "#A8988A", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="Busca: carne, empanadas, jugos…"
            value={busqueda}
            onChange={e => onBusqueda(e.target.value)}
            onFocus={() => { if (vistaActual !== "home" && vistaActual !== "negocios") onIrInicio(); }}
            style={{
              width: "100%", height: 38,
              background: "rgba(255,255,255,.08)",
              border: "1.5px solid rgba(255,255,255,.12)",
              borderRadius: 50, color: "#fff",
              fontSize: 13, paddingLeft: 36, paddingRight: busqueda ? 36 : 14,
              outline: "none", transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onMouseOver={e => e.target.style.borderColor = "rgba(232,70,10,.5)"}
            onMouseOut={e => e.target.style.borderColor = document.activeElement === e.target ? "#E8460A" : "rgba(255,255,255,.12)"}
            onFocusCapture={e => e.target.style.borderColor = "#E8460A"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.12)"}
          />
          {busqueda && (
            <button
              onClick={() => onBusqueda("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#A8988A",
                fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 2,
              }}
            >×</button>
          )}
        </div>

        {/* ── Acciones derecha ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

          {/* Guardados — solo clientes */}
          {user && !esPropietario && (
            <button
              onClick={() => onVerFavoritos(true)}
              style={{
                ...navBtn(vistaActual === "favoritos"),
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 13px",
              }}
            >
              <span>♥</span> Guardados
            </button>
          )}

          {/* Mi Panel — solo propietarios */}
          {esPropietario && (
            <button
              onClick={onAbrirPanel}
              style={{
                ...navBtn(vistaActual === "panel"),
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 13px",
              }}
            >
              <span>📊</span> Mi panel
            </button>
          )}

          {/* Usuario */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.12)",
                  padding: "5px 11px", borderRadius: 8,
                  color: "#fff", fontSize: 14, cursor: "pointer",
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: esPropietario ? "#1A8C5B" : "#E8460A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {user.nombre?.charAt(0).toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.nombre}
                </span>
                <span style={{ opacity: 0.45, fontSize: 10 }}>▼</span>
              </button>

              {menuAbierto && (
                <>
                  {/* Overlay para cerrar */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 150 }}
                    onClick={() => setMenuAbierto(false)}
                  />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", borderRadius: 12, border: "1px solid #E2DBD5",
                    boxShadow: "0 8px 32px rgba(0,0,0,.14)",
                    minWidth: 210, overflow: "hidden", zIndex: 200,
                  }}>
                    {/* Info usuario */}
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid #F0EBE5" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>{user.nombre}</div>
                      <div style={{ fontSize: 12, color: "#A8988A", marginTop: 2 }}>{user.email}</div>
                      <div style={{
                        marginTop: 7, fontSize: 11, fontWeight: 700,
                        color: esPropietario ? "#1A8C5B" : "#E8460A",
                        background: esPropietario ? "#E8F6EE" : "#FFF0EB",
                        display: "inline-block", padding: "2px 9px", borderRadius: 10,
                      }}>
                        {esPropietario ? "🏪 Propietario" : "🍽️ Cliente"}
                      </div>
                    </div>

                    {esPropietario && (
                      <>
                        <button onClick={() => { onAbrirPanel(); setMenuAbierto(false); }} style={menuItem}>
                          📊 Mi panel de estadísticas
                        </button>
                        <button onClick={() => { onAbrirFormulario(); setMenuAbierto(false); }} style={menuItem}>
                          ✏️ Registrar / editar negocio
                        </button>
                      </>
                    )}

                    {user && !esPropietario && (
                      <button onClick={() => { onVerFavoritos(true); setMenuAbierto(false); }} style={menuItem}>
                        ♥ Mis guardados
                      </button>
                    )}

                    <button
                      onClick={() => { logout(); setMenuAbierto(false); }}
                      style={{ ...menuItem, color: "#C0392B", borderTop: "1px solid #F0EBE5" }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="btn-primary" onClick={onAbrirAuth} style={{ padding: "7px 18px", fontSize: 14 }}>
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const menuItem = {
  width: "100%", padding: "11px 16px", textAlign: "left",
  fontSize: 14, color: "#1A1208", fontWeight: 500,
  background: "none", border: "none", cursor: "pointer",
  borderBottom: "1px solid #F0EBE5", display: "block",
};