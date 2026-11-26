/**
 * GAME ENGINE — Node.js Event-Driven Architecture
 *
 * El motor del juego usa eventos para desacoplar completamente
 * los sistemas (scoring, achievements, notifications, analytics).
 *
 * Patrón: Event-Driven + Pub/Sub
 * Concurrencia: setImmediate y microtasks para no bloquear el event loop
 */

import { EventEmitter } from 'events';

export class GameEngine extends EventEmitter {
  #systems = new Map();     // sistemas registrados
  #tickRate = 20;           // 20 ticks por segundo (como Minecraft)
  #running = false;
  #tickCount = 0;
  #startTime = null;

  /**
   * Registra un sistema de juego.
   * OCP: nuevos sistemas sin modificar el engine.
   */
  registerSystem(name, system) {
    this.#systems.set(name, system);
    system.onRegister?.(this); // hook de inicialización
    return this;
  }

  /**
   * Inicia el game loop.
   * Imperativo: bucle de control de tiempo explícito.
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    this.#startTime = Date.now();
    this.emit('engine:start');
    this.#loop();
  }

  stop() {
    this.#running = false;
    this.emit('engine:stop', { ticks: this.#tickCount, uptime: this.uptime() });
  }

  /**
   * Game Loop — corazón del engine.
   * setImmediate: cede el control al event loop entre ticks
   * (no bloquea I/O ni promises pendientes).
   */
  #loop() {
    if (!this.#running) return;

    const tickStart = Date.now();
    this.#tick();

    const elapsed = Date.now() - tickStart;
    const delay = Math.max(0, (1000 / this.#tickRate) - elapsed);

    setTimeout(() => this.#loop(), delay);
  }

  #tick() {
    this.#tickCount++;
    const delta = 1 / this.#tickRate;

    // Actualizar todos los sistemas registrados
    for (const [name, system] of this.#systems) {
      try {
        system.update?.(delta, this.#tickCount);
      } catch (err) {
        this.emit('engine:error', { system: name, error: err });
      }
    }

    this.emit('engine:tick', { tick: this.#tickCount, delta });
  }

  uptime() {
    return this.#startTime ? Date.now() - this.#startTime : 0;
  }

  get tickCount() { return this.#tickCount; }
  get isRunning() { return this.#running; }
}

/**
 * Sistema base — interfaz implícita (duck typing).
 * Polimorfismo: cada sistema implementa update() con su propia lógica.
 */
export class GameSystem {
  onRegister(engine) {}  // hook cuando el sistema se registra
  update(delta, tick) {} // llamado cada tick
}
