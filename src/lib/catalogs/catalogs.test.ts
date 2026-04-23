import { describe, expect, it } from 'vitest';
import {
  COVER_MIXES,
  INPUTS,
  VARIETIES,
  getCoverMix,
  getInput,
  getVariety,
  listCoverMixes,
  listInputs,
  listVarieties,
} from './index';

describe('VARIETIES catalog', () => {
  it('tiene IDs únicos', () => {
    const ids = VARIETIES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marca cítricos como no aptos para Burgos', () => {
    const citrus = VARIETIES.find((v) => v.species === 'Citrus spp.');
    expect(citrus?.suitableForBurgos).toBe(false);
  });

  it('todos los almendros recomendados son extra-tardíos', () => {
    const almonds = VARIETIES.filter(
      (v) => v.species === 'Prunus dulcis' && v.suitableForBurgos,
    );
    expect(almonds.length).toBeGreaterThan(0);
    almonds.forEach((a) => expect(a.floweringPeriod).toBe('EXTRA_LATE'));
  });

  it('listVarieties filtra por especie y por texto', () => {
    const malus = listVarieties({ species: 'Malus domestica' });
    expect(malus.length).toBeGreaterThan(0);
    malus.forEach((v) => expect(v.species).toBe('Malus domestica'));

    const search = listVarieties({ query: 'tempranillo' });
    expect(search.some((v) => v.cultivar.includes('Tempranillo'))).toBe(true);
  });

  it('listVarieties suitableOnly oculta los bloqueados', () => {
    const all = listVarieties();
    const suitable = listVarieties({ suitableOnly: true });
    expect(all.length).toBeGreaterThan(suitable.length);
  });

  it('getVariety devuelve por ID', () => {
    expect(getVariety('vitis-tempranillo')?.cultivar).toMatch(/Tempranillo/);
    expect(getVariety('no-existe')).toBeUndefined();
  });
});

describe('COVER_MIXES catalog', () => {
  it('tiene IDs únicos', () => {
    const ids = COVER_MIXES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todas las recetas tienen al menos una especie con kg/ha > 0', () => {
    for (const mix of COVER_MIXES) {
      expect(mix.recipe.length).toBeGreaterThan(0);
      mix.recipe.forEach((r) => expect(r.kgPerHa).toBeGreaterThan(0));
    }
  });

  it('ventanas DOY válidas (1-366)', () => {
    for (const mix of COVER_MIXES) {
      expect(mix.sowingWindowStartDoy).toBeGreaterThanOrEqual(1);
      expect(mix.sowingWindowStartDoy).toBeLessThanOrEqual(366);
      expect(mix.sowingWindowEndDoy).toBeGreaterThanOrEqual(1);
      expect(mix.sowingWindowEndDoy).toBeLessThanOrEqual(366);
    }
  });

  it('listCoverMixes filtra por objetivo', () => {
    const nFix = listCoverMixes({ objective: 'NITROGEN_FIXATION' });
    expect(nFix.length).toBeGreaterThan(0);
    nFix.forEach((m) => expect(m.primaryObjective).toBe('NITROGEN_FIXATION'));
  });

  it('getCoverMix devuelve por ID', () => {
    expect(getCoverMix('veza-avena-yeros')?.name).toMatch(/Veza/);
    expect(getCoverMix('no-existe')).toBeUndefined();
  });
});

describe('INPUTS catalog', () => {
  it('tiene IDs únicos', () => {
    const ids = INPUTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos certificados ecológicos por construcción', () => {
    INPUTS.forEach((i) => expect(i.organicCertified).toBe(true));
  });

  it('cobre tiene restricción anual documentada', () => {
    const cobre = INPUTS.find((i) => i.id === 'cobre-bordeles');
    expect(cobre?.restrictions).toMatch(/4 kg/);
  });

  it('listInputs filtra por tipo y por texto', () => {
    const fungicidas = listInputs({ type: 'FUNGICIDE' });
    expect(fungicidas.length).toBeGreaterThan(0);
    fungicidas.forEach((i) => expect(i.type).toBe('FUNGICIDE'));

    const search = listInputs({ query: 'carpocapsa' });
    expect(search.length).toBeGreaterThan(0);
  });

  it('getInput devuelve por ID', () => {
    expect(getInput('azufre-mojable')?.name).toMatch(/Azufre/);
    expect(getInput('no-existe')).toBeUndefined();
  });
});
