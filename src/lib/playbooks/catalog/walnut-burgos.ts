import type { Playbook } from '../types';
import { doy } from '../types';

/**
 * Nogal (Juglans regia) variedades Chandler / Franquette / Lara en Burgos.
 *
 * Brotación tardía (15-30 abril en Chandler, 1ª quincena mayo en Franquette).
 * Riesgos sanitarios principales:
 *  - Bacteriosis (Xanthomonas arboricola pv. juglandis): cobre desde brotación.
 *  - Antracnosis (Gnomonia leptostyla): preventivos primaverales.
 *  - Carpocapsa del nogal (Cydia pomonella): confusión sexual desde mayo.
 *  - Pulgón y Zeuzera: vigilancia.
 * Recolección 15 sept - 30 oct según variedad.
 *
 * Fuentes:
 * - GIP MAPA nogal.
 * - Generalitat Valenciana: ficha técnica del nogal.
 * - Fruitex: tratamientos del nogal.
 */
export const walnutBurgos: Playbook = {
  id: 'walnut-burgos',
  title: 'Nogal en transición/regenerativo (Burgos)',
  description:
    'Plan anual ecológico para nogal Chandler/Franquette/Lara en Burgos. Énfasis en prevención de bacteriosis y antracnosis con cobre, confusión sexual de carpocapsa y manejo de pulgón.',
  cropType: 'NUT_TREE',
  species: 'nogal',
  applicableStatuses: ['TRANSITION', 'REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'walnut-leaf-fall-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a caída de hoja',
      rationale:
        'Caldo bordelés 600-1000 g/hl al 50 % de hojas caídas y nueva pasada al 100 %. Reduce inóculo invernante de Xanthomonas en yemas y chancros.',
      scientificBasis:
        'Lindow et al. (2014): aplicaciones de Cu post-cosecha reducen >60 % la población epífita de Xanthomonas arboricola en yemas.',
      windowStartDoy: doy(11, 1),
      windowEndDoy: doy(12, 5),
      priority: 'URGENT',
      guidanceKey: 'nut-bordeaux-leaf-fall',
    },
    {
      id: 'walnut-winter-prune',
      type: 'PRUNING',
      title: 'Poda de invierno y cirugía de chancros',
      rationale:
        'Diciembre-febrero, en seco. Cortar y quemar ramas con chancros bacterianos (zonas necrosadas con exudado). Desinfectar herramientas con alcohol 70 % entre árboles.',
      scientificBasis:
        'GIP MAPA nogal: la cirugía de chancros es la única medida curativa eficaz contra bacteriosis activa.',
      windowStartDoy: doy(12, 15),
      windowEndDoy: doy(2, 28),
      priority: 'URGENT',
    },
    {
      id: 'walnut-bud-burst-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a brotación (estado C-D)',
      rationale:
        'Hidróxido de cobre o caldo bordelés a brotación visible (15-30 abril en Chandler). Protege brotes y amentos masculinos del ataque temprano de bacteriosis y antracnosis.',
      scientificBasis:
        'Fruitex: 1er tratamiento al inicio de brotación, momento más sensible. Reducen incidencia primaveral 50-70 %.',
      windowStartDoy: doy(4, 10),
      windowEndDoy: doy(5, 5),
      priority: 'URGENT',
    },
    {
      id: 'walnut-flowering-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre en plena floración femenina',
      rationale:
        'Repetir cobre al 50 % de flores femeninas abiertas. La infección bacteriana en estigmas durante floración produce caída prematura de frutos.',
      scientificBasis:
        'Belisario et al. (2008): infección durante floración explica gran parte de la "necrosis apical marrón" (BAN) en nogal.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 25),
      priority: 'HIGH',
    },
    {
      id: 'walnut-codling-confusion',
      type: 'PEST_TREATMENT',
      title: 'Instalación de confusión sexual carpocapsa',
      rationale:
        'Difusores de feromona Cydia pomonella a 500-600 dif/ha antes del primer vuelo (~ inicio mayo en Burgos, cuando suma de grados-día base 10 °C llega a 90).',
      scientificBasis:
        'Ioriatti et al. (2019): confusión instalada pre-vuelo reduce daños >90 % en parcelas >3 ha.',
      windowStartDoy: doy(4, 25),
      windowEndDoy: doy(5, 20),
      priority: 'URGENT',
      guidanceKey: 'nut-walnut-codling-confusion',
    },
    {
      id: 'walnut-fruitset-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a cuajado (frutos del tamaño de un guisante)',
      rationale:
        'Tercer y último cobre al cuajado, especialmente si junio se prevé húmedo. Cierra ventana sensible a bacteriosis sin acumular fitotoxicidad.',
      scientificBasis:
        'GIP MAPA: 3 cobres es el máximo recomendado en producción ecológica para evitar acumulación en suelo.',
      windowStartDoy: doy(5, 25),
      windowEndDoy: doy(6, 20),
      priority: 'HIGH',
    },
    {
      id: 'walnut-cover-termination',
      type: 'COVER_CROP_TERMINATION',
      title: 'Terminación de cubierta',
      rationale:
        'Rolar o segar veza+avena en floración para mulch in situ y aporte de N.',
      scientificBasis: 'Mirsky et al. (2012).',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(5, 31),
      priority: 'MEDIUM',
      guidanceKey: 'cover-crop-termination',
    },
    {
      id: 'walnut-mulch',
      type: 'MULCHING',
      title: 'Acolchado bajo copa pre-estío',
      rationale:
        'Nogal sufre estrés hídrico fácil; mulch de 8-10 cm a inicio de junio reduce evaporación y mantiene microbiota activa.',
      scientificBasis: 'Cook et al. (2018).',
      windowStartDoy: doy(5, 20),
      windowEndDoy: doy(6, 25),
      priority: 'HIGH',
      guidanceKey: 'mulching-under-canopy',
    },
    {
      id: 'walnut-codling-monitoring',
      type: 'MONITORING',
      title: 'Monitoreo carpocapsa con trampas delta',
      rationale:
        'Trampa testigo en parcela aún con confusión: si captura >5 machos/sem indica fallo de confusión y necesidad de refuerzo (granulovirus, Bt aizawai).',
      scientificBasis:
        'Knight & Hilton (2007): trampas testigo bajo confusión validan eficacia y guían refuerzos.',
      windowStartDoy: doy(5, 20),
      windowEndDoy: doy(8, 31),
      priority: 'MEDIUM',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'walnut-aphid-monitoring',
      type: 'MONITORING',
      title: 'Vigilancia de pulgón Chromaphis juglandicola',
      rationale:
        'Revisar envés de hojas semanalmente desde mayo. Umbral 15 pulgones/foliolo: liberar Adalia bipunctata o tratar con jabón potásico.',
      scientificBasis:
        'GIP MAPA nogal: jabón potásico al 1-2 % es eficaz y respeta auxiliares.',
      windowStartDoy: doy(5, 15),
      windowEndDoy: doy(7, 31),
      priority: 'MEDIUM',
    },
    {
      id: 'walnut-harvest',
      type: 'HARVEST',
      title: 'Recolección con vibrador',
      rationale:
        'Cuando >80 % de pericarpios se han abierto. Chandler ~15-30 sept en Burgos; Franquette más tardío (1ª-2ª semana oct). Secado posterior crítico.',
      scientificBasis:
        'Buchner et al. (2003): retraso de recolección > 7 días tras maduración multiplica por 3 daños por hongos en almendra.',
      windowStartDoy: doy(9, 10),
      windowEndDoy: doy(10, 25),
      priority: 'URGENT',
      guidanceKey: 'nut-harvest-shaker',
    },
    {
      id: 'walnut-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra cubierta otoño-invierno',
      rationale:
        'Veza + avena + trébol subterráneo a 60-80 kg/ha tras lluvia útil.',
      scientificBasis: 'Abdalla et al. (2019).',
      windowStartDoy: doy(9, 25),
      windowEndDoy: doy(11, 5),
      priority: 'HIGH',
      guidanceKey: 'cover-crop-sowing',
    },
    {
      id: 'walnut-annual-review',
      type: 'MONITORING',
      title: 'Cierre de campaña',
      rationale: 'Producción, % nuez vana, daños bacterianos, decisiones para próximo año.',
      scientificBasis: 'Buena práctica.',
      windowStartDoy: doy(12, 1),
      windowEndDoy: doy(12, 20),
      priority: 'MEDIUM',
    },
  ],
};
