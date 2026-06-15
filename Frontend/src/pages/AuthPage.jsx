import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

// Imágenes de fondo para login y registro (Unsplash — comida colombiana / street food)
const IMG_LOGIN   = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80&auto=format&fit=crop";
const IMG_REGISTRO = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80&auto=format&fit=crop";

export default function AuthPage({ onCerrar, onExito, vistaInicial = "login" }) {
  const { login } = useAuth();

  // "login" | "registro" | "recuperar"
  const [vista, setVista]       = useState(vistaInicial);
  const [animando, setAnimando] = useState(false);   // controla la transición

  const [form, setForm]         = useState({ nombre: "", email: "", password: "", confirmar: "", rol: "usuario" });
  const [error, setError]       = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito]       = useState("");
  const [loginExito, setLoginExito] = useState(null);
  const [pendienteGoogle, setPendienteGoogle] = useState(null);

  const googleBtnRef = useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };

  // ── Imagen: izquierda en login, derecha en registro ──────────────────────
  // La imagen está en posición absoluta y se desliza con transform + transition
  const imgADerecha = vista === "registro" || vista === "recuperar";

  // ── Cambio de vista con animación ────────────────────────────────────────
  const cambiarVista = (nuevaVista) => {
    if (nuevaVista === vista) return;
    setAnimando(true);
    setError(""); setExito("");
    setTimeout(() => {
      setVista(nuevaVista);
      setAnimando(false);
    }, 320);
  };

  // ── Google Identity Services ─────────────────────────────────────────────
  useEffect(() => {
    if (vista === "recuperar" || loginExito) return;
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
        width:  Math.min(400, window.innerWidth - 80),
        locale: "es",
      });
    };

    if (window.google?.accounts?.id) {
      cargarGIS();
    } else {
      if (!document.getElementById("gis-script")) {
        const script   = document.createElement("script");
        script.id      = "gis-script";
        script.src     = "https://accounts.google.com/gsi/client";
        script.onload  = cargarGIS;
        document.head.appendChild(script);
      } else {
        document.getElementById("gis-script").addEventListener("load", cargarGIS, { once: true });
      }
    }
  }, [vista, loginExito]);

  const handleGoogleCredential = async ({ credential }) => {
    setCargando(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/google`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error con Google"); return; }
      if (data.pendiente) { setPendienteGoogle({ credential, nombre: data.nombre, email: data.email }); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setCargando(false); }
  };

  const handleConfirmarRolGoogle = async (rolElegido) => {
    if (!pendienteGoogle) return;
    setCargando(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/google`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: pendienteGoogle.credential, rol: rolElegido }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear la cuenta"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, true);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setCargando(false); setPendienteGoogle(null); }
  };

  const cerrarConExito = (nombre, esNuevo = false) => {
    setLoginExito({ nombre, esNuevo });
    setTimeout(() => { onExito?.(); onCerrar?.(); }, 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setCargando(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setCargando(false); }
  };

  const handleRegistro = async (e) => {
    e.preventDefault(); setError("");
    if (!form.nombre.trim())              return setError("Ingresa tu nombre.");
    if (!form.email.includes("@"))        return setError("Correo no válido.");
    if (form.password.length < 6)         return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmar) return setError("Las contraseñas no coinciden.");
    setCargando(true);
    try {
      const res  = await fetch(`${API_URL}/auth/registro`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, rol: form.rol }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al crear la cuenta"); return; }
      login(data.token, data.usuario);
      cerrarConExito(data.usuario.nombre, true);
    } catch { setError("No se pudo conectar con el servidor"); }
    finally { setCargando(false); }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault(); setError("");
    if (!form.email.includes("@")) return setError("Ingresa un correo válido.");
    setCargando(true);
    await new Promise(r => setTimeout(r, 800));
    setExito(`Enviamos instrucciones a ${form.email}`);
    setCargando(false);
  };

  const opcionesRol = [
    { valor: "usuario", icon: "utensils", titulo: "Soy cliente",     sub: "Busco dónde comer" },
    { valor: "negocio", icon: "store",    titulo: "Soy propietario", sub: "Registro mi negocio" },
  ];

  // ── Textos del panel izquierdo (sobre la imagen) ─────────────────────────
  const overlayTexto = {
    login: {
      titulo: "Descubre tu próximo antojo",
      sub:    "Miles de negocios de comida esperan por ti.",
    },
    registro: {
      titulo: "Tu mesa siempre está lista",
      sub:    "Únete a la comunidad que come bien.",
    },
    recuperar: {
      titulo: "Sin contraseña, sin problema",
      sub:    "Te ayudamos a volver en segundos.",
    },
  };
  const texto = overlayTexto[vista] || overlayTexto.login;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: "var(--text-1)",
      display: "flex", overflow: "hidden",
    }}>

      {/* ── PANEL IMAGEN (deslizante) ─────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        width: "50%",
        left: imgADerecha ? "50%" : "0%",
        transition: "left 0.48s cubic-bezier(0.77,0,0.18,1)",
        zIndex: 2,
        overflow: "hidden",
      }}>
        {/* Foto de fondo */}
        <img
          src={imgADerecha ? IMG_REGISTRO : IMG_LOGIN}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transition: "opacity 0.35s ease",
          }}
        />
        {/* Overlay oscuro degradado */}
        <div style={{
          position: "absolute", inset: 0,
          background: imgADerecha
            ? "linear-gradient(to left,  rgba(26,18,8,0.15) 0%, rgba(26,18,8,0.72) 100%)"
            : "linear-gradient(to right, rgba(26,18,8,0.15) 0%, rgba(26,18,8,0.72) 100%)",
          transition: "background 0.48s ease",
        }} />
        {/* Texto sobre la imagen */}
        <div style={{
          position: "absolute", bottom: 48,
          left: imgADerecha ? "auto" : 40,
          right: imgADerecha ? 40 : "auto",
          maxWidth: 280,
          textAlign: imgADerecha ? "right" : "left",
          opacity: animando ? 0 : 1,
          transform: animando ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            justifyContent: imgADerecha ? "flex-end" : "flex-start",
            marginBottom: 20,
          }}>
            <img src="/icon-56.png" alt="Antojapp" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{
              fontFamily: "'Manrope', sans-serif", fontWeight: 800,
              fontSize: 20, color: "#fff", letterSpacing: "-0.5px",
            }}>
              Antoj<span style={{ color: "var(--brand)" }}>app</span>
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Manrope', sans-serif", fontWeight: 800,
            fontSize: "clamp(22px, 2.4vw, 28px)",
            color: "#fff", lineHeight: 1.22, marginBottom: 10,
          }}>
            {texto.titulo}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            {texto.sub}
          </p>
        </div>
      </div>

      {/* ── PANEL FORMULARIO ──────────────────────────────────────────── */}
      {/* Ocupa todo el ancho pero el contenido se posiciona opuesto a la imagen */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%",
        display: "flex",
        justifyContent: imgADerecha ? "flex-start" : "flex-end",
        alignItems: "stretch",
        transition: "justify-content 0s 0.24s", // sincroniza con la imagen
      }}>
        <div style={{
          width: "50%",
          background: "var(--surface)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "48px 40px",
          overflowY: "auto",
          position: "relative",
        }}>

          {/* Botón cerrar */}
          {onCerrar && (
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              style={{
                position: "absolute", top: 20, right: 20,
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-2)", cursor: "pointer",
              }}
            >
              <AppIcon name="x" size={18} />
            </button>
          )}

          <div style={{
            width: "100%", maxWidth: 400,
            opacity: animando ? 0 : 1,
            transform: animando ? "translateY(12px)" : "translateY(0)",
            transition: "opacity 0.28s ease 0.1s, transform 0.28s ease 0.1s",
          }}>

            {/* ── ÉXITO ── */}
            {loginExito && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--green), #22B573)",
                  margin: "0 auto 18px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(26,140,91,.28)",
                  animation: "exitoIn .4s cubic-bezier(.34,1.56,.64,1)",
                }}>
                  <AppIcon name="check" size={36} color="#fff" strokeWidth={2.5} />
                </div>
                <h2 style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800,
                  color: "var(--text-1)", marginBottom: 8,
                }}>
                  {loginExito.esNuevo ? "¡Cuenta creada!" : "¡Bienvenido de nuevo!"}
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                  Hola, <strong style={{ color: "var(--text-1)" }}>{loginExito.nombre?.split(" ")[0]}</strong>
                </p>
                <div style={{ marginTop: 24, height: 4, background: "#F0EBE5", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: "var(--green)", borderRadius: 2,
                    animation: "progreso 1.5s linear forwards",
                  }} />
                </div>
              </div>
            )}

            {/* ── SELECTOR ROL GOOGLE ── */}
            {!loginExito && pendienteGoogle && (
              <div>
                <h2 style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800,
                  color: "var(--text-1)", marginBottom: 6,
                }}>¡Una cosa más!</h2>
                <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24 }}>
                  Hola {pendienteGoogle.nombre?.split(" ")[0]}, ¿cómo usarás Antojapp?
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  {opcionesRol.map(({ valor, icon, titulo, sub }) => (
                    <button
                      key={valor}
                      onClick={() => handleConfirmarRolGoogle(valor)}
                      disabled={cargando}
                      style={{
                        border: "2px solid var(--border)", borderRadius: 14,
                        padding: "20px 12px", background: "var(--surface-2)",
                        cursor: cargando ? "not-allowed" : "pointer", textAlign: "center",
                        transition: "all .18s ease", opacity: cargando ? 0.6 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.border = "2px solid var(--brand)"; e.currentTarget.style.background = "var(--brand-hover)"; }}
                      onMouseLeave={e => { e.currentTarget.style.border = "2px solid var(--border)"; e.currentTarget.style.background = "var(--surface-2)"; }}
                    >
                      <div style={{ marginBottom: 8, color: "var(--text-2)" }}><AppIcon name={icon} size={30} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-deep)" }}>{titulo}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>
                    </button>
                  ))}
                </div>
                {error && <ErrorBox>{error}</ErrorBox>}
                <button className="btn-ghost" onClick={() => setPendienteGoogle(null)} style={{ fontSize: 13 }}>
                  <AppIcon name="arrowLeft" size={14} /> Volver
                </button>
              </div>
            )}

            {/* ── FORMULARIOS ── */}
            {!loginExito && !pendienteGoogle && (
              <>
                {/* Encabezado */}
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: "clamp(20px, 2vw, 26px)",
                    fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 6,
                  }}>
                    {vista === "login"     && "¡Bienvenido de nuevo!"}
                    {vista === "registro"  && "Crea tu cuenta"}
                    {vista === "recuperar" && "Recuperar contraseña"}
                  </h1>
                  <p style={{ fontSize: 14, color: "var(--text-3)" }}>
                    {vista === "login"     && "Inicia sesión para guardar tus antojos"}
                    {vista === "registro"  && "Es gratis y toma menos de un minuto"}
                    {vista === "recuperar" && "Te enviamos un correo con instrucciones"}
                  </p>
                </div>

                {/* Botón Google */}
                {vista !== "recuperar" && (
                  <>
                    <div ref={googleBtnRef} style={{ minHeight: 44, display: "flex", justifyContent: "center", marginBottom: 4 }} />
                    {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                      <div style={{
                        fontSize: 12, color: "var(--text-3)", textAlign: "center",
                        padding: "10px", border: "1.5px dashed var(--border)", borderRadius: 10, marginBottom: 4,
                      }}>
                        Google OAuth no configurado —<br />agrega <code>VITE_GOOGLE_CLIENT_ID</code> en <code>.env</code>
                      </div>
                    )}
                    <Divider />
                  </>
                )}

                {/* LOGIN */}
                {vista === "login" && (
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Correo electrónico">
                      <input className="input" type="email" placeholder="tu@correo.com"
                        value={form.email} onChange={e => set("email", e.target.value)} required />
                    </Field>
                    <Field label="Contraseña">
                      <input className="input" type="password" placeholder="••••••••"
                        value={form.password} onChange={e => set("password", e.target.value)} required />
                    </Field>
                    {error && <ErrorBox>{error}</ErrorBox>}
                    <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%", marginTop: 4 }}>
                      {cargando ? "Verificando..." : "Iniciar sesión"}
                    </button>
                    <div style={{ textAlign: "center" }}>
                      <button type="button" className="btn-ghost"
                        onClick={() => cambiarVista("recuperar")}
                        style={{ fontSize: 13 }}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTRO */}
                {vista === "registro" && (
                  <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {/* Selector de rol */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                        ¿Cómo vas a usar Antojapp?
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {opcionesRol.map(({ valor, icon, titulo, sub }) => (
                          <button
                            key={valor} type="button" onClick={() => set("rol", valor)}
                            style={{
                              border: form.rol === valor ? "2px solid var(--brand)" : "2px solid var(--border)",
                              borderRadius: 12, padding: "12px 8px",
                              background: form.rol === valor ? "var(--brand-hover)" : "var(--surface-2)",
                              cursor: "pointer", textAlign: "center", transition: "all .18s ease", outline: "none",
                            }}
                          >
                            <div style={{ marginBottom: 5, color: form.rol === valor ? "var(--brand)" : "var(--text-2)" }}>
                              <AppIcon name={icon} size={26} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: form.rol === valor ? "var(--brand)" : "var(--text-deep)" }}>{titulo}</div>
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Field label="Tu nombre">
                      <input className="input" type="text" placeholder="Cómo te llamamos"
                        value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
                    </Field>
                    <Field label="Correo electrónico">
                      <input className="input" type="email" placeholder="tu@correo.com"
                        value={form.email} onChange={e => set("email", e.target.value)} required />
                    </Field>
                    <Field label="Contraseña">
                      <input className="input" type="password" placeholder="Mín. 6 caracteres"
                        value={form.password} onChange={e => set("password", e.target.value)} required />
                    </Field>
                    <Field label="Confirmar contraseña">
                      <input className="input" type="password" placeholder="Repite la contraseña"
                        value={form.confirmar} onChange={e => set("confirmar", e.target.value)} required />
                    </Field>
                    {error && <ErrorBox>{error}</ErrorBox>}
                    <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%", marginTop: 4 }}>
                      {cargando ? "Creando cuenta..." : "Crear cuenta gratis"}
                    </button>
                  </form>
                )}

                {/* RECUPERAR */}
                {vista === "recuperar" && (
                  <form onSubmit={handleRecuperar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {exito ? (
                      <div style={{
                        background: "var(--green-bg)", border: "1px solid var(--green)",
                        borderRadius: 12, padding: "20px", textAlign: "center",
                      }}>
                        <div style={{ marginBottom: 10, color: "var(--green)" }}><AppIcon name="mail" size={32} /></div>
                        <div style={{ fontSize: 14, color: "var(--green)", fontWeight: 500 }}>{exito}</div>
                        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>Revisa también tu carpeta de spam.</div>
                      </div>
                    ) : (
                      <>
                        <Field label="Correo electrónico">
                          <input className="input" type="email" placeholder="tu@correo.com"
                            value={form.email} onChange={e => set("email", e.target.value)} required />
                        </Field>
                        {error && <ErrorBox>{error}</ErrorBox>}
                        <button className="btn-primary" type="submit" disabled={cargando} style={{ width: "100%" }}>
                          {cargando ? "Enviando..." : "Enviar instrucciones"}
                        </button>
                      </>
                    )}
                    <div style={{ textAlign: "center" }}>
                      <button type="button" className="btn-ghost"
                        onClick={() => cambiarVista("login")}
                        style={{ fontSize: 13 }}>
                        <AppIcon name="arrowLeft" size={14} /> Volver al inicio de sesión
                      </button>
                    </div>
                  </form>
                )}

                {/* Toggle login ↔ registro */}
                {vista !== "recuperar" && (
                  <div style={{
                    marginTop: 24, paddingTop: 20,
                    borderTop: "1px solid var(--border)",
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: 14, color: "var(--text-2)" }}>
                      {vista === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarVista(vista === "login" ? "registro" : "login")}
                      style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {vista === "login" ? "Regístrate gratis" : "Inicia sesión"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── VERSIÓN MÓVIL: solo formulario sin imagen lateral ─────────────── */}
      <style>{`
        @keyframes exitoIn {
          from { opacity: 0; transform: scale(.82); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes progreso {
          from { width: 0%;    }
          to   { width: 100%;  }
        }

        /* En móvil la imagen desaparece y el formulario ocupa todo */
        @media (max-width: 700px) {
          .auth-img-panel { display: none !important; }
          .auth-form-half {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Pequeños helpers de UI ─────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 13, color: "var(--text-3)" }}>o con correo</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div style={{
      fontSize: 13, color: "var(--red)", background: "var(--red-bg)",
      padding: "9px 13px", borderRadius: 8, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}
