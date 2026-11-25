/**
 * FACTORY + REGISTRY PATTERN
 * Registra y crea extractores por tipo de fuente.
 * OCP: agregar un nuevo tipo no modifica este archivo — solo se registra.
 */
export class ExtractorRegistry {
  #registry = new Map(); // encapsulación con campo privado ES2022

  register(sourceType, extractorFactory) {
    this.#registry.set(sourceType.toUpperCase(), extractorFactory);
    return this; // Builder-style chaining
  }

  create(sourceType) {
    const factory = this.#registry.get(sourceType.toUpperCase());
    if (!factory) {
      throw new Error(`Extractor no registrado para: ${sourceType}. Disponibles: ${[...this.#registry.keys()].join(', ')}`);
    }
    return factory();
  }

  getRegisteredTypes() {
    return [...this.#registry.keys()];
  }
}
