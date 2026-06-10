const { createClient } = require("@supabase/supabase-js");

// Usa la Service Role Key (nunca la anon key) en el backend
// para poder subir y eliminar archivos sin restricciones de RLS.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
