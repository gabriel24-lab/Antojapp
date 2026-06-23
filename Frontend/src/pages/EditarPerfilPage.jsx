import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "../components/AppIcon";

export default function EditarPerfilPage({ onVolver }) {
  const { user, actualizarUsuario, mostrarToast } = useAuth();

  const [vista, setVista] = useState("datos"); // datos | password | negocio

  const esPropietario = user?.rol === "negocio";
  const esGoogle = !!user?.es_google;

  // ── Datos del perfil ─────────────────────────────────────
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [foto, setFoto] = useState(user?.foto_perfil || null);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [errorDatos, setErrorDatos] = useState("");
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // ── Cambio de contraseña ─────────────────────────────────
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [cargandoPassword, setCargandoPassword] = useState(false);
  const [exitoPassword, setExitoPassword] = useState("");

  // ── Negocio ──────────────────────────────────────────────
  const [negocioId, setNegocioId] = useState(null);
  const [negocioData, setNegocioData] = useState({
    nombre: "",
    categoria: "",
    descripcion: "",
    whatsapp: "",
    instagram: "",
    maps_url: "",
  });
  const [categoriasPosibles, setCategoriasPosibles] = useState([]);
  const [cargandoNegocio, setCargandoNegocio] = useState(false);
  const [errorNegocio, setErrorNegocio] = useState("");
  const [guardandoNegocio, setGuardandoNegocio] = useState(false);

  useEffect(() => {
    if (esPropietario) {
      setCargandoNegocio(true);
      fetch(`${API_URL}/negocios/categorias`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCategoriasPosibles(data))
        .catch(() => {});

      fetch(`${API_URL}/negocios/mio/negocio`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          const neg = data.negocio || (data.negocios && data.negocios[0]);
          if (neg) {
            setNegocioId(neg.id);
            setNegocioData({
              nombre: neg.nombre || "",
              categoria: neg.categoria || "",
              descripcion: neg.descripcion || "",
              whatsapp: neg.whatsapp || "",
              instagram: neg.instagram || "",
              maps_url: neg.maps_url || "",
            });
          }
        })
        .catch(() =>
          setErrorNegocio(
            "Aún no tienes un negocio registrado o hubo un error.",
          ),
        )
        .finally(() => setCargandoNegocio(false));
    }
  }, [esPropietario]);

  const seleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorDatos("");

    if (!file.type.startsWith("image/")) {
      setErrorDatos("Solo se permiten imágenes");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorDatos("La imagen no puede superar 2 MB");
      return;
    }

    setArchivo(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Guardar nombre + foto ────────────────────────────────
  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setErrorDatos("");

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return setErrorDatos("El nombre no puede estar vacío");
    if (nombreLimpio.length > 100)
      return setErrorDatos("El nombre no puede superar 100 caracteres");

    setCargandoDatos(true);
    try {
      let usuarioActualizado = null;

      if (archivo) {
        const formData = new FormData();
        formData.append("foto", archivo);

        const resFoto = await fetch(`${API_URL}/auth/foto`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const dataFoto = await resFoto.json();
        if (!resFoto.ok) {
          setErrorDatos(dataFoto.error || "No se pudo subir la foto");
          return;
        }
        usuarioActualizado = dataFoto;
        setFoto(dataFoto.foto_perfil);
      }

      if (nombreLimpio !== user?.nombre) {
        const resNombre = await fetch(`${API_URL}/auth/perfil`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreLimpio }),
        });
        const dataNombre = await resNombre.json();
        if (!resNombre.ok) {
          setErrorDatos(dataNombre.error || "No se pudo actualizar el nombre");
          return;
        }
        usuarioActualizado = dataNombre;
      }

      if (usuarioActualizado) actualizarUsuario(usuarioActualizado);

      setArchivo(null);
      setPreview(null);
      mostrarToast("Perfil actualizado", "exito");
      onVolver();
    } catch {
      setErrorDatos(
        "Ups, algo salió mal. Estamos trabajando en ello, intenta más tarde.",
      );
    } finally {
      setCargandoDatos(false);
    }
  };

  // ── Cambiar contraseña ───────────────────────────────────
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword("");
    setExitoPassword("");

    if (!esGoogle && !passwordActual)
      return setErrorPassword("Ingresa tu contraseña actual");
    if (passwordNueva.length < 8)
      return setErrorPassword(
        "La nueva contraseña debe tener al menos 8 caracteres",
      );
    if (!/[A-Z]/.test(passwordNueva))
      return setErrorPassword(
        "La nueva contraseña debe contener al menos una mayúscula",
      );
    if (!/[0-9]/.test(passwordNueva))
      return setErrorPassword(
        "La nueva contraseña debe contener al menos un número",
      );
    if (passwordNueva !== passwordConfirmar)
      return setErrorPassword("Las contraseñas no coinciden");

    setCargandoPassword(true);
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordActual: passwordActual || undefined,
          passwordNueva,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorPassword(data.error || "No se pudo actualizar la contraseña");
        return;
      }
      setExitoPassword(
        data.mensaje || "Contraseña actualizada. Vuelve a iniciar sesión.",
      );
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch {
      setErrorPassword(
        "Ups, algo salió mal. Estamos trabajando en ello, intenta más tarde.",
      );
    } finally {
      setCargandoPassword(false);
    }
  };

  // ── Guardar Negocio ──────────────────────────────────────
  const handleGuardarNegocio = async (e) => {
    e.preventDefault();
    setErrorNegocio("");

    if (!negocioId)
      return setErrorNegocio("No se pudo identificar el negocio.");
    if (!negocioData.nombre.trim())
      return setErrorNegocio("El nombre del negocio es obligatorio.");
    if (!negocioData.categoria.trim())
      return setErrorNegocio("La categoría es obligatoria.");

    setGuardandoNegocio(true);
    try {
      const res = await fetch(`${API_URL}/negocios/${negocioId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(negocioData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorNegocio(data.error || "No se pudo actualizar el negocio.");
        return;
      }
      mostrarToast("Negocio actualizado exitosamente", "exito");
    } catch {
      setErrorNegocio(
        "Ups, algo salió mal. Estamos trabajando en ello, intenta más tarde.",
      );
    } finally {
      setGuardandoNegocio(false);
    }
  };

  const handleChangeNegocio = (e) => {
    setNegocioData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inicial = user?.nombre?.charAt(0).toUpperCase() || "?";
  const imagenMostrar = preview || foto;

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "32px var(--content-px, 16px) 80px",
        animation: "fadeUp 0.35s ease-out forwards",
      }}
    >
      {/* Encabezado con botón volver */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <button
          onClick={onVolver}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            color: "var(--text-2)",
            flexShrink: 0,
            transition: "background .15s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "var(--surface-2)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "var(--surface)")
          }
        >
          <AppIcon name="arrowLeft" size={18} />
        </button>
        <div>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--text-1)",
              margin: 0,
            }}
          >
            Editar perfil
          </h1>
          <p
            style={{ fontSize: 13, color: "var(--text-3)", margin: "2px 0 0" }}
          >
            {vista === "datos"
              ? "Actualiza tu información personal"
              : vista === "password"
                ? "Cambia tu contraseña"
                : "Administra tu negocio"}
          </p>
        </div>
      </div>

      {/* Tarjeta principal */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
        {/* Franja superior con avatar */}
        <div
          style={{
            background: "var(--text-1)",
            padding: "28px 28px 24px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            onClick={() => vista === "datos" && fileInputRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              flexShrink: 0,
              background: imagenMostrar
                ? `url(${imagenMostrar}) center/cover`
                : "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--surface)",
              cursor: vista === "datos" ? "pointer" : "default",
              position: "relative",
              border: "3px solid rgba(255,255,255,0.15)",
            }}
          >
            {!imagenMostrar && inicial}
            {vista === "datos" && (
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--brand)",
                  border: "2px solid var(--text-1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--surface)",
                }}
              >
                <AppIcon name="camera" size={12} />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={seleccionarFoto}
            style={{ display: "none" }}
          />
          <div>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--surface)",
              }}
            >
              {user?.nombre}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.45)",
                marginTop: 2,
              }}
            >
              {user?.email}
            </div>
            {vista === "datos" && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.6)",
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "background .15s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.15)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.08)")
                }
              >
                Cambiar foto
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "20px 24px 0" }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--surface-2)",
              borderRadius: 12,
              padding: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setVista("datos")}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                background:
                  vista === "datos" ? "var(--surface)" : "transparent",
                color: vista === "datos" ? "var(--text-1)" : "var(--text-3)",
                boxShadow:
                  vista === "datos" ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                transition: "all .18s ease",
              }}
            >
              Datos
            </button>
            <button
              type="button"
              onClick={() => setVista("password")}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                background:
                  vista === "password" ? "var(--surface)" : "transparent",
                color: vista === "password" ? "var(--text-1)" : "var(--text-3)",
                boxShadow:
                  vista === "password" ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                transition: "all .18s ease",
              }}
            >
              Contraseña
            </button>
            {esPropietario && (
              <button
                type="button"
                onClick={() => setVista("negocio")}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  background:
                    vista === "negocio" ? "var(--surface)" : "transparent",
                  color:
                    vista === "negocio" ? "var(--text-1)" : "var(--text-3)",
                  boxShadow:
                    vista === "negocio" ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                  transition: "all .18s ease",
                }}
              >
                Negocio
              </button>
            )}
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div style={{ padding: "24px" }}>
          {/* ── PESTAÑA DATOS ── */}
          {vista === "datos" && (
            <form
              onSubmit={handleGuardarDatos}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-2)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Nombre completo
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrorDatos("");
                  }}
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-2)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Correo electrónico
                </label>
                <input
                  className="input"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  style={{ opacity: 0.55, cursor: "not-allowed" }}
                />
                <p
                  style={{ fontSize: 12, color: "var(--text-3)", marginTop: 5 }}
                >
                  El correo no se puede cambiar.
                </p>
              </div>

              {errorDatos && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--red)",
                    background: "var(--red-bg)",
                    padding: "10px 14px",
                    borderRadius: 10,
                  }}
                >
                  {errorDatos}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onVolver}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={cargandoDatos}
                  style={{ flex: 2 }}
                >
                  {cargandoDatos ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}

          {/* ── PESTAÑA CONTRASEÑA ── */}
          {vista === "password" && (
            <>
              {exitoPassword ? (
                <div
                  style={{
                    background: "var(--green-bg)",
                    border: "1px solid var(--green)",
                    borderRadius: 12,
                    padding: "24px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ marginBottom: 10, color: "var(--green)" }}>
                    <AppIcon name="check" size={34} />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--green)",
                      fontWeight: 600,
                    }}
                  >
                    {exitoPassword}
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={onVolver}
                    style={{ marginTop: 18 }}
                  >
                    Volver al perfil
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleCambiarPassword}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {!esGoogle && (
                    <div>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-2)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Contraseña actual
                      </label>
                      <input
                        className="input"
                        type="password"
                        placeholder="••••••••"
                        value={passwordActual}
                        onChange={(e) => {
                          setPasswordActual(e.target.value);
                          setErrorPassword("");
                        }}
                        required={!esGoogle}
                      />
                    </div>
                  )}
                  {esGoogle && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--brand)",
                        background: "var(--brand-light)",
                        padding: "10px 14px",
                        borderRadius: 10,
                        marginBottom: 8,
                      }}
                    >
                      Iniciaste sesión con Google. Puedes establecer una
                      contraseña aquí.
                    </div>
                  )}
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Nueva contraseña
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número"
                      value={passwordNueva}
                      onChange={(e) => {
                        setPasswordNueva(e.target.value);
                        setErrorPassword("");
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Confirmar nueva contraseña
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Repite la contraseña"
                      value={passwordConfirmar}
                      onChange={(e) => {
                        setPasswordConfirmar(e.target.value);
                        setErrorPassword("");
                      }}
                      required
                    />
                  </div>

                  {errorPassword && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--red)",
                        background: "var(--red-bg)",
                        padding: "10px 14px",
                        borderRadius: 10,
                      }}
                    >
                      {errorPassword}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onVolver}
                      style={{ flex: 1 }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={cargandoPassword}
                      style={{ flex: 2 }}
                    >
                      {cargandoPassword
                        ? "Actualizando..."
                        : "Guardar contraseña"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── PESTAÑA NEGOCIO ── */}
          {vista === "negocio" && esPropietario && (
            <>
              {cargandoNegocio ? (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "var(--text-3)",
                    fontSize: 14,
                  }}
                >
                  Cargando datos del negocio...
                </div>
              ) : errorNegocio ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--red)",
                    background: "var(--red-bg)",
                    padding: "10px 14px",
                    borderRadius: 10,
                  }}
                >
                  {errorNegocio}
                </div>
              ) : (
                <form
                  onSubmit={handleGuardarNegocio}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Nombre del Negocio
                    </label>
                    <input
                      className="input"
                      name="nombre"
                      type="text"
                      placeholder="Ej. El buen sabor"
                      value={negocioData.nombre}
                      onChange={handleChangeNegocio}
                      required
                      maxLength={150}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Categoría
                    </label>
                    {categoriasPosibles.length > 0 ? (
                      <select
                        className="input"
                        name="categoria"
                        value={negocioData.categoria}
                        onChange={handleChangeNegocio}
                        required
                        style={{
                          cursor: "pointer",
                          background: "var(--surface-2)",
                          appearance: "none",
                        }}
                      >
                        <option value="" disabled>
                          Selecciona una categoría
                        </option>
                        {categoriasPosibles.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input"
                        name="categoria"
                        type="text"
                        placeholder="Ej. Restaurante, Comida Rápida"
                        value={negocioData.categoria}
                        onChange={handleChangeNegocio}
                        required
                        maxLength={100}
                      />
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Descripción
                    </label>
                    <textarea
                      className="input"
                      name="descripcion"
                      placeholder="Breve descripción del negocio"
                      value={negocioData.descripcion}
                      onChange={handleChangeNegocio}
                      style={{ resize: "vertical", minHeight: 80 }}
                      maxLength={2000}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-2)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        WhatsApp
                      </label>
                      <input
                        className="input"
                        name="whatsapp"
                        type="text"
                        placeholder="+57300..."
                        value={negocioData.whatsapp}
                        onChange={handleChangeNegocio}
                        maxLength={30}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-2)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Instagram
                      </label>
                      <input
                        className="input"
                        name="instagram"
                        type="text"
                        placeholder="@usuario"
                        value={negocioData.instagram}
                        onChange={handleChangeNegocio}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Enlace de Google Maps
                    </label>
                    <input
                      className="input"
                      name="maps_url"
                      type="url"
                      placeholder="https://maps.app.goo.gl/..."
                      value={negocioData.maps_url}
                      onChange={handleChangeNegocio}
                      maxLength={500}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onVolver}
                      style={{ flex: 1 }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={guardandoNegocio}
                      style={{ flex: 2 }}
                    >
                      {guardandoNegocio ? "Guardando..." : "Guardar Negocio"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
