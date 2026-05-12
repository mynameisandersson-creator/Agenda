# Agenda Profesional

Aplicación full stack para organizar la semana, crear eventos actuales y futuros, clasificar actividades con etiquetas y visualizar reportes profesionales similares a una agenda tipo Google Calendar.

## Tecnologías

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS y archivos `app/page.tsx`.
- **Backend:** Node.js con Express, Helmet, CORS y validación con Zod.
- **Base de datos:** SQLite en desarrollo con Prisma ORM.
- **Reportes:** Gráficos de pastel, barras y línea con Visx, más tabla ejecutiva.

## Funcionalidades

- Vista semanal limpia, organizada y responsive.
- Fecha actual visible y soporte para eventos futuros.
- Creación de eventos con título, descripción, inicio, fin, categoría, prioridad, estado, ubicación y etiquetas.
- Etiquetas con colores para clasificar compromisos.
- API REST para eventos, etiquetas, salud del servicio y reportes.
- Reportes visuales:
  - Diagrama de pastel por categoría.
  - Barras de horas por prioridad.
  - Línea de eventos para los próximos 7 días.
  - Tabla ejecutiva con todos los eventos.

## Instalación local

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

- Web: http://localhost:3000
- API Express: http://localhost:4000/api/health

## Scripts útiles

```bash
npm run dev        # Ejecuta Next.js y Express en paralelo
npm run build      # Genera Prisma Client, compila Next.js y compila Express
npm run start:web  # Sirve el frontend construido
npm run start:api  # Sirve la API compilada
npm run db:push    # Sincroniza el esquema Prisma con SQLite
npm run db:seed    # Carga datos iniciales profesionales
npm run lint       # Revisa estilo del proyecto
```

## Estructura

```text
app/                 # Aplicación Next.js con page.tsx y estilos globales
components/          # Componentes reutilizables, incluyendo gráficos
lib/                 # Cliente API y tipos compartidos del frontend
server/              # API REST Node + Express
prisma/              # Esquema de base de datos y seed
```

## Despliegue en GitHub

1. Crea un repositorio nuevo en GitHub.
2. Sube el código:

```bash
git init
git add .
git commit -m "Initial agenda profesional"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/agenda-profesional.git
git push -u origin main
```

3. Para producción, usa una base de datos persistente. SQLite es ideal para desarrollo; para un despliegue real se recomienda PostgreSQL y cambiar `DATABASE_URL`.
4. Despliega el frontend en Vercel y la API Express en Render, Railway o Fly.io, configurando `NEXT_PUBLIC_API_URL` con la URL pública de la API.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta según tu entorno:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
PORT=4000
```
