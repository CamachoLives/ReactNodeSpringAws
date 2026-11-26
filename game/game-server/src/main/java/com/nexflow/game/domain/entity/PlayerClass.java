package com.nexflow.game.domain.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Clase del jugador — POLIMORFISMO DE DATOS.
 * Cada clase tiene multiplicadores distintos de XP y score.
 */
@Getter
@RequiredArgsConstructor
public enum PlayerClass {
    APPRENTICE("Aprendiz",    1.0, 1.0,  "⚡"),
    ENGINEER("Ingeniero",     1.2, 1.3,  "🔧"),
    ARCHITECT("Arquitecto",   1.5, 1.6,  "🏛️"),
    LEGEND("Leyenda",         2.0, 2.5,  "🌟");

    private final String displayName;
    private final double xpMultiplier;
    private final double scoreMultiplier;
    private final String icon;
}
