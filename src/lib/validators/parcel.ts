import { z } from 'zod';

export const parcelStatusEnum = z.enum(['DESIGN', 'TRANSITION', 'REGENERATIVE']);
export const cropTypeEnum = z.enum(['FRUIT_TREE', 'NUT_TREE', 'VINEYARD', 'MIXED']);
export const primarySpeciesEnum = z.enum([
  'almendro',
  'nogal',
  'avellano',
  'pistacho',
  'manzano',
  'peral',
  'cerezo',
  'membrillero',
  'tempranillo',
]);
export const irrigationEnum = z.enum([
  'RAINFED',
  'DRIP',
  'MICROSPRINKLER',
  'FLOOD',
]);
export const aspectEnum = z.enum([
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
  'FLAT',
]);

export const parcelSchema = z
  .object({
    name: z.string().trim().min(1, 'Indica un nombre para la parcela.'),
    code: z.string().trim().max(50).optional(),
    areaHa: z.number().positive('La superficie debe ser mayor que 0.').max(10000),
    slopePct: z.number().min(0).max(100).optional(),
    aspect: aspectEnum.optional(),
    status: parcelStatusEnum,
    cropType: cropTypeEnum,
    primarySpecies: primarySpeciesEnum.optional(),
    plantingYear: z.number().int().min(1900).max(2100).optional(),
    spacingRowM: z.number().positive().max(50).optional(),
    spacingPlantM: z.number().positive().max(50).optional(),
    rowOrientationDeg: z.number().min(0).max(360).optional(),
    irrigation: irrigationEnum,
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    // Frutos secos engloban 4 especies con manejo muy distinto: sin
    // especificar cuál, el Coach mezclaría tareas de almendro, nogal,
    // avellano y pistacho en la misma parcela.
    if (data.cropType === 'NUT_TREE' && !data.primarySpecies) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primarySpecies'],
        message: 'Elige la especie principal (almendro, nogal, avellano o pistacho).',
      });
    }
  });

export type ParcelFormValues = z.infer<typeof parcelSchema>;
