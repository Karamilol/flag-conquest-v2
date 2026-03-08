import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

// Club swing angles per attackCooldown frame (7=start → 0=end)
const SWING_ANGLES = [8, 30, 45, 10, -25, -15, -10, -5];

// Bounding box for the goblin body (accounts for ears, weapon swing, shadow)
const BODY_VB_X = -14;
const BODY_VB_Y = -16;
const BODY_VB_W = 48;
const BODY_VB_H = 48;

// Goblin colors (must match DetailedGoblin.tsx)
const skinGreen = '#6a9944';
const skinDark = '#4a7733';
const skinLight = '#8ab966';
const mouthColor = '#3a5522';
const loincloth = '#7a5a3a';
const loinclothDark = '#5a3a1a';
const weaponWood = '#6a4a2a';
const weaponMetal = '#666';
const wart = '#5a8833';

/**
 * Renders the goblin body SVG elements (no health bar, no effects).
 * headOffsetY bakes the "sniff" animation into the pre-rendered frame.
 * eyeScale bakes eye-blink (scaleY) into the pre-rendered frame.
 * armAngle bakes the shield-arm idle sway.
 */
function GoblinBody({ weaponAngle, headOffsetY = 0, eyeScale = 1, armAngle = 0 }: {
  weaponAngle: number;
  headOffsetY?: number;
  eyeScale?: number;
  armAngle?: number;
}) {
  // Compute arm sway transform (pivot at top-right of arm area)
  const armTransform = armAngle !== 0
    ? `translate(2, 8) rotate(${armAngle}) translate(-2, -8)`
    : undefined;

  return createElement('g', null,
    // Shadow
    createElement('ellipse', { cx: 12, cy: 26, rx: 9, ry: 3, fill: 'rgba(0,0,0,0.25)' }),

    // Body — flipped to face LEFT
    createElement('g', { transform: 'translate(24, 0) scale(-1, 1)' },

      // Back leg
      createElement('g', null,
        createElement('rect', { x: 6, y: 18, width: 4, height: 5, fill: skinDark }),
        createElement('circle', { cx: 8, cy: 20, r: 1.5, fill: skinGreen }),
        createElement('rect', { x: 4, y: 22, width: 6, height: 3, fill: skinDark, rx: 1 }),
        createElement('circle', { cx: 5, cy: 25, r: 1, fill: skinDark }),
        createElement('circle', { cx: 7, cy: 25.5, r: 1, fill: skinDark }),
        createElement('circle', { cx: 9, cy: 25, r: 1, fill: skinDark }),
        createElement('rect', { x: 4.5, y: 25, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 6.5, y: 25.5, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 8.5, y: 25, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
      ),

      // Body torso
      createElement('rect', { x: 5, y: 8, width: 14, height: 10, fill: skinGreen, rx: 1 }),
      createElement('ellipse', { cx: 12, cy: 14, rx: 6, ry: 5, fill: skinLight, opacity: 0.4 }),
      createElement('rect', { x: 7, y: 9, width: 8, height: 1, fill: skinDark, opacity: 0.3 }),
      createElement('rect', { x: 7, y: 11, width: 8, height: 1, fill: skinDark, opacity: 0.3 }),
      // Loincloth
      createElement('polygon', { points: '5,16 4,22 8,21 7,16', fill: loincloth }),
      createElement('polygon', { points: '7,16 7,22 11,21 10,16', fill: loinclothDark }),
      createElement('polygon', { points: '10,16 10,22 14,21 13,16', fill: loincloth }),
      createElement('polygon', { points: '13,16 13,21 17,22 16,16', fill: loinclothDark }),
      createElement('polygon', { points: '16,16 16,21 19,22 19,16', fill: loincloth }),
      createElement('rect', { x: 4, y: 15, width: 16, height: 2, fill: '#8a6a3a' }),
      createElement('circle', { cx: 12, cy: 16, r: 1.5, fill: '#aa8a4a' }),
      createElement('ellipse', { cx: 7, cy: 9, rx: 3, ry: 2, fill: skinDark, opacity: 0.4 }),
      createElement('circle', { cx: 17, cy: 11, r: 1, fill: wart }),
      createElement('circle', { cx: 8, cy: 14, r: 0.8, fill: wart }),

      // Front leg
      createElement('g', null,
        createElement('rect', { x: 13, y: 18, width: 4, height: 5, fill: skinGreen }),
        createElement('circle', { cx: 15, cy: 20, r: 1.5, fill: skinLight }),
        createElement('rect', { x: 12, y: 22, width: 6, height: 3, fill: skinGreen, rx: 1 }),
        createElement('circle', { cx: 13, cy: 25, r: 1, fill: skinGreen }),
        createElement('circle', { cx: 15, cy: 25.5, r: 1, fill: skinGreen }),
        createElement('circle', { cx: 17, cy: 25, r: 1, fill: skinGreen }),
        createElement('rect', { x: 12.5, y: 25, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 14.5, y: 25.5, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 16.5, y: 25, width: 1, height: 1.5, fill: '#aa9', rx: 0.3 }),
      ),

      // Left arm (clawed hand) — with idle sway baked in
      createElement('g', armTransform ? { transform: armTransform } : null,
        createElement('rect', { x: 1, y: 8, width: 4, height: 7, fill: skinDark }),
        createElement('circle', { cx: 3, cy: 12, r: 1.2, fill: skinGreen }),
        createElement('rect', { x: 0, y: 13, width: 4, height: 5, fill: skinGreen }),
        createElement('rect', { x: -1, y: 17, width: 4, height: 3, fill: skinGreen, rx: 1 }),
        createElement('rect', { x: -2, y: 19, width: 1, height: 2, fill: skinDark, rx: 0.3 }),
        createElement('rect', { x: 0, y: 19.5, width: 1, height: 2, fill: skinDark, rx: 0.3 }),
        createElement('rect', { x: 2, y: 19, width: 1, height: 2, fill: skinDark, rx: 0.3 }),
        createElement('rect', { x: -2, y: 20.5, width: 1, height: 1, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 0, y: 21, width: 1, height: 1, fill: '#aa9', rx: 0.3 }),
        createElement('rect', { x: 2, y: 20.5, width: 1, height: 1, fill: '#aa9', rx: 0.3 }),
      ),

      // Weapon arm — with rotation
      createElement('g', { transform: `translate(20, 8) rotate(${weaponAngle}) translate(-20, -8)` },
        createElement('g', null,
          createElement('rect', { x: 18, y: 8, width: 4, height: 6, fill: skinGreen }),
          createElement('rect', { x: 19, y: 13, width: 4, height: 4, fill: skinDark }),
          createElement('rect', { x: 20, y: 6, width: 3, height: 3, fill: skinGreen, rx: 0.5 }),
          // Club handle
          createElement('rect', { x: 21, y: -6, width: 3, height: 16, fill: weaponWood, rx: 0.5 }),
          createElement('rect', { x: 21, y: 6, width: 3, height: 1, fill: '#554422', opacity: 0.6 }),
          createElement('rect', { x: 21, y: 8, width: 3, height: 1, fill: '#554422', opacity: 0.6 }),
          // Crude metal head
          createElement('polygon', { points: '20,-6 24,-6 26,-10 25,-12 22,-14 19,-11 18,-8', fill: weaponMetal }),
          createElement('circle', { cx: 22, cy: -9, r: 1.5, fill: '#8a6644', opacity: 0.4 }),
          createElement('circle', { cx: 20, cy: -7, r: 1, fill: '#8a5533', opacity: 0.3 }),
          createElement('rect', { x: 25, y: -9, width: 1, height: 2, fill: '#555', rx: 0.3 }),
          createElement('rect', { x: 20, y: -6, width: 5, height: 2, fill: '#8a6a3a' }),
          createElement('line', { x1: 20, y1: -5, x2: 25, y2: -5, stroke: '#6a4a2a', strokeWidth: 0.8 }),
        ),
      ),

      // Head (oversized) — with sniff offset baked in
      createElement('g', headOffsetY !== 0 ? { transform: `translate(0, ${headOffsetY})` } : null,
        createElement('rect', { x: 3, y: -4, width: 18, height: 13, fill: skinGreen, rx: 3 }),
        createElement('rect', { x: 5, y: -4, width: 14, height: 3, fill: skinDark, rx: 2 }),
        createElement('rect', { x: 4, y: -1, width: 16, height: 2, fill: skinDark, rx: 1 }),

        // Eyes — with blink scale baked in
        createElement('g', eyeScale !== 1
          ? { transform: `translate(12, 3) scale(1, ${eyeScale}) translate(-12, -3)` }
          : null,
          createElement('ellipse', { cx: 7, cy: 3, rx: 3, ry: 2.5, fill: '#ffe' }),
          createElement('ellipse', { cx: 17, cy: 3, rx: 3, ry: 2.5, fill: '#ffe' }),
          createElement('ellipse', { cx: 8, cy: 3, rx: 2, ry: 2, fill: '#ffee00' }),
          createElement('ellipse', { cx: 18, cy: 3, rx: 2, ry: 2, fill: '#ffee00' }),
          createElement('ellipse', { cx: 8, cy: 3, rx: 0.8, ry: 2, fill: '#222' }),
          createElement('ellipse', { cx: 18, cy: 3, rx: 0.8, ry: 2, fill: '#222' }),
          createElement('circle', { cx: 7, cy: 2, r: 0.8, fill: '#fff', opacity: 0.6 }),
          createElement('circle', { cx: 17, cy: 2, r: 0.8, fill: '#fff', opacity: 0.6 }),
        ),

        // Nose
        createElement('polygon', { points: '11,4 13,4 12,7 10,6', fill: skinDark }),
        createElement('circle', { cx: 11, cy: 6, r: 0.6, fill: mouthColor }),
        createElement('circle', { cx: 13, cy: 6, r: 0.6, fill: mouthColor }),

        // Mouth — toothy grin
        createElement('rect', { x: 6, y: 7, width: 12, height: 3, fill: mouthColor, rx: 1 }),
        createElement('polygon', { points: '7,7 8,9 9,7', fill: '#ddc' }),
        createElement('polygon', { points: '9,7 10,8.5 11,7', fill: '#eee' }),
        createElement('polygon', { points: '13,7 14,9 15,7', fill: '#ddc' }),
        createElement('polygon', { points: '15,7 16,8.5 17,7', fill: '#eee' }),
        createElement('polygon', { points: '8,10 9,8 10,10', fill: '#ddc' }),
        createElement('polygon', { points: '14,10 15,8.5 16,10', fill: '#ddc' }),

        // Left ear
        createElement('polygon', { points: '3,0 -4,-2 -6,2 -3,4 3,4', fill: skinGreen }),
        createElement('polygon', { points: '2,0 -3,-1 -4,2 -2,3 2,3', fill: skinLight, opacity: 0.4 }),
        createElement('circle', { cx: -3, cy: 0, r: 1, fill: skinDark, opacity: 0.5 }),

        // Right ear + earring
        createElement('polygon', { points: '21,0 28,-2 30,2 27,4 21,4', fill: skinGreen }),
        createElement('polygon', { points: '22,0 27,-1 28,2 26,3 22,3', fill: skinLight, opacity: 0.4 }),
        createElement('circle', { cx: 28, cy: 3, r: 1, fill: '#aa8833' }),
        createElement('circle', { cx: 28, cy: 3, r: 0.5, fill: '#cc9944' }),

        // Face warts
        createElement('circle', { cx: 5, cy: 5, r: 0.8, fill: wart }),
        createElement('circle', { cx: 16, cy: 1, r: 0.7, fill: wart }),
      ),
    ),
  );
}

export interface GoblinSpriteCache {
  idle: string[];     // 8 idle frames with baked-in sub-animations
  attack: string[];   // indexed by attackCooldown [0..7]
}

// Number of idle animation frames to pre-render
export const IDLE_FRAME_COUNT = 8;

let cache: GoblinSpriteCache | null = null;

function renderPose(weaponAngle: number, headOffsetY = 0, eyeScale = 1, armAngle = 0): string {
  const markup = renderToStaticMarkup(createElement(GoblinBody, { weaponAngle, headOffsetY, eyeScale, armAngle }));
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BODY_VB_X} ${BODY_VB_Y} ${BODY_VB_W} ${BODY_VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

export function initGoblinSpriteCache(): GoblinSpriteCache {
  if (cache) return cache;

  // Pre-render 8 idle frames sampling the main sub-animations:
  // - Head sniff (3.5s cycle): mostly still, brief sniff at phases 5-7
  // - Eye blink (6s cycle): mostly open, brief close at phase 3
  // - Arm sway (2.5s cycle): gentle -1 to +1 degree rotation
  //
  // Phase:        0     1     2     3     4     5     6     7
  // Head Y:       0     0     0     0     0    -1    0.5  -0.5
  // Eye scale:    1     1     1    0.1    1     1     1     1
  // Arm angle:    0    -0.5  -1   -0.5    0    0.5    1    0.5
  const idleFrames: string[] = [
    renderPose(0, 0,    1,   0),     // 0: neutral
    renderPose(0, 0,    1,  -0.5),   // 1: arm sway left
    renderPose(0, 0,    1,  -1),     // 2: arm sway left max
    renderPose(0, 0,    0.1, -0.5),  // 3: blink + arm returning
    renderPose(0, 0,    1,   0),     // 4: neutral
    renderPose(0, -1,   1,   0.5),   // 5: sniff up + arm sway right
    renderPose(0, 0.5,  1,   1),     // 6: sniff down + arm sway right max
    renderPose(0, -0.5, 1,   0.5),   // 7: sniff recover + arm returning
  ];

  cache = {
    idle: idleFrames,
    attack: SWING_ANGLES.map(angle => renderPose(angle)),
  };

  return cache;
}
