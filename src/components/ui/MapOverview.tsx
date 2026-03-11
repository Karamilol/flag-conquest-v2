// ── Fractured World: Map Overview Panel ──────────────────────────────
// Compact floating popup with fog of war — only current + next tier revealed.

import { memo } from 'react';
import type { FracturedMap, MapNode } from '../../types';
import { getModifierDef, getCurseDef } from '../../modifiers';

// ── Constants ────────────────────────────────────────────────────────

const DIFF_COLORS: Record<string, { fill: string; border: string; glow: string }> = {
  easy:   { fill: '#1a3a1a', border: '#4aff4a', glow: 'rgba(74,255,74,0.3)' },
  medium: { fill: '#3a3a1a', border: '#ffcc44', glow: 'rgba(255,204,68,0.3)' },
  hard:   { fill: '#3a1a1a', border: '#ff4444', glow: 'rgba(255,68,68,0.3)' },
};

const DIFF_LABELS: Record<string, string> = {
  easy: 'STABLE',
  medium: 'WARPED',
  hard: 'VOLATILE',
};

const BIOME_LABELS: Record<string, string> = {
  forest: 'Ancient Forest',
  cave: 'Crystal Caverns',
  nordic: 'Frozen Highlands',
  volcanic: 'Volcanic Wastes',
  final: 'The Void',
};

const BIOME_ICONS: Record<string, string> = {
  forest: '\u{1F332}',
  cave: '\u{1F48E}',
  nordic: '\u{2744}',
  volcanic: '\u{1F30B}',
  final: '\u{1F573}',
};

// Layout
const NODE_W = 48;
const NODE_H = 32;
const TIER_GAP_X = 58;
const NODE_GAP_Y = 40;
const PAD_LEFT = 24;
const PAD_TOP = 32;

interface Props {
  map: FracturedMap;
  onClose: () => void;
}

// ── Visibility logic ─────────────────────────────────────────────────

type NodeVisibility = 'visited' | 'current' | 'next' | 'hidden';

function getNodeVisibility(tierIdx: number, nodeIdx: number, map: FracturedMap): NodeVisibility {
  const currentTier = map.currentTier;
  const isChosen = map.chosenPath[tierIdx] === nodeIdx;

  if (tierIdx < currentTier) {
    return isChosen ? 'visited' : 'hidden';
  }
  if (tierIdx === currentTier) {
    return isChosen ? 'current' : 'hidden';
  }
  if (tierIdx === currentTier + 1) {
    return 'next'; // fog of war: reveal the immediate next tier
  }
  return 'hidden';
}

// ── Node component ───────────────────────────────────────────────────

function MapNodeBox({ node, visibility }: {
  node: MapNode;
  visibility: NodeVisibility;
}) {
  const cfg = DIFF_COLORS[node.difficulty] || DIFF_COLORS.easy;
  const hasCurse = !!node.curse;
  const isHidden = visibility === 'hidden';
  const isRevealed = visibility === 'visited' || visibility === 'current' || visibility === 'next';
  const isNext = visibility === 'next';

  // Hidden nodes: just a dim mystery dot
  if (isHidden) {
    return (
      <div style={{
        width: NODE_W, height: NODE_H,
        borderRadius: 6,
        border: '1px solid #222',
        background: 'rgba(15,10,25,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#333', fontSize: 10 }}>?</span>
      </div>
    );
  }

  const borderColor = hasCurse ? '#ff2244' : cfg.border;
  const bgColor = hasCurse ? '#3a0a15' : cfg.fill;
  const dimmed = visibility === 'visited';

  return (
    <div
      style={{
        width: NODE_W, height: NODE_H,
        borderRadius: 6,
        border: `1.5px solid ${dimmed ? borderColor + '60' : borderColor}`,
        background: bgColor,
        opacity: dimmed ? 0.7 : 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: visibility === 'current'
          ? `0 0 8px ${borderColor}, 0 0 16px ${cfg.glow}`
          : isNext
            ? `0 0 4px ${cfg.glow}`
            : 'none',
        transition: 'opacity 0.2s',
      }}
      title={isRevealed ? buildTooltip(node) : undefined}
    >
      {/* Biome icon */}
      <div style={{ fontSize: 11, lineHeight: 1 }}>
        {BIOME_ICONS[node.biome] || '\u{2753}'}
      </div>
      {/* Difficulty label */}
      <div style={{
        fontSize: 5, letterSpacing: 0.7, fontWeight: 'bold',
        color: hasCurse ? '#ff2244' : cfg.border,
        marginTop: 1,
      }}>
        {hasCurse ? 'CURSED' : DIFF_LABELS[node.difficulty] || node.difficulty.toUpperCase()}
      </div>
      {/* Current indicator */}
      {visibility === 'current' && (
        <div style={{
          position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, lineHeight: 1,
        }}>
          {'\u{1F6B6}'}
        </div>
      )}
      {/* Visited checkmark */}
      {visibility === 'visited' && (
        <div style={{
          position: 'absolute', top: -5, right: -3,
          fontSize: 7, color: '#4aff4a',
        }}>
          {'\u2713'}
        </div>
      )}
      {/* Modifier dots — only for revealed nodes */}
      {node.modifiers.length > 0 && isRevealed && (
        <div style={{
          position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 2,
        }}>
          {node.modifiers.slice(0, 5).map((id, i) => {
            const def = getModifierDef(id);
            const color = def?.category === 'positive' ? '#4aff4a' : '#ff4444';
            return <div key={i} style={{
              width: 3, height: 3, borderRadius: '50%',
              background: color,
            }} />;
          })}
        </div>
      )}
      {/* "NEXT" glow badge for upcoming tier */}
      {isNext && (
        <div style={{
          position: 'absolute', bottom: -10,
          fontSize: 4, color: '#a855f7', letterSpacing: 0.5,
        }}>
          AHEAD
        </div>
      )}
    </div>
  );
}

