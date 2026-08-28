import { Routes } from '@angular/router';

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
    loadComponent: () => import('./features/profile/profile.layout').then((m) => m.ProfileLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
        data: {
          seo: {
            title: 'Mi perfil | SIGA',
            description: 'Foto, datos personales, correo y seguridad de tu perfil. Entorno de demostración.',
          },
        },
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/profile/admin/users.page').then((m) => m.UsersPage),
        data: {
          seo: {
            title: 'Usuarios | SIGA',
            description: 'Administra las personas que ingresan al sistema: alta, estado, roles y especialidades.',
          },
        },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/profile/admin/catalog.page').then((m) => m.CatalogPage),
        data: {
          catalog: 'roles',
          seo: {
            title: 'Roles de usuario | SIGA',
            description: 'Administrador, director académico, jefe de instrucción, instructor y alumno.',
          },
        },
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./features/profile/admin/catalog.page').then((m) => m.CatalogPage),
        data: {
          catalog: 'specialties',
          seo: {
            title: 'Especialidades | SIGA',
            description: 'Catálogo de especialidades y su asignación a las personas del sistema.',
          },
        },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
