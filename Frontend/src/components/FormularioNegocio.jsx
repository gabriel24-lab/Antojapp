import { useState, useEffect, useRef } from "react";
import { apiMutate, apiFetch, apiUpload, apiDelete } from "../apiClient";
import AppIcon from "./AppIcon";

// ── Constantes ────────────────────────────────────────────────
const CATEGORIAS = [
  "Carnes y asados", "Comida típica", "Fritanga", "Jugos y bebidas",
  "Comida callejera", "Mariscos", "Pizzas y pastas", "Hamburguesas",
  "Pollo y aves", "Vegetariano / Vegano", "Desayunos", "Postres y dulces",
  "Sushi y japonesa", "Comida rápida", "Otro",
];

const DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
const DIAS_LABEL = { lunes:"Lun", martes:"Mar", miercoles:"Mié", jueves:"Jue", viernes:"Vie", sabado:"Sáb", domingo:"Dom" };
// Sugerencias rápidas de tipo (el propietario puede escribir lo que quiera)
const TIPO_SUGERENCIAS = [
  "Estrella", "Económico", "Premium", "Especial del día",
  "Desayuno", "Almuerzo", "Cena", "Para llevar", "Menú",
];

const HORARIO_VACIO = { lunes:"cerrado", martes:"cerrado", miercoles:"cerrado", jueves:"cerrado", viernes:"cerrado", sabado:"cerrado", domingo:"cerrado" };

// ── Helpers UI ────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label style={{ fontSize: 13, fontWeight: 600, color: "#6B5E52", display: "block", marginBottom: 6 }}>
    {children}{required && <span style={{ color: "#E8460A", marginLeft: 3 }}>*</span>}
  </label>
);

const Field = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{children}</div>
);

const SectionTitle = ({ icon, children, iconProps = {} }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 4 }}>
    <AppIcon name={icon} size={18} color="#E8460A" fill={icon === "star" ? "currentColor" : "none"} {...iconProps} />
    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1208" }}>{children}</h3>
  </div>
);

const Divider = () => <div style={{ height: 1, background: "#F0EBE5", margin: "20px 0" }} />;

