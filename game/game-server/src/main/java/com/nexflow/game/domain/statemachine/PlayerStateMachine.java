package com.nexflow.game.domain.statemachine;

import com.nexflow.game.domain.entity.Player;
import com.nexflow.game.domain.entity.PlayerState;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * STATE PATTERN — máquina de estados finita (FSM)
 *
 * Cada estado define qué transiciones son válidas.
 * Si se intenta una transición inválida → IllegalStateException.
 * Imperativo: mapa de transiciones definido explícitamente.
 *
 * Diagrama de estados:
 *
 *   IDLE ──startQuest──► IN_QUEST ──startBattle──► IN_BATTLE
 *    ▲                      │  ▲                      │
 *    │                      │  └──────abandon──────────┘
 *    │                 complete│
 *    │                      ▼  │
 *    └────────────── REVIEWING ◄─────────── abandonBattle
 *         leave                         failBattle
 */
public class PlayerStateMachine {

    // Tabla de transiciones: estado actual → estados a los que puede ir
    private static final Map<PlayerState, Set<PlayerState>> TRANSITIONS =
        new EnumMap<>(PlayerState.class);

    static {
        TRANSITIONS.put(PlayerState.IDLE, EnumSet.of(
            PlayerState.IN_QUEST, PlayerState.PAUSED));

        TRANSITIONS.put(PlayerState.IN_QUEST, EnumSet.of(
            PlayerState.IN_BATTLE, PlayerState.REVIEWING, PlayerState.IDLE));

        TRANSITIONS.put(PlayerState.IN_BATTLE, EnumSet.of(
            PlayerState.IN_QUEST, PlayerState.REVIEWING));

        TRANSITIONS.put(PlayerState.REVIEWING, EnumSet.of(
            PlayerState.IDLE));

        TRANSITIONS.put(PlayerState.PAUSED, EnumSet.of(
            PlayerState.IDLE, PlayerState.IN_QUEST));

        TRANSITIONS.put(PlayerState.BANNED, EnumSet.noneOf(PlayerState.class));
    }

    public static void transition(Player player, PlayerState nextState) {
        Set<PlayerState> allowed = TRANSITIONS.getOrDefault(
            player.getState(), EnumSet.noneOf(PlayerState.class));

        if (!allowed.contains(nextState)) {
            throw new IllegalStateException(
                "Transición inválida: %s → %s para jugador %s"
                    .formatted(player.getState(), nextState, player.getUsername()));
        }
        player.setState(nextState);
    }

    public static boolean canTransition(Player player, PlayerState nextState) {
        return TRANSITIONS.getOrDefault(player.getState(), Set.of()).contains(nextState);
    }
}
