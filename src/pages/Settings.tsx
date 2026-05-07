import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_VERSION } from '@/lib/version';
import { NotificationsSettingsCard } from '@/components/coach/NotificationsSettingsCard';
import { InstallCard } from '@/components/pwa/InstallCard';
import { DevicesCard } from '@/components/sync/DevicesCard';
import { ThemeCard } from '@/components/theme/ThemeCard';
import { useConfirm } from '@/components/ui/confirm';
import {
  AUTO_BACKUP_LIMIT,
  type AutoBackupRecord,
  type BackupSnapshot,
  BackupValidationError,
  defaultBackupFilename,
  deleteAutoBackup,
  downloadSnapshot,
  exportAllToSnapshot,
  listAutoBackups,
  parseSnapshot,
  recordAutoBackup,
  restoreSnapshot,
  summarizeSnapshot,
} from '@/lib/backup';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; message: string }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export function SettingsPage(): JSX.Element {
  const confirm = useConfirm();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [includeBlobs, setIncludeBlobs] = useState(true);
  const [pending, setPending] = useState<{
    snapshot: BackupSnapshot;
    summary: ReturnType<typeof summarizeSnapshot>;
    sourceLabel: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const autoBackups = useLiveQuery(() => listAutoBackups(), []);

  const setBusy = (message: string) => setStatus({ kind: 'busy', message });
  const setOk = (message: string) => setStatus({ kind: 'ok', message });
  const setError = (message: string) => setStatus({ kind: 'error', message });

  async function onExport() {
    try {
      setBusy('Generando copia…');
      const snapshot = await exportAllToSnapshot({ includeBlobs });
      downloadSnapshot(snapshot);
      setOk(
        `Copia descargada: ${defaultBackupFilename(snapshot)} (${snapshot.includesBlobs ? 'con' : 'sin'} fotos).`,
      );
    } catch (err) {
      setError(`No se pudo exportar: ${(err as Error).message}`);
    }
  }

  async function onSnapshotNow() {
    try {
      setBusy('Creando snapshot local…');
      await recordAutoBackup();
      setOk('Snapshot guardado en el historial local.');
    } catch (err) {
      setError(`No se pudo crear el snapshot: ${(err as Error).message}`);
    }
  }

  async function onPickFile(file: File) {
    try {
      setBusy('Validando copia…');
      const text = await file.text();
      const snapshot = parseSnapshot(text);
      const summary = summarizeSnapshot(snapshot);
      setPending({ snapshot, summary, sourceLabel: file.name });
      setStatus({ kind: 'idle' });
    } catch (err) {
      if (err instanceof BackupValidationError) {
        setError(`Copia inválida: ${err.message}`);
      } else {
        setError(`No se pudo leer el archivo: ${(err as Error).message}`);
      }
    }
  }

  async function onConfirmRestore() {
    if (!pending) return;
    const ok = await confirm({
      title: 'Restaurar copia: vas a sobrescribir tus datos',
      description:
        'Se sustituirán TODOS los datos locales por los de la copia. La operación no es reversible si no tienes otra copia previa.',
      confirmText: 'Sí, restaurar',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusy('Restaurando…');
      const result = await restoreSnapshot(pending.snapshot);
      setPending(null);
      setOk(`Restauración completada: ${result.totalInserted} filas insertadas.`);
    } catch (err) {
      setError(`No se pudo restaurar: ${(err as Error).message}`);
    }
  }

  async function onRestoreAuto(record: AutoBackupRecord) {
    const ok = await confirm({
      title: `Restaurar snapshot del ${formatDateTime(record.createdAt)}`,
      description:
        'Sustituirá todos los datos locales por los de este snapshot. No se puede deshacer.',
      confirmText: 'Restaurar',
      destructive: true,
    });
    if (!ok) return;
    try {
      setBusy('Restaurando snapshot…');
      const result = await restoreSnapshot(record.payload);
      setOk(`Restauración completada: ${result.totalInserted} filas insertadas.`);
    } catch (err) {
      setError(`No se pudo restaurar: ${(err as Error).message}`);
    }
  }

  async function onDeleteAuto(record: AutoBackupRecord) {
    const ok = await confirm({
      title: 'Borrar snapshot del historial',
      description: `Se eliminará el snapshot del ${formatDateTime(record.createdAt)} (${record.appVersion}).`,
      confirmText: 'Borrar',
      destructive: true,
    });
    if (!ok) return;
    await deleteAutoBackup(record.id);
  }

  function onDownloadAuto(record: AutoBackupRecord) {
    downloadSnapshot(record.payload, defaultBackupFilename(record.payload));
  }

  return (
    <PageContainer
      title="Ajustes"
      subtitle="Privacidad, copia de seguridad y acerca de."
    >
      <div className="grid gap-4">
        <InstallCard />

        <ThemeCard />

        <NotificationsSettingsCard />

        <DevicesCard />

        <Card>
          <CardHeader>
            <CardTitle>Copia de seguridad manual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <p>
              Descarga un archivo JSON con todos tus datos. Guárdalo en un disco
              externo o en la nube; tú decides dónde.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeBlobs}
                onChange={(e) => setIncludeBlobs(e.target.checked)}
              />
              Incluir fotos y notas de voz (archivos más grandes)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onExport} disabled={status.kind === 'busy'}>
                Exportar JSON
              </Button>
              <Button
                variant="outline"
                onClick={onSnapshotNow}
                disabled={status.kind === 'busy'}
              >
                Crear snapshot local ahora
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restaurar desde archivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <p>
              Importar sustituye <strong>todos</strong> los datos locales por
              los del archivo. Haz primero una copia manual.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onPickFile(file);
                e.target.value = '';
              }}
            />
            {pending && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                <div className="font-medium text-amber-900">
                  Copia lista para restaurar: {pending.sourceLabel}
                </div>
                <div className="mt-1 text-xs text-amber-900">
                  Exportada {formatDateTime(new Date(pending.summary.exportedAt))} ·
                  app v{pending.summary.appVersion} ·{' '}
                  {pending.summary.totalRows} filas (
                  {pending.summary.includesBlobs ? 'con' : 'sin'} fotos)
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={onConfirmRestore}>
                    Confirmar restauración
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPending(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de snapshots automáticos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <p className="text-xs text-slate-500">
              Se conservan los últimos {AUTO_BACKUP_LIMIT} snapshots locales (sin
              fotos) en IndexedDB. Sirven como red de seguridad rápida.
            </p>
            <AutoBackupList
              records={autoBackups}
              onRestore={onRestoreAuto}
              onDelete={onDeleteAuto}
              onDownload={onDownloadAuto}
            />
          </CardContent>
        </Card>

        <StatusBar status={status} />

        <Card>
          <CardHeader>
            <CardTitle>Acerca de</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm text-slate-700">
              <dt className="font-medium text-slate-900">Versión</dt>
              <dd>{APP_VERSION}</dd>
              <dt className="font-medium text-slate-900">Almacenamiento</dt>
              <dd>
                IndexedDB local — tus datos nunca salen de este dispositivo.
              </dd>
              <dt className="font-medium text-slate-900">Sincronización</dt>
              <dd>
                Manual mediante exportar/importar JSON. Sin servidor, sin
                cuentas, sin telemetría.
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function StatusBar({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  const tone =
    status.kind === 'ok'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : status.kind === 'error'
        ? 'border-red-300 bg-red-50 text-red-900'
        : 'border-slate-300 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded border px-3 py-2 text-sm ${tone}`}>
      {status.message}
    </div>
  );
}

function AutoBackupList({
  records,
  onRestore,
  onDelete,
  onDownload,
}: {
  records: AutoBackupRecord[] | undefined;
  onRestore: (r: AutoBackupRecord) => void;
  onDelete: (r: AutoBackupRecord) => void;
  onDownload: (r: AutoBackupRecord) => void;
}) {
  if (!records) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (records.length === 0)
    return (
      <p className="text-sm text-slate-500">
        Sin snapshots todavía. Pulsa «Crear snapshot local ahora» para empezar.
      </p>
    );
  return (
    <ul className="grid gap-2">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 px-3 py-2"
        >
          <div className="text-sm">
            <div className="font-medium text-slate-900">
              {formatDateTime(r.createdAt)}
            </div>
            <div className="text-xs text-slate-500">
              v{r.appVersion} · {formatBytes(r.sizeBytes)}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => onDownload(r)}>
              Descargar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRestore(r)}>
              Restaurar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(r)}>
              Borrar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

