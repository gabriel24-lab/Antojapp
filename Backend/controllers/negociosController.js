const pool = require("../db/pool");

// GET /api/negocios
async function getNegocios(req, res) {
  const { busqueda, categoria, soloAbiertos } = req.query;

  try {
    let query = `
      SELECT
        n.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'nombre', s.nombre,
              'direccion', s.direccion,
              'telefono', s.telefono,
              'lat', s.lat,
              'lng', s.lng,
              'horario', s.horario
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS sedes
      FROM negocios n
      LEFT JOIN sedes s ON s.negocio_id = n.id
    `;

    const condiciones = [];
    const valores     = [];

    if (categoria && categoria !== "Todas") {
      valores.push(categoria);
      condiciones.push(`n.categoria = $${valores.length}`);
    }

    if (busqueda && busqueda.trim()) {
      valores.push(`%${busqueda.toLowerCase()}%`);
      const i = valores.length;
      condiciones.push(`(
        LOWER(n.nombre)       LIKE $${i} OR
        LOWER(n.descripcion)  LIKE $${i} OR
        LOWER(n.categoria)    LIKE $${i} OR
        LOWER(n.plato_estrella_nombre)  LIKE $${i} OR
        LOWER(n.plato_economico_nombre) LIKE $${i} OR
        LOWER(n.plato_premium_nombre)   LIKE $${i} OR
        EXISTS (
          SELECT 1 FROM unnest(n.etiquetas) tag
          WHERE LOWER(tag) LIKE $${i}
        )
      )`);
    }

    if (condiciones.length > 0)
      query += " WHERE " + condiciones.join(" AND ");

    query += " GROUP BY n.id ORDER BY n.calificacion DESC";

    const result = await pool.query(query, valores);
    let negocios = result.rows.map(formatearNegocio);

    // El filtro de "solo abiertos" se hace en JS porque depende de la hora actual
    if (soloAbiertos === "true") {
      negocios = negocios.filter(n => estaAbierto(n.sedes));
    }

    res.json(negocios);
  } catch (err) {
    console.error("Error en getNegocios:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/:id
async function getNegocioById(req, res) {
  const { id } = req.params;

  try {
    const negocio = await pool.query("SELECT * FROM negocios WHERE id = $1", [id]);
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    const sedes = await pool.query(
      "SELECT * FROM sedes WHERE negocio_id = $1 ORDER BY id",
      [id]
    );

    const resenas = await pool.query(
      "SELECT * FROM resenas WHERE negocio_id = $1 ORDER BY creado_en DESC",
      [id]
    );

    res.json(formatearNegocio({
      ...negocio.rows[0],
      sedes:   sedes.rows,
      resenas: resenas.rows,
    }));
  } catch (err) {
    console.error("Error en getNegocioById:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/categorias  — lista de categorías únicas
async function getCategorias(req, res) {
  try {
    const result = await pool.query(
      "SELECT DISTINCT categoria FROM negocios ORDER BY categoria"
    );
    res.json(result.rows.map(r => r.categoria));
  } catch (err) {
    console.error("Error en getCategorias:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ── Helpers ──────────────────────────────────────────────────

// Convierte los campos snake_case de la BD al formato que espera el frontend
function formatearNegocio(n) {
  return {
    ...n,
    totalResenas: n.total_resenas,
    abierto: estaAbierto(n.sedes || []),
    platoEstrella:  { nombre: n.plato_estrella_nombre,  precio: n.plato_estrella_precio  },
    platoEconomico: { nombre: n.plato_economico_nombre, precio: n.plato_economico_precio },
    platoPremium:   { nombre: n.plato_premium_nombre,   precio: n.plato_premium_precio   },
  };
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function estaAbierto(sedes) {
  if (!sedes || sedes.length === 0) return false;
  const ahora  = new Date();
  const diaNom = DIAS[ahora.getDay()];
  const actual = ahora.getHours() * 60 + ahora.getMinutes();

  return sedes.some(sede => {
    const horaDia = sede.horario?.[diaNom];
    if (!horaDia || horaDia === "cerrado") return false;
    const [apertura, cierre] = horaDia.split("-");
    const [ha, ma] = apertura.split(":").map(Number);
    const [hc, mc] = cierre.split(":").map(Number);
    return actual >= ha * 60 + ma && actual < hc * 60 + mc;
  });
}

module.exports = { getNegocios, getNegocioById, getCategorias };