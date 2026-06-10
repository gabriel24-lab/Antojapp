import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import HomePage from "./pages/HomePage";
import FavoritosPage from "./pages/FavoritosPage";
import BusinessDetail from "./components/BusinessDetail";
import "./index.css";

function AppContent() {
  const [vista, setVista] = useState("home"); // home | favoritos | detalle
  const [negocioActivo, setNegocioActivo] = useState(null);
  const [authAbierto, setAuthAbierto] = useState(false);

  const verDetalle = (negocio) => {
    setNegocioActivo(negocio);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volver = () => {
    setVista("home");
    setNegocioActivo(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar
        onAbrirAuth={() => setAuthAbierto(true)}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
        vistaActual={vista}
      />

      {vista === "home" && (
        <HomePage
          onVerDetalle={verDetalle}
          onAbrirAuth={() => setAuthAbierto(true)}
        />
      )}

      {vista === "favoritos" && (
        <FavoritosPage
          onVerDetalle={verDetalle}
          onAbrirAuth={() => setAuthAbierto(true)}
        />
      )}

      {vista === "detalle" && negocioActivo && (
        <BusinessDetail
          negocio={negocioActivo}
          onVolver={volver}
          onAbrirAuth={() => setAuthAbierto(true)}
        />
      )}

      {authAbierto && (
        <AuthModal onCerrar={() => setAuthAbierto(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
