import type { Playbook } from '../types';
import { doy } from '../types';

/**
 * Establecimiento (DESIGN) común a frutos secos en Burgos. Cubre análisis
 * de suelo, diseño de marco, plantación y primer mantenimiento. La
 * especialización por especie se activa al pasar a TRANSITION.
 *
 * Fuentes:
 * - ITACyL (2023): "Adaptación y estudio de nuevas especies y variedades de
 *   frutos secos: pistacho, almendro y nogal en Castilla y León".
 * - MAPA: Guías GIP de Nogal y Avellano.
 */
export const nutDesign: Playbook = {
  id: 'nut-design-burgos',
  title: 'Establecimiento de frutos secos (Burgos)',
  description:
    'Plan de diseño y plantación común a almendro, nogal, avellano y pistacho en condiciones de Burgos. Análisis previo, marco según especie, plantación a raíz desnuda en invierno o pie en cepellón en primavera.',
  cropType: 'NUT_TREE',
  applicableStatuses: ['DESIGN'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'nut-design-soil-analysis',
      type: 'MONITORING',
      title: 'Análisis de suelo de partida',
      rationale:
        'Antes de plantar, conocer textura, pH, caliza activa, materia orgánica y conductividad. Define la elección de patrón (sensible/tolerante a caliza) y la estrategia de enmienda.',
      scientificBasis:
        'Soriano (2018), "Suelo y patrones para frutales": caliza activa > 9 % limita patrones francos en almendro y nogal; obliga a GF-677 o Rootpac-R.',
      windowStartDoy: doy(9, 1),
      windowEndDoy: doy(11, 30),
      priority: 'URGENT',
    },
    {
      id: 'nut-design-frame-layout',
      type: 'PLANTING',
      title: 'Replanteo del marco de plantación',
      rationale:
        'Marcar el rectángulo según vigor de la especie y patrón: almendro 5×4 m, nogal 8×7 m, avellano 5×3 m, pistacho 6×5 m. Orientar líneas N-S para insolación equilibrada.',
      scientificBasis:
        'Felipe (2017), "El almendro": densidad y orientación condicionan rendimiento y mecanización futura.',
      windowStartDoy: doy(11, 1),
      windowEndDoy: doy(12, 31),
      priority: 'HIGH',
    },
    {
      id: 'nut-design-planting',
      type: 'PLANTING',
      title: 'Plantación de invierno (raíz desnuda)',
      rationale:
        'Diciembre-febrero, fuera de periodo de helada fuerte. Hoyo amplio (60×60×60 cm), nunca enterrar el cuello del injerto. Riego de plantación 20-30 L/árbol.',
      scientificBasis:
        'Vargas et al. (2010): plantación tardía retrasa entrada en producción 1-2 años; plantar antes de hinchamiento de yemas.',
      windowStartDoy: doy(12, 10),
      windowEndDoy: doy(2, 28),
      priority: 'URGENT',
    },
    {
      id: 'nut-design-protect-trunks',
      type: 'BIODIVERSITY_INSTALL',
      title: 'Protectores de tronco contra fauna y sol',
      rationale:
        'Instalar protectores corrugados o malla anti-roedor en plantones jóvenes. En zonas soleadas, encalar tronco para evitar quemaduras de corteza.',
      scientificBasis:
        'INIA (2015): hasta el 30 % de plantones se pierden el primer año por roedores y sol directo.',
      windowStartDoy: doy(2, 15),
      windowEndDoy: doy(3, 31),
      priority: 'HIGH',
    },
    {
      id: 'nut-design-first-irrigation',
      type: 'IRRIGATION',
      title: 'Riego de implantación primer verano',
      rationale:
        'Aunque el cultivo sea de secano, el primer verano necesita riegos de apoyo (50-80 L/árbol cada 2-3 semanas) para garantizar enraizamiento profundo.',
      scientificBasis:
        'Goldhamer & Fereres (2017): déficit hídrico el año 1 reduce desarrollo radicular hasta 40 %.',
      windowStartDoy: doy(6, 15),
      windowEndDoy: doy(8, 31),
      priority: 'HIGH',
    },
    {
      id: 'nut-design-mulch-young',
      type: 'MULCHING',
      title: 'Acolchado bajo plantón joven',
      rationale:
        'Mulch de 8-10 cm con 50 cm de diámetro alrededor del tronco (sin tocarlo). Reduce competencia herbácea y conserva humedad crítica el primer año.',
      scientificBasis:
        'Cook et al. (2018): mulch reduce evaporación 30-50 % y temperatura del suelo 2-4 °C.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(6, 15),
      priority: 'MEDIUM',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'nut-design-formation-prune',
      type: 'PRUNING',
      title: 'Poda de formación primer año',
      rationale:
        'Tras brotación, definir 3-4 ramas principales bien repartidas a 70-90 cm del suelo. Eliminar competidoras y tutorar eje central si la especie lo requiere (nogal, pistacho).',
      scientificBasis:
        'Vargas et al. (2010): formación correcta los 4 primeros años condiciona productividad y vida útil.',
      windowStartDoy: doy(6, 1),
      windowEndDoy: doy(7, 15),
      priority: 'HIGH',
    },
    {
      id: 'nut-design-annual-review',
      type: 'MONITORING',
      title: 'Cierre de campaña y revisión',
      rationale:
        'Diciembre: inventariar marras, defectos de implantación y revisar plan para el año 2.',
      scientificBasis: 'Buena práctica de gestión adaptativa.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
