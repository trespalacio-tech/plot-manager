import type { Playbook } from '../types';
import { doy } from '../types';

export const appleDesign: Playbook = {
  id: 'apple-design-burgos',
  title: 'Manzano en diseño (Burgos)',
  description:
    'Calendario previo a la plantación: análisis del sitio, diseño agroecológico, preparación del suelo y elección varietal.',
  cropType: 'FRUIT_TREE',
  species: 'manzano',
  applicableStatuses: ['DESIGN'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'apple-design-soil-baseline',
      type: 'MONITORING',
      title: 'Análisis de suelo de referencia',
      rationale:
        'Antes de plantar, establece línea base química, física y biológica (0-30 y 30-60 cm) con muestras compuestas por zona homogénea.',
      scientificBasis:
        'SARE / USDA Soil Health Assessment: dos profundidades + indicadores físico-biológicos evitan decisiones varietales erróneas.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(3, 15),
      priority: 'HIGH',
      guidanceKey: 'soil-baseline',
    },
    {
      id: 'apple-design-cover-pioneers',
      type: 'COVER_CROP_SOWING',
      title: 'Cubierta pionera mejoradora del suelo',
      rationale:
        'Un año de cubierta previa con raíces profundas descompacta, acumula MO y aporta N biológico antes de la plantación.',
      scientificBasis:
        'Wittwer et al. (2017): cubiertas pre-plantación incrementan biomasa microbiana 25-40 %.',
      windowStartDoy: doy(9, 15),
      windowEndDoy: doy(11, 15),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
    {
      id: 'apple-design-variety-plan',
      type: 'PLANTING',
      title: 'Selección varietal y de portainjertos',
      rationale:
        'Define combinaciones variedad/portainjerto adaptadas a caliza activa y pluviometría local; prioriza diversidad (mínimo 3 variedades) y polinizadores.',
      scientificBasis:
        'Font i Forcada et al. (2012); ITACyL manzano Burgos: M9-Pajam para plantación densa, MM111 para secano marginal.',
      windowStartDoy: doy(11, 1),
      windowEndDoy: doy(12, 31),
      priority: 'HIGH',
    },
    {
      id: 'apple-design-hedgerows',
      type: 'BIODIVERSITY_INSTALL',
      title: 'Diseño de setos y biodiversidad funcional',
      rationale:
        'Dimensiona setos perimetrales (25 m máx. entre elementos) y franjas floridas. Aumentan control biológico y reducen deriva.',
      scientificBasis:
        'Landis et al. (2000): bordes diversificados elevan parasitismo de Cydia 20-40 %.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(3, 1),
      priority: 'MEDIUM',
    },
  ],
};
