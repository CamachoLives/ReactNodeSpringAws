package com.nexflow.game.domain.pattern;

import com.nexflow.game.domain.entity.Player;
import com.nexflow.game.domain.entity.QuestResult;

/**
 * Decorator concreto: eleva la accuracy al 80% mínimo si fue menor.
 * Permite al jugador "protegerse" de errores en quests difíciles.
 */
public class AccuracyShieldPowerUp implements PowerUp {

    private static final double MIN_ACCURACY = 0.80;

    @Override
    public QuestResult apply(Player player, QuestResult original) {
        if (!original.success()) return original;

        double boostedAccuracy = Math.max(original.accuracy(), MIN_ACCURACY);
        // recalcula XP con la accuracy mejorada (funcional: sin mutar original)
        long boostedXp = (long) (original.xpEarned() * (boostedAccuracy / Math.max(original.accuracy(), 0.01)));

        return new QuestResult(
            true,
            original.message() + " [Escudo de Accuracy activo]",
            boostedXp,
            original.scoreEarned(),
            boostedAccuracy,
            original.efficiency(),
            original.bonusEarned()
        );
    }

    @Override public String getName() { return "Escudo de Accuracy"; }
    @Override public String getDescription() { return "Garantiza accuracy mínima del 80%"; }
}
