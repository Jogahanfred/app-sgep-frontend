# APP-SGEP-FRONTEND

Frontend del **Sistema de Gestión y Evaluación de Pilotos (SGEP)** construido con Angular 22, TypeScript, SCSS y arquitectura hexagonal (puertos y adaptadores).

SGEP es una plataforma orientada a la gestión, formación, evaluación y seguimiento de pilotos y personal relacionado con las operaciones de instrucción.

## Requisitos

Node.js ≥ 22.22.3 (ver .nvmrc)  
npm 10+

## Instalar

```bash
npm install

Ejecutar
npm start

La aplicación queda en http://localhost:43141.

Para un enlace público (túnel), primero npm run build y luego npm run start:public. Eso sirve el build estático en el puerto 43142, sin Vite, para que los clics y las rutas funcionen detrás de Cloudflare.

Tests
npm test

En CI, sin watch:

npm run test:ci

Lint y formato
npm run lint

npm run format

Producción
npm run build

La salida estática queda en dist/app-sgep-frontend/browser. Sirve como SPA (hay un vercel.json con rewrite a index.html).

Arquitectura
El proyecto utiliza arquitectura hexagonal (Ports & Adapters), manteniendo separadas las reglas de negocio, los casos de uso, los contratos y las implementaciones de infraestructura.

src/app/
├── core/
│   ├── domain/          Entidades y reglas puras (sin Angular)
│   ├── application/     Casos de uso + mapeos
│   ├── ports/           Interfaces de repositorio
│   ├── adapters/        Mock (activo) y HTTP (ejemplo)
│   └── di/              Tokens y factories
├── features/            Páginas y funcionalidades
├── shared/              Design system y utilidades
└── layout/              Header, navegación, menú móvil, footer

Dirección de dependencias
PRESENTACIÓN (páginas / componentes)
        ↓
APLICACIÓN (casos de uso)
        ↓
PUERTOS (interfaces)
        ↓
ADAPTADORES (mock / HTTP)

El dominio no importa Angular, HTTP ni APIs del navegador.

Los componentes nunca inyectan un mock. Inyectan un caso de uso. El caso de uso recibe un puerto. El puerto se resuelve en CORE_PROVIDERS con un adaptador.

Ejemplo:

Componente / Página
        ↓
Caso de uso
        ↓
Puerto (interface)
        ↓
Adaptador (Mock / HTTP)

Casos de uso
Caso de uso	Puerto
GetCurrentUser	UserProfile
UpdateUser*	UserProfile
ChangeUserPassword	UserProfile
GetAdminUser	AdminCatalog
ListAdminUsers	AdminCatalog
CreateAdminUser	AdminCatalog
UpdateAdminUser	AdminCatalog
ListUserRoles	AdminCatalog
CreateUserRole	AdminCatalog
UpdateUserRole	AdminCatalog
ListSpecialties	AdminCatalog
CreateSpecialty	AdminCatalog
UpdateSpecialty	AdminCatalog
ListUnits	UnitCatalog
CreateUnit	UnitCatalog
UpdateUnit	UnitCatalog
ListSquadrons	SquadronCatalog
CreateSquadron	SquadronCatalog
ListTemporaryCommissions	TemporaryCommissionCatalog
CreateTemporaryCommission	TemporaryCommissionCatalog
UpdateTemporaryCommission	TemporaryCommissionCatalog
ListOperations	OperationCatalog
CreateOperation	OperationCatalog
UpdateOperation	OperationCatalog
ListMissionTypes	MissionTypeCatalog
CreateMissionType	MissionTypeCatalog
UpdateMissionType	MissionTypeCatalog
ListManeuvers	ManeuverBankCatalog
CreateManeuver	ManeuverBankCatalog
UpdateManeuver	ManeuverBankCatalog
ListStandards	StandardCatalog
CreateStandard	StandardCatalog
UpdateStandard	StandardCatalog
ListStandardWeightings	StandardWeightingCatalog
CreateStandardWeighting	StandardWeightingCatalog
ListPrograms	ProgramCatalog
CreateProgram	ProgramCatalog
UpdateProgram	ProgramCatalog
ListPhases	PhaseBankCatalog
CreatePhase	PhaseBankCatalog
UpdatePhase	PhaseBankCatalog
ListSubphases	SubphaseBankCatalog
CreateSubphase	SubphaseBankCatalog
UpdateSubphase	SubphaseBankCatalog
ListFleets	FleetCatalog
CreateFleet	FleetCatalog
UpdateFleet	FleetCatalog
ListAircraft	AircraftCatalog
CreateAircraft	AircraftCatalog
UpdateAircraft	AircraftCatalog

Los casos de uso son clases TypeScript planas. Angular solo aparece en core/di para registrar factories y resolver las dependencias.

Cómo reemplazar mocks por una API real
Los adaptadores Mock permiten trabajar con datos locales mientras no exista una API real.

Para reemplazar un Mock por una API real, implementa el puerto correspondiente en src/app/core/adapters/http/.

Ejemplo:

export class HttpUserRepository implements UserRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl = '/api'
  ) {}

  getCurrentUser() {
    return this.http.get<UserEntity>(
      `${this.baseUrl}/users/me`
    );
  }
}

En src/app/core/di/providers.ts cambia solo el provide del puerto:

{
  provide: USER_REPOSITORY,
  useClass: HttpUserRepository
}

Añade provideHttpClient() en app.config.ts.

Las páginas y los casos de uso no deberían depender directamente de la implementación HTTP.

Cómo crear un catálogo nuevo
Añádelo al adaptador Mock correspondiente en src/app/core/adapters/mock/ o al endpoint cuando exista una API real.

Respeta el contrato de la entidad correspondiente y utiliza los mappers definidos en application/mappers cuando sea necesario.

La capa de presentación debe consumir casos de uso y contratos, evitando dependencias directas con los adaptadores.

Cómo crear un componente reutilizable
Colócalo en src/app/shared/components/ui-<nombre>/ si es un control de UI reutilizable.

Selector:

ui-<nombre>

Los componentes deben ser standalone, utilizar OnPush cuando corresponda y trabajar con input() / output().

Usa las variables definidas en:

src/styles/_tokens.scss

Ejemplos:

--color-primary
--spacing-md
--radius-lg

Cubre los estados que correspondan:

default
hover
focus
disabled
loading
error
empty

Si es un patrón de negocio y no un componente de UI genérico, el componente pinta y el caso de uso decide.

Rutas
Ruta	Página
/	Inicio
/perfil	Mi perfil
/perfil/usuario	Ficha de acceso de la persona logueada
/perfil/roles	Roles asignados a la persona
/perfil/especialidades	Especialidades asignadas a la persona
/catalogo/usuarios	Catálogo de personas
/catalogo/roles	Catálogo de roles
/catalogo/especialidades	Catálogo de especialidades
/catalogo/unidades	Unidades donde opera el personal
/catalogo/escuadrones	Escuadrones ligados a una unidad
/catalogo/comisiones-temporales	Comisiones temporales
/catalogo/operaciones	Operaciones de instrucción
/catalogo/tipos-de-mision	Tipos de misión
/catalogo/maniobras	Banco de maniobras
/catalogo/estandares	Estándares
/catalogo/ponderaciones	Ponderaciones
/catalogo/programas	Programas de formación
/catalogo/programas/:id/flujo	Flujo de fases, subfases y matriz
/catalogo/banco-fases	Banco maestro de fases
/catalogo/banco-subfases	Banco maestro de subfases
/catalogo/flotas	Flotas
/catalogo/aeronaves	Aeronaves

Las features se cargan con lazy loading mediante loadComponent.

Administración
El header incluye Configuración, con un mega-menú organizado en cinco áreas:

Catálogos
Instrucción
Formación académica
Estructura operativa
Material aéreo
Instrucción y Formación académica no son pestañas de primer nivel.

Formación académica
La gestión de programas permite definir itinerarios compuestos por fases y subfases.

Programa
   ↓
Fase
   ↓
Subfase
   ↓
Matriz

El flujo del programa permite recorrer la estructura de formación y configurar los elementos asociados a cada fase y subfase.

La matriz relaciona misiones y maniobras:

                 MISIONES
             M1    M2    M3
           ┌────┬────┬────┐
MANIOBRA 1 │ X  │    │ X  │
           ├────┼────┼────┤
MANIOBRA 2 │    │ X  │    │
           ├────┼────┼────┤
MANIOBRA 3 │ X  │ X  │    │
           └────┴────┴────┘

Estructura operativa
El sistema contempla la gestión de:

Unidades
Escuadrones
Operaciones
Tipos de misión
Comisiones temporales
Las comisiones temporales utilizan un flujo de estados:

Registrado
    ↓
Aprobado
    ↓
Activo
    ↓
Finalizado

Material aéreo
El sistema contempla la gestión de:

Flotas
Aeronaves
Matrículas
Unidades
Operativa
Las aeronaves pueden asociarse a una flota y unidad, además de disponer de información visual y operativa.

Design system
Identidad visual propia basada en una interfaz limpia y corporativa.

Tipografía: Manrope.

Tokens en:

src/styles/_tokens.scss

Breakpoints:

480 / 768 / 1024 / 1280

Componentes de layout:

Button
Card
HeroBanner
Section
Container
Grid
Badge
Icon
Accordion
Tabs
Modal
Breadcrumb
Alert
Skeleton

Controles de formulario en src/app/shared/components/ui-*:

ui-radio-card-group
ui-stepper-input
ui-range-slider
ui-amount-field
ui-segmented-control
ui-toggle
ui-select
ui-table
ui-checkbox
ui-input
ui-textarea
ui-date-picker
ui-error
ui-info
ui-field-label
ui-result-card
ui-help
ui-steps
ui-form-card
ui-calc-panel
ui-avatar
ui-siga-loader
ui-loading

Barrel:

src/app/shared/components/ui/index.ts

Árbol de la aplicación
App
 ├── Layout
 │   ├── Header
 │   ├── Navegación
 │   ├── Menú móvil
 │   └── Footer
 │
 ├── Perfil
 │   ├── Usuario
 │   ├── Roles
 │   └── Especialidades
 │
 └── Administración
     ├── Catálogos
     │   ├── Usuarios
     │   ├── Roles
     │   ├── Especialidades
     │   ├── Unidades
     │   ├── Escuadrones
     │   ├── Comisiones temporales
     │   ├── Operaciones
     │   ├── Tipos de misión
     │   ├── Maniobras
     │   ├── Estándares
     │   ├── Ponderaciones
     │   ├── Flotas
     │   └── Aeronaves
     │
     ├── Formación académica
     │   ├── Programas
     │   ├── Fases
     │   ├── Subfases
     │   └── Matriz
     │
     └── Instrucción

Tests mínimos
Dominio
user-profile.spec.ts
admin-catalog.spec.ts

Aplicación
get-current-user
update-user-contact
change-user-password
create-admin-user
create-user-role
create-specialty

UI
Header
ProfilePage
MyUserPage
UsersListPage
UiTable
Accordion

Convenciones
El proyecto sigue una separación clara de responsabilidades entre:

Presentación
Aplicación
Dominio
Puertos
Adaptadores
Las reglas de negocio deben permanecer en el dominio o en los casos de uso correspondientes.

Los componentes de presentación no deben acceder directamente a repositorios, HTTP ni adaptadores concretos.

About
SGEP — Sistema de Gestión y Evaluación de Pilotos

Frontend de la plataforma para la gestión, formación, evaluación y seguimiento de pilotos.

El proyecto utiliza arquitectura hexagonal para mantener desacopladas las reglas de negocio, los casos de uso, las interfaces de infraestructura y la capa de presentación.