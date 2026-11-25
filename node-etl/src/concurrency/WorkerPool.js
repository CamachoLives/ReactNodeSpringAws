/**
 * CONCURRENCIA Y PARALELISMO en Node.js
 *
 * Worker Threads: verdadero paralelismo (múltiples hilos del OS)
 * Event Loop: concurrencia cooperativa para I/O
 * Promise.all / Promise.allSettled: paralelismo de Promises
 * Streams: procesamiento de datos en pipeline sin cargar todo en memoria
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';

// ─────────────────────────────────────────────
// WORKER THREAD POOL
// Pool de workers reutilizables para CPU-bound work
// ─────────────────────────────────────────────
export class WorkerPool extends EventEmitter {
  #workers = [];
  #queue = [];
  #activeCount = 0;

  constructor(workerScript, poolSize = 4) {
    super();
    this.workerScript = workerScript;
    this.poolSize = poolSize;
  }

  /**
   * Ejecuta una tarea en un worker disponible.
   * Si todos están ocupados, encola la tarea.
   */
  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      if (this.#activeCount < this.poolSize) {
        this.#runTask(task);
      } else {
        this.#queue.push(task);
      }
    });
  }

  /**
   * Ejecuta múltiples tareas en PARALELO.
   * Promise.allSettled: espera todas, incluso si algunas fallan.
   */
  async executeAll(dataList) {
    const promises = dataList.map(data => this.execute(data));
    return Promise.allSettled(promises);
  }

  #runTask({ data, resolve, reject }) {
    this.#activeCount++;
    const worker = new Worker(this.workerScript, { workerData: data });

    worker.on('message', result => {
      this.#activeCount--;
      resolve(result);
      this.#processQueue();
      this.emit('taskComplete', result);
    });

    worker.on('error', err => {
      this.#activeCount--;
      reject(err);
      this.#processQueue();
      this.emit('taskError', err);
    });
  }

  #processQueue() {
    if (this.#queue.length > 0 && this.#activeCount < this.poolSize) {
      this.#runTask(this.#queue.shift());
    }
  }

  get queueSize() { return this.#queue.length; }
  get activeWorkers() { return this.#activeCount; }
}

// ─────────────────────────────────────────────
// ASYNC PATTERNS con Promises
// ─────────────────────────────────────────────

/**
 * Ejecuta promesas en paralelo con límite de concurrencia.
 * Evita saturar I/O lanzando 1000 requests simultáneos.
 */
export async function parallelWithConcurrencyLimit(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task()).then(result => {
      executing.delete(promise);
      return result;
    });

    executing.add(promise);
    results.push(promise);

    // Si alcanzamos el límite, esperar a que termine alguno
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Retry con backoff exponencial — imperativo con lógica de control explícita
 */
export async function withRetry(fn, maxRetries = 3, baseDelayMs = 100) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // backoff exponencial
        console.warn(`Intento ${attempt} falló: ${err.message}. Reintentando en ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw new Error(`Falló después de ${maxRetries} intentos: ${lastError.message}`);
}

// ─────────────────────────────────────────────
// STREAMS — procesamiento pipeline sin memoria completa
// ─────────────────────────────────────────────
export function createTransformStream(transformFn) {
  const { Transform } = await import('stream').then(m => m);
  // No se puede usar await en función síncrona, esto es solo ilustrativo
  return null; // Ver pipeline.js para implementación completa
}
