import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ListManeuvers,
  ListMissionTypes,
  ListPhaseBanks,
  ListPhases,
  ListPrograms,
  ListSubphaseBanks,
  ListSubphases,
  SaveProgramCurriculum,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type {
  EntityStatus,
  ManeuverBankEntity,
  MissionTypeEntity,
  PhaseBankEntity,
  MissionAssignMode,
  PhaseDraftInput,
  ProgramType,
  SubphaseBankEntity,
} from '@core/domain/entities';
import { curriculumHours, expandAutoMissions, matchesAdminSearch } from '@core/domain/services/admin-catalog';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Modal } from '@shared/components/modal/modal';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiRadioCardGroup } from '@shared/components/ui-radio-card-group/ui-radio-card-group';
import { UiSegmentedControl } from '@shared/components/ui-segmented-control/ui-segmented-control';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import {
  CATALOG_CREATE_HOLD_MS,
  academicProgramTypeOptions,
  entityStatusOptions,
  missionAssignModeOptions,
  holdFor,
  touchedError,
} from './catalog-form';

interface StudioSubphase {
  key: string;
  subphaseBankId: string;
  hours: number;
  missionMode: MissionAssignMode;
  missionTypeIds: string[];
  customMissionNames: string[];
  autoMissionCode: string;
  autoMissionCount: number;
  maneuverIds: string[];
}

interface StudioPhase {
  key: string;
  phaseBankId: string;
  subphases: StudioSubphase[];
}

