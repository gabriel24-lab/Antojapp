import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "./AppIcon";

export default function AuthModal({ onCerrar }) {
  const { login } = useAuth();
  const [vista,    setVista]    = useState("login"); // login | registro | recuperar | google_rol
  const [form,     setForm]     = useState({ nombre: "", email: "", password: "", confirmar: "", rol: "usuario" });
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito,    setExito]    = useState("");
  const [loginExito, setLoginExito] = useState(null); // { nombre, esNuevo }

  // Datos temporales del usuario Google mientras elige rol
  const [googlePendiente, setGooglePendiente] = useState(null); // { credential, nombre, email }
  const [rolGoogle, setRolGoogle] = useState("usuario");

  const googleBtnRef = useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };

  // ── Google Identity Services ────────────────────────────
  useEffect(() => {
    if (vista === "recuperar" || vista === "google_rol") return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const cargarGIS = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback:  handleGoogleCredential,
        ux_mode:   "popup",
        context:   "signin",
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme:  "outline",
        size:   "large",
        shape:  "rectangular",
        text:   vista === "registro" ? "signup_with" : "signin_with",
        width:  364,
        locale: "es",
      });
    };

    if (window.google?.accounts?.id) {
      cargarGIS();
    } else {
      if (!document.getElementById("gis-script")) {
        const script = document.createElement("script");
        script.id  = "gis-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = cargarGIS;
        document.head.appendChild(script);
      } else {
        document.getElementById("gis-script").addEventListener("load", cargarGIS, { once: true });
      }
    }
  }, [vista]);

  // ── Callback de Google ──────────────────────────────────
  // Primer intento: sin rol. Si el backend dice "pendiente", mostrar selector.
  const handleGoogleCredential = async ({ credential }) => {
    setCargando(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Error al iniciar sesión con Google"); return; }

      if (data.pendiente) {
        // Usuario nuevo → pedir rol
        setGooglePendiente({ credential, nombre: data.nombre, email: data.email });
        setRolGoogle("usuario");
        setVista("google_rol");
        return;
      }

      // Usuario existente o ya tenía rol
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, data.esNuevo);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  // ── Confirmar rol elegido para Google ──────────────────
  const handleConfirmarRolGoogle = async () => {
    if (!googlePendiente) return;
    setCargando(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential: googlePendiente.credential, rol: rolGoogle }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear la cuenta"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  // ── Formularios email/password ──────────────────────────
  const cerrarConExito = (nombre, esNuevo = false) => {
    setLoginExito({ nombre, esNuevo });
    setTimeout(() => onCerrar(), 1400);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim())              return setError("Ingresa tu nombre.");
    if (!form.email.includes("@"))        return setError("Correo no válido.");
    if (form.password.length < 6)         return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmar) return setError("Las contraseñas no coinciden.");
    setCargando(true);
    try {
      const res  = await fetch(`${API_URL}/auth/registro`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, rol: form.rol }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear la cuenta"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.includes("@")) return setError("Ingresa un correo válido.");
    setCargando(true);
    await new Promise(r => setTimeout(r, 800));
    setExito(`Enviamos instrucciones a ${form.email}`);
    setCargando(false);
  };

  // ── Título según vista ──────────────────────────────────
  const titulo = {
    login:      "¡Bienvenido de nuevo!",
    registro:   "Crea tu cuenta",
    recuperar:  "Recuperar contraseña",
    google_rol: "Un último paso",
  }[vista];

  const subtitulo = {
    login:      "Inicia sesión para guardar tus antojos",
    registro:   "Es gratis y toma menos de un minuto",
    recuperar:  "Te enviamos un correo con instrucciones",
    google_rol: "¿Cómo vas a usar Antojapp?",
  }[vista];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,18,8,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px var(--content-px, 16px)",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        overflow: "hidden", animation: "slideUp .22s ease",
      }}>
        {/* ── Header ── */}
        <div style={{
          background: "#1A1208", padding: "24px 28px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
              {titulo}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 3 }}>
              {subtitulo}
            </div>
          </div>
          <button onClick={onCerrar} style={{
            color: "rgba(255,255,255,.5)", fontSize: 22, lineHeight: 1,
            background: "none", border: "none", cursor: "pointer", padding: 4,
          }}><AppIcon name="x" size={20} /></button>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ── PANTALLA DE ÉXITO ── */}
          {loginExito && (
            <div style={{
              textAlign: "center", padding: "20px 0 12px",
              animation: "exitoIn .35s cubic-bezier(.34,1.56,.64,1)",
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "linear-gradient(135deg, #1A8C5B, #22B573)",
                margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(26,140,91,.3)",
              }}>
                <AppIcon name="check" size={34} color="#fff" strokeWidth={2.5} />
              </div>
              <div style={{
                fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700,
                color: "#1A1208", marginBottom: 8,
              }}>
                {loginExito.esNuevo ? "¡Cuenta creada!" : "¡Sesión iniciada!"}
              </div>
              <div style={{ fontSize: 14, color: "#6B5E52" }}>
                Bienvenido{loginExito.esNuevo ? "" : " de nuevo"},{" "}
                <strong style={{ color: "#1A1208" }}>{loginExito.nombre?.split(" ")[0]}</strong>
              </div>
              <div style={{ marginTop: 20, height: 4, background: "#F0EBE5", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "#1A8C5B", borderRadius: 2,
                  animation: "progreso 1.4s linear forwards",
                }} />
              </div>
            </div>
          )}

          {/* ── SELECTOR DE ROL PARA GOOGLE ── */}
          {!loginExito && vista === "google_rol" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Info del usuario Google */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#F7F4F1", borderRadius: 12, padding: "12px 14px",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "#E8460A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {googlePendiente?.nombre?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1208" }}>{googlePendiente?.nombre}</div>
                  <div style={{ fontSize: 12, color: "#A8988A" }}>{googlePendiente?.email}</div>
                </div>
                {/* Logo Google */}
                <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M46.145 24.498c0-1.58-.14-3.1-.402-4.56H24v8.622h12.445c-.537 2.895-2.17 5.348-4.626 6.993v5.81h7.49c4.382-4.036 6.836-9.98 6.836-16.865z"/>
                  <path fill="#34A853" d="M24 48c6.24 0 11.472-2.07 15.294-5.608l-7.49-5.81c-2.073 1.39-4.723 2.21-7.804 2.21-6.002 0-11.084-4.054-12.898-9.503H3.394v6.002C7.2 42.66 15.042 48 24 48z"/>
                  <path fill="#FBBC05" d="M11.102 29.289A14.976 14.976 0 0 1 10.286 24c0-1.84.316-3.626.816-5.29V12.71H3.394A23.99 23.99 0 0 0 0 24c0 3.865.928 7.52 2.565 10.712l8.537-5.423z"/>
                  <path fill="#EA4335" d="M24 9.545c3.387 0 6.43 1.164 8.822 3.454l6.617-6.617C35.466 2.378 30.234 0 24 0 15.042 0 7.2 5.34 3.394 13.29l8.537 5.42C13.916 13.598 18.998 9.545 24 9.545z"/>
                </svg>
              </div>

              {/* Selector de rol */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", marginBottom: 10 }}>
                  Elige cómo usarás Antojapp:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { valor: "usuario", icon: "utensils", titulo: "Soy cliente",     sub: "Busco dónde comer" },
                    { valor: "negocio", icon: "store",    titulo: "Soy propietario", sub: "Registro mi negocio" },
                  ].map(({ valor, icon, titulo, sub }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setRolGoogle(valor)}
                      style={{
                        border:     rolGoogle === valor ? "2px solid #E8460A" : "2px solid #E2DBD5",
                        borderRadius: 12,
                        padding:    "14px 8px",
                        background: rolGoogle === valor ? "#FFF4F0" : "#FAFAF9",
                        cursor:     "pointer",
                        textAlign:  "center",
                        transition: "all .18s ease",
                        outline:    "none",
                        minHeight:  90,
                      }}
                    >
                      <div style={{ marginBottom: 6, color: rolGoogle === valor ? "#E8460A" : "#6B5E52" }}>
                        <AppIcon name={icon} size={28} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: rolGoogle === valor ? "#E8460A" : "#3D2B1F" }}>{titulo}</div>
                      <div style={{ fontSize: 11, color: "#A8988A", marginTop: 2 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "9px 12px", borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleConfirmarRolGoogle}
                disabled={cargando}
                style={{ width: "100%" }}
              >
                {cargando ? "Creando cuenta..." : "Continuar con Google"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setVista("login"); setGooglePendiente(null); setError(""); }}
                style={{ fontSize: 13, justifyContent: "center" }}
              >
                <AppIcon name="arrowLeft" size={15} /> Volver
              </button>
            </div>
          )}

          {/* ── BOTÓN GOOGLE (GIS) — solo en login/registro ── */}
          {!loginExito && (vista === "login" || vista === "registro") && (
            <>
              <div
                ref={googleBtnRef}
                style={{ minHeight: 44, display: "flex", justifyContent: "center" }}
              />

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <div style={{
                  fontSize: 12, color: "#A8988A", textAlign: "center",
                  padding: "8px 0",
                  border: "1.5px dashed #E2DBD5", borderRadius: 10,
                }}>
                  Google OAuth no configurado —<br />
                  agrega <code>VITE_GOOGLE_CLIENT_ID</code> en <code>.env</code>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E2DBD5" }} />
                <span style={{ fontSize: 13, color: "#A8988A" }}>o con correo</span>
                <div style={{ flex: 1, height: 1, background: "#E2DBD5" }} />
              </div>
            </>
          )}

          {/* ── FORMULARIO LOGIN ── */}
          {!loginExito && vista === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Correo electrónico</label>
                <input className="input" type="email" placeholder="tu@correo.com" value={form.email} onChange={e => set("email", e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Contraseña</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} required />
              </div>
              {error && <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "9px 12px", borderRadius: 8 }}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%", marginTop: 2 }}>
                {cargando ? "Verificando..." : "Iniciar sesión"}
              </button>
              <div style={{ textAlign: "center" }}>
                <button type="button" className="btn-ghost" onClick={() => { setVista("recuperar"); setError(""); }} style={{ fontSize: 13 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          )}

          {/* ── FORMULARIO REGISTRO ── */}
          {!loginExito && vista === "registro" && (
            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 8 }}>¿Cómo vas a usar Antojapp?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { valor: "usuario", icon: "utensils", titulo: "Soy cliente",     sub: "Busco dónde comer" },
                    { valor: "negocio", icon: "store",    titulo: "Soy propietario", sub: "Registro mi negocio" },
                  ].map(({ valor, icon, titulo, sub }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => set("rol", valor)}
                      style={{
                        border:     form.rol === valor ? "2px solid #E8460A" : "2px solid #E2DBD5",
                        borderRadius: 12,
                        padding:    "12px 8px",
                        background: form.rol === valor ? "#FFF4F0" : "#FAFAF9",
                        cursor:     "pointer",
                        textAlign:  "center",
                        transition: "all .18s ease",
                        outline:    "none",
                      }}
                    >
                      <div style={{ marginBottom: 5, color: form.rol === valor ? "#E8460A" : "#6B5E52" }}>
                        <AppIcon name={icon} size={27} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: form.rol === valor ? "#E8460A" : "#3D2B1F" }}>{titulo}</div>
                      <div style={{ fontSize: 11, color: "#A8988A", marginTop: 2 }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Tu nombre</label>
                <input className="input" type="text" placeholder="Cómo te llamamos" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Correo electrónico</label>
                <input className="input" type="email" placeholder="tu@correo.com" value={form.email} onChange={e => set("email", e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Contraseña</label>
                <input className="input" type="password" placeholder="Mín. 6 caracteres" value={form.password} onChange={e => set("password", e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Confirmar contraseña</label>
                <input className="input" type="password" placeholder="Repite la contraseña" value={form.confirmar} onChange={e => set("confirmar", e.target.value)} required />
              </div>
              {error && <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "9px 12px", borderRadius: 8 }}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%", marginTop: 2 }}>
                {cargando ? "Creando cuenta..." : "Crear cuenta gratis"}
              </button>
            </form>
          )}

          {/* ── FORMULARIO RECUPERAR ── */}
          {!loginExito && vista === "recuperar" && (
            <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {exito ? (
                <div style={{ background: "#E8F6EE", border: "1px solid #1A8C5B", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                  <div style={{ marginBottom: 8, color: "#1A8C5B" }}><AppIcon name="mail" size={30} /></div>
                  <div style={{ fontSize: 14, color: "#1A8C5B", fontWeight: 500 }}>{exito}</div>
                  <div style={{ fontSize: 13, color: "#6B5E52", marginTop: 6 }}>Revisa también tu carpeta de spam.</div>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 5 }}>Correo electrónico</label>
                    <input className="input" type="email" placeholder="tu@correo.com" value={form.email} onChange={e => set("email", e.target.value)} required />
                  </div>
                  {error && <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "9px 12px", borderRadius: 8 }}>{error}</div>}
                  <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%", marginTop: 2 }}>
                    {cargando ? "Enviando..." : "Enviar instrucciones"}
                  </button>
                </>
              )}
              <div style={{ textAlign: "center" }}>
                <button type="button" className="btn-ghost" onClick={() => { setVista("login"); setError(""); setExito(""); }} style={{ fontSize: 13 }}>
                  <AppIcon name="arrowLeft" size={15} /> Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* ── Toggle login/registro ── */}
          {!loginExito && (vista === "login" || vista === "registro") && (
            <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px solid #F0EBE5", paddingTop: 18 }}>
              <span style={{ fontSize: 14, color: "#6B5E52" }}>
                {vista === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              </span>
              <button
                type="button"
                onClick={() => { setVista(vista === "login" ? "registro" : "login"); setError(""); }}
                style={{ fontSize: 14, fontWeight: 600, color: "#E8460A", background: "none", border: "none", cursor: "pointer" }}
              >
                {vista === "login" ? "Regístrate gratis" : "Inicia sesión"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes exitoIn {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes progreso {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
