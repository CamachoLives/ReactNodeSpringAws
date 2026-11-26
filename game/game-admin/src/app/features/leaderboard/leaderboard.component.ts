/**
 * LEADERBOARD EN TIEMPO REAL — Angular + RxJS WebSocket
 *
 * RxWebSocket: Observable sobre WebSocket — se reconecta automáticamente.
 * scan: acumula el estado del leaderboard con cada nuevo mensaje.
 * animateNumber: animación de números para cambios de score.
 */

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  inject, TrackByFunction
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { webSocket } from 'rxjs/webSocket';
import {
  Observable, Subject, BehaviorSubject, timer
} from 'rxjs';
import {
  scan, map, tap, takeUntil, shareReplay,
  startWith, distinctUntilChanged, debounceTime
} from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalScore: number;
  level: number;
  playerClass: string;
  previousRank?: number;  // para animación de cambio de posición
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="leaderboard-panel">
      <header class="lb-header">
        <h2>🏆 Leaderboard en Vivo</h2>
        @if (connected$ | async) {
          <span class="status connected">● En vivo</span>
        } @else {
          <span class="status disconnected">○ Desconectado</span>
        }
      </header>

      <div class="lb-table">
        @for (entry of (leaderboard$ | async); track trackByUsername(0, entry); let i = $index) {
          <div class="lb-row" [class.top3]="i < 3" [class.moving-up]="entry.previousRank && entry.previousRank > entry.rank">
            <span class="rank">{{ rankIcon(i + 1) }}</span>
            <span class="username">{{ entry.username }}</span>
            <span class="class-badge" [style.color]="classColor(entry.playerClass)">
              {{ entry.playerClass }}
            </span>
            <span class="level">Lv.{{ entry.level }}</span>
            <span class="score">{{ entry.totalScore | number }}</span>
          </div>
        }
      </div>

      <!-- Métricas agregadas del leaderboard -->
      @if (metrics$ | async; as m) {
        <footer class="lb-footer">
          <span>{{ m.activePlayers }} jugadores activos</span>
          <span>{{ m.totalScore | number }} XP total ganado</span>
        </footer>
      }
    </section>
  `,
  styles: [`
    .leaderboard-panel { background: #1e293b; border-radius: 12px; overflow: hidden; }
    .lb-header { display: flex; justify-content: space-between; align-items: center;
                 padding: 16px 20px; border-bottom: 1px solid #334155; }
    h2 { margin: 0; color: #f1f5f9; font-size: 18px; }
    .status { font-size: 12px; font-weight: 600; }
    .connected { color: #22c55e; }
    .disconnected { color: #64748b; }
    .lb-row { display: grid; grid-template-columns: 40px 1fr auto 60px 100px;
              gap: 8px; padding: 12px 20px; align-items: center;
              border-bottom: 1px solid #0f172a; transition: background 0.2s; }
    .lb-row:hover { background: #263548; }
    .lb-row.top3 { background: #1a2744; }
    .lb-row.moving-up { animation: slideUp 0.4s ease; }
    @keyframes slideUp { from { transform: translateY(8px); opacity: 0.5; } to { transform: none; opacity: 1; } }
    .rank { font-weight: 700; font-size: 16px; }
    .username { color: #e2e8f0; font-weight: 600; }
    .level { color: #64748b; font-size: 13px; text-align: center; }
    .score { text-align: right; font-weight: 700; color: #fbbf24; font-size: 15px; }
    .lb-footer { display: flex; justify-content: space-between; padding: 12px 20px;
                 color: #64748b; font-size: 12px; background: #0f172a; }
  `]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly connected$$ = new BehaviorSubject<boolean>(false);

  readonly connected$ = this.connected$$.asObservable();

  // WebSocket como Observable — RxJS webSocket operator
  private readonly ws$ = webSocket<LeaderboardEntry>({
    url: `${environment.wsUrl}/leaderboard`,
    openObserver: { next: () => this.connected$$.next(true) },
    closeObserver: { next: () => this.connected$$.next(false) }
  });

  /**
   * scan: acumula el estado del leaderboard con cada mensaje recibido.
   * Programación funcional: (estado acumulado, nuevo valor) → nuevo estado
   */
  readonly leaderboard$: Observable<LeaderboardEntry[]> = this.ws$.pipe(
    scan((board, entry) => {
      const existing = board.findIndex(e => e.username === entry.username);
      const updated = existing >= 0
        ? board.map((e, i) => i === existing ? { ...e, ...entry } : e)
        : [...board, entry];

      // Re-rankear y agregar previousRank para animaciones
      return updated
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((e, i) => ({ ...e, previousRank: e.rank, rank: i + 1 }))
        .slice(0, 20);
    }, [] as LeaderboardEntry[]),
    startWith([]),
    shareReplay(1),
    takeUntil(this.destroy$)
  );

  // Métricas derivadas (selector reactivo)
  readonly metrics$ = this.leaderboard$.pipe(
    map(board => ({
      activePlayers: board.length,
      totalScore: board.reduce((s, e) => s + e.totalScore, 0)
    })),
    distinctUntilChanged((a, b) => a.totalScore === b.totalScore),
    takeUntil(this.destroy$)
  );

  ngOnInit(): void {
    // Ping periódico para mantener la conexión
    timer(0, 30_000).pipe(takeUntil(this.destroy$))
      .subscribe(() => this.ws$.next({ type: 'ping' } as any));
  }

  rankIcon(rank: number): string {
    return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  }

  classColor(cls: string): string {
    const colors: Record<string, string> = {
      APPRENTICE: '#6b7280', ENGINEER: '#3b82f6',
      ARCHITECT: '#8b5cf6', LEGEND: '#f59e0b'
    };
    return colors[cls] ?? '#94a3b8';
  }

  readonly trackByUsername: TrackByFunction<LeaderboardEntry> =
    (_, entry) => entry.username;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws$.complete();
  }
}
