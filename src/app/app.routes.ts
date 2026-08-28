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
    ],
  },
  { path: '**', redirectTo: '' },
];
