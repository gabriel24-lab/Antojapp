import AppIcon from "./AppIcon";

export default function LocationPermissionModal({ onPermitir, onRechazar }) {
  return (
    <>
      {/* Overlay */}
      <div style={{
        position: "fixed", inset: 0, background: "rgba(26,18,8,.55)",
        zIndex: 900, backdropFilter: "blur(4px)",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 901,
        background: "#fff", borderRadius: 18,
        boxShadow: "0 24px 80px rgba(26,18,8,.22)",
        padding: "32px 28px 24px",
        width: "min(420px, 90vw)",
        textAlign: "center",
        animation: "modalIn 0.2s ease",
      }}>
        {/* Icono */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#FFF0EB", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 20px",
        }}>
          <AppIcon name="mapPin" size={28} color="#E8460A" />
        </div>

        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
          color: "#1A1208", marginBottom: 10, lineHeight: 1.25,
        }}>
          ¿Dónde estás?
        </h2>
        <p style={{ fontSize: 14, color: "#6B5E52", lineHeight: 1.6, marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
          Permitir el acceso a tu ubicación para ver los negocios <strong>más cercanos a ti</strong> primero. Si prefieres no compartirla, te mostraremos negocios de todos los países.
        </p>

        {/* Botones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onPermitir}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 10,
              background: "#E8460A", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "#C73A09"}
            onMouseOut={e => e.currentTarget.style.background = "#E8460A"}
          >
            <AppIcon name="mapPin" size={16} />
            Permitir ubicación
          </button>
          <button
            onClick={onRechazar}
            style={{
              width: "100%", padding: "11px 20px", borderRadius: 10,
              background: "transparent", color: "#A8988A",
              border: "1.5px solid #E2DBD5", cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "#F7F4F1"; e.currentTarget.style.color = "#6B5E52"; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A8988A"; }}
          >
            Ver todos los países sin filtrar
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 16, lineHeight: 1.5 }}>
          Tu ubicación no se guarda ni se comparte. Solo se usa para ordenar los resultados.
        </p>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -54%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
