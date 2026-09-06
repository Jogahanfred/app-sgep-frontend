import { Routes } from '@angular/router';
import { authGuard, guestGuard, operationalContextGuard } from './layout/auth.guard';
import { LOGIN_ROUTE_PATH, PROFILE_CONTEXT_ROUTE_PATH } from './layout/auth-routes.constants';

export const routes: Routes = [
  {
    path: LOGIN_ROUTE_PATH,
    canActivate: [guestGuard],
    loadComponent: () => import('./layout/login-screen/login-screen').then((m) => m.LoginScreen),
    data: {
      seo: {
        title: 'Acceso institucional | SIGA',
        description: 'Inicia sesión en el sistema integral de gestión académica.',
      },
    },
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
  {
    path: PROFILE_CONTEXT_ROUTE_PATH,
    loadComponent: () =>
      import('./features/profile-context/presentation/pages/profile-context/profile-context.page').then(
        (m) => m.ProfileContextPage,
      ),
    data: {
      seo: {
        title: 'Perfilamiento | SIGA',
        description: 'Selecciona el contexto operativo de unidad y escuadrón.',
      },
    },
  },
  {
    path: '',
    canActivate: [operationalContextGuard],
    loadComponent: () => import('./features/home/presentation/pages/home/home.page').then((m) => m.HomePage),
    data: {
      seo: {
        title: 'SGEP | Gestión Académica',
        description:
          'Gestión académica para el día a día.',
      },
    },
  },
  {
    path: 'cuentas',
    loadComponent: () => import('./features/accounts/presentation/pages/accounts/accounts.page').then((m) => m.AccountsPage),
    data: {
      seo: {
        title: 'Cuentas | Helvia Banca',
        description: 'Cuenta Clara, Ahorro Lumbre y Cuenta Brújula. Comisiones visibles y operativa digital.',
      },
    },
  },
  {
    path: 'tarjetas',
    loadComponent: () => import('./features/cards/presentation/pages/cards/cards.page').then((m) => m.CardsPage),
    data: {
      seo: {
        title: 'Tarjetas | Helvia Banca',
        description: 'Tarjeta Norte, Delta y Viajera. Control de límites, PIN y pagos móviles desde la app.',
      },
    },
  },
  {
    path: 'prestamos',
    loadComponent: () => import('./features/loans/presentation/pages/loans/loans.page').then((m) => m.LoansPage),
    data: {
      seo: {
        title: 'Préstamos | Helvia Banca',
        description: 'Simula la cuota de un préstamo personal, de movilidad o de reforma con el sistema francés.',
      },
    },
  },
  {
    path: 'hipotecas',
    loadComponent: () => import('./features/mortgages/presentation/pages/mortgages/mortgages.page').then((m) => m.MortgagesPage),
    data: {
      seo: {
        title: 'Hipotecas | Helvia Banca',
        description: 'Hipoteca fija, variable o mixta. Hasta el 80% de financiación y gestor personal.',
      },
    },
  },
  {
    path: 'inversion',
    loadComponent: () => import('./features/investments/presentation/pages/investments/investments.page').then((m) => m.InvestmentsPage),
    data: {
      seo: {
        title: 'Inversión | Helvia Banca',
        description: 'Fondos, ahorro, planes de jubilación y asesoría. El riesgo se explica antes de contratar.',
      },
    },
  },
  {
    path: 'hazte-cliente',
    loadComponent: () => import('./features/onboarding/presentation/pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
    data: {
      seo: {
        title: 'Hazte cliente | Helvia Banca',
        description: 'Inicia el alta digital de Helvia. Formulario de demostración, sin envío real de datos.',
      },
    },
  },
  {
    path: 'perfil',
    canActivate: [operationalContextGuard],
    loadComponent: () => import('./features/profile/presentation/layouts/profile-layout/profile.layout').then((m) => m.ProfileLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/presentation/pages/profile/profile.page').then((m) => m.ProfilePage),
        data: {
          seo: {
            title: 'Mi perfil | SIGA',
            description: 'Foto, datos personales, correo y seguridad de tu perfil.',
          },
        },
      },
      {
        path: 'usuario',
        loadComponent: () => import('./features/profile/presentation/pages/my-user/my-user.page').then((m) => m.MyUserPage),
        data: {
          seo: {
            title: 'Usuario | SIGA',
            description: 'Tu ficha de acceso: nombres, correo, documento, ingreso e indicativo.',
          },
        },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/profile/presentation/pages/my-assignments/my-assignments.page').then((m) => m.MyAssignmentsPage),
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
        loadComponent: () => import('./features/profile/presentation/pages/my-assignments/my-assignments.page').then((m) => m.MyAssignmentsPage),
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
    canActivate: [operationalContextGuard],
    loadComponent: () => import('./features/catalog/presentation/layouts/catalog-layout/catalog.layout').then((m) => m.CatalogLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/catalog/presentation/pages/users-list/users-list.page').then((m) => m.UsersListPage),
        data: {
          seo: {
            title: 'Catálogo de usuarios | SIGA',
            description: 'Personas que ingresan al sistema.',
          },
        },
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/user-form/user-form.page').then((m) => m.UserFormPage),
        data: {
          seo: {
            title: 'Nuevo usuario | SIGA',
            description: 'Alta de una persona en el sistema.',
          },
        },
      },
      {
        path: 'usuarios/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/user-form/user-form.page').then((m) => m.UserFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/user-form/user-form.page').then((m) => m.UserFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/items-list/items-list.page').then((m) => m.ItemsListPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/items-list/items-list.page').then((m) => m.ItemsListPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/item-form/item-form.page').then((m) => m.ItemFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/units-list/units-list.page').then((m) => m.UnitsListPage),
        data: {
          seo: {
            title: 'Unidades | SIGA',
            description: 'Unidades donde opera el personal.',
          },
        },
      },
      {
        path: 'unidades/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/unit-form/unit-form.page').then((m) => m.UnitFormPage),
        data: {
          seo: {
            title: 'Nueva unidad | SIGA',
            description: 'Alta de una unidad operativa.',
          },
        },
      },
      {
        path: 'unidades/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/unit-form/unit-form.page').then((m) => m.UnitFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/unit-form/unit-form.page').then((m) => m.UnitFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/squadrons-list/squadrons-list.page').then((m) => m.SquadronsListPage),
        data: {
          seo: {
            title: 'Escuadrones | SIGA',
            description: 'Escuadrones adscritos a cada unidad.',
          },
        },
      },
      {
        path: 'escuadrones/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/squadron-form/squadron-form.page').then((m) => m.SquadronFormPage),
        data: {
          seo: {
            title: 'Nuevo escuadrón | SIGA',
            description: 'Alta de un escuadrón operativo.',
          },
        },
      },
      {
        path: 'escuadrones/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/squadron-form/squadron-form.page').then((m) => m.SquadronFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/squadron-form/squadron-form.page').then((m) => m.SquadronFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/commissions-list/commissions-list.page').then((m) => m.CommissionsListPage),
        data: {
          seo: {
            title: 'Comisiones temporales | SIGA',
            description: 'Desplazamientos temporales del personal entre unidades.',
          },
        },
      },
      {
        path: 'comisiones-temporales/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/commission-form/commission-form.page').then((m) => m.CommissionFormPage),
        data: {
          seo: {
            title: 'Nueva comisión temporal | SIGA',
            description: 'Alta de una comisión temporal.',
          },
        },
      },
      {
        path: 'comisiones-temporales/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/commission-form/commission-form.page').then((m) => m.CommissionFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/commission-form/commission-form.page').then((m) => m.CommissionFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/operations-list/operations-list.page').then((m) => m.OperationsListPage),
        data: { seo: { title: 'Operaciones | SIGA', description: 'Catálogo maestro de operaciones de instrucción.' } },
      },
      {
        path: 'operaciones/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/operation-form/operation-form.page').then((m) => m.OperationFormPage),
        data: { seo: { title: 'Nueva operación | SIGA', description: 'Alta de una operación de instrucción.' } },
      },
      {
        path: 'operaciones/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/operation-form/operation-form.page').then((m) => m.OperationFormPage),
        data: { mode: 'edit', seo: { title: 'Editar operación | SIGA', description: 'Nombre, descripción y estado de la operación.' } },
      },
      {
        path: 'operaciones/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/operation-form/operation-form.page').then((m) => m.OperationFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de operación | SIGA', description: 'Consulta la operación, sin modificar.' } },
      },
      {
        path: 'tipos-de-mision',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-types-list/mission-types-list.page').then((m) => m.MissionTypesListPage),
        data: { seo: { title: 'Tipos de misión | SIGA', description: 'Catálogo maestro de tipos de misión.' } },
      },
      {
        path: 'tipos-de-mision/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-type-form/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { seo: { title: 'Nuevo tipo de misión | SIGA', description: 'Alta de un tipo de misión.' } },
      },
      {
        path: 'tipos-de-mision/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-type-form/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { mode: 'edit', seo: { title: 'Editar tipo de misión | SIGA', description: 'Código, nombre y descripción del tipo de misión.' } },
      },
      {
        path: 'tipos-de-mision/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-type-form/mission-type-form.page').then((m) => m.MissionTypeFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de tipo de misión | SIGA', description: 'Consulta el tipo de misión, sin modificar.' } },
      },
      {
        path: 'maniobras',
        loadComponent: () => import('./features/catalog/presentation/pages/maneuvers-list/maneuvers-list.page').then((m) => m.ManeuversListPage),
        data: { seo: { title: 'Maniobras | SIGA', description: 'Banco de maniobras de instrucción.' } },
      },
      {
        path: 'maniobras/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/maneuver-form/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { seo: { title: 'Nueva maniobra | SIGA', description: 'Alta de una maniobra.' } },
      },
      {
        path: 'maniobras/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/maneuver-form/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { mode: 'edit', seo: { title: 'Editar maniobra | SIGA', description: 'Operación, código, nombre y descripción de la maniobra.' } },
      },
      {
        path: 'maniobras/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/maneuver-form/maneuver-form.page').then((m) => m.ManeuverFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de maniobra | SIGA', description: 'Consulta la maniobra, sin modificar.' } },
      },
      {
        path: 'estandares',
        loadComponent: () => import('./features/catalog/presentation/pages/standards-list/standards-list.page').then((m) => m.StandardsListPage),
        data: { seo: { title: 'Estándares | SIGA', description: 'Estándares de evaluación de instrucción.' } },
      },
      {
        path: 'estandares/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/standard-form/standard-form.page').then((m) => m.StandardFormPage),
        data: { seo: { title: 'Nuevo estándar | SIGA', description: 'Alta de un estándar.' } },
      },
      {
        path: 'estandares/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/standard-form/standard-form.page').then((m) => m.StandardFormPage),
        data: { mode: 'edit', seo: { title: 'Editar estándar | SIGA', description: 'Código, nombre, descripción y orden del estándar.' } },
      },
      {
        path: 'estandares/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/standard-form/standard-form.page').then((m) => m.StandardFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de estándar | SIGA', description: 'Consulta el estándar, sin modificar.' } },
      },
      {
        path: 'ponderaciones',
        loadComponent: () => import('./features/catalog/presentation/pages/weightings-list/weightings-list.page').then((m) => m.WeightingsListPage),
        data: { seo: { title: 'Ponderaciones | SIGA', description: 'Ponderaciones de estándares por unidad, escuadrón y programa.' } },
      },
      {
        path: 'ponderaciones/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/weighting-form/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { seo: { title: 'Nueva ponderación | SIGA', description: 'Alta de una ponderación.' } },
      },
      {
        path: 'ponderaciones/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/weighting-form/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { mode: 'edit', seo: { title: 'Editar ponderación | SIGA', description: 'Estándar, alcance, valor y vigencia.' } },
      },
      {
        path: 'ponderaciones/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/weighting-form/weighting-form.page').then((m) => m.WeightingFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de ponderación | SIGA', description: 'Consulta la ponderación, sin modificar.' } },
      },
      {
        path: 'programas',
        loadComponent: () => import('./features/catalog/presentation/pages/programs-board/programs-board.page').then((m) => m.ProgramsBoardPage),
        data: {
          seo: {
            title: 'Formación académica | SIGA',
            description: 'Programas de formación y planes de estudios de la academia.',
          },
        },
      },
      {
        path: 'promociones',
        loadComponent: () => import('./features/catalog/presentation/pages/promotions-list/promotions-list.page').then((m) => m.PromotionsListPage),
        data: { seo: { title: 'Promociones | SIGA', description: 'Promociones y grupos de alumnos.' } },
      },
      {
        path: 'promociones/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/promotion-form/promotion-form.page').then((m) => m.PromotionFormPage),
        data: { seo: { title: 'Nueva promoción | SIGA', description: 'Alta de una promoción de alumnos.' } },
      },
      {
        path: 'promociones/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/promotion-form/promotion-form.page').then((m) => m.PromotionFormPage),
        data: { mode: 'edit', seo: { title: 'Editar promoción | SIGA', description: 'Datos y miembros de una promoción.' } },
      },
      {
        path: 'promociones/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/promotion-form/promotion-form.page').then((m) => m.PromotionFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de promoción | SIGA', description: 'Consulta una promoción y sus alumnos.' } },
      },
      {
        path: 'programacion',
        pathMatch: 'full',
        redirectTo: 'matricula',
      },
      {
        path: 'matricula',
        loadComponent: () =>
          import('./features/programming/presentation/pages/programming-board/programming-board.page').then(
            (m) => m.ProgrammingBoardPage,
          ),
        data: {
          seo: {
            title: 'Matrícula | SIGA',
            description: 'Matricula una promoción o un alumno a un programa y consulta a los participantes.',
          },
        },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'asignacion' },
          {
            path: 'asignacion',
            loadComponent: () =>
              import('./features/catalog/presentation/pages/training-programming/training-programming.page').then(
                (m) => m.TrainingProgrammingPage,
              ),
            data: {
              seo: {
                title: 'Matrícula | SIGA',
                description: 'Matricula una promoción o un alumno a un programa y consulta a los participantes.',
              },
            },
          },
        ],
      },
      {
        path: 'programacion-entrenamiento',
        pathMatch: 'full',
        redirectTo: 'matricula/asignacion',
      },
      {
        path: 'despacho-diario',
        loadComponent: () =>
          import('./features/dispatch/presentation/pages/daily-dispatch/daily-dispatch.page').then((m) => m.DailyDispatchPage),
        data: {
          seo: {
            title: 'Programación y despacho diario | SIGA',
            description: 'Supervise los vuelos del día, despache a cabina y habilite la rúbrica del instructor.',
          },
        },
      },
      {
        path: 'orden-de-vuelo',
        loadComponent: () =>
          import('./features/flight-order/presentation/pages/flight-order/flight-order.page').then((m) => m.FlightOrderPage),
        data: {
          seo: {
            title: 'Orden de vuelo y asignación | SIGA',
            description: 'Asigna la misión curricular, el instructor, la fecha, la hora y la aeronave.',
          },
        },
      },
      {
        path: 'programacion-entrenamiento/grupal/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/training-assignment-form/training-assignment-form.page').then((m) => m.TrainingAssignmentFormPage),
        data: { assignmentType: 'group', seo: { title: 'Nueva asignación grupal | SIGA', description: 'Programa una misión para una promoción.' } },
      },
      {
        path: 'programacion-entrenamiento/grupal/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/training-assignment-form/training-assignment-form.page').then((m) => m.TrainingAssignmentFormPage),
        data: { assignmentType: 'group', mode: 'edit', seo: { title: 'Reprogramar asignación grupal | SIGA', description: 'Modifica la fecha, responsable o estado de una asignación grupal.' } },
      },
      {
        path: 'programacion-entrenamiento/individual/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/training-assignment-form/training-assignment-form.page').then((m) => m.TrainingAssignmentFormPage),
        data: { assignmentType: 'individual', seo: { title: 'Nueva asignación individual | SIGA', description: 'Programa una misión para un alumno o persona externa.' } },
      },
      {
        path: 'programacion-entrenamiento/individual/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/training-assignment-form/training-assignment-form.page').then((m) => m.TrainingAssignmentFormPage),
        data: { assignmentType: 'individual', mode: 'edit', seo: { title: 'Reprogramar asignación individual | SIGA', description: 'Modifica la fecha, instructor o estado de una asignación individual.' } },
      },
      {
        path: 'incidencias',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/flight-incident-board/flight-incident-board.page').then(
            (m) => m.FlightIncidentBoardPage,
          ),
        data: {
          seo: {
            title: 'Registro de incidencias | SIGA',
            description: 'Consulta las incidencias y discrepancias registradas, con filtro de fecha.',
          },
        },
      },
      {
        path: 'incidencias/:id',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/flight-incident/flight-incident.page').then(
            (m) => m.FlightIncidentPage,
          ),
        data: {
          mode: 'view',
          seo: {
            title: 'Incidencia registrada | SIGA',
            description: 'Consulta el registro oficial de la incidencia seleccionada.',
          },
        },
      },
      {
        path: 'incidencias/:id/accion',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/flight-incident-action/flight-incident-action.page').then(
            (m) => m.FlightIncidentActionPage,
          ),
        data: {
          seo: {
            title: 'Tomar acción sobre incidencia | SIGA',
            description: 'Registra la acción tomada y el resultado de una incidencia.',
          },
        },
      },
      {
        path: 'ejecucion-misiones',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-execution-inbox/mission-execution-inbox.page').then((m) => m.MissionExecutionInboxPage),
        data: { seo: { title: 'Ejecución y calificación de misiones | SIGA', description: 'Bandeja de misiones pendientes y calificación académica.' } },
      },
      {
        path: 'ejecucion-misiones/tablero',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-execution-inbox/mission-execution-inbox.page').then((m) => m.MissionExecutionInboxPage),
        data: { seo: { title: 'Próximas ejecuciones | SIGA', description: 'Tablero de próximas ejecuciones del día.' } },
      },
      {
        path: 'ejecucion-misiones/:id/incidencia',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/flight-incident/flight-incident.page').then(
            (m) => m.FlightIncidentPage,
          ),
        data: {
          seo: {
            title: 'Reporte de incidencia de vuelo | SIGA',
            description: 'Registra una discrepancia o incidencia vinculada a la misión.',
          },
        },
      },
      {
        path: 'ejecucion-misiones/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/mission-workspace/mission-workspace.page').then((m) => m.MissionWorkspacePage),
        data: { seo: { title: 'Workspace de misión | SIGA', description: 'Ejecuta, califica y cierra una misión.' } },
      },
      {
        path: 'calificaciones-aire',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/air-grade-list/air-grade-list.page').then((m) => m.AirGradeListPage),
        data: {
          seo: {
            title: 'Calificaciones de vuelo | SIGA',
            description: 'Elige un programa para ver tu progresión de misiones aéreas.',
          },
        },
      },
      {
        path: 'calificaciones-aire/:userId/programa/:programId',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/air-grade-board/air-grade-board.page').then((m) => m.AirGradeBoardPage),
        data: {
          seo: {
            title: 'Progresión de misiones aéreas | SIGA',
            description: 'Consulta las calificaciones de vuelo por fase y subfase.',
          },
        },
      },
      {
        path: 'calificaciones-aire/:userId/mision/:executionId',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/air-grade-sheet/air-grade-sheet.page').then((m) => m.AirGradeSheetPage),
        data: {
          seo: {
            title: 'Cartilla de vuelo | SIGA',
            description: 'Revisa el calificativo de la misión y firma de conformidad.',
          },
        },
      },
      {
        path: 'calificaciones-aire/:userId',
        loadComponent: () =>
          import('./features/catalog/presentation/pages/air-grade-board/air-grade-board.page').then((m) => m.AirGradeBoardPage),
        data: {
          seo: {
            title: 'Progresión de misiones aéreas | SIGA',
            description: 'Consulta las calificaciones de vuelo por fase y subfase.',
          },
        },
      },
      {
        path: 'calificacion-tierra',
        loadComponent: () =>
          import('./features/ground-grading/presentation/pages/ground-grading-inbox/ground-grading-inbox.page').then(
            (m) => m.GroundGradingInboxPage,
          ),
        data: {
          seo: {
            title: 'Cursos en tierra | SIGA',
            description: 'Selecciona programa y promoción para calificar las asignaturas de aula.',
          },
        },
      },
      {
        path: 'calificacion-tierra/:programId/:promotionId/:courseId',
        loadComponent: () =>
          import('./features/ground-grading/presentation/pages/ground-course-roster/ground-course-roster.page').then(
            (m) => m.GroundCourseRosterPage,
          ),
        data: {
          seo: {
            title: 'Acta de curso en tierra | SIGA',
            description: 'Califica a los alumnos de una asignatura en tierra.',
          },
        },
      },
      {
        path: 'calificacion-simulador',
        loadComponent: () =>
          import('./features/simulator-grading/presentation/pages/simulator-grading-inbox/simulator-grading-inbox.page').then(
            (m) => m.SimulatorGradingInboxPage,
          ),
        data: {
          seo: {
            title: 'Cursos en simulador | SIGA',
            description: 'Selecciona programa y promoción para calificar las sesiones de simulador.',
          },
        },
      },
      {
        path: 'calificacion-simulador/:programId/:promotionId/:sessionId',
        loadComponent: () =>
          import('./features/simulator-grading/presentation/pages/simulator-session-roster/simulator-session-roster.page').then(
            (m) => m.SimulatorSessionRosterPage,
          ),
        data: {
          seo: {
            title: 'Acta de simulador | SIGA',
            description: 'Califica a los alumnos de una sesión de simulador.',
          },
        },
      },
      {
        path: 'avance-academico',
        loadComponent: () =>
          import('./features/academic-progress/presentation/pages/academic-progress-list/academic-progress-list.page').then(
            (m) => m.AcademicProgressListPage,
          ),
        data: {
          seo: {
            title: 'Avance académico | SIGA',
            description: 'Consulta el progreso y la trayectoria académica de los alumnos.',
          },
        },
      },
      {
        path: 'avance-academico/:userId',
        loadComponent: () =>
          import('./features/academic-progress/presentation/pages/academic-progress-detail/academic-progress-detail.page').then(
            (m) => m.AcademicProgressDetailPage,
          ),
        data: {
          seo: {
            title: 'Legajo académico | SIGA',
            description: 'Historial, progreso y hitos de formación de un alumno.',
          },
        },
      },
      {
        path: 'legajo-personal',
        loadComponent: () =>
          import('./features/personnel-dossier/presentation/pages/personnel-dossier-list/personnel-dossier-list.page').then(
            (m) => m.PersonnelDossierListPage,
          ),
        data: {
          seo: {
            title: 'Legajo personal | SIGA',
            description: 'Expediente digital con bitácora y horas de vuelo del alumno.',
          },
        },
      },
      {
        path: 'legajo-personal/:userId/programa/:programId',
        loadComponent: () =>
          import('./features/personnel-dossier/presentation/pages/personnel-dossier-curriculum/personnel-dossier-curriculum.page').then(
            (m) => m.PersonnelDossierCurriculumPage,
          ),
        data: {
          seo: {
            title: 'Currículo del programa | SIGA',
            description: 'Fases, subfases y calificaciones de misión del alumno.',
          },
        },
      },
      {
        path: 'legajo-personal/:userId',
        loadComponent: () =>
          import('./features/personnel-dossier/presentation/pages/personnel-dossier-detail/personnel-dossier-detail.page').then(
            (m) => m.PersonnelDossierDetailPage,
          ),
        data: {
          seo: {
            title: 'Expediente personal | SIGA',
            description: 'Consulta el legajo operacional del alumno seleccionado.',
          },
        },
      },
      {
        path: 'consejo-evaluacion',
        loadComponent: () =>
          import('./features/evaluation-council/presentation/pages/evaluation-council-list/evaluation-council-list.page').then(
            (m) => m.EvaluationCouncilListPage,
          ),
        data: {
          seo: {
            title: 'Consejo de evaluación | SIGA',
            description: 'Alumnos que superan el tope de misiones reprobadas.',
          },
        },
      },
      {
        path: 'consejo-evaluacion/:userId',
        loadComponent: () =>
          import('./features/evaluation-council/presentation/pages/evaluation-council-detail/evaluation-council-detail.page').then(
            (m) => m.EvaluationCouncilDetailPage,
          ),
        data: {
          seo: {
            title: 'Sesión de consejo | SIGA',
            description: 'Junta de evaluación del alumno convocado.',
          },
        },
      },
      {
        path: 'reportes',
        pathMatch: 'full',
        redirectTo: 'reportes/historial-alumno',
      },
      {
        path: 'reportes/:kind',
        loadComponent: () =>
          import('./features/reports/presentation/pages/reports/reports.page').then((m) => m.ReportsPage),
        data: {
          seo: {
            title: 'Reportes | SIGA',
            description: 'Consulta e exporta reportes académicos y operativos del contexto seleccionado.',
          },
        },
      },
      {
        path: 'programas/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/program-studio/program-studio.page').then((m) => m.ProgramStudioPage),
        data: {
          seo: {
            title: 'Nuevo programa | SIGA',
            description: 'Diseña un plan de estudios con fases, subfases, horas, misiones y maniobras.',
          },
        },
      },
      {
        path: 'programas/:id/flujo',
        loadComponent: () => import('./features/catalog/presentation/pages/program-flow/program-flow.page').then((m) => m.ProgramFlowPage),
        data: {
          seo: {
            title: 'Flujo del programa | SIGA',
            description: 'Consulta visual del itinerario completo, sin modificar.',
          },
        },
      },
      {
        path: 'programas/:id/estandares',
        loadComponent: () => import('./features/catalog/presentation/pages/program-standards/program-standards.page').then((m) => m.ProgramStandardsPage),
        data: {
          seo: {
            title: 'Asignar estándares | SIGA',
            description: 'Asigna los estándares de evaluación de un programa.',
          },
        },
      },
      {
        path: 'programas/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/program-studio/program-studio.page').then((m) => m.ProgramStudioPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/program-studio/program-studio.page').then((m) => m.ProgramStudioPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-list/academic-bank-list.page').then((m) => m.AcademicBankListPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          seo: { title: 'Nuevo banco de fase | SIGA', description: 'Alta de una fase en el banco maestro.' },
        },
      },
      {
        path: 'banco-fases/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          mode: 'edit',
          seo: { title: 'Editar banco de fase | SIGA', description: 'Código, nombre, descripción y estado de la fase.' },
        },
      },
      {
        path: 'banco-fases/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'phase',
          mode: 'view',
          seo: { title: 'Detalle de banco de fase | SIGA', description: 'Consulta la fase del banco, sin modificar.' },
        },
      },
      {
        path: 'banco-subfases',
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-list/academic-bank-list.page').then((m) => m.AcademicBankListPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
        data: {
          bank: 'subphase',
          seo: { title: 'Nuevo banco de subfase | SIGA', description: 'Alta de una subfase en el banco maestro.' },
        },
      },
      {
        path: 'banco-subfases/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/academic-bank-form/academic-bank-form.page').then((m) => m.AcademicBankFormPage),
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
        loadComponent: () => import('./features/catalog/presentation/pages/fleets-list/fleets-list.page').then((m) => m.FleetsListPage),
        data: { seo: { title: 'Flotas | SIGA', description: 'Catálogo de flotas de material aéreo.' } },
      },
      {
        path: 'flotas/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/fleet-form/fleet-form.page').then((m) => m.FleetFormPage),
        data: { seo: { title: 'Nueva flota | SIGA', description: 'Alta de una flota.' } },
      },
      {
        path: 'flotas/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/fleet-form/fleet-form.page').then((m) => m.FleetFormPage),
        data: { mode: 'edit', seo: { title: 'Editar flota | SIGA', description: 'Tipo, código, nombre, descripción y estado de la flota.' } },
      },
      {
        path: 'flotas/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/fleet-form/fleet-form.page').then((m) => m.FleetFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de flota | SIGA', description: 'Consulta la flota, sin modificar.' } },
      },
      {
        path: 'aeronaves',
        loadComponent: () => import('./features/catalog/presentation/pages/aircraft-list/aircraft-list.page').then((m) => m.AircraftListPage),
        data: { seo: { title: 'Aeronaves | SIGA', description: 'Registro de aeronaves con imagen, flota y unidad.' } },
      },
      {
        path: 'aeronaves/nuevo',
        loadComponent: () => import('./features/catalog/presentation/pages/aircraft-form/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { seo: { title: 'Nueva aeronave | SIGA', description: 'Alta de una aeronave.' } },
      },
      {
        path: 'aeronaves/:id/editar',
        loadComponent: () => import('./features/catalog/presentation/pages/aircraft-form/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { mode: 'edit', seo: { title: 'Editar aeronave | SIGA', description: 'Unidad, flota, matrícula, operativa y estado.' } },
      },
      {
        path: 'aeronaves/:id',
        loadComponent: () => import('./features/catalog/presentation/pages/aircraft-form/aircraft-form.page').then((m) => m.AircraftFormPage),
        data: { mode: 'view', seo: { title: 'Detalle de aeronave | SIGA', description: 'Consulta la aeronave y su foto.' } },
      },
    ],
  },
      { path: '**', redirectTo: '' },
    ],
  },
];
