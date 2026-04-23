import type { Playbook } from '../types';
import { appleDesign } from './apple-design';
import { appleTransition } from './apple-transition';
import { appleRegenerative } from './apple-regenerative';
import { vineTempranilloDesign } from './vine-tempranillo-design';
import { vineTempranilloTransition } from './vine-tempranillo-transition';
import { vineTempranilloRegenerative } from './vine-tempranillo-regenerative';

export const ALL_PLAYBOOKS: Playbook[] = [
  appleDesign,
  appleTransition,
  appleRegenerative,
  vineTempranilloDesign,
  vineTempranilloTransition,
  vineTempranilloRegenerative,
];

export {
  appleDesign,
  appleTransition,
  appleRegenerative,
  vineTempranilloDesign,
  vineTempranilloTransition,
  vineTempranilloRegenerative,
};
