package com.nexflow.game.domain.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AchievementRarity {
    COMMON("Común",     "#9ca3af"),
    RARE("Raro",        "#3b82f6"),
    EPIC("Épico",       "#a855f7"),
    LEGENDARY("Legendario", "#f59e0b");

    private final String label;
    private final String color;
}
