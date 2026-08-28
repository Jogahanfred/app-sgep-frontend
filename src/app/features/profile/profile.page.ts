import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, type Observable } from 'rxjs';
import {
  ChangeUserPassword,
  GetCurrentUser,
  UpdateUserAddress,
  UpdateUserContact,
  UpdateUserPhoto,
  UpdateUserPreferences,
  UpdateUserProfile,
} from '@core/application';
import { DEMO_PASSWORD, type UserProfile } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { Alert } from '@shared/components/alert/alert';
import { Breadcrumb } from '@shared/components/breadcrumb/breadcrumb';
import { Button } from '@shared/components/button/button';
import { Container } from '@shared/components/container/container';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiToggle } from '@shared/components/ui-toggle/ui-toggle';
import type { ChoiceOption } from '@shared/models/choice.model';
import { ClientSession } from '../../layout/client-session.service';

export type ProfileSection = 'photo' | 'data' | 'contact' | 'address' | 'security' | 'prefs';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Container,
    Breadcrumb,
    Button,
    Alert,
    UiAvatar,
    UiDatePicker,
    UiFormCard,
    UiInput,
    UiSegmentedControl,
    UiSelect,
    UiCheckbox,
    UiToggle,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getUser = inject(GetCurrentUser);
  private readonly updateProfile = inject(UpdateUserProfile);
  private readonly updateContact = inject(UpdateUserContact);
  private readonly updateAddress = inject(UpdateUserAddress);
  private readonly updatePhoto = inject(UpdateUserPhoto);
  private readonly updatePrefs = inject(UpdateUserPreferences);
  private readonly changePassword = inject(ChangeUserPassword);
  private readonly session = inject(ClientSession);

  readonly sectionOptions: ChoiceOption[] = [
    { value: 'photo', label: 'Foto' },
    { value: 'data', label: 'Datos' },
    { value: 'contact', label: 'Correo y teléfono' },
    { value: 'address', label: 'Dirección' },
    { value: 'security', label: 'Contraseña' },
    { value: 'prefs', label: 'Preferencias' },
  ];

  readonly documents: ChoiceOption[] = [
    { value: 'dni', label: 'DNI' },
    { value: 'nie', label: 'NIE' },
    { value: 'pasaporte', label: 'PASAPORTE' },
  ];

  readonly prefixes: ChoiceOption[] = [
    { value: '+34', label: '+34' },
    { value: '+351', label: '+351' },
    { value: '+33', label: '+33' },
  ];

  readonly languages: ChoiceOption[] = [
    { value: 'es', label: 'Español' },
    { value: 'ca', label: 'Català' },
    { value: 'en', label: 'English' },
  ];

  readonly section = signal<ProfileSection>('photo');
  readonly profile = signal<UserProfile | null>(null);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly demoPassword = DEMO_PASSWORD;

  readonly dataForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    secondLastName: new FormControl('', { nonNullable: true }),
    documentType: new FormControl('dni', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nationality: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    occupation: new FormControl('', { nonNullable: true }),
  });

  readonly contactForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phonePrefix: new FormControl('+34', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[0-9]{9}$/)] }),
  });

  readonly addressForm = new FormGroup({
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[0-9]{5}$/)] }),
    province: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly prefsForm = new FormGroup({
    language: new FormControl('es', { nonNullable: true }),
    marketingEmail: new FormControl(false, { nonNullable: true }),
    marketingSms: new FormControl(false, { nonNullable: true }),
    securityAlerts: new FormControl(true, { nonNullable: true }),
    twoFactorEnabled: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    this.getUser
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.applyUser(user);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }

  fullName(): string {
    const user = this.profile();
    if (!user) return '';
    return [user.firstName, user.lastName, user.secondLastName].filter(Boolean).join(' ');
  }

  select(id: string): void {
    this.section.set(id as ProfileSection);
    this.notice.set(null);
    this.error.set(null);
  }

  requiredError(form: FormGroup, name: string, message: string): string | undefined {
    const control = form.get(name);
    if (!control || !control.touched || control.valid) return undefined;
    return message;
  }

  saveData(): Promise<void> {
    return this.runSave(
      this.dataForm,
      this.updateProfile.execute(this.dataForm.getRawValue()),
      'Hemos actualizado tus datos personales.',
    );
  }

  saveContact(): Promise<void> {
    return this.runSave(
      this.contactForm,
      this.updateContact.execute(this.contactForm.getRawValue()),
      'Correo y teléfono actualizados.',
    );
  }

  saveAddress(): Promise<void> {
    return this.runSave(
      this.addressForm,
      this.updateAddress.execute(this.addressForm.getRawValue()),
      'Dirección actualizada.',
    );
  }

  savePrefs(): Promise<void> {
    return this.runSave(
      this.prefsForm,
      this.updatePrefs.execute(this.prefsForm.getRawValue()),
      'Preferencias guardadas.',
    );
  }

  savePassword(): Promise<void> {
    return this.runSave(
      this.passwordForm,
      this.changePassword.execute(this.passwordForm.getRawValue()),
      'Contraseña cambiada. En un banco real te desconectaríamos el resto de sesiones.',
      () => this.passwordForm.reset(),
    );
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Elige una imagen JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 2_000_000) {
      this.error.set('La foto no puede superar 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.runSave(null, this.updatePhoto.execute(String(reader.result)), 'Foto de perfil actualizada.');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.runSave(null, this.updatePhoto.execute(null), 'Hemos quitado la foto. Se muestran tus iniciales.');
  }

  private async runSave(
    form: FormGroup | null,
    stream: Observable<UserProfile>,
    success: string,
    after?: () => void,
  ): Promise<void> {
    this.notice.set(null);
    this.error.set(null);
    if (form?.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const user = await firstValueFrom(stream);
      this.applyUser(user);
      this.notice.set(success);
      after?.();
    } catch (err: unknown) {
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar los cambios.');
    } finally {
      this.saving.set(false);
    }
  }

  private applyUser(user: UserProfile): void {
    this.profile.set(user);
    this.session.signIn(user.firstName);
    this.dataForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      secondLastName: user.secondLastName,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      birthDate: user.birthDate,
      nationality: user.nationality,
      occupation: user.occupation,
    });
    this.contactForm.reset({
      email: user.email,
      phonePrefix: user.phonePrefix,
      phone: user.phone,
    });
    this.addressForm.reset({
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      province: user.province,
    });
    this.prefsForm.reset({
      language: user.language,
      marketingEmail: user.marketingEmail,
      marketingSms: user.marketingSms,
      securityAlerts: user.securityAlerts,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  }
}
