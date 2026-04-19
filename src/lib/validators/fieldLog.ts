import { z } from 'zod';

export const operationTypeEnum = z.enum([
  'PRUNING',
  'MOWING',
  'MULCHING',
  'COMPOSTING',
  'COVER_CROP_SOWING',
  'COVER_CROP_TERMINATION',
  'IRRIGATION',
  'FERTIGATION',
  'PEST_TREATMENT',
  'DISEASE_TREATMENT',
  'MONITORING',
  'PHENOLOGY_OBSERVATION',
  'HARVEST',
  'SOIL_WORK',
  'BIODIVERSITY_INSTALL',
  'PLANTING',
  'REPLANTING',
  'OTHER',
]);

export const fieldLogSchema = z.object({
  date: z.date(),
  parcelIds: z.array(z.string().min(1)).min(1, 'Selecciona al menos una parcela.'),
  type: operationTypeEnum,
  title: z.string().trim().min(1, 'Indica un título.').max(200),
  description: z.string().trim().max(4000).optional(),
  durationMinutes: z.number().min(0).max(10000).optional(),
  weatherConditions: z.string().trim().max(200).optional(),
  costEur: z.number().min(0).max(100000).optional(),
});

export type FieldLogFormValues = z.infer<typeof fieldLogSchema>;
