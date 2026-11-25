/**
 * COMPONENTE FUNCIONAL React
 *
 * Props inmutables (programación funcional)
 * Renderizado declarativo: QUÉ mostrar, no CÓMO actualizar el DOM
 * Composición sobre herencia (React no usa herencia de componentes)
 * Polimorfismo via props: mismo componente, distintos comportamientos según datos
 */

import React, { memo, useCallback } from 'react';

// STATUS_CONFIG: polimorfismo de datos — mismo componente se comporta distinto
const STATUS_CONFIG = {
  RUNNING: { color: '#22c55e', label: 'Ejecutando', canStart: false, canStop: true },
  IDLE:    { color: '#3b82f6', label: 'Inactivo',   canStart: true,  canStop: false },
  FAILED:  { color: '#ef4444', label: 'Fallido',    canStart: true,  canStop: false },
  COMPLETED: { color: '#a855f7', label: 'Completado', canStart: true, canStop: false },
  PAUSED:  { color: '#f59e0b', label: 'Pausado',    canStart: true,  canStop: false },
};

// memo: evita re-renders si las props no cambian (optimización funcional)
const PipelineCard = memo(({ pipeline, onStart, onStop }) => {
  const config = STATUS_CONFIG[pipeline.status] ?? STATUS_CONFIG.IDLE;

  const handleStart = useCallback(() => onStart(pipeline.id), [pipeline.id, onStart]);
  const handleStop  = useCallback(() => onStop(pipeline.id),  [pipeline.id, onStop]);

  return (
    <article style={styles.card}>
      <header style={styles.header}>
        <h3 style={styles.title}>{pipeline.name}</h3>
        <StatusBadge status={pipeline.status} config={config} />
      </header>

      <dl style={styles.details}>
        <MetricItem label="Fuente" value={pipeline.sourceType} />
        <MetricItem label="Registros" value={pipeline.recordsProcessed?.toLocaleString() ?? '0'} />
        <MetricItem
          label="Última ejecución"
          value={pipeline.lastRunAt ? new Date(pipeline.lastRunAt).toLocaleString('es') : 'Nunca'}
        />
      </dl>

      <footer style={styles.footer}>
        {config.canStart && (
          <button onClick={handleStart} style={{ ...styles.btn, background: '#22c55e' }}>
            ▶ Iniciar
          </button>
        )}
        {config.canStop && (
          <button onClick={handleStop} style={{ ...styles.btn, background: '#ef4444' }}>
            ■ Detener
          </button>
        )}
      </footer>
    </article>
  );
});

// Componentes pequeños — SRP: cada uno tiene una sola responsabilidad
const StatusBadge = ({ status, config }) => (
  <span style={{ ...styles.badge, background: config.color }}>
    {config.label}
  </span>
);

const MetricItem = ({ label, value }) => (
  <>
    <dt style={styles.dt}>{label}</dt>
    <dd style={styles.dd}>{value}</dd>
  </>
);

const styles = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 20,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: 16, fontWeight: 600, color: '#1e293b' },
  badge: { padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 600 },
  details: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', margin: 0 },
  dt: { color: '#64748b', fontSize: 12, fontWeight: 500 },
  dd: { margin: 0, fontWeight: 600, color: '#1e293b', fontSize: 13 },
  footer: { display: 'flex', gap: 8, marginTop: 4 },
  btn: { padding: '8px 16px', border: 'none', borderRadius: 8, color: '#fff',
         cursor: 'pointer', fontSize: 13, fontWeight: 600 }
};

PipelineCard.displayName = 'PipelineCard';
export default PipelineCard;
