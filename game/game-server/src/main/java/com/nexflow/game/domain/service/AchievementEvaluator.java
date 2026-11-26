package com.nexflow.game.domain.service;

import com.nexflow.game.domain.entity.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BiPredicate;

/**
 * SPECIFICATION PATTERN — cada logro tiene una condición evaluable.
 * Programación funcional: condiciones como funciones/lambdas (BiPredicate).
 * OCP: agregar logros no modifica este evaluador.
 */
@Component
public class AchievementEvaluator {

    /**
     * Registro de condiciones — cada par es (achievementId, condición).
     * La condición es un BiPredicate funcional: (Player, QuestResult) → boolean.
     */
    private final List<AchievementCondition> conditions = List.of(
        new AchievementCondition("FIRST_QUEST",
            (p, r) -> p.getQuestsCompleted() == 1),

        new AchievementCondition("PERFECT_SCORE",
            (p, r) -> r.accuracy() >= 1.0 && r.efficiency() >= 1.0),

        new AchievementCondition("SPEED_DEMON",
            (p, r) -> r.bonusEarned()),

        new AchievementCondition("LEVEL_5",
            (p, r) -> p.getLevel() >= 5),

        new AchievementCondition("LEVEL_15",
            (p, r) -> p.getLevel() >= 15),

        new AchievementCondition("STREAK_7",
            (p, r) -> p.getStreak() >= 7),

        new AchievementCondition("STREAK_30",
            (p, r) -> p.getStreak() >= 30),

        new AchievementCondition("XP_BOOST_10",
            (p, r) -> p.getTotalXp() >= 10_000),

        new AchievementCondition("SOLID_MASTER",
            (p, r) -> p.getQuestsCompleted() >= 5
                && p.hasAchievement("FIRST_QUEST")),

        new AchievementCondition("LEGEND_STATUS",
            (p, r) -> p.getPlayerClass() == PlayerClass.LEGEND)
    );

    /**
     * Evalúa todos los logros y retorna los recién desbloqueados.
     * Funcional: filter + map sobre la lista de condiciones.
     */
    public List<String> evaluate(Player player, QuestResult result) {
        return conditions.stream()
                .filter(cond -> !player.hasAchievement(cond.id()))        // no tiene el logro aún
                .filter(cond -> cond.condition().test(player, result))     // cumple la condición
                .map(AchievementCondition::id)
                .toList();
    }

    private record AchievementCondition(
        String id,
        BiPredicate<Player, QuestResult> condition
    ) {}
}
