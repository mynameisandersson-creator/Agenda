'use client';

import { addDays, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, DonutChart, LineChart } from '@/components/Charts';
import { createEvent, getEvents, getReports, getTags } from '@/lib/api';
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

  const today = useMemo(() => new Date(), []);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const upcomingEvents = events.filter((event) => new Date(event.start) >= today).slice(0, 6);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    const start = new Date(String(formData.get('start')));
    const end = new Date(String(formData.get('end')));
    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      start: start.toISOString(),
      end: end.toISOString(),
      category: formData.get('category'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      location: formData.get('location'),
      tagIds: formData.getAll('tagIds')
    };

    try {
      await createEvent(payload);
      await loadData();
    } catch (submitError) {
      setError('No se pudo guardar el evento. Revisa fechas, campos obligatorios y conexión con la API.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-soft sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 ring-1 ring-white/15">
              Fecha actual: {format(today, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Agenda semanal profesional para organizar tu día a día.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Planifica eventos actuales y futuros, clasifica con etiquetas, visualiza una semana estilo Google Calendar y analiza tu productividad con tablas, barras, líneas y diagrama de pastel.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Resumen</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric value={reports.totalEvents} label="eventos" />
              <Metric value={upcomingEvents.length} label="próximos" />
              <Metric value={tags.length} label="etiquetas" />
              <Metric value={format(weekEnd, 'd MMM', { locale: es })} label="fin semana" />
            </div>
          </div>
        </div>
      </section>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>}

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-200">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Calendario semanal</h2>
              <p className="text-sm text-slate-500">Semana del {format(weekStart, 'd MMM', { locale: es })} al {format(weekEnd, 'd MMM yyyy', { locale: es })}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Vista tipo agenda</span>
          </div>
          <div className="grid gap-3 md:grid-cols-7">
            {days.map((day) => {
              const dayEvents = events.filter((event) => isSameDay(new Date(event.start), day));
              return (
                <div key={day.toISOString()} className={`min-h-80 rounded-3xl border p-3 ${isSameDay(day, today) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{format(day, 'EEE', { locale: es })}</p>
                    <p className="text-3xl font-black text-slate-900">{format(day, 'd')}</p>
                  </div>
                  <div className="space-y-3">
                    {dayEvents.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">Disponible para planificar.</p>}
                    {dayEvents.map((event) => <EventCard key={event.id} event={event} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="text-2xl font-black text-slate-900">Nuevo evento futuro</h2>
          <p className="mt-1 text-sm text-slate-500">Crea actividades con fecha, prioridad, estado y etiquetas.</p>
          <div className="mt-5 space-y-4">
            <input className={inputClass} name="title" placeholder="Título del evento" required minLength={3} />
            <textarea className={inputClass} name="description" placeholder="Descripción profesional y detallada" required minLength={3} rows={3} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Inicio<input className={inputClass} name="start" type="datetime-local" required /></label>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Final<input className={inputClass} name="end" type="datetime-local" required /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select name="category" label="Categoría" options={categoryLabels} />
              <Select name="priority" label="Prioridad" options={priorityLabels} />
            </div>
            <Select name="status" label="Estado" options={statusLabels} />
            <input className={inputClass} name="location" placeholder="Ubicación o enlace" />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Etiquetas</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" name="tagIds" value={tag.id} className="accent-blue-600" />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: tag.color }} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
            <button disabled={saving} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar en la agenda'}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <ReportCard title="Diagrama pastel por categoría"><DonutChart data={reports.byCategory} /></ReportCard>
        <ReportCard title="Gráfico de barras por prioridad"><BarChart data={reports.hoursByPriority} /></ReportCard>
        <ReportCard title="Gráfico lineal próximos 7 días"><LineChart data={reports.byDay} /></ReportCard>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-2xl font-black text-slate-900">Tabla ejecutiva de eventos</h2>
            <p className="text-sm text-slate-500">Control profesional para revisar fechas actuales y futuras.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                <tr><th className="px-6 py-4">Evento</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Etiquetas</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4"><p className="font-bold text-slate-900">{event.title}</p><p className="text-slate-500">{event.location}</p></td>
                    <td className="px-6 py-4 text-slate-600">{format(new Date(event.start), 'd MMM yyyy HH:mm', { locale: es })}</td>
                    <td className="px-6 py-4"><Badge>{categoryLabels[event.category]}</Badge></td>
                    <td className="px-6 py-4"><Badge>{statusLabels[event.status]}</Badge></td>
                    <td className="px-6 py-4"><TagList event={event} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <h2 className="text-2xl font-black text-slate-900">Próximos compromisos</h2>
          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-slate-500">Cargando agenda...</p>}
            {upcomingEvents.map((event) => <EventCard key={event.id} event={event} compact />)}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-2xl bg-white p-4 text-slate-900"><p className="text-3xl font-black">{value}</p><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p></div>;
}

function Select<T extends string>({ name, label, options }: { name: string; label: string; options: Record<T, string> }) {
  return (
    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
      {label}
      <select className={inputClass} name={name} required>
        {Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text as string}</option>)}
      </select>
    </label>
  );
}

function EventCard({ event, compact = false }: { event: AgendaEvent; compact?: boolean }) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br ${categoryStyles[event.category]} p-3 text-white shadow-lg`}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/75">{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</p>
      <h3 className="mt-1 font-black leading-tight">{event.title}</h3>
      {!compact && <p className="mt-1 line-clamp-2 text-xs text-white/80">{event.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1"><TagList event={event} light /></div>
    </article>
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
