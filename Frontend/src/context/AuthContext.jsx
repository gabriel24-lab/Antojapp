import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const mostrarToast = useCallback((mensaje, tipo = "exito") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ mensaje, tipo });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Al montar, verifica si hay sesión activa (cookie HttpOnly la envía el browser automáticamente)
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((userData) => {
        setUser(userData);
        return fetch(`${API_URL}/favoritos/ids`, { credentials: "include" });
      })
      .then((r) => (r.ok ? r.json() : []))
      .then((ids) => setFavoritos(ids))
      .catch(() => {
        /* no hay sesión activa — es normal */
      })
      .finally(() => setCargando(false));
  }, []);

  // El backend ya no envía el JWT en el body de la respuesta (solo cookie HttpOnly)
  const login = useCallback(
    (token, userData) => {
      // Parámetro "token" se mantiene por compatibilidad de firma, pero ya no se usa
      setUser(userData);
      mostrarToast(`¡Bienvenido, ${userData.nombre?.split(" ")[0]}!`, "exito");
      fetch(`${API_URL}/favoritos/ids`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((ids) => setFavoritos(ids))
        .catch(() => setFavoritos([]));
    },
    [mostrarToast],
  );

  const logout = useCallback(async () => {
    const nombre = user?.nombre?.split(" ")[0] || "";
    // Llamar al endpoint que borra la cookie HttpOnly en el servidor
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    setFavoritos([]);
    mostrarToast(
      `Sesión cerrada${nombre ? `, hasta pronto ${nombre}` : ""}`,
      "info",
    );
  }, [user, mostrarToast]);

  const toggleFavorito = useCallback(
    async (negocioId) => {
      if (!user) return false;
      const estaGuardado = favoritos.includes(negocioId);
      const metodo = estaGuardado ? "DELETE" : "POST";

      setFavoritos((prev) =>
        estaGuardado
          ? prev.filter((id) => id !== negocioId)
          : [...prev, negocioId],
      );

      try {
        const res = await fetch(`${API_URL}/favoritos/${negocioId}`, {
          method: metodo,
          credentials: "include",
        });
        if (!res.ok) throw new Error();
      } catch {
        setFavoritos((prev) =>
          estaGuardado
            ? [...prev, negocioId]
            : prev.filter((id) => id !== negocioId),
        );
      }
      return true;
    },
    [user, favoritos],
  );

  const esFavorito = useCallback(
    (negocioId) => favoritos.includes(negocioId),
    [favoritos],
  );

  // Actualiza los datos del usuario en memoria (tras editar perfil, foto, etc.)
  const actualizarUsuario = useCallback((datos) => {
    setUser((prev) => (prev ? { ...prev, ...datos } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        favoritos,
        toggleFavorito,
        esFavorito,
        cargando,
        mostrarToast,
        actualizarUsuario,
      }}
    >
      {children}
      <Toast toast={toast} onCerrar={() => setToast(null)} />
    </AuthContext.Provider>
  );
}

// ── Toast flotante ────────────────────────────────────────────
function Toast({ toast, onCerrar }) {
  if (!toast) return null;

  const colores = {
    exito: { bg: "var(--green)", borde: "#15754C", iconName: "check" },
    info: { bg: "var(--text-1)", borde: "#2D1F0F", iconName: "partyPopper" },
    error: { bg: "var(--red)", borde: "#9B2D23", iconName: "alert" },
  };
  const c = colores[toast.tipo] || colores.exito;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        animation: "toastIn 0.3s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <div
        style={{
          background: c.bg,
          border: `1px solid ${c.borde}`,
          borderRadius: 14,
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,.28)",
          minWidth: 260,
          maxWidth: "90vw",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--surface)",
          }}
        >
          <AppIcon name={c.iconName} size={15} color="#fff" />
        </span>
        <span
          style={{
            color: "var(--surface)",
            fontSize: 14,
            fontWeight: 500,
            flex: 1,
          }}
        >
          {toast.mensaje}
        </span>
        <button
          onClick={onCerrar}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,.5)",
            cursor: "pointer",
            lineHeight: 1,
            padding: "0 0 0 4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
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
