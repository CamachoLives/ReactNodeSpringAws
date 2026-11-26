package com.nexflow.game.domain.entity;

/**
 * Estados posibles del jugador — usados por la máquina de estados.
 * STATE PATTERN: cada estado define qué transiciones son válidas.
 */
public enum PlayerState {
    IDLE,        // en el lobby, sin quest activa
    IN_QUEST,    // completando una misión
    IN_BATTLE,   // en un desafío de código (mini-game)
    PAUSED,      // pausa voluntaria
    REVIEWING,   // revisando resultados de quest completada
    BANNED       // estado terminal
}
