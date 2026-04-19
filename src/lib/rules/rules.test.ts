import { describe, expect, it } from 'vitest';
import type { Parcel, SoilAnalysis } from '@/lib/db/types';
import {
  fieldLogInactivity,
  seasonAlmondFrost,
  seasonAutumnCoverCrop,
  seasonSpringMulching,
  seasonSummerWater,
  seasonVineyardCluster,
  seasonVineyardFlowering,
  seasonWinterPheromones,
  seasonFruitCodlingMoth,
  soilAcidicPh,
  soilActiveLimestoneHigh,
  soilAlkalineChlorosis,
  soilCnHigh,
  soilLowK,
  soilLowOm,
  soilPExcess,
  soilStaleAnalysis,
  transitionDesignSetup,
  transitionYear1Review,
  transitionYear3Audit,
} from './catalog';
import type { RuleContext } from './types';

function parcel(overrides: Partial<Parcel> = {}): Parcel {
  const now = new Date('2026-04-15');
  return {
    id: 'p1',
    farmId: 'f1',
    createdAt: now,
    updatedAt: now,
    name: 'Parcela',
    areaHa: 1,
    status: 'TRANSITION',
    statusChangedAt: new Date('2024-04-01'),
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
    ...overrides,
  };
}

function analysis(overrides: Partial<SoilAnalysis> = {}): SoilAnalysis {
  const now = new Date();
  return {
    id: 'a1',
    createdAt: now,
    updatedAt: now,
    sampleId: 's1',
    organicMatterPct: 2.5,
    ...overrides,
  };
}

function ctx(overrides: Partial<RuleContext> = {}): RuleContext {
  const now = overrides.now ?? new Date('2026-04-15');
  const p = overrides.parcel ?? parcel();
  return {
    now,
    parcel: p,
    recentFieldLog: [],
    month: now.getMonth() + 1,
    doy: 105,
    yearsInCurrentStatus: 2,
    ...overrides,
  };
}

