/** Generic sprite icon component — renders SVG files from public/sprites/ as <img> tags. */

interface Props {
  /** Path relative to public/sprites/, e.g. "relics/gel" (no .svg extension needed) */
  path: string;
  size?: number;
  style?: React.CSSProperties;
  fallback?: string; // emoji fallback if image fails
}

export function SpriteIcon({ path, size = 16, style, fallback }: Props) {
  const src = `sprites/${path}.svg`;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        imageRendering: 'auto',
        ...style,
      }}
      onError={fallback ? (e) => {
        // Replace with emoji fallback on load error
        const span = document.createElement('span');
        span.textContent = fallback;
        span.style.fontSize = `${size}px`;
        span.style.lineHeight = '1';
        (e.target as HTMLElement).replaceWith(span);
      } : undefined}
    />
  );
}
