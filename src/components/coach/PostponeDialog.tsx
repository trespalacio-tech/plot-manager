import { useEffect, useState } from 'react';
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
import type { Task } from '@/lib/db/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onConfirm: (date: Date, reason?: string) => Promise<void> | void;
}

const MS_DAY = 24 * 60 * 60 * 1000;

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

const QUICK_CHIPS: { label: string; days: number }[] = [
  { label: 'Mañana', days: 1 },
  { label: 'En 3 días', days: 3 },
  { label: '+1 semana', days: 7 },
  { label: '+2 semanas', days: 14 },
  { label: '+1 mes', days: 30 },
];

export function PostponeDialog({ open, onOpenChange, task, onConfirm }: Props): JSX.Element {
  const [iso, setIso] = useState<string>(toIsoDate(new Date(Date.now() + 7 * MS_DAY)));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = task?.scheduledFor ?? new Date();
    setIso(toIsoDate(new Date(base.getTime() + 7 * MS_DAY)));
    setReason('');
  }, [open, task?.id, task?.scheduledFor]);

  const onChip = (days: number) => {
    const base = task?.scheduledFor ?? new Date();
    setIso(toIsoDate(new Date(base.getTime() + days * MS_DAY)));
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await onConfirm(fromIsoDate(iso), reason.trim() || undefined);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Posponer tarea</DialogTitle>
          <DialogDescription>
            {task?.title ?? 'Elige una nueva fecha y, si quieres, un motivo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((c) => (
              <Button
                key={c.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChip(c.days)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="postpone-date">Nueva fecha</Label>
            <Input
              id="postpone-date"
              type="date"
              value={iso}
              onChange={(e) => setIso(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="postpone-reason">Motivo (opcional)</Label>
            <Textarea
              id="postpone-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="p. ej. lluvia prevista, falta material…"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting || !iso}
            onClick={() => void onSubmit()}
          >
            {submitting ? 'Guardando…' : 'Posponer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
