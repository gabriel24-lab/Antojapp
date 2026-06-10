import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_URL from "../api";
import AppIcon from "./AppIcon";

function Estrellas({ calificacion, interactivo = false, onSeleccionar }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="stars" style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <AppIcon
          key={i}
          name="star"
          size={interactivo ? 22 : 14}
          color="#E8A020"
          fill="currentColor"
          style={{
            opacity: i <= (hover || Math.round(calificacion)) ? 1 : 0.25,
            cursor: interactivo ? "pointer" : "default",
            transition: "opacity 0.1s"
          }}
          onMouseOver={() => interactivo && setHover(i)}
          onMouseOut={() =>  interactivo && setHover(0)}
          onClick={() =>     interactivo && onSeleccionar?.(i)}
        />
      ))}
    </span>
  );
}

const DIAS    = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function estaAbierto(horario) {
  const ahora   = new Date();
  const dia     = DIAS[ahora.getDay() === 0 ? 6 : ahora.getDay() - 1];
  const horaDia = horario[dia];
  if (!horaDia || horaDia === "cerrado") return false;
  const [apertura, cierre] = horaDia.split("-");
  const [ha, ma] = apertura.split(":").map(Number);
  const [hc, mc] = cierre.split(":").map(Number);
  const actual   = ahora.getHours() * 60 + ahora.getMinutes();
  return actual >= ha * 60 + ma && actual < hc * 60 + mc;
}

