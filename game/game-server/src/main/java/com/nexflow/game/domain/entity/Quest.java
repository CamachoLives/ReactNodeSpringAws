package com.nexflow.game.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Duration;
import java.util.UUID;

/**
 * CLASE ABSTRACTA — Template Method Pattern:
 * Quest define el esqueleto del algoritmo de completar una misión.
 * Las subclases (CodingQuest, DesignQuest, etc.) implementan los pasos.
 *
 * OCP: agregar un nuevo tipo de quest no modifica Quest.
 */
@Entity
@Table(name = "quests")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "quest_type")
public abstract class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private QuestDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    private ConceptCategory conceptCategory;

    private long baseXpReward;
    private long baseScoreReward;
    private int timeLimitMinutes;
    private boolean active;
    private int orderIndex;

    // TEMPLATE METHOD: define el algoritmo; subclases implementan pasos abstractos
    public final QuestResult evaluate(PlayerSolution solution) {
        if (!isValidSolution(solution)) {
            return QuestResult.invalid("Solución inválida");
        }

        double accuracy = calculateAccuracy(solution);
        double efficiency = calculateEfficiency(solution);
        boolean bonusConditionMet = checkBonusCondition(solution);

        double multiplier = (accuracy * 0.6) + (efficiency * 0.4);
        if (bonusConditionMet) multiplier *= 1.25;

        long xp = (long) (baseXpReward * multiplier);
        long score = (long) (baseScoreReward * multiplier);

        return QuestResult.success(xp, score, accuracy, efficiency, bonusConditionMet);
    }

    // Métodos abstractos — LSP: cada subclase debe poder sustituir a Quest
    protected abstract boolean isValidSolution(PlayerSolution solution);
    protected abstract double calculateAccuracy(PlayerSolution solution);
    protected abstract double calculateEfficiency(PlayerSolution solution);
    protected abstract boolean checkBonusCondition(PlayerSolution solution);
    public abstract String getQuestType();
}
