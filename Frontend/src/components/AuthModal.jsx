import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "./AppIcon";

export default function AuthModal({ onCerrar }) {
  const { login } = useAuth();
  const [vista,    setVista]    = useState("login"); // login | registro | recuperar
  const [form,     setForm]     = useState({ nombre: "", email: "", password: "", confirmar: "", rol: "usuario" });
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito,    setExito]    = useState("");
  const googleBtnRef            = useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };

  // ── Google Identity Services ────────────────────────────
  useEffect(() => {
    if (vista === "recuperar") return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // no configurado aún

    const cargarGIS = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id:        clientId,
        callback:         handleGoogleCredential,
        ux_mode:          "popup",
        context:          "signin",
      });

      // Renderiza el botón oficial de Google
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme:            "outline",
        size:             "large",
        shape:            "rectangular",
        text:             vista === "registro" ? "signup_with" : "signin_with",
        width:            364,   // ancho del contenedor (max-width 420 - 2*28 padding)
        locale:           "es",
      });
    };

    // Si el script ya cargó, úsalo; si no, espera
    if (window.google?.accounts?.id) {
      cargarGIS();
    } else {
      // Agrega el script GIS si no existe
      if (!document.getElementById("gis-script")) {
        const script = document.createElement("script");
        script.id  = "gis-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = cargarGIS;
        document.head.appendChild(script);
      } else {
        // Script ya en el DOM pero aún cargando
        document.getElementById("gis-script").addEventListener("load", cargarGIS, { once: true });
      }
    }
  }, [vista]); // Re-render el botón al cambiar entre login/registro

  // Callback que GIS llama con el id_token
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
      login(data.token, data.usuario);
      onCerrar();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  // ── Formularios email/password ──────────────────────────
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
      onCerrar();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim())               return setError("Ingresa tu nombre.");
    if (!form.email.includes("@"))         return setError("Correo no válido.");
    if (form.password.length < 6)          return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmar)  return setError("Las contraseñas no coinciden.");
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
      onCerrar();
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

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,18,8,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        overflow: "hidden", animation: "slideUp .22s ease",
      }}>
        {/* Header */}
        <div style={{
          background: "#1A1208", padding: "24px 28px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
              {vista === "login"     && "¡Bienvenido de nuevo!"}
              {vista === "registro"  && "Crea tu cuenta"}
              {vista === "recuperar" && "Recuperar contraseña"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 3 }}>
              {vista === "login"     && "Inicia sesión para guardar tus antojos"}
              {vista === "registro"  && "Es gratis y toma menos de un minuto"}
              {vista === "recuperar" && "Te enviamos un correo con instrucciones"}
            </div>
          </div>
          <button onClick={onCerrar} style={{
            color: "rgba(255,255,255,.5)", fontSize: 22, lineHeight: 1,
            background: "none", border: "none", cursor: "pointer", padding: 4,
          }}><AppIcon name="x" size={20} /></button>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* BOTÓN GOOGLE (GIS renderiza aquí) */}
          {vista !== "recuperar" && (
            <>
              {/* Contenedor del botón oficial de Google */}
              <div
                ref={googleBtnRef}
                style={{ minHeight: 44, display: "flex", justifyContent: "center" }}
              />

              {/* Fallback: si VITE_GOOGLE_CLIENT_ID no está configurado */}
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

          {/* FORMULARIO LOGIN */}
          {vista === "login" && (
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

          {/* FORMULARIO REGISTRO */}
          {vista === "registro" && (
            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Selector de rol ── */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 8 }}>¿Cómo vas a usar Antojapp?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { valor: "usuario",  icon: "utensils", titulo: "Soy cliente",      sub: "Busco dónde comer" },
                    { valor: "negocio",  icon: "store",    titulo: "Soy propietario",  sub: "Registro mi negocio" },
                  ].map(({ valor, icon, titulo, sub }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => set("rol", valor)}
                      style={{
                        border:        form.rol === valor ? "2px solid #E8460A" : "2px solid #E2DBD5",
                        borderRadius:  12,
                        padding:       "12px 8px",
                        background:    form.rol === valor ? "#FFF4F0" : "#FAFAF9",
                        cursor:        "pointer",
                        textAlign:     "center",
                        transition:    "all .18s ease",
                        outline:       "none",
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

          {/* FORMULARIO RECUPERAR */}
          {vista === "recuperar" && (
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

          {/* Toggle login/registro */}
          {vista !== "recuperar" && (
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
      `}</style>
    </div>
  );
}
