/**
 * LOAD — fase 3 del ETL
 *
 * CHAIN OF RESPONSIBILITY: cada loader decide si puede manejar el destino.
 * TEMPLATE METHOD: loadBatch() define el esqueleto; subclases implementan pasos.
 * Programación IMPERATIVA: bucles explícitos, control de flujo detallado.
 */

// Puerto de salida (Hexagonal)
export class DataLoader {
  canHandle(destination) { return false; }
  async load(records, config) { throw new Error('No implementado'); }
  getLoaderType() { throw new Error('No implementado'); }
}

// ─────────────────────────────────────────────
// TEMPLATE METHOD: esqueleto de carga en batch
// ─────────────────────────────────────────────
export class BatchLoader extends DataLoader {
  constructor({ batchSize = 100 } = {}) {
    super();
    this.batchSize = batchSize;
  }

  /** Template Method — define el algoritmo; subclases implementan loadBatch() */
  async load(records, config) {
    const batches = this.#splitIntoBatches(records, this.batchSize);
    const results = { loaded: 0, failed: 0, batches: 0 };

    // Programación IMPERATIVA: control explícito de flujo y estado
    for (const batch of batches) {
      try {
        const count = await this.loadBatch(batch, config);
        results.loaded += count;
        results.batches++;
      } catch (err) {
        results.failed += batch.length;
        console.error(`[Batch ${results.batches}] Error: ${err.message}`);
      }
    }

    return results;
  }

  // Método abstracto — LSP: cada subclase implementa con misma firma
  async loadBatch(batch, config) {
    throw new Error('loadBatch() debe ser implementado');
  }

  #splitIntoBatches(records, size) {
    const batches = [];
    for (let i = 0; i < records.length; i += size) {
      batches.push(records.slice(i, i + size));
    }
    return batches;
  }
}

// ─────────────────────────────────────────────
// Implementación: Loader a PostgreSQL
// ─────────────────────────────────────────────
export class PostgresLoader extends BatchLoader {
  constructor(dbPool, options) {
    super(options);
    this.db = dbPool;
  }

  canHandle(destination) { return destination === 'DATABASE'; }
  getLoaderType() { return 'POSTGRES'; }

  async loadBatch(batch, { tableName, columns }) {
    // INSERT batch con parámetros ($1, $2, ...) — previene SQL injection
    const placeholders = batch.map((_, i) =>
      `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
    ).join(', ');

    const values = batch.flatMap(record => columns.map(col => record[col]));
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}
                   ON CONFLICT DO NOTHING`;

    await this.db.query(query, values);
    return batch.length;
  }
}

// ─────────────────────────────────────────────
// Implementación: Loader a AWS S3 (JSONL)
// ─────────────────────────────────────────────
export class S3Loader extends BatchLoader {
  constructor(s3Client, options) {
    super(options);
    this.s3Client = s3Client;
  }

  canHandle(destination) { return destination === 'S3_BUCKET'; }
  getLoaderType() { return 'S3'; }

  async loadBatch(batch, { bucket, keyPrefix }) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`;

    // JSONL: un JSON por línea — eficiente para Athena/Redshift
    const body = batch.map(r => JSON.stringify(r)).join('\n');

    await this.s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/x-ndjson'
    }));

    return batch.length;
  }
}

// ─────────────────────────────────────────────
// CHAIN OF RESPONSIBILITY: router de loaders
// ─────────────────────────────────────────────
export class LoaderChain {
  #loaders = [];

  addLoader(loader) {
    this.#loaders.push(loader);
    return this;
  }

  async route(records, destination, config) {
    for (const loader of this.#loaders) {
      if (loader.canHandle(destination)) {
        return loader.load(records, config);
      }
    }
    throw new Error(`Ningún loader puede manejar destino: ${destination}`);
  }
}
