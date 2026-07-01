require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const BUCKETS_PERMITIDOS = ["negocios", "platos", "usuarios", "fotosperfil"];

const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const storage = {
  from(bucket) {
    if (!BUCKETS_PERMITIDOS.includes(bucket)) {
      throw new Error(
        `[supabase] Bucket "${bucket}" no está en BUCKETS_PERMITIDOS. ` +
          `Si es intencional, agrégalo a db/supabase.js tras revisarlo.`,
      );
    }
    return supabaseClient.storage.from(bucket);
  },
};

module.exports = { storage };
