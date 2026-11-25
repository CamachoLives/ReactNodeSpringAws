/**
 * REDUX TOOLKIT — Gestión de estado global
 *
 * Patrón Flux/Redux: flujo unidireccional de datos
 * Programación funcional: reducers son funciones puras (sin efectos secundarios)
 * Inmutabilidad: RTK usa Immer internamente (escribe mutable, produce inmutable)
 * Selector pattern: memoización de derivaciones de estado
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1';

// ─────────────────────────────────────────────
// ASYNC THUNKS — operaciones asíncronas como acciones
// ─────────────────────────────────────────────
export const fetchPipelines = createAsyncThunk(
  'pipelines/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/pipelines`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const startPipeline = createAsyncThunk(
  'pipelines/start',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/pipelines/${id}/start`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const stopPipeline = createAsyncThunk(
  'pipelines/stop',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/pipelines/${id}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────────
// SLICE — estado + reducers en un solo lugar
// ─────────────────────────────────────────────
const pipelineSlice = createSlice({
  name: 'pipelines',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    selectedId: null
  },
  reducers: {
    // Reducer PURO: función (estado, acción) → nuevo estado
    selectPipeline: (state, action) => {
      state.selectedId = action.payload; // RTK/Immer permite "mutar" (produce inmutable)
    },
    clearSelection: (state) => {
      state.selectedId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchPipelines
      .addCase(fetchPipelines.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPipelines.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPipelines.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // startPipeline / stopPipeline — actualizar un item en la lista
      .addMatcher(
        action => [startPipeline.fulfilled.type, stopPipeline.fulfilled.type].includes(action.type),
        (state, action) => {
          const index = state.items.findIndex(p => p.id === action.payload.id);
          if (index !== -1) state.items[index] = action.payload;
        }
      );
  }
});

export const { selectPipeline, clearSelection } = pipelineSlice.actions;
export default pipelineSlice.reducer;
