package com.nexflow.game.domain.pattern;

import com.nexflow.game.domain.entity.Player;
import com.nexflow.game.domain.entity.QuestResult;

/**
 * DECORATOR PATTERN — Power-ups modifican el resultado de una quest
 * sin alterar la clase Player ni QuestResult.
 *
 * Interfaz base del decorador.
 * LSP: cualquier PowerUp puede sustituir a otro sin romper el contrato.
 */
public interface PowerUp {
    QuestResult apply(Player player, QuestResult original);
    String getName();
    String getDescription();
}
