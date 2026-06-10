export default function Footer({ onIrInicio, onIrNegocios, onVerFavoritos }) {
  const año = new Date().getFullYear();

  return (
    <footer style={{
      background: "#1A1208",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "32px 20px",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>

        {/* Logo + tagline */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <img src="/Antojapp icon.png" alt="Antojapp" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>
              Antoj<span style={{ color: "#E8460A" }}>app</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", margin: 0 }}>
            Descubre lo mejor de la comida en Valledupar
          </p>
        </div>

        {/* Links */}
        <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "Inicio",    accion: onIrInicio   },
            { label: "Negocios",  accion: onIrNegocios },
            { label: "Guardados", accion: () => onVerFavoritos(true) },
          ].map(({ label, accion }) => (
            <button
              key={label}
              onClick={accion}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,.5)", fontSize: 13,
                cursor: "pointer", padding: "4px 10px", borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.color = "#E8460A"}
              onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,.5)"}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Copyright */}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", margin: 0 }}>
          © {año} Antojapp
        </p>
      </div>
    </footer>
  );
}