const ErrorMsg = ({ msg }) => msg
  ? <div style={{ fontSize: 13, color: "#C0392B", background: "#FDECEA", padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>{msg}</div>
  : null;

// ── Componente: Selector de horario por sede ──────────────────
function HorarioEditor({ horario, onChange }) {
  const h = horario || { ...HORARIO_VACIO };

  const setHora = (dia, val) => onChange({ ...h, [dia]: val });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {DIAS.map(dia => {
        const abierto = h[dia] !== "cerrado" && h[dia] !== "";
        const [apertura, cierre] = abierto ? (h[dia] || "").split("-") : ["08:00", "20:00"];

        return (
          <div key={dia} style={{ display: "grid", gridTemplateColumns: "60px 1fr", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6B5E52" }}>{DIAS_LABEL[dia]}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setHora(dia, abierto ? "cerrado" : "08:00-20:00")}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: "1.5px solid",
                  borderColor: abierto ? "#1A8C5B" : "#E2DBD5",
                  background: abierto ? "#E8F6EE" : "#F7F4F1",
                  color: abierto ? "#1A8C5B" : "#A8988A",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {abierto ? "Abierto" : "Cerrado"}
              </button>
              {abierto && (
                <>
                  <input
                    type="time" className="input" value={apertura || "08:00"}
                    style={{ padding: "6px 10px", fontSize: 13, flex: 1 }}
                    onChange={e => setHora(dia, `${e.target.value}-${cierre || "20:00"}`)}
                  />
                  <span style={{ fontSize: 13, color: "#A8988A" }}>–</span>
                  <input
                    type="time" className="input" value={cierre || "20:00"}
                    style={{ padding: "6px 10px", fontSize: 13, flex: 1 }}
                    onChange={e => setHora(dia, `${apertura || "08:00"}-${e.target.value}`)}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente: Card de sede ──────────────────────────────────
function SedeCard({ sede, index, onChange, onEliminar, esUnica }) {
  const [expandida, setExpandida] = useState(index === 0);
  const set = (k, v) => onChange({ ...sede, [k]: v });

  return (
    <div style={{ border: "1.5px solid #E2DBD5", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpandida(!expandida)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", cursor: "pointer",
          background: expandida ? "#FFF4F0" : "#FAFAF9",
          borderBottom: expandida ? "1px solid #F0EBE5" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AppIcon name="mapPin" size={16} color="#E8460A" />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1A1208" }}>
            {sede.nombre || `Sede ${index + 1}`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!esUnica && (
            <button
              type="button" onClick={e => { e.stopPropagation(); onEliminar(); }}
              style={{ fontSize: 13, color: "#C0392B", padding: "2px 8px", borderRadius: 6, border: "1px solid #FDECEA", background: "#FDECEA", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
            ><AppIcon name="x" size={13} /> Eliminar</button>
          )}
          <AppIcon name={expandida ? "chevronUp" : "chevronDown"} size={14} color="#A8988A" />
        </div>
      </div>

      {/* Cuerpo */}
      {expandida && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
            <Field>
              <Label required>Nombre de la sede</Label>
              <input className="input" value={sede.nombre || ""} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Sede Centro" />
            </Field>
            <Field style={{ gridColumn: "1 / -1" }}>
              <Label>Teléfonos de contacto (WhatsApp)</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(sede.telefonos || [""]).map((tel, ti) => (
                  <div key={ti} style={{ display: "flex", gap: 6 }}>
                    <input
                      className="input"
                      value={tel}
                      onChange={e => {
                        const nums = [...(sede.telefonos || [""])];
                        nums[ti] = e.target.value;
                        set("telefonos", nums);
                      }}
                      placeholder="300 123 4567"
                      style={{ flex: 1 }}
                    />
                    {(sede.telefonos || [""]).length > 1 && (
                      <button
                        type="button"
                        onClick={() => set("telefonos", (sede.telefonos || [""]).filter((_, idx) => idx !== ti))}
                        style={{
                          padding: "0 12px", borderRadius: 8, border: "1px solid #E2DBD5",
                          background: "#FFF4F0", color: "#E8460A", cursor: "pointer", fontSize: 18, lineHeight: 1,
                        }}
                      >×</button>
                    )}
                  </div>
                ))}
                {(sede.telefonos || [""]).length < 4 && (
                  <button
                    type="button"
                    onClick={() => set("telefonos", [...(sede.telefonos || [""]), ""])}
                    style={{
                      fontSize: 13, color: "#E8460A", background: "none", border: "1px dashed #E8460A",
                      borderRadius: 8, padding: "6px 12px", cursor: "pointer", width: "fit-content",
                    }}
                  >+ Agregar teléfono</button>
                )}
              </div>
            </Field>
          </div>
          <Field>
            <Label>Dirección</Label>
            <input className="input" value={sede.direccion || ""} onChange={e => set("direccion", e.target.value)} placeholder="Calle 15 #8-42, Barrio Centro" />
          </Field>
          <Field>
            <Label>Referencia / cómo llegar</Label>
            <input className="input" value={sede.referencia || ""} onChange={e => set("referencia", e.target.value)} placeholder="Frente al parque, al lado de..." />
          </Field>
          <Field>
            <Label>Link de Google Maps</Label>
            <input className="input" value={sede.maps_url || ""} onChange={e => set("maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <Divider />
          <SectionTitle icon="clock">Horario de atención</SectionTitle>
          <HorarioEditor horario={sede.horario} onChange={h => set("horario", h)} />
        </div>
      )}
    </div>
  );
}

// ── Componente: Card de plato ─────────────────────────────────
function PlatoCard({ plato, index, onChange, onEliminar, negocioId }) {
  const [expandido, setExpandido] = useState(false);
  const [subiendo,  setSubiendo]  = useState(false);
  const [subiendoB, setSubiendoB] = useState(false);
  const fileRef  = useRef();
  const fileRefB = useRef();
  const set = (k, v) => onChange({ ...plato, [k]: v });

  // Detectar si el tipo es "menú"
  const esMenu = (plato.tipo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === "menu";

  const handleFoto = async (e, lado = "a") => {
    const file = e.target.files[0];
    if (!file || !negocioId || !plato.id) return;
    lado === "a" ? setSubiendo(true) : setSubiendoB(true);
    const fd = new FormData();
    fd.append("foto", file);
    if (lado === "b") {
      fd.append("lado", "b");
      const { data } = await apiUpload(`/negocios/${negocioId}/platos/${plato.id}/foto?lado=b`, fd);
      if (data?.url) set("foto_menu_b", data.url);
    } else {
      const { data } = await apiUpload(`/negocios/${negocioId}/platos/${plato.id}/foto`, fd);
      if (data?.url) set("foto", data.url);
    }
    lado === "a" ? setSubiendo(false) : setSubiendoB(false);
  };

  const toggleDescuento = (dia) => {
    const desc = plato.descuentos || [];
    const existe = desc.find(d => d.dia === dia);
    if (existe) {
      onChange({ ...plato, descuentos: desc.filter(d => d.dia !== dia) });
    } else {
      onChange({ ...plato, descuentos: [...desc, { dia, precio_desc: Math.round((plato.precio || 0) * 0.8) }] });
    }
  };

  const setDescPrecio = (dia, precio) => {
    const desc = (plato.descuentos || []).map(d => d.dia === dia ? { ...d, precio_desc: parseInt(precio) } : d);
    onChange({ ...plato, descuentos: desc });
  };

  // Preview header
  const previewFoto = plato.foto;
  const previewLabel = plato.tipo
    ? (plato.tipo.charAt(0).toUpperCase() + plato.tipo.slice(1))
    : `Plato ${index + 1}`;

  return (
    <div style={{ border: "1.5px solid #E2DBD5", borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpandido(!expandido)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", cursor: "pointer",
          background: expandido ? "#FFF4F0" : "#FAFAF9",
          borderBottom: expandido ? "1px solid #F0EBE5" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {previewFoto
            ? <img src={previewFoto} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
            : <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F0EBE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#A8988A" }}><AppIcon name="utensils" size={18} /></div>
          }
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1208" }}>{plato.nombre || `Plato ${index + 1}`}</div>
            <div style={{ fontSize: 12, color: "#A8988A" }}>
              {previewLabel}{!esMenu && plato.precio ? ` · $${parseInt(plato.precio).toLocaleString("es-CO")}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button" onClick={e => { e.stopPropagation(); onEliminar(); }}
            style={{ fontSize: 13, color: "#C0392B", padding: "2px 8px", borderRadius: 6, border: "1px solid #FDECEA", background: "#FDECEA", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
          ><AppIcon name="x" size={13} /></button>
          <AppIcon name={expandido ? "chevronUp" : "chevronDown"} size={14} color="#A8988A" />
        </div>
      </div>

      {/* Cuerpo */}
      {expandido && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Tipo: input libre con sugerencias */}
          <Field>
            <Label required>Tipo / etiqueta del plato</Label>
            <input
              className="input"
              list="tipo-sugerencias"
              value={plato.tipo || ""}
              onChange={e => set("tipo", e.target.value)}
              placeholder="Ej: Estrella, Menú, Especial del día..."
            />
            <datalist id="tipo-sugerencias">
              {TIPO_SUGERENCIAS.map(s => <option key={s} value={s} />)}
            </datalist>
            <div style={{ fontSize: 11, color: "#A8988A", marginTop: 4 }}>
              Escribe libremente o elige una sugerencia. Pon <strong>Menú</strong> para subir fotos de carta.
            </div>
          </Field>

          {/* Nombre (siempre visible) */}
          <Field>
            <Label required>Nombre</Label>
            <input
              className="input"
              value={plato.nombre || ""}
              onChange={e => set("nombre", e.target.value)}
              placeholder={esMenu ? "Ej: Menú del día, Carta principal..." : "Ej: Bandeja paisa"}
            />
          </Field>

          {/* Precio y descripción — solo si NO es menú */}
          {!esMenu && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
              <Field>
                <Label required>Precio ($)</Label>
                <input className="input" type="number" min="0" value={plato.precio || ""} onChange={e => set("precio", e.target.value)} placeholder="15000" />
              </Field>
              <Field>
                <Label>Descripción breve</Label>
                <input className="input" value={plato.descripcion || ""} onChange={e => set("descripcion", e.target.value)} placeholder="Ingredientes principales..." />
              </Field>
            </div>
          )}

          {/* Descripción para menú (sin precio) */}
          {esMenu && (
            <Field>
              <Label>Descripción (opcional)</Label>
              <input className="input" value={plato.descripcion || ""} onChange={e => set("descripcion", e.target.value)} placeholder="Ej: Menú ejecutivo de lunes a viernes..." />
            </Field>
          )}

          {/* Fotos */}
          {esMenu ? (
            /* Menú: 2 fotos (cara A y cara B) */
            <Field>
              <Label>Fotos del menú</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 10 }}>
                {[
                  { key: "foto",       ref: fileRef,  handler: (e) => handleFoto(e, "a"), label: "Cara A / Frente",  preview: plato.foto,       subiendo: subiendo  },
                  { key: "foto_menu_b",ref: fileRefB, handler: (e) => handleFoto(e, "b"), label: "Cara B / Reverso", preview: plato.foto_menu_b, subiendo: subiendoB },
                ].map(({ ref, handler, label, preview, subiendo: sub }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6B5E52", marginBottom: 5 }}>{label}</div>
                    <div
                      onClick={() => ref.current?.click()}
                      style={{
                        border: "2px dashed #E2DBD5", borderRadius: 10, padding: 12,
                        cursor: "pointer", textAlign: "center", background: preview ? "none" : "#FAFAF9",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 100,
                        justifyContent: "center",
                      }}
                    >
                      {preview
                        ? <img src={preview} alt="" style={{ width: "100%", maxHeight: 120, borderRadius: 8, objectFit: "cover" }} />
                        : <span style={{ color: "#A8988A" }}><AppIcon name="camera" size={28} /></span>
                      }
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#6B5E52" }}>
                        {sub ? "Subiendo..." : preview ? "Cambiar" : "Subir foto"}
                      </div>
                    </div>
                    <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handler} />
                  </div>
                ))}
              </div>
              {!negocioId && <div style={{ fontSize: 12, color: "#A8988A", marginTop: 4 }}><AppIcon name="alert" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Guarda el negocio primero para subir fotos</div>}
            </Field>
          ) : (
            /* Plato normal: 1 foto */
            <Field>
              <Label>Foto del plato</Label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed #E2DBD5", borderRadius: 10, padding: 16,
                  cursor: "pointer", textAlign: "center",
                  background: plato.foto ? "none" : "#FAFAF9",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                {plato.foto
                  ? <img src={plato.foto} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                  : <span style={{ color: "#A8988A" }}><AppIcon name="camera" size={28} /></span>
                }
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5E52" }}>{subiendo ? "Subiendo..." : plato.foto ? "Cambiar foto" : "Subir foto"}</div>
                  <div style={{ fontSize: 12, color: "#A8988A", marginTop: 2 }}>JPG, PNG · Máx 5 MB</div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFoto(e, "a")} />
              {!negocioId && <div style={{ fontSize: 12, color: "#A8988A", marginTop: 4 }}><AppIcon name="alert" size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Guarda el negocio primero para subir fotos</div>}
            </Field>
          )}

          {/* Disponibilidad */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => set("disponible", !plato.disponible)}
              style={{
                width: 42, height: 24, borderRadius: 12,
                background: plato.disponible !== false ? "#1A8C5B" : "#E2DBD5",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background .18s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: plato.disponible !== false ? 21 : 3,
                transition: "left .18s",
              }} />
            </button>
            <span style={{ fontSize: 13, color: "#6B5E52", fontWeight: 500 }}>
              {plato.disponible !== false ? "Disponible hoy" : "No disponible"}
            </span>
          </div>

          {/* Descuentos por día — solo si NO es menú */}
          {!esMenu && (
            <>
              <Divider />
              <SectionTitle icon="tag">Descuentos por día</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DIAS.map(dia => {
                  const desc = (plato.descuentos || []).find(d => d.dia === dia);
                  return (
                    <div key={dia} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, alignItems: "center" }}>
                      <button
                        type="button" onClick={() => toggleDescuento(dia)}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                          border: "1.5px solid", cursor: "pointer",
                          borderColor: desc ? "#E8460A" : "#E2DBD5",
                          background: desc ? "#FFF4F0" : "#F7F4F1",
                          color: desc ? "#E8460A" : "#A8988A",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        {DIAS_LABEL[dia]} {desc ? <AppIcon name="check" size={12} /> : <AppIcon name="plus" size={12} />}
                      </button>
                      {desc && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#6B5E52" }}>Precio especial $</span>
                          <input
                            className="input" type="number" min="0"
                            style={{ padding: "5px 10px", fontSize: 13, maxWidth: 120 }}
                            value={desc.precio_desc || ""}
                            onChange={e => setDescPrecio(dia, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal: FormularioNegocio ───────────────────
export default function FormularioNegocio({ onCerrar, negocioInicial = null }) {
  const esEdicion = !!negocioInicial;

  // ── Estado del formulario por pasos ──
  const [paso, setPaso]       = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState("");
  const [negocioId, setNegocioId] = useState(negocioInicial?.id || null);

  // Paso 1: datos generales
  const [info, setInfo] = useState({
    nombre:      negocioInicial?.nombre      || "",
    categoria:   negocioInicial?.categoria   || "",
    descripcion: negocioInicial?.descripcion || "",
    etiquetas:   Array.isArray(negocioInicial?.etiquetas)
      ? negocioInicial.etiquetas.join(", ")
      : (negocioInicial?.etiquetas || ""),
    whatsapp:    negocioInicial?.whatsapp    || "",
    instagram:   negocioInicial?.instagram   || "",
    maps_url:    negocioInicial?.maps_url    || "",
  });

  // Paso 2: sedes
  const [sedes, setSedes] = useState(
    negocioInicial?.sedes?.length
      ? negocioInicial.sedes.map(s => ({
          ...s,
          telefonos: Array.isArray(s.telefonos) && s.telefonos.length > 0
            ? s.telefonos
            : s.telefono ? [s.telefono] : [""],
        }))
      : [{ nombre: "", direccion: "", telefonos: [""], referencia: "", maps_url: "", horario: { ...HORARIO_VACIO } }]
  );

  // Paso 3: platos
  const [platos, setPlatos] = useState(negocioInicial?.platos || []);

  // Paso 4: imágenes
  const [portadaPreview, setPortadaPreview] = useState(negocioInicial?.portada || null);
  const [iconoPreview,   setIconoPreview]   = useState(negocioInicial?.icono   || null);
  const portadaRef = useRef();
  const iconoRef   = useRef();

  // ── Etiqueta helper ──
  const setInfoField = (k, v) => { setInfo(p => ({ ...p, [k]: v })); setError(""); };

  // ── Paso 1: Guardar info general → crea o actualiza el negocio ──
  const guardarPaso1 = async () => {
    if (!info.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!info.categoria)     return setError("Selecciona una categoría.");
    setGuardando(true); setError("");

    const body = {
      ...info,
      etiquetas: info.etiquetas.split(",").map(e => e.trim()).filter(Boolean),
    };

    const { data, error: err } = negocioId
      ? await apiMutate("PUT",  `/negocios/${negocioId}`, body)
      : await apiMutate("POST", "/negocios", { ...body, sedes: [] });

    setGuardando(false);
    if (err) return setError(err);
    if (!negocioId) setNegocioId(data.id);
    setPaso(2);
  };

  // ── Paso 2: Guardar sedes ──
  const guardarPaso2 = async () => {
    if (sedes.some(s => !s.nombre?.trim())) return setError("Todas las sedes deben tener nombre.");
    setGuardando(true); setError("");

    try {
      if (esEdicion && negocioInicial?.sedes) {
        // En edición: separar sedes existentes, nuevas y eliminadas
        const idsActuales   = sedes.filter(s => s.id).map(s => s.id);
        const idsOriginales = negocioInicial.sedes.map(s => s.id);
        const idsEliminadas = idsOriginales.filter(id => !idsActuales.includes(id));
        const sedesActuales = sedes.filter(s => s.id);
        const sedesNuevas   = sedes.filter(s => !s.id);

        // Eliminar las que el propietario quitó
        await Promise.all(idsEliminadas.map(id =>
          apiDelete(`/negocios/${negocioId}/sedes/${id}`)
        ));
        // Actualizar las existentes
        await Promise.all(sedesActuales.map(s =>
          apiMutate("PUT", `/negocios/${negocioId}/sedes/${s.id}`, s)
        ));
        // Crear las nuevas
        await Promise.all(sedesNuevas.map(s =>
          apiMutate("POST", `/negocios/${negocioId}/sedes`, s)
        ));
      } else {
        // Creación: enviar todas como nuevas
        await Promise.all(sedes.map(s =>
          apiMutate("POST", `/negocios/${negocioId}/sedes`, s)
        ));
      }
    } catch (e) {
      setGuardando(false);
      return setError("Error al guardar las sedes");
    }

    setGuardando(false);
    setPaso(3);
  };

  // ── Paso 3: Guardar platos ──
  const guardarPaso3 = async () => {
    const invalidos = platos.filter(p => {
      if (!p.nombre?.trim() || !p.tipo?.trim()) return true;
      const esMenu = p.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "menu";
      if (!esMenu && !p.precio) return true;
      return false;
    });
    if (invalidos.length) return setError("Completa nombre, tipo (y precio si no es menú) de todos los platos.");
    setGuardando(true); setError("");

    try {
      for (const plato of platos) {
        const esMenu = (plato.tipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "menu";
        const body = {
          nombre:      plato.nombre,
          descripcion: plato.descripcion || "",
          tipo:        plato.tipo,
          precio:      esMenu ? null : parseInt(plato.precio),
          disponible:  plato.disponible !== false,
          descuentos:  esMenu ? [] : (plato.descuentos || []),
          foto_menu_b: esMenu ? (plato.foto_menu_b || null) : null,
        };
        if (plato.id) {
          await apiMutate("PUT", `/negocios/${negocioId}/platos/${plato.id}`, body);
        } else {
          await apiMutate("POST", `/negocios/${negocioId}/platos`, body);
        }
      }
    } catch {
      setGuardando(false);
      return setError("Error al guardar los platos");
    }

    setGuardando(false);
    setPaso(4);
  };

  // ── Paso 4: Subir imágenes ──
  const handleImagen = async (file, tipo) => {
    if (!file || !negocioId) return;
    const fd = new FormData();
    fd.append("imagen", file);
    fd.append("tipo", tipo);
    const { data, error: err } = await apiUpload(`/negocios/${negocioId}/imagen`, fd);
    if (err) setError(err);
    else {
      if (tipo === "portada") setPortadaPreview(data.url);
      else                    setIconoPreview(data.url);
    }
  };

  const finalizar = () => onCerrar(true); // true = refrescar datos

  // ── Barra de progreso ──
  const pasos = ["Información", "Sedes", "Menú", "Imágenes"];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onCerrar(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,18,8,.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "20px 16px", overflowY: "auto",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 640,
        boxShadow: "0 24px 60px rgba(0,0,0,.2)",
        animation: "slideUp .22s ease", marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{ background: "#1A1208", padding: "22px 28px 18px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <AppIcon name={esEdicion ? "edit" : "store"} size={18} />
                {esEdicion ? "Editar negocio" : "Registrar negocio"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 2 }}>
                Paso {paso} de {pasos.length}: <strong style={{ color: "rgba(255,255,255,.8)" }}>{pasos[paso - 1]}</strong>
              </div>
            </div>
            <button onClick={() => onCerrar(false)} style={{ color: "rgba(255,255,255,.4)", lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}><AppIcon name="x" size={22} /></button>
          </div>
          {/* Stepper */}
          <div style={{ display: "flex", gap: 6 }}>
            {pasos.map((p, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < paso ? "#E8460A" : "rgba(255,255,255,.15)", transition: "background .3s" }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>

          {/* ══ PASO 1: INFORMACIÓN GENERAL ══ */}
          {paso === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SectionTitle icon="info">Datos del negocio</SectionTitle>
              <Field>
                <Label required>Nombre del negocio</Label>
                <input className="input" value={info.nombre} onChange={e => setInfoField("nombre", e.target.value)} placeholder="Ej: Fritos Donde la Negra" />
              </Field>
              <Field>
                <Label required>Categoría</Label>
                <select
                  className="input"
                  value={info.categoria}
                  onChange={e => setInfoField("categoria", e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Selecciona una categoría...</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field>
                <Label>Descripción</Label>
                <textarea
                  className="input" rows={3}
                  value={info.descripcion}
                  onChange={e => setInfoField("descripcion", e.target.value)}
                  placeholder="Cuéntanos qué hace especial a tu negocio..."
                  style={{ resize: "vertical", lineHeight: 1.5 }}
                />
              </Field>
              <Field>
                <Label>Etiquetas</Label>
                <input className="input" value={info.etiquetas} onChange={e => setInfoField("etiquetas", e.target.value)} placeholder="costilla, asado, parrilla  (separadas por comas)" />
                <div style={{ fontSize: 12, color: "#A8988A", marginTop: 4 }}>Separa las etiquetas con comas. Ayudan a que te encuentren en la búsqueda.</div>
              </Field>
              <Divider />
              <SectionTitle icon="smartphone">Redes y contacto</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
                <Field>
                  <Label>WhatsApp</Label>
                  <input className="input" value={info.whatsapp} onChange={e => setInfoField("whatsapp", e.target.value)} placeholder="3001234567" />
                </Field>
                <Field>
                  <Label>Instagram</Label>
                  <input className="input" value={info.instagram} onChange={e => setInfoField("instagram", e.target.value)} placeholder="@minegocio" />
                </Field>
              </div>
              <Field>
                <Label>Link principal de Google Maps</Label>
                <input className="input" value={info.maps_url} onChange={e => setInfoField("maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </Field>
            </div>
          )}

          {/* ══ PASO 2: SEDES ══ */}
          {paso === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SectionTitle icon="mapPin">Ubicaciones / Sedes</SectionTitle>
              {sedes.map((sede, i) => (
                <SedeCard
                  key={i} sede={sede} index={i}
                  esUnica={sedes.length === 1}
                  onChange={nuevaSede => setSedes(prev => prev.map((s, idx) => idx === i ? nuevaSede : s))}
                  onEliminar={() => setSedes(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setSedes(prev => [...prev, { nombre: "", direccion: "", telefonos: [""], referencia: "", maps_url: "", horario: { ...HORARIO_VACIO } }])}
                style={{
                  border: "2px dashed #E2DBD5", borderRadius: 12, padding: "12px",
                  fontSize: 14, fontWeight: 600, color: "#A8988A",
                  background: "#FAFAF9", cursor: "pointer",
                  transition: "border-color .18s, color .18s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "#E8460A"; e.target.style.color = "#E8460A"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#E2DBD5"; e.target.style.color = "#A8988A"; }}
              >
                + Agregar otra sede
              </button>
            </div>
          )}

          {/* ══ PASO 3: MENÚ / PLATOS ══ */}
          {paso === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SectionTitle icon="utensils">Menú y platos</SectionTitle>
              <div style={{ fontSize: 13, color: "#A8988A", marginBottom: 4 }}>
                Agrega tus platos principales. Puedes añadir descuentos por días de la semana.
              </div>
              {platos.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#A8988A", fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 8, color: "#C8BDB5" }}><AppIcon name="utensils" size={36} /></div>
                  <div>Aún no has agregado platos.</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Puedes saltarte este paso y agregarlos después.</div>
                </div>
              )}
              {platos.map((plato, i) => (
                <PlatoCard
                  key={i} plato={plato} index={i}
                  negocioId={negocioId}
                  onChange={nuevoPlato => setPlatos(prev => prev.map((p, idx) => idx === i ? nuevoPlato : p))}
                  onEliminar={() => setPlatos(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setPlatos(prev => [...prev, { nombre: "", tipo: "menu", precio: "", descripcion: "", disponible: true, descuentos: [] }])}
                style={{
                  border: "2px dashed #E2DBD5", borderRadius: 12, padding: "12px",
                  fontSize: 14, fontWeight: 600, color: "#A8988A",
                  background: "#FAFAF9", cursor: "pointer",
                  transition: "border-color .18s, color .18s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "#E8460A"; e.target.style.color = "#E8460A"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#E2DBD5"; e.target.style.color = "#A8988A"; }}
              >
                + Agregar plato
              </button>
            </div>
          )}

          {/* ══ PASO 4: IMÁGENES ══ */}
          {paso === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionTitle icon="image">Imágenes del negocio</SectionTitle>

              {/* Portada */}
              <Field>
                <Label>Foto de portada</Label>
                <div
                  onClick={() => portadaRef.current?.click()}
                  style={{
                    border: "2px dashed #E2DBD5", borderRadius: 14, overflow: "hidden",
                    cursor: "pointer", height: 180, position: "relative",
                    background: portadaPreview ? "none" : "#FAFAF9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {portadaPreview
                    ? <img src={portadaPreview} alt="Portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (
                      <div style={{ textAlign: "center", color: "#A8988A" }}>
                        <div style={{ marginBottom: 8 }}><AppIcon name="image" size={36} /></div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Subir foto de portada</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Recomendado: 1200×600px · JPG o PNG · Máx 5 MB</div>
                      </div>
                    )
                  }
                  {portadaPreview && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity .2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><AppIcon name="camera" size={16} /> Cambiar portada</span>
                    </div>
                  )}
                </div>
                <input ref={portadaRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => handleImagen(e.target.files[0], "portada")} />
              </Field>

              {/* Ícono */}
              <Field>
                <Label>Logo / Ícono</Label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    onClick={() => iconoRef.current?.click()}
                    style={{
                      width: 90, height: 90, borderRadius: 16,
                      border: "2px dashed #E2DBD5", overflow: "hidden",
                      cursor: "pointer", background: "#FAFAF9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {iconoPreview
                      ? <img src={iconoPreview} alt="Ícono" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ color: "#A8988A" }}><AppIcon name="store" size={28} /></span>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#6B5E52" }}>Logo o ícono del negocio</div>
                    <div style={{ fontSize: 12, color: "#A8988A", marginTop: 4, lineHeight: 1.5 }}>
                      Se muestra en la tarjeta del negocio.<br />
                      Recomendado: imagen cuadrada, mínimo 200×200px.
                    </div>
                    <button type="button" className="btn-secondary" style={{ marginTop: 10, padding: "6px 14px", fontSize: 13 }}
                      onClick={() => iconoRef.current?.click()}>
                      {iconoPreview ? "Cambiar logo" : "Subir logo"}
                    </button>
                  </div>
                </div>
                <input ref={iconoRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => handleImagen(e.target.files[0], "icono")} />
              </Field>

              {/* Éxito */}
              <div style={{ background: "#E8F6EE", border: "1px solid #1A8C5B", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ marginBottom: 6, color: "#1A8C5B", display: "flex", justifyContent: "center" }}><AppIcon name="sparkles" size={28} /></div>
                <div style={{ fontWeight: 700, color: "#1A8C5B", fontFamily: "'Manrope', sans-serif", fontSize: 15 }}>
                  ¡Tu negocio está casi listo!
                </div>
                <div style={{ fontSize: 13, color: "#6B5E52", marginTop: 6 }}>
                  Las imágenes son opcionales. Puedes agregarlas o cambiarlas más adelante desde tu panel.
                </div>
              </div>
            </div>
          )}

          {/* Error global */}
          <ErrorMsg msg={error} />

          {/* Footer: botones de navegación */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid #F0EBE5" }}>
            <button
              type="button" className="btn-secondary"
              onClick={() => paso === 1 ? onCerrar(false) : setPaso(p => p - 1)}
              style={{ minWidth: 100, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
            >
              {paso === 1 ? "Cancelar" : <><AppIcon name="arrowLeft" size={15} /> Atrás</>}
            </button>

            {paso < 4 ? (
              <button
                type="button" className="btn-primary"
                disabled={guardando}
                onClick={paso === 1 ? guardarPaso1 : paso === 2 ? guardarPaso2 : guardarPaso3}
                style={{ minWidth: 140, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
              >
                {guardando ? "Guardando..." : paso === 3 && platos.length === 0 ? <>Omitir <AppIcon name="arrowRight" size={15} /></> : <>Guardar y continuar <AppIcon name="arrowRight" size={15} /></>}
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={finalizar} style={{ minWidth: 140, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <AppIcon name="check" size={16} /> Finalizar
              </button>
            )}
          </div>
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