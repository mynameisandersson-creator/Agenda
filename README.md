# Agenda Profesional

Aplicación full stack para organizar la semana, crear eventos actuales y futuros, clasificar actividades con etiquetas y visualizar reportes profesionales similares a una agenda tipo Google Calendar.

## Tecnologías

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS y archivos `app/page.tsx`.
- **Backend:** Node.js con Express, Helmet, CORS y validación con Zod.
- **Base de datos:** PostgreSQL con Prisma ORM, listo para Railway Postgres.
- **Reportes:** Gráficos de pastel, barras y línea con Visx, más tabla ejecutiva.
- **Deploy:** Un solo servicio Railway que sirve API Express y frontend Next.js en el mismo dominio.

## Funcionalidades

- Vista mensual limpia, organizada y responsive desde el inicio hasta el fin de mes.
- Fecha actual visible y reloj en vivo con hora, minutos y segundos.
- Creación, modificación y eliminación de tareas con título, descripción, inicio, fin, categoría, prioridad, estado, ubicación, imagen y etiquetas.
- Modal de detalles al presionar una cuadrícula del calendario o una tarea existente; se puede cerrar sin guardar.
- Etiquetas recomendadas y opción para crear etiquetas personalizadas con color.
- Corrección automática básica de escritura en español para campos de texto comunes.
- API REST para eventos, etiquetas, salud del servicio y reportes.
- Endpoint `/api/health` que verifica también la conexión real con la base de datos.
- Reportes visuales:
  - Diagrama de pastel por categoría.
  - Barras de horas por prioridad.
  - Línea de eventos para los próximos 7 días.
  - Tabla ejecutiva con todos los eventos.

## Instalación local conectada a base de datos

### Opción A: PostgreSQL local

1. Crea una base de datos PostgreSQL llamada `agenda_profesional`.
2. Copia las variables de entorno:

```bash
npm install
cp .env.example .env
```

3. Ajusta `DATABASE_URL` en `.env` si tu usuario o contraseña son diferentes:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agenda_profesional?schema=public"
NEXT_PUBLIC_API_URL="/api"
API_PROXY_URL="http://localhost:4000"
PORT=4000
```

4. Ejecuta migraciones, datos iniciales y la app:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

- Web local: http://localhost:3000
- API local: http://localhost:4000/api/health
- La web usa `/api`; `next.config.mjs` redirige esas llamadas al backend Express local en `http://localhost:4000`.

### Opción B: Local conectado a Railway Postgres

1. Instala Railway CLI e inicia sesión:

```bash
npm install -g @railway/cli
railway login
```

2. En Railway, crea un proyecto y añade un servicio **PostgreSQL**.
3. Para trabajar desde tu computadora, copia la cadena pública de conexión de PostgreSQL, normalmente `DATABASE_PUBLIC_URL`, y úsala como `DATABASE_URL` en tu `.env`. La variable privada `DATABASE_URL` de Railway suele estar pensada para servicios dentro de Railway.
4. En tu `.env`, pega la URL pública de Railway:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@TU_HOST_PUBLICO.railway.app:TU_PUERTO/railway"
NEXT_PUBLIC_API_URL="/api"
API_PROXY_URL="http://localhost:4000"
PORT=4000
```

5. Ejecuta:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Despliegue en Railway

Esta versión incluye `railway.json`, `nixpacks.toml` y `Procfile` para desplegar en Railway.

### Pasos desde GitHub

1. Sube el proyecto a GitHub.
2. En Railway, crea un nuevo proyecto desde el repositorio de GitHub.
3. Añade un plugin/servicio **PostgreSQL** al mismo proyecto.
4. En el servicio web, configura estas variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

5. Railway ejecutará automáticamente:

```bash
npm install
npm run railway:build
npm run railway:start
```

`railway:build` genera Prisma Client, aplica migraciones con `prisma migrate deploy`, compila Next.js y compila el servidor Express. `railway:start` arranca `dist/server/index.js`, que en producción sirve la API y el frontend desde el mismo proceso.

### Verificar deploy

- Abre `https://TU-SERVICIO.up.railway.app/api/health` y confirma:

```json
{
  "ok": true,
  "service": "agenda-api",
  "database": "connected"
}
```

- Luego abre `https://TU-SERVICIO.up.railway.app` para usar la agenda.
- Si quieres cargar eventos de ejemplo en Railway, ejecuta desde Railway CLI:

```bash
railway run npm run db:seed
```

## Uso de la agenda

- Presiona cualquier cuadrícula del calendario mensual para abrir el modal y crear una nueva tarea en esa fecha.
- Presiona una tarea existente en el calendario, la tabla o la lista de próximas tareas para abrir sus detalles.
- Dentro del modal puedes modificar datos, eliminar la tarea, cerrar sin cambios, subir una imagen o pegar una URL de imagen.
- Puedes seleccionar etiquetas existentes, usar recomendaciones o crear una etiqueta propia con un color personalizado.
- Los campos de texto corrigen automáticamente espacios, mayúscula inicial y palabras frecuentes como `manana` → `mañana` o `reunion` → `reunión`.

## Scripts útiles

```bash
npm run dev            # Ejecuta Next.js y Express en paralelo
npm run build          # Genera Prisma Client, compila Next.js y compila Express
npm run start          # Sirve producción con Express + Next en un solo proceso
npm run start:web      # Sirve solo el frontend construido
npm run start:api      # Sirve solo la API compilada
npm run db:push        # Sincroniza esquema sin migraciones, útil en prototipos
npm run db:migrate     # Aplica migraciones Prisma en producción/CI
npm run db:seed        # Carga datos iniciales profesionales
npm run db:studio      # Abre Prisma Studio
npm run lint           # Revisa estilo del proyecto
npm run railway:build  # Build recomendado para Railway
npm run railway:start  # Start recomendado para Railway
```

## Estructura

```text
app/                 # Aplicación Next.js con page.tsx y estilos globales
components/          # Componentes reutilizables, incluyendo gráficos
lib/                 # Cliente API y tipos compartidos del frontend
server/              # API REST Node + Express y servidor producción Next
prisma/              # Esquema PostgreSQL, migraciones y seed
.github/workflows/   # CI con PostgreSQL de prueba
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta según tu entorno:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agenda_profesional?schema=public"
NEXT_PUBLIC_API_URL="/api"
PORT=4000
CORS_ORIGIN=""
API_PROXY_URL="http://localhost:4000"
```
