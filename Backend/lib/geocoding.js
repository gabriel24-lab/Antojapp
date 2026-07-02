// ── Geocodificación automática de direcciones ──────────────────
//
// Usa Nominatim (OpenStreetMap): es gratis, no requiere tarjeta de crédito
// ni registro de cuenta. Su única exigencia es enviar un header User-Agent
// que identifique la app, y respetar un límite de ~1 solicitud por segundo.
// Docs: https://nominatim.org/release-docs/latest/api/Search/
//
// Si la dirección no se puede encontrar (o el servicio falla), esta función
// devuelve null silenciosamente: el negocio se guarda igual, sin lat/lng ni
// maps_url, y el propietario podrá agregar el link de Google Maps a mano
// más adelante. Nunca debe bloquear la creación/edición de una sede.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Identificador exigido por la política de uso de Nominatim.
// Recomendado: incluir un contacto real (correo o URL del proyecto).
const USER_AGENT = `Antojapp/1.0 (${process.env.NOMINATIM_CONTACT || "contacto@antojapp.com"})`;

// ── Limitador simple: máx. ~1 solicitud/seg a Nominatim (política de uso) ──
let ultimaLlamada = 0;
async function esperarTurno() {
  const ahora = Date.now();
  const espera = Math.max(0, 1100 - (ahora - ultimaLlamada));
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaLlamada = Date.now();
}

/**
 * Intenta convertir una dirección en coordenadas y una URL de Google Maps.
 *
 * @param {Object} datos
 * @param {string} [datos.direccion]   - Calle/dirección de la sede
 * @param {string} [datos.ciudad]
 * @param {string} [datos.departamento] - Departamento/estado/provincia
 * @param {string} [datos.paisIso2]     - Código ISO2 del país (ej: "CO")
 * @param {string} [datos.paisNombre]   - Nombre del país (ej: "Colombia")
 * @returns {Promise<{lat: number, lng: number, maps_url: string} | null>}
 */
async function geocodificarDireccion({
  direccion,
  ciudad,
  departamento,
  paisIso2,
  paisNombre,
} = {}) {
  // Sin al menos dirección + ciudad no vale la pena intentar: la búsqueda
  // sería demasiado ambigua y devolvería resultados poco confiables.
  if (!direccion?.trim() || !ciudad?.trim()) return null;

  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
  });
  params.set("street", direccion.trim());
  params.set("city", ciudad.trim());
  if (departamento?.trim()) params.set("state", departamento.trim());
  if (paisNombre?.trim()) params.set("country", paisNombre.trim());
  if (paisIso2?.trim()) params.set("countrycodes", paisIso2.trim().toLowerCase());

  try {
    await esperarTurno();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "es",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return {
      lat,
      lng,
      // No requiere API key: este formato de URL abre Google Maps
      // directamente sobre las coordenadas encontradas.
      maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    };
  } catch (err) {
    // Fallo de red, timeout, JSON inválido, etc. → no interrumpe el guardado.
    return null;
  }
}

module.exports = { geocodificarDireccion };
