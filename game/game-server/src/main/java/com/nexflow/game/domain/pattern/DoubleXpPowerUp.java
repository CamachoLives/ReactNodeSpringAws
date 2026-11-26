package com.nexflow.game.domain.pattern;

import com.nexflow.game.domain.entity.Player;
import com.nexflow.game.domain.entity.QuestResult;

/**
 * Decorator concreto: duplica el XP ganado.
 * No modifica Player ni QuestResult directamente — crea un nuevo QuestResult.
 */
public class DoubleXpPowerUp implements PowerUp {

    @Override
    public QuestResult apply(Player player, QuestResult original) {
        return new QuestResult(
            original.success(),
            original.message() + " [2× XP activo]",
            original.xpEarned() * 2,       // ← decoración: duplica XP
            original.scoreEarned(),
            original.accuracy(),
            original.efficiency(),
            original.bonusEarned()
        );
    }

    @Override public String getName() { return "2× XP"; }
    @Override public String getDescription() { return "Duplica el XP ganado en esta quest"; }
}
