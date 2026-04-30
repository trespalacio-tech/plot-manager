import type {
  CropType,
  IrrigationType,
  ParcelStatus,
  PrimarySpecies,
} from './types';

export const CROP_LABELS: Record<CropType, string> = {
  FRUIT_TREE: 'Frutal',
  NUT_TREE: 'Frutos secos',
  VINEYARD: 'Viñedo',
  MIXED: 'Mixto',
};

export const PARCEL_STATUS_LABELS: Record<ParcelStatus, string> = {
  DESIGN: 'Diseño',
  TRANSITION: 'Transición',
  REGENERATIVE: 'Regenerativa',
};

export const IRRIGATION_LABELS: Record<IrrigationType, string> = {
  RAINFED: 'Secano',
  DRIP: 'Goteo',
  MICROSPRINKLER: 'Microaspersión',
  FLOOD: 'Inundación',
};

export const PRIMARY_SPECIES_LABELS: Record<PrimarySpecies, string> = {
  almendro: 'Almendro',
  nogal: 'Nogal',
  avellano: 'Avellano',
  pistacho: 'Pistacho',
  manzano: 'Manzano',
  peral: 'Peral',
  cerezo: 'Cerezo',
  membrillero: 'Membrillero',
  tempranillo: 'Tempranillo',
};
