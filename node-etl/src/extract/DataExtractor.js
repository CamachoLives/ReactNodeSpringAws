/**
 * EXTRACT — fase 1 del ETL
 *
 * Hexagonal Architecture (Ports & Adapters):
 *   Puerto: DataExtractor define el contrato
 *   Adapters: RestExtractor, S3Extractor, DbExtractor, CsvExtractor
 *
 * Polimorfismo: cada extractor implementa el mismo "puerto" con comportamiento distinto.
 */

// Puerto (interfaz implícita en JS — duck typing)
export class DataExtractor {
  async extract(config) {
    throw new Error('extract() debe ser implementado por subclases — Template Method pattern');
  }

  getSourceType() {
    throw new Error('getSourceType() no implementado');
  }
}

// ─────────────────────────────────────────────
// Adapter 1: REST API
// ─────────────────────────────────────────────
export class RestExtractor extends DataExtractor {
  constructor(httpClient = fetch) {
    super();
    this.httpClient = httpClient; // DIP: inyección de dependencia
  }

  async extract({ url, headers = {}, params = {} }) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await this.httpClient(fullUrl, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status} desde ${url}`);

    const data = await response.json();
    // Funcional: normalizar a array siempre
    return Array.isArray(data) ? data : [data];
  }

  getSourceType() { return 'REST_API'; }
}

// ─────────────────────────────────────────────
// Adapter 2: AWS S3
// ─────────────────────────────────────────────
export class S3Extractor extends DataExtractor {
  constructor(s3Client) {
    super();
    this.s3Client = s3Client;
  }

  async extract({ bucket, key }) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.s3Client.send(command);

    const content = await response.Body.transformToString();
    return JSON.parse(content);
  }

  getSourceType() { return 'S3_BUCKET'; }
}

// ─────────────────────────────────────────────
// Adapter 3: PostgreSQL Database
// ─────────────────────────────────────────────
export class DbExtractor extends DataExtractor {
  constructor(dbPool) {
    super();
    this.db = dbPool;
  }

  async extract({ query, params = [] }) {
    const { rows } = await this.db.query(query, params);
    return rows;
  }

  getSourceType() { return 'DATABASE'; }
}

// ─────────────────────────────────────────────
// Adapter 4: CSV File
// ─────────────────────────────────────────────
export class CsvExtractor extends DataExtractor {
  async extract({ filePath, delimiter = ',' }) {
    const { createReadStream } = await import('fs');
    const { parse } = await import('csv-parse');

    return new Promise((resolve, reject) => {
      const records = [];
      createReadStream(filePath)
        .pipe(parse({ delimiter, columns: true, skip_empty_lines: true }))
        .on('data', record => records.push(record))
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  getSourceType() { return 'CSV_FILE'; }
}
