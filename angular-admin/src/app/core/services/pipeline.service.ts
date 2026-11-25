/**
 * ANGULAR SERVICE — PROGRAMACIÓN REACTIVA con RxJS
 *
 * Observables: flujos de datos asíncronos (vs Promises: un solo valor)
 * RxJS Operators: map, filter, switchMap, catchError, retry, shareReplay
 * BehaviorSubject: estado local reactivo (patrón Observer)
 * DIP: componentes dependen de esta abstracción, no de HttpClient directamente
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable, BehaviorSubject, throwError, interval, Subject
} from 'rxjs';
import {
  map, catchError, retry, shareReplay, switchMap, tap,
  takeUntil, startWith, distinctUntilChanged
} from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Pipeline {
  id: string;
  name: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  sourceType: string;
  createdAt: string;
  lastRunAt: string | null;
  recordsProcessed: number;
}

@Injectable({ providedIn: 'root' })
export class PipelineService {
  private readonly apiUrl = `${environment.apiUrl}/pipelines`;

  // BehaviorSubject: estado reactivo con valor inicial (patrón Observer)
  private readonly _pipelines$ = new BehaviorSubject<Pipeline[]>([]);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _destroy$ = new Subject<void>();

  // Observables públicos (read-only) — encapsulación
  readonly pipelines$ = this._pipelines$.asObservable();
  readonly loading$ = this._loading$.asObservable();

  // Selector reactivo derivado (como computed en Vue / selector en Redux)
  readonly activePipelines$ = this.pipelines$.pipe(
    map(pipelines => pipelines.filter(p => p.status === 'RUNNING')),
    distinctUntilChanged() // solo emite si cambió
  );

  readonly metrics$ = this.pipelines$.pipe(
    map(pipelines => ({
      total: pipelines.length,
      running: pipelines.filter(p => p.status === 'RUNNING').length,
      failed: pipelines.filter(p => p.status === 'FAILED').length,
      totalRecords: pipelines.reduce((s, p) => s + p.recordsProcessed, 0)
    })),
    shareReplay(1) // compartir resultado entre múltiples suscriptores (performance)
  );

  constructor(private readonly http: HttpClient) {}

  // Carga inicial + polling cada 10s
  startPolling(intervalMs = 10_000): void {
    interval(intervalMs).pipe(
      startWith(0),                    // emite inmediatamente al suscribir
      switchMap(() => this.loadAll()), // cancela request anterior si no terminó
      takeUntil(this._destroy$)        // auto-unsubscribe al destruir servicio
    ).subscribe();
  }

  loadAll(): Observable<Pipeline[]> {
    this._loading$.next(true);
    return this.http.get<Pipeline[]>(this.apiUrl).pipe(
      tap(pipelines => {
        this._pipelines$.next(pipelines);
        this._loading$.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getById(id: string): Observable<Pipeline> {
    return this.http.get<Pipeline>(`${this.apiUrl}/${id}`).pipe(
      retry({ count: 2, delay: 1000 }), // reintentar 2 veces con 1s de espera
      catchError(this.handleError.bind(this))
    );
  }

  start(id: string): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.apiUrl}/${id}/start`, {}).pipe(
      tap(updated => this.updateLocal(updated)),
      catchError(this.handleError.bind(this))
    );
  }

  stop(id: string): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${this.apiUrl}/${id}/stop`, {}).pipe(
      tap(updated => this.updateLocal(updated)),
      catchError(this.handleError.bind(this))
    );
  }

  // Actualiza un pipeline en el estado local sin recargar todos
  private updateLocal(updated: Pipeline): void {
    const current = this._pipelines$.getValue();
    const index = current.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      const next = [...current]; // inmutabilidad
      next[index] = updated;
      this._pipelines$.next(next);
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this._loading$.next(false);
    const message = error.error?.message ?? `HTTP ${error.status}: ${error.statusText}`;
    console.error('[PipelineService]', message);
    return throwError(() => new Error(message));
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