describe('reglas de suelo', () => {
  it('soil-low-om dispara cuando MO < 1.5 %', () => {
    const out = soilLowOm.evaluate(ctx({ latestSoilAnalysis: analysis({ organicMatterPct: 1.2 }) }));
    expect(out).toHaveLength(1);
    expect(out[0]!.kind).toBe('TASK');
    if (out[0]!.kind === 'TASK') {
      expect(out[0]!.operationType).toBe('COMPOSTING');
      expect(out[0]!.priority).toBe('MEDIUM');
    }
  });

  it('soil-low-om prioriza HIGH si MO < 1 %', () => {
    const out = soilLowOm.evaluate(ctx({ latestSoilAnalysis: analysis({ organicMatterPct: 0.8 }) }));
    expect(out[0]!.kind === 'TASK' && out[0]!.priority).toBe('HIGH');
  });

  it('soil-low-om no dispara cuando MO suficiente', () => {
    expect(soilLowOm.evaluate(ctx({ latestSoilAnalysis: analysis({ organicMatterPct: 2.1 }) }))).toEqual([]);
  });

  it('soil-acidic-ph dispara si pH < 6', () => {
    const out = soilAcidicPh.evaluate(ctx({ latestSoilAnalysis: analysis({ phWater: 5.4 }) }));
    expect(out).toHaveLength(1);
    expect(out[0]!.kind === 'TASK' && out[0]!.priority).toBe('HIGH');
  });

  it('soil-alkaline-chlorosis emite alerta + tarea con caliza alta', () => {
    const out = soilAlkalineChlorosis.evaluate(
      ctx({ latestSoilAnalysis: analysis({ phWater: 8.7, activeLimestonePct: 10 }) }),
    );
    expect(out.map((o) => o.kind).sort()).toEqual(['ALERT', 'TASK']);
  });

  it('soil-cn-high solo con C/N > 15', () => {
    expect(soilCnHigh.evaluate(ctx({ latestSoilAnalysis: analysis({ cnRatio: 14 }) }))).toEqual([]);
    expect(
      soilCnHigh.evaluate(ctx({ latestSoilAnalysis: analysis({ cnRatio: 16 }) })),
    ).toHaveLength(1);
  });

  it('soil-p-excess marca alerta con P Olsen > 50 ppm', () => {
    const out = soilPExcess.evaluate(ctx({ latestSoilAnalysis: analysis({ pOlsenPpm: 70 }) }));
    expect(out[0]!.kind).toBe('ALERT');
  });

  it('soil-low-k solo con K < 120 ppm', () => {
    expect(soilLowK.evaluate(ctx({ latestSoilAnalysis: analysis({ kExchangeablePpm: 150 }) }))).toEqual([]);
    expect(soilLowK.evaluate(ctx({ latestSoilAnalysis: analysis({ kExchangeablePpm: 80 }) }))).toHaveLength(1);
  });

  it('soil-active-limestone-high mensajes distintos frutal vs vid', () => {
    const fruit = soilActiveLimestoneHigh.evaluate(
      ctx({ latestSoilAnalysis: analysis({ activeLimestonePct: 14 }) }),
    );
    const vine = soilActiveLimestoneHigh.evaluate(
      ctx({
        parcel: parcel({ cropType: 'VINEYARD' }),
        latestSoilAnalysis: analysis({ activeLimestonePct: 14 }),
      }),
    );
    expect(fruit[0]!.kind === 'TASK' && fruit[0]!.scientificBasis).toContain('GF-677');
    expect(vine[0]!.kind === 'TASK' && vine[0]!.scientificBasis).toContain('Fercal');
  });

  it('soil-stale-analysis propone análisis inicial si no hay muestras', () => {
    const out = soilStaleAnalysis.evaluate(ctx());
    expect(out).toHaveLength(1);
    if (out[0]!.kind === 'TASK') {
      expect(out[0]!.title).toContain('referencia');
    }
  });

  it('soil-stale-analysis dispara si la muestra tiene > 3 años', () => {
    const oldDate = new Date('2022-01-01');
    const c = ctx({
      latestSoilSample: {
        id: 's1',
        createdAt: oldDate,
        updatedAt: oldDate,
        parcelId: 'p1',
        samplingDate: oldDate,
        depthCmFrom: 0,
        depthCmTo: 30,
        samplingMethod: 'COMPOSITE',
      },
      latestSoilAnalysis: analysis(),
    });
    const out = soilStaleAnalysis.evaluate(c);
    expect(out).toHaveLength(1);
  });

  it('soil-stale-analysis silencioso si la muestra es reciente', () => {
    const recent = new Date('2026-01-01');
    const c = ctx({
      latestSoilSample: {
        id: 's1',
        createdAt: recent,
        updatedAt: recent,
        parcelId: 'p1',
        samplingDate: recent,
        depthCmFrom: 0,
        depthCmTo: 30,
        samplingMethod: 'COMPOSITE',
      },
      latestSoilAnalysis: analysis(),
    });
    expect(soilStaleAnalysis.evaluate(c)).toEqual([]);
  });
});

