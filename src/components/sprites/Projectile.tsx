import { GROUND_Y } from '../../constants';

interface Props {
  x: number;
  y: number;
  type: string;
  targetX?: number;
  radius?: number;
  duration?: number;
  chainTargets?: Array<{x: number, y: number}>;
  delayFrames?: number;
}

export default function Projectile({ x, y, type, targetX, radius, duration, chainTargets, delayFrames }: Props) {
  if (type === 'arrow') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1={15} y1={0} x2={0} y2={0} stroke="#8b5a2a" strokeWidth={2} />
        <polygon points="0,-3 -6,0 0,3" fill="#666" />
      </g>
    );
  }

  if (type === 'allyArrow') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1={-15} y1={0} x2={0} y2={0} stroke="#5a8b5a" strokeWidth={2} />
        <polygon points="0,-3 6,0 0,3" fill="#7f7" />
      </g>
    );
  }

  if (type === 'wizardBeam') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <line x1={0} y1={0} x2={60} y2={0} stroke="#aa55ff" strokeWidth={4} opacity={0.8} />
        <line x1={0} y1={0} x2={60} y2={0} stroke="#dd88ff" strokeWidth={2} />
        <circle cx={60} cy={0} r={6} fill="#aa55ff" opacity={0.6} />
        <circle cx={60} cy={0} r={3} fill="#fff" />
      </g>
    );
  }

  if (type === 'fireball') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={12} fill="#ff4400" opacity={0.8} />
        <circle cx={0} cy={0} r={8} fill="#ff6600" />
        <circle cx={0} cy={0} r={4} fill="#ffaa00" />
        <circle cx={-3} cy={-3} r={2} fill="#fff" opacity={0.7} />
      </g>
    );
  }

  if (type === 'laser') {
    const laserX = targetX || x;
    const opacity = duration ? Math.min(1, duration / 15) : 1;
    const r = radius || 50;
    return (
      <g>
        {/* Arrow rain - multiple arrow streaks falling */}
        <line x1={laserX - 8} y1={0} x2={laserX - 8} y2={GROUND_Y}
          stroke="#44aa22" strokeWidth={2} opacity={opacity * 0.4} />
        <line x1={laserX} y1={0} x2={laserX} y2={GROUND_Y}
          stroke="#66cc44" strokeWidth={3} opacity={opacity * 0.6} />
        <line x1={laserX + 8} y1={0} x2={laserX + 8} y2={GROUND_Y}
          stroke="#44aa22" strokeWidth={2} opacity={opacity * 0.4} />
        <line x1={laserX - 15} y1={0} x2={laserX - 15} y2={GROUND_Y}
          stroke="#2a6a1a" strokeWidth={1.5} opacity={opacity * 0.3} />
        <line x1={laserX + 15} y1={0} x2={laserX + 15} y2={GROUND_Y}
          stroke="#2a6a1a" strokeWidth={1.5} opacity={opacity * 0.3} />
        {/* Impact zone */}
        <circle cx={laserX} cy={GROUND_Y - 10} r={r} fill="#44aa22" opacity={opacity * 0.25} />
        <circle cx={laserX} cy={GROUND_Y - 10} r={r * 0.6} fill="#66cc44" opacity={opacity * 0.3} />
        {/* Arrow cluster glow at top */}
        <circle cx={laserX} cy={20} r={12} fill="#44aa22" opacity={opacity * 0.4} />
      </g>
    );
  }

  if (type === 'spectralBlast') {
    const blastX = targetX || x;
    const opacity = duration ? Math.min(1, duration / 15) : 1;
    const r = radius || 60;
    return (
      <g>
        {/* Spectral energy columns raining down */}
        <line x1={blastX - 12} y1={0} x2={blastX - 12} y2={GROUND_Y}
          stroke="#6622aa" strokeWidth={2.5} opacity={opacity * 0.4} />
        <line x1={blastX} y1={0} x2={blastX} y2={GROUND_Y}
          stroke="#8844cc" strokeWidth={4} opacity={opacity * 0.6} />
        <line x1={blastX + 12} y1={0} x2={blastX + 12} y2={GROUND_Y}
          stroke="#6622aa" strokeWidth={2.5} opacity={opacity * 0.4} />
        <line x1={blastX - 20} y1={0} x2={blastX - 20} y2={GROUND_Y}
          stroke="#440066" strokeWidth={1.5} opacity={opacity * 0.25} />
        <line x1={blastX + 20} y1={0} x2={blastX + 20} y2={GROUND_Y}
          stroke="#440066" strokeWidth={1.5} opacity={opacity * 0.25} />
        {/* Impact zone — purple AOE */}
        <circle cx={blastX} cy={GROUND_Y - 10} r={r} fill="#8844cc" opacity={opacity * 0.2} />
        <circle cx={blastX} cy={GROUND_Y - 10} r={r * 0.6} fill="#aa66ee" opacity={opacity * 0.25} />
        <circle cx={blastX} cy={GROUND_Y - 10} r={r * 0.3} fill="#44ffdd" opacity={opacity * 0.15} />
        {/* Spectral skull glow at top */}
        <circle cx={blastX} cy={20} r={14} fill="#8844cc" opacity={opacity * 0.35} />
        <circle cx={blastX} cy={20} r={7} fill="#44ffdd" opacity={opacity * 0.3} />
      </g>
    );
  }

  if (type === 'heroRanged') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={6} fill="#4a9fff" opacity={0.7} />
        <circle cx={0} cy={0} r={4} fill="#7abfff" />
        <circle cx={0} cy={0} r={2} fill="#fff" />
        <line x1={-8} y1={0} x2={-2} y2={0} stroke="#4a9fff" strokeWidth={2} opacity={0.5} />
      </g>
    );
  }

  if (type === 'healBeam') {
    // Vertical green glow column dropping from sky to target
    const targetY = y;
    const opacity = duration ? Math.min(1, duration / 10) : 1;
    return (
      <g>
        <line x1={x} y1={targetY - 80} x2={x} y2={targetY + 10}
          stroke="#4aff4a" strokeWidth={6} opacity={opacity * 0.4} />
        <line x1={x} y1={targetY - 80} x2={x} y2={targetY + 10}
          stroke="#aaffaa" strokeWidth={3} opacity={opacity * 0.7} />
        <line x1={x} y1={targetY - 80} x2={x} y2={targetY + 10}
          stroke="#fff" strokeWidth={1} opacity={opacity * 0.9} />
        <circle cx={x} cy={targetY} r={10} fill="#4aff4a" opacity={opacity * 0.3} />
        <circle cx={x} cy={targetY} r={5} fill="#aaffaa" opacity={opacity * 0.5} />
        <circle cx={x} cy={targetY - 80} r={6} fill="#4aff4a" opacity={opacity * 0.4} />
      </g>
    );
  }

  if (type === 'darkHeal') {
    // Dark necromantic energy rising from the ground — Lich restoration
    const targetY = y;
    const opacity = duration ? Math.min(1, duration / 10) : 1;
    return (
      <g>
        {/* Dark purple column rising from below */}
        <line x1={x} y1={targetY + 25} x2={x} y2={targetY - 50}
          stroke="#330044" strokeWidth={8} opacity={opacity * 0.5} />
        <line x1={x} y1={targetY + 25} x2={x} y2={targetY - 50}
          stroke="#6622aa" strokeWidth={4} opacity={opacity * 0.6} />
        <line x1={x} y1={targetY + 25} x2={x} y2={targetY - 50}
          stroke="#aa55ff" strokeWidth={1.5} opacity={opacity * 0.8} />
        {/* Ground eruption */}
        <circle cx={x} cy={targetY + 20} r={10} fill="#330044" opacity={opacity * 0.4} />
        <circle cx={x} cy={targetY + 20} r={5} fill="#6622aa" opacity={opacity * 0.5} />
        {/* Dark energy at target */}
        <circle cx={x} cy={targetY} r={8} fill="#6622aa" opacity={opacity * 0.3} />
        <circle cx={x} cy={targetY} r={4} fill="#aa55ff" opacity={opacity * 0.5} />
      </g>
    );
  }

  if (type === 'clericBolt') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={6} fill="#4aff4a" opacity={0.7} />
        <circle cx={0} cy={0} r={4} fill="#aaffaa" />
        <circle cx={0} cy={0} r={2} fill="#fff" />
      </g>
    );
  }

  if (type === 'clericChain') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={5} fill="#44ff88" opacity={0.6} />
        <circle cx={0} cy={0} r={3} fill="#88ffbb" />
        <circle cx={0} cy={0} r={1.5} fill="#fff" opacity={0.8} />
        <line x1={-6} y1={-2} x2={-2} y2={0} stroke="#44ff88" strokeWidth={1.5} opacity={0.5} />
        <line x1={-6} y1={2} x2={-2} y2={0} stroke="#44ff88" strokeWidth={1.5} opacity={0.5} />
      </g>
    );
  }

  if (type === 'crystalBolt') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <polygon points="0,-5 -3,0 0,5 3,0" fill="#55ddcc" opacity={0.9} />
        <polygon points="0,-3 -2,0 0,3 2,0" fill="#88ffee" />
        <circle cx={0} cy={0} r={2} fill="#fff" opacity={0.6} />
      </g>
    );
  }

  if (type === 'bombardShot') {
    const spin = (x * 0.2) % 360;
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={-6} cy={2} r={3} fill="#666" opacity={0.25} />
        <circle cx={-10} cy={4} r={2} fill="#555" opacity={0.15} />
        <g transform={`rotate(${spin}, 0, 0)`}>
          <circle cx={0} cy={0} r={6} fill="#444" />
          <circle cx={0} cy={0} r={5} fill="#666" />
          <circle cx={-1.5} cy={-1.5} r={2} fill="#888" opacity={0.6} />
        </g>
        <circle cx={3} cy={-4} r={1.5} fill="#ff8800" opacity={0.8} />
        <circle cx={4} cy={-5} r={1} fill="#ffcc00" />
      </g>
    );
  }

  if (type === 'iceball') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={10} fill="#4488cc" opacity={0.3} />
        <circle cx={0} cy={0} r={7} fill="#88ccff" opacity={0.7} />
        <circle cx={0} cy={0} r={4} fill="#bbddff" />
        <circle cx={0} cy={0} r={2} fill="#fff" />
        <circle cx={-5} cy={-3} r={2} fill="#aaddff" opacity={0.5} />
        <circle cx={4} cy={2} r={1.5} fill="#cceeFF" opacity={0.6} />
      </g>
    );
  }

  if (type === 'heroArrow') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Shaft */}
        <line x1={0} y1={0} x2={18} y2={0} stroke="#6b4226" strokeWidth={2} />
        {/* Arrowhead */}
        <polygon points="18,-3 24,0 18,3" fill="#aaa" />
        {/* Fletching */}
        <line x1={0} y1={0} x2={-4} y2={-4} stroke="#4a8f3f" strokeWidth={1.5} />
        <line x1={2} y1={0} x2={-2} y2={4} stroke="#4a8f3f" strokeWidth={1.5} />
      </g>
    );
  }

  if (type === 'boss') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={8} fill="#ff3333" opacity={0.8} />
        <circle cx={0} cy={0} r={5} fill="#ff6666" />
        <circle cx={0} cy={0} r={2} fill="#ffaaaa" />
      </g>
    );
  }

  if (type === 'chainLightning' && chainTargets && chainTargets.length >= 2) {
    const opacity = duration ? Math.min(1, duration / 10) : 1;
    return (
      <g opacity={opacity}>
        {chainTargets.map((pt, i) => {
          if (i === 0) return null;
          const prev = chainTargets[i - 1];
          // Zigzag lightning between points
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const midX = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 8;
          const midY = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 8;
          return (
            <g key={i}>
              {/* Outer glow */}
              <line x1={prev.x} y1={prev.y} x2={midX} y2={midY} stroke="#4488ff" strokeWidth={4} opacity={0.3} />
              <line x1={midX} y1={midY} x2={pt.x} y2={pt.y} stroke="#4488ff" strokeWidth={4} opacity={0.3} />
              {/* Core bolt */}
              <line x1={prev.x} y1={prev.y} x2={midX} y2={midY} stroke="#88ccff" strokeWidth={2} />
              <line x1={midX} y1={midY} x2={pt.x} y2={pt.y} stroke="#88ccff" strokeWidth={2} />
              {/* Bright center */}
              <line x1={prev.x} y1={prev.y} x2={midX} y2={midY} stroke="#ffffff" strokeWidth={1} opacity={0.8} />
              <line x1={midX} y1={midY} x2={pt.x} y2={pt.y} stroke="#ffffff" strokeWidth={1} opacity={0.8} />
              {/* Hit spark */}
              <circle cx={pt.x} cy={pt.y} r={4} fill="#88ccff" opacity={0.5} />
              <circle cx={pt.x} cy={pt.y} r={2} fill="#fff" opacity={0.7} />
            </g>
          );
        })}
      </g>
    );
  }

  if (type === 'meteorStrike') {
    const impactX = targetX || x;
    const opacity = duration ? Math.min(1, duration / 15) : 1;
    const r = radius || 120;
    return (
      <g>
        {/* Impact explosion */}
        <circle cx={impactX} cy={GROUND_Y - 10} r={r * 0.8} fill="#ff4400" opacity={opacity * 0.2} />
        <circle cx={impactX} cy={GROUND_Y - 10} r={r * 0.5} fill="#ff6600" opacity={opacity * 0.3} />
        <circle cx={impactX} cy={GROUND_Y - 10} r={r * 0.25} fill="#ffaa00" opacity={opacity * 0.4} />
        {/* Fire columns */}
        <line x1={impactX - 15} y1={0} x2={impactX - 15} y2={GROUND_Y} stroke="#ff4400" strokeWidth={3} opacity={opacity * 0.3} />
        <line x1={impactX} y1={0} x2={impactX} y2={GROUND_Y} stroke="#ff6600" strokeWidth={5} opacity={opacity * 0.5} />
        <line x1={impactX + 15} y1={0} x2={impactX + 15} y2={GROUND_Y} stroke="#ff4400" strokeWidth={3} opacity={opacity * 0.3} />
        {/* Top glow */}
        <circle cx={impactX} cy={20} r={16} fill="#ff4400" opacity={opacity * 0.4} />
        <circle cx={impactX} cy={20} r={8} fill="#ffaa00" opacity={opacity * 0.5} />
      </g>
    );
  }

  return null;
}
