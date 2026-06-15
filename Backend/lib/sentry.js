const Sentry = require("@sentry/node");

/**
 * Inicializa Sentry para monitoreo de errores en producción.
 *
 * IMPORTANTE: Sentry solo captura si SENTRY_DSN está definido en .env.
 * Si no lo está (ej. en desarrollo local), simplemente no hace nada.
 * Así nunca rompe el servidor por falta de configuración.
 */
function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn("[Sentry] SENTRY_DSN no definido. El monitoreo de errores está desactivado.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",

    // Capturar el 100% de los errores (trazas de rendimiento son opcionales)
    tracesSampleRate: 0,

    // Nunca enviar datos PII (emails, passwords, etc.) a Sentry
    beforeSend(event) {
      // Eliminar datos sensibles del request body antes de enviar
      if (event.request?.data) {
        const sanitized = { ...event.request.data };
        const camposSensibles = ["password", "passwordActual", "passwordNueva", "credential", "token"];
        camposSensibles.forEach(campo => {
          if (sanitized[campo]) sanitized[campo] = "[REDACTED]";
        });
        event.request.data = sanitized;
      }
      return event;
    },
  });

  // Sentry DEBE ir como primer middleware para capturar todo el contexto del request
  app.use(Sentry.requestHandler());

  console.log(`[Sentry] Monitoreo de errores activo (env: ${process.env.NODE_ENV || "development"})`);
}

/**
 * Middleware de Sentry para capturar errores.
 * Debe usarse ANTES del error handler global de Express.
 */
function sentryErrorHandler() {
  return Sentry.errorHandler();
}

/**
 * Captura un error manualmente (para uso en catch blocks).
 * Si Sentry no está inicializado, solo loggea en consola.
 *
 * @param {Error} err - El error a capturar
 * @param {string} contexto - Nombre del lugar donde ocurrió (ej. "[login]")
 * @param {object} [extras] - Datos extra opcionales (NO incluir passwords)
 */
function captureError(err, contexto = "", extras = {}) {
  console.error(contexto, err.message);

  if (process.env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      scope.setTag("contexto", contexto);
      scope.setExtras(extras);
      Sentry.captureException(err);
    });
  }
}

module.exports = { initSentry, sentryErrorHandler, captureError };
