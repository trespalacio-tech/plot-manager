import { describe, expect, it } from 'vitest';
import type { SoilAnalysis } from '@/lib/db/types';
import {
  cnRatio,
  interpretSoilAnalysis,
  organicCarbonFromOM,
} from './soil';

function makeAnalysis(partial: Partial<SoilAnalysis>): SoilAnalysis {
  const now = new Date('2026-04-01');
  return {
    id: 'a1',
    sampleId: 's1',
    createdAt: now,
    updatedAt: now,
    organicMatterPct: partial.organicMatterPct ?? 2.0,
    ...partial,
  } as SoilAnalysis;
}

describe('organicCarbonFromOM', () => {
  it('aplica el factor de Van Bemmelen (1.724)', () => {
    expect(organicCarbonFromOM(1.724)).toBeCloseTo(1.0, 5);
    expect(organicCarbonFromOM(3.448)).toBeCloseTo(2.0, 5);
  });
});

describe('cnRatio', () => {
  it('devuelve undefined si no hay N', () => {
    expect(cnRatio(2, 0)).toBeUndefined();
  });
  it('calcula C/N dividiendo carbono orgánico por N total', () => {
    const cn = cnRatio(1.724, 0.1);
    expect(cn).toBeCloseTo(10, 5);
  });
});

describe('interpretSoilAnalysis — Burgos calizo típico', () => {
  it('marca pH 8.0 como alcalino habitual (OK)', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ phWater: 8.0, organicMatterPct: 2.0 }));
    const ph = r.params.find((p) => p.key === 'phWater');
    expect(ph?.level).toBe('OK');
    expect(ph?.band).toMatch(/alcalino/i);
  });

  it('marca pH 9.0 como extremo (ACTION)', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ phWater: 9.0 }));
    const ph = r.params.find((p) => p.key === 'phWater');
    expect(ph?.level).toBe('ACTION');
  });

  it('marca MO 0.8% como acción y emite recomendaciones de MO y cubierta', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ organicMatterPct: 0.8 }));
    const om = r.params.find((p) => p.key === 'organicMatterPct');
    expect(om?.level).toBe('ACTION');
    const titles = r.recommendations.map((x) => x.id);
    expect(titles).toContain('rec-om-boost');
    expect(titles).toContain('rec-cover-crop');
  });

  it('no recomienda MO cuando está en rango adecuado', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ organicMatterPct: 3.0 }));
    expect(r.recommendations.find((x) => x.id === 'rec-om-boost')).toBeUndefined();
  });

  it('caliza activa 14% en frutales sugiere portainjertos tolerantes', () => {
    const r = interpretSoilAnalysis(
      makeAnalysis({ activeLimestonePct: 14, organicMatterPct: 2 }),
      { cropType: 'FRUIT_TREE' },
    );
    const rec = r.recommendations.find((x) => x.id === 'rec-lime-rootstock');
    expect(rec).toBeDefined();
    expect(rec?.rationale).toMatch(/GF-677|OHxF|Krymsk/);
  });

  it('caliza activa 14% en viñedo cita portainjertos de vid', () => {
    const r = interpretSoilAnalysis(
      makeAnalysis({ activeLimestonePct: 14, organicMatterPct: 2 }),
      { cropType: 'VINEYARD' },
    );
    const rec = r.recommendations.find((x) => x.id === 'rec-lime-rootstock');
    expect(rec?.rationale).toMatch(/Fercal|41B/);
  });

  it('salinidad CE 3 dS/m dispara acción de riego', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ ecDsM: 3, organicMatterPct: 2 }));
    const rec = r.recommendations.find((x) => x.id === 'rec-salinity');
    expect(rec).toBeDefined();
    expect(rec?.priority).toBe('HIGH');
  });

  it('P Olsen 5 ppm dispara recomendación de fósforo', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ pOlsenPpm: 5, organicMatterPct: 2 }));
    expect(r.recommendations.find((x) => x.id === 'rec-phosphorus')).toBeDefined();
  });

  it('K 80 ppm dispara recomendación de potasio', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ kExchangeablePpm: 80, organicMatterPct: 2 }));
    expect(r.recommendations.find((x) => x.id === 'rec-potassium')).toBeDefined();
  });

  it('densidad 1.6 g/cm³ dispara descompactación', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ bulkDensityGCm3: 1.6, organicMatterPct: 2 }));
    expect(r.recommendations.find((x) => x.id === 'rec-compaction')).toBeDefined();
  });

  it('lombrices 20/m² dispara rec de biología', () => {
    const r = interpretSoilAnalysis(makeAnalysis({ earthwormsCountM2: 20, organicMatterPct: 2 }));
    expect(r.recommendations.find((x) => x.id === 'rec-biology')).toBeDefined();
  });

  it('resumen cuenta OK/WATCH/ACTION correctamente', () => {
    const r = interpretSoilAnalysis(
      makeAnalysis({
        phWater: 8.0,
        organicMatterPct: 0.8,
        activeLimestonePct: 14,
      }),
      { cropType: 'FRUIT_TREE' },
    );
    const sum = r.summary.ok + r.summary.watch + r.summary.action;
    expect(sum).toBe(r.params.length);
    expect(r.summary.action).toBeGreaterThanOrEqual(2);
  });

  it('C/N = 18 dispara rec de inmovilización', () => {
    const r = interpretSoilAnalysis(
      makeAnalysis({ organicMatterPct: 1.8, totalNitrogenPct: 0.058 }),
    );
    const cn = r.params.find((p) => p.key === 'cnRatio');
    expect(cn?.level).toBe('ACTION');
    expect(r.recommendations.find((x) => x.id === 'rec-cn')).toBeDefined();
  });
});
