import { Pipe, PipeTransform } from '@angular/core';
import { formatEur } from '../utils/format-eur';

@Pipe({
  name: 'eur',
})
export class EurPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return formatEur(value);
  }
}
