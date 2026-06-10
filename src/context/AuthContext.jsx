import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favoritos, setFavoritos] = useState([]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setFavoritos([]);
  };

  const toggleFavorito = (negocioId) => {
    if (!user) return false;
    setFavoritos((prev) =>
      prev.includes(negocioId)
        ? prev.filter((id) => id !== negocioId)
        : [...prev, negocioId]
    );
    return true;
  };

  const esFavorito = (negocioId) => favoritos.includes(negocioId);

  return (
    <AuthContext.Provider value={{ user, login, logout, favoritos, toggleFavorito, esFavorito }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}