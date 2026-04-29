import type { Playbook } from '../types';
import { doy } from '../types';

export const vineTempranilloDesign: Playbook = {
  id: 'vine-tempranillo-design-burgos',
  title: 'Viñedo Tempranillo en diseño (Burgos)',
  description:
    'Planificación de plantación: análisis, portainjerto según caliza activa, marco, orientación y estructura hídrica.',
  cropType: 'VINEYARD',
  species: 'tempranillo',
  applicableStatuses: ['DESIGN'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'vine-design-soil-baseline',
      type: 'MONITORING',
      title: 'Análisis de suelo + caliza activa',
      rationale:
        'Caliza activa es el factor limitante principal. Analiza también K y Mg por la alta extracción del viñedo.',
      scientificBasis:
        'Bavaresco et al. (2010): selección de portainjerto depende sobre todo de caliza activa; complementar con CE y K.',
      windowStartDoy: doy(1, 10),
      windowEndDoy: doy(3, 10),
      priority: 'HIGH',
      guidanceKey: 'soil-baseline',
    },
    {
      id: 'vine-design-rootstock',
      type: 'PLANTING',
      title: 'Selección de portainjerto',
      rationale:
        'Elige portainjerto según caliza activa, vigor objetivo y estrés hídrico. En Burgos suelen convenir 110R, 140Ru o Fercal si caliza alta.',
      scientificBasis:
        'Ollat et al. (2016): portainjertos responden distinto a estrés hídrico y caliza; revisar compatibilidad con Tempranillo.',
      windowStartDoy: doy(10, 15),
      windowEndDoy: doy(12, 15),
      priority: 'HIGH',
    },
    {
      id: 'vine-design-row-orientation',
      type: 'PLANTING',
      title: 'Marco y orientación N-S preferente',
      rationale:
        'Orientación N-S equilibra insolación en ambas caras del racimo y reduce golpe de sol en lado oeste.',
      scientificBasis:
        'Intrigliolo et al. (2012): orientación N-S optimiza calidad en climas continentales con insolación alta.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(3, 15),
      priority: 'MEDIUM',
    },
    {
      id: 'vine-design-cover-pioneers',
      type: 'COVER_CROP_SOWING',
      title: 'Cubierta pionera mejoradora antes de plantar',
      rationale:
        'Mezcla de leguminosas + gramíneas + crucíferas un año antes para descompactar y aumentar MO.',
      scientificBasis:
        'Pardo et al. (2018): cubiertas pre-plantación en viñedo elevan MO 0.2-0.4 % en 12 meses.',
      windowStartDoy: doy(9, 15),
      windowEndDoy: doy(11, 15),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
  ],
};
