import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "./AppIcon";

export default function EditarPerfilModal({ onCerrar }) {
  const { user, actualizarUsuario, mostrarToast } = useAuth();

  const [vista, setVista] = useState("datos"); // datos | password

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

  const esGoogle = !!user?.es_google;

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

      // 1) Subir foto si se eligió una nueva
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
          setErrorDatos(
            dataFoto.error ||
              "Ocurrió un problema al subir la foto. Inténtalo más tarde.",
          );
          return;
        }
        usuarioActualizado = dataFoto;
        setFoto(dataFoto.foto_perfil);
      }

      // 2) Actualizar nombre si cambió
      if (nombreLimpio !== user?.nombre) {
        const resNombre = await fetch(`${API_URL}/auth/perfil`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreLimpio }),
        });
        const dataNombre = await resNombre.json();
        if (!resNombre.ok) {
          setErrorDatos(
            dataNombre.error ||
              "Ocurrió un problema al actualizar tu nombre. Inténtalo más tarde.",
          );
          return;
        }
        usuarioActualizado = dataNombre;
      }

      if (usuarioActualizado) actualizarUsuario(usuarioActualizado);

      setArchivo(null);
      setPreview(null);
      mostrarToast("Perfil actualizado", "exito");
      onCerrar();
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

    if (!passwordActual)
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
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorPassword(
          data.error ||
            "Ocurrió un problema al actualizar tu contraseña. Inténtalo de nuevo.",
        );
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

  const inicial = user?.nombre?.charAt(0).toUpperCase() || "?";
  const imagenMostrar = preview || foto;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(26,18,8,.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 60px rgba(0,0,0,.18)",
          overflow: "hidden",
          animation: "slideUp .22s ease",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--text-1)",
            padding: "24px 28px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--surface)",
              }}
            >
              Editar perfil
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.5)",
                marginTop: 3,
              }}
            >
              {vista === "datos"
                ? "Actualiza tu información"
                : "Cambia tu contraseña"}
            </div>
          </div>
          <button
            onClick={onCerrar}
            style={{
              color: "rgba(255,255,255,.5)",
              fontSize: 22,
              lineHeight: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <AppIcon name="x" size={20} />
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
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
            {!esGoogle && (
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
                  color:
                    vista === "password" ? "var(--text-1)" : "var(--text-3)",
                  boxShadow:
                    vista === "password" ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                  transition: "all .18s ease",
                }}
              >
                Contraseña
              </button>
            )}
          </div>

          {/* ── PESTAÑA DATOS ── */}
          {vista === "datos" && (
            <form
              onSubmit={handleGuardarDatos}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Foto de perfil */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    background: imagenMostrar
                      ? `url(${imagenMostrar}) center/cover`
                      : "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--surface)",
                    cursor: "pointer",
                    position: "relative",
                    border: "3px solid var(--border)",
                  }}
                >
                  {!imagenMostrar && inicial}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--text-1)",
                      border: "2px solid var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--surface)",
                    }}
                  >
                    <AppIcon name="camera" size={14} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={seleccionarFoto}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: 13, marginTop: 8 }}
                >
                  Cambiar foto
                </button>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-2)",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Nombre
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
                    fontWeight: 500,
                    color: "var(--text-2)",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Correo electrónico
                </label>
                <input
                  className="input"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>

              {errorDatos && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--red)",
                    background: "var(--red-bg)",
                    padding: "9px 12px",
                    borderRadius: 8,
                  }}
                >
                  {errorDatos}
                </div>
              )}

              <button
                className="btn-primary"
                type="submit"
                disabled={cargandoDatos}
                style={{ width: "100%", marginTop: 2 }}
              >
                {cargandoDatos ? "Guardando..." : "Guardar cambios"}
              </button>
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
                    borderRadius: 10,
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ marginBottom: 8, color: "var(--green)" }}>
                    <AppIcon name="check" size={30} />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--green)",
                      fontWeight: 500,
                    }}
                  >
                    {exitoPassword}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleCambiarPassword}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 5,
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
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 5,
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
                        fontWeight: 500,
                        color: "var(--text-2)",
                        display: "block",
                        marginBottom: 5,
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
                        padding: "9px 12px",
                        borderRadius: 8,
                      }}
                    >
                      {errorPassword}
                    </div>
                  )}
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={cargandoPassword}
                    style={{ width: "100%", marginTop: 2 }}
                  >
                    {cargandoPassword
                      ? "Actualizando..."
                      : "Cambiar contraseña"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
