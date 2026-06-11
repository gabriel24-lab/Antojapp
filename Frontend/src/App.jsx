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
  const [busqueda,       setBusqueda]       = useState("");

  // ── Estado de ubicación global (Navbar → HomePage) ──────────────────────
  const [paisSeleccionado,         setPaisSeleccionado]         = useState(null); // iso2 code
  const [paisNombre,               setPaisNombre]               = useState(null); // legible
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [ciudadSeleccionada,       setCiudadSeleccionada]       = useState(null);

  // Acepta { iso2, nombre, departamento, ciudad } (desde NavLocationPicker)
  // o     { pais, departamento, ciudad }          (legado desde HomePage GPS)
  const handleCambiarUbicacion = ({ iso2, nombre, pais, departamento, ciudad }) => {
    setPaisSeleccionado(iso2 || pais || null);
    setPaisNombre(nombre || null);
    setDepartamentoSeleccionado(departamento || null);
    setCiudadSeleccionada(ciudad || null);
  };

  const irInicio   = () => { setVista("home");     setNegocioActivo(null); setBusqueda(""); };
  const irNegocios = () => { setVista("negocios"); setNegocioActivo(null); };

  const verDetalle = (negocio) => {
    setNegocioActivo(negocio);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volver = () => { setVista("home"); setNegocioActivo(null); };

  const abrirFormulario = (negocio = null) => {
    setNegocioEditar(negocio);
    setFormularioOpen(true);
  };

  const cerrarFormulario = (refrescar) => {
    setFormularioOpen(false);
    setNegocioEditar(null);
    if (refrescar) setVista("panel");
  };

  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    if (vista !== "home" && vista !== "negocios") setVista("home");
  };

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
        // Ubicación
        paisSeleccionado={paisSeleccionado}
        paisNombre={paisNombre}
        departamentoSeleccionado={departamentoSeleccionado}
        ciudadSeleccionada={ciudadSeleccionada}
        onCambiarUbicacion={handleCambiarUbicacion}
      />

      <main style={{ flex: 1 }}>
        {mostrarHome && (
          <HomePage
            onVerDetalle={verDetalle}
            onAbrirAuth={() => setAuthAbierto(true)}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            modoNegocios={vista === "negocios"}
            // Ubicación desde el navbar
            paisSeleccionado={paisSeleccionado}
            paisNombre={paisNombre}
            departamentoSeleccionado={departamentoSeleccionado}
            ciudadSeleccionada={ciudadSeleccionada}
            onCambiarUbicacion={handleCambiarUbicacion}
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

      <Footer
        onIrInicio={irInicio}
        onIrNegocios={irNegocios}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
      />

      {authAbierto   && <AuthModal onCerrar={() => setAuthAbierto(false)} />}
      {formularioOpen && (
        <FormularioNegocio negocioInicial={negocioEditar} onCerrar={cerrarFormulario} />
      )}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
