# Guía para entender y transcribir manualmente la Agenda Profesional

Esta guía explica cada parte importante del proyecto para que puedas copiarlo, reescribirlo o estudiarlo paso a paso.

## 1. Estructura general

```text
app/                  Interfaz Next.js con App Router.
components/           Componentes visuales reutilizables, por ejemplo gráficos.
lib/                  Tipos TypeScript y funciones para llamar a la API.
server/               Backend Express con rutas REST.
prisma/               Modelos de base de datos, migraciones y datos de ejemplo.
docs/                 Documentación del código.
```

La aplicación funciona con dos capas principales:

1. **Frontend**: `app/page.tsx` muestra calendario, modal, reportes, chatbot y formularios.
2. **Backend**: `server/index.ts` expone endpoints `/api/...` y usa Prisma para leer/escribir PostgreSQL.

## 2. Frontend principal: `app/page.tsx`

### 2.1 Importaciones

Al inicio se importan funciones de fechas (`date-fns`), tipos de React, componentes de gráficos y funciones de API.

- `format`, `startOfMonth`, `endOfMonth`, `isSameDay` ayudan a construir el calendario mensual.
- `useState` guarda datos que cambian: tareas, etiquetas, modal, reloj y chatbot.
- `createEvent`, `updateEvent`, `deleteEvent` llaman al backend.

### 2.2 Diccionarios visuales

Los objetos `categoryLabels`, `statusLabels` y `priorityLabels` traducen valores internos como `WORK` o `PLANNED` a texto en español.

`categoryStyles` asigna colores Tailwind a cada categoría.

### 2.3 Etiquetas recomendadas

`recommendedTags` contiene etiquetas sugeridas como `Urgente`, `Reunión`, `Proyecto`, `Casa`, `Salud` y `Estudio`.

En el modal el usuario puede presionar una recomendación para crearla/seleccionarla automáticamente.

### 2.4 Corrección básica en español

`spellingReplacements` es un diccionario simple de palabras frecuentes sin acento o mal escritas.

La función `correctSpanishText`:

1. Quita espacios repetidos.
2. Busca palabras conocidas.
3. Aplica reemplazos como `manana` → `mañana`.
4. Convierte la primera letra en mayúscula.

No reemplaza a un corrector profesional, pero ayuda con errores comunes mientras se escribe.

### 2.5 Estados principales

Dentro de `Page()` se guardan:

- `events`: tareas del calendario.
- `tags`: etiquetas disponibles.
- `reports`: datos para gráficos.
- `now`: fecha/hora actual para reloj en vivo.
- `selectedDate`: fecha abierta en el modal.
- `selectedEvent`: tarea seleccionada para editar.
- `knowledge`: módulos de conocimiento del chatbot.
- `chatMessages`: historial visual del chat.

### 2.6 Calendario mensual simplificado

El calendario se calcula con:

```ts
const monthStart = startOfMonth(now);
const monthEnd = endOfMonth(now);
const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
```

Luego se genera un arreglo `monthDays` con todos los días visibles.

Cada cuadrícula del calendario muestra solo:

- **Símbolo `−`** cuando no hay tareas.
- **Símbolo `+`** cuando sí hay tareas.
- Cantidad total de tareas del día.

Esto evita amontonar muchas tarjetas dentro del calendario y deja la vista limpia.

### 2.7 Modal de detalles

`EventModal` se abre cuando presionas una cuadrícula o una tarea existente.

Permite:

- Crear nueva tarea.
- Modificar tarea existente.
- Eliminar tarea.
- Cerrar sin guardar.
- Seleccionar etiquetas.
- Crear etiqueta propia.
- Agregar imagen por URL.
- Subir imagen desde archivo local y verla como vista previa.

Cuando se guarda, el modal llama a `onSave`, y `Page()` decide si debe usar `createEvent` o `updateEvent`.

### 2.8 Chatbot local

El chatbot se divide en dos partes:

1. **Chatbot local**: formulario para preguntar.
2. **Entrenar chatbot**: módulo para agregar conocimiento.

Cuando preguntas, el frontend llama a `sendChatMessage(message)`.

