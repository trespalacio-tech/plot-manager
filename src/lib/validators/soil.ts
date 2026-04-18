import { z } from 'zod';

export const samplingMethodEnum = z.enum(['COMPOSITE', 'ZONAL', 'GRID']);

const optPct = z.number().min(0, 'No puede ser negativo.').max(100, 'Máximo 100.').optional();
const optPpm = z.number().min(0, 'No puede ser negativo.').max(100000, 'Valor fuera de rango.').optional();
const optPh = z.number().min(1, 'pH fuera de rango.').max(14, 'pH fuera de rango.').optional();
const optEc = z.number().min(0).max(30).optional();
const optBulk = z.number().min(0.2).max(3).optional();
const optCount = z.number().min(0).max(100000).optional();

export const soilSampleSchema = z
  .object({
    samplingDate: z.date(),
    depthCmFrom: z.number().min(0).max(500),
    depthCmTo: z.number().min(1).max(500),
    samplingMethod: samplingMethodEnum,
    samplePointsCount: z.number().int().min(1).max(1000).optional(),
    labName: z.string().trim().max(200).optional(),
    labReportId: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.depthCmTo > v.depthCmFrom, {
    path: ['depthCmTo'],
    message: 'La profundidad final debe ser mayor que la inicial.',
  });

export const soilAnalysisSchema = z.object({
  textureSandPct: optPct,
  textureSiltPct: optPct,
  textureClayPct: optPct,
  bulkDensityGCm3: optBulk,
  waterHoldingCapacityPct: optPct,
  infiltrationRateMmH: z.number().min(0).max(10000).optional(),
  aggregateStabilityPct: optPct,

  phWater: optPh,
  phKcl: optPh,
  ecDsM: optEc,
  organicMatterPct: z.number().min(0, 'No puede ser negativo.').max(40),
  totalNitrogenPct: z.number().min(0).max(10).optional(),
  cecMeq100g: z.number().min(0).max(200).optional(),

  pOlsenPpm: optPpm,
  pBrayPpm: optPpm,
  kExchangeablePpm: optPpm,
  caExchangeablePpm: optPpm,
  mgExchangeablePpm: optPpm,
  naExchangeablePpm: optPpm,

  fePpm: optPpm,
  mnPpm: optPpm,
  znPpm: optPpm,
  cuPpm: optPpm,
  bPpm: optPpm,

  totalCarbonatesPct: optPct,
  activeLimestonePct: optPct,

  microbialBiomassCMgKg: optPpm,
  basalRespirationMgCo2KgDay: optPpm,
  earthwormsCountM2: optCount,
  haneyTestScore: z.number().min(0).max(50).optional(),
});

export type SoilSampleFormValues = z.infer<typeof soilSampleSchema>;
export type SoilAnalysisFormValues = z.infer<typeof soilAnalysisSchema>;
