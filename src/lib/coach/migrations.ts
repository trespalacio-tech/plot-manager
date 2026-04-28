import { getDb } from '@/lib/db';

const MIGRATION_KEY = 'coach:migrations';

interface MigrationsState {
  ranYearSuffix?: boolean;
}

function read(): MigrationsState {
  try {
    const raw = localStorage.getItem(MIGRATION_KEY);
    return raw ? (JSON.parse(raw) as MigrationsState) : {};
  } catch {
    return {};
  }
}

function write(state: MigrationsState): void {
  try {
    localStorage.setItem(MIGRATION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Borra tareas de playbooks creadas con el formato `playbook:parcel:taskId`
 * (sin año). El nuevo formato es `playbook:parcel:taskId:YYYY` para permitir
 * recurrencia anual. Solo se ejecuta una vez por navegador.
 */
export async function runCoachMigrations(): Promise<void> {
  const state = read();
  if (state.ranYearSuffix) return;
  const db = getDb();
  const playbookTasks = await db.tasks.where('source').equals('PLAYBOOK').toArray();
  const yearSuffix = /:\d{4}$/;
  const legacy = playbookTasks.filter(
    (t) => t.sourceRef && !yearSuffix.test(t.sourceRef),
  );
  if (legacy.length > 0) {
    await db.tasks.bulkDelete(legacy.map((t) => t.id));
  }
  write({ ...state, ranYearSuffix: true });
}
