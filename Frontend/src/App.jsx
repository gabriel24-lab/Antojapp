import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UbicacionProvider } from "./context/UbicacionContext";
import { apiFetch } from "./apiClient";
import API_URL from "./api";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./index.css";

// Lazy loading de páginas y modales pesados para code-splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const FavoritosPage = lazy(() => import("./pages/FavoritosPage"));
const BusinessDetail = lazy(() => import("./components/BusinessDetail"));
const PanelPropietario = lazy(() => import("./pages/PanelPropietario"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const EditarPerfilPage = lazy(() => import("./pages/EditarPerfilPage"));
const AyudaPage = lazy(() => import("./pages/AyudaPage"));
const TerminosPage = lazy(() => import("./pages/TerminosPage"));
const PrivacidadPage = lazy(() => import("./pages/PrivacidadPage"));
const FormularioNegocio = lazy(() => import("./components/FormularioNegocio"));

const PageLoader = () => (
  <div style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <div className="spinner"></div>
  </div>
);

function AppContent() {
  const { user } = useAuth();
  const [vista,          setVista]          = useState("home");
  const [vistaAnterior,  setVistaAnterior]  = useState("home"); // para volver tras el auth
  const [negocioActivo,  setNegocioActivo]  = useState(null);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [negocioEditar,  setNegocioEditar]  = useState(null);
  const [busqueda,       setBusqueda]       = useState("");
  const [vistaAuthInicial, setVistaAuthInicial] = useState("login");

  // ── Conteo de negocios del propietario (para el límite) ─────────────────
  const [totalNegocios,  setTotalNegocios]  = useState(0);
  const [limiteNegocios, setLimiteNegocios] = useState(4);

  useEffect(() => {
    if (user?.rol !== "negocio") { setTotalNegocios(0); return; }
    apiFetch("/negocios/mio/negocio").then(({ data }) => {
      if (data?.total !== undefined) {
        setTotalNegocios(data.total);
        setLimiteNegocios(data.limite ?? 4);
      }
    });
  }, [user]);

  // Cuando el usuario cierra sesión o inicia, salir de auth si estábamos ahí
  useEffect(() => {
    if (user && vista === "auth") {
      setVista(vistaAnterior === "auth" ? "home" : vistaAnterior);
    }
  }, [user]);

  const irAuth = (vistaForm = "login") => {
    setVistaAnterior(vista === "auth" ? vistaAnterior : vista);
    setVistaAuthInicial(vistaForm);
    setVista("auth");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cerrarAuth = () => {
    setVista(vistaAnterior === "auth" ? "home" : vistaAnterior);
  };

  const irInicio   = () => { setVista("home"); setNegocioActivo(null); setBusqueda(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const irNegocios = () => { setVista("negocios"); setNegocioActivo(null); };

  const verDetalle = async (negocio) => {
    setNegocioActivo(negocio);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const res = await fetch(`${API_URL}/negocios/${negocio.id}`);
      if (res.ok) { const datos = await res.json(); setNegocioActivo(datos); }
    } catch { /* usa los datos en caché */ }
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

  // ── Si estamos en la página de auth, la mostramos sola (sin navbar/footer) ──
  if (vista === "auth") {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage
          vistaInicial={vistaAuthInicial}
          onCerrar={cerrarAuth}
          onExito={cerrarAuth}
        />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      <Navbar
        onAbrirAuth={irAuth}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
        onAbrirPanel={() => setVista("panel")}
        onAbrirPerfil={() => setVista("perfil")}
        onAbrirFormulario={() => abrirFormulario(null)}
        vistaActual={vista}
        busqueda={busqueda}
        onBusqueda={handleBusqueda}
        onIrInicio={irInicio}
        onIrNegocios={irNegocios}
        totalNegociosPropietario={totalNegocios}
        limiteNegocios={limiteNegocios}
      />

      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          {mostrarHome && (
            <HomePage
              onVerDetalle={verDetalle}
              onAbrirAuth={() => irAuth("login")}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              modoNegocios={vista === "negocios"}
            />
          )}

          {vista === "favoritos" && (
            <FavoritosPage
              onVerDetalle={verDetalle}
              onAbrirAuth={() => irAuth("login")}
              onVolver={volver}
            />
          )}

          {vista === "detalle" && negocioActivo && (
            <BusinessDetail
              negocio={negocioActivo}
              onVolver={volver}
              onAbrirAuth={() => irAuth("login")}
            />
          )}

          {vista === "panel" && (
            <PanelPropietario onAbrirFormulario={abrirFormulario} />
          )}

          {vista === "perfil" && (
            <PerfilPage
              onVerDetalle={verDetalle}
              onAbrirPanel={() => setVista("panel")}
              onIrInicio={irInicio}
              onEditarPerfil={() => {
                setVista("editar-perfil");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {vista === "editar-perfil" && (
            <EditarPerfilPage
              onVolver={() => {
                setVista("perfil");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {vista === "ayuda" && (
            <AyudaPage onIrInicio={irInicio} />
          )}

          {vista === "terminos" && (
            <TerminosPage onIrInicio={irInicio} />
          )}

          {vista === "privacidad" && (
            <PrivacidadPage onIrInicio={irInicio} />
          )}
        </Suspense>
      </main>

      <Footer
        onIrInicio={irInicio}
        onIrNegocios={irNegocios}
        onVerFavoritos={(ir) => setVista(ir ? "favoritos" : "home")}
        onIrAyuda={() => { setVista("ayuda"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onIrTerminos={() => { setVista("terminos"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onIrPrivacidad={() => { setVista("privacidad"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />

      <Suspense fallback={null}>
        {formularioOpen && (
          <FormularioNegocio negocioInicial={negocioEditar} onCerrar={cerrarFormulario} />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UbicacionProvider>
        <AppContent />
      </UbicacionProvider>
    </AuthProvider>
  );
}