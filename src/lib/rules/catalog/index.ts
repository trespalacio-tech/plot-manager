import type { Rule } from '../types';
import {
  soilAcidicPh,
  soilActiveLimestoneHigh,
  soilAlkalineChlorosis,
  soilCnHigh,
  soilLowK,
  soilLowOm,
  soilPExcess,
  soilStaleAnalysis,
} from './soil';
import {
  seasonAlmondFrost,
  seasonAutumnCoverCrop,
  seasonFruitCodlingMoth,
  seasonSpringMulching,
  seasonSummerWater,
  seasonVineyardCluster,
  seasonVineyardFlowering,
  seasonWinterPheromones,
} from './season';
import {
  transitionDesignSetup,
  transitionYear1Review,
  transitionYear3Audit,
} from './transition';
import { fieldLogInactivity } from './fieldLog';

export const ALL_RULES: Rule[] = [
  soilLowOm,
  soilAcidicPh,
  soilAlkalineChlorosis,
  soilCnHigh,
  soilPExcess,
  soilLowK,
  soilActiveLimestoneHigh,
  soilStaleAnalysis,
  seasonWinterPheromones,
  seasonSpringMulching,
  seasonSummerWater,
  seasonAutumnCoverCrop,
  seasonAlmondFrost,
  seasonVineyardFlowering,
  seasonVineyardCluster,
  seasonFruitCodlingMoth,
  transitionDesignSetup,
  transitionYear1Review,
  transitionYear3Audit,
  fieldLogInactivity,
];

export * from './soil';
export * from './season';
export * from './transition';
export * from './fieldLog';
