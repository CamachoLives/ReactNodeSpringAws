/**
 * TRANSFORM — fase 2 del ETL
 *
 * Programación FUNCIONAL pura:
 * - Funciones sin estado (stateless)
 * - Inmutabilidad: cada función retorna nuevos objetos
 * - Composición de funciones: pipe() encadena transformaciones
 * - Currying: algunas funciones retornan funciones configuradas
 * - Higher-order functions: map, filter, reduce, flatMap
 */

// ─────────────────────────────────────────────
// Utilidades funcionales
// ─────────────────────────────────────────────

/**
 * PIPE — composición de funciones (programación funcional)
 * pipe(f, g, h)(x) === h(g(f(x)))
 */
export const pipe = (...fns) => (value) =>
  fns.reduce((acc, fn) => fn(acc), value);

/**
 * COMPOSE — composición derecha a izquierda
 * compose(f, g, h)(x) === f(g(h(x)))
 */
export const compose = (...fns) => (value) =>
  fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * CURRY — convierte f(a, b) en f(a)(b)
 */
export const curry = (fn) => (...args) =>
  args.length >= fn.length ? fn(...args) : curry(fn.bind(null, ...args));

// ─────────────────────────────────────────────
// Transformaciones puras (sin efectos secundarios)
// ─────────────────────────────────────────────

/** Normaliza claves de un objeto a camelCase */
export const normalizKeys = (record) =>
  Object.fromEntries(
    Object.entries(record).map(([k, v]) => [
      k.trim().toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v
    ])
  );

/** Elimina campos nulos o undefined */
export const removeNullish = (record) =>
  Object.fromEntries(
    Object.entries(record).filter(([, v]) => v != null && v !== '')
  );

/** Agrega timestamp de procesamiento (currieado) */
export const addTimestamp = curry((fieldName, record) => ({
  ...record,
  [fieldName]: new Date().toISOString()
}));

/** Trunca strings largos (currieado) */
export const truncateStrings = curry((maxLength, record) =>
  Object.fromEntries(
    Object.entries(record).map(([k, v]) => [
      k,
      typeof v === 'string' && v.length > maxLength
        ? v.slice(0, maxLength) + '...'
        : v
    ])
  )
);

/** Convierte todos los strings a minúsculas */
export const lowercaseStrings = (record) =>
  Object.fromEntries(
    Object.entries(record).map(([k, v]) => [
      k,
      typeof v === 'string' ? v.toLowerCase().trim() : v
    ])
  );

/** Valida que los campos requeridos existan */
export const validateRequired = curry((requiredFields, record) => {
  const missing = requiredFields.filter(f => !(f in record) || record[f] == null);
  return {
    ...record,
    _valid: missing.length === 0,
    _errors: missing.length > 0 ? [`Campos faltantes: ${missing.join(', ')}`] : []
  };
});

/** Mapeo de tipos de dato */
export const castTypes = curry((schema, record) =>
  Object.fromEntries(
    Object.entries(record).map(([k, v]) => {
      const type = schema[k];
      if (!type) return [k, v];
      switch (type) {
        case 'number': return [k, Number(v)];
        case 'boolean': return [k, Boolean(v)];
        case 'date': return [k, new Date(v).toISOString()];
        default: return [k, String(v)];
      }
    })
  )
);

// ─────────────────────────────────────────────
// PIPELINE DE TRANSFORMACIÓN (compose + pipe)
// ─────────────────────────────────────────────

/**
 * Crea un pipeline de transformación configurado.
 * Patrón Builder + Funcional.
 */
export class TransformPipeline {
  #steps = [];

  addStep(fn, name = fn.name || 'anon') {
    this.#steps.push({ fn, name });
    return this; // fluent API
  }

  /**
   * Aplica todas las transformaciones a UN registro.
   * Imperativa: bucle explícito para manejo de errores por paso.
   */
  applyToRecord(record) {
    return this.#steps.reduce((acc, { fn, name }) => {
      try {
        return fn(acc);
      } catch (err) {
        return { ...acc, _valid: false, _errors: [...(acc._errors || []), `${name}: ${err.message}`] };
      }
    }, record);
  }

  /**
   * Aplica a una lista de registros usando map (funcional).
   */
  applyToAll(records) {
    return records.map(r => this.applyToRecord(r));
  }

  /**
   * Solo registros válidos tras la transformación (filter funcional).
   */
  applyAndFilter(records) {
    return this.applyToAll(records).filter(r => r._valid !== false);
  }
}

// Pipeline preconfigurado para NexFlow
export const createDefaultPipeline = (requiredFields = [], typeSchema = {}) =>
  new TransformPipeline()
    .addStep(normalizKeys, 'normalizKeys')
    .addStep(removeNullish, 'removeNullish')
    .addStep(truncateStrings(5000), 'truncateStrings')
    .addStep(castTypes(typeSchema), 'castTypes')
    .addStep(validateRequired(requiredFields), 'validateRequired')
    .addStep(addTimestamp('processedAt'), 'addTimestamp');
