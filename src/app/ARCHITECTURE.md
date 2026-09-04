# Arquitectura de `src/app`

Este proyecto aplica arquitectura hexagonal con Angular como adaptador de entrada. La organización física refleja los límites de dependencia para que la interfaz pueda evolucionar sin trasladar reglas de negocio a componentes.

## Capas

### `core/domain`

Contiene entidades, errores y servicios de dominio puros.

- No importa Angular, RxJS, HTTP, almacenamiento del navegador ni código de presentación.
- Puede depender únicamente de otros archivos del dominio.
- Las reglas que deben cumplirse en cualquier interfaz viven aquí.

### `core/application`

Contiene casos de uso y mapeos.

- Orquesta el dominio a través de puertos.
- No conoce componentes, páginas, adaptadores concretos ni el contenedor de DI.
- Un caso de uso expone una intención de negocio; no detalles de pantalla.

### `core/ports`

Define los contratos requeridos por la aplicación.

- Los repositorios son interfaces del núcleo.
- Pueden usar tipos del dominio y abstracciones técnicas mínimas como `Observable`.
- Nunca importan una implementación mock, HTTP o Angular DI.

### `core/adapters`

Implementa los puertos de salida.

- `mock/` permite ejecutar el proyecto sin backend.
- `http/` contiene implementaciones para una API real.
- Un adaptador depende del puerto que implementa, no al contrario.

### `core/di`

Es el composition root.

- Registra tokens, factories y adaptadores concretos.
- Es el único lugar que decide qué implementación satisface cada puerto.
- No contiene reglas de negocio.

## Presentación

### `features/<feature>/presentation`

Cada feature organiza su interfaz por responsabilidad:

```text
presentation/
├── pages/
│   └── users-list/
│       ├── users-list.page.ts
│       ├── users-list.page.html
│       ├── users-list.page.scss
│       └── users-list.page.spec.ts
├── components/
├── sections/
├── layouts/
└── shared/
    ├── forms/
    ├── models/
    └── styles/
```

Reglas:

- Cada componente de producción tiene una carpeta exclusiva.
- Una página no importa la implementación de otra página. Los tipos comunes se extraen a `presentation/shared/models`.
- Los helpers compartidos por varias pantallas de la misma feature viven en `presentation/shared`.
- Las rutas lazy importan el archivo concreto de la página o layout.
- La presentación puede importar casos de uso, entidades y servicios de dominio, pero no adaptadores ni configuración de DI.

### `shared`

Contiene el design system, directivas, pipes, modelos genéricos y utilidades transversales.

- No depende de ninguna feature.
- Un elemento entra aquí solo si es reutilizable y no expresa una regla particular de una feature.
- Los componentes usan selector `ui-*` o `app-*`, son standalone y emplean `OnPush`.

### `layout`

Contiene los elementos permanentes de navegación y estructura visual. Incluso dentro de navegación, cada componente conserva su propia carpeta:

```text
layout/navigation/
├── data/nav.data.ts
├── mega-menu/
└── navigation-menu/
```

### `shell/app`

Contiene el componente raíz. `app.config.ts` y `app.routes.ts` permanecen en `src/app` porque configuran la aplicación, pero no son componentes.

## Flujo de dependencias

```text
Presentación ──► Aplicación ──► Dominio
                      │
                      └──────► Puertos ◄──── Adaptadores
                                      ▲
                                      └──── enlazados por core/di
```

El sentido de las flechas representa dependencias de código. En ejecución, DI entrega el adaptador al caso de uso a través del puerto.

## Comprobación automática

```bash
npm run check:architecture
```

El verificador comprueba:

- un componente de producción por carpeta;
- ubicación correcta de componentes de feature;
- existencia de plantillas y estilos declarados;
- ausencia de acoplamiento página a página;
- límites entre dominio, aplicación, puertos, adaptadores y presentación;
- resolución de imports internos mediante rutas relativas o aliases.
