'use client';

import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, DonutChart, LineChart } from '@/components/Charts';
import { createEvent, createTag, deleteEvent, getEvents, getReports, getTags, updateEvent } from '@/lib/api';
import type { AgendaEvent, Category, EventStatus, Priority, Reports, Tag } from '@/lib/types';

const categoryLabels: Record<Category, string> = {
  WORK: 'Trabajo',
  PERSONAL: 'Personal',
  STUDY: 'Estudio',
  HEALTH: 'Salud',
  FINANCE: 'Finanzas',
  FAMILY: 'Familia'
};

const statusLabels: Record<EventStatus, string> = {
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
  CANCELLED: 'Cancelado'
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
};

const categoryStyles: Record<Category, string> = {
  WORK: 'from-blue-500 to-indigo-500',
  PERSONAL: 'from-pink-500 to-rose-500',
  STUDY: 'from-cyan-500 to-sky-500',
  HEALTH: 'from-emerald-500 to-green-500',
  FINANCE: 'from-amber-500 to-orange-500',
  FAMILY: 'from-violet-500 to-purple-500'
};

const recommendedTags = [
  { name: 'Urgente', color: '#ef4444' },
  { name: 'Reunión', color: '#2563eb' },
  { name: 'Proyecto', color: '#7c3aed' },
  { name: 'Casa', color: '#f59e0b' },
  { name: 'Salud', color: '#16a34a' },
  { name: 'Estudio', color: '#06b6d4' }
];

const spellingReplacements: Record<string, string> = {
  agenda: 'agenda',
  agend: 'agenda',
  reunion: 'reunión',
  reunionn: 'reunión',
  manana: 'mañana',
  miercoles: 'miércoles',
  sabado: 'sábado',
  proximo: 'próximo',
  descripcion: 'descripción',
  ubicacion: 'ubicación',
  telefono: 'teléfono',
  medicion: 'medición',
  revision: 'revisión',
  planificacion: 'planificación',
  organizacion: 'organización',
  prioridad: 'prioridad',
  importante: 'importante',
  cliente: 'cliente'
};

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

const emptyReports: Reports = {
  byCategory: [],
  byStatus: [],
  byDay: [],
  hoursByPriority: [],
  totalEvents: 0
};

