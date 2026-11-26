/**
 * QUEST BOARD — tablero principal del juego
 *
 * Patrón: Compound Components (tablero compuesto de piezas reutilizables)
 * Programación declarativa: React describe QUÉ mostrar
 * Animaciones: CSS transitions + requestAnimationFrame
 */

import React, { memo, useMemo, useState } from 'react';

// DATOS DE QUESTS (en producción vendrían del API)
const QUEST_CATEGORIES = [
  { id: 'SOLID_PRINCIPLES',    icon: '🧱', label: 'SOLID',           color: '#3b82f6' },
  { id: 'DESIGN_PATTERNS',     icon: '🎨', label: 'Patrones',        color: '#8b5cf6' },
  { id: 'CONCURRENCY',         icon: '⚡', label: 'Concurrencia',    color: '#f59e0b' },
  { id: 'FUNCTIONAL_PROGRAMMING', icon: '🔗', label: 'Funcional',   color: '#10b981' },
  { id: 'CLEAN_ARCHITECTURE',  icon: '🏛️', label: 'Arquitectura',   color: '#ef4444' },
  { id: 'ETL_PIPELINES',       icon: '🔄', label: 'ETL',             color: '#06b6d4' },
  { id: 'AWS_CLOUD',           icon: '☁️', label: 'AWS',             color: '#f97316' },
  { id: 'REACTIVE_PROGRAMMING',icon: '🌊', label: 'Reactivo',        color: '#a855f7' },
];

const QuestBoard = memo(({ quests, onSelectQuest, playerLevel, completedQuestIds = [] }) => {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filtered = useMemo(() =>
    activeCategory === 'ALL'
      ? quests
      : quests.filter(q => q.conceptCategory === activeCategory),
    [quests, activeCategory]
  );

  return (
    <div style={styles.board}>
      <CategoryFilter
        categories={QUEST_CATEGORIES}
        active={activeCategory}
        onSelect={setActiveCategory}
      />
      <div style={styles.grid}>
        {filtered.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            isCompleted={completedQuestIds.includes(quest.id)}
            isLocked={quest.minLevel > playerLevel}
            onSelect={() => !quest.minLevel || quest.minLevel <= playerLevel
              ? onSelectQuest(quest) : null}
          />
        ))}
      </div>
    </div>
  );
});

const CategoryFilter = memo(({ categories, active, onSelect }) => (
  <div style={styles.categoryBar}>
    <FilterChip label="Todas" id="ALL" active={active === 'ALL'} color="#6b7280" onClick={() => onSelect('ALL')} />
    {categories.map(cat => (
      <FilterChip key={cat.id} label={cat.label} id={cat.id}
        active={active === cat.id} color={cat.color} icon={cat.icon}
        onClick={() => onSelect(cat.id)} />
    ))}
  </div>
));

const FilterChip = ({ label, id, active, color, icon, onClick }) => (
  <button onClick={onClick} style={{
    ...styles.chip,
    background: active ? color : '#1e293b',
    color: active ? '#fff' : '#94a3b8',
    border: `1px solid ${active ? color : '#334155'}`
  }}>
    {icon && <span>{icon} </span>}{label}
  </button>
);

const QuestCard = memo(({ quest, isCompleted, isLocked, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  const difficultyColor = {
    TUTORIAL: '#22c55e', EASY: '#86efac', MEDIUM: '#fbbf24',
    HARD: '#f97316', EPIC: '#ef4444', LEGENDARY: '#a855f7'
  }[quest.difficulty] ?? '#94a3b8';

  return (
    <article
      onClick={!isLocked ? onSelect : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transform: hovered && !isLocked ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered && !isLocked
          ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ ...styles.diffBadge, background: difficultyColor }}>
          {quest.difficulty}
        </span>
        {isCompleted && <span style={styles.checkmark}>✓</span>}
        {isLocked && <span style={{ fontSize: 18 }}>🔒</span>}
      </div>

      <h3 style={styles.cardTitle}>{quest.title}</h3>
      <p style={styles.cardDesc}>{quest.description}</p>

      <footer style={styles.cardFooter}>
        <span style={styles.xpBadge}>⚡ {quest.baseXpReward} XP</span>
        <span style={styles.timeBadge}>⏱ {quest.timeLimitMinutes}m</span>
      </footer>
    </article>
  );
});

const styles = {
  board: { background: '#0f172a', minHeight: '100vh', padding: 24 },
  categoryBar: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s ease' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#1e293b', borderRadius: 12, padding: 20,
          border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: 10 },
  diffBadge: { padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#000' },
  checkmark: { color: '#22c55e', fontSize: 20, fontWeight: 700 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' },
  cardDesc: { margin: 0, fontSize: 13, color: '#94a3b8', flexGrow: 1 },
  cardFooter: { display: 'flex', gap: 8, marginTop: 4 },
  xpBadge: { background: '#1d4ed8', color: '#bfdbfe', padding: '3px 10px',
              borderRadius: 8, fontSize: 12, fontWeight: 600 },
  timeBadge: { background: '#374151', color: '#d1d5db', padding: '3px 10px',
               borderRadius: 8, fontSize: 12 }
};

export default QuestBoard;
