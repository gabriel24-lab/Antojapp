import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useUbicacionContext } from "../context/UbicacionContext";
import AppIcon from "./AppIcon";
import NavLocationPicker from "./NavLocationPicker";

export default function Navbar({
  onAbrirAuth, onVerFavoritos, onAbrirPanel,
  onAbrirPerfil, onAbrirFormulario, vistaActual,
  busqueda, onBusqueda, onIrInicio, onIrNegocios,
  totalNegociosPropietario,
  limiteNegocios,
}) {
  const { user, logout } = useAuth();
  const { pais, departamento, ciudad, cambiarUbicacion } = useUbicacionContext();

  // Adaptar al shape que NavLocationPicker y el JSX interno esperan
  const paisSeleccionado         = pais?.iso2         ?? null;
  const paisNombre               = pais?.nombre       ?? null;
  const departamentoSeleccionado = departamento;
  const ciudadSeleccionada       = ciudad;
  const onCambiarUbicacion       = cambiarUbicacion;
  const [menuAbierto,     setMenuAbierto]     = useState(false);
  const [menuMovil,       setMenuMovil]       = useState(false);
  const [compacto,        setCompacto]        = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const [busquedaMovil,   setBusquedaMovil]   = useState(false);
  const prevScrollY = useRef(0);
  const locationPickerMovilRef = useRef(null);
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

  // Cerrar menú móvil al cambiar vista
  useEffect(() => { setMenuMovil(false); setBusquedaMovil(false); }, [vistaActual]);

  // Bloquear scroll cuando menú móvil abierto
  useEffect(() => {
    document.body.style.overflow = menuMovil ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuMovil]);

  const navH    = compacto ? 50 : 64;
  const bgAlpha = compacto ? "rgba(26,18,8,0.92)" : "var(--text-1)";

  const navLinkStyle = (activo) => ({
    background: activo ? "rgba(232,70,10,.18)" : "none",
    color: activo ? "var(--brand)" : "rgba(255,255,255,.72)",
    border: "none", padding: "6px 13px", borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  });

  const handleAgregarNegocio = () => {
    if (limiteAlcanzado) {
      alert(`Has alcanzado el límite de ${limiteNegocios ?? 4} negocios.`);
      return;
    }
    onAbrirFormulario();
    setMenuAbierto(false);
    setMenuMovil(false);
  };

  return (
    <>
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
          padding: "0 16px", height: "100%",
          display: "flex", alignItems: "center", gap: 8,
        }}>

          {/* ── Móvil: botón hamburguesa ── */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuMovil(v => !v)}
            aria-label="Menú"
            style={{
              display: "none",
              alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 8,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "var(--surface)", flexShrink: 0,
            }}
          >
            <AppIcon name={menuMovil ? "x" : "menu"} size={20} />
          </button>

          {/* ── Logo ── */}
          <button
            onClick={onIrInicio}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
          >
            <img
              src="/icon-56.png" alt="Antojapp"
              style={{
                width: compacto ? 26 : 32, height: compacto ? 26 : 32,
                borderRadius: 7, objectFit: "cover",
                transition: "width 0.3s, height 0.3s",
              }}
            />
            <span style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 700,
              fontSize: compacto ? 16 : 18, color: "var(--surface)", letterSpacing: "-0.5px",
              transition: "font-size 0.3s",
            }} className="logo-text">
              Antoj<span style={{ color: "var(--brand)" }}>app</span>
            </span>
          </button>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,.12)", flexShrink: 0, margin: "0 4px" }} className="nav-divider-desktop" />

          {/* ── Botón de ubicación visible en móvil ── */}
          <button
            className="nav-location-mobile-btn"
            onClick={() => locationPickerMovilRef.current?.abrir()}
            aria-label="Cambiar ubicación: presiona para elegir país, departamento y ciudad"
            style={{
              display: "none",
              alignItems: "center", justifyContent: "center",
              gap: 4,
              height: 34, borderRadius: 8,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "var(--surface)", flexShrink: 0,
              padding: "0 8px",
              fontSize: 11, fontWeight: 600,
              maxWidth: 110, overflow: "hidden",
            }}
          >
            <AppIcon name="mapPin" size={13} color="var(--brand)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,.8)" }}>
              {ciudadSeleccionada || paisNombre || "Ubicación"}
            </span>
          </button>

          {/* Picker sin botón visible: lo abre el botón de arriba en móvil */}
          <NavLocationPicker
            ref={locationPickerMovilRef}
            renderTrigger={false}
            paisSeleccionado={paisSeleccionado}
            paisNombre={paisNombre}
            departamentoSeleccionado={departamentoSeleccionado}
            ciudadSeleccionada={ciudadSeleccionada}
            onCambiar={onCambiarUbicacion}
          />

          {/* ── Selector de ubicación — oculto en móvil (va en menú) ── */}
          <div className="nav-location-desktop">
            <NavLocationPicker
              paisSeleccionado={paisSeleccionado}
              paisNombre={paisNombre}
              departamentoSeleccionado={departamentoSeleccionado}
              ciudadSeleccionada={ciudadSeleccionada}
              onCambiar={onCambiarUbicacion}
            />
          </div>

          {/* ── Links de navegación — solo desktop ── */}
          <nav className="nav-links-desktop" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button style={navLinkStyle(vistaActual === "home")} onClick={onIrInicio}>Inicio</button>
            <button style={navLinkStyle(vistaActual === "negocios")} onClick={onIrNegocios}>Negocios</button>
          </nav>

          {/* ── Buscador: expandible en móvil ── */}
          <div style={{ flex: 1, maxWidth: 380, position: "relative" }} className={`nav-search${busquedaMovil ? " nav-search--open" : ""}`}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, color: "var(--text-3)", pointerEvents: "none",
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
                borderRadius: 50, color: "var(--surface)",
                fontSize: 13, paddingLeft: 34, paddingRight: busqueda ? 34 : 12,
                outline: "none", boxSizing: "border-box",
                transition: "height 0.3s, border-color 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--brand)"; if (vistaActual !== "home" && vistaActual !== "negocios") onIrInicio(); }}
              onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,.13)"; }}
            />
            {busqueda && (
              <button
                onClick={() => onBusqueda("")}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-3)",
                  fontSize: 17, cursor: "pointer", lineHeight: 1, padding: 2,
                }}
              >×</button>
            )}
          </div>

          {/* ── Botón lupa en móvil ── */}
          <button
            className="nav-search-btn-mobile"
            onClick={() => setBusquedaMovil(v => !v)}
            style={{
              display: "none",
              alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 8,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "var(--surface)", flexShrink: 0,
            }}
            aria-label="Buscar"
          >
            <AppIcon name={busquedaMovil ? "x" : "search"} size={18} />
          </button>

          {/* ── Acciones derecha — desktop ── */}
          <div className="nav-actions-desktop" style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

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
                    color: "var(--surface)", fontSize: 14, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: esPropietario ? "var(--green)" : "var(--brand)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "var(--surface)", flexShrink: 0,
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
                      background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,.15)",
                      minWidth: 210, overflow: "hidden", zIndex: 200,
                      animation: "menuSlide 0.18s ease",
                    }}>
                      <UserMenuContent
                        user={user}
                        esPropietario={esPropietario}
                        limiteAlcanzado={limiteAlcanzado}
                        onPanel={() => { onAbrirPanel(); setMenuAbierto(false); }}
                        onPerfil={() => { onAbrirPerfil(); setMenuAbierto(false); }}
                        onAgregar={handleAgregarNegocio}
                        onFavoritos={() => { onVerFavoritos(true); setMenuAbierto(false); }}
                        onLogout={() => { setMenuAbierto(false); setConfirmarLogout(true); }}
                      />
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

          {/* ── Avatar compacto en móvil (solo cuando hay sesión) ── */}
          {user && (
            <div className="nav-avatar-mobile-group" style={{ display: "none", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setMenuMovil(v => !v)}
                aria-label="Abrir menú de cuenta"
                style={{
                  display: "flex",
                  width: 34, height: 34, borderRadius: "50%",
                  background: esPropietario ? "var(--green)" : "var(--brand)",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "var(--surface)", flexShrink: 0,
                  border: "none", cursor: "pointer",
                }}
              >
                {user.nombre?.charAt(0).toUpperCase()}
              </button>
              <button
                onClick={() => setConfirmarLogout(true)}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                style={{
                  display: "flex",
                  width: 34, height: 34, borderRadius: 8,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.12)",
                  alignItems: "center", justifyContent: "center",
                  color: "var(--surface)", flexShrink: 0, cursor: "pointer",
                }}
              >
                <AppIcon name="logOut" size={16} />
              </button>
            </div>
          )}

          {/* ── Botón "Ingresar" en móvil sin sesión ── */}
          {!user && (
            <button
              className="nav-login-mobile"
              onClick={onAbrirAuth}
              style={{
                display: "none",
                background: "var(--brand)", color: "var(--surface)",
                fontSize: 13, fontWeight: 600, padding: "6px 14px",
                borderRadius: 8, border: "none", flexShrink: 0,
              }}
            >
              Entrar
            </button>
          )}

        </div>

        {/* ── Barra de búsqueda expandida (móvil) ── */}
        <div className={`mobile-search-bar${busquedaMovil ? " mobile-search-bar--open" : ""}`}
          style={{
            background: "var(--text-1)",
            padding: busquedaMovil ? "0 16px 12px" : "0 16px",
            maxHeight: busquedaMovil ? "60px" : "0",
            overflow: "hidden",
            transition: "max-height 0.25s ease, padding 0.25s ease",
          }}
        >
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Carne, empanadas, jugos…"
              value={busqueda}
              onChange={e => { onBusqueda(e.target.value); if (vistaActual !== "home" && vistaActual !== "negocios") onIrInicio(); }}
              style={{
                width: "100%", height: 40,
                background: "rgba(255,255,255,.09)",
                border: "1.5px solid rgba(255,255,255,.2)",
                borderRadius: 50, color: "var(--surface)",
                fontSize: 14, paddingLeft: 36, paddingRight: busqueda ? 36 : 14,
                outline: "none",
              }}
            />
            {busqueda && (
              <button onClick={() => onBusqueda("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", fontSize: 17, cursor: "pointer" }}>×</button>
            )}
          </div>
        </div>
      </header>

      {/* ── Panel lateral móvil ── */}
      {menuMovil && (
        <>
          <div
            onClick={() => setMenuMovil(false)}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,18,8,.6)", backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: "min(300px, 85vw)",
            background: "var(--surface)", zIndex: 400,
            display: "flex", flexDirection: "column",
            animation: "slideInLeft 0.22s cubic-bezier(.34,1.2,.64,1)",
            overflowY: "auto",
          }}>
            {/* Header del panel */}
            <div style={{
              background: "var(--text-1)",
              padding: "20px 16px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <button onClick={onIrInicio} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
                onClick={() => { onIrInicio(); setMenuMovil(false); }}>
                <img src="/icon-56.png" alt="Antojapp" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--surface)" }}>
                  Antoj<span style={{ color: "var(--brand)" }}>app</span>
                </span>
              </button>
              <button onClick={() => setMenuMovil(false)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, color: "var(--surface)" }}>
                <AppIcon name="x" size={18} />
              </button>
            </div>

            {/* Ubicación en móvil */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0EBE5" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: "1px", marginBottom: 8 }}>UBICACIÓN</div>
              <NavLocationPicker
                paisSeleccionado={paisSeleccionado}
                paisNombre={paisNombre}
                departamentoSeleccionado={departamentoSeleccionado}
                ciudadSeleccionada={ciudadSeleccionada}
                onCambiar={(loc) => { onCambiarUbicacion(loc); setMenuMovil(false); }}
              />
            </div>

            {/* Navegación */}
            <div style={{ padding: "10px 8px", borderBottom: "1px solid #F0EBE5" }}>
              <MobileNavBtn icon="home" activo={vistaActual === "home"} onClick={() => { onIrInicio(); setMenuMovil(false); }}>Inicio</MobileNavBtn>
              <MobileNavBtn icon="grid" activo={vistaActual === "negocios"} onClick={() => { onIrNegocios(); setMenuMovil(false); }}>Negocios</MobileNavBtn>
              {user && (
                <MobileNavBtn icon="user" activo={vistaActual === "perfil"} onClick={() => { onAbrirPerfil(); setMenuMovil(false); }}>Mi perfil</MobileNavBtn>
              )}
              {user && !esPropietario && (
                <MobileNavBtn icon="heart" activo={vistaActual === "favoritos"} onClick={() => { onVerFavoritos(true); setMenuMovil(false); }}>Mis guardados</MobileNavBtn>
              )}
              {esPropietario && (
                <>
                  <MobileNavBtn icon="barChart" activo={vistaActual === "panel"} onClick={() => { onAbrirPanel(); setMenuMovil(false); }}>Mi panel</MobileNavBtn>
                  <MobileNavBtn icon="plusCircle" disabled={limiteAlcanzado} onClick={handleAgregarNegocio}>Agregar negocio</MobileNavBtn>
                </>
              )}
              {!user && (
                <MobileNavBtn icon="logOut" onClick={() => { onAbrirAuth(); setMenuMovil(false); }}>Iniciar sesión</MobileNavBtn>
              )}
            </div>

            {/* Usuario */}
            {user && (
              <div style={{ padding: "10px 8px" }}>
                <div style={{ padding: "12px 10px", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: esPropietario ? "var(--green)" : "var(--brand)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, color: "var(--surface)", flexShrink: 0,
                    }}>
                      {user.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{user.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user.email}</div>
                    </div>
                  </div>
                </div>
                <MobileNavBtn icon="logOut" danger onClick={() => { setMenuMovil(false); setConfirmarLogout(true); }}>Cerrar sesión</MobileNavBtn>
              </div>
            )}
          </div>
        </>
      )}

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
              background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 360,
              boxShadow: "0 24px 60px rgba(0,0,0,.2)",
              overflow: "hidden", animation: "logoutIn .22s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <div style={{
              background: "linear-gradient(135deg, var(--text-1), #2D1F0F)",
              padding: "28px 24px 22px", textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(232,70,10,.15)", border: "2px solid rgba(232,70,10,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <AppIcon name="partyPopper" size={26} color="var(--brand)" />
              </div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--surface)" }}>
                ¿Cerrar sesión?
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                Hola, <strong style={{ color: "rgba(255,255,255,.8)" }}>{user?.nombre?.split(" ")[0]}</strong>. ¿Seguro que quieres salir?
              </div>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: "100%", background: "var(--red)", fontSize: 15 }}
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
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        /* ── Responsive Navbar ── */
        @media (max-width: 768px) {
          .hamburger-btn { display: flex !important; }
          .nav-location-desktop { display: none !important; }
          .nav-location-mobile-btn { display: flex !important; }
          .nav-divider-desktop { display: none !important; }
          .nav-links-desktop { display: none !important; }
          .nav-search { display: none !important; }
          .nav-search-btn-mobile { display: flex !important; }
          .nav-actions-desktop { display: none !important; }
          .nav-avatar-mobile-group { display: flex !important; }
          .nav-login-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
          .nav-location-mobile-btn { display: none !important; }
          .nav-search-btn-mobile { display: none !important; }
          .nav-avatar-mobile-group { display: none !important; }
          .nav-login-mobile { display: none !important; }
          .mobile-search-bar { display: none !important; }
        }
      `}</style>
    </>
  );
}

function UserMenuContent({ user, esPropietario, limiteAlcanzado, onPanel, onPerfil, onAgregar, onFavoritos, onLogout }) {
  return (
    <>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid #F0EBE5" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{user.nombre}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{user.email}</div>
        <div style={{
          marginTop: 6, fontSize: 11, fontWeight: 700,
          color: esPropietario ? "var(--green)" : "var(--brand)",
          background: esPropietario ? "var(--green-bg)" : "var(--brand-light)",
          display: "inline-block", padding: "2px 8px", borderRadius: 10,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <AppIcon name={esPropietario ? "store" : "utensils"} size={12} />
            {esPropietario ? "Propietario" : "Cliente"}
          </span>
        </div>
      </div>

      <MenuBtn onClick={onPerfil} icon="user">Mi perfil</MenuBtn>
      {esPropietario && (
        <>
          <MenuBtn onClick={onPanel} icon="barChart">Mi panel</MenuBtn>
          <MenuBtn onClick={onAgregar} icon="plusCircle" disabled={limiteAlcanzado}>Agregar negocio</MenuBtn>
        </>
      )}
      {!esPropietario && (
        <MenuBtn onClick={onFavoritos} icon="heart">Mis guardados</MenuBtn>
      )}
      <MenuBtn onClick={onLogout} danger>Cerrar sesión</MenuBtn>
    </>
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
        color: danger ? "var(--red)" : disabled ? "#C0B8B0" : "var(--text-1)",
        background: hover && !disabled ? (danger ? "#FFF0EE" : "var(--bg)") : "none",
        border: "none", borderTop: danger ? "1px solid #F0EBE5" : "none",
        borderBottom: danger ? "none" : "1px solid #F0EBE5",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        display: "flex", alignItems: "center", gap: 9,
        opacity: disabled ? 0.5 : 1,
        minHeight: 44,
      }}
    >
      {icon && <AppIcon name={icon} size={16} fill={icon === "heart" ? "currentColor" : "none"} />}
      {children}
    </button>
  );
}

function MobileNavBtn({ children, icon, activo, onClick, danger, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: "100%", padding: "11px 10px",
        display: "flex", alignItems: "center", gap: 12,
        borderRadius: 10,
        background: activo ? "var(--brand-light)" : "none",
        color: danger ? "var(--red)" : activo ? "var(--brand)" : disabled ? "#C0B8B0" : "var(--text-1)",
        fontSize: 15, fontWeight: activo ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        transition: "background 0.15s",
        opacity: disabled ? 0.5 : 1,
        minHeight: 48,
      }}
    >
      {icon && <AppIcon name={icon} size={20} color={danger ? "var(--red)" : activo ? "var(--brand)" : disabled ? "#C0B8B0" : "var(--text-2)"} fill={icon === "heart" ? "currentColor" : "none"} />}
      {children}
    </button>
  );
}