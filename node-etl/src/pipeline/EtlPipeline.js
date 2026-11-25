/**
 * ETL PIPELINE ORQUESTADOR
 *
 * Une Extract → Transform → Load en un pipeline configurable.
 * COMPOSITE PATTERN: el pipeline puede contener sub-pipelines.
 * EVENT-DRIVEN: emite eventos en cada fase.
 */

import { EventEmitter } from 'events';
import { parallelWithConcurrencyLimit, withRetry } from '../concurrency/WorkerPool.js';

export class EtlPipeline extends EventEmitter {
  #name;
  #extractor;
  #transformPipeline;
  #loaderChain;
  #config;

  constructor({ name, extractor, transformPipeline, loaderChain, config = {} }) {
    super();
    this.#name = name;
    this.#extractor = extractor;
    this.#transformPipeline = transformPipeline;
    this.#loaderChain = loaderChain;
    this.#config = config;
  }

  async run() {
    const startTime = Date.now();
    this.emit('started', { pipeline: this.#name, startTime });
    console.log(`[ETL] Pipeline "${this.#name}" iniciado`);

    try {
      // EXTRACT — con retry automático
      this.emit('phase', { phase: 'extract', pipeline: this.#name });
      const rawData = await withRetry(
        () => this.#extractor.extract(this.#config.extract),
        3
      );
      console.log(`[ETL] Extraídos: ${rawData.length} registros`);

      // TRANSFORM — funcional: sin estado, retorna nuevos objetos
      this.emit('phase', { phase: 'transform', pipeline: this.#name });
      const transformed = this.#transformPipeline.applyAndFilter(rawData);
      const rejected = rawData.length - transformed.length;
      console.log(`[ETL] Transformados: ${transformed.length} válidos, ${rejected} rechazados`);

      // LOAD — batch con manejo de errores
      this.emit('phase', { phase: 'load', pipeline: this.#name });
      const result = await this.#loaderChain.route(
        transformed,
        this.#config.load.destination,
        this.#config.load
      );

      const duration = Date.now() - startTime;
      const summary = {
        pipeline: this.#name,
        extracted: rawData.length,
        transformed: transformed.length,
        rejected,
        loaded: result.loaded,
        failed: result.failed,
        durationMs: duration
      };

      this.emit('completed', summary);
      console.log(`[ETL] Completado en ${duration}ms:`, summary);
      return summary;

    } catch (err) {
      this.emit('error', { pipeline: this.#name, error: err.message });
      throw err;
    }
  }

  get name() { return this.#name; }
}

// ─────────────────────────────────────────────
// ORQUESTADOR DE MÚLTIPLES PIPELINES EN PARALELO
// ─────────────────────────────────────────────
export class PipelineOrchestrator {
  #pipelines = [];

  register(pipeline) {
    this.#pipelines.push(pipeline);
    return this;
  }

  /**
   * Ejecuta todos los pipelines en paralelo con límite de concurrencia.
   * Programación funcional + concurrencia.
   */
  async runAll(concurrencyLimit = 3) {
    console.log(`[Orchestrator] Ejecutando ${this.#pipelines.length} pipelines (límite: ${concurrencyLimit})`);

    const tasks = this.#pipelines.map(pipeline => () => pipeline.run());
    const results = await parallelWithConcurrencyLimit(tasks, concurrencyLimit);

    // Programación funcional: reduce para agregar métricas
    const totals = results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.extracted += result.value.extracted;
        acc.loaded += result.value.loaded;
        acc.succeeded++;
      } else {
        acc.failed++;
      }
      return acc;
    }, { extracted: 0, loaded: 0, succeeded: 0, failed: 0 });

    console.log('[Orchestrator] Totales:', totals);
    return { results, totals };
  }

  /**
   * Ejecuta pipelines en SECUENCIA (imperativo — control de flujo explícito)
   */
  async runSequential() {
    const results = [];
    for (const pipeline of this.#pipelines) {
      try {
        const result = await pipeline.run();
        results.push({ status: 'fulfilled', value: result });
      } catch (err) {
        results.push({ status: 'rejected', reason: err });
      }
    }
    return results;
  }
}
