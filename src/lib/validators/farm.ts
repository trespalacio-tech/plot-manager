import { z } from 'zod';

export const farmSchema = z.object({
  name: z.string().trim().min(1, 'Indica un nombre para la finca.'),
  municipality: z.string().trim().min(1, 'Indica el municipio.'),
  province: z.string().trim().min(1, 'Indica la provincia.'),
  altitudeM: z.number().int().min(0).max(3500).optional(),
  centerLat: z.number().gte(-90).lte(90).optional(),
  centerLng: z.number().gte(-180).lte(180).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type FarmFormValues = z.infer<typeof farmSchema>;
