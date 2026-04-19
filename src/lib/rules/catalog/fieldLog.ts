import type { Proposal, Rule } from '../types';

export const fieldLogInactivity: Rule = {
  id: 'field-log-inactivity',
  title: 'Sin anotaciones en el cuaderno',
  description: 'Avisa si no hay entradas de cuaderno en 30 días.',
  category: 'FIELD_LOG',
  evaluate(ctx): Proposal[] {
    if (!ctx.lastFieldLogDate) {
      return [
        {
          kind: 'ALERT',
          severity: 'INFO',
          title: 'Cuaderno vacío',
          message:
            'No hay anotaciones para esta parcela. El cuaderno de campo es la base del análisis regenerativo: apunta aunque sea una línea por operación.',
        },
      ];
    }
    const days = (ctx.now.getTime() - ctx.lastFieldLogDate.getTime()) / (24 * 3600 * 1000);
    if (days < 30) return [];
    return [
      {
        kind: 'ALERT',
        severity: 'INFO',
        title: `Sin anotaciones en ${Math.floor(days)} días`,
        message:
          'Lleva más de un mes sin registrar operaciones. Revisa si falta apuntar monitoreos de plagas, cubiertas o riegos.',
      },
    ];
  },
};
