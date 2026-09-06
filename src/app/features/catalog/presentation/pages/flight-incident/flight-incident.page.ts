import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NAV_ROUTES } from '@layout/navigation/data/nav-routes.constants';
import {
  CreateFlightIncident,
  GetFlightIncident,
  GetFlightIncidentContext,
  type FlightIncidentContext,
} from '@core/application';
import { DomainError } from '@core/domain/errors/domain-error';
import type {
  FlightIncidentEntity,
  FlightIncidentPhase,
  FlightIncidentSeverity,
  FlightIncidentStatus,
  FlightIncidentType,
} from '@core/domain/entities/flight-incident';
import { map, switchMap } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { Card } from '@shared/components/card/card';
import { UiAvatar } from '@shared/components/ui-avatar/ui-avatar';
import { UiCheckbox } from '@shared/components/ui-checkbox/ui-checkbox';
import { UiInput } from '@shared/components/ui-input/ui-input';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiPosterField } from '@shared/components/ui-poster-field/ui-poster-field';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import {
  FLIGHT_INCIDENT_ATA_OPTIONS,
  FLIGHT_INCIDENT_COPY,
  FLIGHT_INCIDENT_MISSION_ORIGIN,
  FLIGHT_INCIDENT_PHASE_OPTIONS,
  FLIGHT_INCIDENT_ROUTES,
  FLIGHT_INCIDENT_SEVERITY_OPTIONS,
  FLIGHT_INCIDENT_TYPE_OPTIONS,
} from '../../../constants/flight-incident.copy.constants';

