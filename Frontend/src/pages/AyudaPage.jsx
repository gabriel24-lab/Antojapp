import { useState, useEffect } from "react";
import AppIcon from "../components/AppIcon";

export default function AyudaPage({ onIrInicio }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [preguntaActiva, setPreguntaActiva] = useState(null);

  const faqs = [
    {
      q: "¿Cómo puedo guardar mis lugares favoritos?",
      a: "Para guardar un negocio, debes iniciar sesión o crear una cuenta. Una vez dentro, simplemente toca el ícono de corazón que aparece en cualquier tarjeta de negocio o en la página de detalles de un lugar."
    },
    {
      q: "Soy propietario, ¿cómo registro mi negocio?",
      a: "Regístrate en Antojapp eligiendo el rol de 'Propietario'. Una vez en tu panel de control, verás el botón 'Agregar negocio', donde podrás completar la información y publicarlo en la plataforma."
    },
    {
      q: "¿Antojapp es gratis?",
      a: "Sí, buscar, guardar y explorar lugares en Antojapp es completamente gratis para los clientes. Los propietarios también pueden publicar sus negocios sin costo, aunque existen límites en la cantidad de negocios gratuitos que se pueden agregar."
    },
    {
      q: "¿Cómo edito la información de mi perfil?",
      a: "Puedes acceder a tu perfil seleccionando tu inicial o foto en la parte superior derecha y haciendo clic en 'Mi perfil'. Desde allí verás la información de tu cuenta (la función de edición detallada estará disponible próximamente)."
    },
    {
      q: "Olvidé mi contraseña, ¿qué hago?",
      a: "En la pantalla de iniciar sesión, selecciona la opción '¿Olvidaste tu contraseña?' e ingresa tu correo electrónico. Te enviaremos instrucciones para recuperarla de forma segura."
    }
  ];

  const togglePregunta = (index) => {
    setPreguntaActiva(preguntaActiva === index ? null : index);
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px var(--content-px, 16px) 100px" }}>
      {/* Botón para volver */}
      <button 
        onClick={onIrInicio}
        style={{ 
          display: "inline-flex", alignItems: "center", gap: 6, 
          background: "none", border: "none", color: "var(--text-3)", 
          fontSize: 14, cursor: "pointer", marginBottom: 30, padding: 0
        }}
      >
        <AppIcon name="arrowLeft" size={16} /> Volver al inicio
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: "50%", 
          background: "rgba(255,255,255,0.05)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          margin: "0 auto 20px", color: "var(--brand)"
        }}>
          <AppIcon name="message" size={32} />
        </div>
        <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, color: "var(--brand)", marginBottom: 12 }}>
          Centro de Ayuda
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-2)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Encuentra respuestas a las preguntas más frecuentes de nuestra comunidad.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {faqs.map((faq, index) => {
          const isOpen = preguntaActiva === index;
          return (
            <div 
              key={index}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                transition: "all 0.3s ease"
              }}
            >
              <button
                onClick={() => togglePregunta(index)}
                style={{
                  width: "100%", textAlign: "left", background: "none", border: "none",
                  padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", color: "var(--text-1)"
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
                  {faq.q}
                </span>
                <span style={{ 
                  color: "var(--text-3)", 
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  display: "flex", alignItems: "center"
                }}>
                  <AppIcon name="chevronDown" size={20} />
                </span>
              </button>
              
              <div style={{
                maxHeight: isOpen ? 500 : 0,
                opacity: isOpen ? 1 : 0,
                transition: "all 0.3s ease",
                padding: isOpen ? "0 24px 24px" : "0 24px 0",
                color: "var(--text-2)",
                fontSize: 15,
                lineHeight: 1.6
              }}>
                <div style={{ paddingTop: 8, borderTop: isOpen ? "1px solid var(--border)" : "none" }}>
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contacto extra */}
      <div style={{ 
        marginTop: 60, textAlign: "center", padding: "32px", 
        background: "rgba(232, 70, 10, 0.05)", borderRadius: 16, border: "1px solid rgba(232, 70, 10, 0.1)" 
      }}>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--brand)", marginBottom: 8 }}>
          ¿Aún necesitas ayuda?
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
          Nuestro equipo de soporte está listo para asistirte.
        </p>
        <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <AppIcon name="mail" size={16} /> Contáctanos
        </button>
      </div>
    </main>
  );
}
