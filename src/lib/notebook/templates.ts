import type { OperationType } from '@/lib/db/types';

export interface OperationTemplate {
  type: OperationType;
  label: string;
  shortLabel?: string;
  defaultTitle: string;
  hint?: string;
  suggestedFields: Array<'durationMinutes' | 'weatherConditions' | 'costEur'>;
}

export const OPERATION_LABELS: Record<OperationType, string> = {
  PRUNING: 'Poda',
  MOWING: 'Siega',
  MULCHING: 'Acolchado',
  COMPOSTING: 'Compostaje / aporte de compost',
  COVER_CROP_SOWING: 'Siembra de cubierta',
  COVER_CROP_TERMINATION: 'Terminación de cubierta',
  IRRIGATION: 'Riego',
  FERTIGATION: 'Fertirrigación',
  PEST_TREATMENT: 'Tratamiento de plaga',
  DISEASE_TREATMENT: 'Tratamiento de enfermedad',
  MONITORING: 'Monitoreo',
  PHENOLOGY_OBSERVATION: 'Observación fenológica',
  HARVEST: 'Cosecha',
  SOIL_WORK: 'Labor de suelo',
  BIODIVERSITY_INSTALL: 'Instalación biodiversidad',
  PLANTING: 'Plantación',
  REPLANTING: 'Reposición de marras',
  OTHER: 'Otra',
};

export const OPERATION_TEMPLATES: Record<OperationType, OperationTemplate> = {
  PRUNING: {
    type: 'PRUNING',
    label: 'Poda',
    defaultTitle: 'Poda',
    hint: 'Anota si fue poda seca, en verde o de formación. Indica herramientas y si hubo desinfección entre árboles.',
    suggestedFields: ['durationMinutes', 'weatherConditions'],
  },
  MOWING: {
    type: 'MOWING',
    label: 'Siega',
    defaultTitle: 'Siega de cubierta',
    hint: 'Altura de corte, tipo de cubierta y si se dejó el mulch en superficie.',
    suggestedFields: ['durationMinutes'],
  },
  MULCHING: {
    type: 'MULCHING',
    label: 'Acolchado',
    defaultTitle: 'Aporte de acolchado',
    hint: 'Material (paja, restos de poda, astilla), grosor y superficie cubierta.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  COMPOSTING: {
    type: 'COMPOSTING',
    label: 'Compost',
    defaultTitle: 'Aporte de compost',
    hint: 'Dosis (t/ha), origen del compost, madurez estimada.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  COVER_CROP_SOWING: {
    type: 'COVER_CROP_SOWING',
    label: 'Siembra cubierta',
    defaultTitle: 'Siembra de cubierta vegetal',
    hint: 'Mezcla, dosis kg/ha, método (siembra directa, voleo).',
    suggestedFields: ['durationMinutes', 'weatherConditions', 'costEur'],
  },
  COVER_CROP_TERMINATION: {
    type: 'COVER_CROP_TERMINATION',
    label: 'Terminación cubierta',
    defaultTitle: 'Terminación de cubierta',
    hint: 'Método: rolado, siega + mulch, pastoreo.',
    suggestedFields: ['durationMinutes'],
  },
  IRRIGATION: {
    type: 'IRRIGATION',
    label: 'Riego',
    defaultTitle: 'Riego',
    hint: 'Duración, caudal, mm aplicados estimados.',
    suggestedFields: ['durationMinutes'],
  },
  FERTIGATION: {
    type: 'FERTIGATION',
    label: 'Fertirrigación',
    defaultTitle: 'Fertirrigación',
    hint: 'Producto autorizado, dosis por ha, motivo.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  PEST_TREATMENT: {
    type: 'PEST_TREATMENT',
    label: 'Plaga',
    defaultTitle: 'Tratamiento frente a plaga',
    hint: 'Producto (ecológico certificado), dosis, plazo de seguridad.',
    suggestedFields: ['durationMinutes', 'weatherConditions', 'costEur'],
  },
  DISEASE_TREATMENT: {
    type: 'DISEASE_TREATMENT',
    label: 'Enfermedad',
    defaultTitle: 'Tratamiento de enfermedad',
    hint: 'Producto (ecológico certificado), dosis, condiciones de aplicación.',
    suggestedFields: ['durationMinutes', 'weatherConditions', 'costEur'],
  },
  MONITORING: {
    type: 'MONITORING',
    label: 'Monitoreo',
    defaultTitle: 'Monitoreo',
    hint: 'Método (trampa, conteo visual), umbral, resultado.',
    suggestedFields: ['durationMinutes'],
  },
  PHENOLOGY_OBSERVATION: {
    type: 'PHENOLOGY_OBSERVATION',
    label: 'Fenología',
    defaultTitle: 'Observación fenológica',
    hint: 'Estadío BBCH, variedad observada.',
    suggestedFields: [],
  },
  HARVEST: {
    type: 'HARVEST',
    label: 'Cosecha',
    defaultTitle: 'Cosecha',
    hint: 'Variedad, kg recolectados, destino, calidad.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  SOIL_WORK: {
    type: 'SOIL_WORK',
    label: 'Labor de suelo',
    defaultTitle: 'Labor de suelo',
    hint: 'Apero (descompactador, rotovator), profundidad, motivo.',
    suggestedFields: ['durationMinutes'],
  },
  BIODIVERSITY_INSTALL: {
    type: 'BIODIVERSITY_INSTALL',
    label: 'Biodiversidad',
    defaultTitle: 'Actuación de biodiversidad',
    hint: 'Tipo (seto, caja nido, charca), especies, superficie o longitud.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  PLANTING: {
    type: 'PLANTING',
    label: 'Plantación',
    defaultTitle: 'Plantación',
    hint: 'Especie, variedad, portainjerto, plantas/ha.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  REPLANTING: {
    type: 'REPLANTING',
    label: 'Reposición',
    defaultTitle: 'Reposición de marras',
    hint: 'Nº plantas, motivo del fallo previo.',
    suggestedFields: ['durationMinutes', 'costEur'],
  },
  OTHER: {
    type: 'OTHER',
    label: 'Otra',
    defaultTitle: 'Nota de campo',
    hint: 'Describe libremente lo que quieras registrar.',
    suggestedFields: [],
  },
};

export const OPERATION_TYPES: OperationType[] = Object.keys(OPERATION_LABELS) as OperationType[];
