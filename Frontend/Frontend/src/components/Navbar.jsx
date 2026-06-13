import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import AppIcon from "./AppIcon";
import NavLocationPicker from "./NavLocationPicker";

export default function Navbar({
  onAbrirAuth, onVerFavoritos, onAbrirPanel,
  onAbrirFormulario, vistaActual,
  busqueda, onBusqueda, onIrInicio, onIrNegocios,
  // Props de ubicación
  paisSeleccionado, paisNombre, departamentoSeleccionado, ciudadSeleccionada,
  onCambiarUbicacion,
  // Datos de negocios del propietario (para controlar el límite)
  totalNegociosPropietario,
  limiteNegocios,
}) {
  const { user, logout } = useAuth();
  const [menuAbierto,       setMenuAbierto]       = useState(false);
  const [compacto,          setCompacto]          = useState(false);
  const [confirmarLogout,   setConfirmarLogout]   = useState(false);
  const prevScrollY = useRef(0);
  const esPropietario = user?.rol === "negocio";

  const limiteAlcanzado = totalNegociosPropietario >= (limiteNegocios ?? 4);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setCompacto(y > 60);
      prevScrollY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navH    = compacto ? 50 : 64;
  const bgAlpha = compacto ? "rgba(26,18,8,0.82)" : "#1A1208";

  const navLinkStyle = (activo) => ({
    background: activo ? "rgba(232,70,10,.18)" : "none",
    color: activo ? "#E8460A" : "rgba(255,255,255,.72)",
    border: "none", padding: "6px 13px", borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  });

  const handleAgregarNegocio = () => {
    if (limiteAlcanzado) {
      alert(`Has alcanzado el límite de ${limiteNegocios ?? 4} negocios. No puedes registrar más.`);
      return;
    }
    onAbrirFormulario();
    setMenuAbierto(false);
  };

  return (
    <header style={{
      background: bgAlpha,
      backdropFilter: compacto ? "blur(12px)" : "none",
      WebkitBackdropFilter: compacto ? "blur(12px)" : "none",
      position: "sticky", top: 0, zIndex: 100,
      borderBottom: `1px solid rgba(255,255,255,${compacto ? 0.1 : 0.07})`,
      transition: "background 0.3s, height 0.3s",
      height: navH,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px", height: "100%",
        display: "flex", alignItems: "center", gap: 10,
      }}>

        {/* ── 1. Selector de ubicación (estilo Rappi) — izquierda del logo ── */}
        <NavLocationPicker
          paisSeleccionado={paisSeleccionado}
          paisNombre={paisNombre}
          departamentoSeleccionado={departamentoSeleccionado}
          ciudadSeleccionada={ciudadSeleccionada}
          onCambiar={onCambiarUbicacion}
        />

        {/* Divisor sutil */}
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,.12)", flexShrink: 0 }} />

        {/* ── 2. Logo ── */}
        <button
          onClick={onIrInicio}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <img
            src="/Antojapp icon.png" alt="Antojapp"
            style={{
              width: compacto ? 28 : 34, height: compacto ? 28 : 34,
              borderRadius: 7, objectFit: "cover",
              transition: "width 0.3s, height 0.3s",
            }}
          />
          <span style={{
            fontFamily: "'Manrope', sans-serif", fontWeight: 700,
            fontSize: compacto ? 17 : 19, color: "#fff", letterSpacing: "-0.5px",
            transition: "font-size 0.3s",
          }}>
            Antoj<span style={{ color: "#E8460A" }}>app</span>
          </span>
        </button>

        {/* ── 3. Links de navegación ── */}
        <nav style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button style={navLinkStyle(vistaActual === "home")} onClick={onIrInicio}>Inicio</button>
          <button style={navLinkStyle(vistaActual === "negocios")} onClick={onIrNegocios}>Negocios</button>
        </nav>

        {/* ── 4. Barra de búsqueda ── */}
        <div style={{ flex: 1, maxWidth: 380, position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 14, color: "#A8988A", pointerEvents: "none",
          }}><AppIcon name="search" size={15} /></span>
          <input
            type="text"
            placeholder="Carne, empanadas, jugos…"
            value={busqueda}
            onChange={e => onBusqueda(e.target.value)}
            onFocus={() => { if (vistaActual !== "home" && vistaActual !== "negocios") onIrInicio(); }}
            style={{
              width: "100%", height: compacto ? 34 : 38,
              background: "rgba(255,255,255,.09)",
              border: "1.5px solid rgba(255,255,255,.13)",
              borderRadius: 50, color: "#fff",
              fontSize: 13, paddingLeft: 34, paddingRight: busqueda ? 34 : 12,
              outline: "none", boxSizing: "border-box",
              transition: "height 0.3s, border-color 0.15s",
            }}
            onFocus={e => { e.target.style.borderColor = "#E8460A"; if (vistaActual !== "home" && vistaActual !== "negocios") onIrInicio(); }}
            onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,.13)"; }}
          />
          {busqueda && (
            <button
              onClick={() => onBusqueda("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#A8988A",
                fontSize: 17, cursor: "pointer", lineHeight: 1, padding: 2,
              }}
            >×</button>
          )}
        </div>

        {/* ── 5. Acciones derecha ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

          {user && !esPropietario && (
            <button
              onClick={() => onVerFavoritos(true)}
              style={{ ...navLinkStyle(vistaActual === "favoritos"), display: "flex", alignItems: "center", gap: 5 }}
            >
              <AppIcon name="heart" size={15} fill="currentColor" /> Guardados
            </button>
          )}

          {esPropietario && (
            <button
              onClick={onAbrirPanel}
              style={{ ...navLinkStyle(vistaActual === "panel"), display: "flex", alignItems: "center", gap: 5 }}
            >
              <AppIcon name="barChart" size={15} /> Mi panel
            </button>
          )}

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuAbierto(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.13)",
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
                <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.nombre}
                </span>
                <AppIcon
                  name="chevronDown"
                  size={14}
                  style={{ opacity: 0.4, transition: "transform 0.2s", transform: menuAbierto ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {menuAbierto && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setMenuAbierto(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", borderRadius: 12, border: "1px solid #E2DBD5",
                    boxShadow: "0 8px 32px rgba(0,0,0,.15)",
                    minWidth: 210, overflow: "hidden", zIndex: 200,
                    animation: "menuSlide 0.18s ease",
                  }}>
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid #F0EBE5" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>{user.nombre}</div>
                      <div style={{ fontSize: 12, color: "#A8988A", marginTop: 2 }}>{user.email}</div>
                      <div style={{
                        marginTop: 6, fontSize: 11, fontWeight: 700,
                        color: esPropietario ? "#1A8C5B" : "#E8460A",
                        background: esPropietario ? "#E8F6EE" : "#FFF0EB",
                        display: "inline-block", padding: "2px 8px", borderRadius: 10,
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <AppIcon name={esPropietario ? "store" : "utensils"} size={12} />
                          {esPropietario ? "Propietario" : "Cliente"}
                        </span>
                      </div>
                    </div>

                    {esPropietario && (
                      <>
                        <MenuBtn onClick={() => { onAbrirPanel(); setMenuAbierto(false); }} icon="barChart">
                          Mi panel
                        </MenuBtn>
                        <MenuBtn onClick={handleAgregarNegocio} icon="plusCircle" disabled={limiteAlcanzado}>
                          Agregar negocio
                        </MenuBtn>
                      </>
                    )}
                    {user && !esPropietario && (
                      <MenuBtn onClick={() => { onVerFavoritos(true); setMenuAbierto(false); }} icon="heart">
                        Mis guardados
                      </MenuBtn>
                    )}
                    <MenuBtn onClick={() => { setMenuAbierto(false); setConfirmarLogout(true); }} danger>Cerrar sesión</MenuBtn>
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

      {/* ── Diálogo de confirmación de cierre de sesión ── */}
      {confirmarLogout && (
        <div
          onClick={() => setConfirmarLogout(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(26,18,8,.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 18, width: "100%", maxWidth: 360,
              boxShadow: "0 24px 60px rgba(0,0,0,.2)",
              overflow: "hidden", animation: "logoutIn .22s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            {/* Icono */}
            <div style={{
              background: "linear-gradient(135deg, #1A1208, #2D1F0F)",
              padding: "28px 24px 22px", textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(232,70,10,.15)", border: "2px solid rgba(232,70,10,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <AppIcon name="partyPopper" size={26} color="#E8460A" />
              </div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>
                ¿Cerrar sesión?
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                Hola, <strong style={{ color: "rgba(255,255,255,.8)" }}>{user?.nombre?.split(" ")[0]}</strong>. ¿Seguro que quieres salir?
              </div>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: "100%", background: "#C0392B", fontSize: 15 }}
                onClick={() => { logout(); setConfirmarLogout(false); }}
              >
                Sí, cerrar sesión
              </button>
              <button
                className="btn-secondary"
                style={{ width: "100%", fontSize: 15 }}
                onClick={() => setConfirmarLogout(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes menuSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoutIn {
          from { opacity: 0; transform: scale(.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </header>
  );
}

function MenuBtn({ children, onClick, danger, icon, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "11px 16px", textAlign: "left",
        fontSize: 14, fontWeight: 500,
        color: danger ? "#C0392B" : disabled ? "#C0B8B0" : "#1A1208",
        background: hover && !disabled ? (danger ? "#FFF0EE" : "#F7F4F1") : "none",
        border: "none", borderTop: danger ? "1px solid #F0EBE5" : "none",
        borderBottom: danger ? "none" : "1px solid #F0EBE5",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        display: "flex", alignItems: "center", gap: 9,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <AppIcon name={icon} size={16} fill={icon === "heart" ? "currentColor" : "none"} />}
      {children}
    </button>
  );
}