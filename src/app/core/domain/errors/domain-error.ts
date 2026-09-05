export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidLoanInputError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_LOAN_INPUT');
    this.name = 'InvalidLoanInputError';
  }
}

export class InvalidUserProfileError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_USER_PROFILE');
    this.name = 'InvalidUserProfileError';
  }
}

export class InvalidAdminCatalogError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_ADMIN_CATALOG');
    this.name = 'InvalidAdminCatalogError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message = 'Identificador o contraseña incorrectos.') {
    super(message, 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidProfileContextError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_PROFILE_CONTEXT');
    this.name = 'InvalidProfileContextError';
  }
}

export class AcademicRecordAccessError extends DomainError {
  constructor(message = 'No puedes consultar el avance académico de esta persona.') {
    super(message, 'ACADEMIC_RECORD_ACCESS');
    this.name = 'AcademicRecordAccessError';
  }
}
