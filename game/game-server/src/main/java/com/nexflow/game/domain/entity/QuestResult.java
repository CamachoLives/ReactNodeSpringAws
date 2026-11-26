package com.nexflow.game.domain.entity;

public record QuestResult(
    boolean success,
    String message,
    long xpEarned,
    long scoreEarned,
    double accuracy,
    double efficiency,
    boolean bonusEarned
) {
    public static QuestResult success(long xp, long score, double acc, double eff, boolean bonus) {
        return new QuestResult(true, "Quest completada", xp, score, acc, eff, bonus);
    }

    public static QuestResult invalid(String reason) {
        return new QuestResult(false, reason, 0, 0, 0, 0, false);
    }
}
