import { useAuth } from "../context/AuthContext";

function Estrellas({ calificacion }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ opacity: i <= Math.round(calificacion) ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  );
}

export default function BusinessCard({ negocio, onClick, onAbrirAuth }) {
  const { user, toggleFavorito, esFavorito } = useAuth();
  const favorito = esFavorito(negocio.id);

  const handleFavorito = (e) => {
    e.stopPropagation();
    if (!user) { onAbrirAuth(); return; }
    toggleFavorito(negocio.id);
  };

  return (
    <article
      className="card"
      onClick={onClick}
      style={{ cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s" }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,18,8,.12)"; }}
      onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Imagen */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={negocio.portada}
          alt={negocio.nombre}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        {/* Overlay degradado */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(26,18,8,.55) 0%, transparent 50%)"
        }} />
        {/* Badge abierto/cerrado */}
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span className={`badge ${negocio.abierto ? "badge-open" : "badge-closed"}`}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            {negocio.abierto ? "Abierto" : "Cerrado"}
          </span>
        </div>
        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          title={favorito ? "Quitar de guardados" : "Guardar"}
          style={{
            position: "absolute", top: 10, right: 10,
            width: 34, height: 34, borderRadius: "50%",
            background: favorito ? "#E8460A" : "rgba(255,255,255,.85)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, transition: "background 0.18s, transform 0.18s",
            boxShadow: "0 2px 8px rgba(0,0,0,.15)"
          }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <span style={{ color: favorito ? "#fff" : "#E8460A" }}>♥</span>
        </button>
        {/* Nombre sobre la imagen */}
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 50 }}>
          <h3 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 17,
            color: "#fff", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,.4)"
          }}>
            {negocio.nombre}
          </h3>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "14px 16px" }}>
        {/* Categoría y calificación */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="badge badge-cat">{negocio.categoria}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Estrellas calificacion={negocio.calificacion} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>{negocio.calificacion}</span>
            <span style={{ fontSize: 12, color: "#A8988A" }}>({negocio.totalResenas})</span>
          </div>
        </div>

        {/* Descripción */}
        <p style={{
          fontSize: 13, color: "#6B5E52", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>
          {negocio.descripcion}
        </p>

        {/* Plato estrella */}
        <div style={{
          marginTop: 12, padding: "9px 12px",
          background: "#FFF0EB", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15 }}>⭐</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1208" }}>{negocio.platoEstrella.nombre}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#E8460A" }}>
            ${negocio.platoEstrella.precio.toLocaleString("es-CO")}
          </span>
        </div>

        {/* Tags */}
        <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
          {negocio.etiquetas.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 20,
              background: "#F7F4F1", color: "#6B5E52", border: "1px solid #E2DBD5"
            }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}