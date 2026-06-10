# Antojapp — Backend

API REST con Node.js + Express + PostgreSQL (Supabase).

## Estructura

```
backend/
├── index.js                        # Entrada del servidor
├── .env.example                    # Variables de entorno (copiar a .env)
├── db/
│   ├── pool.js                     # Conexión a PostgreSQL
│   └── schema.sql                  # Tablas + datos iniciales
├── middleware/
│   └── auth.js                     # Verificación de JWT
├── routes/
│   ├── auth.js
│   ├── negocios.js
│   └── favoritos.js
└── controllers/
    ├── authController.js
    ├── googleAuthController.js     # ← Google OAuth (nuevo)
    ├── negociosController.js
    ├── resenasController.js
    └── favoritosController.js
```

## Instalación

```bash
cd Backend
npm install
```

## Configuración

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

---

## Supabase (base de datos)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings → Database**
3. Copia las credenciales de **Connection Pooling** (recomendado):
   - Host: `aws-0-<region>.pooler.supabase.com`
   - Puerto: `6543`
   - User: `postgres.<tu-project-ref>`
   - Password: el que elegiste al crear el proyecto
4. En el `.env` del backend llena `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
5. Ejecuta el schema desde el **SQL Editor** de Supabase:
   - Copia el contenido de `db/schema.sql` y pégalo en el editor → Run

> **Tip:** La opción "Direct connection" (puerto 5432) también funciona, pero Connection Pooling es más estable en entornos serverless.

---

## Google OAuth

### 1. Crear credenciales en Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
2. Crea un proyecto (o usa uno existente)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Tipo de aplicación: **Web application**
5. Authorized JavaScript origins:
   - `http://localhost:5173` (desarrollo frontend)
6. Authorized redirect URIs: no necesitas agregar nada (el flujo GIS usa popup, no redirect)
7. Copia el **Client ID** y el **Client Secret**

### 2. Configurar variables de entorno

Backend (`.env`):
```
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret   # solo lo necesita el backend
```

Frontend (`.env`):
```
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

> El `GOOGLE_CLIENT_SECRET` **nunca** va en el frontend.

### Flujo técnico

```
Usuario hace clic en "Continuar con Google"
  → Google Identity Services abre un popup
  → Google retorna un id_token (credential) al frontend
  → El frontend hace POST /api/auth/google con ese credential
  → El backend verifica el token con google-auth-library
  → Crea o actualiza el usuario en la BD
  → Retorna nuestro JWT propio
  → El frontend lo guarda igual que con email/password
```

---

## Base de datos

```bash
# (Opción local para desarrollo)
createdb antojapp
psql -d antojapp -f db/schema.sql
```

## Correr el servidor

```bash
npm run dev   # Desarrollo con auto-reload
npm start     # Producción
```

El servidor corre en `http://localhost:3000`

---

## Endpoints

### Auth
| Método | Ruta                  | Auth | Descripción                          |
|--------|-----------------------|------|--------------------------------------|
| POST   | /api/auth/registro    | No   | Crear cuenta con email/password      |
| POST   | /api/auth/login       | No   | Iniciar sesión con email/password    |
| POST   | /api/auth/google      | No   | Iniciar sesión con Google (id_token) |
| GET    | /api/auth/me          | Sí   | Datos del usuario actual             |

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

El token se obtiene al hacer login, registro, o login con Google.