export default function BusinessDetail({ negocio, onVolver, onAbrirAuth }) {
  const { user, toggleFavorito, esFavorito } = useAuth();
  const [sedeActiva,   setSedeActiva]   = useState(0);
  const [nuevaResena,  setNuevaResena]  = useState({ estrellas: 0, comentario: "" });
  const [resenas,      setResenas]      = useState(negocio.resenas || []);
  const [enviando,     setEnviando]     = useState(false);
  const [enviadoResena,setEnviadoResena]= useState(false);
  const [errorResena,  setErrorResena]  = useState("");

  const favorito = esFavorito(negocio.id);
  const sede     = negocio.sedes[sedeActiva];
  const abierto  = estaAbierto(sede.horario);

  const handleFavorito = () => {
    if (!user) { onAbrirAuth(); return; }
    toggleFavorito(negocio.id);
  };

  const enviarResena = async (e) => {
    e.preventDefault();
    if (!user)                     { onAbrirAuth(); return; }
    if (nuevaResena.estrellas === 0) return;
    setEnviando(true);
    setErrorResena("");
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/negocios/${negocio.id}/resenas`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({
          estrellas:  nuevaResena.estrellas,
          comentario: nuevaResena.comentario
        })
      });
      const data = await res.json();
      if (!res.ok) { setErrorResena(data.error || "Error al publicar"); return; }

      setResenas(prev => [data, ...prev]);
      setNuevaResena({ estrellas: 0, comentario: "" });
      setEnviadoResena(true);
      setTimeout(() => setEnviadoResena(false), 3000);
    } catch {
      setErrorResena("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px 60px" }}>
      {/* Volver */}
      <button onClick={onVolver} className="btn-ghost" style={{ marginBottom: 20 }}>
        <AppIcon name="arrowLeft" size={16} /> Volver a resultados
      </button>

      {/* Hero */}
      <div style={{ position: "relative", height: 280, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        <img src={negocio.portada} alt={negocio.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,18,8,.7) 30%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 30, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>
            {negocio.nombre}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className={`badge ${abierto ? "badge-open" : "badge-closed"}`} style={{ fontSize: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {abierto ? "Abierto ahora" : "Cerrado ahora"}
            </span>
            <span className="badge badge-cat">{negocio.categoria}</span>
            <span style={{ color: "rgba(255,255,255,.85)", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <AppIcon name="star" size={14} fill="currentColor" /> {negocio.calificacion} · {negocio.total_resenas ?? negocio.totalResenas} reseñas
            </span>
          </div>
        </div>
        <button
          onClick={handleFavorito}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 40, height: 40, borderRadius: "50%",
            background: favorito ? "#E8460A" : "rgba(255,255,255,.9)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 2px 12px rgba(0,0,0,.2)",
            transition: "background 0.18s"
          }}
        >
          <AppIcon
            name="heart"
            size={20}
            color={favorito ? "#fff" : "#E8460A"}
            fill={favorito ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {/* Descripción */}
        <div className="card" style={{ padding: "18px 20px", gridColumn: "1 / -1" }}>
          <p style={{ fontSize: 15, color: "#6B5E52", lineHeight: 1.7 }}>{negocio.descripcion}</p>
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {negocio.etiquetas.map(tag => (
              <span key={tag} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#F7F4F1", color: "#6B5E52", border: "1px solid #E2DBD5" }}>#{tag}</span>
            ))}
          </div>
        </div>

        {/* Platos clave */}
        {[
          { label: "Plato estrella", icon: "star", plato: negocio.plato_estrella_nombre  ? { nombre: negocio.plato_estrella_nombre,  precio: negocio.plato_estrella_precio  } : negocio.platoEstrella,  bg: "#FFF0EB", color: "#E8460A" },
          { label: "Más económico",  icon: "wallet", plato: negocio.plato_economico_nombre ? { nombre: negocio.plato_economico_nombre, precio: negocio.plato_economico_precio } : negocio.platoEconomico, bg: "#E8F6EE", color: "#1A8C5B" },
          { label: "Premium",        icon: "crown", plato: negocio.plato_premium_nombre   ? { nombre: negocio.plato_premium_nombre,   precio: negocio.plato_premium_precio   } : negocio.platoPremium,   bg: "#F3F0FF", color: "#6C5CE7" },
        ].map(({ label, icon, plato, bg, color }) => plato && (
          <div key={label} className="card" style={{ padding: "14px 16px", background: bg, border: `1px solid ${color}22` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <AppIcon name={icon} size={14} fill={icon === "star" ? "currentColor" : "none"} /> {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1208", marginBottom: 3 }}>{plato.nombre}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Sora',sans-serif" }}>
              ${plato.precio.toLocaleString("es-CO")}
            </div>
          </div>
        ))}
      </div>

      {/* Sedes */}
      <div className="card" style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #E2DBD5" }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
            <AppIcon name="mapPin" size={18} color="#E8460A" /> {negocio.sedes.length > 1 ? `${negocio.sedes.length} sedes` : "Ubicación"}
          </h2>
          {negocio.sedes.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {negocio.sedes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSedeActiva(i)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    background: sedeActiva === i ? "#E8460A" : "#F7F4F1",
                    color:      sedeActiva === i ? "#fff"    : "#6B5E52",
                    border:     sedeActiva === i ? "none"    : "1px solid #E2DBD5",
                    transition: "all 0.15s"
                  }}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 200 }}>
          {/* Info sede */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#A8988A", fontWeight: 500, marginBottom: 3 }}>DIRECCIÓN</div>
              <div style={{ fontSize: 14, color: "#1A1208" }}>{sede.direccion}</div>
            </div>
            {/* Teléfonos → WhatsApp */}
            {(sede.telefonos?.length > 0) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#A8988A", fontWeight: 500, marginBottom: 6 }}>CONTACTO</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sede.telefonos.map((tel, i) => {
                    const num = tel.replace(/\D/g, "");
                    const wa  = num.startsWith("57") ? num : `57${num}`;
                    return (
                      <a
                        key={i}
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 7,
                          fontSize: 14, color: "#1A8C5B", fontWeight: 600,
                          textDecoration: "none",
                          background: "#E8F6EE", padding: "6px 12px",
                          borderRadius: 8, width: "fit-content",
                          border: "1px solid #B7DFC9",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#D1F0DF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#E8F6EE"}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#1A8C5B">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.859L.057 23.57a.75.75 0 00.914.914l5.701-1.479A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 01-4.945-1.352l-.354-.21-3.668.951.972-3.558-.229-.368A9.694 9.694 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                        </svg>
                        {tel}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: "#A8988A", fontWeight: 500, marginBottom: 6 }}>HORARIO</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {DIAS.map((dia, i) => {
                  const horaDia = sede.horario[dia];
                  const esHoy   = (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) === i;
                  return (
                    <div key={dia} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 13,
                      background: esHoy ? "#FFF0EB" : "transparent",
                      padding: esHoy ? "3px 6px" : "1px 0",
                      borderRadius: 4, fontWeight: esHoy ? 600 : 400
                    }}>
                      <span style={{ color: esHoy ? "#E8460A" : "#6B5E52" }}>{DIAS_ES[i]}</span>
                      <span style={{ color: horaDia === "cerrado" ? "#A8988A" : "#1A1208" }}>
                        {horaDia === "cerrado" ? "Cerrado" : horaDia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div style={{ background: "#EDE9E5", position: "relative", minHeight: 220 }}>
            <iframe
              title={`Mapa ${sede.nombre}`}
              width="100%" height="100%"
              style={{ border: 0, display: "block", minHeight: 220 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${sede.lat},${sede.lng}&z=15&output=embed`}
            />
          </div>
        </div>
      </div>

      {/* Reseñas */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
          <AppIcon name="message" size={18} color="#E8460A" /> Reseñas de la comunidad
        </h2>

        {/* Escribir reseña */}
        <form onSubmit={enviarResena} style={{
          background: "#F7F4F1", borderRadius: 12, padding: "16px",
          marginBottom: 20, border: "1px solid #E2DBD5"
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#6B5E52", marginBottom: 8 }}>
            {user ? `Tu reseña, ${user.nombre}` : "Inicia sesión para dejar tu reseña"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Estrellas
              calificacion={nuevaResena.estrellas}
              interactivo={!!user}
              onSeleccionar={(n) => setNuevaResena(r => ({ ...r, estrellas: n }))}
            />
            {nuevaResena.estrellas > 0 && (
              <span style={{ fontSize: 13, color: "#E8A020" }}>
                {["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"][nuevaResena.estrellas]}
              </span>
            )}
          </div>
          <textarea
            className="input"
            placeholder={user ? "Cuéntanos tu experiencia…" : "Inicia sesión para comentar"}
            disabled={!user}
            rows={3}
            value={nuevaResena.comentario}
            onChange={e => setNuevaResena(r => ({ ...r, comentario: e.target.value }))}
            style={{ resize: "vertical", marginBottom: 10, minHeight: 70 }}
          />
          {enviadoResena && (
            <div style={{ fontSize: 13, color: "#1A8C5B", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <AppIcon name="check" size={15} /> Reseña publicada, ¡gracias!
            </div>
          )}
          {errorResena && (
            <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "8px 12px", borderRadius: 8, marginBottom: 8 }}>{errorResena}</div>
          )}
          <button
            className="btn-primary"
            type="submit"
            disabled={!user || enviando}
            style={{ fontSize: 14, padding: "9px 18px", opacity: user ? 1 : 0.5 }}
          >
            {enviando ? "Publicando..." : "Publicar reseña"}
          </button>
        </form>

        {/* Lista reseñas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {resenas.map(r => (
            <div key={r.id} style={{ borderBottom: "1px solid #F0EBE5", paddingBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", background: "#E8460A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff"
                  }}>
                    {(r.usuario_nombre || r.usuario || "?").charAt(0)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1208" }}>
                    {r.usuario_nombre || r.usuario}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#A8988A" }}>
                  {r.creado_en ? new Date(r.creado_en).toLocaleDateString("es-CO") : r.fecha}
                </span>
              </div>
              <div style={{ marginLeft: 38 }}>
                <Estrellas calificacion={r.estrellas} />
                <p style={{ fontSize: 14, color: "#6B5E52", marginTop: 4, lineHeight: 1.55 }}>{r.comentario}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}