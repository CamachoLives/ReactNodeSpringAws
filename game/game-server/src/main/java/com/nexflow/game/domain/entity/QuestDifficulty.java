package com.nexflow.game.domain.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QuestDifficulty {
    TUTORIAL(1, "Tutorial",   1.0),
    EASY(2,     "Fácil",      1.2),
    MEDIUM(3,   "Medio",      1.5),
    HARD(4,     "Difícil",    2.0),
    EPIC(5,     "Épico",      3.0),
    LEGENDARY(6,"Legendario", 5.0);

    private final int tier;
    private final String label;
    private final double xpMultiplier;
}
