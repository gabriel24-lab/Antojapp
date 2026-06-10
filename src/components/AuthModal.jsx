import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const USUARIOS_MOCK = [
  { email: "demo@antojapp.co", password: "demo123", nombre: "Demo User" }
];

export default function AuthModal({ onCerrar }) {
  const { login } = useAuth();
  const [vista, setVista] = useState("login"); // login | registro | recuperar
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmar: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState("");

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    await new Promise(r => setTimeout(r, 700));
    const usuario = USUARIOS_MOCK.find(
      u => u.email === form.email && u.password === form.password
    );
    if (usuario) {
      login({ nombre: usuario.nombre, email: usuario.email });
      onCerrar();
    } else {
      setError("Correo o contraseña incorrectos.");
    }
    setCargando(false);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("Ingresa tu nombre.");
    if (!form.email.includes("@")) return setError("Correo no válido.");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmar) return setError("Las contraseñas no coinciden.");
    setCargando(true);
    await new Promise(r => setTimeout(r, 900));
    login({ nombre: form.nombre, email: form.email });
    onCerrar();
    setCargando(false);
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

  const handleGoogleMock = async () => {
    setCargando(true);
    await new Promise(r => setTimeout(r, 600));
    login({ nombre: "Usuario Google", email: "google@antojapp.co", esGoogle: true });
    onCerrar();
    setCargando(false);
  };

  return (
    /* Overlay */
    <div
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,18,8,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 60px rgba(0,0,0,.18)",
        overflow: "hidden", animation: "slideUp .22s ease"
      }}>
        {/* Header */}
        <div style={{
          background: "#1A1208", padding: "24px 28px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
              {vista === "login" && "¡Bienvenido de nuevo!"}
              {vista === "registro" && "Crea tu cuenta"}
              {vista === "recuperar" && "Recuperar contraseña"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 3 }}>
              {vista === "login" && "Inicia sesión para guardar tus antojos"}
              {vista === "registro" && "Es gratis y toma menos de un minuto"}
              {vista === "recuperar" && "Te enviamos un correo con instrucciones"}
            </div>
          </div>
          <button onClick={onCerrar} style={{
            color: "rgba(255,255,255,.5)", fontSize: 22, lineHeight: 1,
            background: "none", border: "none", cursor: "pointer", padding: 4
          }}>×</button>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* BOTÓN GOOGLE */}
          {vista !== "recuperar" && (
            <>
              <button
                onClick={handleGoogleMock}
                disabled={cargando}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#fff", border: "1.5px solid #E2DBD5",
                  padding: "11px 16px", borderRadius: 12,
                  fontSize: 15, fontWeight: 500, cursor: "pointer",
                  transition: "border-color 0.18s, box-shadow 0.18s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.06)"
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = "#A8988A"}
                onMouseOut={e => e.currentTarget.style.borderColor = "#E2DBD5"}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuar con Google
              </button>

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
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
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
                  ← Volver al inicio de sesión
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