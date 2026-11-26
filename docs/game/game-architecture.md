# DevQuest: Pipeline Warriors — Arquitectura del Juego

## Flujo completo de una quest

```
  Jugador escribe código
         │
         ▼
  [React] useGameMachine        ← State Machine (XState/manual)
  PLAYING → EVALUATING
         │
         ▼
  [WebSocket] envía solución    ← STOMP sobre SockJS
         │
         ▼
  [Spring Boot] GameService     ← Orquestador (SRP)
         │
    ┌────┴────┐
    ▼         ▼
PlayerStateMachine  Quest.evaluate()  ← State + Template Method
    │         │
    ▼         ▼
 [Node.js]  XpCalculator       ← Worker Thread + funciones puras
 QuestEvaluationPool
    │
    ▼
  Worker Thread evalúa código  ← Paralelismo real
    │
    ▼
  [Spring] AchievementEvaluator ← Specification pattern
    │
    ▼
  PowerUpChain.apply()         ← Decorator pattern
    │
    ▼
  Player.gainXp()              ← Imperativo: nivel, clase, streak
    │
    ▼
  SQS → Lambda                 ← AWS: salvar score, disparar logros
    │
    ▼
  WebSocket → React HUD        ← Tiempo real: XP bar animada
    │
    ▼
  WebSocket → Angular           ← Leaderboard reactivo (RxJS scan)
```

## Patrones usados en el juego

| Patrón | Dónde | Por qué |
|--------|-------|---------|
| State Machine | PlayerStateMachine, useGameMachine | Transiciones predecibles, sin estados inválidos |
| Template Method | Quest.evaluate() | Algoritmo fijo, pasos variables por tipo de quest |
| Decorator | PowerUpChain | Modificar resultado sin cambiar Quest ni Player |
| Strategy | QuestEvaluationPool | Diferentes evaluadores por lenguaje |
| Observer | EventEmitter, BehaviorSubject | Desacoplamiento total entre sistema de juego y UI |
| Builder | AnalyticsPipelineBuilder | Configuración fluida del pipeline de analytics |
| Composite | PowerUpChain extiende PowerUp | Cadena actúa como un solo power-up |
| Command | eventHandlers en Lambda | Cada tipo de evento tiene su handler encapsulado |

## Concurrencia en el juego

```
Hilo principal (Spring) ──────────────────────────────► HTTP + WS
        │
        ├──► @Async Thread Pool   ── evaluación de código Java
        │
        └──► Virtual Threads       ── llamadas a DB y AWS

Event Loop (Node.js) ─────────────────────────────────► Game Loop
        │
        ├──► Worker Thread 1  ── evaluación de código jugador A
        ├──► Worker Thread 2  ── evaluación de código jugador B
        └──► Worker Thread N  ── evaluaciones paralelas

Browser (React) ───────────────────────────────────────► UI
        │
        └──► requestAnimationFrame ── animación XP bar
```
