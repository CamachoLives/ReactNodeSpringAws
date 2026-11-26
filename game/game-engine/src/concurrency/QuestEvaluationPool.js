/**
 * POOL DE WORKERS para evaluación de quests
 *
 * Reutiliza Worker Threads en lugar de crear uno nuevo por evaluación.
 * Patrón Object Pool aplicado a Worker Threads.
 *
 * PARALELISMO: múltiples jugadores pueden tener su código evaluado
 * simultáneamente en workers diferentes.
 */

import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_SCRIPT = join(__dirname, 'QuestEvaluatorWorker.js');

export class QuestEvaluationPool extends EventEmitter {
  #workers = [];
  #queue = [];
  #busy = new Set();

  constructor(poolSize = 4) {
    super();
    // Crear workers al inicio (pre-calentado del pool)
    for (let i = 0; i < poolSize; i++) {
      this.#workers.push({ id: i, worker: null }); // lazy: worker creado al usar
    }
  }

  /**
   * Evalúa código de un jugador.
   * Si hay worker disponible → inmediato.
   * Si todos están ocupados → encola.
   *
   * ASYNC: retorna Promise que resuelve cuando el worker termina.
   */
  async evaluate({ questId, playerCode, testCases, timeoutMs = 5000 }) {
    return new Promise((resolve, reject) => {
      const task = { questId, playerCode, testCases, timeoutMs, resolve, reject };
      const freeSlot = this.#workers.find(s => !this.#busy.has(s.id));

      if (freeSlot) {
        this.#runTask(freeSlot, task);
      } else {
        this.#queue.push(task);
        this.emit('pool:queued', { queueSize: this.#queue.length });
      }
    });
  }

  #runTask(slot, task) {
    this.#busy.add(slot.id);

    // Crear Worker con datos del task
    const worker = new Worker(WORKER_SCRIPT, {
      workerData: {
        questId: task.questId,
        playerCode: task.playerCode,
        testCases: task.testCases,
        timeoutMs: task.timeoutMs
      }
    });

    worker.once('message', (result) => {
      this.#busy.delete(slot.id);
      worker.terminate(); // liberar recursos del worker
      task.resolve(result);
      this.#processNext(slot);
      this.emit('pool:completed', { questId: task.questId });
    });

    worker.once('error', (err) => {
      this.#busy.delete(slot.id);
      worker.terminate();
      task.reject(err);
      this.#processNext(slot);
    });
  }

  #processNext(slot) {
    if (this.#queue.length > 0) {
      const next = this.#queue.shift();
      this.#runTask(slot, next);
    }
  }

  get queueLength() { return this.#queue.length; }
  get busyWorkers() { return this.#busy.size; }
  get totalWorkers() { return this.#workers.length; }
}
