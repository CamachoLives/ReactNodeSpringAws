/**
 * MÓNADA Maybe — manejo seguro de valores nulos
 *
 * Concepto de programación funcional avanzado.
 * Elimina null checks explícitos mediante encadenamiento.
 *
 * En el juego: buscar datos del jugador que pueden no existir.
 */
export class Maybe {
  #value;

  constructor(value) { this.#value = value; }

  static of(value) { return new Maybe(value); }
  static empty() { return new Maybe(null); }

  isNothing() { return this.#value == null; }

  // map: transforma el valor si existe (como Array.map pero para uno)
  map(fn) {
    return this.isNothing() ? Maybe.empty() : Maybe.of(fn(this.#value));
  }

  // flatMap/chain: para funciones que retornan Maybe (evita Maybe<Maybe<T>>)
  flatMap(fn) {
    return this.isNothing() ? Maybe.empty() : fn(this.#value);
  }

  // filter: descarta el valor si no cumple la condición
  filter(predicate) {
    return this.isNothing() || !predicate(this.#value) ? Maybe.empty() : this;
  }

  // getOrElse: extrae el valor o usa el default
  getOrElse(defaultValue) {
    return this.isNothing() ? defaultValue : this.#value;
  }

  // fold: maneja ambos casos (nulo / con valor) — como pattern matching
  fold(onNothing, onValue) {
    return this.isNothing() ? onNothing() : onValue(this.#value);
  }

  toString() { return this.isNothing() ? 'Maybe.empty()' : `Maybe(${this.#value})`; }
}

// Uso en el juego:
// Maybe.of(players.get(playerId))
//   .filter(p => p.state === 'ACTIVE')
//   .map(p => p.score)
//   .getOrElse(0)
