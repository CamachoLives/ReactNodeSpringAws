package com.nexflow.game.application;

import com.nexflow.game.domain.entity.QuestResult;
import java.util.List;

public record QuestCompletionResult(
    boolean success,
    long xpEarned,
    QuestResult questResult,
    List<String> levelUpEvents,
    List<String> newAchievements
) {
    public static QuestCompletionResult failed(String reason) {
        return new QuestCompletionResult(false, 0,
            QuestResult.invalid(reason), List.of(), List.of());
    }
}
