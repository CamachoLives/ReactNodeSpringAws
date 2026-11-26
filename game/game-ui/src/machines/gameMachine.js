/**
 * XSTATE — Máquina de estados finita para el flujo del juego en React
 *
 * El UI del juego tiene estados bien definidos.
 * XState hace esos estados explícitos y predecibles.
 *
 * Estados del juego:
 *
 *   idle ──selectQuest──► quest_detail ──startQuest──► playing
 *    ▲                          │                         │
 *    │                     ◄───abandon           complete/fail
 *    │                                                    ▼
 *    └───────────────────── result ◄──────────────────────
 *                               │
 *                          back_to_lobby
 *
 * Patrón: State Machine (igual que PlayerStateMachine en Spring)
 * pero declarativo con XState en lugar de imperativo.
 */

// XState v5 — sin librería adicional en este archivo (versión simplificada didáctica)
// En producción: import { createMachine, assign } from 'xstate';

export const GAME_STATES = {
  IDLE: 'idle',
  QUEST_DETAIL: 'quest_detail',
  PLAYING: 'playing',
  EVALUATING: 'evaluating',
  RESULT: 'result',
  LEADERBOARD: 'leaderboard',
  ERROR: 'error'
};

export const GAME_EVENTS = {
  SELECT_QUEST: 'SELECT_QUEST',
  START_QUEST: 'START_QUEST',
  ABANDON: 'ABANDON',
  SUBMIT_SOLUTION: 'SUBMIT_SOLUTION',
  EVALUATION_COMPLETE: 'EVALUATION_COMPLETE',
  BACK_TO_LOBBY: 'BACK_TO_LOBBY',
  VIEW_LEADERBOARD: 'VIEW_LEADERBOARD',
  ERROR: 'ERROR',
  RETRY: 'RETRY'
};

// Tabla de transiciones (mismo concepto que PlayerStateMachine en Java)
const TRANSITIONS = {
  [GAME_STATES.IDLE]: {
    [GAME_EVENTS.SELECT_QUEST]: GAME_STATES.QUEST_DETAIL,
    [GAME_EVENTS.VIEW_LEADERBOARD]: GAME_STATES.LEADERBOARD
  },
  [GAME_STATES.QUEST_DETAIL]: {
    [GAME_EVENTS.START_QUEST]: GAME_STATES.PLAYING,
    [GAME_EVENTS.ABANDON]: GAME_STATES.IDLE
  },
  [GAME_STATES.PLAYING]: {
    [GAME_EVENTS.SUBMIT_SOLUTION]: GAME_STATES.EVALUATING,
    [GAME_EVENTS.ABANDON]: GAME_STATES.IDLE,
    [GAME_EVENTS.ERROR]: GAME_STATES.ERROR
  },
  [GAME_STATES.EVALUATING]: {
    [GAME_EVENTS.EVALUATION_COMPLETE]: GAME_STATES.RESULT,
    [GAME_EVENTS.ERROR]: GAME_STATES.ERROR
  },
  [GAME_STATES.RESULT]: {
    [GAME_EVENTS.BACK_TO_LOBBY]: GAME_STATES.IDLE,
    [GAME_EVENTS.VIEW_LEADERBOARD]: GAME_STATES.LEADERBOARD
  },
  [GAME_STATES.LEADERBOARD]: {
    [GAME_EVENTS.BACK_TO_LOBBY]: GAME_STATES.IDLE
  },
  [GAME_STATES.ERROR]: {
    [GAME_EVENTS.RETRY]: GAME_STATES.IDLE
  }
};

/**
 * useGameMachine — hook de React que encapsula la máquina de estados.
 * Reemplaza múltiples useState entrelazados con estado predecible.
 */
import { useReducer, useCallback } from 'react';

function machineReducer(state, event) {
  const nextState = TRANSITIONS[state.current]?.[event.type];
  if (!nextState) {
    console.warn(`Transición inválida: ${state.current} + ${event.type}`);
    return state;
  }
  return {
    current: nextState,
    previous: state.current,
    context: { ...state.context, ...event.payload }
  };
}

export function useGameMachine() {
  const [state, dispatch] = useReducer(machineReducer, {
    current: GAME_STATES.IDLE,
    previous: null,
    context: {
      selectedQuest: null,
      currentResult: null,
      error: null
    }
  });

  const send = useCallback((type, payload = {}) => {
    dispatch({ type, payload });
  }, []);

  const is = useCallback((stateName) => state.current === stateName, [state.current]);
  const can = useCallback((eventType) => !!TRANSITIONS[state.current]?.[eventType], [state.current]);

  return { state, send, is, can };
}
