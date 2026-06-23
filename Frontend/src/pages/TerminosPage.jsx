import { useEffect } from "react";
import AppIcon from "../components/AppIcon";

export default function TerminosPage({ onIrInicio }) {
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
          Términos de Servicio
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
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar Antojapp, aceptas estar sujeto a estos
            Términos de Servicio. Si no estás de acuerdo con alguna parte de
            estos términos, no podrás utilizar nuestros servicios.
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
            2. Uso de la plataforma
          </h2>
          <p>
            Antojapp proporciona una plataforma para descubrir, guardar y
            compartir información sobre negocios de comida. Te comprometes a
            utilizar la plataforma de manera legal y respetuosa. No debes
            utilizar nuestro servicio para publicar contenido ofensivo, falso o
            que infrinja derechos de terceros.
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
            3. Cuentas de usuario y Propietarios
          </h2>
          <p>
            Para acceder a ciertas funciones, debes crear una cuenta. Eres
            responsable de mantener la confidencialidad de tu contraseña. Los
            propietarios de negocios son responsables de la veracidad de la
            información publicada sobre sus establecimientos.
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
            4. Modificaciones del servicio
          </h2>
          <p>
            Nos reservamos el derecho de modificar o discontinuar, temporal o
            permanentemente, el servicio con o sin previo aviso. No seremos
            responsables ante ti ni ante terceros por ninguna modificación,
            suspensión o interrupción del servicio.
          </p>
        </section>
      </div>
    </main>
  );
}
