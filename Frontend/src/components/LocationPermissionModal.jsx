import { useState } from "react";
import AppIcon from "./AppIcon";
import { useLocationData } from "../hooks/useLocationData";

/**
 * Modal de ubicación multi-paso.
 *
 * Pasos:
 *  "consent"      → pedir permiso GPS
 *  "detectando"   → esperando GPS
 *  "departamento" → elegir departamento/estado (opcional)
 *  "ciudad"       → elegir ciudad (opcional)
 *  "pais_manual"  → si rechazó GPS, elegir país manualmente
 *
 * En cada paso el usuario puede confirmar con la granularidad que desee:
 *   - Solo país
 *   - País + departamento
 *   - País + departamento + ciudad
 *
 * onConfirmar({ iso2, nombre, departamento, ciudad }) => void
 * onSaltar() => void
 */
export default function LocationPermissionModal({ onConfirmar, onSaltar }) {
  const [paso, setPaso]               = useState("consent");
  const [paisElegido, setPaisElegido] = useState(null);   // { iso2, nombre, bandera }
  const [deptElegido, setDeptElegido] = useState(null);   // string (display)
  const [busqueda, setBusqueda]       = useState("");

  const [estados, setEstados]                   = useState([]);
  const [ciudades, setCiudades]                 = useState([]);
  const [loadingEstados, setLoadingEstados]     = useState(false);
  const [loadingCiudades, setLoadingCiudades]   = useState(false);

  const [gpsEstado, setGpsEstado] = useState("idle");
  const [gpsPais, setGpsPais]     = useState(null);

  const { countries, loadingCountries, fetchStates, fetchCities } = useLocationData();

  // ── GPS ────────────────────────────────────────────────────────
  const solicitarGPS = () => {
    if (!navigator.geolocation) { setGpsEstado("error"); return; }
    setGpsEstado("detectando");
    setPaso("detectando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res  = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
          );
          const data = await res.json();
          const iso2   = data.countryCode || null;
          const nombre = data.countryName  || null;
          if (iso2) {
            const c = countries.find(c => c.iso2 === iso2) || { iso2, nombre, bandera: getFlagEmoji(iso2) };
            setGpsPais({ iso2, nombre: nombre || c.nombre, bandera: c.bandera });
            setPaisElegido({ iso2, nombre: nombre || c.nombre, bandera: c.bandera });
            setGpsEstado("ok");
            cargarEstados(nombre || c.nombre, "departamento");
          } else {
            setGpsEstado("error");
            setPaso("pais_manual");
          }
        } catch {
          setGpsEstado("error");
          setPaso("pais_manual");
        }
      },
      () => { setGpsEstado("error"); setPaso("pais_manual"); },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // ── Cargar departamentos ───────────────────────────────────────
  const cargarEstados = async (nombrePais, siguientePaso) => {
    setLoadingEstados(true);
    setBusqueda("");
    const result = await fetchStates(nombrePais);
    setEstados(result);
    setLoadingEstados(false);
    setPaso(siguientePaso);
  };

  // ── Cargar ciudades ────────────────────────────────────────────
  const cargarCiudades = async (nombrePais, dept) => {
    setLoadingCiudades(true);
    setBusqueda("");
    const result = await fetchCities(nombrePais, dept);
    setCiudades(result);
    setLoadingCiudades(false);
    setPaso("ciudad");
  };

  // ── Handlers de selección ──────────────────────────────────────
  const elegirPaisManual = (pais) => {
    setPaisElegido(pais);
    cargarEstados(pais.nombre, "departamento");
  };

  const elegirDept = (dept) => {
    // dept = { display: "Cesar", original: "Cesar Department" }
    setDeptElegido(dept.display);
    cargarCiudades(paisElegido.nombre, dept.original);
  };

  // Confirmar solo con el país
  const confirmarSoloPais = () => {
    onConfirmar({ iso2: paisElegido.iso2, nombre: paisElegido.nombre, departamento: null, ciudad: null });
  };

  // Confirmar con país + departamento (sin ciudad)
  const confirmarSoloDept = () => {
    onConfirmar({ iso2: paisElegido.iso2, nombre: paisElegido.nombre, departamento: deptElegido, ciudad: null });
  };

  // Confirmar con ciudad
  const confirmarCiudad = (ciudad) => {
    onConfirmar({ iso2: paisElegido.iso2, nombre: paisElegido.nombre, departamento: deptElegido, ciudad });
  };

  // ── Filtrados ──────────────────────────────────────────────────
  const q = busqueda.toLowerCase();
  const paisesFiltrados   = q ? countries.filter(p => p.nombre.toLowerCase().includes(q)) : countries;
  const estadosFiltrados  = q ? estados.filter(e => e.display.toLowerCase().includes(q))  : estados;
  const ciudadesFiltradas = q ? ciudades.filter(c => c.toLowerCase().includes(q))          : ciudades;

  // ── Títulos por paso ───────────────────────────────────────────
  const titulos = {
    consent:      { icon: "mapPin",  title: "¿Dónde estás?",               sub: "Personaliza tu experiencia según tu ubicación" },
    detectando:   { icon: "search",  title: "Detectando tu ubicación…",    sub: "Por favor espera un momento" },
    pais_manual:  { icon: "globe",   title: "Elige tu país",               sub: "Selecciona el país donde estás" },
    departamento: { icon: "mapPin",  title: `Departamento en ${paisElegido?.nombre || "…"}`, sub: "Elige tu zona o confirma solo el país" },
    ciudad:       { icon: "store",   title: `Ciudad en ${deptElegido || "…"}`,              sub: "Elige tu ciudad o confirma solo el departamento" },
  };
  const t = titulos[paso] || titulos.consent;

  // ── Progreso visual ────────────────────────────────────────────
  const progreso = { pais_manual: "25%", departamento: "60%", ciudad: "90%" };

  return (
    <>
      <div
        onClick={onSaltar}
        style={{
          position: "fixed", inset: 0, background: "rgba(26,18,8,.60)",
          zIndex: 900, backdropFilter: "blur(6px)", cursor: "pointer",
        }}
      />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 901,
        background: "#fff", borderRadius: 20,
        boxShadow: "0 32px 80px rgba(26,18,8,.28)",
        width: "min(440px, 92vw)",
        overflow: "hidden",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1)",
      }}>

        {/* Barra de progreso */}
        {paso !== "consent" && paso !== "detectando" && (
          <div style={{ height: 3, background: "#F0EBE5" }}>
            <div style={{
              height: "100%", background: "linear-gradient(90deg, #E8460A, #FF6B35)",
              width: progreso[paso] || "25%",
              transition: "width 0.4s ease", borderRadius: 3,
            }} />
          </div>
        )}

        {/* Header */}
        <div style={{ padding: "28px 28px 20px", textAlign: "center", borderBottom: paso === "consent" ? "none" : "1px solid #F0EBE5", position: "relative" }}>

          {/* Cerrar */}
          <button
            onClick={onSaltar}
            title="Cerrar"
            style={{
              position: "absolute", right: 14, top: 14,
              width: 30, height: 30,
              background: "#F7F4F1", border: "none", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B5E52", fontSize: 16,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "#E2DBD5"; e.currentTarget.style.color = "#1A1208"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#F7F4F1"; e.currentTarget.style.color = "#6B5E52"; }}
          >
            <AppIcon name="x" size={14} />
          </button>

          {/* Atrás */}
          {paso !== "consent" && paso !== "detectando" && (
            <button
              onClick={() => {
                if (paso === "pais_manual")  setPaso("consent");
                if (paso === "departamento") { setPaso(gpsPais ? "consent" : "pais_manual"); }
                if (paso === "ciudad")        setPaso("departamento");
              }}
              style={{
                position: "absolute", left: 16, top: 18,
                background: "#F7F4F1", border: "none", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                color: "#6B5E52", fontSize: 12, fontWeight: 600,
              }}
            >
              <AppIcon name="chevronLeft" size={13} /> Atrás
            </button>
          )}

          {/* Ícono */}
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: paso === "detectando" ? "#F0EBE5" : "linear-gradient(135deg, #FFF0EB, #FFE4D6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 26,
            boxShadow: "0 4px 16px rgba(232,70,10,.15)",
            animation: paso === "detectando" ? "pulseIcon 1.2s infinite" : "none",
          }}>
            {paso === "detectando" ? (
              <div style={{ animation: "spin 1s linear infinite", display: "flex" }}>
                <AppIcon name="refresh" size={24} color="#E8460A" />
              </div>
            ) : (
              <AppIcon name={t.icon} size={26} color="#E8460A" />
            )}
          </div>

          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 6, lineHeight: 1.25 }}>
            {t.title}
          </h2>
          <p style={{ fontSize: 13, color: "#6B5E52", margin: 0, lineHeight: 1.55 }}>
            {t.sub}
          </p>

          {/* Badge país GPS */}
          {gpsPais && paso === "departamento" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#FFF0EB", color: "#E8460A",
              padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
              marginTop: 10,
            }}>
              <span style={{ fontSize: 18 }}>{gpsPais.bandera}</span>
              {gpsPais.nombre}
              <span style={{ fontSize: 10, background: "#E8460A", color: "#fff", padding: "1px 6px", borderRadius: 10, marginLeft: 2 }}>
                GPS <AppIcon name="check" size={10} color="#fff" />
              </span>
            </div>
          )}
        </div>

        {/* ── Contenido por paso ── */}

        {/* PASO: consent */}
        {paso === "consent" && (
          <div style={{ padding: "20px 28px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={solicitarGPS}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12,
                  background: "linear-gradient(135deg, #E8460A, #FF6B35)",
                  color: "#fff", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(232,70,10,.35)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(232,70,10,.45)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,70,10,.35)"; }}
              >
                <AppIcon name="mapPin" size={16} />
                Usar mi ubicación GPS
              </button>

              <button
                onClick={() => setPaso("pais_manual")}
                style={{
                  width: "100%", padding: "12px 20px", borderRadius: 12,
                  background: "#F7F4F1", color: "#1A1208",
                  border: "1.5px solid #E2DBD5", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#F0EBE5"}
                onMouseOut={e => e.currentTarget.style.background = "#F7F4F1"}
              >
                <AppIcon name="globe" size={16} /> Elegir país manualmente
              </button>

              <button
                onClick={onSaltar}
                style={{ width: "100%", padding: "10px", border: "none", background: "transparent", color: "#A8988A", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
              >
                Mostrar todos los negocios sin filtrar
              </button>
            </div>
            <p style={{ fontSize: 10, color: "#C0B8B0", marginTop: 14, textAlign: "center", lineHeight: 1.5 }}>
              <AppIcon name="lock" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Tu ubicación no se guarda ni se comparte con terceros.
            </p>
          </div>
        )}

        {/* PASO: detectando GPS */}
        {paso === "detectando" && (
          <div style={{ padding: "20px 28px 32px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#E8460A",
                  animation: `bounce 0.8s ease ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#A8988A" }}>Obteniendo tu país…</p>
            <button
              onClick={() => { setPaso("pais_manual"); setGpsEstado("idle"); }}
              style={{ marginTop: 16, background: "none", border: "none", color: "#A8988A", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Elegir manualmente
            </button>
          </div>
        )}

        {/* PASO: país manual */}
        {paso === "pais_manual" && (
          <StepLista
            items={paisesFiltrados}
            loading={loadingCountries}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            placeholder="Buscar país…"
            renderItem={(p) => ({
              icon: p.bandera,
              label: p.nombre,
              onClick: () => elegirPaisManual(p),
            })}
            skeletonCount={8}
          />
        )}

        {/* PASO: departamento */}
        {paso === "departamento" && (
          <>
            {/* Opción: confirmar solo con el país */}
            {!loadingEstados && (
              <ConfirmBanner
                icon={paisElegido?.bandera}
                label={`Ver negocios en todo ${paisElegido?.nombre}`}
                sublabel="Sin filtrar por departamento ni ciudad"
                onClick={confirmarSoloPais}
              />
            )}
            <StepLista
              items={estadosFiltrados}
              loading={loadingEstados}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              placeholder="Buscar departamento…"
              renderItem={(d) => ({
                icon: "mapPin",
                label: d.display,
                onClick: () => elegirDept(d),
              })}
              skeletonCount={6}
              emptyText="No se encontraron departamentos"
            />
          </>
        )}

        {/* PASO: ciudad */}
        {paso === "ciudad" && (
          <>
            {/* Opción: confirmar solo con departamento */}
            {!loadingCiudades && (
              <ConfirmBanner
                icon="mapPin"
                label={`Ver negocios en todo ${deptElegido}`}
                sublabel={`Todo el departamento, sin filtrar por ciudad`}
                onClick={confirmarSoloDept}
              />
            )}
            <StepLista
              items={ciudadesFiltradas}
              loading={loadingCiudades}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              placeholder="Buscar ciudad…"
              renderItem={(c) => ({
                icon: null,
                label: c,
                onClick: () => confirmarCiudad(c),
              })}
              skeletonCount={5}
              emptyText="No se encontraron ciudades"
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -56%) scale(0.94); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseIcon {
          0%, 100% { box-shadow: 0 4px 16px rgba(232,70,10,.15); }
          50%       { box-shadow: 0 4px 28px rgba(232,70,10,.40); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Banner de confirmación rápida ────────────────────────────────
// Aparece en los pasos de departamento y ciudad para que el usuario
// pueda confirmar con la granularidad actual sin tener que seguir.
function ConfirmBanner({ icon, label, sublabel, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px",
        background: hover ? "#FFF5F0" : "#FFF0EB",
        border: "none", borderBottom: "1px solid #FFD8C8",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.15s",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #E8460A, #FF6B35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon === "mapPin"
          ? <AppIcon name="mapPin" size={16} color="#fff" />
          : <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E8460A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#A8988A" }}>{sublabel}</div>
      </div>
      <div style={{
        flexShrink: 0, background: "#E8460A", color: "#fff",
        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
      }}>
        Confirmar
      </div>
    </button>
  );
}

// ── Lista de selección con buscador ─────────────────────────────
function StepLista({ items, loading, busqueda, onBusqueda, placeholder, renderItem, skeletonCount, emptyText }) {
  return (
    <div>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #F0EBE5" }}>
        <div style={{ position: "relative" }}>
          <AppIcon name="search" size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A8988A" }} />
          <input
            autoFocus
            type="text"
            placeholder={placeholder}
            value={busqueda}
            onChange={e => onBusqueda(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px 8px 32px", borderRadius: 8,
              border: "1.5px solid #E2DBD5", fontSize: 13, color: "#1A1208",
              background: "#fff", outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "#E8460A"}
            onBlur={e => e.target.style.borderColor = "#E2DBD5"}
          />
        </div>
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto", padding: "8px 12px 12px" }}>
        {loading ? (
          <SkeletonRows count={skeletonCount} />
        ) : items.length > 0 ? (
          items.map((item, i) => {
            const { icon, label, onClick } = renderItem(item);
            return <RowBtn key={i} icon={icon} label={label} onClick={onClick} />;
          })
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "#A8988A", fontSize: 13 }}>
            {emptyText || "Sin resultados"}
          </div>
        )}
      </div>
    </div>
  );
}

function RowBtn({ icon, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left",
        background: hover ? "#FFF0EB" : "transparent",
        color: hover ? "#E8460A" : "#1A1208",
        transition: "background 0.12s, color 0.12s",
        marginBottom: 1,
      }}
    >
      {icon !== null && (
        <span style={{ width: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {(icon === "mapPin" || icon === "globe" || icon === "store" || icon === "search")
            ? <AppIcon name={icon} size={18} color="#6B5E52" />
            : <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>}
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <AppIcon name="chevronRight" size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
    </button>
  );
}

function SkeletonRows({ count }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F0EBE5", animation: "shimmer 1.2s infinite" }} />
          <div style={{ height: 13, borderRadius: 4, background: "#F0EBE5", animation: "shimmer 1.2s infinite", width: `${55 + (i * 17 % 35)}%` }} />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </>
  );
}

function getFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return null;
  return String.fromCodePoint(...[...iso2.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
}