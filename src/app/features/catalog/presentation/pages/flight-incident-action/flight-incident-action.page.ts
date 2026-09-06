import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GetFlightIncident, ListAircraft, TakeFlightIncidentAction } from '@core/application';
import type { FlightIncidentActionOutcome, FlightIncidentEntity, FlightIncidentSeverity } from '@core/domain/entities';
import { DomainError } from '@core/domain/errors/domain-error';
import { forkJoin } from 'rxjs';
import { Alert } from '@shared/components/alert/alert';
import { Button } from '@shared/components/button/button';
import { UiFormCard } from '@shared/components/ui-form-card/ui-form-card';
import { UiLoading } from '@shared/components/ui-loading/ui-loading';
import { UiSelect } from '@shared/components/ui-select/ui-select';
import { UiTextarea } from '@shared/components/ui-textarea/ui-textarea';
import { ToastService } from '@shared/components/ui-toast/toast.service';
import type { ChoiceOption } from '@shared/models/choice.model';
import { FLIGHT_INCIDENT_COPY, FLIGHT_INCIDENT_ROUTES } from '../../../constants/flight-incident.copy.constants';

@Component({
  selector: 'app-flight-incident-action-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Alert, Button, UiFormCard, UiLoading, UiSelect, UiTextarea],
  templateUrl: './flight-incident-action.page.html',
  styleUrl: './flight-incident-action.page.scss',
})
export class FlightIncidentActionPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getIncident = inject(GetFlightIncident);
  private readonly takeAction = inject(TakeFlightIncidentAction);
  private readonly listAircraft = inject(ListAircraft);
  private readonly toast = inject(ToastService);

  readonly copy = FLIGHT_INCIDENT_COPY;
  readonly listHref = FLIGHT_INCIDENT_ROUTES.list;
  readonly readOnly = this.route.snapshot.queryParamMap.get('modo') === 'ver';
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly saving = signal(false);
  readonly incident = signal<FlightIncidentEntity | null>(null);
  readonly aircraftLabel = signal('');

  readonly outcomeOptions: ChoiceOption[] = (
    Object.entries(FLIGHT_INCIDENT_COPY.actionOutcomes) as [FlightIncidentActionOutcome, string][]
  ).map(([value, label]) => ({ value, label }));

  readonly form = new FormGroup({
    crewAction: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    workshopNote: new FormControl('', { nonNullable: true }),
    outcome: new FormControl<FlightIncidentActionOutcome>('resolved', { nonNullable: true }),
  });

  readonly folio = computed(() => this.incident()?.folio ?? '');
  readonly summary = computed(() => this.incident()?.summary || this.copy.none);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadState.set('error');
      return;
    }
    forkJoin({
      incident: this.getIncident.execute(id),
      aircraft: this.listAircraft.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ incident, aircraft }) => {
          this.incident.set(incident);
          this.aircraftLabel.set(aircraft.find((item) => item.id === incident.aircraftId)?.registration ?? incident.aircraftId);
          this.form.patchValue({
            crewAction: incident.crewAction,
            workshopNote: incident.workshopNote,
            outcome: outcomeFromSeverity(incident.severity),
          });
          if (this.readOnly) this.form.disable();
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  setOutcome(value: string): void {
    this.form.controls.outcome.setValue((value as FlightIncidentActionOutcome) || 'resolved');
  }

  save(): void {
    const current = this.incident();
    if (!current || this.readOnly || this.saving()) return;
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.takeAction
      .execute(current.id, {
        crewAction: raw.crewAction,
        workshopNote: raw.workshopNote,
        outcome: raw.outcome,
      })
      .subscribe({
        next: (item) => {
          this.saving.set(false);
          this.toast.success(this.copy.actionSaved, item.folio);
          void this.router.navigateByUrl(this.listHref);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = error instanceof DomainError ? error.message : this.copy.actionSaveError;
          this.toast.error(this.copy.actionSaveError, message);
        },
      });
  }
}

function outcomeFromSeverity(severity: FlightIncidentSeverity): FlightIncidentActionOutcome {
  if (severity === 'routine') return 'resolved';
  if (severity === 'mel') return 'deferred';
  return 'grounded';
}
