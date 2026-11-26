package com.nexflow.game.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/**
 * DECORATOR PATTERN: los logros "decoran" al jugador con capacidades extra.
 * Un logro puede desbloquear multiplicadores, acceso a quests épicas, etc.
 */
@Entity
@Table(name = "achievements")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    private String id; // ej: "SOLID_MASTER", "FIRST_QUEST", "SPEED_DEMON"

    private String title;
    private String description;
    private String icon;
    private long xpBonus;

    @Enumerated(EnumType.STRING)
    private AchievementRarity rarity;

    private double xpMultiplierBonus; // 0.1 = +10% XP permanente
    private boolean hidden; // se revela solo al desbloquear

    @Enumerated(EnumType.STRING)
    private ConceptCategory relatedConcept;
}
