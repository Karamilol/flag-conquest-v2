import { useRef } from 'react';

interface RagdollPart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  width: number;
  height: number;
  color: string;
  age: number;
  groundY: number;
  bounced: boolean;
}

type UnitKind = 'ally' | 'enemy' | 'archer' | 'wraith' | 'hound' | 'lich' | 'skeleton' | 'shadowAssassin';

interface TrackedUnit {
  x: number;
  y: number;
  type: 'ally' | 'enemy';
  kind: UnitKind;
}

interface UnitLike {
  id: number;
  x: number;
  y: number;
  health: number;
  lane?: number;
  isLichSkeleton?: boolean;
}

interface Props {
  allies: UnitLike[];
  enemies: UnitLike[];
  enemyArchers?: UnitLike[];
  enemyWraiths?: UnitLike[];
  enemyHounds?: UnitLike[];
  enemyLichs?: UnitLike[];
  enemyShadowAssassins?: UnitLike[];
}

let nextPartId = 1;

function createRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y, type } = unit;
  const isEnemy = type === 'enemy';
  // Enemies fly left when killed (hit from the right), allies fly right
  const dir = isEnemy ? -1 : 1;
  const baseId = nextPartId;
  nextPartId += 10;

  const parts: RagdollPart[] = [];

  // Head — flies highest
  parts.push({
    id: baseId,
    x: x + 8, y: y - 2,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -5 - Math.random() * 4,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 18,
    width: 8, height: 8,
    color: isEnemy ? '#6a9944' : '#aaaabc',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Torso — heaviest, doesn't fly far
  parts.push({
    id: baseId + 1,
    x: x + 5, y: y + 6,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 12, height: 14,
    color: isEnemy ? '#cc3333' : '#3a5a9f',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Weapon — spins fast, flies far
  parts.push({
    id: baseId + 2,
    x: x + (isEnemy ? 18 : 24), y: y - 4,
    vx: (Math.random() * 3 + 2) * dir,
    vy: -6 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 25,
    width: 3, height: 16,
    color: '#aaaabc',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left leg
  parts.push({
    id: baseId + 3,
    x: x + 6, y: y + 20,
    vx: (-Math.random() * 2 - 0.5) * dir,
    vy: -2 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 5, height: 8,
    color: isEnemy ? '#4a7733' : '#5a5a6a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right leg
  parts.push({
    id: baseId + 4,
    x: x + 14, y: y + 20,
    vx: (Math.random() * 2 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 5, height: 8,
    color: isEnemy ? '#4a7733' : '#5a5a6a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Shield/arm chunk (smaller piece)
  parts.push({
    id: baseId + 5,
    x: x + (isEnemy ? 2 : -2), y: y + 8,
    vx: (-Math.random() * 3 - 1) * dir,
    vy: -4 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 20,
    width: 6, height: 8,
    color: isEnemy ? '#666' : '#4a6abf',
    age: 0, groundY: y + 26, bounced: false,
  });

  return parts;
}

function createArcherRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1; // Enemies fly left
  const baseId = nextPartId;
  nextPartId += 10;

  const parts: RagdollPart[] = [];

  // Hood — dark green, flies highest
  parts.push({
    id: baseId,
    x: x + 8, y: y - 4,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -5 - Math.random() * 4,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 16,
    width: 10, height: 8,
    color: '#2a3a2a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Leather torso — brown, heaviest
  parts.push({
    id: baseId + 1,
    x: x + 6, y: y + 6,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 12, height: 12,
    color: '#5a4a3a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Bow — long, spins fast, flies far
  parts.push({
    id: baseId + 2,
    x: x - 2, y: y + 2,
    vx: (-Math.random() * 3 - 2) * dir,
    vy: -6 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 30,
    width: 3, height: 18,
    color: '#8b5a2a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Quiver — brown, tumbles off back
  parts.push({
    id: baseId + 3,
    x: x + 16, y: y + 2,
    vx: (Math.random() * 3 + 1) * dir * -1,
    vy: -4 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 18,
    width: 4, height: 12,
    color: '#4a3a2a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left boot
  parts.push({
    id: baseId + 4,
    x: x + 6, y: y + 22,
    vx: (-Math.random() * 2 - 0.5) * dir,
    vy: -2 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 5, height: 6,
    color: '#3a2a1a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right boot
  parts.push({
    id: baseId + 5,
    x: x + 14, y: y + 22,
    vx: (Math.random() * 2 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 5, height: 6,
    color: '#3a2a1a',
    age: 0, groundY: y + 26, bounced: false,
  });

  return parts;
}

function createWraithRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1; // Enemies fly left
  const baseId = nextPartId;
  nextPartId += 10;

  const parts: RagdollPart[] = [];

  // Hood — dark purple, flies highest
  parts.push({
    id: baseId,
    x: x + 10, y: y - 6,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -6 - Math.random() * 4,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 12, height: 10,
    color: '#1a0a2e',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Upper robe — large chunk (wraith is a tank)
  parts.push({
    id: baseId + 1,
    x: x + 8, y: y + 4,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 6,
    width: 16, height: 14,
    color: '#140820',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left bone claw — spins wildly
  parts.push({
    id: baseId + 2,
    x: x - 2, y: y + 8,
    vx: (-Math.random() * 3 - 2),
    vy: -5 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 25,
    width: 4, height: 10,
    color: '#b8a898',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right bone claw
  parts.push({
    id: baseId + 3,
    x: x + 22, y: y + 8,
    vx: (Math.random() * 3 + 2),
    vy: -5 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 25,
    width: 4, height: 10,
    color: '#b8a898',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Spectral robe fragment 1 — lower robe, drifts
  parts.push({
    id: baseId + 4,
    x: x + 6, y: y + 16,
    vx: (-Math.random() * 2 - 0.5) * dir,
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 10,
    width: 8, height: 10,
    color: '#2a1a3e',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Spectral robe fragment 2
  parts.push({
    id: baseId + 5,
    x: x + 14, y: y + 18,
    vx: (Math.random() * 2 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 12,
    width: 6, height: 8,
    color: '#0d0518',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Spectral essence — magenta orb-like fragment (the "soul")
  parts.push({
    id: baseId + 6,
    x: x + 12, y: y + 2,
    vx: (Math.random() - 0.5) * 2,
    vy: -7 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 6, height: 6,
    color: '#ff00ff',
    age: 0, groundY: y + 26, bounced: false,
  });

  return parts;
}

function createHoundRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1; // Enemies fly left
  const baseId = nextPartId;
  nextPartId += 10;

  const parts: RagdollPart[] = [];

  // Head — dark fur, flies high
  parts.push({
    id: baseId,
    x: x + 2, y: y + 4,
    vx: (Math.random() * 3 + 2) * dir,
    vy: -6 - Math.random() * 4,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 20,
    width: 8, height: 7,
    color: '#2a1a1a',
    age: 0, groundY: y + 22, bounced: false,
  });

  // Body chunk — largest piece
  parts.push({
    id: baseId + 1,
    x: x + 8, y: y + 10,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 12, height: 9,
    color: '#1a0e0a',
    age: 0, groundY: y + 22, bounced: false,
  });

  // Spiked collar — metal, spins fast
  parts.push({
    id: baseId + 2,
    x: x + 4, y: y + 8,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -5 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 25,
    width: 5, height: 3,
    color: '#aaa',
    age: 0, groundY: y + 22, bounced: false,
  });

  // Front leg
  parts.push({
    id: baseId + 3,
    x: x + 4, y: y + 18,
    vx: (-Math.random() * 2 - 1) * dir,
    vy: -3 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 16,
    width: 3, height: 7,
    color: '#4a2a2a',
    age: 0, groundY: y + 22, bounced: false,
  });

  // Back leg
  parts.push({
    id: baseId + 4,
    x: x + 16, y: y + 18,
    vx: (Math.random() * 2 + 1) * dir * -1,
    vy: -2 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 16,
    width: 3, height: 7,
    color: '#4a2a2a',
    age: 0, groundY: y + 22, bounced: false,
  });

  // Tail
  parts.push({
    id: baseId + 5,
    x: x + 20, y: y + 6,
    vx: (Math.random() * 3 + 1) * dir * -1,
    vy: -4 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 22,
    width: 2, height: 8,
    color: '#3a2a20',
    age: 0, groundY: y + 22, bounced: false,
  });

  return parts;
}

function createLichRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1; // Enemies fly left
  const baseId = nextPartId;
  nextPartId += 10;

  const parts: RagdollPart[] = [];

  // Skull — flies highest
  parts.push({
    id: baseId,
    x: x + 12, y: y - 2,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -7 - Math.random() * 4,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 10, height: 10,
    color: '#d4c8b0',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Crown — small metal piece, spins fast
  parts.push({
    id: baseId + 1,
    x: x + 14, y: y - 6,
    vx: (Math.random() * 3 + 1) * dir,
    vy: -8 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 20,
    width: 6, height: 3,
    color: '#8888aa',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Upper robe — large dark chunk
  parts.push({
    id: baseId + 2,
    x: x + 10, y: y + 10,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 6,
    width: 14, height: 16,
    color: '#0e0e1e',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Lower robe fragment
  parts.push({
    id: baseId + 3,
    x: x + 8, y: y + 30,
    vx: (-Math.random() * 2 - 0.5) * dir,
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 10,
    width: 10, height: 10,
    color: '#1a1a3a',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Staff — long, spins, flies far
  parts.push({
    id: baseId + 4,
    x: x + 24, y: y,
    vx: (Math.random() * 3 + 2) * dir * -1,
    vy: -6 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 18,
    width: 3, height: 22,
    color: '#5a4a35',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Left bone hand
  parts.push({
    id: baseId + 5,
    x: x, y: y + 20,
    vx: (-Math.random() * 3 - 1),
    vy: -4 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 22,
    width: 4, height: 6,
    color: '#b8a890',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Shoulder pauldron
  parts.push({
    id: baseId + 6,
    x: x + 6, y: y + 8,
    vx: (-Math.random() * 2 - 1) * dir,
    vy: -5 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 16,
    width: 6, height: 4,
    color: '#b8a890',
    age: 0, groundY: y + 40, bounced: false,
  });

  // Green soul essence — the necromantic energy escaping
  parts.push({
    id: baseId + 7,
    x: x + 14, y: y + 6,
    vx: (Math.random() - 0.5) * 3,
    vy: -9 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 6,
    width: 5, height: 5,
    color: '#44ff44',
    age: 0, groundY: y + 40, bounced: false,
  });

  return parts;
}

function createSkeletonRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1;
  const baseId = nextPartId;
  nextPartId += 8;

  const parts: RagdollPart[] = [];

  // Skull — flies highest, spins fast
  parts.push({
    id: baseId,
    x: x + 10, y: y - 2,
    vx: (Math.random() * 2.5 + 1) * dir,
    vy: -7 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 18,
    width: 8, height: 8,
    color: '#ddd8cc',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Ribcage — main body piece
  parts.push({
    id: baseId + 1,
    x: x + 6, y: y + 8,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 12, height: 12,
    color: '#c8c0b0',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left arm bone
  parts.push({
    id: baseId + 2,
    x: x + 2, y: y + 10,
    vx: (-Math.random() * 3 - 1),
    vy: -5 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 20,
    width: 3, height: 8,
    color: '#a8a090',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right arm + sword
  parts.push({
    id: baseId + 3,
    x: x + 20, y: y + 8,
    vx: (Math.random() * 3 + 1),
    vy: -4 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 16,
    width: 3, height: 14,
    color: '#8a8a8a',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left leg bone
  parts.push({
    id: baseId + 4,
    x: x + 7, y: y + 20,
    vx: (-Math.random() * 2 - 0.5) * dir,
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 3, height: 7,
    color: '#a8a090',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right leg bone
  parts.push({
    id: baseId + 5,
    x: x + 14, y: y + 20,
    vx: (Math.random() * 2 + 0.5) * dir,
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 3, height: 7,
    color: '#a8a090',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Green soul wisp — necromantic energy escaping
  parts.push({
    id: baseId + 6,
    x: x + 12, y: y + 4,
    vx: (Math.random() - 0.5) * 2,
    vy: -8 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 4,
    width: 4, height: 4,
    color: '#44ff44',
    age: 0, groundY: y + 26, bounced: false,
  });

  return parts;
}

function createShadowAssassinRagdollParts(unit: TrackedUnit): RagdollPart[] {
  const { x, y } = unit;
  const dir = -1;
  const baseId = nextPartId;
  nextPartId += 7;

  const parts: RagdollPart[] = [];

  // Hood/head — dark purple
  parts.push({
    id: baseId,
    x: x + 10, y: y,
    vx: (Math.random() * 2 + 1) * dir,
    vy: -6 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 14,
    width: 8, height: 8,
    color: '#1a0a2e',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Cloak — large dark piece
  parts.push({
    id: baseId + 1,
    x: x + 8, y: y + 8,
    vx: (Math.random() * 1.5 + 0.5) * dir,
    vy: -3 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 8,
    width: 10, height: 12,
    color: '#2a1040',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Dagger — small, spins fast, flies far
  parts.push({
    id: baseId + 2,
    x: x + 2, y: y + 14,
    vx: (-Math.random() * 4 - 2),
    vy: -5 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 24,
    width: 2, height: 8,
    color: '#c0c0c8',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Left leg
  parts.push({
    id: baseId + 3,
    x: x + 7, y: y + 20,
    vx: (-Math.random() * 2 - 0.5),
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 12,
    width: 3, height: 6,
    color: '#0e0418',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Right leg
  parts.push({
    id: baseId + 4,
    x: x + 14, y: y + 20,
    vx: (Math.random() * 2 + 0.5) * dir,
    vy: -2 - Math.random() * 2,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 12,
    width: 3, height: 6,
    color: '#0e0418',
    age: 0, groundY: y + 26, bounced: false,
  });

  // Purple soul wisp — escaping shadow energy
  parts.push({
    id: baseId + 5,
    x: x + 12, y: y + 4,
    vx: (Math.random() - 0.5) * 2,
    vy: -8 - Math.random() * 3,
    angle: 0,
    angularVel: (Math.random() - 0.5) * 4,
    width: 4, height: 4,
    color: '#cc44ff',
    age: 0, groundY: y + 26, bounced: false,
  });

  return parts;
}

const GRAVITY = 0.6;
const MAX_AGE = 90; // ~1.5 seconds at 60fps
const MAX_PARTICLES = 120;

export default function DeathEffects({ allies, enemies, enemyArchers = [], enemyWraiths = [], enemyHounds = [], enemyLichs = [], enemyShadowAssassins = [] }: Props) {
  const prevRef = useRef<Map<number, TrackedUnit>>(new Map());
  const particlesRef = useRef<RagdollPart[]>([]);

  // Build current alive set
  const current = new Map<number, TrackedUnit>();
  for (const a of allies) {
    if (a.health > 0) {
      current.set(a.id, { x: a.x, y: a.y + (a.lane || 0), type: 'ally', kind: 'ally' });
    }
  }
  for (const e of enemies) {
    if (e.health > 0) {
      current.set(e.id + 1000000, { x: e.x, y: e.y + (e.lane || 0), type: 'enemy', kind: e.isLichSkeleton ? 'skeleton' : 'enemy' });
    }
  }
  for (const a of enemyArchers) {
    if (a.health > 0) {
      current.set(a.id + 2000000, { x: a.x, y: a.y + (a.lane || 0), type: 'enemy', kind: 'archer' });
    }
  }
  for (const w of enemyWraiths) {
    if (w.health > 0) {
      current.set(w.id + 3000000, { x: w.x, y: w.y + (w.lane || 0), type: 'enemy', kind: 'wraith' });
    }
  }
  for (const h of enemyHounds) {
    if (h.health > 0) {
      current.set(h.id + 4000000, { x: h.x, y: h.y + (h.lane || 0), type: 'enemy', kind: 'hound' });
    }
  }
  for (const l of enemyLichs) {
    if (l.health > 0) {
      current.set(l.id + 5000000, { x: l.x, y: l.y + (l.lane || 0), type: 'enemy', kind: 'lich' });
    }
  }
  for (const sa of enemyShadowAssassins) {
    if (sa.health > 0) {
      current.set(sa.id + 6000000, { x: sa.x, y: sa.y + (sa.lane || 0), type: 'enemy', kind: 'shadowAssassin' });
    }
  }

  // Detect deaths — units that were alive last frame but aren't now
  for (const [id, unit] of prevRef.current) {
    if (!current.has(id)) {
      let parts: RagdollPart[];
      switch (unit.kind) {
        case 'archer': parts = createArcherRagdollParts(unit); break;
        case 'wraith': parts = createWraithRagdollParts(unit); break;
        case 'hound': parts = createHoundRagdollParts(unit); break;
        case 'lich': parts = createLichRagdollParts(unit); break;
        case 'skeleton': parts = createSkeletonRagdollParts(unit); break;
        case 'shadowAssassin': parts = createShadowAssassinRagdollParts(unit); break;
        default: parts = createRagdollParts(unit); break;
      }
      particlesRef.current.push(...parts);
    }
  }
  prevRef.current = current;

  // Cap total particles
  if (particlesRef.current.length > MAX_PARTICLES) {
    particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES);
  }

  // Physics step
  for (const p of particlesRef.current) {
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.angularVel;
    p.age++;

    // Ground collision — bounce with damping
    if (p.y > p.groundY && !p.bounced) {
      p.y = p.groundY;
      p.vy = -p.vy * 0.35;
      p.vx *= 0.6;
      p.angularVel *= 0.4;
      p.bounced = true;
    }
    // Second ground contact — stop
    if (p.y > p.groundY && p.bounced) {
      p.y = p.groundY;
      p.vy = 0;
      p.vx *= 0.85;
      p.angularVel *= 0.8;
    }
  }

  // Remove expired particles
  particlesRef.current = particlesRef.current.filter(p => p.age < MAX_AGE);

  if (particlesRef.current.length === 0) return null;

  return (
    <g>
      {particlesRef.current.map(p => {
        const opacity = Math.max(0, 1 - (p.age / MAX_AGE));
        // After 60% age, start fading faster
        const fadeOpacity = p.age > MAX_AGE * 0.6
          ? opacity * 0.5
          : opacity;
        return (
          <rect
            key={p.id}
            x={-p.width / 2}
            y={-p.height / 2}
            width={p.width}
            height={p.height}
            fill={p.color}
            opacity={fadeOpacity}
            transform={`translate(${p.x}, ${p.y}) rotate(${p.angle})`}
            rx={1}
          />
        );
      })}
    </g>
  );
}
