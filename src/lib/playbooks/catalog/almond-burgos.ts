import type { Playbook } from '../types';
import { doy } from '../types';

/**
 * Almendro extra-tardío (Vairo, Lauranne, Penta, Vialfas) en Burgos.
 *
 * Floración 3ª-4ª semana de abril → escapa al grueso de heladas en la
 * meseta norte. Riesgos sanitarios principales: monilia (M. laxa) en
 * floración húmeda, abolladura (Taphrina deformans) en primaveras frescas
 * y mancha ocre / cribado al final de campaña. Recolección 15 ago - 15 sep.
 *
 * Fuentes:
 * - ITACyL: "Adaptación de pistacho, almendro y nogal en Castilla y León".
 * - BASF Camposcopio: estados fenológicos sensibles del almendro.
 * - Martínez Carra: tratamientos de prefloración y monilia en almendro.
 * - GIP MAPA almendro.
 */
export const almondBurgos: Playbook = {
  id: 'almond-burgos',
  title: 'Almendro extra-tardío en transición/regenerativo (Burgos)',
  description:
    'Plan anual ecológico para almendro extra-tardío adaptado a Burgos. Centrado en prevención de monilia y abolladura, control de mancha ocre, cubierta vegetal y recolección estival.',
  cropType: 'NUT_TREE',
  species: 'almendro',
  applicableStatuses: ['TRANSITION', 'REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'almond-leaf-fall-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a caída de hoja (50-100 %)',
      rationale:
        'Caldo bordelés 600-900 g/hl o hidróxido cúprico al 50 % de hojas caídas y nueva pasada al 100 %. Reduce inóculo de mancha ocre, cribado y abolladura para el año siguiente.',
      scientificBasis:
        'Vargas & Romero (2012): dos aplicaciones de cobre a caída de hoja reducen la incidencia primaveral de Taphrina y Stigmina hasta el 70 %.',
      windowStartDoy: doy(11, 1),
      windowEndDoy: doy(12, 5),
      priority: 'URGENT',
      guidanceKey: 'nut-bordeaux-leaf-fall',
    },
    {
      id: 'almond-winter-prune',
      type: 'PRUNING',
      title: 'Poda de invierno y eliminación de momificados',
      rationale:
        'Diciembre-enero. Retirar y quemar momificados (frutos colgantes) y ramas secas: son el reservorio de Monilia laxa para la floración. Aclarar centro para luz/aire.',
      scientificBasis:
        'Holb (2008): la eliminación de momificados reduce el inóculo primario de monilia >80 %.',
      windowStartDoy: doy(12, 10),
      windowEndDoy: doy(2, 10),
      priority: 'URGENT',
    },
    {
      id: 'almond-winter-oil',
      type: 'PEST_TREATMENT',
      title: 'Aceite de parafina a yema hinchada',
      rationale:
        'Aceite parafínico 1,5-2 % al hinchamiento de yemas (estado B-C). Asfixia huevos invernantes de cochinilla blanca y pulgones, y forma capa que dificulta nuevas puestas.',
      scientificBasis:
        'GIP MAPA almendro: tratamiento clave preventivo, mejor que insecticida en activo.',
      windowStartDoy: doy(2, 5),
      windowEndDoy: doy(3, 15),
      priority: 'HIGH',
      guidanceKey: 'nut-winter-oil',
    },
    {
      id: 'almond-prebloom-cuprocalcic',
      type: 'DISEASE_TREATMENT',
      title: 'Tratamiento de prefloración (estado C-D)',
      rationale:
        'Sulfato cuprocálcico u oxicloruro de cobre + aceite parafina cuando se observan los primeros pétalos visibles (3ª semana marzo en Vairo/Lauranne). Anti-monilia, abolladura y huevos de plagas.',
      scientificBasis:
        'BASF (2024): prefloración es el momento más sensible; un tratamiento aquí evita 2-3 curativos posteriores.',
      windowStartDoy: doy(3, 15),
      windowEndDoy: doy(4, 10),
      priority: 'URGENT',
      guidanceKey: 'almond-monilia-prevention',
    },
    {
      id: 'almond-bloom-monitoring',
      type: 'MONITORING',
      title: 'Vigilancia de floración y heladas',
      rationale:
        '15-25 abril en Burgos. Revisar diariamente AEMET y, si se prevé helada, activar protección (riego antihelada, aspersión, ventilador).',
      scientificBasis:
        'AEMET CyL: la última helada media en Aranda/Lerma cae 15-20 abril; almendro extra-tardío reduce riesgo pero no lo elimina.',
      windowStartDoy: doy(4, 5),
      windowEndDoy: doy(4, 30),
      priority: 'HIGH',
      guidanceKey: 'late-frost-protection',
    },
    {
      id: 'almond-postbloom-bordeaux',
      type: 'DISEASE_TREATMENT',
      title: 'Bordelés post-floración si humedad alta',
      rationale:
        'Solo si primavera ha sido húmeda con >5 mm en >3 días seguidos durante floración. Caldo bordelés al cuajado (estado G-H) refuerza protección anti-monilia y abolladura.',
      scientificBasis:
        'Holb (2008): segundo tratamiento post-floración solo se justifica con humedad relativa media >75 % en floración.',
      windowStartDoy: doy(4, 25),
      windowEndDoy: doy(5, 15),
      priority: 'MEDIUM',
    },
    {
      id: 'almond-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación cubierta de invierno',
      rationale:
        'Rolar o segar alta la cubierta veza+avena en floración de la veza para aprovechar fijación de N y dejar mulch sin laboreo.',
      scientificBasis:
        'Mirsky et al. (2012): rolado en antesis termina >95 % biomasa sin laboreo.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 31),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'almond-mulch',
      type: 'MULCHING',
      title: 'Acolchado pre-estío bajo copa',
      rationale:
        '8-10 cm de mulch (restos triturados + paja) antes de que las mínimas nocturnas pasen de 10 °C. Crítico en almendro de secano.',
      scientificBasis:
        'Cook et al. (2018): mulch reduce evaporación 30-50 % y temperatura del suelo 2-4 °C.',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(6, 20),
      priority: 'HIGH',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'almond-anarsia-monitoring',
      type: 'MONITORING',
      title: 'Trampeo Anarsia y gusano cabezudo',
      rationale:
        'Trampas delta con feromona Anarsia lineatella desde mayo, revisión semanal. Umbral de 5-10 capturas/semana → considerar Bacillus thuringiensis.',
      scientificBasis:
        'GIP MAPA: control biológico con Bt es eficaz y compatible con fauna útil.',
      windowStartDoy: doy(5, 20),
      windowEndDoy: doy(8, 31),
      priority: 'MEDIUM',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'almond-summer-irrigation',
      type: 'IRRIGATION',
      title: 'Riego deficitario controlado en julio',
      rationale:
        'Si hay riego, aplicar 40-50 % ETc desde llenado de almendra hasta inicio de cambio de color de cáscara. Mantiene calibre sin estresar excesivamente.',
      scientificBasis:
        'Goldhamer & Fereres (2017): RDC en almendro reduce gasto hídrico 30 % sin merma productiva significativa.',
      windowStartDoy: doy(7, 1),
      windowEndDoy: doy(8, 10),
      priority: 'MEDIUM',
    },
    {
      id: 'almond-harvest',
      type: 'HARVEST',
      title: 'Recolección por vibración',
      rationale:
        'Cuando >80 % de cáscara abierta y mesocarpio seco. Vibrador de tronco con paraguas invertido o lonas. En Vairo/Lauranne ~20 ago - 10 sep en Burgos.',
      scientificBasis:
        'Vargas et al. (2010): retraso en recolección aumenta daño por aves y afatoxinas.',
      windowStartDoy: doy(8, 15),
      windowEndDoy: doy(9, 15),
      priority: 'HIGH',
      guidanceKey: 'nut-harvest-shaker',
    },
    {
      id: 'almond-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra de cubierta de invierno',
      rationale:
        'Veza + avena + trébol subterráneo a 60-80 kg/ha tras lluvia útil de otoño. Cubre 100 % del suelo antes de heladas.',
      scientificBasis:
        'Abdalla et al. (2019): leguminosas fijan 40-80 kg N/ha·año en clima mediterráneo-continental.',
      windowStartDoy: doy(9, 20),
      windowEndDoy: doy(11, 5),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
    {
      id: 'almond-annual-review',
      type: 'MONITORING',
      title: 'Cierre de campaña: producción y sanidad',
      rationale:
        'Registrar kg/ha pelado, % daño por monilia/abolladura, lecturas finales de cubierta y MO. Ajustar plan próxima campaña.',
      scientificBasis: 'Moebius-Clune et al. (2016): seguimiento anual de indicadores.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