@Component({
  selector: 'app-program-studio-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    Modal,
    UiCheckbox,
    UiFormCard,
    UiInput,
    UiLoading,
    UiRadioCardGroup,
    UiSegmentedControl,
    UiSelect,
    UiTextarea,
  ],
  templateUrl: './program-studio.page.html',
  styleUrl: './program-studio.page.scss',
})
export class ProgramStudioPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listPrograms = inject(ListPrograms);
  private readonly listPhases = inject(ListPhases);
  private readonly listSubphases = inject(ListSubphases);
  private readonly listPhaseBanks = inject(ListPhaseBanks);
  private readonly listSubphaseBanks = inject(ListSubphaseBanks);
  private readonly listMissionTypes = inject(ListMissionTypes);
  private readonly listManeuvers = inject(ListManeuvers);
  private readonly saveCurriculum = inject(SaveProgramCurriculum);
  private readonly toast = inject(ToastService);
  private draftSeq = 1;
  private left = false;

  readonly editingId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.editingId;
  readonly isView = this.route.snapshot.data['mode'] === 'view';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly listHref = '/catalogo/programas';
  readonly phaseBankHref = '/catalogo/banco-fases';
  readonly subphaseBankHref = '/catalogo/banco-subfases';
  readonly entityStatusOptions = entityStatusOptions;
  readonly typeOptions = academicProgramTypeOptions;
  readonly missionModeOptions = missionAssignModeOptions;
  readonly draftMissionName = signal<Record<string, string>>({});
  readonly phaseBanks = signal<PhaseBankEntity[]>([]);
  readonly subphaseBanks = signal<SubphaseBankEntity[]>([]);
  readonly missions = signal<MissionTypeEntity[]>([]);
  readonly maneuvers = signal<ManeuverBankEntity[]>([]);
  readonly phases = signal<StudioPhase[]>([]);
  readonly nextPhaseBankId = signal('');
  readonly nextSubphaseBankId = signal<Record<string, string>>({});
  readonly phaseBankPickerKey = signal<string | null>(null);
  readonly phaseBankSearch = new FormControl('', { nonNullable: true });
  readonly phaseBankQuery = signal('');

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    programType: new FormControl<ProgramType>('PPL', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<EntityStatus>('active', { nonNullable: true }),
  });

  readonly title = computed(() => {
    if (this.isCreate) return 'Nuevo plan de estudios';
    if (this.isView) return 'Itinerario del programa';
    return 'Diseñar plan de estudios';
  });

  readonly lead = computed(() =>
    this.isView
      ? 'Consulta el itinerario del programa. El banco de fases y de subfases se edita fuera de esta estructura.'
      : 'El itinerario solo muestra las fases y lecciones del programa. Para crear o editar el banco, sal de esta pantalla.',
  );

  readonly totalHours = computed(() => curriculumHours(this.phases()));
  readonly phaseCount = computed(() => this.phases().length);

  readonly usedPhaseBankIds = computed(() => new Set(this.phases().map((item) => item.phaseBankId)));

  readonly unusedPhaseBanks = computed(() =>
    this.phaseBanks().filter((item) => item.status === 'active' && !this.usedPhaseBankIds().has(item.id)),
  );

  readonly phaseBankOptions = computed<ChoiceOption[]>(() =>
    this.unusedPhaseBanks().map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  );

  readonly availablePhaseBanks = computed(() =>
    this.unusedPhaseBanks().filter((item) =>
      matchesAdminSearch([item.code, item.name, item.description], this.phaseBankQuery()),
    ),
  );

  readonly nextAvailablePhaseBankId = computed(() => {
    const chosen = this.nextPhaseBankId();
    const unused = this.unusedPhaseBanks();
    if (unused.some((item) => item.id === chosen)) return chosen;
    return unused[0]?.id ?? '';
  });

  readonly phaseBankOpen = computed(() => this.phaseBankPickerKey() !== null);

  readonly subphaseBankOptions = computed<ChoiceOption[]>(() =>
    this.subphaseBanks()
      .filter((item) => item.status === 'active')
      .map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` })),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.left = true;
    });
    this.phaseBankSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.phaseBankQuery.set(value);
    });
    forkJoin({
      programs: this.listPrograms.execute(),
      phases: this.listPhases.execute(),
      subphases: this.listSubphases.execute(),
      phaseBanks: this.listPhaseBanks.execute(),
      subphaseBanks: this.listSubphaseBanks.execute(),
      missions: this.listMissionTypes.execute(),
      maneuvers: this.listManeuvers.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bundle) => {
          this.phaseBanks.set(bundle.phaseBanks);
          this.subphaseBanks.set(bundle.subphaseBanks);
          this.missions.set(bundle.missions);
          this.maneuvers.set(bundle.maneuvers);
          this.nextPhaseBankId.set(bundle.phaseBanks.find((item) => item.status === 'active')?.id ?? '');
          if (this.editingId) {
            const program = bundle.programs.find((item) => item.id === this.editingId);
            if (!program) {
              this.loadState.set('error');
              return;
            }
            this.form.reset({
              code: program.code,
              name: program.name,
              programType: program.programType,
              description: program.description,
              status: program.status,
            });
            const programPhases = bundle.phases
              .filter((item) => item.programId === program.id)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            this.phases.set(
              programPhases.map((phase) => ({
                key: phase.id,
                phaseBankId: phase.phaseBankId,
                subphases: bundle.subphases
                  .filter((item) => item.phaseId === phase.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => ({
                    key: item.id,
                    subphaseBankId: item.subphaseBankId,
                    hours: item.hours,
                    missionMode: item.missionMode,
                    missionTypeIds: [...item.missionTypeIds],
                    customMissionNames: [...item.customMissionNames],
                    autoMissionCode: item.autoMissionCode,
                    autoMissionCount: item.autoMissionCount,
                    maneuverIds: [...item.maneuverIds],
                  })),
              })),
            );
            if (this.isView) this.form.disable({ emitEvent: false });
          }
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  requiredError(name: 'code' | 'name', fallback: string): string | undefined {
    return touchedError(this.form.controls[name], fallback);
  }

  phaseName(phaseBankId: string): string {
    const bank = this.phaseBanks().find((item) => item.id === phaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : 'Fase';
  }

  subphaseName(subphaseBankId: string): string {
    const bank = this.subphaseBanks().find((item) => item.id === subphaseBankId);
    return bank ? `${bank.code} · ${bank.name}` : 'Subfase';
  }

  setType(value: string): void {
    if (this.isView) return;
    if (value === 'PPL' || value === 'CPL' || value === 'ATPL' || value === 'IR' || value === 'FI') {
      this.form.controls.programType.setValue(value);
    }
  }

  setStatus(value: string): void {
    if (this.isView) return;
    this.form.controls.status.setValue(value === 'inactive' ? 'inactive' : 'active');
  }

  openPhaseBankPicker(key: string): void {
    if (this.isView) return;
    this.phaseBankSearch.setValue('');
    this.phaseBankQuery.set('');
    this.phaseBankPickerKey.set(key);
  }

  closePhaseBankPicker(): void {
    this.phaseBankPickerKey.set(null);
  }

  pickPhaseBank(phaseBankId: string): void {
    const key = this.phaseBankPickerKey();
    if (!key || this.isView) return;
    if (this.usedPhaseBankIds().has(phaseBankId)) return;
    this.phases.update((items) => items.map((item) => (item.key === key ? { ...item, phaseBankId } : item)));
    this.closePhaseBankPicker();
  }

  addPhase(): void {
    const phaseBankId = this.nextAvailablePhaseBankId();
    if (!phaseBankId || this.isView) return;
    const defaultSub = this.subphaseBanks().find((item) => item.status === 'active')?.id ?? '';
    this.phases.update((items) => [
      ...items,
      {
        key: `draft-ph-${this.draftSeq++}`,
        phaseBankId,
        subphases: defaultSub
          ? [
              {
                key: `draft-sp-${this.draftSeq++}`,
                subphaseBankId: defaultSub,
                hours: 2,
                missionMode: 'manual',
                missionTypeIds: [],
                customMissionNames: [],
                autoMissionCode: '',
                autoMissionCount: 0,
                maneuverIds: [],
              },
            ]
          : [],
      },
    ]);
  }

  removePhase(key: string): void {
    if (this.isView) return;
    this.phases.update((items) => items.filter((item) => item.key !== key));
  }

  movePhase(key: string, delta: number): void {
    if (this.isView) return;
    this.phases.update((items) => {
      const index = items.findIndex((item) => item.key === key);
      const next = index + delta;
      if (index < 0 || next < 0 || next >= items.length) return items;
      const copy = [...items];
      const [row] = copy.splice(index, 1);
      copy.splice(next, 0, row);
      return copy;
    });
  }

  setNextSubphase(phaseKey: string, value: string): void {
    this.nextSubphaseBankId.update((map) => ({ ...map, [phaseKey]: value }));
  }

  addSubphase(phaseKey: string): void {
    if (this.isView) return;
    const bankId =
      this.nextSubphaseBankId()[phaseKey] || this.subphaseBanks().find((item) => item.status === 'active')?.id || '';
    if (!bankId) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key === phaseKey
          ? {
              ...phase,
              subphases: [
                ...phase.subphases,
                {
                  key: `draft-sp-${this.draftSeq++}`,
                  subphaseBankId: bankId,
                  hours: 2,
                  missionMode: 'manual',
                  missionTypeIds: [],
                  customMissionNames: [],
                  autoMissionCode: '',
                  autoMissionCount: 0,
                  maneuverIds: [],
                },
              ],
            }
          : phase,
      ),
    );
  }

  removeSubphase(phaseKey: string, subKey: string): void {
    if (this.isView) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key === phaseKey
          ? { ...phase, subphases: phase.subphases.filter((item) => item.key !== subKey) }
          : phase,
      ),
    );
  }

  setHours(phaseKey: string, subKey: string, event: Event): void {
    const hours = Number((event.target as HTMLInputElement).value);
    this.patchSubphase(phaseKey, subKey, { hours: Number.isFinite(hours) ? hours : 0 });
  }

  setMissionMode(phaseKey: string, subKey: string, value: string): void {
    if (value !== 'manual' && value !== 'automatic') return;
    this.patchSubphase(phaseKey, subKey, { missionMode: value });
  }

  setAutoCode(phaseKey: string, subKey: string, event: Event): void {
    this.patchSubphase(phaseKey, subKey, { autoMissionCode: (event.target as HTMLInputElement).value });
  }

  setAutoCount(phaseKey: string, subKey: string, event: Event): void {
    const count = Number((event.target as HTMLInputElement).value);
    this.patchSubphase(phaseKey, subKey, { autoMissionCount: Number.isFinite(count) ? count : 0 });
  }

  setDraftMissionName(subKey: string, event: Event): void {
    this.draftMissionName.update((map) => ({ ...map, [subKey]: (event.target as HTMLInputElement).value }));
  }

  addCustomMission(phaseKey: string, subKey: string): void {
    const name = (this.draftMissionName()[subKey] ?? '').trim();
    if (!name || this.isView) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey || sub.customMissionNames.some((item) => item.toLowerCase() === name.toLowerCase())
                  ? sub
                  : { ...sub, customMissionNames: [...sub.customMissionNames, name] },
              ),
            },
      ),
    );
    this.draftMissionName.update((map) => ({ ...map, [subKey]: '' }));
  }

  removeCustomMission(phaseKey: string, subKey: string, name: string): void {
    this.patchSubphase(phaseKey, subKey, {
      customMissionNames: this.phases()
        .flatMap((phase) => phase.subphases)
        .find((sub) => sub.key === subKey)
        ?.customMissionNames.filter((item) => item !== name) ?? [],
    });
  }

  autoPreview(sub: StudioSubphase): string {
    const items = expandAutoMissions(sub.autoMissionCode, Number(sub.autoMissionCount) || 0);
    if (!items.length) return 'Ejemplo: CER y 17 generan C1, C2, C3 … C17.';
    if (items.length <= 8) return items.join(', ');
    return `${items.slice(0, 4).join(', ')} … ${items[items.length - 1]}`;
  }

  missionLabels(sub: StudioSubphase): string[] {
    if (sub.missionMode === 'automatic') {
      return expandAutoMissions(sub.autoMissionCode, sub.autoMissionCount);
    }
    const fromCatalog = sub.missionTypeIds.map((id) => {
      const mission = this.missions().find((item) => item.id === id);
      return mission ? `${mission.code} · ${mission.name}` : id;
    });
    return [...fromCatalog, ...sub.customMissionNames];
  }

  toggleMission(phaseKey: string, subKey: string, missionId: string, checked: boolean): void {
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey
                  ? sub
                  : {
                      ...sub,
                      missionTypeIds: checked
                        ? [...sub.missionTypeIds, missionId]
                        : sub.missionTypeIds.filter((id) => id !== missionId),
                    },
              ),
            },
      ),
    );
  }

  toggleManeuver(phaseKey: string, subKey: string, maneuverId: string, checked: boolean): void {
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) =>
                sub.key !== subKey
                  ? sub
                  : {
                      ...sub,
                      maneuverIds: checked
                        ? [...sub.maneuverIds, maneuverId]
                        : sub.maneuverIds.filter((id) => id !== maneuverId),
                    },
              ),
            },
      ),
    );
  }

  private patchSubphase(phaseKey: string, subKey: string, patch: Partial<StudioSubphase>): void {
    if (this.isView) return;
    this.phases.update((items) =>
      items.map((phase) =>
        phase.key !== phaseKey
          ? phase
          : {
              ...phase,
              subphases: phase.subphases.map((sub) => (sub.key === subKey ? { ...sub, ...patch } : sub)),
            },
      ),
    );
  }

  async save(): Promise<void> {
    if (this.isView || this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Completa el código y el nombre del programa.');
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    const phases: PhaseDraftInput[] = this.phases().map((phase, index) => ({
      phaseBankId: phase.phaseBankId,
      sortOrder: index + 1,
      subphases: phase.subphases.map((sub, subIndex) => ({
        subphaseBankId: sub.subphaseBankId,
        hours: sub.hours,
        missionMode: sub.missionMode,
        missionTypeIds: sub.missionTypeIds,
        customMissionNames: sub.customMissionNames,
        autoMissionCode: sub.autoMissionCode,
        autoMissionCount: sub.autoMissionCount,
        maneuverIds: sub.maneuverIds,
        sortOrder: subIndex + 1,
      })),
    }));
    try {
      if (this.isCreate) this.creating.set(true);
      const saved = await firstValueFrom(
        this.saveCurriculum.execute({
          id: this.editingId ?? undefined,
          program: this.form.getRawValue(),
          phases,
        }),
      );
      if (this.isCreate) await holdFor(CATALOG_CREATE_HOLD_MS);
      if (this.left) return;
      this.toast.show(this.isCreate ? 'Programa creado.' : 'Plan de estudios guardado.');
      await this.router.navigateByUrl(`/catalogo/programas/${saved.id}/editar`);
    } catch (err) {
      if (this.left) return;
      this.creating.set(false);
      this.error.set(err instanceof DomainError ? err.message : 'No hemos podido guardar el programa.');
    } finally {
      if (!this.left) this.saving.set(false);
    }
  }
}
