import type {
  CropType,
  OperationType,
  ParcelStatus,
  TaskPriority,
} from '@/lib/db/types';

export interface PlaybookTask {
  id: string;
  type: OperationType;
  title: string;
  rationale: string;
  scientificBasis: string;
  windowStartDoy: number;
  windowEndDoy: number;
  priority: TaskPriority;
  guidanceKey?: string;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  cropType: CropType;
  species?: string;
  applicableStatuses: ParcelStatus[];
  region: 'BURGOS';
  tasks: PlaybookTask[];
}

export function doyInWindow(doy: number, start: number, end: number): boolean {
  if (start <= end) return doy >= start && doy <= end;
  return doy >= start || doy <= end;
}

const MONTH_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

export function doy(month: number, day: number): number {
  return MONTH_DAYS[month - 1]! + day;
}