describe('reglas estacionales y fenológicas', () => {
  it('season-winter-pheromones solo en feb-mar y frutal', () => {
    expect(
      seasonWinterPheromones.evaluate(
        ctx({ now: new Date('2026-02-15'), month: 2 }),
      ),
    ).toHaveLength(1);
    expect(
      seasonWinterPheromones.evaluate(
        ctx({ now: new Date('2026-04-15'), month: 4 }),
      ),
    ).toEqual([]);
    expect(
      seasonWinterPheromones.evaluate(
        ctx({
          now: new Date('2026-02-15'),
          month: 2,
          parcel: parcel({ cropType: 'VINEYARD' }),
        }),
      ),
    ).toEqual([]);
  });

  it('season-spring-mulching se salta si ya hay acolchado reciente', () => {
    const c = ctx({
      now: new Date('2026-05-20'),
      month: 5,
      recentFieldLog: [
        {
          id: 'x',
          createdAt: new Date(),
          updatedAt: new Date(),
          date: new Date('2026-05-10'),
          parcelIds: ['p1'],
          type: 'MULCHING',
          title: 'Acolchado',
        },
      ],
    });
    expect(seasonSpringMulching.evaluate(c)).toEqual([]);
  });

  it('season-summer-water omite parcelas de secano', () => {
    expect(
      seasonSummerWater.evaluate(
        ctx({
          now: new Date('2026-07-15'),
          month: 7,
          parcel: parcel({ irrigation: 'RAINFED' }),
        }),
      ),
    ).toEqual([]);
    expect(
      seasonSummerWater.evaluate(
        ctx({ now: new Date('2026-07-15'), month: 7 }),
      ),
    ).toHaveLength(1);
  });

  it('season-autumn-cover-crop solo octubre-noviembre y sin siembra reciente', () => {
    expect(
      seasonAutumnCoverCrop.evaluate(
        ctx({ now: new Date('2026-10-15'), month: 10 }),
      ),
    ).toHaveLength(1);
    expect(
      seasonAutumnCoverCrop.evaluate(
        ctx({
          now: new Date('2026-10-15'),
          month: 10,
          recentFieldLog: [
            {
              id: 'x',
              createdAt: new Date(),
              updatedAt: new Date(),
              date: new Date('2026-10-05'),
              parcelIds: ['p1'],
              type: 'COVER_CROP_SOWING',
              title: 'veza+avena',
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('season-almond-frost emite alerta en feb-mar con frutal', () => {
    const out = seasonAlmondFrost.evaluate(ctx({ now: new Date('2026-03-01'), month: 3 }));
    expect(out[0]?.kind).toBe('ALERT');
  });

  it('season-vineyard-flowering y cluster solo en vid', () => {
    expect(
      seasonVineyardFlowering.evaluate(
        ctx({ now: new Date('2026-05-25'), month: 5 }),
      ),
    ).toEqual([]);
    expect(
      seasonVineyardFlowering.evaluate(
        ctx({
          now: new Date('2026-05-25'),
          month: 5,
          parcel: parcel({ cropType: 'VINEYARD' }),
        }),
      ),
    ).toHaveLength(1);
    expect(
      seasonVineyardCluster.evaluate(
        ctx({
          now: new Date('2026-07-10'),
          month: 7,
          parcel: parcel({ cropType: 'VINEYARD' }),
        }),
      ),
    ).toHaveLength(1);
  });

  it('season-fruit-codling-moth solo jun-ago y frutal', () => {
    expect(
      seasonFruitCodlingMoth.evaluate(
        ctx({ now: new Date('2026-07-15'), month: 7 }),
      ),
    ).toHaveLength(1);
    expect(
      seasonFruitCodlingMoth.evaluate(
        ctx({
          now: new Date('2026-07-15'),
          month: 7,
          parcel: parcel({ cropType: 'VINEYARD' }),
        }),
      ),
    ).toEqual([]);
  });
});

describe('reglas de transición y cuaderno', () => {
  it('transition-design-setup solo en DESIGN', () => {
    expect(
      transitionDesignSetup.evaluate(
        ctx({ parcel: parcel({ status: 'DESIGN' }) }),
      ),
    ).toHaveLength(1);
    expect(
      transitionDesignSetup.evaluate(ctx({ parcel: parcel({ status: 'TRANSITION' }) })),
    ).toEqual([]);
  });

  it('transition-year1-review dispara entre 1 y 1.25 años', () => {
    expect(
      transitionYear1Review.evaluate(ctx({ yearsInCurrentStatus: 1.1 })),
    ).toHaveLength(1);
    expect(transitionYear1Review.evaluate(ctx({ yearsInCurrentStatus: 2 }))).toEqual([]);
    expect(transitionYear1Review.evaluate(ctx({ yearsInCurrentStatus: 0.5 }))).toEqual([]);
  });

  it('transition-year3-audit dispara a partir de 3 años', () => {
    expect(transitionYear3Audit.evaluate(ctx({ yearsInCurrentStatus: 3.1 }))).toHaveLength(1);
    expect(
      transitionYear3Audit.evaluate(
        ctx({
          yearsInCurrentStatus: 3.5,
          parcel: parcel({ status: 'REGENERATIVE' }),
        }),
      ),
    ).toEqual([]);
  });

  it('field-log-inactivity alerta si el último apunte es > 30 días', () => {
    const out = fieldLogInactivity.evaluate(
      ctx({
        now: new Date('2026-04-15'),
        lastFieldLogDate: new Date('2026-03-01'),
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.kind).toBe('ALERT');
  });

  it('field-log-inactivity silencioso con actividad reciente', () => {
    const out = fieldLogInactivity.evaluate(
      ctx({
        now: new Date('2026-04-15'),
        lastFieldLogDate: new Date('2026-04-10'),
      }),
    );
    expect(out).toEqual([]);
  });
});
