import { useState, useEffect } from "react";
import { apiFetch } from "../apiClient";
import AppIcon from "../components/AppIcon";

// ── Mini gráfico SVG de línea ──────────────────────────────────
function LineChart({ datos, color = "var(--brand)", altura = 120 }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, dia, visitas }

  const ancho = 560;
  const padX = 8;
  const padY = 14;

  // Normalizar: el backend puede devolver { dia: Date | string, visitas: number | string }
  const filas = (datos || []).map((d) => ({
    dia:
      typeof d.dia === "string"
        ? d.dia
        : (d.dia?.toISOString?.().slice(0, 10) ?? String(d.dia)),
    visitas: parseInt(d.visitas) || 0,
  }));

  // Sin datos: solo si el array está vacío (no hay registros en absoluto)
  // Si hay días con 0 visitas es información válida y debe mostrarse
  const sinDatos = filas.length === 0;
  const todoCero = !sinDatos && filas.every((f) => f.visitas === 0);

  const valores = filas.map((f) => f.visitas);
  const maxVal = sinDatos || todoCero ? 1 : Math.max(...valores, 1);
  const n = sinDatos ? 30 : filas.length;

  const toX = (i) => padX + (i / Math.max(n - 1, 1)) * (ancho - padX * 2);
  const toY = (v) => padY + (1 - v / maxVal) * (altura - padY * 2);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(
    (pct) => padY + pct * (altura - padY * 2),
  );

  const puntos =
    sinDatos || todoCero
      ? null
      : filas.map((f, i) => `${toX(i)},${toY(f.visitas)}`).join(" ");

  const areaPath =
    sinDatos || todoCero
      ? null
      : `M ${toX(0)},${toY(filas[0].visitas)} ` +
        filas.map((f, i) => `L ${toX(i)},${toY(f.visitas)}`).join(" ") +
        ` L ${toX(filas.length - 1)},${altura - padY} L ${toX(0)},${altura - padY} Z`;

  // Formatear fecha para tooltip y eje X
  const formatFecha = (diaStr) => {
    // Parsear como fecha local para evitar desfase de zona horaria
    const [y, m, d] = diaStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
    });
  };

  const handleMouseMove = (e) => {
    if (sinDatos || todoCero || !filas.length) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xRel = ((e.clientX - rect.left) / rect.width) * ancho;
    const idx = Math.min(
      Math.max(
        0,
        Math.round(((xRel - padX) / (ancho - padX * 2)) * (filas.length - 1)),
      ),
      filas.length - 1,
    );
    const f = filas[idx];
    setTooltip({
      x: (toX(idx) / ancho) * 100, // porcentaje para posicionar en el div
      y: toY(f.visitas),
      dia: formatFecha(f.dia),
      visitas: f.visitas,
      idx,
    });
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: `clamp(50px, ${tooltip.x}%, calc(100% - 80px))`,
            top: 4,
            transform: "translateX(-50%)",
            background: "var(--text-1)",
            color: "#fff",
            borderRadius: 8,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,.25)",
          }}
        >
          {tooltip.dia} ·{" "}
          <span style={{ color }}>
            {tooltip.visitas} visita{tooltip.visitas !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${ancho} ${altura}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: "100%",
          height: altura,
          display: "block",
          cursor: sinDatos || todoCero ? "default" : "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Cuadrícula horizontal */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            y1={y}
            x2={ancho - padX}
            y2={y}
            stroke="#F0EBE5"
            strokeWidth="1"
          />
        ))}

        {sinDatos || todoCero ? (
          // Línea base plana cuando no hay visitas en los últimos 30 días
          <line
            x1={padX}
            y1={toY(0)}
            x2={ancho - padX}
            y2={toY(0)}
            stroke="var(--border)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        ) : (
          <>
            {/* Área rellena */}
            <path d={areaPath} fill="url(#areaGrad)" />
            {/* Línea principal */}
            <polyline
              points={puntos}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Puntos interactivos (solo si hay ≤ 15 días para no saturar) */}
            {filas.length <= 15 &&
              filas.map((f, i) => (
                <circle
                  key={i}
                  cx={toX(i)}
                  cy={toY(f.visitas)}
                  r={tooltip?.idx === i ? 5 : 3.5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ transition: "r .1s" }}
                />
              ))}
            {/* Línea vertical del cursor al hacer hover */}
            {tooltip && (
              <line
                x1={toX(tooltip.idx)}
                y1={padY}
                x2={toX(tooltip.idx)}
                y2={altura - padY}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.5"
              />
            )}
          </>
        )}
      </svg>

      {todoCero && (
        <div
          style={{
            textAlign: "center",
            marginTop: 4,
            fontSize: 12,
            color: "var(--text-3)",
          }}
        >
          Aún no hay visitas registradas en los últimos 30 días
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de estadística ─────────────────────────────────────
function StatCard({
  icon,
  label,
  valor,
  sub,
  color = "var(--brand)",
  bg = "var(--brand-hover)",
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: "20px 22px",
        border: "1px solid #F0EBE5",
        boxShadow: "0 2px 12px rgba(26,18,8,.06)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "transform .18s, box-shadow .18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,18,8,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,18,8,.06)";
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        <AppIcon
          name={icon}
          size={25}
          fill={icon === "heart" || icon === "star" ? "currentColor" : "none"}
        />
      </div>
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
            color: "var(--text-1)",
            lineHeight: 1,
          }}
        >
          {valor}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-2)",
            marginTop: 4,
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            {sub}
          </div>
        )}
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
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cargandoEditar, setCargandoEditar] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError("");
    const { data, error: err } = await apiFetch("/panel/estadisticas");
    if (err) setError(err);
    else setDatos(data);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  // Carga los datos completos del negocio (info + sedes + platos)
  // antes de abrir el formulario de edición.
  const abrirEdicion = async () => {
    if (!datos?.negocio?.id) return;
    setCargandoEditar(true);
    const { data, error: err } = await apiFetch("/negocios/mio/negocio");
    setCargandoEditar(false);
    if (err) {
      alert("No se pudieron cargar los datos del negocio: " + err);
      return;
    }
    onAbrirFormulario(data.negocio);
  };

  // ── Estado: cargando ──
  if (cargando)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #F0EBE5",
            borderTopColor: "var(--brand)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 14, color: "var(--text-3)" }}>
          Cargando tu panel...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  // ── Estado: sin negocio ──
  if (error === "No tienes ningún negocio registrado")
    return (
      <div
        style={{
          maxWidth: 540,
          margin: "80px auto",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 16, color: "var(--brand)" }}>
          <AppIcon name="store" size={64} />
        </div>
        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 22,
            color: "var(--text-1)",
            marginBottom: 10,
          }}
        >
          Aún no tienes un negocio registrado
        </h2>
        <p
          style={{
            color: "var(--text-3)",
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          Registra tu negocio de comida para empezar a recibir visitas, reseñas
          y aparecer en las búsquedas de Antojapp.
        </p>
        <button
          className="btn-primary"
          style={{ padding: "12px 28px", fontSize: 15 }}
          onClick={() => onAbrirFormulario(null)}
        >
          + Registrar mi negocio
        </button>
      </div>
    );

  // ── Estado: error genérico ──
  if (error)
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "80px auto",
          padding: "0 20px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 12, color: "var(--red)" }}>
          <AppIcon name="alert" size={48} />
        </div>
        <p style={{ color: "var(--red)", fontSize: 14 }}>{error}</p>
        <button
          className="btn-secondary"
          style={{ marginTop: 16 }}
          onClick={cargar}
        >
          Reintentar
        </button>
      </div>
    );

  const { negocio, visitas, favoritos, resenas } = datos;

  // Calcular fecha para labels del eje X (cada ~5 marcas)
  const etiquetasX = (() => {
    if (!visitas.porDia.length) return [];
    const total = visitas.porDia.length;
    const paso = Math.max(1, Math.floor(total / 5));
    return visitas.porDia
      .filter((_, i) => i % paso === 0 || i === total - 1)
      .map((d) => {
        // El backend puede devolver dia como Date object o como string "YYYY-MM-DD"
        const diaStr =
          typeof d.dia === "string"
            ? d.dia
            : (d.dia?.toISOString?.().slice(0, 10) ?? String(d.dia));
        // Parsear como fecha local para evitar desfase de zona horaria
        const [y, m, dd] = diaStr.split("-").map(Number);
        return new Date(y, m - 1, dd).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
        });
      });
  })();

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "20px var(--content-px, 16px) 80px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1A1208 0%, #2D1F0F 100%)",
          borderRadius: 20,
          padding: "28px 32px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,.45)",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Panel del propietario
          </div>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--surface)",
              lineHeight: 1.2,
            }}
          >
            {negocio.nombre}
          </h1>
          <div
            style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background:
                  resenas.promedio >= 4
                    ? "var(--green)"
                    : resenas.promedio >= 3
                      ? "#E8A020"
                      : "var(--red)",
                color: "var(--surface)",
              }}
            >
              <AppIcon name="star" size={13} fill="currentColor" />{" "}
              {resenas.promedio.toFixed(1)} calificación
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(255,255,255,.12)",
                color: "rgba(255,255,255,.7)",
              }}
            >
              <AppIcon name="calendar" size={13} /> Últimos 30 días
            </span>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={abrirEdicion}
          disabled={cargandoEditar}
          style={{ padding: "10px 22px", fontSize: 14, flexShrink: 0 }}
        >
          {cargandoEditar ? (
            "Cargando..."
          ) : (
            <>
              <AppIcon name="edit" size={16} /> Editar negocio
            </>
          )}
        </button>
      </div>

      {/* ── Tarjetas de estadísticas ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon="eye"
          label="Visitas totales"
          valor={visitas.total.toLocaleString("es-CO")}
          sub="Desde que te registraste"
          color="var(--brand)"
          bg="var(--brand-hover)"
        />
        <StatCard
          icon="barChart"
          label="Visitas esta semana"
          valor={visitas.semana.toLocaleString("es-CO")}
          sub="Últimos 7 días"
          color="#6C3BD5"
          bg="#F3F0FF"
        />
        <StatCard
          icon="heart"
          label="Favoritos"
          valor={favoritos.toLocaleString("es-CO")}
          sub="Usuarios que te guardaron"
          color="var(--brand)"
          bg="var(--brand-light)"
        />
        <StatCard
          icon="star"
          label="Calificación"
          valor={`${resenas.promedio.toFixed(1)} / 5`}
          sub={`${resenas.total} reseñas en total`}
          color="#E8A020"
          bg="#FFF8EC"
        />
      </div>

      {/* ── Gráfica de visitas ── */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 24,
          border: "1px solid #F0EBE5",
          boxShadow: "0 2px 12px rgba(26,18,8,.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-1)",
              }}
            >
              Visitas por día
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 3 }}>
              Últimos 30 días
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--brand)",
              background: "var(--brand-hover)",
              padding: "4px 12px",
              borderRadius: 20,
            }}
          >
            {visitas.porDia.reduce((acc, d) => acc + parseInt(d.visitas), 0)}{" "}
            visitas
          </div>
        </div>

        <LineChart datos={visitas.porDia} color="var(--brand)" altura={110} />

        {/* Labels eje X */}
        {visitas.porDia.length > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            {etiquetasX.map((l, i) => (
              <span key={i} style={{ fontSize: 11, color: "var(--text-3)" }}>
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid inferior: Reseñas + Resumen rápido ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Últimas reseñas */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 18,
            padding: "24px 28px",
            border: "1px solid #F0EBE5",
            boxShadow: "0 2px 12px rgba(26,18,8,.05)",
          }}
        >
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-1)",
              marginBottom: 18,
            }}
          >
            Últimas reseñas
          </h2>

          {resenas.ultimas.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--text-3)",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <AppIcon name="message" size={32} />
              </div>
              <div style={{ fontSize: 14 }}>Aún no tienes reseñas.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                ¡Comparte tu negocio para que te califiquen!
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resenas.ultimas.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    border: "1px solid #F0EBE5",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--brand)",
                          color: "var(--surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {r.usuario_nombre?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-1)",
                          }}
                        >
                          {r.usuario_nombre}
                        </div>
                        <Estrellas valor={r.estrellas} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {new Date(r.creado_en).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  {r.comentario && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-2)",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
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
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              padding: "22px",
              border: "1px solid #F0EBE5",
              boxShadow: "0 2px 12px rgba(26,18,8,.05)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-1)",
                marginBottom: 14,
              }}
            >
              Acciones rápidas
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 10,
                  fontSize: 14,
                }}
                onClick={abrirEdicion}
                disabled={cargandoEditar}
              >
                {cargandoEditar ? (
                  "Cargando..."
                ) : (
                  <>
                    <AppIcon name="edit" size={16} /> Editar información
                  </>
                )}
              </button>
              <button
                className="btn-secondary"
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 10,
                  fontSize: 14,
                }}
                onClick={cargar}
              >
                <AppIcon name="refresh" size={16} /> Actualizar datos
              </button>
            </div>
          </div>

          {/* Distribución de calificaciones */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              padding: "22px",
              border: "1px solid #F0EBE5",
              boxShadow: "0 2px 12px rgba(26,18,8,.05)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-1)",
                marginBottom: 16,
              }}
            >
              Calificación promedio
            </h3>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                  color: "var(--text-1)",
                  lineHeight: 1,
                }}
              >
                {resenas.promedio.toFixed(1)}
              </div>
              <Estrellas valor={resenas.promedio} />
              <div
                style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}
              >
                Basado en {resenas.total} reseña{resenas.total !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Barra de promedio visual */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[5, 4, 3, 2, 1].map((estrella) => {
                const pct =
                  resenas.total > 0
                    ? Math.round(
                        (resenas.ultimas.filter(
                          (r) => Math.round(r.estrellas) === estrella,
                        ).length /
                          Math.min(resenas.total, resenas.ultimas.length)) *
                          100,
                      )
                    : 0;
                return (
                  <div
                    key={estrella}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        width: 12,
                        textAlign: "right",
                      }}
                    >
                      {estrella}
                    </span>
                    <AppIcon
                      name="star"
                      size={11}
                      color="#E8A020"
                      fill="currentColor"
                    />
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "#F0EBE5",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background:
                            estrella >= 4
                              ? "var(--green)"
                              : estrella === 3
                                ? "#E8A020"
                                : "var(--red)",
                          borderRadius: 3,
                          transition: "width .5s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        width: 28,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip */}
          <div
            style={{
              background:
                "linear-gradient(135deg, var(--brand-hover), #FFF8EC)",
              borderRadius: 16,
              padding: "18px",
              border: "1px solid var(--brand-border)",
            }}
          >
            <div style={{ marginBottom: 6, color: "var(--brand)" }}>
              <AppIcon name="lightbulb" size={19} />
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-1)",
                marginBottom: 4,
              }}
            >
              Tip para más visitas
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}
            >
              Los negocios con fotos de portada reciben{" "}
              <strong>3× más visitas</strong>. Agrega o actualiza tus imágenes
              desde <em>Editar información</em>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
