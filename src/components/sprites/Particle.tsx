interface Props {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  driftX: number;
  isCrit?: boolean;
}

export default function Particle({ x, y, text, color, age, driftX, isCrit }: Props) {
  const opacity = Math.max(0, 1 - age / 90);
  const yOffset = -age * 0.5;
  const xOffset = age * driftX;

  return (
    <text x={x + xOffset} y={y + yOffset} fill={isCrit ? '#ffdd00' : color} opacity={opacity}
          fontSize={isCrit ? '16' : '12'} fontFamily="monospace" fontWeight="bold">
      {text}
    </text>
  );
}
