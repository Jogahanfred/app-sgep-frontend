import { Observable } from 'rxjs';
import type { FaqItem, HelpTopic } from '../domain/entities';

export interface FaqRepository {
  getFaqs(): Observable<FaqItem[]>;
  getHelpTopics(): Observable<HelpTopic[]>;
}
