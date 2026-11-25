/**
 * CUSTOM HOOKS — React funcional
 *
 * Los hooks encapsulan lógica con estado reutilizable (SRP aplicado a React).
 * Programación funcional: sin clases, sin "this", composición de hooks.
 * Separa lógica de UI del componente (Clean Architecture en frontend).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// ─────────────────────────────────────────────
// Hook base: fetch genérico con estado de carga
// ─────────────────────────────────────────────
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Cancelar request anterior si se re-ejecuta
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortRef.current.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort(); // cleanup: cancelar al desmontar
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─────────────────────────────────────────────
// Hook específico: Pipelines
// ─────────────────────────────────────────────
export function usePipelines() {
  const { data: pipelines, loading, error, refetch } = useFetch(`${API_BASE}/pipelines`);

  const startPipeline = useCallback(async (id) => {
    const response = await fetch(`${API_BASE}/pipelines/${id}/start`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al iniciar pipeline');
    refetch();
  }, [refetch]);

  const stopPipeline = useCallback(async (id) => {
    const response = await fetch(`${API_BASE}/pipelines/${id}/stop`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al detener pipeline');
    refetch();
  }, [refetch]);

  return {
    pipelines: pipelines ?? [],
    loading,
    error,
    startPipeline,
    stopPipeline,
    refetch
  };
}

// ─────────────────────────────────────────────
// Hook: Polling con intervalo (imperativo dentro de hook funcional)
// ─────────────────────────────────────────────
export function usePolling(url, intervalMs = 5000) {
  const { data, loading, error, refetch } = useFetch(url);

  useEffect(() => {
    const interval = setInterval(refetch, intervalMs);
    return () => clearInterval(interval); // cleanup
  }, [refetch, intervalMs]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────
// Hook: estado local con reducer (patrón Redux local)
// ─────────────────────────────────────────────
const pipelineFilterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STATUS': return { ...state, status: action.payload };
    case 'SET_SEARCH': return { ...state, search: action.payload };
    case 'RESET': return { status: 'ALL', search: '' };
    default: return state;
  }
};

export function usePipelineFilters() {
  const [filters, dispatch] = React.useReducer(pipelineFilterReducer, {
    status: 'ALL',
    search: ''
  });

  const setStatus = useCallback(status => dispatch({ type: 'SET_STATUS', payload: status }), []);
  const setSearch = useCallback(search => dispatch({ type: 'SET_SEARCH', payload: search }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { filters, setStatus, setSearch, reset };
}
