import { Observable } from 'rxjs';
import type { FaqItem } from '../../domain/entities';
import type { FaqRepository } from '../../ports';

export class GetFaqs {
  constructor(private readonly faqs: FaqRepository) {}

  execute(): Observable<FaqItem[]> {
    return this.faqs.getFaqs();
  }
}
