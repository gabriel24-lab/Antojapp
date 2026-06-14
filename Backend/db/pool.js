const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  family:   4, // forzar IPv4, evita el error ENETUNREACH con IPv6 en Render
});

pool.connect()
  .then(client => {
    console.log("Conectado a PostgreSQL (Supabase)");
    client.release();
  })
  .catch(err => console.error("Error conectando a la BD:", err.message));

module.exports = pool;
