import type { Playbook } from '../types';
import { doy } from '../types';

export const vineTempranilloTransition: Playbook = {
  id: 'vine-tempranillo-transition-burgos',
  title: 'Viñedo Tempranillo en transición (Burgos)',
  description:
    'Reconvertir viña convencional: cubiertas, cobre fraccionado, deshojado sanitario, control de mildiu con modelo 3-10.',
  cropType: 'VINEYARD',
  species: 'Tempranillo',
  applicableStatuses: ['TRANSITION'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'vine-trans-winter-prune',
      type: 'PRUNING',
      title: 'Poda invierno (vara y pulgar o Royat)',
      rationale:
        'Poda equilibrada antes de lloros; sanea cortes grandes con pasta biológica.',
      scientificBasis:
        'Guyot / Royat: Lafon & Couderc (1953); cortes > 3 cm sellar para evitar yesca.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(3, 5),
      priority: 'HIGH',
    },
    {
      id: 'vine-trans-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación de cubierta en línea central',
      rationale:
        'Rolado o siega alta en floración de cubierta para aprovechar el N sin competir por agua.',
      scientificBasis:
        'Delpuech & Metay (2018): rolado en antesis minimiza competencia hídrica con vid.',
      windowStartDoy: doy(4, 15),
      windowEndDoy: doy(5, 20),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'vine-trans-mildew-monitoring',
      type: 'MONITORING',
      title: 'Monitoreo mildiu BBCH 53-75',
      rationale:
        'Seguir modelo 3-10 (≥10 mm lluvia, ≥10 °C, ≥10 cm brotes) desde botones separados a cierre de racimo.',
      scientificBasis:
        'Rossi et al. (2008) VitiMeteo: modelos basados en infecciones primarias guían aplicaciones de cobre.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(7, 15),
      priority: 'HIGH',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'vine-trans-compost',
      type: 'COMPOSTING',
      title: 'Compost + orujo compostado',
      rationale:
        'Aporte 6-8 t/ha con mezcla de compost vegetal + orujo compostado para recuperar MO y aportar K.',
      scientificBasis:
        'García-Martínez et al. (2009): orujo compostado aporta K y Mg altamente asimilables.',
      windowStartDoy: doy(2, 20),
      windowEndDoy: doy(4, 5),
      priority: 'HIGH',
      guidanceKey: 'compost-application',
    },
    {
      id: 'vine-trans-deshojado',
      type: 'PRUNING',
      title: 'Deshojado sanitario (BBCH 71-75)',
      rationale:
        'Retirar 4-6 hojas basales lado este mejora aireación y reduce botritis.',
      scientificBasis:
        'Palliotti et al. (2012): deshojado selectivo reduce severidad botritis 40-60 % sin pérdida de calidad.',
      windowStartDoy: doy(7, 1),
      windowEndDoy: doy(7, 20),
      priority: 'MEDIUM',
    },
    {
      id: 'vine-trans-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra cubierta interlínea',
      rationale:
        'Mezcla veza + avena + bromo en calles alternas para evitar competencia de agua en todas.',
      scientificBasis:
        'Metay et al. (2017): cubiertas alternas mejoran estructura sin perjudicar balance hídrico en vid.',
      windowStartDoy: doy(9, 20),
      windowEndDoy: doy(11, 5),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
  ],
};
