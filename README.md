# Helvia Banca

Landing bancaria de particulares construida con **Angular 22**, TypeScript, SCSS y **arquitectura hexagonal** (puertos y adaptadores).

Helvia es una marca ficticia. El diseño se inspira en las convenciones de las webs de banca retail (jerarquía, navegación, cards, simulador, FAQ), no en la identidad visual ni en los contenidos de ninguna entidad real.

## Requisitos

- Node.js **≥ 22.22.3** (ver `.nvmrc`)
- npm 10+

## Instalar

```bash
npm install
```

## Ejecutar

```bash
npm start
```

La aplicación queda en [http://localhost:43141](http://localhost:43141).

## Tests

```bash
npm test
```

En CI, sin watch:

```bash
npm run test:ci
```

## Lint y formato

```bash
npm run lint
npm run format
```

## Producción

```bash
npm run build
```

La salida estática queda en `dist/helvia-banca/browser`. Sirve como SPA (hay un `vercel.json` con rewrite a `index.html`).

---

## Arquitectura

```
src/app/
├── core/
│   ├── domain/          Entidades y reglas puras (sin Angular)
│   ├── application/     Casos de uso + mapeos
│   ├── ports/           Interfaces de repositorio
│   ├── adapters/        Mock (activo) y HTTP (ejemplo)
│   └── di/              Tokens y factories
├── features/            Páginas (home, cuentas, tarjetas, préstamos, hipotecas, inversión)
├── shared/              Design system y utilidades
└── layout/              Header, navegación, menú móvil, footer
```

### Dirección de dependencias

```
PRESENTACIÓN (páginas / componentes)
        ↓
APLICACIÓN (casos de uso)
        ↓
PUERTOS (interfaces)
        ↓
ADAPTADORES (mock / HTTP)
```

El **dominio** no importa Angular, HTTP ni APIs del navegador.

Los componentes **nunca** inyectan un mock. Inyectan un caso de uso. El caso de uso recibe un puerto. El puerto se resuelve en `CORE_PROVIDERS` con un adaptador.

```
ProductCard / HomePage
        ↓
GetFeaturedProducts / GetHomeContent
        ↓
ProductRepository (interface)
        ↓
MockProductRepository
```

### Casos de uso

| Caso de uso | Puerto |
|---|---|
| `GetHomeContent` | Product, Promotion, Faq |
| `GetFeaturedProducts` | Product |
| `GetProductsByNeed` | Product |
| `GetPromotions` | Promotion |
| `GetAccounts` | Account |
| `GetCards` | Card |
| `GetLoans` / `GetMortgages` | Loan |
| `GetInvestmentProducts` | Investment |
| `GetFaqs` / `GetHelpTopics` | Faq |
| `CalculateLoanInstallment` | Dominio (`calculateFrenchAmortization`) |
| `CalculateMortgageInstallment` | Dominio (`calculateMortgageAmortization`) |

Los casos de uso son clases TypeScript planas. Angular solo aparece en `core/di` para registrar factories.

---

## Cómo reemplazar mocks por una API real

1. Implementa el puerto (ya existe un esqueleto):

```ts
// src/app/core/adapters/http/http-product.repository.ts
export class HttpProductRepository implements ProductRepository {
  constructor(private readonly http: HttpClient, private readonly baseUrl = '/api') {}
  getFeaturedProducts() {
    return this.http.get<Product[]>(`${this.baseUrl}/products/featured`);
  }
  // ...
}
```

2. En `src/app/core/di/providers.ts` cambia solo el `provide` del puerto:

```ts
{ provide: PRODUCT_REPOSITORY, useClass: HttpProductRepository }
```

3. Añade `provideHttpClient()` en `app.config.ts`.

La home, las páginas de producto y los casos de uso **no se tocan**.

---

## Cómo crear un producto nuevo

1. Añádelo al catálogo del adaptador (`src/app/core/adapters/mock/catalog.data.ts`) o al endpoint cuando exista API.
2. Respeta el contrato de `Product` (o de `Account`, `Loan`, etc. y usa el mapper en `application/mappers`).
3. `ProductSection` / `ProductCatalog` / `ProductCard` recogen el ítem sin cambios en el padre.

No hace falta editar `HomePage` para listar un préstamo o un fondo nuevo.

---

## Cómo crear un componente reutilizable

1. Colócalo en `src/app/shared/components/<nombre>/`.
2. Standalone, `OnPush`, `input()` / `output()`.
3. Usa las variables de `src/styles/_tokens.scss` (`--color-primary`, `--spacing-md`, `--radius-lg`…).
4. Cubre estados: default, hover, focus, disabled, loading, error o empty si aplica.
5. Si es un patrón de negocio (no UI tonta), el componente **pinta**; el caso de uso **decide**.

Ejemplo de la calculadora: `LoanCalculator` solo valida el formulario y llama a `CalculateLoanInstallment`. La fórmula francesa vive en `core/domain/services/loan-calculator.ts`.

---

## Rutas

| Ruta | Página |
|---|---|
| `/` | Home |
| `/cuentas` | Cuentas |
| `/tarjetas` | Tarjetas |
| `/prestamos` | Préstamos + simulador |
| `/hipotecas` | Hipotecas |
| `/inversion` | Inversión |
| `/hazte-cliente` | Alta (formulario demo) |

Las features se cargan con **lazy loading** (`loadComponent`).

---

## Design system

Identidad propia: rojo de marca (`#ec0000`), teal de controles (`#0b5c5e`) y tipografía Manrope.

Tokens en `src/styles/_tokens.scss`. Breakpoints: 480 / 768 / 1024 / 1280.

Componentes: `Button`, `Card`, `ProductCard`, `PromotionCard`, `HeroBanner`, `Section`, `Container`, `Grid`, `Badge`, `Icon`, `Accordion`, `Tabs`, `Input`, `SelectMenu`, `ChoiceGroup`, `AmountField`, `RangeSlider`, `SegmentedPills`, `ToggleSwitch`, `CheckField`, `ErrorHint`, `QuoteCard`, `HelpAside`, `StepRail`, `FormCard`, `CalcPanel`, `Modal`, `Breadcrumb`, `Alert`, `Skeleton`, menús de navegación.

---

## Árbol de la home

```
HomePage
 ├── HeroBanner
 ├── NeedSelectorSection → Tabs + ProductCard
 ├── ProductSection (destacados)
 ├── PromotionSection → PromotionCard
 ├── ProductSection (financiación)
 ├── LoanCalculator
 ├── ProductSection (inversión)
 ├── HelpSection
 └── FaqSection → Accordion
```

---

## Tests mínimos

- Dominio: `loan-calculator.spec.ts`
- Aplicación: `calculate-loan-installment`, `get-featured-products`, `get-home-content`
- UI: `ProductCard`, `PromotionCard`, `Header`, `LoanCalculator`, `Accordion`
