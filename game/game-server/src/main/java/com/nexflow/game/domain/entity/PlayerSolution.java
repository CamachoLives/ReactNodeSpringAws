package com.nexflow.game.domain.entity;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

public record PlayerSolution(
    UUID playerId,
    UUID questId,
    String code,
    String language,
    Duration timeTaken,
    Map<String, Object> metadata // datos específicos por tipo de quest
) {}
