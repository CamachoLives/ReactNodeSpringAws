/**
 * PLAYER HUD (Heads-Up Display) — información del jugador siempre visible
 *
 * XP Bar animada con requestAnimationFrame
 * Combo counter con CSS keyframes
 * Polimorfismo de datos: color/icono cambia según playerClass
 */

import React, { memo, useEffect, useRef } from 'react';

const CLASS_CONFIG = {
  APPRENTICE: { color: '#6b7280', glow: '#6b728040', icon: '⚡' },
  ENGINEER:   { color: '#3b82f6', glow: '#3b82f640', icon: '🔧' },
  ARCHITECT:  { color: '#8b5cf6', glow: '#8b5cf640', icon: '🏛️' },
  LEGEND:     { color: '#f59e0b', glow: '#f59e0b60', icon: '🌟' },
};

const PlayerHUD = memo(({ player }) => {
  const xpBarRef = useRef(null);
  const prevXpRef = useRef(player?.xpProgressPercent ?? 0);

  // Animación fluida de la barra XP con requestAnimationFrame
  useEffect(() => {
    if (!xpBarRef.current || !player) return;

    const target = player.xpProgressPercent;
    const start = prevXpRef.current;
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;

      if (xpBarRef.current) {
        xpBarRef.current.style.width = `${current}%`;
      }

      if (progress < 1) requestAnimationFrame(animate);
      else prevXpRef.current = target;
    };

    requestAnimationFrame(animate);
  }, [player?.xpProgressPercent]);

  if (!player) return null;

  const cls = CLASS_CONFIG[player.playerClass] ?? CLASS_CONFIG.APPRENTICE;

  return (
    <header style={{ ...styles.hud, boxShadow: `0 0 20px ${cls.glow}` }}>
      {/* Avatar y nombre */}
      <div style={styles.identity}>
        <div style={{ ...styles.avatar, background: cls.color }}>
          {cls.icon}
        </div>
        <div>
          <div style={styles.username}>{player.username}</div>
          <div style={{ ...styles.className, color: cls.color }}>
            {player.playerClass} · Lv. {player.level}
          </div>
        </div>
      </div>

      {/* Barra de XP animada */}
      <div style={styles.xpSection}>
        <div style={styles.xpLabel}>
          <span>XP</span>
          <span style={{ color: '#94a3b8' }}>{player.currentXp} / {player.xpForNextLevel}</span>
        </div>
        <div style={styles.xpTrack}>
          <div ref={xpBarRef} style={{ ...styles.xpFill, background: cls.color, width: '0%' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <StatItem icon="🏆" value={player.totalScore.toLocaleString()} label="Score" />
        <StatItem icon="⚔️" value={player.questsCompleted} label="Quests" />
        <StatItem icon="🔥" value={player.streak} label="Racha" color={player.streak >= 7 ? '#f59e0b' : undefined} />
      </div>
    </header>
  );
});

const StatItem = ({ icon, value, label, color }) => (
  <div style={styles.statItem}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ ...styles.statValue, color: color ?? '#f1f5f9' }}>{value}</span>
    <span style={styles.statLabel}>{label}</span>
  </div>
);

const styles = {
  hud: { background: '#1e293b', borderBottom: '1px solid #334155',
         padding: '12px 24px', display: 'flex', alignItems: 'center',
         gap: 32, position: 'sticky', top: 0, zIndex: 100 },
  identity: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 },
  avatar: { width: 42, height: 42, borderRadius: '50%', display: 'grid',
            placeItems: 'center', fontSize: 20, flexShrink: 0 },
  username: { fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  className: { fontSize: 12, fontWeight: 600 },
  xpSection: { flexGrow: 1, maxWidth: 300 },
  xpLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 11,
              color: '#cbd5e1', marginBottom: 4 },
  xpTrack: { height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 4, transition: 'width 0s' }, // transición vía rAF
  stats: { display: 'flex', gap: 24 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: 700 },
  statLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' }
};

PlayerHUD.displayName = 'PlayerHUD';
export default PlayerHUD;
