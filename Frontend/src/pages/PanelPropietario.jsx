import { useState, useEffect } from "react";
import { apiFetch } from "../apiClient";
import AppIcon from "../components/AppIcon";

// ── Mini gráfico SVG de línea ──────────────────────────────────
function LineChart({ datos, color = "#E8460A", altura = 100 }) {
  if (!datos || datos.length === 0) return (
    <div style={{ height: altura, display: "flex", alignItems: "center", justifyContent: "center", color: "#A8988A", fontSize: 13 }}>
      Sin datos en los últimos 30 días
    </div>
  );

  const ancho   = 560;
  const padX    = 0;
  const padY    = 10;
  const valores = datos.map(d => parseInt(d.visitas));
  const maxVal  = Math.max(...valores, 1);
  const minVal  = 0;

  const toX = (i) => padX + (i / (datos.length - 1 || 1)) * (ancho - padX * 2);
  const toY = (v) => padY + (1 - (v - minVal) / (maxVal - minVal || 1)) * (altura - padY * 2);

  const puntos = datos.map((d, i) => `${toX(i)},${toY(parseInt(d.visitas))}`).join(" ");

  // Área rellena (debajo de la línea)
  const areaPath = `M ${toX(0)},${toY(parseInt(datos[0].visitas))} ${datos.map((d, i) => `L ${toX(i)},${toY(parseInt(d.visitas))}`).join(" ")} L ${toX(datos.length - 1)},${altura} L ${toX(0)},${altura} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${ancho} ${altura}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: altura, display: "block" }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Área */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Línea */}
        <polyline
          points={puntos}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Puntos */}
        {datos.map((d, i) => (
          <circle
            key={i}
            cx={toX(i)} cy={toY(parseInt(d.visitas))}
            r="3.5" fill={color} stroke="#fff" strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

// ── Tarjeta de estadística ─────────────────────────────────────
function StatCard({ icon, label, valor, sub, color = "#E8460A", bg = "#FFF4F0" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px 22px",
      border: "1px solid #F0EBE5", boxShadow: "0 2px 12px rgba(26,18,8,.06)",
      display: "flex", alignItems: "center", gap: 16,
      transition: "transform .18s, box-shadow .18s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,18,8,.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,18,8,.06)"; }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        color, flexShrink: 0,
      }}><AppIcon name={icon} size={25} fill={icon === "heart" || icon === "star" ? "currentColor" : "none"} /></div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: "#1A1208", lineHeight: 1 }}>
          {valor}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5E52", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#A8988A", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Estrellas visuales ─────────────────────────────────────────
function Estrellas({ valor, total = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: total }, (_, i) => (
        <AppIcon
          key={i}
          name="star"
          size={13}
          color="#E8A020"
          fill="currentColor"
          style={{ opacity: i < Math.round(valor) ? 1 : 0.25 }}
        />
      ))}
    </span>
  );
}

// ── Componente principal: PanelPropietario ─────────────────────
export default function PanelPropietario({ onAbrirFormulario }) {
  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState("");

  const cargar = async () => {
    setCargando(true); setError("");
    const { data, error: err } = await apiFetch("/panel/estadisticas");
    if (err) setError(err);
    else     setDatos(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  // ── Estado: cargando ──
  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #F0EBE5", borderTopColor: "#E8460A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 14, color: "#A8988A" }}>Cargando tu panel...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Estado: sin negocio ──
  if (error === "No tienes ningún negocio registrado") return (
    <div style={{ maxWidth: 540, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ marginBottom: 16, color: "#E8460A" }}><AppIcon name="store" size={64} /></div>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, color: "#1A1208", marginBottom: 10 }}>
        Aún no tienes un negocio registrado
      </h2>
      <p style={{ color: "#A8988A", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        Registra tu negocio de comida para empezar a recibir visitas, reseñas y aparecer en las búsquedas de Antojapp.
      </p>
      <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 15 }} onClick={() => onAbrirFormulario(null)}>
        + Registrar mi negocio
      </button>
    </div>
  );

  // ── Estado: error genérico ──
  if (error) return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
      <div style={{ marginBottom: 12, color: "#C0392B" }}><AppIcon name="alert" size={48} /></div>
      <p style={{ color: "#C0392B", fontSize: 14 }}>{error}</p>
      <button className="btn-secondary" style={{ marginTop: 16 }} onClick={cargar}>Reintentar</button>
    </div>
  );

  const { negocio, visitas, favoritos, resenas } = datos;

  // Calcular fecha para labels del eje X (cada 7 días)
  const etiquetasX = (() => {
    if (!visitas.porDia.length) return [];
    const total = visitas.porDia.length;
    const paso  = Math.max(1, Math.floor(total / 5));
    return visitas.porDia.filter((_, i) => i % paso === 0 || i === total - 1)
      .map(d => {
        const fecha = new Date(d.dia + "T00:00:00");
        return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
      });
  })();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 60px" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1A1208 0%, #2D1F0F 100%)",
        borderRadius: 20, padding: "28px 32px", marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: 500, marginBottom: 4 }}>
            Panel del propietario
          </div>
          <h1 style={{
            fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 700,
            color: "#fff", lineHeight: 1.2,
          }}>
            {negocio.nombre}
          </h1>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: resenas.promedio >= 4 ? "#1A8C5B" : resenas.promedio >= 3 ? "#E8A020" : "#C0392B",
              color: "#fff",
            }}>
              <AppIcon name="star" size={13} fill="currentColor" /> {resenas.promedio.toFixed(1)} calificación
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" }}>
              <AppIcon name="calendar" size={13} /> Últimos 30 días
            </span>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => onAbrirFormulario({ id: negocio.id })}
          style={{ padding: "10px 22px", fontSize: 14, flexShrink: 0 }}
        >
          <AppIcon name="edit" size={16} /> Editar negocio
        </button>
      </div>

      {/* ── Tarjetas de estadísticas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard
          icon="eye" label="Visitas totales" valor={visitas.total.toLocaleString("es-CO")}
          sub="Desde que te registraste"
          color="#E8460A" bg="#FFF4F0"
        />
        <StatCard
          icon="barChart" label="Visitas esta semana" valor={visitas.semana.toLocaleString("es-CO")}
          sub="Últimos 7 días"
          color="#6C3BD5" bg="#F3F0FF"
        />
        <StatCard
          icon="heart" label="Favoritos" valor={favoritos.toLocaleString("es-CO")}
          sub="Usuarios que te guardaron"
          color="#E8460A" bg="#FFF0EB"
        />
        <StatCard
          icon="star" label="Calificación" valor={`${resenas.promedio.toFixed(1)} / 5`}
          sub={`${resenas.total} reseñas en total`}
          color="#E8A020" bg="#FFF8EC"
        />
      </div>

      {/* ── Gráfica de visitas ── */}
      <div style={{
        background: "#fff", borderRadius: 18, padding: "24px 28px", marginBottom: 24,
        border: "1px solid #F0EBE5", boxShadow: "0 2px 12px rgba(26,18,8,.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1208" }}>
              Visitas por día
            </h2>
            <div style={{ fontSize: 13, color: "#A8988A", marginTop: 3 }}>Últimos 30 días</div>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#E8460A",
            background: "#FFF4F0", padding: "4px 12px", borderRadius: 20,
          }}>
            {visitas.porDia.reduce((acc, d) => acc + parseInt(d.visitas), 0)} visitas
          </div>
        </div>

        <LineChart datos={visitas.porDia} color="#E8460A" altura={110} />

        {/* Labels eje X */}
        {visitas.porDia.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {etiquetasX.map((l, i) => (
              <span key={i} style={{ fontSize: 11, color: "#A8988A" }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid inferior: Reseñas + Resumen rápido ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

        {/* Últimas reseñas */}
        <div style={{
          background: "#fff", borderRadius: 18, padding: "24px 28px",
          border: "1px solid #F0EBE5", boxShadow: "0 2px 12px rgba(26,18,8,.05)",
        }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1208", marginBottom: 18 }}>
            Últimas reseñas
          </h2>

          {resenas.ultimas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#A8988A" }}>
              <div style={{ marginBottom: 8 }}><AppIcon name="message" size={32} /></div>
              <div style={{ fontSize: 14 }}>Aún no tienes reseñas.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>¡Comparte tu negocio para que te califiquen!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resenas.ultimas.map((r, i) => (
                <div key={i} style={{
                  padding: "14px 16px", background: "#FAFAF9",
                  borderRadius: 12, border: "1px solid #F0EBE5",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "#E8460A", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                      }}>
                        {r.usuario_nombre?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208" }}>{r.usuario_nombre}</div>
                        <Estrellas valor={r.estrellas} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#A8988A" }}>
                      {new Date(r.creado_en).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  {r.comentario && (
                    <p style={{ fontSize: 13, color: "#6B5E52", lineHeight: 1.5, margin: 0 }}>
                      "{r.comentario}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral: acciones rápidas + resumen */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Acciones rápidas */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "22px",
            border: "1px solid #F0EBE5", boxShadow: "0 2px 12px rgba(26,18,8,.05)",
          }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#1A1208", marginBottom: 14 }}>
              Acciones rápidas
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "flex-start", gap: 10, fontSize: 14 }}
                onClick={() => onAbrirFormulario({ id: negocio.id })}
              >
                <AppIcon name="edit" size={16} /> Editar información
              </button>
              <button
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "flex-start", gap: 10, fontSize: 14 }}
                onClick={cargar}
              >
                <AppIcon name="refresh" size={16} /> Actualizar datos
              </button>
            </div>
          </div>

          {/* Distribución de calificaciones */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "22px",
            border: "1px solid #F0EBE5", boxShadow: "0 2px 12px rgba(26,18,8,.05)",
          }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#1A1208", marginBottom: 16 }}>
              Calificación promedio
            </h3>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: "#1A1208", lineHeight: 1 }}>
                {resenas.promedio.toFixed(1)}
              </div>
              <Estrellas valor={resenas.promedio} />
              <div style={{ fontSize: 12, color: "#A8988A", marginTop: 6 }}>
                Basado en {resenas.total} reseña{resenas.total !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Barra de promedio visual */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[5, 4, 3, 2, 1].map(estrella => {
                const pct = resenas.total > 0
                  ? Math.round(((resenas.ultimas.filter(r => Math.round(r.estrellas) === estrella).length) / Math.min(resenas.total, resenas.ultimas.length)) * 100)
                  : 0;
                return (
                  <div key={estrella} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#A8988A", width: 12, textAlign: "right" }}>{estrella}</span>
                    <AppIcon name="star" size={11} color="#E8A020" fill="currentColor" />
                    <div style={{ flex: 1, height: 6, background: "#F0EBE5", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: estrella >= 4 ? "#1A8C5B" : estrella === 3 ? "#E8A020" : "#C0392B",
                        borderRadius: 3, transition: "width .5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#A8988A", width: 28 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip */}
          <div style={{
            background: "linear-gradient(135deg, #FFF4F0, #FFF8EC)",
            borderRadius: 16, padding: "18px",
            border: "1px solid #FFD9C8",
          }}>
            <div style={{ marginBottom: 6, color: "#E8460A" }}><AppIcon name="lightbulb" size={19} /></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1208", marginBottom: 4 }}>Tip para más visitas</div>
            <div style={{ fontSize: 12, color: "#6B5E52", lineHeight: 1.6 }}>
              Los negocios con fotos de portada reciben <strong>3× más visitas</strong>. Agrega o actualiza tus imágenes desde <em>Editar información</em>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
