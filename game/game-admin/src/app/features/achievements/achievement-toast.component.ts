/**
 * ACHIEVEMENT TOAST — notificación animada de logro desbloqueado
 *
 * Patrón: Observer + Command
 * RxJS: Subject como bus de eventos de logros
 * Angular animations: estado CSS gestionado reactivamente
 */

import {
  Component, Input, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { Injectable } from '@angular/core';

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  xpBonus: number;
}

// Servicio Singleton para notificaciones de logros
@Injectable({ providedIn: 'root' })
export class AchievementNotificationService {
  private readonly queue$ = new Subject<AchievementNotification>();
  readonly notification$ = this.queue$.asObservable();

  notify(achievement: AchievementNotification): void {
    this.queue$.next(achievement);
  }
}

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current) {
      <div class="toast" [ngClass]="['rarity-' + current.rarity.toLowerCase()]">
        <div class="toast-icon">{{ current.icon }}</div>
        <div class="toast-content">
          <div class="toast-label">¡Logro Desbloqueado!</div>
          <div class="toast-title">{{ current.title }}</div>
          <div class="toast-desc">{{ current.description }}</div>
        </div>
        <div class="toast-xp">+{{ current.xpBonus }} XP</div>
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 1000;
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; border-radius: 12px; min-width: 320px;
      border: 1px solid currentColor;
      animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    .rarity-common    { background: #1f2937; border-color: #6b7280; color: #9ca3af; }
    .rarity-rare      { background: #1e3a8a; border-color: #3b82f6; color: #bfdbfe; }
    .rarity-epic      { background: #3b0764; border-color: #a855f7; color: #e9d5ff; }
    .rarity-legendary { background: #451a03; border-color: #f59e0b; color: #fde68a; }
    .toast-icon   { font-size: 32px; }
    .toast-label  { font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.8; }
    .toast-title  { font-size: 15px; font-weight: 700; }
    .toast-desc   { font-size: 12px; opacity: 0.8; margin-top: 2px; }
    .toast-content { flex: 1; }
    .toast-xp     { font-weight: 700; font-size: 16px; white-space: nowrap; }
  `]
})
export class AchievementToastComponent implements OnInit {
  current: AchievementNotification | null = null;

  constructor(private readonly notifService: AchievementNotificationService) {}

  ngOnInit(): void {
    // switchMap: cancela el timer anterior cuando llega un nuevo logro
    this.notifService.notification$.pipe(
      switchMap(notif => {
        this.current = notif;
        return timer(4000); // muestra por 4 segundos
      })
    ).subscribe(() => { this.current = null; });
  }
}
