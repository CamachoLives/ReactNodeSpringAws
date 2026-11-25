/**
 * SELECTORS — derivaciones memoizadas del estado
 *
 * Patrón Selector: encapsula acceso al estado, evita duplicar lógica de derivación.
 * Programación funcional: funciones puras de estado → dato derivado.
 * createSelector: memoización — no recalcula si los inputs no cambiaron (performance).
 */

import { createSelector } from '@reduxjs/toolkit';

// Selector base (input selector)
const selectPipelinesState = state => state.pipelines;

// Selectores derivados — componen los básicos
export const selectAllPipelines = createSelector(
  selectPipelinesState,
  s => s.items
);

export const selectPipelinesStatus = createSelector(
  selectPipelinesState,
  s => s.status
);

export const selectSelectedPipeline = createSelector(
  selectAllPipelines,
  selectPipelinesState,
  (items, s) => items.find(p => p.id === s.selectedId) ?? null
);

// Selector compuesto: pipelines filtrados por estado
export const selectPipelinesByStatus = createSelector(
  [selectAllPipelines, (_, status) => status],
  (pipelines, status) =>
    status === 'ALL' ? pipelines : pipelines.filter(p => p.status === status)
);

// Selector de métricas agregadas — reduce funcional
export const selectPipelineMetrics = createSelector(
  selectAllPipelines,
  (pipelines) => ({
    total: pipelines.length,
    running: pipelines.filter(p => p.status === 'RUNNING').length,
    failed: pipelines.filter(p => p.status === 'FAILED').length,
    totalRecords: pipelines.reduce((sum, p) => sum + (p.recordsProcessed ?? 0), 0)
  })
);
