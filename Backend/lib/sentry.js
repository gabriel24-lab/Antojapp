const Sentry = require("@sentry/node");

/**
 * Inicializa Sentry para monitoreo de errores en producción.
 *
 * IMPORTANTE: Sentry solo captura si SENTRY_DSN está definido en .env.
 */
function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn(
      "[Sentry] SENTRY_DSN no definido. El monitoreo de errores está desactivado.",
    );
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request?.data) {
        const sanitized = { ...event.request.data };
        const camposSensibles = [
          "password",
          "passwordActual",
          "passwordNueva",
          "credential",
          "token",
        ];
        camposSensibles.forEach((campo) => {
          if (sanitized[campo]) sanitized[campo] = "[REDACTED]";
        });
        event.request.data = sanitized;
      }
      return event;
    },
  });

  console.log(
    `[Sentry] Monitoreo de errores activo (env: ${process.env.NODE_ENV || "development"})`,
  );
}

/**
 * Configura el manejador de errores global de Sentry en la app de Express.
 */
function setupSentryErrorHandler(app) {
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
}

function captureError(err, contexto = "", extras = {}) {
  console.error(contexto, err.message);

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag("contexto", contexto);
      scope.setExtras(extras);
      Sentry.captureException(err);
    });
  }
}

module.exports = { initSentry, setupSentryErrorHandler, captureError };
