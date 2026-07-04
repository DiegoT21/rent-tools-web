# Conexión a Railway

Guía rápida para que el equipo trabaje contra el backend y la base de datos en producción (Railway) después de clonar el proyecto.

## Arquitectura

```
App Web / APK  ──HTTP──►  Backend (Railway)  ──►  MongoDB (Railway)
```

La **web y la APK no se conectan directo a MongoDB**. Solo necesitan la URL pública del backend. La base de datos es interna al backend (`mongodb.railway.internal`).

| Servicio | URL |
|----------|-----|
| Backend API | `https://rent-tools-back-production.up.railway.app/api` |
| Health check | `https://rent-tools-back-production.up.railway.app/api/health` |

---

## App Web (`rent-tools-web`)

### 1. Clonar e instalar

```bash
git clone https://github.com/DiegoT21/rent-tools-web.git
cd rent-tools-web
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

En `.env`, usa Railway:

```env
VITE_API_URL=https://rent-tools-back-production.up.railway.app/api
```

Para backend **local** (con Docker o `npm run dev` en `rent-tools-back`):

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Levantar la web

```bash
npm run dev
```

Abre `http://localhost:5173`.

### Importante: no usar `fetch('/api/...')`

El proxy de Vite (`vite.config.js`) redirige `/api` a `localhost:3000`. Si el backend local no está corriendo, verás **502 Bad Gateway** en login.

Usa siempre el cliente configurado:

- `authService.login()` / `authService.register()`
- `api` de `src/lib/api.ts` (axios con `VITE_API_URL`)

---

## APK móvil (`rent-tools-mobile`)

En `lib/core/config/environment.dart`:

```dart
static const String apiBaseUrl =
    'https://rent-tools-back-production.up.railway.app/api';
```

---

## Backend (`rent-tools-back`)

En Railway el backend ya tiene `MONGO_URI` apuntando a MongoDB interno. No hace falta exponer la BD.

Si alguien clona el backend para desarrollo local, copie `.env.example` a `.env` y use Mongo local o Docker Compose.

Variables críticas en Railway:

| Variable | Uso |
|----------|-----|
| `MONGO_URI` | Conexión a MongoDB (interna en Railway) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Tokens de sesión |
| `CORS_ORIGIN` | Origen permitido del frontend (p. ej. `http://localhost:5173`) |
| `AWS_*` / `S3_*` | Subida de imágenes |

---

## Verificar que todo funciona

```bash
# Backend vivo
curl https://rent-tools-back-production.up.railway.app/api/health

# Catálogo (público)
curl https://rent-tools-back-production.up.railway.app/api/tools
```

En la web: login en `/login` con una cuenta existente. Si falla, revisa en DevTools que las peticiones vayan a `rent-tools-back-production.up.railway.app`, no a `localhost:3000`.

---

## CORS

El backend acepta peticiones desde `http://localhost:5173` para desarrollo local. Si despliegan la web en otro dominio (p. ej. Railway o Vercel), actualicen `CORS_ORIGIN` en las variables del servicio backend en Railway.
