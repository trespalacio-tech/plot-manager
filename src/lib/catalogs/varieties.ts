export type FloweringPeriod = 'EARLY' | 'MID' | 'LATE' | 'EXTRA_LATE';
export type FrostRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RegionalVariety {
  id: string;
  species: string;
  commonName: string;
  cultivar: string;
  suitableForBurgos: boolean;
  coldHardinessZone?: string;
  lateFrostRisk: FrostRisk;
  floweringPeriod: FloweringPeriod;
  recommendedRootstocks?: string[];
  recommendedSpacingRowM?: [number, number];
  recommendedSpacingPlantM?: [number, number];
  pollinators?: string[];
  notes: string;
}

export const VARIETIES: RegionalVariety[] = [
  {
    id: 'malus-reineta-gris',
    species: 'Malus domestica',
    commonName: 'Manzano',
    cultivar: 'Reineta gris del Canadá',
    suitableForBurgos: true,
    coldHardinessZone: '6b-7a',
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'MID',
    recommendedRootstocks: ['MM-111', 'M-7'],
    recommendedSpacingRowM: [4, 5],
    recommendedSpacingPlantM: [3, 4],
    pollinators: ['Golden Delicious', 'Verde Doncella'],
    notes:
      'Variedad rústica tradicional, muy adaptada al clima continental. Conservación excelente. Tolera caliza activa elevada con MM-111.',
  },
  {
    id: 'malus-verde-doncella',
    species: 'Malus domestica',
    commonName: 'Manzano',
    cultivar: 'Verde Doncella',
    suitableForBurgos: true,
    lateFrostRisk: 'LOW',
    floweringPeriod: 'LATE',
    recommendedRootstocks: ['MM-111', 'M-7'],
    recommendedSpacingRowM: [4, 5],
    recommendedSpacingPlantM: [3, 4],
    pollinators: ['Reineta gris', 'Golden Delicious'],
    notes:
      'Variedad autóctona de Castilla, floración tardía que evita heladas. Perfil aromático característico, mercado de proximidad.',
  },
  {
    id: 'malus-golden',
    species: 'Malus domestica',
    commonName: 'Manzano',
    cultivar: 'Golden Delicious',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'MID',
    recommendedRootstocks: ['MM-111', 'M-9'],
    recommendedSpacingRowM: [3.5, 4],
    recommendedSpacingPlantM: [1.5, 3],
    pollinators: ['Reineta gris', 'Fuji'],
    notes:
      'Polinizador universal, vigor moderado. En suelo calizo elegir MM-111. Con M-9 requiere riego de apoyo.',
  },
  {
    id: 'pyrus-conferencia',
    species: 'Pyrus communis',
    commonName: 'Peral',
    cultivar: 'Conferencia',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'MID',
    recommendedRootstocks: ['Membrillero BA-29', 'OHF-87'],
    recommendedSpacingRowM: [4, 4.5],
    recommendedSpacingPlantM: [2.5, 3],
    pollinators: ['Blanquilla', 'Williams'],
    notes:
      'Buena adaptación, productiva y polinizador parcial. Sensible a fuego bacteriano: vigilancia primaveral.',
  },
  {
    id: 'prunus-burlat',
    species: 'Prunus avium',
    commonName: 'Cerezo',
    cultivar: 'Burlat',
    suitableForBurgos: true,
    lateFrostRisk: 'HIGH',
    floweringPeriod: 'EARLY',
    recommendedRootstocks: ['Santa Lucía SL-64', 'Maxma 14'],
    recommendedSpacingRowM: [5, 6],
    recommendedSpacingPlantM: [4, 5],
    pollinators: ['Sunburst', 'Sweetheart'],
    notes:
      'Floración temprana → riesgo de heladas en Burgos. Plantar en zonas altas o con cobertura. Precoz y muy demandada.',
  },
  {
    id: 'prunus-sweetheart',
    species: 'Prunus avium',
    commonName: 'Cerezo',
    cultivar: 'Sweetheart',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'LATE',
    recommendedRootstocks: ['Maxma 14', 'Gisela 6'],
    recommendedSpacingRowM: [4.5, 5.5],
    recommendedSpacingPlantM: [3, 4],
    pollinators: ['Lapins (autofértil)', 'Sunburst'],
    notes:
      'Autofértil parcial, floración tardía: encaja bien en valle del Arlanza/Duero. Maduración de mediados de julio.',
  },
  {
    id: 'prunus-vairo',
    species: 'Prunus dulcis',
    commonName: 'Almendro',
    cultivar: 'Vairo',
    suitableForBurgos: true,
    lateFrostRisk: 'LOW',
    floweringPeriod: 'EXTRA_LATE',
    recommendedRootstocks: ['GF-677', 'Rootpac-R'],
    recommendedSpacingRowM: [5, 6],
    recommendedSpacingPlantM: [4, 5],
    pollinators: ['Soleta', 'Lauranne (autofértil)'],
    notes:
      'Floración extra-tardía: el único almendro recomendable para Burgos. Autocompatible parcial.',
  },
  {
    id: 'prunus-lauranne',
    species: 'Prunus dulcis',
    commonName: 'Almendro',
    cultivar: 'Lauranne',
    suitableForBurgos: true,
    lateFrostRisk: 'LOW',
    floweringPeriod: 'EXTRA_LATE',
    recommendedRootstocks: ['GF-677', 'Rootpac-R'],
    recommendedSpacingRowM: [5, 6],
    recommendedSpacingPlantM: [4, 5],
    notes:
      'Autofértil, productiva y de floración extra-tardía. Combina bien con Vairo o Penta para asegurar polinización.',
  },
  {
    id: 'juglans-chandler',
    species: 'Juglans regia',
    commonName: 'Nogal',
    cultivar: 'Chandler',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'LATE',
    recommendedRootstocks: ['RX-1', 'Paradox híbrido'],
    recommendedSpacingRowM: [8, 10],
    recommendedSpacingPlantM: [7, 9],
    pollinators: ['Franquette', 'Lara'],
    notes:
      'Productividad lateral elevada, calidad de cáscara. Sensible a heladas tardías intensas: evitar fondos de valle.',
  },
  {
    id: 'vitis-tempranillo',
    species: 'Vitis vinifera',
    commonName: 'Vid',
    cultivar: 'Tempranillo (Tinta del País)',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'MID',
    recommendedRootstocks: ['110R', '140Ru', '41B'],
    recommendedSpacingRowM: [2.5, 3],
    recommendedSpacingPlantM: [1.1, 1.4],
    notes:
      'Variedad emblemática Ribera del Duero. En suelo calizo > 30 % CaCO₃ usar 41B. Brotación temprana → riesgo helada.',
  },
  {
    id: 'vitis-albillo-mayor',
    species: 'Vitis vinifera',
    commonName: 'Vid',
    cultivar: 'Albillo Mayor',
    suitableForBurgos: true,
    lateFrostRisk: 'MEDIUM',
    floweringPeriod: 'MID',
    recommendedRootstocks: ['110R', '161-49', 'SO4'],
    recommendedSpacingRowM: [2.5, 3],
    recommendedSpacingPlantM: [1.1, 1.4],
    notes:
      'Blanca autóctona de Ribera del Duero, recuperada y muy bien valorada. Buena adaptación a terrenos pedregosos.',
  },
  {
    id: 'vitis-garnacha-tinta',
    species: 'Vitis vinifera',
    commonName: 'Vid',
    cultivar: 'Garnacha tinta',
    suitableForBurgos: true,
    lateFrostRisk: 'LOW',
    floweringPeriod: 'LATE',
    recommendedRootstocks: ['110R', '140Ru'],
    recommendedSpacingRowM: [2.5, 3],
    recommendedSpacingPlantM: [1, 1.3],
    notes:
      'Brotación tardía, evita heladas. Elevada tolerancia a sequía. Buena opción para vasos en secano.',
  },
  {
    id: 'corylus-avellano',
    species: 'Corylus avellana',
    commonName: 'Avellano',
    cultivar: 'Negret',
    suitableForBurgos: true,
    lateFrostRisk: 'HIGH',
    floweringPeriod: 'EARLY',
    recommendedSpacingRowM: [4.5, 5],
    recommendedSpacingPlantM: [3, 4],
    pollinators: ['Pauetet', 'Gironell'],
    notes:
      'Floración invernal: en Burgos solo en zonas abrigadas con baja amplitud térmica. Considerar microclima.',
  },
  {
    id: 'cydonia-membrillo',
    species: 'Cydonia oblonga',
    commonName: 'Membrillero',
    cultivar: 'Wranja',
    suitableForBurgos: true,
    lateFrostRisk: 'LOW',
    floweringPeriod: 'LATE',
    recommendedRootstocks: ['BA-29', 'Patrón propio'],
    recommendedSpacingRowM: [4, 5],
    recommendedSpacingPlantM: [3, 4],
    notes:
      'Floración tardía y rusticidad excelente. Tolera suelos arcillosos y caliza. Perfecto como polinizador-acompañante.',
  },
  {
    id: 'citrus-blocked',
    species: 'Citrus spp.',
    commonName: 'Cítricos',
    cultivar: '—',
    suitableForBurgos: false,
    lateFrostRisk: 'HIGH',
    floweringPeriod: 'EARLY',
    notes:
      'No recomendado en Burgos: heladas invernales por debajo de −5 °C dañan la planta. Si insistes: invernadero o muro sur con manta térmica.',
  },
];

export function listVarieties(filter?: {
  species?: string;
  suitableOnly?: boolean;
  query?: string;
}): RegionalVariety[] {
  return VARIETIES.filter((v) => {
    if (filter?.species && v.species !== filter.species) return false;
    if (filter?.suitableOnly && !v.suitableForBurgos) return false;
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      const hay = `${v.cultivar} ${v.commonName} ${v.species} ${v.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getVariety(id: string): RegionalVariety | undefined {
  return VARIETIES.find((v) => v.id === id);
}
