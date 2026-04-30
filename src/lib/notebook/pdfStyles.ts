/**
 * Paleta y estilos compartidos por los PDFs imprimibles de Fincas
 * (cuaderno de campo y plan anual). Mantenerlos en un solo sitio evita
 * que dos PDFs convivan con paletas distintas: el de cuaderno usaba
 * slate frío original y el plan anual ya estrenó la paleta cálida.
 *
 * Inspiración: papel de cuaderno reciclado (`bone`), tinta verde de
 * marca, énfasis en datos tabulares con `tabular-nums`.
 */
export const PDF_BASE_STYLES = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: #1c1a16;
    margin: 0;
    padding: 16px;
    font-size: 11px;
    line-height: 1.45;
    font-variant-numeric: tabular-nums;
  }
  h1 { font-size: 22px; margin: 0 0 4px; color: #1e4826; letter-spacing: -0.01em; }
  h2 { font-size: 13px; margin: 18px 0 6px; color: #1e4826; }
  h3 {
    font-size: 14px;
    margin: 14px 0 6px;
    padding: 4px 10px;
    background: #eef7ef;
    color: #1e4826;
    border-left: 4px solid #2f6b3a;
    border-radius: 2px;
  }
  .meta { color: #5a5246; font-size: 10px; margin-bottom: 12px; }
  .summary {
    display: grid; gap: 8px; margin: 12px 0 16px;
  }
  .stat {
    border: 1px solid #d9d6cc; border-radius: 6px; padding: 8px;
    background: #fbf9f5;
  }
  .stat .label {
    font-size: 9px; text-transform: uppercase; color: #73695a;
    letter-spacing: .04em;
  }
  .stat .value { font-size: 16px; font-weight: 600; color: #1e4826; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead th {
    background: #f5f1e9; text-align: left; padding: 6px 8px;
    border-bottom: 1px solid #bcb7a8; font-weight: 600;
    color: #2c2924;
  }
  tbody td {
    padding: 6px 8px; border-bottom: 1px solid #ecebe4; vertical-align: top;
    color: #2c2924;
  }
  tbody tr.voided { color: #988f7c; text-decoration: line-through; }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 9999px;
    font-size: 10px; margin-left: 6px; vertical-align: middle;
  }
  .badge-void { background: #fbf3ee; color: #8b4f37; }
  .nowrap { white-space: nowrap; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer {
    margin-top: 24px; color: #73695a; font-size: 9px;
    border-top: 1px solid #ecebe4; padding-top: 8px;
  }
  @media print {
    body { padding: 0; }
    section, .month { break-inside: avoid; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
`;