export default function Page() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [reports, setReports] = useState<Reports>(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = useMemo(() => {
    const days: Date[] = [];
    let currentDay = calendarStart;
    while (currentDay <= calendarEnd) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);
  const upcomingEvents = events.filter((event) => new Date(event.start) >= now).slice(0, 6);

  async function loadData() {
    try {
      setError('');
      const [eventsData, tagsData, reportsData] = await Promise.all([getEvents(), getTags(), getReports()]);
      setEvents(eventsData);
      setTags(tagsData);
      setReports(reportsData);
    } catch (loadError) {
      setError('No se pudo conectar con la API. Ejecuta npm run dev y confirma que Express está en el puerto 4000.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  function openDateModal(date: Date) {
    setSelectedDate(date);
    setSelectedEvent(null);
  }

  function openEventModal(event: AgendaEvent) {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.start));
  }

  function closeModal() {
    setSelectedDate(null);
    setSelectedEvent(null);
  }

  async function handleSave(payload: EventPayload) {
    setSaving(true);
    setError('');
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      await loadData();
      closeModal();
    } catch (submitError) {
      setError('No se pudo guardar la tarea. Revisa fechas, campos obligatorios y conexión con la API.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEvent) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await deleteEvent(selectedEvent.id);
      await loadData();
      closeModal();
    } catch (deleteError) {
      setError('No se pudo eliminar la tarea. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTag(name: string, color: string) {
    const normalizedName = correctSpanishText(name);
    const existingTag = tags.find((tag) => tag.name.toLowerCase() === normalizedName.toLowerCase());
    if (existingTag) {
      return existingTag;
    }
    const tag = await createTag({ name: normalizedName, color });
    setTags((currentTags) => [...currentTags, tag].sort((a, b) => a.name.localeCompare(b.name, 'es')));
    return tag;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-soft sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 ring-1 ring-white/15">
              Fecha actual: {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Agenda mensual profesional para organizar tu día a día.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Planifica tareas actuales y futuras, corrige textos comunes en español, agrega imágenes, crea etiquetas personalizadas y administra detalles desde un calendario de inicio a fin de mes.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Reloj en vivo</p>
            <p className="mt-3 text-5xl font-black tabular-nums">{format(now, 'HH:mm:ss')}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric value={reports.totalEvents} label="tareas" />
              <Metric value={upcomingEvents.length} label="próximas" />
              <Metric value={tags.length} label="etiquetas" />
              <Metric value={format(monthEnd, 'd MMM', { locale: es })} label="fin de mes" />
            </div>
          </div>
        </div>
      </section>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>}

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-200">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Calendario mensual</h2>
              <p className="text-sm text-slate-500">Del {format(monthStart, 'd MMM', { locale: es })} al {format(monthEnd, 'd MMM yyyy', { locale: es })}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Presiona una cuadrícula para abrir detalles</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-7">
            {monthDays.map((day) => {
              const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day));
              return (
                <div
                  key={day.toISOString()}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDateModal(day)}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === 'Enter') {
                      openDateModal(day);
                    }
                  }}
                  className={`min-h-36 rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${isSameDay(day, now) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'} ${isSameMonth(day, now) ? '' : 'opacity-45'}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-900">{format(day, 'd')}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">{dayEvents.length}</span>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-2 text-xs text-slate-400">Agregar tarea</p>}
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          openEventModal(event);
                        }}
                        onKeyDown={(keyEvent) => {
                          if (keyEvent.key === 'Enter') {
                            keyEvent.stopPropagation();
                            openEventModal(event);
                          }
                        }}
                        className={`block rounded-2xl bg-gradient-to-br ${categoryStyles[event.category]} px-3 py-2 text-xs font-bold text-white shadow`}
                      >
                        {format(new Date(event.start), 'HH:mm')} · {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 3 && <p className="text-xs font-bold text-slate-500">+{dayEvents.length - 3} más</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
            <h2 className="text-2xl font-black text-slate-900">Próximas tareas</h2>
            <div className="mt-4 space-y-3">
              {loading && <p className="text-sm text-slate-500">Cargando agenda...</p>}
              {upcomingEvents.map((event) => <EventCard key={event.id} event={event} onOpen={openEventModal} compact />)}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
            <h2 className="text-2xl font-black text-slate-900">Etiquetas recomendadas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendedTags.map((tag) => <Badge key={tag.name}>{tag.name}</Badge>)}
            </div>
            <p className="mt-4 text-sm text-slate-500">También puedes crear una etiqueta propia desde el modal de detalles.</p>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <ReportCard title="Diagrama pastel por categoría"><DonutChart data={reports.byCategory} /></ReportCard>
        <ReportCard title="Gráfico de barras por prioridad"><BarChart data={reports.hoursByPriority} /></ReportCard>
        <ReportCard title="Gráfico lineal próximos 7 días"><LineChart data={reports.byDay} /></ReportCard>
      </section>

      <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-slate-200">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-2xl font-black text-slate-900">Tabla ejecutiva de tareas</h2>
          <p className="text-sm text-slate-500">Control profesional para revisar, modificar o eliminar tareas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr><th className="px-6 py-4">Tarea</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Etiquetas</th><th className="px-6 py-4">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><p className="font-bold text-slate-900">{event.title}</p><p className="text-slate-500">{event.location}</p></td>
                  <td className="px-6 py-4 text-slate-600">{format(new Date(event.start), 'd MMM yyyy HH:mm', { locale: es })}</td>
                  <td className="px-6 py-4"><Badge>{categoryLabels[event.category]}</Badge></td>
                  <td className="px-6 py-4"><Badge>{statusLabels[event.status]}</Badge></td>
                  <td className="px-6 py-4"><TagList event={event} /></td>
                  <td className="px-6 py-4"><button type="button" onClick={() => openEventModal(event)} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDate && (
        <EventModal
          key={selectedEvent?.id ?? selectedDate.toISOString()}
          date={selectedDate}
          event={selectedEvent}
          tags={tags}
          saving={saving}
          onClose={closeModal}
          onDelete={selectedEvent ? handleDelete : undefined}
          onSave={handleSave}
          onCreateTag={handleCreateTag}
        />
      )}
    </main>
  );
}

type EventPayload = {
  title: string;
  description: string;
  start: string;
  end: string;
  category: Category;
  priority: Priority;
  status: EventStatus;
  location: string;
  imageUrl: string | null;
  tagIds: string[];
};

function EventModal({
  date,
  event,
  tags,
  saving,
  onClose,
  onDelete,
  onSave,
  onCreateTag
}: {
  date: Date;
  event: AgendaEvent | null;
  tags: Tag[];
  saving: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (payload: EventPayload) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
}) {
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState(() => event?.tags.map(({ tag }) => tag.id) ?? []);
  const [customTagName, setCustomTagName] = useState('');
  const [customTagColor, setCustomTagColor] = useState('#2563eb');
  const defaultStart = event ? toDatetimeLocal(new Date(event.start)) : toDatetimeLocal(withHour(date, 9));
  const defaultEnd = event ? toDatetimeLocal(new Date(event.end)) : toDatetimeLocal(withHour(date, 10));

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const start = new Date(String(formData.get('start')));
    const end = new Date(String(formData.get('end')));
    await onSave({
      title: correctSpanishText(String(formData.get('title'))),
      description: correctSpanishText(String(formData.get('description'))),
      start: start.toISOString(),
      end: end.toISOString(),
      category: String(formData.get('category')) as Category,
      priority: String(formData.get('priority')) as Priority,
      status: String(formData.get('status')) as EventStatus,
      location: correctSpanishText(String(formData.get('location') ?? '')),
      imageUrl: imageUrl || null,
      tagIds: selectedTagIds
    });
  }

  async function addCustomTag(name: string, color: string) {
    if (!name.trim()) {
      return;
    }
    const tag = await onCreateTag(name, color);
    setSelectedTagIds((currentIds) => currentIds.includes(tag.id) ? currentIds : [...currentIds, tag.id]);
    setCustomTagName('');
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((currentIds) => currentIds.includes(tagId) ? currentIds.filter((id) => id !== tagId) : [...currentIds, tagId]);
  }

  function handleImageFile(file?: File) {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Detalles de tarea</p>
            <h2 className="mt-1 text-3xl font-black text-slate-900">{event ? 'Modificar tarea' : 'Nueva tarea'}</h2>
            <p className="text-sm text-slate-500">{format(date, "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">Cerrar ✕</button>
        </div>

        {imageUrl && (
          <div className="max-h-80 overflow-hidden bg-slate-100">
            <img src={imageUrl} alt="Imagen de la tarea" className="h-full max-h-80 w-full object-cover" />
          </div>
        )}

        <form onSubmit={submit} className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <CorrectableInput className={inputClass} name="title" placeholder="Título de la tarea" required minLength={3} defaultValue={event?.title ?? ''} />
            <CorrectableTextarea className={inputClass} name="description" placeholder="Descripción detallada" required minLength={3} rows={4} defaultValue={event?.description ?? ''} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Inicio<input className={inputClass} name="start" type="datetime-local" required defaultValue={defaultStart} /></label>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Final<input className={inputClass} name="end" type="datetime-local" required defaultValue={defaultEnd} /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select name="category" label="Categoría" options={categoryLabels} defaultValue={event?.category} />
              <Select name="priority" label="Prioridad" options={priorityLabels} defaultValue={event?.priority} />
              <Select name="status" label="Estado" options={statusLabels} defaultValue={event?.status} />
            </div>
            <CorrectableInput className={inputClass} name="location" placeholder="Ubicación o enlace" defaultValue={event?.location ?? ''} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClass} value={imageUrl} onChange={(changeEvent) => setImageUrl(changeEvent.target.value)} placeholder="URL de imagen" />
              <label className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Subir imagen
                <input type="file" accept="image/*" className="sr-only" onChange={(changeEvent) => handleImageFile(changeEvent.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Etiquetas existentes</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${selectedTagIds.includes(tag.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'}`}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Recomendadas</p>
              <div className="flex flex-wrap gap-2">
                {recommendedTags.map((tag) => (
                  <button key={tag.name} type="button" onClick={() => addCustomTag(tag.name, tag.color)} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                    + {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Crear mi propia etiqueta</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <CorrectableInput className={inputClass} value={customTagName} onChange={(changeEvent) => setCustomTagName(changeEvent.target.value)} onBlur={(blurEvent) => setCustomTagName(correctSpanishText(blurEvent.target.value))} placeholder="Nombre etiqueta" />
                <input type="color" value={customTagColor} onChange={(changeEvent) => setCustomTagColor(changeEvent.target.value)} className="h-12 w-16 rounded-xl border border-slate-200 bg-white" />
              </div>
              <button type="button" onClick={() => addCustomTag(customTagName, customTagColor)} className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Crear y seleccionar etiqueta</button>
            </div>

            <div className="rounded-3xl bg-blue-50 p-4 text-sm text-blue-800">
              La corrección automática aplica acentos y mayúscula inicial en campos de texto comunes al salir del campo y al guardar.
            </div>

            <div className="flex flex-col gap-3">
              <button disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Guardando...' : event ? 'Guardar cambios' : 'Crear tarea'}
              </button>
              {onDelete && <button type="button" disabled={saving} onClick={onDelete} className="rounded-2xl bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60">Eliminar tarea</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-2xl bg-white p-4 text-slate-900"><p className="text-3xl font-black">{value}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p></div>;
}

function Select<T extends string>({ name, label, options, defaultValue }: { name: string; label: string; options: Record<T, string>; defaultValue?: T }) {
  return (
    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
      {label}
      <select className={inputClass} name={name} required defaultValue={defaultValue}>
        {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text as string}</option>)}
      </select>
    </label>
  );
}

function EventCard({ event, compact = false, onOpen }: { event: AgendaEvent; compact?: boolean; onOpen: (event: AgendaEvent) => void }) {
  return (
    <button type="button" onClick={() => onOpen(event)} className={`block w-full rounded-2xl bg-gradient-to-br ${categoryStyles[event.category]} p-3 text-left text-white shadow-lg`}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/75">{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</p>
      <h3 className="mt-1 font-black leading-tight">{event.title}</h3>
      {!compact && <p className="mt-1 line-clamp-2 text-xs text-white/80">{event.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1"><TagList event={event} light /></div>
    </button>
  );
}

function TagList({ event, light = false }: { event: AgendaEvent; light?: boolean }) {
  return event.tags.map(({ tag }) => (
    <span key={tag.id} className={`rounded-full px-2 py-1 text-xs font-bold ${light ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{tag.name}</span>
  ));
}

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200"><h2 className="text-xl font-black text-slate-900">{title}</h2><div className="mt-4">{children}</div></div>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{children}</span>;
}

function CorrectableInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} onBlur={(event) => {
    event.currentTarget.value = correctSpanishText(event.currentTarget.value);
    props.onBlur?.(event);
  }} />;
}

function CorrectableTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} onBlur={(event) => {
    event.currentTarget.value = correctSpanishText(event.currentTarget.value);
    props.onBlur?.(event);
  }} />;
}

function correctSpanishText(value: string) {
  const normalized = value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b[\p{L}]+\b/gu, (word) => {
      const lowerWord = word.toLowerCase();
      return spellingReplacements[lowerWord] ?? word;
    });

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : normalized;
}

function withHour(date: Date, hour: number) {
  const result = new Date(date);
  result.setHours(hour, 0, 0, 0);
  return result;
}

function toDatetimeLocal(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}
