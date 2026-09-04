import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatePromotion, ListAdminUsers, ListPromotionMembers, ListPromotions, ListSquadrons, ListUnits, SavePromotionMembers, UpdatePromotion } from '@core/application';
import type { PromotionEntity, PromotionWriteInput, SquadronEntity, UnitEntity, UserEntity } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { firstValueFrom } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiDatePicker } from '@shared/components/ui-date-picker/ui-date-picker';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-promotion-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, Card, UiDatePicker, UiFormCard, UiInput, UiLoading, UiSelect],
  templateUrl: './promotion-form.page.html',
  styleUrl: './promotion-form.page.scss',
})
export class PromotionFormPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPromotions = inject(ListPromotions);
  private readonly listUsers = inject(ListAdminUsers);
  private readonly listUnits = inject(ListUnits);
  private readonly listSquadrons = inject(ListSquadrons);
  private readonly listMembers = inject(ListPromotionMembers);
  private readonly createPromotion = inject(CreatePromotion);
  private readonly updatePromotion = inject(UpdatePromotion);
  private readonly saveMembers = inject(SavePromotionMembers);
  private readonly toast = inject(ToastService);

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.id;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loading = signal(!this.isCreate);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly users = signal<UserEntity[]>([]);
  readonly units = signal<UnitEntity[]>([]);
  readonly squadrons = signal<SquadronEntity[]>([]);
  readonly availableIds = signal<string[]>([]);
  readonly assignedIds = signal<string[]>([]);
  readonly availableSearch = new FormControl('', { nonNullable: true });
  readonly assignedSearch = new FormControl('', { nonNullable: true });
  readonly selectedUnitId = signal('');
  readonly availableQuery = signal('');
  readonly assignedQuery = signal('');
  readonly title = computed(() => this.isCreate ? 'Nueva promoción' : this.isView ? 'Detalle de promoción' : 'Editar promoción');
  readonly listHref = '/catalogo/promociones';
  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: Validators.required }),
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    year: new FormControl(new Date().getFullYear(), { nonNullable: true, validators: [Validators.required, Validators.min(2000)] }),
    unitId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    squadronId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    startDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
    endDate: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  readonly availableUsers = computed(() => this.users().filter((user) => this.availableIds().includes(user.id) && this.matches(user, this.availableQuery())));
  readonly assignedUsers = computed(() => this.users().filter((user) => this.assignedIds().includes(user.id) && this.matches(user, this.assignedQuery())));
  readonly filteredSquadrons = computed(() => this.squadrons().filter((item) => item.unitId === this.selectedUnitId()));
  readonly unitOptions = computed<ChoiceOption[]>(() => this.units().map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` })));
  readonly squadronOptions = computed<ChoiceOption[]>(() => this.filteredSquadrons().map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })));

  constructor() {
    this.availableSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.availableQuery.set(value));
    this.assignedSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.assignedQuery.set(value));
    this.form.controls.unitId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.selectedUnitId.set(value));
    this.listUsers.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((users) => { this.users.set(users); this.syncAvailable(); });
    this.listUnits.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.units.set(items));
    this.listSquadrons.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.squadrons.set(items));
    if (this.id) this.loadPromotion(this.id);
  }

  private loadPromotion(id: string): void {
    this.listPromotions.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        const item = items.find((entry) => entry.id === id);
        if (!item) { this.error.set('No hemos podido cargar esta promoción.'); this.loading.set(false); return; }
        this.form.reset(item);
        this.selectedUnitId.set(item.unitId);
        this.listMembers.execute(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((members) => {
          this.assignedIds.set(members.map((member) => member.userId));
          this.syncAvailable();
          this.loading.set(false);
        });
        if (this.isView) this.form.disable({ emitEvent: false });
      },
      error: () => { this.error.set('No hemos podido cargar esta promoción.'); this.loading.set(false); },
    });
  }

  private syncAvailable(): void {
    const assigned = new Set(this.assignedIds());
    this.availableIds.set(this.users().filter((user) => user.status === 'active').map((user) => user.id).filter((id) => !assigned.has(id)));
  }

  private matches(user: UserEntity, query: string): boolean {
    const needle = query.trim().toLowerCase();
    return !needle || `${user.firstName} ${user.lastName} ${user.documentNumber}`.toLowerCase().includes(needle);
  }

  moveToAssigned(userId: string): void {
    if (this.isView) return;
    this.availableIds.update((ids) => ids.filter((id) => id !== userId));
    this.assignedIds.update((ids) => [...ids, userId]);
  }

  moveToAvailable(userId: string): void {
    if (this.isView) return;
    this.assignedIds.update((ids) => ids.filter((id) => id !== userId));
    this.availableIds.update((ids) => [...ids, userId]);
  }

  requiredError(control: FormControl): string | undefined {
    return control.touched && control.invalid ? 'Este campo es obligatorio.' : undefined;
  }

  async save(): Promise<void> {
    if (this.isView) return;
    this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    try {
      const input = this.form.getRawValue() as PromotionWriteInput;
      const promotion = this.id ? await firstValueFrom(this.updatePromotion.execute(this.id, input)) : await firstValueFrom(this.createPromotion.execute(input));
      await firstValueFrom(this.saveMembers.execute(promotion.id, this.assignedIds(), input.startDate));
      this.toast.success(this.id ? 'Promoción actualizada' : 'Promoción creada', 'Los datos y los alumnos ya están guardados.');
      await this.router.navigate([this.listHref]);
    } catch (err: unknown) {
      const message = err instanceof DomainError ? err.message : 'No hemos podido guardar la promoción.';
      this.error.set(message);
      this.toast.error('No se pudo guardar', message);
    } finally { this.saving.set(false); }
  }
}
