export type CoverObjective =
  | 'NITROGEN_FIXATION'
  | 'BIOMASS'
  | 'SOIL_STRUCTURE'
  | 'POLLINATORS'
  | 'PEST_REPELLENT'
  | 'MIXED';

export interface CoverCropMix {
  id: string;
  name: string;
  recipe: { species: string; kgPerHa: number }[];
  sowingWindowStartDoy: number;
  sowingWindowEndDoy: number;
  primaryObjective: CoverObjective;
  suitableForBurgos: boolean;
  irrigationDependent: boolean;
  notes: string;
  references?: string[];
}

export const COVER_MIXES: CoverCropMix[] = [
  {
    id: 'veza-avena-yeros',
    name: 'Veza + Avena + Yeros (otoñal clásica)',
    recipe: [
      { species: 'Veza común (Vicia sativa)', kgPerHa: 25 },
      { species: 'Avena (Avena sativa)', kgPerHa: 40 },
      { species: 'Yeros (Vicia ervilia)', kgPerHa: 10 },
    ],
    sowingWindowStartDoy: 263, // 20-sep
    sowingWindowEndDoy: 314, // 10-nov
    primaryObjective: 'NITROGEN_FIXATION',
    suitableForBurgos: true,
    irrigationDependent: false,
    notes:
      'Mezcla de referencia para Burgos. Veza fija N, avena estructura, yeros aportan biomasa pivotante. Inocular Rhizobium si es primera vez.',
    references: ['MAPA — Cubiertas vegetales para frutales y viñedo'],
  },
  {
    id: 'centeno-vicia-puro',
    name: 'Centeno + Vicia (alto carbono)',
    recipe: [
      { species: 'Centeno (Secale cereale)', kgPerHa: 60 },
      { species: 'Veza vellosa (Vicia villosa)', kgPerHa: 25 },
    ],
    sowingWindowStartDoy: 263,
    sowingWindowEndDoy: 304,
    primaryObjective: 'BIOMASS',
    suitableForBurgos: true,
    irrigationDependent: false,
    notes:
      'Genera 6-9 t/ha de biomasa. Ideal previo a rolado: el centeno lignifica y la veza aporta N. Excelente mulch vivo.',
  },
  {
    id: 'facelia-trebol-mostaza',
    name: 'Facelia + Trébol blanco + Mostaza (florales)',
    recipe: [
      { species: 'Facelia (Phacelia tanacetifolia)', kgPerHa: 6 },
      { species: 'Trébol blanco (Trifolium repens)', kgPerHa: 4 },
      { species: 'Mostaza blanca (Sinapis alba)', kgPerHa: 8 },
    ],
    sowingWindowStartDoy: 60, // 1-mar
    sowingWindowEndDoy: 105, // 15-abr
    primaryObjective: 'POLLINATORS',
    suitableForBurgos: true,
    irrigationDependent: true,
    notes:
      'Floración escalonada marzo-julio. Facelia atrae sírfidos, trébol mantiene cobertura. Mostaza biofumiga ligeramente.',
  },
  {
    id: 'gramineas-permanente',
    name: 'Gramíneas permanentes (calle de viñedo)',
    recipe: [
      { species: 'Festuca arundinacea', kgPerHa: 20 },
      { species: 'Lolium perenne enano', kgPerHa: 10 },
      { species: 'Trébol blanco enano', kgPerHa: 4 },
    ],
    sowingWindowStartDoy: 263,
    sowingWindowEndDoy: 304,
    primaryObjective: 'SOIL_STRUCTURE',
    suitableForBurgos: true,
    irrigationDependent: false,
    notes:
      'Cobertura permanente entre filas de viña. Resistente a tránsito de maquinaria. Siegas 2-3 al año, deja restos.',
  },
  {
    id: 'leguminosas-primaverales',
    name: 'Trébol subterráneo + Esparceta',
    recipe: [
      { species: 'Trébol subterráneo (Trifolium subterraneum)', kgPerHa: 8 },
      { species: 'Esparceta (Onobrychis viciifolia)', kgPerHa: 30 },
    ],
    sowingWindowStartDoy: 263,
    sowingWindowEndDoy: 305,
    primaryObjective: 'NITROGEN_FIXATION',
    suitableForBurgos: true,
    irrigationDependent: false,
    notes:
      'Esparceta es perenne, ideal para taludes y bordes. Trébol subterráneo se autosiembra. Apícola.',
  },
  {
    id: 'crucifiras-biofumigacion',
    name: 'Mezcla biofumigante (rabaní + mostaza)',
    recipe: [
      { species: 'Rábano forrajero (Raphanus sativus)', kgPerHa: 12 },
      { species: 'Mostaza parda (Brassica juncea)', kgPerHa: 10 },
    ],
    sowingWindowStartDoy: 232, // 20-ago
    sowingWindowEndDoy: 273, // 30-sep
    primaryObjective: 'PEST_REPELLENT',
    suitableForBurgos: true,
    irrigationDependent: true,
    notes:
      'Útil para preparar suelo en replante. Triturar y enterrar al inicio de floración para liberar glucosinolatos.',
  },
];

export function listCoverMixes(filter?: {
  objective?: CoverObjective;
  query?: string;
}): CoverCropMix[] {
  return COVER_MIXES.filter((m) => {
    if (filter?.objective && m.primaryObjective !== filter.objective) return false;
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      const hay = `${m.name} ${m.notes} ${m.recipe.map((r) => r.species).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getCoverMix(id: string): CoverCropMix | undefined {
  return COVER_MIXES.find((m) => m.id === id);
}
