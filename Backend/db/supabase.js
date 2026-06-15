require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ── Cliente con Service Role Key ────────────────────────────────
// SEGURIDAD: SUPABASE_SERVICE_KEY bypassa Row Level Security y tiene
// acceso a TODOS los buckets/recursos del proyecto Supabase, no solo
// a los que usa esta app. Para limitar el "blast radius" si el código
// (o esta variable) se filtrara o un endpoint quedara mal protegido,
// NO se exporta el cliente crudo: se exporta un wrapper que solo
// permite operar sobre los buckets explícitamente whitelisteados.
//
// Si necesitas un bucket nuevo, agrégalo aquí deliberadamente —
// esto fuerza una revisión consciente en lugar de un acceso implícito.
const BUCKETS_PERMITIDOS = ["negocios", "platos", "usuarios"];

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const storage = {
  from(bucket) {
    if (!BUCKETS_PERMITIDOS.includes(bucket)) {
      throw new Error(
        `[supabase] Bucket "${bucket}" no está en BUCKETS_PERMITIDOS. ` +
        `Si es intencional, agrégalo a db/supabase.js tras revisarlo.`
      );
    }
    return supabaseClient.storage.from(bucket);
  },
};

module.exports = { storage };