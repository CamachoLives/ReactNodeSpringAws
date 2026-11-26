/**
 * WORKER THREAD — evaluación de código del jugador en hilo separado
 *
 * El código enviado por el jugador se evalúa en un Worker Thread
 * para no bloquear el event loop principal.
 *
 * IMPORTANTE: nunca evaluar código de usuario en el hilo principal
 * (bloquea el server para todos los demás jugadores).
 *
 * Concurrencia:
 * - Hilo principal: event loop, WebSocket, HTTP
 * - Worker Thread: evaluación de código (CPU-bound, potencialmente lento)
 * - Comunicación: postMessage (paso de mensajes — sin memoria compartida)
 */

import { isMainThread, parentPort, workerData } from 'worker_threads';

if (!isMainThread) {
  // Este bloque corre en el Worker Thread, no en el principal
  const { questId, playerCode, testCases, timeoutMs } = workerData;

  const result = evaluateWithTimeout(playerCode, testCases, timeoutMs);
  parentPort.postMessage(result);
}

function evaluateWithTimeout(code, testCases, timeoutMs) {
  const startTime = Date.now();
  const results = [];

  for (const testCase of testCases) {
    const caseStart = Date.now();
    try {
      // Sandboxed evaluation (en producción usar vm2 o Docker)
      const fn = new Function('input', code);
      const output = fn(testCase.input);
      const passed = JSON.stringify(output) === JSON.stringify(testCase.expected);

      results.push({
        testId: testCase.id,
        passed,
        output,
        expected: testCase.expected,
        timeMs: Date.now() - caseStart
      });

    } catch (err) {
      results.push({
        testId: testCase.id,
        passed: false,
        error: err.message,
        timeMs: Date.now() - caseStart
      });
    }

    // Timeout: si tardó demasiado, cortar la evaluación
    if (Date.now() - startTime > timeoutMs) {
      return {
        success: false,
        error: `Tiempo límite excedido: ${timeoutMs}ms`,
        results,
        totalTimeMs: Date.now() - startTime
      };
    }
  }

  const passed = results.filter(r => r.passed).length;
  const accuracy = passed / testCases.length;

  return {
    success: true,
    accuracy,
    passed,
    total: testCases.length,
    results,
    totalTimeMs: Date.now() - startTime,
    speedBonus: Date.now() - startTime < timeoutMs * 0.5 // completó en menos del 50% del tiempo
  };
}
