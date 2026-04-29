import type { Playbook } from '../types';
import { doy } from '../types';

/**
 * Avellano (Corylus avellana) en Burgos. Cultivo MARGINAL en la provincia:
 * la floración masculina invernal (enero-febrero) sufre con heladas fuertes
 * y la planta se resiente con calor seco estival. El playbook lo asume y
 * marca la viabilidad solo en microclimas abrigados.
 *
 * Plaga clave: balanino o "diabló" (Curculio nucum). Enfermedades:
 * bacteriosis (Xanthomonas) en zonas con frío húmedo, ácaro de la yema
 * (Phytoptus avellanae). Recolección 25 ago - 30 sep.
 *
 * Fuentes:
 * - GIP MAPA avellano.
 * - Phytoma 267 (2015): Curculio nucum, plaga clave del avellano.
 * - Phytoma 312 (2019): nematodos entomopatógenos para Curculio.
 * - Guía cooperativa Asturias (ADICAP).
 */
export const hazelnutBurgos: Playbook = {
  id: 'hazelnut-burgos',
  title: 'Avellano en transición/regenerativo (Burgos)',
  description:
    'Plan anual ecológico para avellano Negret/Pauetet en microclimas abrigados de Burgos. Foco en control biológico de balanino, manejo de chupones y prevención de bacteriosis tras heladas.',
  cropType: 'NUT_TREE',
  species: 'avellano',
  applicableStatuses: ['TRANSITION', 'REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'hazelnut-leaf-fall-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a caída de hoja',
      rationale:
        'Caldo bordelés 600-900 g/hl al 50 % y 100 % de hojas caídas. Reduce inóculo bacteriano y de Cytospora.',
      scientificBasis:
        'Lamichhane et al. (2018): cobres invernales son la base del control de Xanthomonas en frutos de cáscara.',
      windowStartDoy: doy(11, 1),
      windowEndDoy: doy(12, 5),
      priority: 'HIGH',
      guidanceKey: 'nut-bordeaux-leaf-fall',
    },
    {
      id: 'hazelnut-winter-prune',
      type: 'PRUNING',
      title: 'Poda y eliminación de chupones',
      rationale:
        'Ene-feb. Mantener 4-6 brazos por mata, eliminar chupones (sucker) del pie y leña vieja. La poda anual es vital para fructificación lateral.',
      scientificBasis:
        'Tous & Romero (2013): la poda de renovación cada 6-8 años aumenta vida productiva del avellano.',
      windowStartDoy: doy(1, 5),
      windowEndDoy: doy(2, 25),
      priority: 'HIGH',
    },
    {
      id: 'hazelnut-flower-monitoring',
      type: 'MONITORING',
      title: 'Vigilancia floración masculina y heladas',
      rationale:
        'En Burgos la floración masculina cae entre fin enero y mediados febrero. Si se prevé < -5 °C tras polinización, anotar daño y prever menor cuajado.',
      scientificBasis:
        'GIP MAPA avellano: heladas tras polinización son la principal causa de baja productividad en zonas frías.',
      windowStartDoy: doy(1, 20),
      windowEndDoy: doy(2, 28),
      priority: 'HIGH',
      guidanceKey: 'late-frost-protection',
    },
    {
      id: 'hazelnut-budbreak-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre tras heladas significativas',
      rationale:
        'Si han caído heladas tras polinización, aplicar cobre para proteger heridas de bacteriosis (Xanthomonas entra por estos cortes). Hidróxido cúprico al 0,3 %.',
      scientificBasis:
        'Lamichhane et al. (2018): infección postraumática es la vía principal de Xanthomonas en avellano.',
      windowStartDoy: doy(2, 25),
      windowEndDoy: doy(3, 31),
      priority: 'MEDIUM',
    },
    {
      id: 'hazelnut-balanino-monitoring',
      type: 'MONITORING',
      title: 'Monitoreo de balanino (Curculio nucum)',
      rationale:
        'Mangueo semanal sobre 25 ramas/parcela desde mediados abril. Plaga clave: hembra deposita huevo en fruto verde, larva consume almendra. Umbral: 5-10 adultos/100 mangueos.',
      scientificBasis:
        'Phytoma 267 (2015): la detección temprana es decisiva; >10 adultos/100 mangueos justifica intervención.',
      windowStartDoy: doy(4, 15),
      windowEndDoy: doy(6, 30),
      priority: 'URGENT',
      guidanceKey: 'hazelnut-balanino-control',
    },
    {
      id: 'hazelnut-balanino-control',
      type: 'PEST_TREATMENT',
      title: 'Control biológico de balanino',
      rationale:
        'Si umbral superado: aplicación de Beauveria bassiana al suelo bajo copa antes de pupa, o nematodos entomopatógenos (Steinernema carpocapsae) en otoño cuando larva entra al suelo.',
      scientificBasis:
        'Phytoma 312 (2019): S. carpocapsae a 0,5·10⁶ JI/m² reduce 50-80 % la población invernante de Curculio.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(6, 15),
      priority: 'HIGH',
    },
    {
      id: 'hazelnut-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación cubierta de invierno',
      rationale: 'Rolar o segar veza+avena en floración para mulch.',
      scientificBasis: 'Mirsky et al. (2012).',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 31),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'hazelnut-mulch',
      type: 'MULCHING',
      title: 'Acolchado bajo plantón',
      rationale:
        'El avellano es sensible al estrés hídrico estival; mulch de 8 cm con paja o restos triturados conserva humedad.',
      scientificBasis: 'Cook et al. (2018).',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(6, 20),
      priority: 'HIGH',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'hazelnut-summer-irrigation',
      type: 'IRRIGATION',
      title: 'Riego de apoyo estival',
      rationale:
        'El cuajado y llenado del fruto coincide con junio-julio: si secano, prever riego de socorro (40-60 L/árbol cada 15 días) para evitar fruto vano.',
      scientificBasis:
        'Tous & Romero (2013): déficit hídrico en julio multiplica por 2-3 el porcentaje de fruto vano.',
      windowStartDoy: doy(6, 15),
      windowEndDoy: doy(8, 10),
      priority: 'MEDIUM',
    },
    {
      id: 'hazelnut-harvest',
      type: 'HARVEST',
      title: 'Recolección de avellanas',
      rationale:
        'Recoger del suelo cuando han caído por sí solas (25 ago - 30 sep). Pre-secado en seguida (humedad <10 %) para evitar Aspergillus.',
      scientificBasis:
        'GIP MAPA: humedad post-cosecha >12 % multiplica riesgo de aflatoxinas.',
      windowStartDoy: doy(8, 25),
      windowEndDoy: doy(9, 30),
      priority: 'URGENT',
      guidanceKey: 'nut-harvest-shaker',
    },
    {
      id: 'hazelnut-nematodes',
      type: 'PEST_TREATMENT',
      title: 'Nematodos contra balanino otoñal',
      rationale:
        'Aplicación de Steinernema carpocapsae en suelo bajo copa después de cosecha y con humedad (riego o lluvia previa). Captura larvas que descendieron al suelo para invernar.',
      scientificBasis:
        'Phytoma 312 (2019): aplicación otoñal sobre suelo húmedo es la ventana más eficaz para nematodos entomopatógenos.',
      windowStartDoy: doy(10, 1),
      windowEndDoy: doy(11, 15),
      priority: 'HIGH',
    },
    {
      id: 'hazelnut-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra cubierta otoño-invierno',
      rationale: 'Veza + avena + trébol a 60-80 kg/ha.',
      scientificBasis: 'Abdalla et al. (2019).',
      windowStartDoy: doy(9, 25),
      windowEndDoy: doy(11, 5),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
    {
      id: 'hazelnut-annual-review',
      type: 'MONITORING',
      title: 'Cierre de campaña',
      rationale: 'Producción, % fruto vano, daño balanino, ajuste plan.',
      scientificBasis: 'Buena práctica.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
