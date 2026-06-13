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

  // ── Estado para Google: usuario nuevo pendiente de elegir rol ──
  const [pendienteGoogle, setPendienteGoogle] = useState(null);
  // { credential, nombre, email }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };

  // ── Google Identity Services ────────────────────────────
  useEffect(() => {
    if (vista === "recuperar") return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const cargarGIS = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id:        clientId,
        callback:         handleGoogleCredential,
        ux_mode:          "popup",
        context:          "signin",
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme:            "outline",
        size:             "large",
        shape:            "rectangular",
        text:             vista === "registro" ? "signup_with" : "signin_with",
        width:            364,
        locale:           "es",
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

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión con Google");
        return;
      }

      // ── Usuario NUEVO: el backend pide que elijamos rol ──
      if (data.pendiente) {
        setPendienteGoogle({ credential, nombre: data.nombre, email: data.email });
        return;
      }

      // ── Usuario existente: login directo ──
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  // Confirmar rol para usuario nuevo de Google
  const handleConfirmarRolGoogle = async (rolElegido) => {
    if (!pendienteGoogle) return;
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential: pendienteGoogle.credential, rol: rolElegido }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta con Google");
        return;
      }

      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
      setPendienteGoogle(null);
    }
  };

  // ── Formularios email/password ──────────────────────────
  const [loginExito, setLoginExito] = useState(null);

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

  // ── Opciones de rol para el selector ──
  const opcionesRol = [
    { valor: "usuario",  icon: "utensils", titulo: "Soy cliente",      sub: "Busco dónde comer" },
    { valor: "negocio",  icon: "store",    titulo: "Soy propietario",  sub: "Registro mi negocio" },
  ];

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
              {pendienteGoogle           && "¡Una cosa más!"}
              {!pendienteGoogle && vista === "login"     && "¡Bienvenido de nuevo!"}
              {!pendienteGoogle && vista === "registro"  && "Crea tu cuenta"}
              {!pendienteGoogle && vista === "recuperar" && "Recuperar contraseña"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 3 }}>
              {pendienteGoogle           && `Hola ${pendienteGoogle.nombre?.split(" ")[0]}, ¿cómo usarás Antojapp?`}
              {!pendienteGoogle && vista === "login"     && "Inicia sesión para guardar tus antojos"}
              {!pendienteGoogle && vista === "registro"  && "Es gratis y toma menos de un minuto"}
              {!pendienteGoogle && vista === "recuperar" && "Te enviamos un correo con instrucciones"}
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
              <div style={{
                marginTop: 20, height: 4, background: "#F0EBE5", borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", background: "#1A8C5B", borderRadius: 2,
                  animation: "progreso 1.4s linear forwards",
                }} />
              </div>
            </div>
          )}

          {/* ── SELECTOR DE ROL PARA GOOGLE (usuario nuevo) ── */}
          {!loginExito && pendienteGoogle && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 14, color: "#6B5E52", margin: 0, textAlign: "center" }}>
                Elige cómo quieres usar Antojapp con tu cuenta de Google:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {opcionesRol.map(({ valor, icon, titulo, sub }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => handleConfirmarRolGoogle(valor)}
                    disabled={cargando}
                    style={{
                      border:       "2px solid #E2DBD5",
                      borderRadius: 12,
                      padding:      "18px 10px",
                      background:   "#FAFAF9",
                      cursor:       cargando ? "not-allowed" : "pointer",
                      textAlign:    "center",
                      transition:   "all .18s ease",
                      outline:      "none",
                      opacity:      cargando ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.border = "2px solid #E8460A";
                      e.currentTarget.style.background = "#FFF4F0";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.border = "2px solid #E2DBD5";
                      e.currentTarget.style.background = "#FAFAF9";
                    }}
                  >
                    <div style={{ marginBottom: 8, color: "#6B5E52" }}>
                      <AppIcon name={icon} size={30} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#3D2B1F" }}>{titulo}</div>
                    <div style={{ fontSize: 12, color: "#A8988A", marginTop: 3 }}>{sub}</div>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "9px 12px", borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPendienteGoogle(null)}
                style={{
                  fontSize: 13, color: "#A8988A", background: "none", border: "none",
                  cursor: "pointer", textAlign: "center", padding: "4px 0",
                }}
              >
                ← Volver
              </button>
            </div>
          )}

          {/* BOTÓN GOOGLE (GIS renderiza aquí) */}
          {!loginExito && !pendienteGoogle && vista !== "recuperar" && (
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

          {/* FORMULARIO LOGIN */}
          {!loginExito && !pendienteGoogle && vista === "login" && (
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
          {!loginExito && !pendienteGoogle && vista === "registro" && (
            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Selector de rol ── */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", display: "block", marginBottom: 8 }}>¿Cómo vas a usar Antojapp?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {opcionesRol.map(({ valor, icon, titulo, sub }) => (
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
          {!loginExito && !pendienteGoogle && vista === "recuperar" && (
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
          {!loginExito && !pendienteGoogle && vista !== "recuperar" && (
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