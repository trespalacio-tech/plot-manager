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
import { farmSchema, type FarmFormValues } from '@/lib/validators/farm';
import type { Farm } from '@/lib/db/types';
import { createFarm, updateFarm } from '@/lib/db/repos';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm?: Farm;
  onSaved?: (farm: Farm | { id: string }) => void;
}

export function FarmDialog({ open, onOpenChange, farm, onSaved }: Props) {
  const editing = Boolean(farm);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
    values: {
      name: farm?.name ?? '',
      municipality: farm?.municipality ?? '',
      province: farm?.province ?? 'Burgos',
      altitudeM: farm?.altitudeM,
      centerLat: farm?.centerLat,
      centerLng: farm?.centerLng,
      notes: farm?.notes ?? '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (editing && farm) {
      await updateFarm(farm.id, data);
      onSaved?.({ id: farm.id });
    } else {
      const created = await createFarm(data);
      onSaved?.(created);
    }
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar finca' : 'Nueva finca'}</DialogTitle>
          <DialogDescription>
            Datos básicos. Podrás añadir parcelas, variedades y análisis después.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} autoFocus />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="municipality">Municipio</Label>
              <Input id="municipality" {...register('municipality')} />
              {errors.municipality && (
                <p className="text-xs text-red-600">{errors.municipality.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" {...register('province')} />
              {errors.province && (
                <p className="text-xs text-red-600">{errors.province.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-3 sm:gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="altitudeM">Altitud (m)</Label>
              <Input
                id="altitudeM"
                type="number"
                {...register('altitudeM', { valueAsNumber: true, setValueAs: numberOrUndef })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="centerLat">Lat centro</Label>
              <Input
                id="centerLat"
                type="number"
                step="0.0001"
                {...register('centerLat', { setValueAs: numberOrUndef })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="centerLng">Lng centro</Label>
              <Input
                id="centerLng"
                type="number"
                step="0.0001"
                {...register('centerLng', { setValueAs: numberOrUndef })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Guardar' : 'Crear finca'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function numberOrUndef(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}
