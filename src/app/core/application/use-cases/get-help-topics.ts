import { Observable } from 'rxjs';
import type { HelpTopic } from '../../domain/entities';
import type { FaqRepository } from '../../ports';

export class GetHelpTopics {
  constructor(private readonly faqs: FaqRepository) {}

  execute(): Observable<HelpTopic[]> {
    return this.faqs.getHelpTopics();
  }
}
