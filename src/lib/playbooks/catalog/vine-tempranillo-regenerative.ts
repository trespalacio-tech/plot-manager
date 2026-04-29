import type { Playbook } from '../types';
import { doy } from '../types';

export const vineTempranilloRegenerative: Playbook = {
  id: 'vine-tempranillo-regenerative-burgos',
  title: 'Viñedo Tempranillo regenerativo (Burgos)',
  description:
    'Viñedo estable: cubierta permanente, cobre mínimo, deshojado selectivo, foco en calidad uva y biodiversidad.',
  cropType: 'VINEYARD',
  species: 'tempranillo',
  applicableStatuses: ['REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'vine-reg-winter-prune',
      type: 'PRUNING',
      title: 'Poda de equilibrio anual',
      rationale:
        'Mantener carga equilibrada (8-12 yemas/m lineal) y sanear únicamente cortes grandes.',
      scientificBasis:
        'Smart & Robinson (1991): carga equilibrada vs. vigor estabiliza microclima de racimo.',
      windowStartDoy: doy(1, 15),
      windowEndDoy: doy(3, 5),
      priority: 'MEDIUM',
    },
    {
      id: 'vine-reg-mildew-monitor',
      type: 'MONITORING',
      title: 'Monitoreo mildiu con modelo 3-10',
      rationale:
        'Intervenciones solo en eventos validados por modelo; cobre máx. 4 kg Cu/ha·año.',
      scientificBasis:
        'Rossi et al. (2008); UE Reglamento 2019/1981 sobre cobre.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(7, 15),
      priority: 'HIGH',
      guidanceKey: 'pest-trap-monitoring',
    },
    {
      id: 'vine-reg-cover-mowing',
      type: 'MOWING',
      title: 'Siega alta de cubierta permanente',
      rationale:
        'Siegas altas (10-12 cm) en calles alternas minimizan competencia hídrica y mantienen diversidad.',
      scientificBasis:
        'Ripoche et al. (2010): siega alta conserva raíces y reduce temperatura del suelo en estío.',
      windowStartDoy: doy(5, 1),
      windowEndDoy: doy(6, 30),
      priority: 'MEDIUM',
    },
    {
      id: 'vine-reg-harvest-plan',
      type: 'HARVEST',
      title: 'Planificar vendimia por parcelas y cuarteles',
      rationale:
        'Seguimiento Brix, acidez total, pH y fenoles para decidir fecha óptima por cuartel.',
      scientificBasis:
        'Kennedy et al. (2006): madurez fenólica y azucarada evolucionan de forma distinta; vendimiar solo por Brix baja calidad.',
      windowStartDoy: doy(8, 25),
      windowEndDoy: doy(10, 20),
      priority: 'HIGH',
    },
    {
      id: 'vine-reg-biodiversity',
      type: 'BIODIVERSITY_INSTALL',
      title: 'Mantenimiento de franjas floridas y nidales',
      rationale:
        'Resembrar franjas floridas y revisar nidales de rapaces para control biológico natural.',
      scientificBasis:
        'Kross et al. (2016): rapaces nocturnas reducen presencia de roedores 30-50 % en viñedo.',
      windowStartDoy: doy(3, 1),
      windowEndDoy: doy(4, 15),
      priority: 'LOW',
    },
    {
      id: 'vine-reg-autumn-cover',
      type: 'COVER_CROP_SOWING',
      title: 'Resiembra de calvas en cubierta',
      rationale:
        'Resembrar puntualmente con trébol subterráneo + bromo donde falle la cubierta natural.',
      scientificBasis:
        'Pardo et al. (2018): cubiertas vivas de baja estatura mantienen funciones sin competir.',
      windowStartDoy: doy(10, 1),
      windowEndDoy: doy(11, 10),
      priority: 'LOW',
      guidanceKey: 'cover-crop-sowing',
    },
  ],
};
