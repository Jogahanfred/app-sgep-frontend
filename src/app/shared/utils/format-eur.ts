const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

export function formatEur(value: number): string {
  return formatter.format(value);
}