function buildTooltip(node: MapNode): string {
  const lines: string[] = [];
  const biome = BIOME_LABELS[node.biome] || node.biome;
  const diff = DIFF_LABELS[node.difficulty] || node.difficulty;
  lines.push(`${biome} — ${diff}`);
  for (const id of node.modifiers) {
    const def = getModifierDef(id);
    if (def) lines.push(`${def.icon} ${def.name}: ${def.description}`);
  }
  if (node.curse) {
    const curse = getCurseDef(node.curse);
    if (curse) lines.push(`${curse.icon} ${curse.name}: ${curse.downside}`);
  }
  return lines.join('\n');
}

// ── Main MapOverview ─────────────────────────────────────────────────

export const MapOverview = memo(function MapOverview({ map, onClose }: Props) {
  const totalTiers = map.tiers.length;
  const maxNodesInTier = Math.max(...map.tiers.map(t => t.length));

  // Canvas dimensions
  const svgW = PAD_LEFT + totalTiers * TIER_GAP_X + 16;
  const svgH = PAD_TOP + maxNodesInTier * NODE_GAP_Y + 16;

  // Calculate node positions
  const positions: { x: number; y: number }[][] = map.tiers.map((tier, tierIdx) => {
    const count = tier.length;
    const totalH = (count - 1) * NODE_GAP_Y;
    const startY = PAD_TOP + (maxNodesInTier - 1) * NODE_GAP_Y / 2 - totalH / 2;
    return tier.map((_, nodeIdx) => ({
      x: PAD_LEFT + tierIdx * TIER_GAP_X,
      y: startY + nodeIdx * NODE_GAP_Y,
    }));
  });

  // Build connection lines using node.connections (not all-to-all)
  const lines: { x1: number; y1: number; x2: number; y2: number; style: 'chosen' | 'next' | 'dim' }[] = [];
  for (let t = 0; t < totalTiers - 1; t++) {
    const chosenHere = map.chosenPath[t];
    const chosenNext = map.chosenPath[t + 1];
    const isCurrentToNext = t === map.currentTier;

    for (let i = 0; i < map.tiers[t].length; i++) {
      const node = map.tiers[t][i];
      const conns = node.connections || [];

      for (const j of conns) {
        if (j >= map.tiers[t + 1].length) continue;
        const isChosenLine = chosenHere === i && chosenNext === j;

        let lineStyle: 'chosen' | 'next' | 'dim';
        if (isChosenLine) {
          lineStyle = 'chosen';
        } else if (isCurrentToNext && chosenHere === i) {
          lineStyle = 'next';
        } else {
          lineStyle = 'dim';
        }

        lines.push({
          x1: positions[t][i].x + NODE_W,
          y1: positions[t][i].y + NODE_H / 2,
          x2: positions[t + 1][j].x,
          y2: positions[t + 1][j].y + NODE_H / 2,
          style: lineStyle,
        });
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: 'relative',
          width: '85%', maxWidth: 595, maxHeight: '70%',
          background: 'linear-gradient(180deg, rgba(12,8,25,0.98) 0%, rgba(8,5,18,0.98) 100%)',
          border: '1.5px solid rgba(168,85,247,0.35)',
          borderRadius: 10,
          boxShadow: '0 0 30px rgba(168,85,247,0.15), 0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px 5px',
          borderBottom: '1px solid rgba(168,85,247,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11 }}>{'\u{1F5FA}'}</span>
            <span style={{ color: '#a855f7', fontSize: 10, letterSpacing: 1.5, fontWeight: 'bold' }}>
              FRACTURED MAP
            </span>
            <span style={{ color: '#555', fontSize: 7 }}>
              Zone {map.currentTier + 1} / {totalTiers}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #333', borderRadius: 3,
              color: '#666', fontSize: 9, cursor: 'pointer', padding: '1px 5px',
              fontFamily: 'inherit',
            }}
          >
            x
          </button>
        </div>

        {/* Scrollable map area */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '6px 8px' }}>
          <div style={{ position: 'relative', width: svgW, height: svgH }}>
            {/* Connection lines */}
            <svg
              width={svgW} height={svgH}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              {lines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke={
                    line.style === 'chosen' ? '#a855f7'
                    : line.style === 'next' ? 'rgba(168,85,247,0.45)'
                    : 'rgba(255,255,255,0.04)'
                  }
                  strokeWidth={line.style === 'chosen' ? 1.5 : 0.8}
                  strokeDasharray={line.style === 'next' ? '3,3' : undefined}
                />
              ))}
            </svg>

            {/* Tier labels */}
            {map.tiers.map((_, tierIdx) => {
              const label = tierIdx === 0 ? 'START' : tierIdx === totalTiers - 1 ? 'FINAL' : `Z${tierIdx + 1}`;
              return (
                <div key={`label-${tierIdx}`} style={{
                  position: 'absolute',
                  left: positions[tierIdx][0].x,
                  top: 6,
                  width: NODE_W,
                  textAlign: 'center',
                  fontSize: 5,
                  color: tierIdx <= map.currentTier ? '#555' : '#2a2a3a',
                  letterSpacing: 0.5,
                }}>
                  {label}
                </div>
              );
            })}

            {/* Biome region backgrounds */}
            {renderBiomeRegions(map, positions, svgH)}

            {/* Nodes */}
            {map.tiers.map((tier, tierIdx) =>
              tier.map((node, nodeIdx) => {
                const pos = positions[tierIdx][nodeIdx];
                const vis = getNodeVisibility(tierIdx, nodeIdx, map);
                return (
                  <div key={`${tierIdx}-${nodeIdx}`} style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                  }}>
                    <MapNodeBox node={node} visibility={vis} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 10, padding: '4px 10px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {[
            { label: 'STABLE', color: '#4aff4a' },
            { label: 'WARPED', color: '#ffcc44' },
            { label: 'VOLATILE', color: '#ff4444' },
            { label: 'CURSED', color: '#ff2244' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 5, height: 5, borderRadius: 2,
                border: `1px solid ${color}`,
                background: `${color}20`,
              }} />
              <span style={{ fontSize: 5, color: '#555', letterSpacing: 0.5 }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 7, height: 1.5, background: '#a855f7' }} />
            <span style={{ fontSize: 5, color: '#555' }}>PATH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: '#333', fontSize: 7 }}>?</span>
            <span style={{ fontSize: 5, color: '#555' }}>UNKNOWN</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Biome region backgrounds ─────────────────────────────────────────

