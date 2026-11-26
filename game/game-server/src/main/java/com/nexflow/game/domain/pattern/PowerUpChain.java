package com.nexflow.game.domain.pattern;

import com.nexflow.game.domain.entity.Player;
import com.nexflow.game.domain.entity.QuestResult;

import java.util.ArrayList;
import java.util.List;

/**
 * Encadena múltiples decoradores en secuencia.
 * COMPOSITE + DECORATOR: una cadena actúa como un solo PowerUp.
 *
 * Funcional: reduce() aplica cada power-up sobre el resultado anterior.
 */
public class PowerUpChain implements PowerUp {

    private final List<PowerUp> chain = new ArrayList<>();

    public PowerUpChain add(PowerUp powerUp) {
        chain.add(powerUp);
        return this; // fluent API
    }

    @Override
    public QuestResult apply(Player player, QuestResult original) {
        // Programación funcional: reduce acumula transformaciones
        return chain.stream()
                .reduce(
                    original,                                           // valor inicial
                    (result, powerUp) -> powerUp.apply(player, result), // acumulador
                    (r1, r2) -> r2                                       // combinador (no usado en secuencial)
                );
    }

    @Override
    public String getName() {
        return chain.stream().map(PowerUp::getName)
                .reduce((a, b) -> a + " + " + b).orElse("Sin power-ups");
    }

    @Override
    public String getDescription() { return "Cadena de " + chain.size() + " power-ups"; }

    public int size() { return chain.size(); }
}
