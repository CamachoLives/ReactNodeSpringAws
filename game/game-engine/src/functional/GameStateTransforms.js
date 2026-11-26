/**
 * TRANSFORMACIONES PURAS DEL ESTADO DEL JUEGO
 *
 * El estado del juego se trata como un valor inmutable.
 * Cada acción del jugador produce un NUEVO estado.
 *
 * Patrón Redux/Elm aplicado al engine:
 * (state, action) → newState
 *
 * LENSES — acceso inmutable a campos anidados
 */

// ─────────────────────────────────────────────
// LENSES — como getters/setters funcionales
// ─────────────────────────────────────────────
const lens = (getter, setter) => ({
  get: getter,
  set: setter,
  over: (fn) => (obj) => setter(fn(getter(obj)))(obj) // modifica con función
});

export const playerLens = {
  score:  lens(p => p.score,  v => p => ({ ...p, score: v })),
  level:  lens(p => p.level,  v => p => ({ ...p, level: v })),
  xp:     lens(p => p.xp,     v => p => ({ ...p, xp: v })),
  streak: lens(p => p.streak, v => p => ({ ...p, streak: v })),
};

// ─────────────────────────────────────────────
// REDUCERS — funciones puras de transición de estado
// ─────────────────────────────────────────────

/**
 * Estado inicial del juego (valor inmutable base)
 */
export const initialGameState = Object.freeze({
  players: {},
  quests: [],
  leaderboard: [],
  events: [],
  tick: 0
});

/**
 * REDUCER PRINCIPAL — como Redux pero para el game engine
 * Función pura: mismo estado + misma acción = mismo resultado
 */
export function gameReducer(state = initialGameState, action) {
  switch (action.type) {
    case 'PLAYER_JOIN':
      return {
        ...state,
        players: {
          ...state.players,
          [action.playerId]: {
            id: action.playerId,
            username: action.username,
            score: 0, level: 1, xp: 0, streak: 0,
            state: 'IDLE', joinedAt: action.timestamp
          }
        }
      };

    case 'QUEST_COMPLETED': {
      const player = state.players[action.playerId];
      if (!player) return state;

      const newXp = player.xp + action.xpEarned;
      const newLevel = Math.floor(1 + Math.sqrt(newXp / 100));

      return {
        ...state,
        players: {
          ...state.players,
          [action.playerId]: {
            ...player,
            score: player.score + action.score,
            xp: newXp,
            level: newLevel,
            streak: player.streak + 1,
            state: 'IDLE',
            lastActive: action.timestamp
          }
        },
        events: [...state.events, { type: 'QUEST_COMPLETED', ...action }].slice(-100)
      };
    }

    case 'LEADERBOARD_UPDATED':
      return {
        ...state,
        leaderboard: Object.values(state.players)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((p, i) => ({ rank: i + 1, ...p }))
      };

    case 'TICK':
      return { ...state, tick: state.tick + 1 };

    default:
      return state;
  }
}

/**
 * Currying aplicado a las acciones del juego
 */
export const createAction = (type) => (payload) => ({ type, ...payload, timestamp: Date.now() });

export const actions = {
  playerJoin:       createAction('PLAYER_JOIN'),
  questCompleted:   createAction('QUEST_COMPLETED'),
  updateLeaderboard: createAction('LEADERBOARD_UPDATED'),
  tick:             createAction('TICK'),
};
