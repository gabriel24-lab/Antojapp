import { useState } from "react";
import { PAISES } from "../data/mockData";
import AppIcon from "./AppIcon";

export default function LocationSelector({
  paisSeleccionado,
  ciudadSeleccionada,
  onCambiarPais,
  onCambiarCiudad,
  ubicacionEstado,
  onSolicitarUbicacion,
  totalNegocios,
}) {
  const [buscandoPais, setBuscandoPais] = useState("");

  const paisInfo = PAISES.find((p) => p.codigo === paisSeleccionado);
  const ciudadesDisponibles = paisInfo?.ciudades || [];
  const paisesFiltrados = buscandoPais
    ? PAISES.filter((p) =>
        p.nombre.toLowerCase().includes(buscandoPais.toLowerCase()),
      )
    : PAISES;

  const esGlobal = !paisSeleccionado;

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        position: "sticky",
        top: 130,
        alignSelf: "flex-start",
      }}
    >
      {/* ── Tarjeta de ubicación ── */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(26,18,8,.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid #F0EBE5",
            background: "var(--surface-3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 4,
            }}
          >
            <AppIcon name="mapPin" size={15} color="var(--brand)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-1)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Ubicación
            </span>
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {esGlobal
              ? `${totalNegocios} negocios de todo el mundo`
              : `Mostrando en ${ciudadSeleccionada || paisInfo?.nombre || "..."}`}
          </p>
        </div>

        {/* ── Botón GPS ── */}
        <div
          style={{ padding: "12px 16px", borderBottom: "1px solid #F0EBE5" }}
        >
          {ubicacionEstado === "idle" || ubicacionEstado === "denegada" ? (
            <button
              onClick={onSolicitarUbicacion}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                background:
                  ubicacionEstado === "denegada"
                    ? "#FFF5F4"
                    : "var(--brand-light)",
                border: `1.5px solid ${ubicacionEstado === "denegada" ? "#F0C5BF" : "#FCCDB5"}`,
                color:
                  ubicacionEstado === "denegada"
                    ? "var(--red)"
                    : "var(--brand)",
                fontSize: 12,
                fontWeight: 600,
                transition: "all var(--transition)",
              }}
            >
              <AppIcon name="mapPin" size={13} />
              {ubicacionEstado === "denegada"
                ? "Permiso denegado"
                : "Usar mi ubicación"}
            </button>
          ) : ubicacionEstado === "solicitando" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                color: "var(--text-3)",
                fontSize: 12,
              }}
            >
              <AppIcon
                name="refresh"
                size={13}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Detectando…
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                color: "var(--green)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <AppIcon name="mapPin" size={13} />
              Ubicación activa
            </div>
          )}
        </div>

        {/* ── Opción global ── */}
        <div style={{ padding: "8px 10px 4px" }}>
          <button
            onClick={() => {
              onCambiarPais(null);
              onCambiarCiudad(null);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: esGlobal ? 700 : 500,
              color: esGlobal ? "var(--brand)" : "var(--text-2)",
              background: esGlobal ? "var(--brand-light)" : "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.12s",
            }}
          >
            <span style={{ fontSize: 15 }}></span>
            <span>Todo el mundo</span>
          </button>
        </div>

        {/* ── Lista de países ── */}
        <div style={{ padding: "0 10px 10px" }}>
          {PAISES.length > 4 && (
            <div style={{ position: "relative", marginBottom: 6 }}>
              <input
                type="text"
                placeholder="Buscar país…"
                value={buscandoPais}
                onChange={(e) => setBuscandoPais(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "5px 10px 5px 28px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text-1)",
                  background: "var(--surface-3)",
                  outline: "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-3)",
                }}
              >
                <AppIcon name="search" size={12} />
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {paisesFiltrados.map((pais) => {
              const activo = paisSeleccionado === pais.codigo;
              return (
                <div key={pais.codigo}>
                  <button
                    onClick={() => {
                      if (activo) {
                        onCambiarPais(null);
                        onCambiarCiudad(null);
                      } else {
                        onCambiarPais(pais.codigo);
                        onCambiarCiudad(null);
                      }
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 10px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: activo ? 700 : 400,
                      color: activo ? "var(--brand)" : "var(--text-2)",
                      background: activo ? "var(--brand-light)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>
                      {pais.bandera}
                    </span>
                    <span style={{ flex: 1 }}>{pais.nombre}</span>
                    {activo && (
                      <AppIcon
                        name="chevronDown"
                        size={12}
                        style={{ opacity: 0.5 }}
                      />
                    )}
                  </button>

                  {/* Ciudades expandidas */}
                  {activo && pais.ciudades.length > 0 && (
                    <div style={{ paddingLeft: 12, paddingBottom: 4 }}>
                      {pais.ciudades.map((ciudad) => {
                        const ciudadActiva = ciudadSeleccionada === ciudad;
                        return (
                          <button
                            key={ciudad}
                            onClick={() =>
                              onCambiarCiudad(ciudadActiva ? null : ciudad)
                            }
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: ciudadActiva ? 600 : 400,
                              color: ciudadActiva
                                ? "var(--text-1)"
                                : "var(--text-3)",
                              background: ciudadActiva
                                ? "#F0EBE5"
                                : "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "background 0.12s",
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: ciudadActiva
                                  ? "var(--brand)"
                                  : "#D0C8C0",
                              }}
                            />
                            {ciudad}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}
