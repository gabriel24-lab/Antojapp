import React from "react";
import { useAuth } from "../context/AuthContext";
import AppIcon from "./AppIcon";
import { PAISES, MONEDAS } from "../data/mockData";

// Símbolo de moneda según el código del país
function simboloMoneda(moneda) {
  return MONEDAS[moneda]?.simbolo || "$";
}

function Estrellas({ calificacion }) {
  return (
    <span className="stars" style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <AppIcon
          key={i}
          name="star"
          size={13}
          color="#E8A020"
          fill="currentColor"
          style={{ opacity: i <= Math.round(calificacion) ? 1 : 0.25 }}
        />
      ))}
    </span>
  );
}

function PaisBadge({ codigo, ciudad }) {
  const pais = PAISES.find((p) => p.codigo === codigo);
  if (!pais) return null;
  return (
    <span
      title={ciudad ? `${ciudad}, ${pais.nombre}` : pais.nombre}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: "var(--neutral-text)",
        background: "var(--neutral-bg)",
        border: "1px solid var(--neutral-bdr)",
        borderRadius: 20,
        padding: "2px 8px 2px 5px",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 13 }}>{pais.bandera}</span>
      {pais.nombre}
    </span>
  );
}

const BusinessCard = React.memo(function BusinessCard({
  negocio,
  onClick,
  onAbrirAuth,
  prioritaria = false,
}) {
  const { user, toggleFavorito, esFavorito } = useAuth();
  const favorito = esFavorito(negocio.id);

  const handleFavorito = (e) => {
    e.stopPropagation();
    if (!user) {
      onAbrirAuth();
      return;
    }
    toggleFavorito(negocio.id);
  };

  // Normalizar plato estrella: el backend puede devolver objeto anidado
  // (datos mock) o columnas planas (datos reales de la BD)
  const platoEstrella =
    negocio.platoEstrella ??
    (negocio.plato_estrella_nombre
      ? {
          nombre: negocio.plato_estrella_nombre,
          precio: negocio.plato_estrella_precio,
        }
      : null);

  return (
    <article
      className="card"
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,18,8,.12)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Imagen de portada */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={negocio.portada}
          alt={negocio.nombre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading={prioritaria ? "eager" : "lazy"}
          fetchPriority={prioritaria ? "high" : "auto"}
        />
        {/* Overlay degradado */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(26,18,8,.65) 0%, transparent 55%)",
          }}
        />

        {/* Badge abierto/cerrado */}
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span
            className={`badge ${negocio.abierto ? "badge-open" : "badge-closed"}`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "currentColor",
                display: "inline-block",
              }}
            />
            {negocio.abierto ? "Abierto" : "Cerrado"}
          </span>
        </div>

        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          title={favorito ? "Quitar de guardados" : "Guardar"}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: favorito ? "var(--brand)" : "rgba(255,255,255,.85)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            transition: "background 0.18s, transform 0.18s",
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <AppIcon
            name="heart"
            size={18}
            color={favorito ? "#fff" : "var(--brand)"}
            fill={favorito ? "currentColor" : "none"}
          />
        </button>

        {/* Icono del negocio + nombre — parte inferior de la imagen */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 50,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {/* Icono/logo del negocio */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              flexShrink: 0,
              border: "2px solid rgba(255,255,255,.35)",
              overflow: "hidden",
              background: "var(--overlay)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.35)",
            }}
          >
            {negocio.icono ? (
              <img
                src={negocio.icono}
                alt={`Logo ${negocio.nombre}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <AppIcon name="store" size={20} color="rgba(255,255,255,.7)" />
            )}
          </div>

          {/* Nombre */}
          <h3
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--surface)",
              lineHeight: 1.2,
              textShadow: "0 1px 4px rgba(0,0,0,.4)",
              margin: 0,
            }}
          >
            {negocio.nombre}
          </h3>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "14px 16px" }}>
        {/* Categoría + país + calificación */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <span className="badge badge-cat">{negocio.categoria}</span>
            {negocio.pais && (
              <PaisBadge codigo={negocio.pais} ciudad={negocio.ciudad} />
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            <Estrellas calificacion={negocio.calificacion} />
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}
            >
              {negocio.calificacion}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              ({negocio.totalResenas})
            </span>
          </div>
        </div>

        {/* Propietario */}
        {negocio.propietario_nombre && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--border)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {negocio.propietario_foto ? (
                <img
                  src={negocio.propietario_foto}
                  alt={negocio.propietario_nombre}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <AppIcon name="user" size={12} color="var(--text-3)" />
              )}
            </div>
            <span
              style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}
            >
              Por: {negocio.propietario_nombre}
            </span>
          </div>
        )}

        {/* Descripción */}
        <p
          style={{
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {negocio.descripcion}
        </p>

        {/* Plato estrella — solo si existe */}
        {platoEstrella && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              background: "var(--brand-light)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AppIcon
                name="star"
                size={15}
                color="var(--brand)"
                fill="currentColor"
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-1)",
                }}
              >
                {platoEstrella.nombre}
              </span>
            </div>
            <span
              style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)" }}
            >
              {simboloMoneda(negocio.moneda)}
              {platoEstrella.precio?.toLocaleString("es-CO")}
            </span>
          </div>
        )}

        {/* Tags */}
        <div
          style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}
        >
          {(negocio.etiquetas || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 20,
                background: "var(--bg)",
                color: "var(--text-2)",
                border: "1px solid var(--border)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

export default BusinessCard;
