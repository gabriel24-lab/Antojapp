import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { apiFetch } from "./apiClient";
import API_URL from "./api";
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
  const { user } = useAuth();
  const [vista,          setVista]          = useState("home");
  const [negocioActivo,  setNegocioActivo]  = useState(null);
  const [authAbierto,    setAuthAbierto]    = useState(false);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [negocioEditar,  setNegocioEditar]  = useState(null);
  const [busqueda,       setBusqueda]       = useState("");

  // ── Conteo de negocios del propietario (para el límite) ─────────────────
  const [totalNegocios,  setTotalNegocios]  = useState(0);
  const [limiteNegocios, setLimiteNegocios] = useState(4);

  // ── Estado de ubicación global (Navbar → HomePage) ──────────────────────
  const [paisSeleccionado,         setPaisSeleccionado]         = useState(null);
  const [paisNombre,               setPaisNombre]               = useState(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [ciudadSeleccionada,       setCiudadSeleccionada]       = useState(null);

  // Cargar conteo de negocios cuando el propietario inicia sesión
  useEffect(() => {
    if (user?.rol !== "negocio") {
      setTotalNegocios(0);
      return;
    }
    apiFetch("/negocios/mio/negocio").then(({ data }) => {
      if (data?.total !== undefined) {
        setTotalNegocios(data.total);
        setLimiteNegocios(data.limite ?? 4);
      }
    });
  }, [user]);

  const handleCambiarUbicacion = ({ iso2, nombre, pais, departamento, ciudad }) => {
    setPaisSeleccionado(iso2 || pais || null);
    setPaisNombre(nombre || null);
    setDepartamentoSeleccionado(departamento || null);
    setCiudadSeleccionada(ciudad || null);
  };

  const irInicio   = () => { setVista("home"); setNegocioActivo(null); setBusqueda(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const irNegocios = () => { setVista("negocios"); setNegocioActivo(null); };

  // Llama a GET /api/negocios/:id para registrar la visita en la BD
  // y obtener los datos más frescos (reseñas actualizadas, etc.)
  const verDetalle = async (negocio) => {
    // Mostrar el detalle de inmediato con los datos que ya tenemos
    setNegocioActivo(negocio);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Llamar al backend en segundo plano: registra la visita y refresca los datos
    try {
      const res = await fetch(`${API_URL}/negocios/${negocio.id}`);
      if (res.ok) {
        const datos = await res.json();
        // Actualizar con los datos frescos del servidor
        setNegocioActivo(datos);
      }
    } catch {
      // Si falla la red, el detalle sigue mostrándose con los datos en caché
    }
  };

  const volver = () => { setVista("home"); setNegocioActivo(null); };

  const abrirFormulario = (negocio = null) => {
    setNegocioEditar(negocio);
    setFormularioOpen(true);
  };

  const cerrarFormulario = (refrescar) => {
    setFormularioOpen(false);
    setNegocioEditar(null);
    if (refrescar) {
      setVista("panel");
      // Recargar el conteo de negocios al crear uno nuevo
      apiFetch("/negocios/mio/negocio").then(({ data }) => {
        if (data?.total !== undefined) setTotalNegocios(data.total);
      });
    }
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
        // Límite de negocios
        totalNegociosPropietario={totalNegocios}
        limiteNegocios={limiteNegocios}
      />

      <main style={{ flex: 1 }}>
        {mostrarHome && (
          <HomePage
            onVerDetalle={verDetalle}
            onAbrirAuth={() => setAuthAbierto(true)}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            modoNegocios={vista === "negocios"}
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