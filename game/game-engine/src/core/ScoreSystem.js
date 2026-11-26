/**
 * SISTEMA DE PUNTUACIÓN
 *
 * IMPERATIVO vs FUNCIONAL — mismo algoritmo, dos implementaciones.
 * Sirve como ejemplo didáctico de las diferencias entre paradigmas.
 */

import { GameSystem } from './GameEngine.js';

export class ScoreSystem extends GameSystem {
  #scores = new Map();  // playerId → { score, multiplier, combo }
  #engine = null;

  onRegister(engine) {
    this.#engine = engine;
    engine.on('quest:completed', (data) => this.processQuestScore(data));
    engine.on('player:combo', (data) => this.updateCombo(data));
  }

  // ─────────────────────────────────────────────
  // ESTILO IMPERATIVO — explícito, paso a paso
  // ─────────────────────────────────────────────
  processQuestScoreImperative(data) {
    const { playerId, baseScore, accuracy, timeBonus, difficulty } = data;

    // Paso 1: obtener estado actual
    let entry = this.#scores.get(playerId) || { score: 0, multiplier: 1.0, combo: 0 };

    // Paso 2: calcular puntuación base
    let score = baseScore;

    // Paso 3: aplicar multiplicador de dificultad
    if (difficulty === 'EASY')       score = score * 1.2;
    else if (difficulty === 'MEDIUM') score = score * 1.5;
    else if (difficulty === 'HARD')   score = score * 2.0;
    else if (difficulty === 'EPIC')   score = score * 3.0;

    // Paso 4: aplicar accuracy
    if (accuracy >= 1.0)       score = score * 1.5;
    else if (accuracy >= 0.8)  score = score * 1.2;
    else if (accuracy < 0.5)   score = score * 0.8;

    // Paso 5: aplicar bono de tiempo
    if (timeBonus) score = score * 1.2;

    // Paso 6: aplicar combo
    score = score * entry.multiplier;

    // Paso 7: incrementar combo
    entry.combo += 1;
    entry.multiplier = Math.min(3.0, 1.0 + entry.combo * 0.1);

    // Paso 8: actualizar total
    entry.score += Math.floor(score);
    this.#scores.set(playerId, entry);

    return Math.floor(score);
  }

  // ─────────────────────────────────────────────
  // ESTILO FUNCIONAL — composición de transformaciones puras
  // ─────────────────────────────────────────────
  processQuestScore(data) {
    const { playerId, baseScore, accuracy, timeBonus, difficulty } = data;
    const entry = this.#scores.get(playerId) || { score: 0, multiplier: 1.0, combo: 0 };

    const DIFFICULTY_MULT = { EASY: 1.2, MEDIUM: 1.5, HARD: 2.0, EPIC: 3.0, LEGENDARY: 5.0 };
    const accuracyMult = accuracy >= 1.0 ? 1.5 : accuracy >= 0.8 ? 1.2 : accuracy < 0.5 ? 0.8 : 1.0;

    // Pipeline funcional: cada función transforma el valor
    const finalScore = [
      s => s * (DIFFICULTY_MULT[difficulty] ?? 1.0),   // dificultad
      s => s * accuracyMult,                            // accuracy
      s => timeBonus ? s * 1.2 : s,                     // tiempo
      s => s * entry.multiplier,                        // combo
      Math.floor                                        // redondear
    ].reduce((score, fn) => fn(score), baseScore);

    // Estado nuevo (inmutable: spread operator)
    const nextEntry = {
      score: entry.score + finalScore,
      combo: entry.combo + 1,
      multiplier: Math.min(3.0, 1.0 + (entry.combo + 1) * 0.1)
    };
    this.#scores.set(playerId, nextEntry);

    this.#engine?.emit('score:updated', { playerId, delta: finalScore, total: nextEntry.score });
    return finalScore;
  }

  updateCombo({ playerId, reset }) {
    const entry = this.#scores.get(playerId);
    if (!entry) return;
    this.#scores.set(playerId, reset
      ? { ...entry, combo: 0, multiplier: 1.0 }
      : { ...entry, combo: entry.combo + 1, multiplier: Math.min(3.0, entry.multiplier + 0.1) }
    );
  }

  getScore(playerId) { return this.#scores.get(playerId)?.score ?? 0; }

  getLeaderboard(limit = 10) {
    return [...this.#scores.entries()]
      .map(([id, data]) => ({ playerId: id, ...data }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
