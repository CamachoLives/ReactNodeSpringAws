package com.nexflow.game.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ABSTRACCIÓN + POLIMORFISMO:
 * Player es la clase base. HeroPlayer, GuildPlayer podrían extenderla (LSP).
 * El estado del jugador es una máquina de estados (ver PlayerState).
 *
 * PROGRAMACIÓN IMPERATIVA en los métodos de lógica de negocio:
 * bucles explícitos, condicionales, mutación controlada de estado.
 */
@Entity
@Table(name = "players")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlayerState state;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlayerClass playerClass;

    private int level;
    private long totalXp;
    private long currentXp;
    private int questsCompleted;
    private int streak;        // racha de días consecutivos
    private long totalScore;

    @ElementCollection
    @CollectionTable(name = "player_achievements")
    private Set<String> achievementIds = new HashSet<>();

    @Column(name = "last_active")
    private LocalDateTime lastActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActive = LocalDateTime.now();
        if (state == null) state = PlayerState.IDLE;
        if (level == 0) level = 1;
        if (playerClass == null) playerClass = PlayerClass.APPRENTICE;
    }

    // ─── Lógica de dominio (programación imperativa) ───

    /**
     * Gana XP y sube de nivel si corresponde.
     * Imperativo: condicional explícito, mutación de campos.
     */
    public List<String> gainXp(long amount) {
        List<String> events = new ArrayList<>();
        currentXp += amount;
        totalXp += amount;
        totalScore += amount / 10;

        // Bucle imperativo: puede subir múltiples niveles de una vez
        while (currentXp >= xpForNextLevel()) {
            currentXp -= xpForNextLevel();
            level++;
            events.add("LEVEL_UP:" + level);

            // Desbloquear clase al llegar a ciertos niveles
            if (level == 5)  { playerClass = PlayerClass.ENGINEER; events.add("CLASS_UP:ENGINEER"); }
            if (level == 15) { playerClass = PlayerClass.ARCHITECT; events.add("CLASS_UP:ARCHITECT"); }
            if (level == 30) { playerClass = PlayerClass.LEGEND; events.add("CLASS_UP:LEGEND"); }
        }

        lastActive = LocalDateTime.now();
        return events;
    }

    public void unlockAchievement(String achievementId) {
        achievementIds.add(achievementId);
    }

    public boolean hasAchievement(String achievementId) {
        return achievementIds.contains(achievementId);
    }

    public void incrementStreak() {
        streak++;
        if (streak % 7 == 0) gainXp(500L * streak); // bonus semanal
    }

    public void resetStreak() { streak = 0; }

    public long xpForNextLevel() {
        return 100L * level * level; // curva cuadrática: más difícil cada nivel
    }

    public int xpProgressPercent() {
        long required = xpForNextLevel();
        return required == 0 ? 100 : (int) (currentXp * 100 / required);
    }
}
