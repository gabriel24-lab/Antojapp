import { useState, useEffect, useRef } from "react";
import AppIcon from "./AppIcon";

export default function Footer({
  onIrInicio,
  onIrNegocios,
  onVerFavoritos,
  onIrAyuda,
  onIrTerminos,
  onIrPrivacidad,
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  /* ── aparece con fade+slide al entrar en viewport ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const año = new Date().getFullYear();

  const link = (label, accion) => (
    <FooterLink key={label} onClick={accion}>
      {label}
    </FooterLink>
  );

  return (
    <footer
      ref={ref}
      style={{
        background: "var(--text-1)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "70px var(--content-px, 16px) 24px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition:
          "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Top Section: Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 60,
          }}
        >
          {/* Col 1: Brand */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <button
              onClick={onIrInicio}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <img
                src="/icon-56.png"
                alt="Antojapp"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
              <span
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "var(--surface)",
                  letterSpacing: "-0.5px",
                }}
              >
                Antoj<span style={{ color: "var(--brand)" }}>app</span>
              </span>
            </button>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 280,
              }}
            >
              Descubre, guarda y comparte los mejores lugares para comer a tu
              alrededor. Tu próximo antojo está aquí.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <SocialIcon icon="globe" />
              <SocialIcon icon="message" />
              <SocialIcon icon="mail" />
            </div>
          </div>

          {/* Col 2: Explorar */}
          <div>
            <h4
              style={{
                color: "var(--surface)",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Explorar
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {link("Inicio", onIrInicio)}
              {link("Ver Negocios", onIrNegocios)}
              {link("Mis Guardados", () => onVerFavoritos(true))}
            </div>
          </div>

          {/* Col 3: Legal & Ayuda */}
          <div>
            <h4
              style={{
                color: "var(--surface)",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Soporte
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {link("Centro de Ayuda", onIrAyuda)}
              {link("Términos de Servicio", onIrTerminos)}
              {link("Políticas de Privacidad", onIrPrivacidad)}
            </div>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4
              style={{
                color: "var(--surface)",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Novedades
            </h4>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              Recibe las mejores recomendaciones de comida cada semana en tu
              correo.
            </p>
            <div style={{ display: "flex", gap: 8, maxWidth: 300 }}>
              <input
                type="email"
                placeholder="tu@correo.com"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "var(--surface)",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
              <button
                style={{
                  background: "var(--brand)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--surface)",
                  fontWeight: 600,
                  padding: "0 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              >
                <AppIcon name="arrowRight" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", margin: 0 }}>
            © {año} Antojapp. Todos los derechos reservados.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "rgba(255,255,255,.4)",
            }}
          >
            Hecho con{" "}
            <AppIcon
              name="heart"
              size={14}
              color="var(--brand)"
              fill="currentColor"
            />{" "}
            para los amantes de la comida
          </div>
        </div>
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
        background: "none",
        border: "none",
        color: hover ? "var(--brand)" : "rgba(255,255,255,.6)",
        fontSize: 14,
        cursor: "pointer",
        padding: 0,
        transition: "color 0.2s ease, transform 0.2s ease",
        transform: hover ? "translateX(4px)" : "translateX(0)",
        display: "inline-block",
      }}
    >
      {children}
    </button>
  );
}

function SocialIcon({ icon }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: hover ? "var(--brand)" : "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--surface)",
        transition: "background 0.2s ease, transform 0.2s ease",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      <AppIcon name={icon} size={16} />
    </a>
  );
}
