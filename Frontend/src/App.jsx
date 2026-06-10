import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import FormularioNegocio from "./components/FormularioNegocio";
import HomePage from "./pages/HomePage";
import FavoritosPage from "./pages/FavoritosPage";
import BusinessDetail from "./components/BusinessDetail";
import "./index.css";

function AppContent() {
  const [vista,          setVista]          = useState("home"); // home | favoritos | detalle | panel
  const [negocioActivo,  setNegocioActivo]  = useState(null);
  const [authAbierto,    setAuthAbierto]    = useState(false);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [negocioEditar,  setNegocioEditar]  = useState(null); // null = crear, objeto = editar

  const verDetalle = (negocio) => {
    setNegocioActivo(negocio);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volver = () => {
    setVista("home");
    setNegocioActivo(null);
  };

  const abrirFormulario = (negocio = null) => {
    setNegocioEditar(negocio);
    setFormularioOpen(true);
  };

  const cerrarFormulario = (refrescar) => {
    setFormularioOpen(false);
    setNegocioEditar(null);
    if (refrescar) setVista("panel");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar
        onAbrirAuth={() => setAuthAbierto(true)}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
        onAbrirPanel={() => setVista("panel")}
        onAbrirFormulario={() => abrirFormulario(null)}
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

      {vista === "panel" && (
        // PanelPropietario se construirá en la Fase 5
        // Por ahora mostramos un placeholder que se reemplazará
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, color: "#1A1208" }}>Panel del propietario</h2>
          <p style={{ color: "#A8988A", marginTop: 8 }}>Aquí verás tus estadísticas. Próximamente.</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => abrirFormulario(null)}>
            + Registrar mi negocio
          </button>
        </div>
      )}

      {authAbierto && (
        <AuthModal onCerrar={() => setAuthAbierto(false)} />
      )}

      {formularioOpen && (
        <FormularioNegocio
          negocioInicial={negocioEditar}
          onCerrar={cerrarFormulario}
        />
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
