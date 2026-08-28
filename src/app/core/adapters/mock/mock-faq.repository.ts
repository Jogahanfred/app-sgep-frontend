import { Observable } from 'rxjs';
import type { FaqItem, HelpTopic } from '../../domain/entities';
import type { FaqRepository } from '../../ports';
import { FAQS, HELP_TOPICS } from './catalog.data';
import { asMockStream } from './observable-of';

export class MockFaqRepository implements FaqRepository {
  getFaqs(): Observable<FaqItem[]> {
    return asMockStream(FAQS);
  }

  getHelpTopics(): Observable<HelpTopic[]> {
    return asMockStream(HELP_TOPICS);
  }
}
