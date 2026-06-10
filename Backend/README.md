# Antojapp — Backend

API REST con Node.js + Express + PostgreSQL.

## Estructura

```
backend/
├── index.js                  # Entrada del servidor
├── .env.example              # Variables de entorno (copiar a .env)
├── db/
│   ├── pool.js               # Conexión a PostgreSQL
│   └── schema.sql            # Tablas + datos iniciales
├── middleware/
│   └── auth.js               # Verificación de JWT
├── routes/
│   ├── auth.js
│   ├── negocios.js
│   └── favoritos.js
└── controllers/
    ├── authController.js
    ├── negociosController.js
    ├── resenasController.js
    └── favoritosController.js
```

## Instalación

```bash
cd backend
npm install
```

## Configuración

```bash
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL
```

## Base de datos

```bash
# Crear la base de datos
createdb antojapp

# Crear tablas e insertar datos iniciales
psql -d antojapp -f db/schema.sql
```

## Correr el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor corre en `http://localhost:3000`

---

## Endpoints

### Auth
| Método | Ruta              | Auth | Descripción              |
|--------|-------------------|------|--------------------------|
| POST   | /api/auth/registro| No   | Crear cuenta             |
| POST   | /api/auth/login   | No   | Iniciar sesión           |
| GET    | /api/auth/me      | Sí   | Datos del usuario actual |

### Negocios
| Método | Ruta                         | Auth | Descripción                        |
|--------|------------------------------|------|------------------------------------|
| GET    | /api/negocios                | No   | Listar negocios (con filtros)      |
| GET    | /api/negocios/:id            | No   | Detalle de un negocio              |
| GET    | /api/negocios/categorias     | No   | Lista de categorías                |
| GET    | /api/negocios/:id/resenas    | No   | Reseñas de un negocio              |
| POST   | /api/negocios/:id/resenas    | Sí   | Publicar reseña                    |

#### Filtros disponibles en GET /api/negocios
```
?busqueda=carne
?categoria=Fritanga
?soloAbiertos=true
```

### Favoritos (requieren token)
| Método | Ruta                      | Descripción                       |
|--------|---------------------------|-----------------------------------|
| GET    | /api/favoritos            | Negocios guardados del usuario    |
| GET    | /api/favoritos/ids        | Solo los IDs guardados            |
| POST   | /api/favoritos/:negocioId | Guardar negocio                   |
| DELETE | /api/favoritos/:negocioId | Quitar de guardados               |

---

## Autenticación

Las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

El token se obtiene al hacer login o registro.
