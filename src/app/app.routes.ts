import { Routes } from '@angular/router';
import { authGuard } from './layout/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
    data: {
      seo: {
        title: 'Helvia Banca | Banca para particulares',
        description:
          'Cuentas, tarjetas, préstamos, hipotecas e inversión con una banca clara. Helvia es una entidad ficticia de demostración.',
      },
    },
  },
  {
    path: 'cuentas',
    loadComponent: () => import('./features/accounts/accounts.page').then((m) => m.AccountsPage),
    data: {
      seo: {
        title: 'Cuentas | Helvia Banca',
        description: 'Cuenta Clara, Ahorro Lumbre y Cuenta Brújula. Comisiones visibles y operativa digital.',
      },
    },
  },
  {
    path: 'tarjetas',
    loadComponent: () => import('./features/cards/cards.page').then((m) => m.CardsPage),
    data: {
      seo: {
        title: 'Tarjetas | Helvia Banca',
        description: 'Tarjeta Norte, Delta y Viajera. Control de límites, PIN y pagos móviles desde la app.',
      },
    },
  },
  {
    path: 'prestamos',
    loadComponent: () => import('./features/loans/loans.page').then((m) => m.LoansPage),
    data: {
      seo: {
        title: 'Préstamos | Helvia Banca',
        description: 'Simula la cuota de un préstamo personal, de movilidad o de reforma con el sistema francés.',
      },
    },
  },
  {
    path: 'hipotecas',
    loadComponent: () => import('./features/mortgages/mortgages.page').then((m) => m.MortgagesPage),
    data: {
      seo: {
        title: 'Hipotecas | Helvia Banca',
        description: 'Hipoteca fija, variable o mixta. Hasta el 80% de financiación y gestor personal.',
      },
    },
  },
  {
    path: 'inversion',
    loadComponent: () => import('./features/investments/investments.page').then((m) => m.InvestmentsPage),
    data: {
      seo: {
        title: 'Inversión | Helvia Banca',
        description: 'Fondos, ahorro, planes de jubilación y asesoría. El riesgo se explica antes de contratar.',
      },
    },
  },
  {
    path: 'hazte-cliente',
    loadComponent: () => import('./features/onboarding/onboarding.page').then((m) => m.OnboardingPage),
    data: {
      seo: {
        title: 'Hazte cliente | Helvia Banca',
        description: 'Inicia el alta digital de Helvia. Formulario de demostración, sin envío real de datos.',
      },
    },
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.layout').then((m) => m.ProfileLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
        data: {
          seo: {
            title: 'Mi perfil | SIGA',
            description: 'Foto, datos personales, correo y seguridad de tu perfil.',
          },
        },
      },
      {
        path: 'usuario',
        loadComponent: () => import('./features/profile/my-user.page').then((m) => m.MyUserPage),
        data: {
          seo: {
            title: 'Usuario | SIGA',
            description: 'Tu ficha de acceso: nombres, correo, documento, ingreso e indicativo.',
          },
        },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/profile/my-assignments.page').then((m) => m.MyAssignmentsPage),
        data: {
          assignments: 'roles',
          seo: {
            title: 'Mis roles | SIGA',
            description: 'Roles asignados a tu usuario.',
          },
        },
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./features/profile/my-assignments.page').then((m) => m.MyAssignmentsPage),
        data: {
          assignments: 'specialties',
          seo: {
            title: 'Mis especialidades | SIGA',
            description: 'Especialidades vinculadas a tu usuario.',
          },
        },
      },
    ],
  },
  {
    path: 'catalogo',
    canActivate: [authGuard],
    loadComponent: () => import('./features/catalog/catalog.layout').then((m) => m.CatalogLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/catalog/users-list.page').then((m) => m.UsersListPage),
        data: {
          seo: {
            title: 'Catálogo de usuarios | SIGA',
            description: 'Personas que ingresan al sistema.',
          },
        },
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () => import('./features/catalog/user-form.page').then((m) => m.UserFormPage),
        data: {
          seo: {
            title: 'Nuevo usuario | SIGA',
            description: 'Alta de una persona en el sistema.',
          },
        },
      },
      {
        path: 'usuarios/:id/editar',
        loadComponent: () => import('./features/catalog/user-form.page').then((m) => m.UserFormPage),
        data: {
          mode: 'edit',
          seo: {
            title: 'Editar usuario | SIGA',
            description: 'Datos generales, roles y especialidades de una persona.',
          },
        },
      },
      {
        path: 'usuarios/:id',
        loadComponent: () => import('./features/catalog/user-form.page').then((m) => m.UserFormPage),
        data: {
          mode: 'view',
          seo: {
            title: 'Detalle de usuario | SIGA',
            description: 'Consulta los datos de una persona, sin modificar.',
          },
        },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/catalog/items-list.page').then((m) => m.ItemsListPage),
        data: {
          catalog: 'roles',
          seo: {
            title: 'Catálogo de roles | SIGA',
            description: 'Roles de usuario del sistema.',
          },
        },
      },
      {
        path: 'roles/nuevo',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'roles',
          seo: {
            title: 'Nuevo rol | SIGA',
            description: 'Alta de un rol de usuario.',
          },
        },
      },
      {
        path: 'roles/:id/editar',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'roles',
          mode: 'edit',
          seo: {
            title: 'Editar rol | SIGA',
            description: 'Nombre, descripción y estado del rol.',
          },
        },
      },
      {
        path: 'roles/:id',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'roles',
          mode: 'view',
          seo: {
            title: 'Detalle de rol | SIGA',
            description: 'Consulta el rol, sin modificar.',
          },
        },
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./features/catalog/items-list.page').then((m) => m.ItemsListPage),
        data: {
          catalog: 'specialties',
          seo: {
            title: 'Catálogo de especialidades | SIGA',
            description: 'Especialidades del sistema.',
          },
        },
      },
      {
        path: 'especialidades/nuevo',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'specialties',
          seo: {
            title: 'Nueva especialidad | SIGA',
            description: 'Alta de una especialidad.',
          },
        },
      },
      {
        path: 'especialidades/:id/editar',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'specialties',
          mode: 'edit',
          seo: {
            title: 'Editar especialidad | SIGA',
            description: 'Nombre, descripción y estado de la especialidad.',
          },
        },
      },
      {
        path: 'especialidades/:id',
        loadComponent: () => import('./features/catalog/item-form.page').then((m) => m.ItemFormPage),
        data: {
          catalog: 'specialties',
          mode: 'view',
          seo: {
            title: 'Detalle de especialidad | SIGA',
            description: 'Consulta la especialidad, sin modificar.',
          },
        },
      },
      {
        path: 'unidades',
        loadComponent: () => import('./features/catalog/units-list.page').then((m) => m.UnitsListPage),
        data: {
          seo: {
            title: 'Unidades | SIGA',
            description: 'Unidades donde opera el personal.',
          },
        },
      },
      {
        path: 'unidades/nuevo',
        loadComponent: () => import('./features/catalog/unit-form.page').then((m) => m.UnitFormPage),
        data: {
          seo: {
            title: 'Nueva unidad | SIGA',
            description: 'Alta de una unidad operativa.',
          },
        },
      },
      {
        path: 'unidades/:id/editar',
        loadComponent: () => import('./features/catalog/unit-form.page').then((m) => m.UnitFormPage),
        data: {
          mode: 'edit',
          seo: {
            title: 'Editar unidad | SIGA',
            description: 'Código, nombre, abreviatura y estado de la unidad.',
          },
        },
      },
      {
        path: 'unidades/:id',
        loadComponent: () => import('./features/catalog/unit-form.page').then((m) => m.UnitFormPage),
        data: {
          mode: 'view',
          seo: {
            title: 'Detalle de unidad | SIGA',
            description: 'Consulta la unidad, sin modificar.',
          },
        },
      },
      {
        path: 'escuadrones',
        loadComponent: () => import('./features/catalog/squadrons-list.page').then((m) => m.SquadronsListPage),
        data: {
          seo: {
            title: 'Escuadrones | SIGA',
            description: 'Escuadrones adscritos a cada unidad.',
          },
        },
      },
      {
        path: 'escuadrones/nuevo',
        loadComponent: () => import('./features/catalog/squadron-form.page').then((m) => m.SquadronFormPage),
        data: {
          seo: {
            title: 'Nuevo escuadrón | SIGA',
            description: 'Alta de un escuadrón operativo.',
          },
        },
      },
      {
        path: 'escuadrones/:id/editar',
        loadComponent: () => import('./features/catalog/squadron-form.page').then((m) => m.SquadronFormPage),
        data: {
          mode: 'edit',
          seo: {
            title: 'Editar escuadrón | SIGA',
            description: 'Unidad, código, nombre y estado del escuadrón.',
          },
        },
      },
      {
        path: 'escuadrones/:id',
        loadComponent: () => import('./features/catalog/squadron-form.page').then((m) => m.SquadronFormPage),
        data: {
          mode: 'view',
          seo: {
            title: 'Detalle de escuadrón | SIGA',
            description: 'Consulta el escuadrón, sin modificar.',
          },
        },
      },
      {
        path: 'comisiones-temporales',
        loadComponent: () => import('./features/catalog/commissions-list.page').then((m) => m.CommissionsListPage),
        data: {
          seo: {
            title: 'Comisiones temporales | SIGA',
            description: 'Desplazamientos temporales del personal entre unidades.',
          },
        },
      },
      {
        path: 'comisiones-temporales/nuevo',
        loadComponent: () => import('./features/catalog/commission-form.page').then((m) => m.CommissionFormPage),
        data: {
          seo: {
            title: 'Nueva comisión temporal | SIGA',
            description: 'Alta de una comisión temporal.',
          },
        },
      },
      {
        path: 'comisiones-temporales/:id/editar',
        loadComponent: () => import('./features/catalog/commission-form.page').then((m) => m.CommissionFormPage),
        data: {
          mode: 'edit',
          seo: {
            title: 'Editar comisión temporal | SIGA',
            description: 'Usuario, unidades, fechas, motivo y estado de la comisión.',
          },
        },
      },
      {
        path: 'comisiones-temporales/:id',
        loadComponent: () => import('./features/catalog/commission-form.page').then((m) => m.CommissionFormPage),
        data: {
          mode: 'view',
          seo: {
            title: 'Detalle de comisión | SIGA',
            description: 'Consulta la comisión y su timeline.',
          },
        },
      },
      {
        path: 'operaciones',
        loadComponent: () => import('./features/catalog/operations-list.page').then((m) => m.OperationsListPage),
        data: { seo: { title: 'Operaciones | SIGA', description: 'Catálogo maestro de operaciones de instrucción.' } },
      },
      {
        path: 'operaciones/nuevo',
        loadComponent: () => import('./features/catalog/operation-form.page').then((m) => m.OperationFormPage),
        data: { seo: { title: 'Nueva operación | SIGA', description: 'Alta de una operación de instrucción.' } },
      },
      {
        path: 'operaciones/:id/editar',
        loadComponent: () => import('./features/catalog/operation-form.page').then((m) => m.OperationFormPage),
        data: { mode: 'edit', seo: { title: 'Editar operación | SIGA', description: 'Nombre, descripción y estado de la operación.' } },
      },
      {
        path: 'operaciones/:id',
        loadComponent: () => import('./features/catalog/operation-form.page').then((m) => m.OperationFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de operación | SIGA', description: 'Consulta la operación, sin modificar.' } },
      },
      {
        path: 'tipos-de-mision',
        loadComponent: () => import('./features/catalog/mission-types-list.page').then((m) => m.MissionTypesListPage),
        data: { seo: { title: 'Tipos de misión | SIGA', description: 'Catálogo maestro de tipos de misión.' } },
      },
      {
        path: 'tipos-de-mision/nuevo',
        loadComponent: () => import('./features/catalog/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { seo: { title: 'Nuevo tipo de misión | SIGA', description: 'Alta de un tipo de misión.' } },
      },
      {
        path: 'tipos-de-mision/:id/editar',
        loadComponent: () => import('./features/catalog/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { mode: 'edit', seo: { title: 'Editar tipo de misión | SIGA', description: 'Código, nombre y descripción del tipo de misión.' } },
      },
      {
        path: 'tipos-de-mision/:id',
        loadComponent: () => import('./features/catalog/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de tipo de misión | SIGA', description: 'Consulta el tipo de misión, sin modificar.' } },
      },
      {
        path: 'maniobras',
        loadComponent: () => import('./features/catalog/maneuvers-list.page').then((m) => m.ManeuversListPage),
        data: { seo: { title: 'Maniobras | SIGA', description: 'Banco de maniobras de instrucción.' } },
      },
      {
        path: 'maniobras/nuevo',
        loadComponent: () => import('./features/catalog/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { seo: { title: 'Nueva maniobra | SIGA', description: 'Alta de una maniobra.' } },
      },
      {
        path: 'maniobras/:id/editar',
        loadComponent: () => import('./features/catalog/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { mode: 'edit', seo: { title: 'Editar maniobra | SIGA', description: 'Operación, código, nombre y descripción de la maniobra.' } },
      },
      {
        path: 'maniobras/:id',
        loadComponent: () => import('./features/catalog/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de maniobra | SIGA', description: 'Consulta la maniobra, sin modificar.' } },
      },
      {
        path: 'estandares',
        loadComponent: () => import('./features/catalog/standards-list.page').then((m) => m.StandardsListPage),
        data: { seo: { title: 'Estándares | SIGA', description: 'Estándares de evaluación de instrucción.' } },
      },
      {
        path: 'estandares/nuevo',
        loadComponent: () => import('./features/catalog/standard-form.page').then((m) => m.StandardFormPage),
        data: { seo: { title: 'Nuevo estándar | SIGA', description: 'Alta de un estándar.' } },
      },
      {
        path: 'estandares/:id/editar',
        loadComponent: () => import('./features/catalog/standard-form.page').then((m) => m.StandardFormPage),
        data: { mode: 'edit', seo: { title: 'Editar estándar | SIGA', description: 'Código, nombre, descripción y orden del estándar.' } },
      },
      {
        path: 'estandares/:id',
        loadComponent: () => import('./features/catalog/standard-form.page').then((m) => m.StandardFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de estándar | SIGA', description: 'Consulta el estándar, sin modificar.' } },
      },
      {
        path: 'ponderaciones',
        loadComponent: () => import('./features/catalog/weightings-list.page').then((m) => m.WeightingsListPage),
        data: { seo: { title: 'Ponderaciones | SIGA', description: 'Ponderaciones de estándares por unidad, escuadrón y programa.' } },
      },
      {
        path: 'ponderaciones/nuevo',
        loadComponent: () => import('./features/catalog/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { seo: { title: 'Nueva ponderación | SIGA', description: 'Alta de una ponderación.' } },
      },
      {
        path: 'ponderaciones/:id/editar',
        loadComponent: () => import('./features/catalog/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { mode: 'edit', seo: { title: 'Editar ponderación | SIGA', description: 'Estándar, alcance, valor y vigencia.' } },
      },
      {
        path: 'ponderaciones/:id',
        loadComponent: () => import('./features/catalog/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de ponderación | SIGA', description: 'Consulta la ponderación, sin modificar.' } },
      },
      {
        path: 'programas',
        loadComponent: () => import('./features/catalog/programs-board.page').then((m) => m.ProgramsBoardPage),
        data: {
          seo: {
            title: 'Formación académica | SIGA',
            description: 'Programas de formación y planes de estudios de la academia.',
          },
        },
      },
      {
        path: 'programas/nuevo',
        loadComponent: () => import('./features/catalog/program-studio.page').then((m) => m.ProgramStudioPage),
        data: {
          seo: {
            title: 'Nuevo programa | SIGA',
            description: 'Diseña un plan de estudios con fases, subfases, horas, misiones y maniobras.',
          },
        },
      },
      {
        path: 'programas/:id/editar',
        loadComponent: () => import('./features/catalog/program-studio.page').then((m) => m.ProgramStudioPage),
        data: {
          mode: 'edit',
          seo: {
            title: 'Diseñar programa | SIGA',
            description: 'Edita el itinerario del programa de formación.',
          },
        },
      },
      {
        path: 'programas/:id',
        loadComponent: () => import('./features/catalog/program-studio.page').then((m) => m.ProgramStudioPage),
        data: {
          mode: 'view',
          seo: {
            title: 'Itinerario del programa | SIGA',
            description: 'Consulta el plan de estudios, sin modificar.',
          },
        },
      },
      {
        path: 'banco-fases',
        loadComponent: () => import('./features/catalog/academic-bank-list.page').then((m) => m.AcademicBankListPage),
        data: {
          bank: 'phase',
          seo: {
            title: 'Banco de fases | SIGA',
            description: 'Catálogo maestro de fases de formación académica.',
          },
        },
      },
      {
        path: 'banco-fases/nuevo',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          seo: { title: 'Nuevo banco de fase | SIGA', description: 'Alta de una fase en el banco maestro.' },
        },
      },
      {
        path: 'banco-fases/:id/editar',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          mode: 'edit',
          seo: { title: 'Editar banco de fase | SIGA', description: 'Código, nombre, descripción y estado de la fase.' },
        },
      },
      {
        path: 'banco-fases/:id',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          mode: 'view',
          seo: { title: 'Detalle de banco de fase | SIGA', description: 'Consulta la fase del banco, sin modificar.' },
        },
      },
      {
        path: 'banco-subfases',
        loadComponent: () => import('./features/catalog/academic-bank-list.page').then((m) => m.AcademicBankListPage),
        data: {
          bank: 'subphase',
          seo: {
            title: 'Banco de subfases | SIGA',
            description: 'Catálogo maestro de subfases de formación académica.',
          },
        },
      },
      {
        path: 'banco-subfases/nuevo',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'subphase',
          seo: { title: 'Nuevo banco de subfase | SIGA', description: 'Alta de una subfase en el banco maestro.' },
        },
      },
      {
        path: 'banco-subfases/:id/editar',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'subphase',
          mode: 'edit',
          seo: {
            title: 'Editar banco de subfase | SIGA',
            description: 'Código, nombre, descripción y estado de la subfase.',
          },
        },
      },
      {
        path: 'banco-subfases/:id',
        loadComponent: () => import('./features/catalog/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'subphase',
          mode: 'view',
          seo: {
            title: 'Detalle de banco de subfase | SIGA',
            description: 'Consulta la subfase del banco, sin modificar.',
          },
        },
      },
      {
        path: 'flotas',
        loadComponent: () => import('./features/catalog/fleets-list.page').then((m) => m.FleetsListPage),
        data: { seo: { title: 'Flotas | SIGA', description: 'Catálogo de flotas de material aéreo.' } },
      },
      {
        path: 'flotas/nuevo',
        loadComponent: () => import('./features/catalog/fleet-form.page').then((m) => m.FleetFormPage),
        data: { seo: { title: 'Nueva flota | SIGA', description: 'Alta de una flota.' } },
      },
      {
        path: 'flotas/:id/editar',
        loadComponent: () => import('./features/catalog/fleet-form.page').then((m) => m.FleetFormPage),
        data: { mode: 'edit', seo: { title: 'Editar flota | SIGA', description: 'Tipo, código, nombre, descripción y estado de la flota.' } },
      },
      {
        path: 'flotas/:id',
        loadComponent: () => import('./features/catalog/fleet-form.page').then((m) => m.FleetFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de flota | SIGA', description: 'Consulta la flota, sin modificar.' } },
      },
      {
        path: 'aeronaves',
        loadComponent: () => import('./features/catalog/aircraft-list.page').then((m) => m.AircraftListPage),
        data: { seo: { title: 'Aeronaves | SIGA', description: 'Registro de aeronaves con imagen, flota y unidad.' } },
      },
      {
        path: 'aeronaves/nuevo',
        loadComponent: () => import('./features/catalog/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { seo: { title: 'Nueva aeronave | SIGA', description: 'Alta de una aeronave.' } },
      },
      {
        path: 'aeronaves/:id/editar',
        loadComponent: () => import('./features/catalog/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { mode: 'edit', seo: { title: 'Editar aeronave | SIGA', description: 'Unidad, flota, matrícula, operativa y estado.' } },
      },
      {
        path: 'aeronaves/:id',
        loadComponent: () => import('./features/catalog/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de aeronave | SIGA', description: 'Consulta la aeronave y su foto.' } },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
