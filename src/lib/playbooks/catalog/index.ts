import type { Playbook } from '../types';
import { appleDesign } from './apple-design';
import { appleTransition } from './apple-transition';
import { appleRegenerative } from './apple-regenerative';
import { vineTempranilloDesign } from './vine-tempranillo-design';
import { vineTempranilloTransition } from './vine-tempranillo-transition';
import { vineTempranilloRegenerative } from './vine-tempranillo-regenerative';
import { nutDesign } from './nut-design';
import { almondBurgos } from './almond-burgos';
import { walnutBurgos } from './walnut-burgos';
import { hazelnutBurgos } from './hazelnut-burgos';
import { pistachioBurgos } from './pistachio-burgos';

export const ALL_PLAYBOOKS: Playbook[] = [
  appleDesign,
  appleTransition,
  appleRegenerative,
  vineTempranilloDesign,
  vineTempranilloTransition,
  vineTempranilloRegenerative,
  nutDesign,
  almondBurgos,
  walnutBurgos,
  hazelnutBurgos,
  pistachioBurgos,
];

export {
  appleDesign,
  appleTransition,
  appleRegenerative,
  vineTempranilloDesign,
  vineTempranilloTransition,
  vineTempranilloRegenerative,
  nutDesign,
  almondBurgos,
  walnutBurgos,
  hazelnutBurgos,
  pistachioBurgos,
};
