export type Category = 'WORK' | 'PERSONAL' | 'STUDY' | 'HEALTH' | 'FINANCE' | 'FAMILY';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type AgendaEvent = {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  category: Category;
  priority: Priority;
  status: EventStatus;
  location?: string | null;
  tags: { tag: Tag }[];
};

export type ReportPoint = {
  label: string;
  value: number;
};

export type Reports = {
  byCategory: ReportPoint[];
  byStatus: ReportPoint[];
  byDay: ReportPoint[];
  hoursByPriority: ReportPoint[];
  totalEvents: number;
};
