/**
 * Generic sprite sheet renderer for SVG.
 * Displays a single frame from a grid-based sprite sheet using clipPath + image offset.
 */

interface Props {
  /** Sprite sheet URL (relative to public/) */
  src: string;
  /** Width of a single frame in pixels */
  frameW: number;
  /** Height of a single frame in pixels */
  frameH: number;
  /** Number of columns in the sheet */
  cols: number;
  /** Current frame index (0-based, left-to-right then top-to-bottom) */
  frameIndex: number;
  /** Display width in SVG units */
  displayW: number;
  /** Display height in SVG units */
  displayH: number;
  /** Flip horizontally (for facing left) */
  flipX?: boolean;
}

let clipIdCounter = 0;

export default function SpriteSheet({ src, frameW, frameH, cols, frameIndex, displayW, displayH, flipX }: Props) {
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);

  // Scale from frame pixels to display SVG units
  const scaleX = displayW / frameW;
  const scaleY = displayH / frameH;

  // Total sheet size in display units
  const sheetW = (frameW * cols) * scaleX / scaleX; // We'll work in frame-pixel space and scale the whole thing

  // Offset to shift the correct frame into view
  const offsetX = -col * frameW * scaleX;
  const offsetY = -row * frameH * scaleY;

  // Total sheet dimensions in display units
  const totalW = cols * displayW;
  const totalRows = Math.ceil(4 / cols); // assuming 4 frames max for now
  const totalH = totalRows * displayH;

  // Unique clip ID per instance
  const clipId = `sprclip-${src.replace(/[^a-z0-9]/gi, '')}-${frameIndex}`;

  return (
    <g transform={flipX ? `scale(-1,1) translate(${-displayW},0)` : undefined}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={displayW} height={displayH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={src}
          x={offsetX}
          y={offsetY}
          width={totalW}
          height={totalH}
          style={{ imageRendering: 'pixelated' }}
        />
      </g>
    </g>
  );
}
