import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fieldLogSchema, type FieldLogFormValues } from '@/lib/validators/fieldLog';
import type { FieldLogEntry, OperationType, Parcel } from '@/lib/db/types';
import {
  createFieldLogEntry,
  updateFieldLogEntry,
} from '@/lib/db/repos';
import { markCoachStale } from '@/lib/coach/useAutoCoach';
import {
  OPERATION_LABELS,
  OPERATION_TEMPLATES,
  OPERATION_TYPES,
} from '@/lib/notebook/templates';

interface FieldLogPrefill {
  type?: OperationType;
  title?: string;
  description?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcels: Parcel[];
  existing?: FieldLogEntry;
  defaultParcelId?: string;
  prefill?: FieldLogPrefill;
  onSaved?: (entry: FieldLogEntry) => void | Promise<void>;
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function FieldLogDialog({
  open,
  onOpenChange,
  parcels,
  existing,
  defaultParcelId,
  prefill,
  onSaved,
}: Props): JSX.Element {
  const editing = Boolean(existing);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | undefined>(existing?.voiceNoteBlob);
  const [existingPhotos, setExistingPhotos] = useState<Blob[]>(existing?.photoBlobs ?? []);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const defaultValues: FieldLogFormValues = useMemo(() => {
    const baseType: OperationType =
      existing?.type ?? prefill?.type ?? ('MULCHING' as OperationType);
    const baseTitle =
      existing?.title ?? prefill?.title ?? OPERATION_TEMPLATES[baseType].defaultTitle;
    return {
      date: existing?.date ?? new Date(),
      parcelIds:
        existing?.parcelIds ??
        (defaultParcelId ? [defaultParcelId] : []),
      type: baseType,
      title: baseTitle,
      description: existing?.description ?? prefill?.description ?? '',
      durationMinutes: existing?.durationMinutes,
      weatherConditions: existing?.weatherConditions ?? '',
      costEur: existing?.costEur,
    };
  }, [existing, defaultParcelId, prefill]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FieldLogFormValues>({
    resolver: zodResolver(fieldLogSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  useEffect(() => {
    if (!open) {
      setPhotoFiles([]);
      setVoiceBlob(existing?.voiceNoteBlob);
      setExistingPhotos(existing?.photoBlobs ?? []);
      setRecording(false);
      setRecordError(null);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    }
  }, [open, existing]);

  const type = watch('type');
  const parcelIds = watch('parcelIds');
  const template = OPERATION_TEMPLATES[type];

  const onTypeChange = (next: OperationType) => {
    const prev = type;
    const prevTitle = watch('title');
    setValue('type', next, { shouldValidate: true });
    if (!prevTitle || prevTitle === OPERATION_TEMPLATES[prev].defaultTitle) {
      setValue('title', OPERATION_TEMPLATES[next].defaultTitle, { shouldValidate: true });
    }
  };

  const toggleParcel = (id: string) => {
    const next = parcelIds.includes(id)
      ? parcelIds.filter((p) => p !== id)
      : [...parcelIds, id];
    setValue('parcelIds', next, { shouldValidate: true });
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    setRecordError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setRecordError('Tu navegador no soporta grabación de audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (err) {
      setRecordError(`No se pudo iniciar la grabación: ${(err as Error).message}`);
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
    setRecording(false);
  };

  const clearVoice = () => setVoiceBlob(undefined);

  const onSubmit = handleSubmit(async (data) => {
    const photoBlobs: Blob[] = [...existingPhotos, ...photoFiles];
    const payload = {
      date: data.date,
      parcelIds: data.parcelIds,
      type: data.type,
      title: data.title,
      description: data.description || undefined,
      durationMinutes: data.durationMinutes,
      weatherConditions: data.weatherConditions || undefined,
      costEur: data.costEur,
      photoBlobs: photoBlobs.length ? photoBlobs : undefined,
      voiceNoteBlob: voiceBlob,
    };
    let saved: FieldLogEntry;
    if (editing && existing) {
      await updateFieldLogEntry(existing.id, payload);
      saved = { ...existing, ...payload } as FieldLogEntry;
    } else {
      saved = await createFieldLogEntry(payload);
    }
    markCoachStale();
    if (onSaved) await onSaved(saved);
    reset();
    onOpenChange(false);
  });

  const voiceUrl = useMemo(
    () => (voiceBlob ? URL.createObjectURL(voiceBlob) : undefined),
    [voiceBlob],
  );
  useEffect(() => {
    if (!voiceUrl) return;
    return () => URL.revokeObjectURL(voiceUrl);
  }, [voiceUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar anotación' : 'Nueva anotación'}</DialogTitle>
          <DialogDescription>
            Registra la operación realizada. Los campos sugeridos se adaptan al tipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Tipo de operación</Label>
              <Select value={type} onValueChange={(v) => onTypeChange(v as OperationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {OPERATION_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                defaultValue={toDateInput(defaultValues.date)}
                {...register('date', { valueAsDate: true })}
              />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>
          </div>

          {template.hint && (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">
              {template.hint}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label>Parcelas</Label>
            {parcels.length === 0 ? (
              <p className="text-xs text-slate-500">
                No hay parcelas todavía. Crea una parcela antes de registrar operaciones.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {parcels.map((p) => {
                  const on = parcelIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParcel(p.id)}
                      className={
                        'rounded-full border px-3 py-1 text-xs transition ' +
                        (on
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400')
                      }
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.parcelIds && (
              <p className="text-xs text-red-600">{errors.parcelIds.message as string}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={4} {...register('description')} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {template.suggestedFields.includes('durationMinutes') && (
              <div className="grid gap-1.5">
                <Label htmlFor="durationMinutes">Duración (min)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  step="5"
                  {...register('durationMinutes', { setValueAs: numberOrUndef })}
                />
              </div>
            )}
            {template.suggestedFields.includes('weatherConditions') && (
              <div className="grid gap-1.5">
                <Label htmlFor="weatherConditions">Condiciones meteo</Label>
                <Input id="weatherConditions" {...register('weatherConditions')} />
              </div>
            )}
            {template.suggestedFields.includes('costEur') && (
              <div className="grid gap-1.5">
                <Label htmlFor="costEur">Coste (€)</Label>
                <Input
                  id="costEur"
                  type="number"
                  step="0.01"
                  {...register('costEur', { setValueAs: numberOrUndef })}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Fotos</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotoChange}
              className="text-sm"
            />
            {(existingPhotos.length > 0 || photoFiles.length > 0) && (
              <ul className="flex flex-wrap gap-2">
                {existingPhotos.map((b, i) => (
                  <PhotoThumb
                    key={`ex-${i}`}
                    blob={b}
                    onRemove={() => removeExistingPhoto(i)}
                  />
                ))}
                {photoFiles.map((f, i) => (
                  <PhotoThumb
                    key={`new-${i}`}
                    blob={f}
                    label={f.name}
                    onRemove={() => removePhoto(i)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Nota de voz</Label>
            <div className="flex flex-wrap items-center gap-2">
              {!recording ? (
                <Button type="button" variant="outline" size="sm" onClick={startRecording}>
                  Grabar
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={stopRecording}>
                  Detener
                </Button>
              )}
              {voiceBlob && voiceUrl && !recording && (
                <>
                  <audio controls src={voiceUrl} className="h-8" />
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={clearVoice}
                  >
                    Eliminar
                  </button>
                </>
              )}
              {recording && (
                <span className="text-xs text-red-600">● Grabando…</span>
              )}
            </div>
            {recordError && <p className="text-xs text-red-600">{recordError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Guardar anotación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PhotoThumb({
  blob,
  label,
  onRemove,
}: {
  blob: Blob;
  label?: string;
  onRemove: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <li className="group relative">
      <img
        src={url}
        alt={label ?? 'Foto'}
        className="h-16 w-16 rounded-md object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 hidden rounded-full bg-red-600 px-1.5 text-xs text-white group-hover:block"
        aria-label="Eliminar"
      >
        ×
      </button>
    </li>
  );
}

function numberOrUndef(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}
