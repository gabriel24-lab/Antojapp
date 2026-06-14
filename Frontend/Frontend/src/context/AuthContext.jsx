import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [toast,     setToast]     = useState(null); // { mensaje, tipo: "exito"|"info"|"error" }
  const toastTimer = useRef(null);

  // Mostrar un toast durante ~3s
  const mostrarToast = useCallback((mensaje, tipo = "exito") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ mensaje, tipo });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Al montar, verifica token guardado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCargando(false); return; }

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(userData => {
        setUser(userData);
        return fetch(`${API_URL}/favoritos/ids`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r.ok ? r.json() : [])
      .then(ids => setFavoritos(ids))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setCargando(false));
  }, []);

  // Guarda token + usuario y muestra toast de bienvenida
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
    mostrarToast(`¡Bienvenido, ${userData.nombre?.split(" ")[0]}!`, "exito");
    fetch(`${API_URL}/favoritos/ids`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(ids => setFavoritos(ids))
      .catch(() => setFavoritos([]));
  }, [mostrarToast]);

  const logout = useCallback(() => {
    const nombre = user?.nombre?.split(" ")[0] || "";
    localStorage.removeItem("token");
    setUser(null);
    setFavoritos([]);
    mostrarToast(`Sesión cerrada${nombre ? `, hasta pronto ${nombre}` : ""}`, "info");
  }, [user, mostrarToast]);

  const toggleFavorito = useCallback(async (negocioId) => {
    if (!user) return false;
    const token        = localStorage.getItem("token");
    const estaGuardado = favoritos.includes(negocioId);
    const metodo       = estaGuardado ? "DELETE" : "POST";

    setFavoritos(prev =>
      estaGuardado ? prev.filter(id => id !== negocioId) : [...prev, negocioId]
    );

    try {
      const res = await fetch(`${API_URL}/favoritos/${negocioId}`, {
        method: metodo, headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavoritos(prev =>
        estaGuardado ? [...prev, negocioId] : prev.filter(id => id !== negocioId)
      );
    }
    return true;
  }, [user, favoritos]);

  const esFavorito = useCallback(
    (negocioId) => favoritos.includes(negocioId),
    [favoritos]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, favoritos, toggleFavorito, esFavorito, cargando, mostrarToast }}>
      {children}
      {/* Toast global — renderizado aquí para que esté siempre disponible */}
      <Toast toast={toast} onCerrar={() => setToast(null)} />
    </AuthContext.Provider>
  );
}

// ── Toast flotante ────────────────────────────────────────────
function Toast({ toast, onCerrar }) {
  if (!toast) return null;

  const colores = {
    exito: { bg: "#1A8C5B", borde: "#15754C", iconName: "check" },
    info:  { bg: "#1A1208", borde: "#2D1F0F", iconName: "partyPopper" },
    error: { bg: "#C0392B", borde: "#9B2D23", iconName: "alert" },
  };
  const c = colores[toast.tipo] || colores.exito;

  return (
    <div style={{
      position:   "fixed",
      bottom:     28,
      left:       "50%",
      transform:  "translateX(-50%)",
      zIndex:     9999,
      animation:  "toastIn 0.3s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <div style={{
        background:   c.bg,
        border:       `1px solid ${c.borde}`,
        borderRadius: 14,
        padding:      "13px 20px",
        display:      "flex",
        alignItems:   "center",
        gap:          12,
        boxShadow:    "0 8px 32px rgba(0,0,0,.28)",
        minWidth:     260,
        maxWidth:     "90vw",
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color: "#fff",
        }}>
          <AppIcon name={c.iconName} size={15} color="#fff" />
        </span>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 500, flex: 1 }}>
          {toast.mensaje}
        </span>
        <button
          onClick={onCerrar}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,.5)",
            cursor: "pointer", lineHeight: 1, padding: "0 0 0 4px",
            flexShrink: 0, display: "flex", alignItems: "center",
          }}
        >
          <AppIcon name="x" size={16} color="rgba(255,255,255,.5)" />
        </button>
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 16px) scale(.92); }
          to   { opacity: 1; transform: translate(-50%, 0)    scale(1);   }
        }
      `}</style>
    </div>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}