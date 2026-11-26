package com.nexflow.game.domain.service;

import com.nexflow.game.domain.entity.*;

/**
 * SRP: solo calcula XP, no persiste ni notifica.
 *
 * PROGRAMACIÓN FUNCIONAL en Java:
 * - Métodos estáticos sin estado
 * - Funciones puras: mismo input → mismo output
 * - Composición de cálculos con lambdas y métodos de referencia
 */
public final class XpCalculator {

    private XpCalculator() {} // utilidad pura — no se instancia

    /**
     * XP final con todos los multiplicadores aplicados.
     * Funcional: encadenamiento de transformaciones puras.
     */
    public static long calculate(long baseXp, Player player, QuestDifficulty difficulty,
                                  double accuracy, boolean streakBonus, boolean speedBonus) {
        return applyChain(baseXp,
            xp -> applyDifficultyMultiplier(xp, difficulty),
            xp -> applyAccuracyMultiplier(xp, accuracy),
            xp -> applyClassMultiplier(xp, player.getPlayerClass()),
            xp -> applyStreakBonus(xp, player.getStreak(), streakBonus),
            xp -> applySpeedBonus(xp, speedBonus),
            xp -> applyAchievementMultipliers(xp, player)
        );
    }

    // VARARGS de funciones — higher-order function (programación funcional)
    @SafeVarargs
    private static long applyChain(long value, java.util.function.LongUnaryOperator... fns) {
        long result = value;
        for (var fn : fns) result = fn.applyAsLong(result); // imperativo controlado
        return result;
    }

    private static long applyDifficultyMultiplier(long xp, QuestDifficulty d) {
        return (long) (xp * d.getXpMultiplier());
    }

    private static long applyAccuracyMultiplier(long xp, double accuracy) {
        // 100% accuracy → ×1.5 | 50% → ×1.0 | <50% → penalización
        double mult = accuracy >= 1.0 ? 1.5 : accuracy >= 0.5 ? accuracy + 0.5 : accuracy;
        return (long) (xp * mult);
    }

    private static long applyClassMultiplier(long xp, PlayerClass cls) {
        return (long) (xp * cls.getXpMultiplier());
    }

    private static long applyStreakBonus(long xp, int streak, boolean active) {
        if (!active || streak < 3) return xp;
        double bonus = Math.min(0.5, streak * 0.05); // máximo +50%
        return (long) (xp * (1 + bonus));
    }

    private static long applySpeedBonus(long xp, boolean completed) {
        return completed ? (long) (xp * 1.2) : xp; // +20% si completó antes del tiempo
    }

    private static long applyAchievementMultipliers(long xp, Player player) {
        // Funcional: stream sobre logros del jugador
        return (long) (xp * (1.0 + player.getAchievementIds().stream()
                .filter(id -> id.startsWith("XP_BOOST_"))
                .mapToDouble(id -> 0.1)
                .sum()));
    }
}
