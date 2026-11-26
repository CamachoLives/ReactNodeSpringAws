/**
 * ETL DE ANALYTICS DEL JUEGO
 *
 * Une los conceptos de los dos módulos: NexFlow ETL + DevQuest Game.
 * Extrae métricas del juego, las transforma y las carga en S3 para análisis.
 *
 * PATRÓN BUILDER para construir el pipeline de analytics.
 * PROGRAMACIÓN FUNCIONAL: transformaciones como funciones puras.
 * ETL completo aplicado a datos reales del juego.
 */

import { createDefaultPipeline } from '../../node-etl/src/transform/transformers.js';

// BUILDER PATTERN — construye el pipeline de analytics paso a paso
export class AnalyticsPipelineBuilder {
  #source = null;
  #filters = [];
  #aggregations = [];
  #destination = null;

  fromGameEvents(eventStore) {
    this.#source = eventStore;
    return this;
  }

  filterByDateRange(from, to) {
    this.#filters.push(events => events.filter(e => {
      const ts = new Date(e.timestamp);
      return ts >= from && ts <= to;
    }));
    return this;
  }

  filterByEventType(...types) {
    this.#filters.push(events => events.filter(e => types.includes(e.type)));
    return this;
  }

  aggregateQuestCompletions() {
    this.#aggregations.push(events => {
      // Programación funcional: reduce para agregar métricas
      return events
        .filter(e => e.type === 'QUEST_COMPLETED')
        .reduce((acc, e) => {
          const key = e.questId;
          if (!acc[key]) acc[key] = { questId: key, completions: 0, totalXp: 0, avgAccuracy: 0 };
          acc[key].completions++;
          acc[key].totalXp += e.xpEarned;
          acc[key].avgAccuracy = (acc[key].avgAccuracy * (acc[key].completions - 1) + e.accuracy) / acc[key].completions;
          return acc;
        }, {});
    });
    return this;
  }

  aggregatePlayerProgress() {
    this.#aggregations.push(events =>
      events
        .filter(e => e.type === 'LEVEL_UP')
        .reduce((acc, e) => {
          if (!acc[e.playerId]) acc[e.playerId] = { playerId: e.playerId, maxLevel: 0, levelUps: 0 };
          acc[e.playerId].levelUps++;
          acc[e.playerId].maxLevel = Math.max(acc[e.playerId].maxLevel, e.newLevel);
          return acc;
        }, {})
    );
    return this;
  }

  toS3(bucket, keyPrefix) {
    this.#destination = { type: 'S3', bucket, keyPrefix };
    return this;
  }

  build() {
    return new AnalyticsPipeline(this.#source, this.#filters, this.#aggregations, this.#destination);
  }
}

export class AnalyticsPipeline {
  constructor(source, filters, aggregations, destination) {
    this.source = source;
    this.filters = filters;
    this.aggregations = aggregations;
    this.destination = destination;
  }

  async run() {
    console.log('[Analytics ETL] Iniciando pipeline...');

    // EXTRACT
    const rawEvents = await this.source.getEvents();
    console.log(`[Analytics ETL] Extraídos ${rawEvents.length} eventos`);

    // TRANSFORM — aplicar filters y aggregations como pipeline funcional
    const filtered = this.filters.reduce((events, filter) => filter(events), rawEvents);
    const aggregated = this.aggregations.map(agg => agg(filtered));

    // Usar el pipeline de transformación de NexFlow ETL
    const transformPipeline = createDefaultPipeline(['questId'], {});
    const records = Object.values(aggregated[0] ?? {});
    const transformed = transformPipeline.applyAndFilter(
      records.map(r => ({ payload: JSON.stringify(r) }))
    );

    console.log(`[Analytics ETL] ${transformed.length} registros transformados`);

    // LOAD — simulado (en prod usaría S3Loader de NexFlow ETL)
    const result = {
      destination: this.destination,
      records: transformed.length,
      timestamp: new Date().toISOString()
    };

    console.log('[Analytics ETL] Completado:', result);
    return result;
  }
}

// Uso del Builder:
// const pipeline = new AnalyticsPipelineBuilder()
//   .fromGameEvents(eventStore)
//   .filterByDateRange(yesterday, today)
//   .filterByEventType('QUEST_COMPLETED', 'LEVEL_UP')
//   .aggregateQuestCompletions()
//   .toS3('nexquest-analytics', 'daily/')
//   .build();
// await pipeline.run();
