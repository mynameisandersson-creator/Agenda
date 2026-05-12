import { PrismaClient, Category, EventStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

const tagPalette = [
  { name: 'Estrategia', color: '#2563eb' },
  { name: 'Cliente', color: '#7c3aed' },
  { name: 'Salud', color: '#16a34a' },
  { name: 'Familia', color: '#f59e0b' },
  { name: 'Aprendizaje', color: '#06b6d4' },
  { name: 'Finanzas', color: '#ef4444' }
];

function nextDate(dayOffset: number, hour: number, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minutes, 0, 0);
  return date;
}

async function main() {
  await prisma.eventTag.deleteMany();
  await prisma.chatKnowledge.deleteMany();
  await prisma.event.deleteMany();
  await prisma.tag.deleteMany();

  const tags = await Promise.all(
    tagPalette.map((tag) => prisma.tag.create({ data: tag }))
  );

  const events = [
    {
      title: 'Planificación semanal ejecutiva',
      description: 'Revisar objetivos, métricas y prioridades de la semana.',
      start: nextDate(0, 9),
      end: nextDate(0, 10, 30),
      category: Category.WORK,
      priority: Priority.HIGH,
      status: EventStatus.IN_PROGRESS,
      location: 'Sala virtual',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80',
      tagNames: ['Estrategia']
    },
    {
      title: 'Seguimiento con cliente principal',
      description: 'Alinear entregables, bloqueos y próximos compromisos.',
      start: nextDate(1, 11),
      end: nextDate(1, 12),
      category: Category.WORK,
      priority: Priority.CRITICAL,
      status: EventStatus.PLANNED,
      location: 'Google Meet',
      imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
      tagNames: ['Cliente', 'Estrategia']
    },
    {
      title: 'Entrenamiento funcional',
      description: 'Sesión de fuerza y movilidad para mantener energía diaria.',
      start: nextDate(2, 7),
      end: nextDate(2, 8),
      category: Category.HEALTH,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      location: 'Gimnasio',
      imageUrl: null,
      tagNames: ['Salud']
    },
    {
      title: 'Bloque profundo de aprendizaje',
      description: 'Estudiar arquitectura full stack y documentar avances.',
      start: nextDate(3, 15),
      end: nextDate(3, 17),
      category: Category.STUDY,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      location: 'Oficina',
      imageUrl: null,
      tagNames: ['Aprendizaje']
    },
    {
      title: 'Revisión de presupuesto mensual',
      description: 'Clasificar gastos, ahorros y pagos futuros.',
      start: nextDate(4, 18),
      end: nextDate(4, 19),
      category: Category.FINANCE,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      location: 'Casa',
      imageUrl: null,
      tagNames: ['Finanzas']
    },
    {
      title: 'Cena familiar',
      description: 'Tiempo personal protegido para convivencia familiar.',
      start: nextDate(5, 20),
      end: nextDate(5, 22),
      category: Category.FAMILY,
      priority: Priority.LOW,
      status: EventStatus.PLANNED,
      location: 'Restaurante',
      imageUrl: null,
      tagNames: ['Familia']
    }
  ];

  await prisma.chatKnowledge.createMany({
    data: [
      {
        title: 'Manual de uso rápido',
        content: 'Puedes crear tareas presionando una cuadrícula del calendario mensual. Usa la tabla o próximas tareas para abrir, modificar o eliminar tareas existentes.'
      },
      {
        title: 'Reglas de etiquetas',
        content: 'Las etiquetas sirven para clasificar tareas. Puedes usar etiquetas recomendadas como Urgente, Reunión y Proyecto, o crear tus propias etiquetas con color.'
      },
      {
        title: 'Reportes de productividad',
        content: 'Los reportes muestran tareas por categoría, horas por prioridad y actividad en los próximos siete días para analizar la organización semanal.'
      }
    ]
  });

  for (const event of events) {
    const selectedTags = tags.filter((tag) => event.tagNames.includes(tag.name));
    await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        category: event.category,
        priority: event.priority,
        status: event.status,
        location: event.location,
        imageUrl: event.imageUrl,
        tags: {
          create: selectedTags.map((tag) => ({ tag: { connect: { id: tag.id } } }))
        }
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
