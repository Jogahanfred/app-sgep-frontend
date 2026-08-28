import { forkJoin, map, Observable } from 'rxjs';
import type {
  FaqItem,
  HelpTopic,
  NeedOption,
  Product,
  Promotion,
} from '../../domain/entities';
import type { FaqRepository, ProductRepository, PromotionRepository } from '../../ports';

export interface HomeContent {
  featuredProducts: Product[];
  promotions: Promotion[];
  financingProducts: Product[];
  investmentProducts: Product[];
  faqs: FaqItem[];
  helpTopics: HelpTopic[];
  needOptions: NeedOption[];
}

export class GetHomeContent {
  constructor(
    private readonly products: ProductRepository,
    private readonly promotions: PromotionRepository,
    private readonly faqs: FaqRepository,
  ) {}

  execute(): Observable<HomeContent> {
    return forkJoin({
      featuredProducts: this.products.getFeaturedProducts(),
      promotions: this.promotions.getPromotions(),
      financingLoans: this.products.getProductsByCategory('loan'),
      financingMortgages: this.products.getProductsByCategory('mortgage'),
      investmentProducts: this.products.getProductsByCategory('investment'),
      faqs: this.faqs.getFaqs(),
      helpTopics: this.faqs.getHelpTopics(),
      needOptions: this.products.getNeedOptions(),
    }).pipe(
      map(({ financingLoans, financingMortgages, ...rest }) => ({
        ...rest,
        financingProducts: [...financingLoans, ...financingMortgages],
      })),
    );
  }
}
