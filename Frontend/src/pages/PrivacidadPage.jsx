import { useEffect } from "react";
import AppIcon from "../components/AppIcon";

export default function PrivacidadPage({ onIrInicio }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px var(--content-px, 16px) 100px",
      }}
    >
      <button
        onClick={onIrInicio}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-3)",
          fontSize: 14,
          cursor: "pointer",
          marginBottom: 30,
          padding: 0,
        }}
      >
        <AppIcon name="arrowLeft" size={16} /> Volver al inicio
      </button>

      <div style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            color: "var(--brand)",
            marginBottom: 12,
          }}
        >
          Políticas de Privacidad
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AppIcon name="clock" size={14} /> Última actualización: Octubre 2023
        </p>
      </div>

      <div
        style={{
          color: "var(--text-2)",
          fontSize: 15,
          lineHeight: 1.7,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <section>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand)",
              marginBottom: 12,
            }}
          >
            1. Información que recopilamos
          </h2>
          <p>
            Recopilamos información que nos proporcionas directamente, como tu
            nombre, dirección de correo electrónico y foto de perfil al crear
            una cuenta. También recopilamos datos sobre tus interacciones en la
            plataforma, como los negocios que guardas como favoritos.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand)",
              marginBottom: 12,
            }}
          >
            2. Cómo utilizamos tu información
          </h2>
          <p>
            Utilizamos la información recopilada para proporcionar, mantener y
            mejorar nuestros servicios. Esto incluye personalizar tu
            experiencia, enviarte notificaciones importantes sobre tu cuenta y
            responder a tus solicitudes de soporte.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand)",
              marginBottom: 12,
            }}
          >
            3. Compartir tu información
          </h2>
          <p>
            No vendemos ni alquilamos tu información personal a terceros.
            Podemos compartir información genérica y agregada que no te
            identifique personalmente con nuestros socios comerciales.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand)",
              marginBottom: 12,
            }}
          >
            4. Seguridad de los datos
          </h2>
          <p>
            Implementamos medidas de seguridad estándar de la industria para
            proteger tu información personal contra el acceso no autorizado, la
            alteración, la divulgación o la destrucción. Utilizamos cookies
            seguras (HttpOnly) para manejar tu sesión.
          </p>
        </section>
      </div>
    </main>
  );
}
