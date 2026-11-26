package com.nexflow.game.application;

import com.nexflow.game.domain.entity.*;
import com.nexflow.game.domain.pattern.*;
import com.nexflow.game.domain.service.*;
import com.nexflow.game.domain.statemachine.PlayerStateMachine;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Orquestador principal del juego.
 * SRP: solo coordina el flujo — no calcula XP, no evalúa logros, no persiste.
 * Cada colaborador tiene su responsabilidad específica.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class GameService {

    private final PlayerRepository playerRepository;
    private final QuestRepository questRepository;
    private final AchievementEvaluator achievementEvaluator;
    private final SimpMessagingTemplate ws; // WebSocket — tiempo real

    /**
     * Flujo completo de completar una quest:
     * 1. Validar estado del jugador (State Machine)
     * 2. Evaluar la solución (Template Method en Quest)
     * 3. Aplicar power-ups (Decorator Chain)
     * 4. Calcular XP (funciones puras)
     * 5. Actualizar jugador (imperativo)
     * 6. Evaluar logros (Specification pattern)
     * 7. Notificar en tiempo real (WebSocket)
     */
    public QuestCompletionResult completeQuest(UUID playerId, UUID questId,
                                                PlayerSolution solution, PowerUpChain powerUps) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado"));
        Quest quest = questRepository.findById(questId)
                .orElseThrow(() -> new RuntimeException("Quest no encontrada"));

        // 1. Validar transición de estado
        PlayerStateMachine.transition(player, PlayerState.REVIEWING);

        // 2. Evaluar solución (Template Method)
        QuestResult baseResult = quest.evaluate(solution);
        if (!baseResult.success()) {
            PlayerStateMachine.transition(player, PlayerState.IDLE);
            return QuestCompletionResult.failed(baseResult.message());
        }

        // 3. Aplicar power-ups (Decorator)
        QuestResult finalResult = powerUps != null && powerUps.size() > 0
                ? powerUps.apply(player, baseResult)
                : baseResult;

        // 4 + 5. Calcular XP y actualizar jugador (imperativo + funcional)
        long xp = XpCalculator.calculate(
            finalResult.xpEarned(), player, quest.getDifficulty(),
            finalResult.accuracy(), player.getStreak() > 0, finalResult.bonusEarned()
        );
        List<String> levelUpEvents = player.gainXp(xp);
        player.setQuestsCompleted(player.getQuestsCompleted() + 1);
        player.incrementStreak();

        // 6. Evaluar logros
        List<String> newAchievements = achievementEvaluator.evaluate(player, finalResult);
        newAchievements.forEach(player::unlockAchievement);

        // 7. Volver a IDLE
        PlayerStateMachine.transition(player, PlayerState.IDLE);
        playerRepository.save(player);

        // 8. Notificar en tiempo real via WebSocket
        var completion = new QuestCompletionResult(true, xp, finalResult, levelUpEvents, newAchievements);
        ws.convertAndSendToUser(player.getUsername(), "/queue/quest-result", completion);

        // Actualizar leaderboard para todos
        ws.convertAndSend("/topic/leaderboard-update",
            new LeaderboardEntry(player.getUsername(), player.getTotalScore(),
                player.getLevel(), player.getPlayerClass()));

        return completion;
    }
}
