import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import FormularioNegocio from "./components/FormularioNegocio";
import HomePage from "./pages/HomePage";
import FavoritosPage from "./pages/FavoritosPage";
import BusinessDetail from "./components/BusinessDetail";
import PanelPropietario from "./pages/PanelPropietario";
import "./index.css";

function AppContent() {
  const [vista,          setVista]          = useState("home");
  const [negocioActivo,  setNegocioActivo]  = useState(null);
  const [authAbierto,    setAuthAbierto]    = useState(false);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [negocioEditar,  setNegocioEditar]  = useState(null);
  const [busqueda,       setBusqueda]       = useState("");  // ← estado global de búsqueda

  const irInicio = () => {
    setVista("home");
    setNegocioActivo(null);
  };

  const irNegocios = () => {
    setVista("negocios");
    setNegocioActivo(null);
  };

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

  // Si el usuario escribe en el navbar y no está en home/negocios, lo lleva a home
  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    if (vista !== "home" && vista !== "negocios") setVista("home");
  };

  // home y negocios muestran el mismo componente (HomePage) pero
  // "negocios" hace scroll directo a los resultados (sin hero)
  const mostrarHome = vista === "home" || vista === "negocios";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar
        onAbrirAuth={() => setAuthAbierto(true)}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
        onAbrirPanel={() => setVista("panel")}
        onAbrirFormulario={() => abrirFormulario(null)}
        vistaActual={vista}
        busqueda={busqueda}
        onBusqueda={handleBusqueda}
        onIrInicio={irInicio}
        onIrNegocios={irNegocios}
      />

      <main style={{ flex: 1 }}>
        {mostrarHome && (
          <HomePage
            onVerDetalle={verDetalle}
            onAbrirAuth={() => setAuthAbierto(true)}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            modoNegocios={vista === "negocios"}
          />
        )}

        {vista === "favoritos" && (
          <FavoritosPage
            onVerDetalle={verDetalle}
            onAbrirAuth={() => setAuthAbierto(true)}
            onVolver={volver}
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
          <PanelPropietario onAbrirFormulario={abrirFormulario} />
        )}
      </main>

      {/* Footer visible en todas las vistas excepto cuando hay modal */}
      <Footer
        onIrInicio={irInicio}
        onIrNegocios={irNegocios}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
      />

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