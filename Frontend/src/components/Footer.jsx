import { useState, useEffect, useRef } from "react";

export default function Footer({ onIrInicio, onIrNegocios, onVerFavoritos }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  /* ── aparece con fade+slide al entrar en viewport ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const año = new Date().getFullYear();

  const link = (label, accion) => (
    <FooterLink key={label} onClick={accion}>{label}</FooterLink>
  );

  return (
    <footer
      ref={ref}
      style={{
        background: "#1A1208",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "24px var(--content-px, 16px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        {/* Logo */}
        <button
          onClick={onIrInicio}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
        >
          <img src="/Antojapp icon.png" alt="Antojapp" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>
            Antoj<span style={{ color: "#E8460A" }}>app</span>
          </span>
        </button>

        {/* Links */}
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {link("Inicio",    onIrInicio)}
          {link("Negocios",  onIrNegocios)}
          {link("Guardados", () => onVerFavoritos(true))}
        </nav>

        {/* Copyright */}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", margin: 0 }}>
          © {año} Antojapp
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "none", border: "none",
        color: hover ? "#E8460A" : "rgba(255,255,255,.45)",
        fontSize: 13, cursor: "pointer",
        padding: "4px 10px", borderRadius: 6,
        transition: "color 0.15s",
      }}
    >
      {children}
    </button>
  );
}