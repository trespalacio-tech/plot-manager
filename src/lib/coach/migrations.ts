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

async function runYearSuffixMigration(): Promise<void> {
  // Re-leer dentro del lock por si otra pestaña ya marcó como hecha la
  // migración entre el momento en que pedimos el lock y nos lo dieron.
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

/**
 * Borra tareas de playbooks creadas con el formato `playbook:parcel:taskId`
 * (sin año). El nuevo formato es `playbook:parcel:taskId:YYYY` para permitir
 * recurrencia anual. Solo se ejecuta una vez por navegador.
 *
 * Si hay varias pestañas abiertas y todas ven el flag a `false`, sin un
 * lock las tres ejecutarían bulkDelete en paralelo. Web Locks API
 * serializa la migración a un solo runner por navegador. Fallback sin
 * lock si la API no existe (Safari < 15.4 / navegadores antiguos).
 */
export async function runCoachMigrations(): Promise<void> {
  const state = read();
  if (state.ranYearSuffix) return;
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    await navigator.locks.request('coach-migrations', runYearSuffixMigration);
    return;
  }
  await runYearSuffixMigration();
}
