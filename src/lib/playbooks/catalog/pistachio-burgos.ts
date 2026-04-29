import type { Playbook } from '../types';
import { doy } from '../types';

/**
 * Pistacho (Pistacia vera) Kerman + Peter (10-12 % machos) en Burgos.
 *
 * Cultivo en EXPANSIÓN en Castilla y León. Burgos cumple horas de frío
 * (Kerman necesita 1.000-1.200 h, Sirora 700-800 h) pero las primaveras
 * frías pueden retrasar a Peter → reforzar con Guerrero (2-3 %).
 *
 * Riesgos sanitarios: Botryosphaeria (chancros de madera) y Septoria
 * pistaciarum (manchas foliares). Plaga emergente: chinche del pistacho
 * (Brachynema spp.) en julio-agosto que causa cuajado prematuro.
 *
 * Fuentes:
 * - ITACyL: pistacho en Castilla y León.
 * - Agroforestales Esla: guías técnicas Kerman / Peter / sincronización.
 * - Interempresas: condicionantes climáticos del pistacho en CyL.
 */
export const pistachioBurgos: Playbook = {
  id: 'pistachio-burgos',
  title: 'Pistacho Kerman/Peter en transición/regenerativo (Burgos)',
  description:
    'Plan anual ecológico para pistachar joven en Burgos. Énfasis en poda de formación, sincronización ♀/♂ con Guerrero de refuerzo, prevención Botryosphaeria/Septoria y vigilancia de chinche.',
  cropType: 'NUT_TREE',
  species: 'pistacho',
  applicableStatuses: ['TRANSITION', 'REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'pistachio-leaf-fall-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a caída de hoja',
      rationale:
        'Caldo bordelés 600-900 g/hl al 50-100 % de hojas caídas. Reduce inóculo de Septoria y la entrada invernal de Botryosphaeria por heridas.',
      scientificBasis:
        'Michailides (2019): cobre invernal reduce ascosporas de Botryosphaeria dothidea hasta 60 %.',
      windowStartDoy: doy(10, 25),
      windowEndDoy: doy(12, 5),
      priority: 'HIGH',
      guidanceKey: 'nut-bordeaux-leaf-fall',
    },
    {
      id: 'pistachio-winter-prune',
      type: 'PRUNING',
      title: 'Poda de formación / fructificación en seco',
      rationale:
        'Diciembre-febrero. Años 1-4: formación en eje central o vaso bajo. Adulto: aclareo de centros, eliminación de ramas secas y con chancros (Botryosphaeria). Quemar restos.',
      scientificBasis:
        'Ferguson & Haviland (2016): poda anual en pistacho aumenta penetración de luz y reduce alternancia productiva 20-30 %.',
      windowStartDoy: doy(12, 15),
      windowEndDoy: doy(2, 25),
      priority: 'URGENT',
      guidanceKey: 'pistachio-formation-prune',
    },
    {
      id: 'pistachio-budbreak-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a brotación',
      rationale:
        'Hidróxido cúprico al 0,3 % a brotación visible (1ª-2ª semana abril). Protege brotes nuevos de Botryosphaeria y Pseudomonas syringae.',
      scientificBasis:
        'Michailides (2019): infecciones en brotes tiernos son las que más chancros generan a 12-24 meses vista.',
      windowStartDoy: doy(4, 1),
      windowEndDoy: doy(4, 25),
      priority: 'HIGH',
    },
    {
      id: 'pistachio-flowering-monitoring',
      type: 'MONITORING',
      title: 'Sincronización Kerman ♀ / Peter ♂',
      rationale:
        'Anotar fechas de inicio de receptividad de Kerman e inicio de polen de Peter. En primaveras frías Peter se retrasa: si la diferencia >5 días, planificar reforzar con Guerrero.',
      scientificBasis:
        'Agroforestales Esla (2024): la sincronización es clave; >5 días de desfase implica polinización deficiente y cosecha vacía.',
      windowStartDoy: doy(4, 10),
      windowEndDoy: doy(5, 5),
      priority: 'URGENT',
    },
    {
      id: 'pistachio-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación cubierta',
      rationale: 'Rolar veza+avena en floración para mulch.',
      scientificBasis: 'Mirsky et al. (2012).',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 31),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'pistachio-mulch',
      type: 'MULCHING',
      title: 'Acolchado pre-estío',
      rationale: '8 cm bajo copa, no pegado al tronco. Reduce evaporación.',
      scientificBasis: 'Cook et al. (2018).',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(6, 20),
      priority: 'MEDIUM',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'pistachio-bug-monitoring',
      type: 'MONITORING',
      title: 'Vigilancia de chinches (Brachynema, Nezara)',
      rationale:
        'Mangueo o batido de ramas semanal desde junio. Las picaduras provocan aborto del fruto y mancha negra en almendra. Umbral: 1 chinche/2 árboles → considerar caolín.',
      scientificBasis:
        'Michailides & Morgan (2004): chinches son la plaga más limitante en pistacho mediterráneo.',
      windowStartDoy: doy(6, 1),
      windowEndDoy: doy(8, 31),
      priority: 'HIGH',
    },
    {
      id: 'pistachio-kaolin',
      type: 'PEST_TREATMENT',
      title: 'Pulverización de caolín blanco',
      rationale:
        'Caolín al 3-5 % al primer aviso de chinche. Forma una película mineral repelente que dificulta la picadura. Eco-compatible y no deja residuos.',
      scientificBasis:
        'Glenn & Puterka (2005): caolín reduce 40-70 % daños por chinches en frutos de cáscara.',
      windowStartDoy: doy(6, 15),
      windowEndDoy: doy(7, 31),
      priority: 'MEDIUM',
    },
    {
      id: 'pistachio-summer-irrigation',
      type: 'IRRIGATION',
      title: 'Riego deficitario controlado',
      rationale:
        'Si hay riego, aplicar 50 % ETc desde llenado de almendra (julio) hasta apertura de cáscara. Mantiene calibre y favorece dehiscencia.',
      scientificBasis:
        'Goldhamer & Beede (2004): RDC en pistacho mejora % cáscara abierta sin merma productiva.',
      windowStartDoy: doy(7, 1),
      windowEndDoy: doy(8, 15),
      priority: 'MEDIUM',
    },
    {
      id: 'pistachio-harvest',
      type: 'HARVEST',
      title: 'Recolección por vibración',
      rationale:
        'Cuando >70 % de cáscaras se separan fácilmente del epicarpio. En Burgos finales agosto - mediados sept. Pelado y secado en menos de 24 h para evitar manchas.',
      scientificBasis:
        'Ferguson & Haviland (2016): retraso > 48 h tras vibrado multiplica por 5 la mancha de cáscara.',
      windowStartDoy: doy(8, 25),
      windowEndDoy: doy(9, 25),
      priority: 'URGENT',
      guidanceKey: 'nut-harvest-shaker',
    },
    {
      id: 'pistachio-autumn-cover',
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
      id: 'pistachio-annual-review',
      type: 'MONITORING',
      title: 'Cierre de campaña: cuajado y alternancia',
      rationale:
        'Registrar producción y % cáscara abierta. Pistacho es muy "vecero" (alternancia anual): planificar refuerzo nutricional en años de baja para nivelar.',
      scientificBasis:
        'Ferguson & Haviland (2016): manejo nutricional diferenciado año "ON"/"OFF" reduce alternancia.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
