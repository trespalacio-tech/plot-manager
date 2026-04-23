import type { Playbook } from '../types';
import { doy } from '../types';

export const appleRegenerative: Playbook = {
  id: 'apple-regenerative-burgos',
  title: 'Manzano regenerativo (Burgos)',
  description:
    'Mantenimiento en régimen regenerativo: cubierta permanente, compostaje suficiente, monitoreo IPM, poda de equilibrio.',
  cropType: 'FRUIT_TREE',
  species: 'manzano',
  applicableStatuses: ['REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'apple-reg-winter-prune',
      type: 'PRUNING',
      title: 'Poda de mantenimiento en invierno',
      rationale:
        'Poda ligera para mantener equilibrio y aireación. Menor intensidad que en transición.',
      scientificBasis:
        'Robinson et al. (2013): poda moderada anual estabiliza cosecha y reduce alternancia.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(2, 20),
      priority: 'MEDIUM',
    },
    {
      id: 'apple-reg-compost',
      type: 'COMPOSTING',
      title: 'Compost de mantenimiento',
      rationale:
        'Aporte de 4-6 t/ha bajo copa. Suficiente para mantener MO > 3 % en régimen estabilizado.',
      scientificBasis:
        'Scharenbroch et al. (2013): mantenimiento anual 4-6 t/ha conserva actividad microbiana.',
      windowStartDoy: doy(2, 20),
      windowEndDoy: doy(4, 10),
      priority: 'MEDIUM',
      guidanceKey: 'compost-application',
    },
    {
      id: 'apple-reg-mulch',
      type: 'MULCHING',
      title: 'Renovar acolchado bajo copa',
      rationale:
        'Refrescar mulch con restos de poda triturados y fracción de paja cada primavera.',
      scientificBasis:
        'Cook et al. (2018): mulch estable 6-10 cm reduce malezas perennes 50-70 %.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(6, 15),
      priority: 'MEDIUM',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'apple-reg-ipm-monitor',
      type: 'MONITORING',
      title: 'Monitoreo IPM integrado de plagas',
      rationale:
        'Trampas carpocapsa + anarsia + seguimiento visual de pulgones y minadores. Decisión por umbrales.',
      scientificBasis:
        'MAPA Guía IPM manzano; EFSA 2018: priorizar control biológico autóctono.',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(9, 15),
      priority: 'MEDIUM',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'apple-reg-harvest',
      type: 'HARVEST',
      title: 'Planificar cosecha según madurez',
      rationale:
        'Seguimiento Brix + firmeza + almidón (iodo) por variedad. Recolección escalonada para optimizar conservación.',
      scientificBasis:
        'Streif (1996) índice de madurez: firmeza + almidón + azúcares coordinan fecha óptima.',
      windowStartDoy: doy(8, 20),
      windowEndDoy: doy(10, 20),
      priority: 'HIGH',
    },
    {
      id: 'apple-reg-cover-refresh',
      type: 'COVER_CROP_SOWING',
      title: 'Resembrar huecos de cubierta permanente',
      rationale:
        'Cubierta permanente: resiembra puntual de calvas con mezcla baja altura (trébol subterráneo + achicoria).',
      scientificBasis:
        'Pardo et al. (2018): cubierta permanente mantiene infiltración y reduce erosión sin competir en agua si se siega en pre-estío.',
      windowStartDoy: doy(9, 25),
      windowEndDoy: doy(10, 31),
      priority: 'LOW',
      guidanceKey: 'cover-crop-sowing',
    },
  ],
};
