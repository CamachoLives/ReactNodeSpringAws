/**
 * ANGULAR COMPONENT — Reactive Programming + RxJS
 *
 * OnPush: solo re-renderiza cuando el input cambia o el observable emite (performance)
 * AsyncPipe: suscribe/desuscribe automáticamente (evita memory leaks)
 * Signals (Angular 17): alternativa reactiva a BehaviorSubject
 * Composición de observables con RxJS operators
 */

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  inject, signal, computed
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable, Subject, combineLatest, debounceTime, distinctUntilChanged,
  map, startWith, takeUntil
} from 'rxjs';
import { PipelineService, Pipeline } from '../../core/services/pipeline.service';

@Component({
  selector: 'app-pipeline-list',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, DecimalPipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // optimización: solo re-render necesario
  template: `
    <div class="admin-container">
      <header class="page-header">
        <h1>Pipelines ETL</h1>
        <!-- Métricas reactivas con AsyncPipe — sin subscribe/unsubscribe manual -->
        @if (metrics$ | async; as m) {
          <div class="metrics-row">
            <span class="metric">Total: <strong>{{ m.total }}</strong></span>
            <span class="metric running">Activos: <strong>{{ m.running }}</strong></span>
            <span class="metric failed">Fallidos: <strong>{{ m.failed }}</strong></span>
            <span class="metric">Registros: <strong>{{ m.totalRecords | number }}</strong></span>
          </div>
        }
      </header>

      <!-- Filtros reactivos — FormControl observable -->
      <div class="filters">
        <input [formControl]="searchControl" placeholder="Buscar pipeline..." class="search-input" />
        <select [formControl]="statusControl" class="status-select">
          <option value="ALL">Todos</option>
          <option value="RUNNING">Ejecutando</option>
          <option value="IDLE">Inactivo</option>
          <option value="FAILED">Fallido</option>
        </select>
      </div>

      <!-- Lista filtrada — combinación de observables -->
      @if (filteredPipelines$ | async; as pipelines) {
        <div class="pipeline-grid">
          @for (pipeline of pipelines; track pipeline.id) {
            <app-pipeline-card
              [pipeline]="pipeline"
              (start)="onStart($event)"
              (stop)="onStop($event)"
            />
          }
          @empty {
            <p class="empty-state">No se encontraron pipelines</p>
          }
        </div>
      }

      @if (pipelineService.loading$ | async) {
        <div class="loading-overlay">Cargando...</div>
      }
    </div>
  `
})
export class PipelineListComponent implements OnInit, OnDestroy {
  protected readonly pipelineService = inject(PipelineService);

  readonly metrics$ = this.pipelineService.metrics$;

  // FormControls: cada uno es un Observable de su valor
  searchControl = new FormControl('', { nonNullable: true });
  statusControl = new FormControl<string>('ALL', { nonNullable: true });

  private readonly destroy$ = new Subject<void>();

  /**
   * combineLatest: emite cuando CUALQUIERA de los observables emite.
   * Programación reactiva: los datos fluyen automáticamente.
   */
  readonly filteredPipelines$: Observable<Pipeline[]> = combineLatest([
    this.pipelineService.pipelines$,
    this.searchControl.valueChanges.pipe(startWith(''), debounceTime(200), distinctUntilChanged()),
    this.statusControl.valueChanges.pipe(startWith('ALL'))
  ]).pipe(
    map(([pipelines, search, status]) =>
      pipelines
        .filter(p => status === 'ALL' || p.status === status)
        .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    ),
    takeUntil(this.destroy$)
  );

  ngOnInit(): void {
    this.pipelineService.startPolling(10_000);
  }

  onStart(id: string): void {
    this.pipelineService.start(id).subscribe();
  }

  onStop(id: string): void {
    this.pipelineService.stop(id).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