@Component({
  selector: 'app-flight-incident-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    UiAvatar,
    UiCheckbox,
    UiInput,
    UiLoading,
    UiPosterField,
    UiSelect,
    UiTextarea,
  ],
  templateUrl: './flight-incident.page.html',
  styleUrl: './flight-incident.page.scss',
})
export class FlightIncidentPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getContext = inject(GetFlightIncidentContext);
  private readonly getIncident = inject(GetFlightIncident);
  private readonly createIncident = inject(CreateFlightIncident);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly copy = FLIGHT_INCIDENT_COPY;
  readonly readOnly = this.route.snapshot.data?.['mode'] === 'view';
  readonly fromMission = signal(this.route.snapshot.queryParamMap.get('origen') === FLIGHT_INCIDENT_MISSION_ORIGIN);
  readonly phaseOptions = FLIGHT_INCIDENT_PHASE_OPTIONS;
  readonly typeOptions = FLIGHT_INCIDENT_TYPE_OPTIONS;
  readonly severityOptions = FLIGHT_INCIDENT_SEVERITY_OPTIONS;
  readonly ataOptions = FLIGHT_INCIDENT_ATA_OPTIONS;
  readonly descriptionMax = 1500;
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly context = signal<FlightIncidentContext | null>(null);
  readonly incident = signal<FlightIncidentEntity | null>(null);
  readonly evidence = signal('');
  readonly descriptionLen = signal(0);

  readonly form = new FormGroup({
    missionId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    aircraftId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    detectedAt: new FormControl('', { nonNullable: true }),
    sector: new FormControl('', { nonNullable: true }),
    phase: new FormControl<FlightIncidentPhase>('enroute', { nonNullable: true }),
    incidentType: new FormControl<FlightIncidentType>('maintenance', { nonNullable: true }),
    severity: new FormControl<FlightIncidentSeverity>('mel', { nonNullable: true }),
    summary: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    ataCode: new FormControl('ATA-29', { nonNullable: true }),
    instrumentReading: new FormControl('', { nonNullable: true }),
    caution: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1500)] }),
    crewAction: new FormControl('', { nonNullable: true }),
    declared: new FormControl(false, { nonNullable: true }),
  });

  readonly workspaceHref = computed(() => {
    const id = this.context()?.executionId;
    return id ? `${NAV_ROUTES.missionExecution}/${id}` : NAV_ROUTES.missionExecution;
  });

  readonly exitHref = computed(() => (this.fromMission() ? this.workspaceHref() : FLIGHT_INCIDENT_ROUTES.list));
  readonly exitLabel = computed(() => (this.fromMission() ? this.copy.back : this.copy.backToList));

  readonly folio = computed(
    () => this.incident()?.folio ?? `INC-${new Date().getFullYear()}-0418`,
  );
  readonly missionOptions = computed<ChoiceOption[]>(() => [...(this.context()?.missionOptions ?? [])]);
  readonly aircraftOptions = computed<ChoiceOption[]>(() => [...(this.context()?.aircraftOptions ?? [])]);

  constructor() {
    this.form.controls.description.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.descriptionLen.set(value.length);
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadState.set('error');
      return;
    }
    if (this.readOnly) {
      this.getIncident
        .execute(id)
        .pipe(
          switchMap((incident) =>
            this.getContext.execute(incident.executionId).pipe(map((context) => ({ incident, context }))),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: ({ incident, context }) => this.applyView(incident, context),
          error: () => this.loadState.set('error'),
        });
      return;
    }
    this.getContext
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (context) => {
          this.context.set(context);
          this.form.patchValue({
            missionId: context.missionId,
            aircraftId: context.aircraftId,
            detectedAt: context.detectedAt,
            sector: context.sector,
          });
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  private applyView(incident: FlightIncidentEntity, context: FlightIncidentContext): void {
    this.incident.set(incident);
    this.context.set(context);
    this.form.patchValue({
      missionId: incident.missionId,
      aircraftId: incident.aircraftId,
      detectedAt: incident.detectedAt,
      sector: incident.sector,
      phase: incident.phase,
      incidentType: incident.incidentType,
      severity: incident.severity,
      summary: incident.summary,
      ataCode: incident.ataCode,
      instrumentReading: incident.instrumentReading,
      caution: incident.caution,
      description: incident.description,
      crewAction: incident.crewAction,
      declared: incident.declared,
    });
    this.evidence.set(incident.evidenceName ?? '');
    this.form.disable();
    this.loadState.set('ready');
  }

  typeTag(value: string): string {
    return this.copy.typeTags[value as keyof typeof this.copy.typeTags] ?? '';
  }

  typeHint(value: string): string {
    return this.copy.typeHints[value as keyof typeof this.copy.typeHints] ?? '';
  }

  severityHint(value: string): string {
    return this.copy.severityHints[value as keyof typeof this.copy.severityHints] ?? '';
  }

  severityStatus(value: string): string {
    return this.copy.severityStatus[value as keyof typeof this.copy.severityStatus] ?? '';
  }

  setPhase(value: string): void {
    if (this.readOnly) return;
    this.form.controls.phase.setValue(value as FlightIncidentPhase);
  }

  setType(value: string): void {
    if (this.readOnly) return;
    this.form.controls.incidentType.setValue(value as FlightIncidentType);
  }

  setSeverity(value: string): void {
    if (this.readOnly) return;
    this.form.controls.severity.setValue(value as FlightIncidentSeverity);
  }

  setEvidence(value: string): void {
    if (this.readOnly) return;
    this.evidence.set(value);
  }

  saveDraft(): void {
    this.submit('draft');
  }

  submitReport(): void {
    this.submit('submitted');
  }

  private submit(status: FlightIncidentStatus): void {
    const context = this.context();
    if (!context || this.readOnly || this.saving()) return;
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.createIncident
      .execute({
        executionId: context.executionId,
        missionId: raw.missionId,
        aircraftId: raw.aircraftId,
        detectedAt: raw.detectedAt,
        sector: raw.sector,
        phase: raw.phase,
        incidentType: raw.incidentType,
        severity: raw.severity,
        summary: raw.summary,
        ataCode: raw.ataCode,
        instrumentReading: raw.instrumentReading,
        caution: raw.caution,
        description: raw.description,
        crewAction: raw.crewAction,
        evidenceName: this.evidence() ? 'evidencia.png' : null,
        declared: raw.declared,
        status,
      })
      .subscribe({
        next: (item) => {
          this.saving.set(false);
          if (status === 'draft') {
            this.toast.success(this.copy.draftSaved, item.folio);
            return;
          }
          this.toast.success(this.copy.submitted, `${item.folio}. ${this.copy.submittedLead}`);
          void this.router.navigateByUrl(this.exitHref());
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = error instanceof DomainError ? error.message : this.copy.saveError;
          this.toast.error(this.copy.saveError, message);
        },
      });
  }
}