Cuando alimentas el bot, el frontend llama a `createChatKnowledge({ title, content })`.

## 3. Cliente API: `lib/api.ts`

`lib/api.ts` centraliza todas las llamadas HTTP.

La función base es `request<T>()`:

1. Construye la URL usando `NEXT_PUBLIC_API_URL` o `/api`.
2. Envía JSON.
3. Si la respuesta falla, lanza error.
4. Devuelve datos tipados.

Funciones principales:

- `getEvents()` trae tareas.
- `createEvent()` crea tarea.
- `updateEvent()` modifica tarea.
- `deleteEvent()` elimina tarea.
- `getTags()` trae etiquetas.
- `createTag()` crea etiqueta.
- `getChatKnowledge()` trae módulos aprendidos.
- `createChatKnowledge()` alimenta el chatbot.
- `sendChatMessage()` pregunta al chatbot.

## 4. Tipos compartidos: `lib/types.ts`

Este archivo define las formas de los datos que usa el frontend:

- `AgendaEvent`: tarea/calendario.
- `Tag`: etiqueta.
- `ChatKnowledge`: conocimiento guardado para el bot.
- `ChatAnswer`: respuesta del chatbot.
- `Reports`: datos de reportes.

Tener tipos claros ayuda a transcribir el proyecto sin perder campos importantes.

## 5. Backend Express: `server/index.ts`

### 5.1 Configuración inicial

El servidor usa:

- `express` para rutas.
- `helmet` para seguridad básica.
- `cors` para permitir llamadas desde frontend.
- `zod` para validar entradas.
- `PrismaClient` para base de datos.

### 5.2 Validaciones

`eventSchema` valida tareas.

`chatKnowledgeSchema` valida módulos de conocimiento.

`chatMessageSchema` valida preguntas del chatbot.

Esto evita guardar datos incompletos.

### 5.3 Rutas de tareas

- `GET /api/events`: lista tareas.
- `POST /api/events`: crea tarea.
- `PATCH /api/events/:id`: modifica tarea.
- `DELETE /api/events/:id`: elimina tarea.

### 5.4 Rutas de etiquetas

- `GET /api/tags`: lista etiquetas.
- `POST /api/tags`: crea etiqueta con nombre y color.

### 5.5 Rutas del chatbot

- `GET /api/chat/knowledge`: lista conocimiento aprendido.
- `POST /api/chat/knowledge`: guarda nuevo conocimiento.
- `POST /api/chat/message`: responde buscando coincidencias por palabras.

El bot es local y sencillo: no usa IA externa. Aprende de lo que guardas en la tabla `ChatKnowledge`.

### 5.6 Reportes

`GET /api/reports` calcula:

- Tareas por categoría.
- Tareas por estado.
- Tareas en próximos 7 días.
- Horas por prioridad.

## 6. Base de datos Prisma

`prisma/schema.prisma` define tablas:

- `Event`: tareas.
- `Tag`: etiquetas.
- `EventTag`: relación muchas-a-muchas entre tareas y etiquetas.
- `ChatKnowledge`: conocimiento para el chatbot.

Las migraciones en `prisma/migrations/` crean o modifican esas tablas en PostgreSQL.

## 7. Seed de datos

`prisma/seed.ts` borra datos previos y crea:

- Etiquetas iniciales.
- Tareas de ejemplo.
- Módulos iniciales para el chatbot.

Se ejecuta con:

```bash
npm run db:seed
```

## 8. Orden recomendado para transcribir manualmente

1. Crear `package.json` y configs (`tsconfig`, Tailwind, Next).
2. Crear `prisma/schema.prisma`.
3. Crear migraciones.
4. Crear `server/index.ts`.
5. Crear `lib/types.ts`.
6. Crear `lib/api.ts`.
7. Crear `components/Charts.tsx`.
8. Crear `app/layout.tsx` y `app/globals.css`.
9. Crear `app/page.tsx` por secciones: constantes, estados, calendario, modal, chatbot, reportes y tabla.
10. Crear README y configurar Railway.

## 9. Comandos básicos

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Si despliegas en Railway, usa las variables documentadas en `README.md`.
