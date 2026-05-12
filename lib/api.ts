import type { AgendaEvent, Reports, Tag } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

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