const BIOME_REGION_COLORS: Record<string, string> = {
  forest: 'rgba(30,60,30,0.1)',
  cave: 'rgba(40,30,60,0.1)',
  nordic: 'rgba(30,50,70,0.1)',
  volcanic: 'rgba(60,25,15,0.1)',
  final: 'rgba(50,10,50,0.1)',
};

function renderBiomeRegions(
  map: FracturedMap,
  positions: { x: number; y: number }[][],
  svgH: number,
): JSX.Element[] {
  const regions: JSX.Element[] = [];
  let regionStart = 0;
  let currentBiome = map.tiers[0]?.[0]?.biome;

  for (let t = 0; t <= map.tiers.length; t++) {
    const biome = t < map.tiers.length ? map.tiers[t][0]?.biome : null;
    if (biome !== currentBiome || t === map.tiers.length) {
      const x1 = positions[regionStart][0].x - 6;
      const x2 = t < positions.length
        ? positions[t][0].x - 6
        : positions[t - 1][0].x + NODE_W + 6;
      const bg = BIOME_REGION_COLORS[currentBiome || 'forest'] || 'transparent';
      const label = BIOME_LABELS[currentBiome || 'forest'] || currentBiome;

      // Only show biome label if region is at least partially visible
      const isVisible = regionStart <= map.currentTier + 1;

      regions.push(
        <div key={`region-${regionStart}`} style={{
          position: 'absolute',
          left: x1, top: 0,
          width: x2 - x1, height: svgH,
          background: bg,
          borderLeft: regionStart > 0 ? '1px dashed rgba(255,255,255,0.04)' : undefined,
          pointerEvents: 'none',
        }}>
          {isVisible && (
            <div style={{
              position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
              fontSize: 5, color: 'rgba(255,255,255,0.12)', whiteSpace: 'nowrap',
              letterSpacing: 0.8,
            }}>
              {label.toUpperCase()}
            </div>
          )}
        </div>
      );

      regionStart = t;
      currentBiome = biome || 'forest';
    }
  }

  return regions;
}
