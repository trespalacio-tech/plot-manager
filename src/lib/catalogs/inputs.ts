export type InputType =
  | 'FERTILIZER'
  | 'AMENDMENT'
  | 'BIOSTIMULANT'
  | 'FUNGICIDE'
  | 'INSECTICIDE'
  | 'INOCULANT'
  | 'ATTRACTANT'
  | 'OTHER';

export interface OrganicInput {
  id: string;
  name: string;
  type: InputType;
  activeIngredient?: string;
  formulation?: string;
  organicCertified: true;
  registrationNumber?: string;
  allowedCrops: string[];
  restrictions?: string;
  preHarvestIntervalDays?: number;
  notes?: string;
  scientificReferences?: string[];
}

export const INPUTS: OrganicInput[] = [
  {
    id: 'cobre-bordeles',
    name: 'Caldo bordelés (sulfato de cobre + cal)',
    type: 'FUNGICIDE',
    activeIngredient: 'Sulfato de cobre pentahidratado',
    formulation: 'Polvo mojable',
    organicCertified: true,
    allowedCrops: ['Vid', 'Frutales de pepita y hueso', 'Olivar'],
    restrictions:
      'Máximo 4 kg Cu metal/ha/año (media móvil 7 años). Reglamento UE 2018/1981. No usar > 28 °C.',
    preHarvestIntervalDays: 21,
    notes:
      'Mildiu en vid, abolladura en melocotonero, moteado en manzano. Dosis típica 200-400 g Cu/ha por tratamiento.',
    scientificReferences: ['Reglamento UE 2018/1981 sobre límites de cobre.'],
  },
  {
    id: 'azufre-mojable',
    name: 'Azufre mojable',
    type: 'FUNGICIDE',
    activeIngredient: 'Azufre elemental 80 %',
    formulation: 'Polvo mojable',
    organicCertified: true,
    allowedCrops: ['Vid', 'Frutales', 'Hortícolas'],
    restrictions: 'No mezclar con aceites. Evitar > 28 °C: fitotoxicidad.',
    preHarvestIntervalDays: 5,
    notes: 'Oídio en vid y manzano, eficacia probada. Dosis 3-6 kg/ha.',
  },
  {
    id: 'bt-kurstaki',
    name: 'Bacillus thuringiensis var. kurstaki',
    type: 'INSECTICIDE',
    activeIngredient: 'Bt kurstaki',
    formulation: 'Polvo mojable o líquido',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Hortícolas', 'Vid'],
    restrictions: 'Aplicar al atardecer (UV degrada). Eficacia limitada > L3.',
    preHarvestIntervalDays: 0,
    notes:
      'Lepidópteros: carpocapsa (bajo umbral), polilla del racimo, lobesia. Específico, sin efecto en auxiliares.',
    scientificReferences: ['IPM Europe — Lepidoptera management guidelines.'],
  },
  {
    id: 'cpgv-granulovirus',
    name: 'Granulovirus de carpocapsa (CpGV)',
    type: 'INSECTICIDE',
    activeIngredient: 'Cydia pomonella granulovirus',
    formulation: 'Suspensión concentrada',
    organicCertified: true,
    allowedCrops: ['Manzano', 'Peral', 'Nogal'],
    restrictions: 'Aplicar en eclosión (200-250 GDD desde primer vuelo). Repetir cada 7-10 días.',
    preHarvestIntervalDays: 0,
    notes:
      'Específico para carpocapsa. Combinar con confusión sexual: estrategia robusta y selectiva.',
    scientificReferences: ['Lacey et al. 2008 — CpGV for codling moth control.'],
  },
  {
    id: 'feromona-isomate',
    name: 'Difusor confusión sexual carpocapsa (Isomate C+)',
    type: 'ATTRACTANT',
    activeIngredient: 'Codlemone (E,E-8,10-dodecadien-1-ol)',
    formulation: 'Difusor pasivo',
    organicCertified: true,
    allowedCrops: ['Manzano', 'Peral', 'Nogal'],
    restrictions: 'Densidad 500-600 difusores/ha. Refuerzo perimetral 15-20 %.',
    notes:
      'Colocar antes del primer vuelo (1ª-2ª semana abril en Burgos). Una sola aplicación cubre toda la temporada.',
    scientificReferences: ['Ioriatti et al. 2019 — Codling moth mating disruption.'],
  },
  {
    id: 'caolin',
    name: 'Caolín calcinado (Surround / similar)',
    type: 'INSECTICIDE',
    activeIngredient: 'Silicato de aluminio (caolín)',
    formulation: 'Polvo mojable',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Olivar', 'Vid'],
    restrictions: 'Lavar fruta antes de comercialización si quedan residuos visibles.',
    preHarvestIntervalDays: 0,
    notes:
      'Repelente físico para mosca del olivo, psila del peral, carpocapsa. Reduce golpe de calor.',
  },
  {
    id: 'jabon-potasico',
    name: 'Jabón potásico',
    type: 'INSECTICIDE',
    activeIngredient: 'Sales potásicas de ácidos grasos',
    formulation: 'Líquido concentrado',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Hortícolas', 'Vid', 'Ornamentales'],
    restrictions: 'Aplicar en horas frescas. No en plena floración.',
    preHarvestIntervalDays: 0,
    notes:
      'Pulgones, mosca blanca, cochinillas inmaduras. Acción por contacto, sin residuo.',
  },
  {
    id: 'beauveria-bassiana',
    name: 'Beauveria bassiana',
    type: 'INSECTICIDE',
    activeIngredient: 'Beauveria bassiana cepa ATCC 74040',
    formulation: 'Polvo mojable',
    organicCertified: true,
    allowedCrops: ['Vid', 'Frutales', 'Hortícolas'],
    restrictions: 'Necesita > 60 % HR para germinar. No combinar con fungicidas cúpricos.',
    preHarvestIntervalDays: 0,
    notes:
      'Hongo entomopatógeno: trips, mosca blanca, lobesia. Requiere humedad.',
  },
  {
    id: 'trichoderma',
    name: 'Trichoderma harzianum / asperellum',
    type: 'BIOSTIMULANT',
    activeIngredient: 'Trichoderma spp.',
    formulation: 'Polvo soluble',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Vid', 'Hortícolas'],
    notes:
      'Aplicación al suelo en plantación o tras poda invernal. Coloniza la raíz y compite con patógenos (Fusarium, Phytophthora).',
  },
  {
    id: 'compost-maduro',
    name: 'Compost maduro vegetal',
    type: 'AMENDMENT',
    activeIngredient: 'Materia orgánica estabilizada',
    organicCertified: true,
    allowedCrops: ['Todos'],
    notes:
      'C/N 10-14, olor terroso. Dosis 4-10 t/ha bajo copa. Consultar ficha "Aplicación de compost bajo copa".',
    scientificReferences: ['Bernal et al. 2009 — Composting of organic wastes.'],
  },
  {
    id: 'estiercol-compostado',
    name: 'Estiércol compostado de bovino/ovino',
    type: 'AMENDMENT',
    organicCertified: true,
    allowedCrops: ['Todos'],
    restrictions: 'Compostar > 60 días con fase termófila documentada. No aportar fresco.',
    notes:
      'Aporta MO + macronutrientes. Dosis 10-15 t/ha cada 2-3 años. Preferible en otoño.',
  },
  {
    id: 'harina-roca-basaltica',
    name: 'Harina de roca basáltica',
    type: 'AMENDMENT',
    organicCertified: true,
    allowedCrops: ['Todos'],
    notes:
      'Liberación lenta de Si, Ca, Mg y micros. Dosis 500-1000 kg/ha. Ideal mezclada con compost.',
  },
  {
    id: 'micorrizas',
    name: 'Inóculo micorrícico (Rhizophagus irregularis)',
    type: 'INOCULANT',
    activeIngredient: 'Esporas de Rhizophagus irregularis',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Vid', 'Hortícolas'],
    notes:
      'En plantación o trasplante: aplicar al hoyo. Mejora absorción de P y agua, especialmente en suelos pobres.',
  },
  {
    id: 'rhizobium-veza',
    name: 'Rhizobium leguminosarum (veza/guisante)',
    type: 'INOCULANT',
    activeIngredient: 'Rhizobium leguminosarum',
    organicCertified: true,
    allowedCrops: ['Cubiertas leguminosas (veza, guisante, lentejas)'],
    notes:
      'Inocular semilla de veza o guisante si es primera vez en la parcela. 10-20 g/kg semilla.',
  },
  {
    id: 'extracto-ortiga',
    name: 'Purín / extracto fermentado de ortiga',
    type: 'BIOSTIMULANT',
    activeIngredient: 'Compuestos nitrogenados y siliceos de Urtica dioica',
    organicCertified: true,
    allowedCrops: ['Frutales', 'Hortícolas'],
    notes:
      'Estimulante foliar. Diluir 1:10. Útil en arranque vegetativo. Sustancia básica reconocida UE.',
    scientificReferences: ['Reg. UE — sustancias básicas: ortiga.'],
  },
  {
    id: 'bicarbonato-sodico',
    name: 'Hidrogenocarbonato sódico (sustancia básica)',
    type: 'FUNGICIDE',
    activeIngredient: 'NaHCO₃',
    organicCertified: true,
    allowedCrops: ['Vid', 'Frutales', 'Hortícolas'],
    restrictions: 'Sustancia básica UE 2015/2069. Dosis 5 g/L con humectante.',
    preHarvestIntervalDays: 1,
    notes: 'Oídio en vid, fresa y otros. Acción rápida.',
  },
];

export function listInputs(filter?: {
  type?: InputType;
  query?: string;
}): OrganicInput[] {
  return INPUTS.filter((i) => {
    if (filter?.type && i.type !== filter.type) return false;
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      const hay = `${i.name} ${i.activeIngredient ?? ''} ${i.notes ?? ''} ${i.allowedCrops.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getInput(id: string): OrganicInput | undefined {
  return INPUTS.find((i) => i.id === id);
}
