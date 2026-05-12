import type { AgendaEvent, Reports, Tag } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getEvents() {
  return request<AgendaEvent[]>('/events');
}

export function getTags() {
  return request<Tag[]>('/tags');
}

export function getReports() {
  return request<Reports>('/reports');
}

export function createEvent(payload: unknown) {
  return request<AgendaEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateEvent(id: string, payload: unknown) {
  return request<AgendaEvent>(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteEvent(id: string) {
  return request<void>(`/events/${id}`, { method: 'DELETE' });
}

export function createTag(payload: { name: string; color: string }) {
  return request<Tag>('/tags', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
