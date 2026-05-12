import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import next from 'next';
import { PrismaClient, Category, EventStatus, Priority } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === 'production';
const nextApp = isProduction ? next({ dev: false, dir: process.cwd() }) : null;
const nextHandler = nextApp?.getRequestHandler();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

const chatKnowledgeSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10)
});

const chatMessageSchema = z.object({
  message: z.string().min(2)
});

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  start: z.string().datetime(),
  end: z.string().datetime(),
  category: z.nativeEnum(Category),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(EventStatus),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([])
});

app.get('/api/health', async (_req, res, nextMiddleware) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: 'agenda-api',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    nextMiddleware(error);
  }
});

app.get('/api/tags', async (_req, res, nextMiddleware) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    res.json(tags);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.post('/api/tags', async (req, res, nextMiddleware) => {
  try {
    const schema = z.object({ name: z.string().min(2), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
    const data = schema.parse(req.body);
    const tag = await prisma.tag.create({ data });
    res.status(201).json(tag);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.get('/api/events', async (req, res, nextMiddleware) => {
  try {
    const start = typeof req.query.start === 'string' ? new Date(req.query.start) : undefined;
    const end = typeof req.query.end === 'string' ? new Date(req.query.end) : undefined;
    const events = await prisma.event.findMany({
      where: {
        ...(start || end
          ? {
              start: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {})
              }
            }
          : {})
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { start: 'asc' }
    });
    res.json(events);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.post('/api/events', async (req, res, nextMiddleware) => {
  try {
    const data = eventSchema.parse(req.body);
    if (new Date(data.end) <= new Date(data.start)) {
      res.status(400).json({ message: 'La fecha final debe ser posterior a la fecha inicial.' });
      return;
    }
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        start: new Date(data.start),
        end: new Date(data.end),
        category: data.category,
        priority: data.priority,
        status: data.status,
        location: data.location,
        imageUrl: data.imageUrl,
        tags: { create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
      },
      include: { tags: { include: { tag: true } } }
    });
    res.status(201).json(event);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.patch('/api/events/:id', async (req, res, nextMiddleware) => {
  try {
    const data = eventSchema.partial().parse(req.body);
    const { tagIds, start, end, ...eventData } = data;
    if (start && end && new Date(end) <= new Date(start)) {
      res.status(400).json({ message: 'La fecha final debe ser posterior a la fecha inicial.' });
      return;
    }
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...eventData,
        ...(start ? { start: new Date(start) } : {}),
        ...(end ? { end: new Date(end) } : {}),
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } }))
              }
            }
          : {})
      },
      include: { tags: { include: { tag: true } } }
    });
    res.json(event);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.delete('/api/events/:id', async (req, res, nextMiddleware) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    nextMiddleware(error);
  }
});


app.get('/api/chat/knowledge', async (_req, res, nextMiddleware) => {
  try {
    const knowledge = await prisma.chatKnowledge.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(knowledge);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.post('/api/chat/knowledge', async (req, res, nextMiddleware) => {
  try {
    const data = chatKnowledgeSchema.parse(req.body);
    const knowledge = await prisma.chatKnowledge.create({ data });
    res.status(201).json(knowledge);
  } catch (error) {
    nextMiddleware(error);
  }
});

app.post('/api/chat/message', async (req, res, nextMiddleware) => {
  try {
    const { message } = chatMessageSchema.parse(req.body);
    const normalizedMessage = message.toLowerCase();
    const words = normalizedMessage
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .slice(0, 8);

    const [knowledge, events] = await Promise.all([
      prisma.chatKnowledge.findMany({ orderBy: { updatedAt: 'desc' }, take: 50 }),
      prisma.event.findMany({ orderBy: { start: 'asc' }, take: 20 })
    ]);

    const matchedKnowledge = knowledge.find((item) => {
      const searchableText = `${item.title} ${item.content}`.toLowerCase();
      return words.some((word) => searchableText.includes(word));
    });

    const scheduleSummary = events.length
      ? `Tienes ${events.length} tareas registradas. La próxima es "${events[0].title}" el ${events[0].start.toISOString().slice(0, 10)}.`
      : 'Todavía no tienes tareas registradas en la agenda.';

    if (matchedKnowledge) {
      res.json({
        answer: `Según lo que me enseñaste en "${matchedKnowledge.title}": ${matchedKnowledge.content}\n\nResumen de agenda: ${scheduleSummary}`,
        source: matchedKnowledge
      });
      return;
    }

    res.json({
      answer: `Aún no tengo una respuesta entrenada para esa pregunta. Puedes alimentarme desde el módulo "Entrenar chatbot" agregando un título y contenido.\n\nResumen de agenda: ${scheduleSummary}`,
      source: null
    });
  } catch (error) {
    nextMiddleware(error);
  }
});

app.get('/api/reports', async (_req, res, nextMiddleware) => {
  try {
    const events = await prisma.event.findMany({ include: { tags: { include: { tag: true } } } });
    const byCategory = Object.values(Category).map((category) => ({
      label: category,
      value: events.filter((event) => event.category === category).length
    }));
    const byStatus = Object.values(EventStatus).map((status) => ({
      label: status,
      value: events.filter((event) => event.status === status).length
    }));
    const byDay = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      return {
        label: key,
        value: events.filter((event) => event.start.toISOString().slice(0, 10) === key).length
      };
    });
    const hoursByPriority = Object.values(Priority).map((priority) => ({
      label: priority,
      value: Number(
        events
          .filter((event) => event.priority === priority)
          .reduce((total, event) => total + (event.end.getTime() - event.start.getTime()) / 3_600_000, 0)
          .toFixed(1)
      )
    }));
    res.json({ byCategory, byStatus, byDay, hoursByPriority, totalEvents: events.length });
  } catch (error) {
    nextMiddleware(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ message: 'Datos inválidos', issues: error.issues });
    return;
  }
  console.error(error);
  res.status(500).json({ message: 'Error interno del servidor' });
});

async function startServer() {
  if (nextApp && nextHandler) {
    await nextApp.prepare();
    app.all('*', (req, res) => nextHandler(req, res));
  }

  app.listen(port, () => {
    console.log(`Agenda app listening on http://localhost:${port}`);
  });
}

void startServer();
