const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 0,
});

export function formatEur(value: number): string {
  return formatter.format(value);
}

export function formatCompactEur(value: number): string {
  return `${compact.format(value)} €`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}
