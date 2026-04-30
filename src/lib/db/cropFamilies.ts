import type { CropType } from './types';

/**
 * Familias de cultivo. Usadas para que las reglas y recomendaciones
 * agronómicas apliquen a varias especies emparentadas sin tener que
 * enumerar cada CropType en cada condicional.
 *
 * - "Tree": cualquier leñoso de pepita, hueso o frutos secos. Comparte
 *   manejo de portainjertos, marco amplio, poda anual, dependencia de
 *   horas de frío y vulnerabilidad a heladas tardías.
 * - "Vine": vid (estructura de espaldera, ciclo distinto).
 * - MIXED entra en ambas familias por convención: hereda manejo de
 *   leñoso y de vid si las tiene mezcladas.
 */

export function isTreeCrop(cropType: CropType | undefined): boolean {
  return (
    cropType === 'FRUIT_TREE' ||
    cropType === 'NUT_TREE' ||
    cropType === 'MIXED'
  );
}

export function isVineCrop(cropType: CropType | undefined): boolean {
  return cropType === 'VINEYARD' || cropType === 'MIXED';
}
