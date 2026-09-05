import type { ReportColumn } from '@core/application';

function csvCell(value: string): string {
  if (/[;"\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function downloadReportCsv(
  filename: string,
  columns: readonly ReportColumn[],
  rows: readonly Record<string, string>[],
): void {
  const header = columns.map((column) => csvCell(column.header)).join(';');
  const body = rows.map((row) => columns.map((column) => csvCell(row[column.id] ?? '')).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
