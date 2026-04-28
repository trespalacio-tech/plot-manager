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

export function dateFromDoy(year: number, doy: number): Date {
  return new Date(year, 0, doy);
}

export interface WindowDates {
  start: Date;
  end: Date;
}

/**
 * Returns the next start/end dates for a DOY window relative to `now`.
 * If the window already ended this year, rolls to next year.
 * Wrap-around windows (e.g. Dec→Feb) are handled with the end date in the
 * following year.
 */
export function nextWindowDates(
  now: Date,
  startDoy: number,
  endDoy: number,
): WindowDates {
  const year = now.getFullYear();
  const wraps = startDoy > endDoy;
  let start = dateFromDoy(year, startDoy);
  let end = wraps ? dateFromDoy(year + 1, endDoy) : dateFromDoy(year, endDoy);
  if (end.getTime() < now.getTime()) {
    start = dateFromDoy(year + 1, startDoy);
    end = wraps ? dateFromDoy(year + 2, endDoy) : dateFromDoy(year + 1, endDoy);
  }
  return { start, end };
}
