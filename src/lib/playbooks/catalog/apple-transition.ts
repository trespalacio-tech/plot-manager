import type { Playbook } from '../types';
import { doy } from '../types';

export const appleTransition: Playbook = {
  id: 'apple-transition-burgos',
  title: 'Manzano en transición (Burgos)',
  description:
    'Plan a 3 años para reconducir un manzano convencional hacia régimen regenerativo con suelo vivo, cubiertas y control biológico.',
  cropType: 'FRUIT_TREE',
  species: 'manzano',
  applicableStatuses: ['TRANSITION'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'apple-trans-winter-prune',
      type: 'PRUNING',
      title: 'Poda seca de invierno',
      rationale:
        'Poda estructural entre enero y mediados de febrero antes del desborre. Retira leña vieja y sanea chancros.',
      scientificBasis:
        'Lespinasse (2008): poda de fructificación centrada sobre dardos de 2-3 años mantiene equilibrio vegetativo-productivo.',
      windowStartDoy: doy(1, 10),
      windowEndDoy: doy(2, 20),
      priority: 'HIGH',
    },
    {
      id: 'apple-trans-compost-spring',
      type: 'COMPOSTING',
      title: 'Aporte de compost de primavera',
      rationale:
        'Aporte de 8-10 t/ha de compost maduro (C/N 10-12) bajo copa antes del acolchado. Alimenta flora microbiana en el despertar.',
      scientificBasis:
        'Scharenbroch et al. (2013): compost anual bajo copa aumenta respiración basal del suelo 30-60 %.',
      windowStartDoy: doy(2, 20),
      windowEndDoy: doy(4, 15),
      priority: 'HIGH',
      guidanceKey: 'compost-application',
    },
    {
      id: 'apple-trans-pheromones',
      type: 'PEST_TREATMENT',
      title: 'Instalar confusión sexual carpocapsa',
      rationale:
        'Colocar difusores Isomate/CheckMate a 500-600 dif/ha antes del primer vuelo.',
      scientificBasis:
        'Ioriatti et al. (2019): confusión reduce daños > 90 % si se instala pre-vuelo.',
      windowStartDoy: doy(3, 1),
      windowEndDoy: doy(3, 25),
      priority: 'HIGH',
      guidanceKey: 'pest-trap-setup',
    },
    {
      id: 'apple-trans-mulch',
      type: 'MULCHING',
      title: 'Acolchado pre-estío bajo copa',
      rationale:
        '8-10 cm de mulch (restos de poda triturados + paja) antes de que las mínimas nocturnas pasen de 10 °C.',
      scientificBasis:
        'Cook et al. (2018): mulch reduce evaporación 30-50 % y temperatura del suelo 2-4 °C.',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(6, 20),
      priority: 'HIGH',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'apple-trans-codling-monitor',
      type: 'MONITORING',
      title: 'Monitoreo carpocapsa con trampas delta',
      rationale:
        'Revisión semanal de fondo pegajoso; cambio de feromona según fabricante. Umbral 3-5 machos/trampa·semana.',
      scientificBasis:
        'Knight & Hilton (2007): umbrales relativos al histórico de parcela afinan la decisión.',
      windowStartDoy: doy(5, 20),
      windowEndDoy: doy(8, 31),
      priority: 'MEDIUM',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'apple-trans-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación superficial de cubierta de invierno',
      rationale:
        'Rolado o siega alta en floración de veza para aprovechar fijación de N y maximizar mulch sin laboreo.',
      scientificBasis:
        'Mirsky et al. (2012): rolado en antesis termina >95 % biomasa sin laboreo y conserva estructura.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 31),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'apple-trans-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra de cubierta de invierno',
      rationale:
        'Veza + avena + trébol subterráneo a 60-80 kg/ha. Cubre 100 % del suelo antes de heladas.',
      scientificBasis:
        'Abdalla et al. (2019): leguminosas fijan 40-80 kg N/ha·año en clima mediterráneo-continental.',
      windowStartDoy: doy(9, 20),
      windowEndDoy: doy(11, 5),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
    {
      id: 'apple-trans-annual-review',
      type: 'MONITORING',
      title: 'Revisión anual del plan de transición',
      rationale:
        'Cierre de campaña: revisa MO, lombrices, daños y ajusta hitos antes del nuevo año.',
      scientificBasis:
        'Moebius-Clune et al. (2016): evaluar anualmente indicadores físicos, químicos y biológicos.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
