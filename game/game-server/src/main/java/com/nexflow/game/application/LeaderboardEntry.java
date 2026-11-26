package com.nexflow.game.application;

import com.nexflow.game.domain.entity.PlayerClass;

public record LeaderboardEntry(
    String username,
    long totalScore,
    int level,
    PlayerClass playerClass
) {}
