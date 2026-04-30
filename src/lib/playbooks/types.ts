import type {
  CropType,
  OperationType,
  ParcelStatus,
  PrimarySpecies,
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
  /**
   * Si está definido, el playbook solo se aplica a parcelas cuya
   * `primarySpecies` coincida. Permite tener varios playbooks bajo el
   * mismo cropType (p. ej. NUT_TREE → almendro vs nogal vs pistacho).
   */
  species?: PrimarySpecies;
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

/**
 * Inversa exacta de `doy()`. Dado un día del año (1-365) sobre la tabla
 * NO bisiesta, devuelve la fecha calendario correspondiente (mes/día)
 * en el año dado. Se ignora el bisiesto a propósito: `doy(3, 1)` debe
 * mapear a 1-marzo independientemente de si `year` es bisiesto, igual
 * que en su definición. Si `dayOfYear` excede 365 (caso wrap-around
 * pasado a year+1), JS resuelve el desbordamiento de forma natural.
 */
export function dateFromDoy(year: number, dayOfYear: number): Date {
  if (dayOfYear < 1 || dayOfYear > 365) return new Date(year, 0, dayOfYear);
  let m = 0;
  while (m < 11 && MONTH_DAYS[m + 1]! < dayOfYear) m += 1;
  const day = dayOfYear - MONTH_DAYS[m]!;
  return new Date(year, m, day);
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
