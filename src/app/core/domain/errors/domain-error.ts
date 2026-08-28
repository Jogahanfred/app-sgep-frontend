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
