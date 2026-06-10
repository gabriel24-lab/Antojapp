import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API_URL from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [favoritos, setFavoritos] = useState([]); // array de IDs
  const [cargando,  setCargando]  = useState(true); // mientras verifica el token al inicio

  // Al montar, si hay token guardado lo verifica con el backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCargando(false); return; }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(userData => {
        setUser(userData);
        return fetch(`${API_URL}/favoritos/ids`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(r => r.ok ? r.json() : [])
      .then(ids => setFavoritos(ids))
      .catch(() => {
        // Token inválido o expirado → limpiar
        localStorage.removeItem("token");
      })
      .finally(() => setCargando(false));
  }, []);

  // Guarda token + usuario después de login/registro
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
    // Cargar favoritos del usuario recién autenticado
    fetch(`${API_URL}/favoritos/ids`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(ids => setFavoritos(ids))
      .catch(() => setFavoritos([]));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setFavoritos([]);
  }, []);

  const toggleFavorito = useCallback(async (negocioId) => {
    if (!user) return false;
    const token     = localStorage.getItem("token");
    const estaGuardado = favoritos.includes(negocioId);
    const metodo    = estaGuardado ? "DELETE" : "POST";

    // Optimistic update
    setFavoritos(prev =>
      estaGuardado
        ? prev.filter(id => id !== negocioId)
        : [...prev, negocioId]
    );

    try {
      const res = await fetch(`${API_URL}/favoritos/${negocioId}`, {
        method: metodo,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revertir si falló
      setFavoritos(prev =>
        estaGuardado
          ? [...prev, negocioId]
          : prev.filter(id => id !== negocioId)
      );
    }
    return true;
  }, [user, favoritos]);

  const esFavorito = useCallback(
    (negocioId) => favoritos.includes(negocioId),
    [favoritos]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, favoritos, toggleFavorito, esFavorito, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
