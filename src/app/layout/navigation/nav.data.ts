import type { NavColumn, NavGroup } from '@shared/models/nav.model';

const particulares: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Cuentas',
        links: [
          { label: 'Cuenta Clara', href: '/cuentas' },
          { label: 'Cuenta Ahorro Lumbre', href: '/cuentas' },
          { label: 'Cuenta Brújula', href: '/cuentas' },
          { label: 'Hazte cliente', href: '/hazte-cliente' },
        ],
      },
      {
        heading: 'Banca online',
        links: [
          { label: 'Mi perfil', href: '/perfil' },
          { label: 'App Helvia', href: '/cuentas' },
          { label: 'Pagos inmediatos', href: '/cuentas' },
          { label: 'Transferencias', href: '/cuentas' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Tarjetas',
        links: [
          { label: 'Tarjeta Norte Crédito', href: '/tarjetas' },
          { label: 'Tarjeta Delta Débito', href: '/tarjetas' },
          { label: 'Tarjeta Viajera', href: '/tarjetas' },
        ],
      },
      {
        heading: 'Ahorro e inversión',
        links: [
          { label: 'Fondo Horizonte', href: '/inversion' },
          { label: 'Plan Ahorro Lumbre', href: '/inversion' },
          { label: 'Plan Albada', href: '/inversion' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Préstamos',
        links: [
          { label: 'Préstamo Impulso', href: '/prestamos' },
          { label: 'Préstamo Movilidad', href: '/prestamos' },
          { label: 'Préstamo Reforma', href: '/prestamos' },
          { label: 'Simular cuota', href: '/prestamos' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Hipotecas',
        links: [
          { label: 'Simulador de hipoteca', href: '/hipotecas' },
          { label: 'Hipoteca Hogar Fija', href: '/hipotecas' },
          { label: 'Hipoteca Brisa Variable', href: '/hipotecas' },
          { label: 'Hipoteca Dual Mixta', href: '/hipotecas' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Protección',
        links: [
          { label: 'Proteger tu hogar', href: '/hazte-cliente' },
          { label: 'Proteger tus pagos', href: '/tarjetas' },
          { label: 'Hablar con un gestor', href: '/hazte-cliente' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Segmentos',
        links: [
          { label: 'Jóvenes', href: '/cuentas' },
          { label: 'Familias', href: '/hipotecas' },
          { label: 'Sénior', href: '/cuentas' },
        ],
      },
      {
        heading: 'Atención y oficinas',
        links: [
          { label: 'Preguntas frecuentes', href: '/' },
          { label: 'Cita previa', href: '/hazte-cliente' },
        ],
      },
    ],
  },
];

const empresas: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Cuentas de empresa',
        links: [
          { label: 'Cuenta de autónomos', href: '/hazte-cliente' },
          { label: 'Cuenta de sociedad', href: '/hazte-cliente' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Financiación',
        links: [
          { label: 'Línea de crédito', href: '/prestamos' },
          { label: 'Préstamo Impulso', href: '/prestamos' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Medios de pago',
        links: [
          { label: 'Tarjetas de empresa', href: '/tarjetas' },
          { label: 'TPV y cobros', href: '/hazte-cliente' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Asesoramiento',
        links: [{ label: 'Pedir cita', href: '/hazte-cliente' }],
      },
    ],
  },
];

const autonomos: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Día a día',
        links: [
          { label: 'Cuenta Clara', href: '/cuentas' },
          { label: 'Tarjeta Norte', href: '/tarjetas' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Financiación',
        links: [
          { label: 'Préstamo Impulso', href: '/prestamos' },
          { label: 'Simular cuota', href: '/prestamos' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Previsión',
        links: [{ label: 'Plan Albada', href: '/inversion' }],
      },
    ],
  },
];

const privada: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Inversión',
        links: [
          { label: 'Fondo Horizonte', href: '/inversion' },
          { label: 'Asesoría Norte', href: '/inversion' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Patrimonio',
        links: [
          { label: 'Hipoteca Dual', href: '/hipotecas' },
          { label: 'Planificación', href: '/hazte-cliente' },
        ],
      },
    ],
  },
];

const select: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Ventajas Select',
        links: [
          { label: 'Cuenta Clara', href: '/cuentas' },
          { label: 'Tarjeta Viajera', href: '/tarjetas' },
        ],
      },
    ],
  },
  {
    blocks: [
      {
        heading: 'Acompañamiento',
        links: [
          { label: 'Gestor personal', href: '/hazte-cliente' },
          { label: 'Cita previa', href: '/hazte-cliente' },
        ],
      },
    ],
  },
];

const configuracion: NavColumn[] = [
  {
    blocks: [
      {
        heading: 'Catálogos',
        links: [
          { label: 'Usuarios', href: '/catalogo/usuarios' },
          { label: 'Roles', href: '/catalogo/roles' },
          { label: 'Especialidades', href: '/catalogo/especialidades' },
        ],
      },
    ],
  },
];

export const AUDIENCE_NAV: NavGroup[] = [
  { label: 'Particulares', columns: particulares },
  { label: 'Empresas', columns: empresas },
  { label: 'Autónomos', columns: autonomos },
  { label: 'Banca Privada', columns: privada },
  { label: 'Select', columns: select },
  { label: 'Configuración', columns: configuracion },
];

export const MAIN_NAV = AUDIENCE_NAV;
