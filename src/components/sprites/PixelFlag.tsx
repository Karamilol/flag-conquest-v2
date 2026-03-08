import { COLORS, FLAG_HEIGHT, GROUND_Y, BUILDING_DEFS } from '../../constants';

interface Props {
  x: number;
  captured: boolean;
  id: number;
  isBossFlag?: boolean;
  corrupted?: boolean;
  contested?: boolean;
  contestTimer?: number;
  buildingType?: string;
  bannerId?: string;
  onShowTooltip?: (text: string, clientX: number, clientY: number) => void;
  onHideTooltip?: () => void;
}

export default function PixelFlag({ x, captured, id, isBossFlag, corrupted, contested, contestTimer, buildingType, bannerId, onShowTooltip, onHideTooltip }: Props) {
  const isContesting = contested && !captured;
  const flagColor = isContesting ? '#ffffff' : corrupted ? '#1a1a1a' : captured ? COLORS.flagFriendly : COLORS.flagEnemy;
  const waveOffset = Math.sin(Date.now() * 0.005 + id) * 3;
  const bDef = buildingType ? BUILDING_DEFS[buildingType] : null;
  const active = captured && !corrupted && !isContesting;
  const statusLabel = active ? 'Active' : corrupted ? 'Corrupted' : isContesting ? 'Contested' : 'Inactive';
  const tooltipText = bDef ? `${bDef.name} — ${bDef.desc} [${statusLabel}]` : '';

  return (
    <g transform={`translate(${x}, ${GROUND_Y - FLAG_HEIGHT})`}>
      {/* === LAYER 1: Building structure (behind everything) === */}
      {buildingType && !corrupted && (
        <g style={{ cursor: 'pointer' }}
          onPointerEnter={(e) => onShowTooltip?.(tooltipText, e.clientX, e.clientY)}
          onPointerLeave={() => onHideTooltip?.()}>
          {/* Scaled 3.4x, anchored to ground level */}
          <g transform={`translate(-50, ${FLAG_HEIGHT - 32 * 3.4}) scale(3.4)`}>
            {buildingType === 'barracks' && (
              <>
                {/* === BARRACKS — Fortified stone military hall with integrated tower === */}
                {/* Stone foundation — covers x=2 to x=30 */}
                <rect x={2} y={29} width={28} height={3} fill={active ? '#3a4a6a' : '#2a2a3a'} />
                <rect x={3} y={29} width={26} height={0.6} fill={active ? '#4a5a7a' : '#3a3a4a'} opacity={0.4} />
                {/* Main hall body (x=3 to x=22) */}
                <rect x={3} y={10} width={19} height={19} fill={active ? '#4a6a9f' : '#3a3a5a'} />
                <rect x={4} y={11} width={17} height={0.8} fill={active ? '#5a7aaf' : '#4a4a6a'} opacity={0.3} />
                {/* Stone block texture */}
                <line x1={3} y1={15} x2={22} y2={15} stroke={active ? '#3a5a8f' : '#2a2a4a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={3} y1={20} x2={22} y2={20} stroke={active ? '#3a5a8f' : '#2a2a4a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={3} y1={25} x2={22} y2={25} stroke={active ? '#3a5a8f' : '#2a2a4a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={10} y1={10} x2={10} y2={29} stroke={active ? '#3a5a8f' : '#2a2a4a'} strokeWidth={0.2} opacity={0.15} />
                <line x1={17} y1={10} x2={17} y2={29} stroke={active ? '#3a5a8f' : '#2a2a4a'} strokeWidth={0.2} opacity={0.15} />
                {/* === Guard tower (right side, x=22 to x=29) === */}
                <rect x={22} y={4} width={7} height={25} fill={active ? '#3a5a8f' : '#2a2a4a'} />
                <rect x={22.5} y={5} width={6} height={0.8} fill={active ? '#4a6a9f' : '#3a3a5a'} opacity={0.3} />
                {/* Tower stone texture */}
                <line x1={22} y1={10} x2={29} y2={10} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.2} opacity={0.2} />
                <line x1={22} y1={16} x2={29} y2={16} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.2} opacity={0.2} />
                <line x1={22} y1={22} x2={29} y2={22} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.2} opacity={0.2} />
                {/* Tower battlements */}
                <rect x={22} y={0} width={7} height={2.5} fill={active ? '#3a5a8f' : '#2a2a4a'} />
                <rect x={22} y={-2} width={2.5} height={2.5} fill={active ? '#2a4a7f' : '#1a1a3a'} />
                <rect x={26.5} y={-2} width={2.5} height={2.5} fill={active ? '#2a4a7f' : '#1a1a3a'} />
                {/* Merlon highlights */}
                <rect x={22} y={-2} width={2.5} height={0.5} fill={active ? '#4a6a9f' : '#3a3a5a'} opacity={0.4} />
                <rect x={26.5} y={-2} width={2.5} height={0.5} fill={active ? '#4a6a9f' : '#3a3a5a'} opacity={0.4} />
                {/* Tower arrow slit */}
                <rect x={24.5} y={10} width={1.5} height={5} fill={active ? '#1a2a3a' : '#1a1a1a'} />
                <rect x={24} y={12} width={2.5} height={1} fill={active ? '#1a2a3a' : '#1a1a1a'} />
                {/* Tower door */}
                <rect x={23} y={22} width={5} height={7} fill={active ? '#4a2a1a' : '#222'} />
                <rect x={23} y={22} width={5} height={1} fill={active ? '#3a1a0a' : '#1a1a1a'} />
                {/* Roof — slate with ridge line */}
                <polygon points="3,10 12.5,0 22,10" fill={active ? '#3a5a8f' : '#2a2a4a'} />
                <polygon points="3,10 12.5,0 12.5,2 5,10" fill={active ? '#4a6a9f' : '#3a3a5a'} opacity={0.35} />
                <line x1={3} y1={10} x2={22} y2={10} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.5} />
                {/* Roof shingle lines — (3,10)→(12.5,0)→(22,10). At y=7: x=5.85 to 19.15; y=4: x=8.7 to 16.3 */}
                <line x1={5.85} y1={7} x2={19.15} y2={7} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.25} opacity={0.3} />
                <line x1={8.7} y1={4} x2={16.3} y2={4} stroke={active ? '#2a4a7f' : '#1a1a3a'} strokeWidth={0.25} opacity={0.3} />
                {/* Windows — arched tops with warm glow */}
                <rect x={5} y={14} width={4.5} height={5} fill={active ? '#1a2a3a' : '#222'} />
                <ellipse cx={7.25} cy={14} rx={2.25} ry={1.5} fill={active ? '#1a2a3a' : '#222'} />
                {active && <rect x={5.5} y={14.5} width={3.5} height={4} fill="#ddaa44" opacity={0.15} />}
                <rect x={5} y={16} width={4.5} height={0.5} fill={active ? '#6a9ab8' : '#333'} opacity={0.4} />
                <line x1={7.25} y1={12.5} x2={7.25} y2={19} stroke={active ? '#4a6a8a' : '#333'} strokeWidth={0.4} />
                <rect x={15} y={14} width={4.5} height={5} fill={active ? '#1a2a3a' : '#222'} />
                <ellipse cx={17.25} cy={14} rx={2.25} ry={1.5} fill={active ? '#1a2a3a' : '#222'} />
                {active && <rect x={15.5} y={14.5} width={3.5} height={4} fill="#ddaa44" opacity={0.15} />}
                <rect x={15} y={16} width={4.5} height={0.5} fill={active ? '#6a9ab8' : '#333'} opacity={0.4} />
                <line x1={17.25} y1={12.5} x2={17.25} y2={19} stroke={active ? '#4a6a8a' : '#333'} strokeWidth={0.4} />
                {/* Arched doorway */}
                <rect x={10} y={18} width={6} height={11} fill={active ? '#2a1a0a' : '#1a1a1a'} />
                <ellipse cx={13} cy={18} rx={3} ry={2.5} fill={active ? '#2a1a0a' : '#1a1a1a'} />
                {/* Door frame */}
                <rect x={9.5} y={18} width={0.8} height={11} fill={active ? '#5a3a2a' : '#333'} />
                <rect x={15.7} y={18} width={0.8} height={11} fill={active ? '#5a3a2a' : '#333'} />
                <ellipse cx={13} cy={18} rx={3.3} ry={2.8} fill="none" stroke={active ? '#5a3a2a' : '#333'} strokeWidth={0.8} />
                {/* Door handle */}
                <circle cx={14.5} cy={24} r={0.6} fill={active ? '#cc9944' : '#555'} />
                {/* Weapon rack on left wall (inside building) */}
                <line x1={3.5} y1={18} x2={3.5} y2={29} stroke={active ? '#6b4423' : '#333'} strokeWidth={0.5} />
                <line x1={4.5} y1={14} x2={4} y2={29} stroke={active ? '#999' : '#444'} strokeWidth={0.4} />
                <polygon points="4.5,14 4,15 5,15" fill={active ? '#aaa' : '#555'} />
                {/* Wall-mounted torch (left of door, on wall) */}
                <line x1={9} y1={18} x2={9} y2={22} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.6} />
                {active && (
                  <>
                    <ellipse cx={9} cy={17} rx={1} ry={1.5} fill="#ff6633" opacity={0.5 + Math.sin(Date.now() * 0.008) * 0.15} />
                    <ellipse cx={9} cy={16.5} rx={0.5} ry={1} fill="#ffcc66" opacity={0.4 + Math.sin(Date.now() * 0.01 + 0.5) * 0.15} />
                  </>
                )}
                {/* Banner on tower wall (inside bounds) */}
                {active && (
                  <>
                    <line x1={28} y1={4} x2={28} y2={14} stroke="#8b7355" strokeWidth={0.6} />
                    <polygon points="28,5 22,7 22,11 28,9" fill="#cc3333" opacity={0.85} />
                    <polygon points="28,5 22,7 22,8 28,6" fill="#dd4444" opacity={0.3} />
                  </>
                )}
              </>
            )}

            {buildingType === 'church' && (
              <>
                {/* === CHURCH — Stone chapel with bell tower, stained glass window, arched door === */}
                {/* Stone foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#6a6a6a' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#777' : '#333'} opacity={0.4} />
                {/* === 1. Buttresses (behind nave) === */}
                <polygon points="-1,29 -1,22 1,16 1,29" fill={active ? '#a09470' : '#2a2618'} />
                <polygon points="1,29 1,16 3,10 3,29" fill={active ? '#b0a480' : '#302a20'} />
                <polygon points="27,29 27,16 25,10 25,29" fill={active ? '#b0a480' : '#302a20'} />
                <polygon points="29,29 29,22 27,16 27,29" fill={active ? '#a09470' : '#2a2618'} />
                {/* === 2. Main nave body (covers inner buttress edges) === */}
                <rect x={3} y={10} width={22} height={19} fill={active ? '#c4b898' : '#3a3828'} />
                {/* Stone block texture — horizontal mortar */}
                <line x1={3} y1={14} x2={25} y2={14} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.3} opacity={0.35} />
                <line x1={3} y1={18} x2={25} y2={18} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.3} opacity={0.35} />
                <line x1={3} y1={22} x2={25} y2={22} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.3} opacity={0.35} />
                <line x1={3} y1={26} x2={25} y2={26} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.3} opacity={0.35} />
                {/* Vertical mortar (offset rows) */}
                <line x1={9} y1={10} x2={9} y2={14} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={14} y1={10} x2={14} y2={14} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={19} y1={10} x2={19} y2={14} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={6} y1={14} x2={6} y2={18} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={11} y1={14} x2={11} y2={18} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={17} y1={14} x2={17} y2={18} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                <line x1={22} y1={14} x2={22} y2={18} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.25} />
                {/* === 3. Bell tower body (behind roof — extends down to y=6 so roof covers base) === */}
                <rect x={10.5} y={-3} width={7} height={9} fill={active ? '#c4b898' : '#3a3828'} />
                <line x1={10.5} y1={0} x2={17.5} y2={0} stroke={active ? '#b0a480' : '#2a2a20'} strokeWidth={0.2} opacity={0.4} />
                {/* Bell arch opening */}
                <rect x={12.5} y={-2} width={3} height={2.5} fill={active ? '#1a1515' : '#111'} />
                <path d="M12.5,-2 Q14,-3.5 15.5,-2" fill={active ? '#1a1515' : '#111'} />
                {/* Bell */}
                <path d="M13,-0.5 Q13,-1.5 14,-1.5 Q15,-1.5 15,-0.5 Z" fill={active ? '#c4a030' : '#444'} />
                <rect x={13.7} y={-2} width={0.6} height={0.8} fill={active ? '#d4b040' : '#555'} />
                {/* === 4. Roof (covers tower base + nave top) === */}
                <polygon points="1,10 14,1 27,10" fill={active ? '#6a4a2a' : '#2a2520'} />
                <polygon points="1,10 14,1 14,2.5 3,10" fill={active ? '#7a5a3a' : '#333'} opacity={0.35} />
                <line x1={1} y1={10} x2={27} y2={10} stroke={active ? '#5a3a1a' : '#1a1a18'} strokeWidth={0.6} />
                {/* === 5. Tower cap + cross (on top of everything) === */}
                <polygon points="9.5,-3 14,-9 18.5,-3" fill={active ? '#6a4a2a' : '#2a2520'} />
                <polygon points="9.5,-3 14,-9 14,-7.5 11,-3" fill={active ? '#7a5a3a' : '#333'} opacity={0.3} />
                {/* Gold cross */}
                <rect x={13.3} y={-13} width={1.4} height={4.5} fill={active ? '#ffd700' : '#555'} />
                <rect x={11.8} y={-11.5} width={4.4} height={1.4} fill={active ? '#ffd700' : '#555'} />
                {active && <rect x={13.6} y={-12.5} width={0.8} height={1.8} fill="#ffee88" opacity={0.35} />}
                {/* === 6. Details on nave face === */}
                {/* Stained glass window */}
                <circle cx={14} cy={5.5} r={2.5} fill={active ? '#1a2240' : '#181818'} />
                <line x1={14} y1={3} x2={14} y2={8} stroke={active ? '#aa8830' : '#333'} strokeWidth={0.4} />
                <line x1={11.5} y1={5.5} x2={16.5} y2={5.5} stroke={active ? '#aa8830' : '#333'} strokeWidth={0.4} />
                {active && (
                  <>
                    <path d="M14,3 A2.5,2.5 0 0,0 11.5,5.5 L14,5.5 Z" fill="#4466aa" opacity={0.4} />
                    <path d="M14,3 A2.5,2.5 0 0,1 16.5,5.5 L14,5.5 Z" fill="#aa3333" opacity={0.35} />
                    <path d="M14,8 A2.5,2.5 0 0,1 11.5,5.5 L14,5.5 Z" fill="#cc9933" opacity={0.35} />
                    <path d="M14,8 A2.5,2.5 0 0,0 16.5,5.5 L14,5.5 Z" fill="#338844" opacity={0.35} />
                  </>
                )}
                <circle cx={14} cy={5.5} r={2.5} fill="none" stroke={active ? '#aa8830' : '#333'} strokeWidth={0.5} />
                {/* Side lancet windows */}
                <rect x={5} y={15} width={2} height={3.5} fill={active ? '#2a3555' : '#181818'} />
                <path d="M5,15 Q6,13.5 7,15" fill={active ? '#2a3555' : '#181818'} />
                {active && <rect x={5.2} y={15.5} width={1.6} height={2} fill="#4477aa" opacity={0.25} />}
                <rect x={21} y={15} width={2} height={3.5} fill={active ? '#2a3555' : '#181818'} />
                <path d="M21,15 Q22,13.5 23,15" fill={active ? '#2a3555' : '#181818'} />
                {active && <rect x={21.2} y={15.5} width={1.6} height={2} fill="#4477aa" opacity={0.25} />}
                {/* Arched doorway */}
                <rect x={11} y={22} width={6} height={7} fill={active ? '#3a2518' : '#1a1510'} />
                <path d="M11,22 Q14,17.5 17,22" fill={active ? '#3a2518' : '#1a1510'} />
                <rect x={11} y={22} width={0.6} height={7} fill={active ? '#8a7a5a' : '#2a2a20'} />
                <rect x={16.4} y={22} width={0.6} height={7} fill={active ? '#8a7a5a' : '#2a2a20'} />
                <path d="M11,22 Q14,17.5 17,22" fill="none" stroke={active ? '#8a7a5a' : '#2a2a20'} strokeWidth={0.5} />
                <line x1={14} y1={18} x2={14} y2={29} stroke={active ? '#2a1a10' : '#111'} strokeWidth={0.3} opacity={0.5} />
                <circle cx={15.5} cy={25} r={0.4} fill={active ? '#daa520' : '#444'} />
                {/* Candle stands */}
                <line x1={9} y1={25} x2={9} y2={29} stroke={active ? '#555' : '#333'} strokeWidth={0.4} />
                {active && <circle cx={9} cy={24.5} r={0.5} fill="#ffaa22" opacity={0.7 + Math.sin(Date.now() * 0.005) * 0.2} />}
                <line x1={19} y1={25} x2={19} y2={29} stroke={active ? '#555' : '#333'} strokeWidth={0.4} />
                {active && <circle cx={19} cy={24.5} r={0.5} fill="#ffaa22" opacity={0.7 + Math.sin(Date.now() * 0.005 + 1) * 0.2} />}
                {/* Holy glow */}
                {active && <circle cx={14} cy={5.5} r={5} fill="#ffd700" opacity={0.05 + Math.sin(Date.now() * 0.003) * 0.025} />}
              </>
            )}
            {buildingType === 'lumbercamp' && (
              <>
                {/* === LUMBER CAMP — Log cabin with saw bench, wood pile, tree stump === */}
                {/* Dirt/gravel foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#5a4a30' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#6a5a40' : '#333'} opacity={0.4} />
                {/* Main log cabin body */}
                <rect x={2} y={10} width={22} height={19} fill={active ? '#8a6538' : '#3a3a4a'} />
                {/* Log wall texture — horizontal log lines with rounded ends */}
                <line x1={2} y1={13} x2={24} y2={13} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.6} />
                <line x1={2} y1={16.5} x2={24} y2={16.5} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.6} />
                <line x1={2} y1={20} x2={24} y2={20} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.6} />
                <line x1={2} y1={23.5} x2={24} y2={23.5} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.6} />
                <line x1={2} y1={27} x2={24} y2={27} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.6} />
                {/* Log ends visible on left wall edge */}
                <circle cx={2} cy={13} r={1.2} fill={active ? '#8a6540' : '#3a3a3a'} />
                <circle cx={2} cy={16.5} r={1.2} fill={active ? '#8a6540' : '#3a3a3a'} />
                <circle cx={2} cy={20} r={1.2} fill={active ? '#8a6540' : '#3a3a3a'} />
                <circle cx={2} cy={23.5} r={1.2} fill={active ? '#8a6540' : '#3a3a3a'} />
                <circle cx={2} cy={27} r={1.2} fill={active ? '#8a6540' : '#3a3a3a'} />
                {/* Log end rings */}
                <circle cx={2} cy={13} r={0.5} fill="none" stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.2} />
                <circle cx={2} cy={16.5} r={0.5} fill="none" stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.2} />
                <circle cx={2} cy={20} r={0.5} fill="none" stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.2} />
                {/* Steep wooden roof */}
                <polygon points="0,10 13,0 26,10" fill={active ? '#5a3a18' : '#2a2a3a'} />
                <polygon points="0,10 13,0 13,2 2,10" fill={active ? '#6a4a28' : '#333'} opacity={0.3} />
                <line x1={0} y1={10} x2={26} y2={10} stroke={active ? '#4a2a10' : '#1a1a1a'} strokeWidth={0.6} />
                {/* Roof plank lines */}
                <line x1={3} y1={8} x2={7} y2={4} stroke={active ? '#4a2a10' : '#222'} strokeWidth={0.3} opacity={0.3} />
                <line x1={19} y1={8} x2={16} y2={5} stroke={active ? '#4a2a10' : '#222'} strokeWidth={0.3} opacity={0.3} />
                <line x1={23} y1={9} x2={20} y2={6} stroke={active ? '#4a2a10' : '#222'} strokeWidth={0.3} opacity={0.3} />
                {/* Window with cross frame */}
                <rect x={4} y={14} width={5} height={4.5} fill={active ? '#1a1a1a' : '#222'} />
                {active && <rect x={4.5} y={14.5} width={4} height={3.5} fill="#7799bb" opacity={0.25} />}
                <line x1={6.5} y1={14} x2={6.5} y2={18.5} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.4} />
                <line x1={4} y1={16.2} x2={9} y2={16.2} stroke={active ? '#5a3a18' : '#2a2a2a'} strokeWidth={0.4} />
                {/* Sturdy door */}
                <rect x={13} y={20} width={7} height={9} fill={active ? '#5a3518' : '#2a2a2a'} />
                <line x1={16.5} y1={20} x2={16.5} y2={29} stroke={active ? '#4a2a10' : '#1a1a1a'} strokeWidth={0.4} />
                {/* Door handle */}
                <rect x={18} y={24} width={0.8} height={1.5} fill={active ? '#888' : '#444'} rx={0.2} />
                {/* Door frame */}
                <rect x={12.5} y={20} width={0.8} height={9} fill={active ? '#5a3a18' : '#222'} />
                <rect x={19.7} y={20} width={0.8} height={9} fill={active ? '#5a3a18' : '#222'} />
                <rect x={12.5} y={19.5} width={8} height={1} fill={active ? '#5a3a18' : '#222'} />
                {/* === Axe leaning against right wall === */}
                {/* Handle — short diagonal, leaning on the building */}
                <line x1={26} y1={28.5} x2={25} y2={20} stroke={active ? '#8b6840' : '#444'} strokeWidth={0.9} strokeLinecap="round" />
                {/* Axe head — blade faces right */}
                <polygon points="25,20 27.5,18.5 27.5,21.5" fill={active ? '#c0c0c0' : '#555'} />
                <line x1={27.5} y1={18.5} x2={27.5} y2={21.5} stroke={active ? '#ddd' : '#666'} strokeWidth={0.3} />
                {/* === Chopping block (right side) === */}
                <rect x={28} y={26} width={5} height={3} fill={active ? '#7a5530' : '#3a3028'} rx={1} />
                <ellipse cx={30.5} cy={26} rx={2.5} ry={1} fill={active ? '#9a7550' : '#444'} />
                <ellipse cx={30.5} cy={26} rx={1.5} ry={0.5} fill={active ? '#aa8560' : '#4a4a4a'} />
                <ellipse cx={30.5} cy={26} rx={0.5} ry={0.2} fill={active ? '#6a4a28' : '#333'} />
                {/* Small split log halves on ground beside block */}
                <rect x={34} y={27.5} width={2} height={1.5} fill={active ? '#aa8855' : '#3a3028'} rx={0.4} />
                <rect x={36.5} y={28} width={1.8} height={1} fill={active ? '#9a7550' : '#3a3028'} rx={0.4} />
                {/* === Stacked logs (left of building, against wall) === */}
                {/* Bottom row — two logs on ground, tucked against building */}
                <rect x={-1} y={27.5} width={4} height={1.8} fill={active ? '#8a6540' : '#3a3028'} rx={0.8} />
                <rect x={-0.5} y={27.5} width={3.5} height={1.8} fill={active ? '#7a5a38' : '#3a3028'} rx={0.8} />
                {/* Top log — resting on bottom two */}
                <rect x={-0.5} y={25.8} width={3.5} height={1.8} fill={active ? '#9a7550' : '#4a3a2a'} rx={0.8} />
                {/* Log end circles (cross-section) */}
                <circle cx={-1} cy={28.4} r={0.7} fill={active ? '#aa8855' : '#444'} />
                <circle cx={-0.5} cy={28.4} r={0.7} fill={active ? '#9a7550' : '#3a3028'} />
                <circle cx={-0.5} cy={26.7} r={0.7} fill={active ? '#bb9965' : '#4a4a4a'} />
                {/* Ring detail on top log */}
                <circle cx={-0.5} cy={26.7} r={0.3} fill="none" stroke={active ? '#6a4a28' : '#333'} strokeWidth={0.2} />
                {/* Wood chips on ground */}
                <rect x={-2} y={28.8} width={1} height={0.4} fill={active ? '#aa8855' : '#3a3a3a'} opacity={0.5} />
                <rect x={26} y={28.8} width={0.8} height={0.4} fill={active ? '#aa8855' : '#3a3a3a'} opacity={0.4} />
                {/* Lantern hanging from eave */}
                <line x1={24} y1={10} x2={24} y2={12} stroke={active ? '#555' : '#333'} strokeWidth={0.3} />
                <rect x={23.3} y={12} width={1.5} height={2} fill={active ? '#444' : '#2a2a2a'} rx={0.3} />
                {active && <rect x={23.6} y={12.3} width={0.9} height={1.4} fill="#ffaa33" opacity={0.5 + Math.sin(Date.now() * 0.004) * 0.15} />}
                {active && <circle cx={24} cy={13} r={2} fill="#ffaa33" opacity={0.04 + Math.sin(Date.now() * 0.004) * 0.02} />}
              </>
            )}
            {buildingType === 'market' && (
              <>
                {/* === MARKET — Field supply depot / traveling merchant with war supplies === */}
                {/* Foundation / ground platform */}
                <rect x={-1} y={29} width={36} height={3} fill={active ? '#5a4a2a' : '#2a2a3a'} />
                {/* Back wall — sturdy wood */}
                <rect x={2} y={12} width={30} height={20} fill={active ? '#6a5a3a' : '#3a3a4a'} />
                <rect x={3} y={13} width={28} height={1} fill={active ? '#7a6a4a' : '#4a4a5a'} opacity={0.3} />
                {/* Wall plank texture */}
                <line x1={2} y1={17} x2={32} y2={17} stroke={active ? '#5a4a2a' : '#333'} strokeWidth={0.4} opacity={0.3} />
                <line x1={2} y1={22} x2={32} y2={22} stroke={active ? '#5a4a2a' : '#333'} strokeWidth={0.4} opacity={0.3} />
                <line x1={2} y1={27} x2={32} y2={27} stroke={active ? '#5a4a2a' : '#333'} strokeWidth={0.4} opacity={0.3} />
                {/* Awning — red & gold striped canopy */}
                <polygon points="-2,12 17,4 38,12" fill={active ? '#cc3333' : '#2a2a3a'} />
                <polygon points="-2,12 17,4 17,6 0,12" fill={active ? '#dd4444' : '#3a3a4a'} opacity={0.4} />
                {/* Awning stripes */}
                <polygon points="2,11 8,6 11,8 5,12" fill={active ? '#ddcc44' : '#333'} opacity={0.7} />
                <polygon points="14,8 20,4 23,6 17,10" fill={active ? '#ddcc44' : '#333'} opacity={0.7} />
                <polygon points="26,9 32,6 34,7 29,11" fill={active ? '#ddcc44' : '#333'} opacity={0.7} />
                {/* Awning scalloped edge */}
                <path d={`M-2,12 Q0,14 3,12 Q6,14 9,12 Q12,14 15,12 Q18,14 21,12 Q24,14 27,12 Q30,14 33,12 Q36,14 38,12`}
                      fill="none" stroke={active ? '#aa2222' : '#222'} strokeWidth={0.8} />
                {/* Support poles */}
                <rect x={0} y={10} width={1.5} height={22} fill={active ? '#6b4423' : '#333'} />
                <rect x={33} y={10} width={1.5} height={22} fill={active ? '#6b4423' : '#333'} />
                {/* Counter / display shelf */}
                <rect x={2} y={23} width={30} height={3} fill={active ? '#9b7b4b' : '#444'} />
                <rect x={2} y={23} width={30} height={1} fill={active ? '#ab8b5b' : '#555'} opacity={0.5} />
                <rect x={2} y={25} width={30} height={0.5} fill={active ? '#7a5a3a' : '#333'} opacity={0.6} />
                {/* === Goods: war supplies === */}
                {/* Sword + shield display (left) */}
                <line x1={6} y1={15} x2={6} y2={22} stroke={active ? '#aaa' : '#555'} strokeWidth={1} />
                <rect x={5} y={14.5} width={2} height={1.5} fill={active ? '#ddd' : '#666'} />
                <ellipse cx={9} cy={19} rx={2.5} ry={3} fill={active ? '#6a88aa' : '#444'} />
                <ellipse cx={9} cy={19} rx={1.5} ry={2} fill={active ? '#7a99bb' : '#555'} opacity={0.4} />
                {/* Potion bottles on counter */}
                <rect x={14} y={20} width={2} height={3} fill={active ? '#cc3333' : '#444'} rx={0.5} />
                <rect x={13.5} y={19.5} width={3} height={1} fill={active ? '#dd4444' : '#555'} rx={0.5} />
                <rect x={17} y={20.5} width={2} height={2.5} fill={active ? '#4488cc' : '#444'} rx={0.5} />
                <rect x={16.5} y={20} width={3} height={1} fill={active ? '#5599dd' : '#555'} rx={0.5} />
                <rect x={20} y={20} width={2} height={3} fill={active ? '#44cc66' : '#444'} rx={0.5} />
                <rect x={19.5} y={19.5} width={3} height={1} fill={active ? '#55dd77' : '#555'} rx={0.5} />
                {/* Scroll / map on counter */}
                <ellipse cx={26} cy={22.5} rx={2.5} ry={1} fill={active ? '#ddcc99' : '#444'} />
                <ellipse cx={26} cy={22.5} rx={2} ry={0.6} fill={active ? '#eedd aa' : '#555'} opacity={0.5} />
                <circle cx={24} cy={22.5} r={0.8} fill={active ? '#bb9966' : '#3a3a3a'} />
                <circle cx={28} cy={22.5} r={0.8} fill={active ? '#bb9966' : '#3a3a3a'} />
                {/* Armor piece on wall (back) */}
                <rect x={24} y={14} width={6} height={7} fill={active ? '#777' : '#444'} rx={1} />
                <rect x={25} y={15} width={4} height={5} fill={active ? '#888' : '#555'} rx={0.5} />
                <rect x={26} y={14} width={2} height={1} fill={active ? '#999' : '#555'} />
                {/* Hanging lantern (left) */}
                <line x1={8} y1={12} x2={8} y2={15} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.5} />
                <rect x={6.5} y={14.5} width={3} height={2.5} fill={active ? '#ffaa22' : '#444'} rx={0.8} />
                {active && <rect x={7} y={15} width={2} height={1.5} fill="#ffdd66" opacity={0.4 + Math.sin(Date.now() * 0.004) * 0.2} rx={0.5} />}
                {/* Hanging lantern (right) */}
                <line x1={26} y1={12} x2={26} y2={15} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.5} />
                <rect x={24.5} y={14.5} width={3} height={2.5} fill={active ? '#ffaa22' : '#444'} rx={0.8} />
                {active && <rect x={25} y={15} width={2} height={1.5} fill="#ffdd66" opacity={0.4 + Math.sin(Date.now() * 0.004 + 1) * 0.2} rx={0.5} />}
                {/* Crate stack (left side) */}
                <rect x={-4} y={26} width={6} height={6} fill={active ? '#8b6840' : '#3a3a3a'} />
                <line x1={-4} y1={29} x2={2} y2={29} stroke={active ? '#7a5a30' : '#333'} strokeWidth={0.4} />
                <line x1={-1} y1={26} x2={-1} y2={32} stroke={active ? '#7a5a30' : '#333'} strokeWidth={0.4} />
                <rect x={-3} y={22} width={5} height={4} fill={active ? '#9b7850' : '#444'} />
                <line x1={-0.5} y1={22} x2={-0.5} y2={26} stroke={active ? '#8a6840' : '#3a3a3a'} strokeWidth={0.4} />
                {/* Barrel (right side) */}
                <ellipse cx={36} cy={28} rx={3} ry={4} fill={active ? '#6b4423' : '#333'} />
                <ellipse cx={36} cy={28} rx={2.5} ry={3.5} fill={active ? '#7b5433' : '#3a3a3a'} />
                <line x1={33} y1={26} x2={39} y2={26} stroke={active ? '#8b6443' : '#444'} strokeWidth={0.6} />
                <line x1={33} y1={30} x2={39} y2={30} stroke={active ? '#8b6443' : '#444'} strokeWidth={0.6} />
                {/* Coin sign hanging from pole */}
                <line x1={34} y1={8} x2={34} y2={14} stroke={active ? '#8b7355' : '#555'} strokeWidth={0.8} />
                <circle cx={37} cy={11} r={3} fill={active ? '#ffd700' : '#555'} />
                <circle cx={37} cy={11} r={2.2} fill={active ? '#ffee44' : '#666'} />
                {active && <text x={37} y={12.5} fill="#aa8800" fontSize={3} textAnchor="middle" fontWeight="bold">$</text>}
                {/* Warm ambient glow when active */}
                {active && <ellipse cx={17} cy={22} rx={14} ry={6} fill="#ffaa22" opacity={0.04 + Math.sin(Date.now() * 0.003) * 0.02} />}
              </>
            )}

            {buildingType === 'surveySite' && (
              <>
                {/* === SURVEY SITE — Explorer's camp / archaeological dig === */}
                {/* Dirt/gravel foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#5a4a30' : '#2a2a3a'} />
                {/* === Canvas tent with wooden frame === */}
                {/* Tent canvas — large A-frame */}
                <polygon points="-1,29 17,6 35,29" fill={active ? '#7a7aaa' : '#3a3a5a'} />
                {/* Light side highlight */}
                <polygon points="-1,29 17,6 17,8 2,29" fill={active ? '#8a8abb' : '#4a4a6a'} opacity={0.4} />
                {/* Canvas texture lines */}
                <line x1={4} y1={24} x2={10} y2={12} stroke={active ? '#6a6a99' : '#333'} strokeWidth={0.3} opacity={0.4} />
                <line x1={24} y1={22} x2={20} y2={12} stroke={active ? '#6a6a99' : '#333'} strokeWidth={0.3} opacity={0.4} />
                <line x1={28} y1={26} x2={22} y2={14} stroke={active ? '#6a6a99' : '#333'} strokeWidth={0.3} opacity={0.4} />
                {/* Ridge pole on top */}
                <line x1={15} y1={6} x2={19} y2={6} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.8} />
                {/* Tent opening — dark interior */}
                <polygon points="10,29 17,14 24,29" fill={active ? '#2a2a3a' : '#1a1a2a'} />
                {/* Opening flap edge */}
                <line x1={10} y1={29} x2={17} y2={14} stroke={active ? '#6a6a99' : '#444'} strokeWidth={0.4} />
                <line x1={24} y1={29} x2={17} y2={14} stroke={active ? '#6a6a99' : '#444'} strokeWidth={0.4} />
                {/* Support poles */}
                <line x1={-1} y1={29} x2={-1} y2={31} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.8} />
                <line x1={35} y1={29} x2={35} y2={31} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.8} />
                {/* Center pole visible inside tent */}
                <line x1={17} y1={6} x2={17} y2={29} stroke={active ? '#5a4020' : '#2a2a2a'} strokeWidth={0.6} />
                {/* Guy ropes from ridge to ground stakes */}
                <line x1={17} y1={6} x2={-4} y2={31} stroke={active ? '#8a7a5a' : '#444'} strokeWidth={0.3} opacity={0.5} />
                <line x1={17} y1={6} x2={38} y2={31} stroke={active ? '#8a7a5a' : '#444'} strokeWidth={0.3} opacity={0.5} />
                {/* Ground stakes for guy ropes — driven deep into dirt */}
                <line x1={-4} y1={30} x2={-4} y2={32} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.7} />
                <line x1={38} y1={30} x2={38} y2={32} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.7} />
                {/* === Map table (left side, in front of tent) === */}
                {/* Table legs */}
                <line x1={0} y1={26} x2={0} y2={29} stroke={active ? '#5a4020' : '#333'} strokeWidth={0.6} />
                <line x1={7} y1={26} x2={7} y2={29} stroke={active ? '#5a4020' : '#333'} strokeWidth={0.6} />
                {/* Table top */}
                <rect x={-1} y={25} width={9} height={1.2} fill={active ? '#6a5030' : '#333'} rx={0.3} />
                {/* Rolled map / parchment on table */}
                <rect x={0} y={24.5} width={6} height={1} fill={active ? '#d4c8a0' : '#555'} rx={0.4} />
                <circle cx={0} cy={25} r={0.5} fill={active ? '#c4b890' : '#4a4a4a'} />
                <circle cx={6} cy={25} r={0.5} fill={active ? '#c4b890' : '#4a4a4a'} />
                {/* Compass on table */}
                <circle cx={2.5} cy={24.8} r={0.8} fill={active ? '#888' : '#444'} />
                <circle cx={2.5} cy={24.8} r={0.5} fill={active ? '#ddd' : '#555'} />
                <line x1={2.5} y1={24.3} x2={2.5} y2={24.8} stroke={active ? '#c33' : '#555'} strokeWidth={0.3} />
                {/* === Spyglass / telescope (right side) === */}
                {/* Tripod legs */}
                <line x1={32} y1={29} x2={33} y2={22} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.5} />
                <line x1={36} y1={29} x2={34} y2={22} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.5} />
                <line x1={30} y1={29} x2={33} y2={23} stroke={active ? '#6a5030' : '#333'} strokeWidth={0.5} />
                {/* Telescope tube */}
                <rect x={31} y={20.5} width={5} height={1.5} fill={active ? '#8a7a5a' : '#444'} rx={0.5} />
                <circle cx={36} cy={21.3} r={0.9} fill={active ? '#6a6a99' : '#3a3a5a'} />
                <circle cx={36} cy={21.3} r={0.5} fill={active ? '#9a9acc' : '#4a4a6a'} />
                {/* Lens glint */}
                {active && <circle cx={36.3} cy={21} r={0.3} fill="#ccccff" opacity={0.6} />}
                {/* === Small crate near tent entrance === */}
                <rect x={25} y={26.5} width={3} height={2.5} fill={active ? '#6a5535' : '#333'} />
                <line x1={25} y1={27.7} x2={28} y2={27.7} stroke={active ? '#5a4525' : '#2a2a2a'} strokeWidth={0.3} />
                <rect x={25.8} y={27} width={1.4} height={0.5} fill={active ? '#888' : '#444'} rx={0.2} />
                {/* === Excavation stakes in ground === */}
                <line x1={7} y1={28} x2={7} y2={30} stroke={active ? '#8a7a5a' : '#444'} strokeWidth={0.4} />
                <line x1={9} y1={28} x2={9} y2={30} stroke={active ? '#8a7a5a' : '#444'} strokeWidth={0.4} />
                {/* String between stakes */}
                <line x1={7} y1={28.5} x2={9} y2={28.5} stroke={active ? '#aa9960' : '#555'} strokeWidth={0.2} />
                {/* Glow */}
                {active && <circle cx={17} cy={16} r={6} fill="#8888ff" opacity={0.06 + Math.sin(Date.now() * 0.002) * 0.03} />}
              </>
            )}
            {buildingType === 'recruitmentCenter' && (
              <>
                {/* === BARRACKS — Stone military building with integrated tower === */}
                {/* Stone foundation — covers full footprint x=2 to x=30 */}
                <rect x={2} y={29} width={28} height={3} fill={active ? '#5a5a5a' : '#2a2a3a'} />
                <rect x={3} y={29} width={26} height={0.6} fill={active ? '#666' : '#333'} opacity={0.4} />
                {/* === Main building body (x=3 to x=22) === */}
                <rect x={3} y={8} width={19} height={21} fill={active ? '#5a6a8a' : '#3a3a4a'} />
                {/* Stone block texture */}
                <line x1={3} y1={12} x2={22} y2={12} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.3} opacity={0.4} />
                <line x1={3} y1={16} x2={22} y2={16} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.3} opacity={0.4} />
                <line x1={3} y1={20} x2={22} y2={20} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.3} opacity={0.4} />
                <line x1={3} y1={24} x2={22} y2={24} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.3} opacity={0.4} />
                {/* Vertical mortar */}
                <line x1={8} y1={8} x2={8} y2={12} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                <line x1={13} y1={8} x2={13} y2={12} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                <line x1={18} y1={8} x2={18} y2={12} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                <line x1={6} y1={12} x2={6} y2={16} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                <line x1={11} y1={12} x2={11} y2={16} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                <line x1={16} y1={12} x2={16} y2={16} stroke={active ? '#4a5a7a' : '#2a2a3a'} strokeWidth={0.2} opacity={0.3} />
                {/* === Corner tower (x=22 to x=29, fits on foundation) === */}
                <rect x={22} y={2} width={7} height={27} fill={active ? '#4a5a7a' : '#2a2a3a'} />
                {/* Tower stone texture */}
                <line x1={22} y1={6} x2={29} y2={6} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={22} y1={10} x2={29} y2={10} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={22} y1={14} x2={29} y2={14} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={22} y1={18} x2={29} y2={18} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={22} y1={22} x2={29} y2={22} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={22} y1={26} x2={29} y2={26} stroke={active ? '#3a4a6a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                {/* Tower battlement (x=22 to x=29, no overhang) */}
                <rect x={22} y={0} width={7} height={2.5} fill={active ? '#4a5a7a' : '#2a2a3a'} />
                <rect x={22} y={-2} width={2} height={2.5} fill={active ? '#5a6a8a' : '#333'} />
                <rect x={25.5} y={-2} width={2} height={2.5} fill={active ? '#5a6a8a' : '#333'} />
                {/* Merlon top highlights */}
                <rect x={22} y={-2} width={2} height={0.5} fill={active ? '#6a7a9a' : '#444'} opacity={0.5} />
                <rect x={25.5} y={-2} width={2} height={0.5} fill={active ? '#6a7a9a' : '#444'} opacity={0.5} />
                {/* Tower arrow slits */}
                <rect x={24.5} y={8} width={1} height={3} fill={active ? '#222' : '#111'} />
                <rect x={24.5} y={16} width={1} height={3} fill={active ? '#222' : '#111'} />
                {/* Tower cross emblem */}
                <line x1={25.5} y1={23} x2={25.5} y2={27} stroke={active ? '#6a7a9a' : '#444'} strokeWidth={0.5} />
                <line x1={24} y1={25} x2={27} y2={25} stroke={active ? '#6a7a9a' : '#444'} strokeWidth={0.5} />
                {/* === Main roof (slate, x=3 to x=22) === */}
                <polygon points="3,8 12.5,-4 22,8" fill={active ? '#3a4a6a' : '#222a3a'} />
                {/* Roof highlight (left slope) */}
                <polygon points="3,8 12.5,-4 12.5,-2 5,8" fill={active ? '#4a5a7a' : '#2a3040'} opacity={0.4} />
                {/* Roof ridge line */}
                <line x1={3} y1={8} x2={22} y2={8} stroke={active ? '#2a3a5a' : '#1a1a2a'} strokeWidth={0.6} />
                {/* Roof shingle lines — (3,8)→(12.5,-4)→(22,8). At y=4: x=5.63 to 19.37; y=1: x=7.94 to 17.06 */}
                <line x1={5.63} y1={4} x2={19.37} y2={4} stroke={active ? '#2a3a5a' : '#1a1a2a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={7.94} y1={1} x2={17.06} y2={1} stroke={active ? '#2a3a5a' : '#1a1a2a'} strokeWidth={0.3} opacity={0.3} />
                {/* === Arched windows === */}
                {/* Left window */}
                <rect x={5} y={13} width={5} height={5} fill={active ? '#222' : '#111'} />
                <path d="M5,13 Q7.5,10 10,13" fill={active ? '#222' : '#111'} />
                {active && <rect x={5.5} y={13.5} width={4} height={4} fill="#3a5a8a" opacity={0.3} />}
                <rect x={5} y={13} width={0.5} height={5} fill={active ? '#6a7a9a' : '#333'} />
                <rect x={9.5} y={13} width={0.5} height={5} fill={active ? '#6a7a9a' : '#333'} />
                <path d="M5,13 Q7.5,10 10,13" fill="none" stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.5} />
                <line x1={7.5} y1={10.5} x2={7.5} y2={18} stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.3} />
                <line x1={5} y1={15.5} x2={10} y2={15.5} stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.3} />
                {/* Right window */}
                <rect x={14} y={13} width={5} height={5} fill={active ? '#222' : '#111'} />
                <path d="M14,13 Q16.5,10 19,13" fill={active ? '#222' : '#111'} />
                {active && <rect x={14.5} y={13.5} width={4} height={4} fill="#3a5a8a" opacity={0.3} />}
                <rect x={14} y={13} width={0.5} height={5} fill={active ? '#6a7a9a' : '#333'} />
                <rect x={18.5} y={13} width={0.5} height={5} fill={active ? '#6a7a9a' : '#333'} />
                <path d="M14,13 Q16.5,10 19,13" fill="none" stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.5} />
                <line x1={16.5} y1={10.5} x2={16.5} y2={18} stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.3} />
                <line x1={14} y1={15.5} x2={19} y2={15.5} stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.3} />
                {/* === Main doorway === */}
                <rect x={9} y={21} width={7} height={8} fill={active ? '#3a2518' : '#1a1510'} />
                <path d="M9,21 Q12.5,16.5 16,21" fill={active ? '#3a2518' : '#1a1510'} />
                <rect x={9} y={21} width={0.6} height={8} fill={active ? '#6a7a9a' : '#333'} />
                <rect x={15.4} y={21} width={0.6} height={8} fill={active ? '#6a7a9a' : '#333'} />
                <path d="M9,21 Q12.5,16.5 16,21" fill="none" stroke={active ? '#6a7a9a' : '#333'} strokeWidth={0.5} />
                <line x1={12.5} y1={17.5} x2={12.5} y2={29} stroke={active ? '#2a1a10' : '#111'} strokeWidth={0.4} />
                {/* Door iron studs */}
                <circle cx={10.5} cy={23} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={14.5} cy={23} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={10.5} cy={26} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={14.5} cy={26} r={0.3} fill={active ? '#555' : '#333'} />
                {/* Door handles */}
                <circle cx={11.7} cy={25} r={0.4} fill="none" stroke={active ? '#666' : '#444'} strokeWidth={0.3} />
                <circle cx={13.3} cy={25} r={0.4} fill="none" stroke={active ? '#666' : '#444'} strokeWidth={0.3} />
                {/* === Notice board (on wall, left of door) === */}
                <rect x={4} y={21} width={4} height={4.5} fill={active ? '#5a4a2a' : '#2a2018'} />
                <rect x={4.3} y={21.3} width={3.4} height={3.9} fill={active ? '#ddc' : '#555'} />
                <rect x={4.6} y={21.6} width={1.3} height={1.5} fill={active ? '#eee' : '#666'} />
                <rect x={6.2} y={21.8} width={1.2} height={1.2} fill={active ? '#e8d8a0' : '#555'} />
                <rect x={4.8} y={23.5} width={1.5} height={0.8} fill={active ? '#ddd' : '#666'} />
                <circle cx={5.2} cy={21.7} r={0.2} fill={active ? '#cc4444' : '#444'} />
                <circle cx={6.7} cy={21.9} r={0.2} fill={active ? '#cc4444' : '#444'} />
                {/* === Spear leaning on wall (right of door) === */}
                <line x1={18} y1={13} x2={18.5} y2={29} stroke={active ? '#777' : '#444'} strokeWidth={0.3} />
                <polygon points="18,13 17.5,14.2 18.5,14.2" fill={active ? '#888' : '#555'} />
                {/* === Ambient barracks glow === */}
                {active && <ellipse cx={15} cy={18} rx={12} ry={10} fill="#5a6a8a" opacity={0.04 + Math.sin(Date.now() * 0.003) * 0.02} />}
              </>
            )}
            {buildingType === 'guardPost' && (
              <>
                {/* === GUARD POST — Stone watchtower with battlements, torch, weapon rack === */}
                {/* Stone foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#5a5a5a' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#666' : '#333'} opacity={0.4} />
                {/* === Main tower body === */}
                <rect x={6} y={5} width={16} height={24} fill={active ? '#8a7a5a' : '#3a3020'} />
                {/* Stone block texture */}
                <line x1={6} y1={9} x2={22} y2={9} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.3} opacity={0.4} />
                <line x1={6} y1={13} x2={22} y2={13} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.3} opacity={0.4} />
                <line x1={6} y1={17} x2={22} y2={17} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.3} opacity={0.4} />
                <line x1={6} y1={21} x2={22} y2={21} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.3} opacity={0.4} />
                <line x1={6} y1={25} x2={22} y2={25} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.3} opacity={0.4} />
                {/* Vertical mortar (alternating rows) */}
                <line x1={10} y1={5} x2={10} y2={9} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={14} y1={5} x2={14} y2={9} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={18} y1={5} x2={18} y2={9} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={8} y1={9} x2={8} y2={13} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={12} y1={9} x2={12} y2={13} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={16} y1={9} x2={16} y2={13} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                <line x1={20} y1={9} x2={20} y2={13} stroke={active ? '#7a6a4a' : '#2a2818'} strokeWidth={0.2} opacity={0.3} />
                {/* === Overhanging platform / machicolation === */}
                <rect x={4} y={1} width={20} height={4.5} fill={active ? '#7a6a4a' : '#2a2818'} />
                <rect x={4} y={1} width={20} height={0.8} fill={active ? '#8a7a5a' : '#333'} opacity={0.4} />
                {/* Support brackets under platform */}
                <polygon points="4,5.5 4,3.5 6,5.5" fill={active ? '#6a5a3a' : '#222'} />
                <polygon points="24,5.5 24,3.5 22,5.5" fill={active ? '#6a5a3a' : '#222'} />
                {/* === Battlements (merlons) === */}
                <rect x={4} y={-2} width={3.5} height={3.5} fill={active ? '#8a7a5a' : '#3a3020'} />
                <rect x={10} y={-2} width={3.5} height={3.5} fill={active ? '#8a7a5a' : '#3a3020'} />
                <rect x={14.5} y={-2} width={3.5} height={3.5} fill={active ? '#8a7a5a' : '#3a3020'} />
                <rect x={20.5} y={-2} width={3.5} height={3.5} fill={active ? '#8a7a5a' : '#3a3020'} />
                {/* Merlon top highlights */}
                <rect x={4} y={-2} width={3.5} height={0.5} fill={active ? '#9a8a6a' : '#444'} opacity={0.5} />
                <rect x={10} y={-2} width={3.5} height={0.5} fill={active ? '#9a8a6a' : '#444'} opacity={0.5} />
                <rect x={14.5} y={-2} width={3.5} height={0.5} fill={active ? '#9a8a6a' : '#444'} opacity={0.5} />
                <rect x={20.5} y={-2} width={3.5} height={0.5} fill={active ? '#9a8a6a' : '#444'} opacity={0.5} />
                {/* === Arrow slits === */}
                <rect x={9} y={8} width={1} height={3} fill={active ? '#222' : '#111'} />
                <rect x={18} y={8} width={1} height={3} fill={active ? '#222' : '#111'} />
                {/* === Shield emblem on wall === */}
                <path d="M14,14 L17.5,15.5 L16.5,19 L14,20 L11.5,19 L10.5,15.5 Z" fill={active ? '#cc9944' : '#4a4030'} />
                <path d="M14,14.8 L16.8,16 L16,19 L14,19.5 L12,19 L11.2,16 Z" fill={active ? '#ddb055' : '#555'} />
                {/* Shield cross detail */}
                <line x1={14} y1={14.8} x2={14} y2={19.5} stroke={active ? '#aa7722' : '#3a3020'} strokeWidth={0.4} />
                <line x1={11.2} y1={17} x2={16.8} y2={17} stroke={active ? '#aa7722' : '#3a3020'} strokeWidth={0.4} />
                {/* === Arched doorway === */}
                <rect x={11} y={22} width={6} height={7} fill={active ? '#3a2518' : '#1a1510'} />
                <path d="M11,22 Q14,18 17,22" fill={active ? '#3a2518' : '#1a1510'} />
                {/* Door frame */}
                <rect x={11} y={22} width={0.6} height={7} fill={active ? '#6a5a3a' : '#2a2a20'} />
                <rect x={16.4} y={22} width={0.6} height={7} fill={active ? '#6a5a3a' : '#2a2a20'} />
                <path d="M11,22 Q14,18 17,22" fill="none" stroke={active ? '#6a5a3a' : '#2a2a20'} strokeWidth={0.5} />
                {/* Door planks */}
                <line x1={14} y1={18.5} x2={14} y2={29} stroke={active ? '#2a1a10' : '#111'} strokeWidth={0.3} opacity={0.5} />
                {/* Door iron studs */}
                <circle cx={12.5} cy={24} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={15.5} cy={24} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={12.5} cy={27} r={0.3} fill={active ? '#555' : '#333'} />
                <circle cx={15.5} cy={27} r={0.3} fill={active ? '#555' : '#333'} />
                {/* Door handle ring */}
                <circle cx={15.8} cy={25.5} r={0.5} fill="none" stroke={active ? '#666' : '#444'} strokeWidth={0.3} />
                {/* === Wall torch bracket (on tower wall) === */}
                <line x1={6} y1={16} x2={3.5} y2={16} stroke={active ? '#555' : '#333'} strokeWidth={0.5} />
                <line x1={3.5} y1={14} x2={3.5} y2={16} stroke={active ? '#5a4a2a' : '#333'} strokeWidth={0.4} />
                {active && (
                  <>
                    <circle cx={3.5} cy={13.5} r={0.7} fill="#ffaa22" opacity={0.8 + Math.sin(Date.now() * 0.006) * 0.15} />
                    <circle cx={3.5} cy={12.5} r={0.4} fill="#ff6600" opacity={0.4 + Math.sin(Date.now() * 0.008) * 0.2} />
                  </>
                )}
                {/* === Weapon rack (leaning against right wall) === */}
                {/* Rack frame on wall */}
                <line x1={23} y1={18} x2={23} y2={29} stroke={active ? '#5a4a2a' : '#2a2018'} strokeWidth={0.5} />
                <line x1={22.2} y1={20} x2={23.8} y2={20} stroke={active ? '#5a4a2a' : '#2a2018'} strokeWidth={0.4} />
                <line x1={22.2} y1={24} x2={23.8} y2={24} stroke={active ? '#5a4a2a' : '#2a2018'} strokeWidth={0.4} />
                {/* Spear leaning against wall */}
                <line x1={24} y1={12} x2={24.5} y2={29} stroke={active ? '#777' : '#444'} strokeWidth={0.3} />
                <polygon points="24,12 23.5,13.2 24.5,13.2" fill={active ? '#888' : '#555'} />
                {/* Sword leaning */}
                <line x1={25} y1={18} x2={25.3} y2={29} stroke={active ? '#888' : '#555'} strokeWidth={0.3} />
                <rect x={24.5} y={24.5} width={1} height={0.5} fill={active ? '#aa8833' : '#444'} />
                {/* === Ambient guard glow === */}
                {active && <ellipse cx={14} cy={15} rx={12} ry={8} fill="#cc9944" opacity={0.04 + Math.sin(Date.now() * 0.003) * 0.02} />}
              </>
            )}
            {buildingType === 'warShrine' && (
              <>
                {/* === WAR SHRINE — Dark stone altar with twin braziers, glowing runes === */}
                {/* Wide stone base — three tiers */}
                <rect x={-2} y={29} width={38} height={3} fill={active ? '#4a4a4a' : '#2a2a3a'} />
                <rect x={0} y={27} width={34} height={3} fill={active ? '#555' : '#333'} />
                <rect x={2} y={25} width={30} height={3} fill={active ? '#5a5a5a' : '#2a2a3a'} />
                <rect x={0} y={27} width={34} height={0.6} fill={active ? '#666' : '#3a3a3a'} opacity={0.4} />
                {/* Central altar block */}
                <rect x={9} y={12} width={16} height={13} fill={active ? '#5a4a4a' : '#333'} />
                <rect x={10} y={13} width={14} height={0.8} fill={active ? '#6a5a5a' : '#3a3a4a'} opacity={0.3} />
                {/* Stone texture */}
                <line x1={9} y1={16} x2={25} y2={16} stroke={active ? '#4a3a3a' : '#2a2a2a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={9} y1={20} x2={25} y2={20} stroke={active ? '#4a3a3a' : '#2a2a2a'} strokeWidth={0.3} opacity={0.3} />
                {/* Peaked stone roof */}
                <polygon points="7,12 17,-2 27,12" fill={active ? '#4a3a3a' : '#2a2a3a'} />
                <polygon points="7,12 17,-2 17,0 9,12" fill={active ? '#5a4a4a' : '#333'} opacity={0.3} />
                <line x1={7} y1={12} x2={27} y2={12} stroke={active ? '#3a2a2a' : '#1a1a2a'} strokeWidth={0.6} />
                {/* Pillars */}
                <rect x={7} y={12} width={3} height={13} fill={active ? '#6a5a5a' : '#3a3a3a'} />
                <rect x={24} y={12} width={3} height={13} fill={active ? '#6a5a5a' : '#3a3a3a'} />
                {/* Pillar caps */}
                <rect x={6} y={11} width={5} height={2} fill={active ? '#7a6a6a' : '#444'} />
                <rect x={23} y={11} width={5} height={2} fill={active ? '#7a6a6a' : '#444'} />
                {/* Pillar bases */}
                <rect x={6} y={24} width={5} height={1.5} fill={active ? '#7a6a6a' : '#444'} />
                <rect x={23} y={24} width={5} height={1.5} fill={active ? '#7a6a6a' : '#444'} />
                {/* War emblem — red diamond with inner glow */}
                <polygon points="17,14 21,18 17,22 13,18" fill={active ? '#882222' : '#3a2a2a'} />
                <polygon points="17,15 20,18 17,21 14,18" fill={active ? '#aa3333' : '#444'} />
                {active && <polygon points="17,16 19,18 17,20 15,18" fill="#cc4444" opacity={0.5 + Math.sin(Date.now() * 0.004) * 0.2} />}
                {/* Glowing runes along altar base */}
                {active && (
                  <>
                    <rect x={11} y={23} width={1.5} height={1.5} fill="#dd4444" opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.25} rx={0.2} />
                    <rect x={15} y={23} width={1.5} height={1.5} fill="#dd4444" opacity={0.4 + Math.sin(Date.now() * 0.003 + 1.2) * 0.25} rx={0.2} />
                    <rect x={19} y={23} width={1.5} height={1.5} fill="#dd4444" opacity={0.4 + Math.sin(Date.now() * 0.003 + 2.4) * 0.25} rx={0.2} />
                  </>
                )}
                {!active && (
                  <>
                    <rect x={11} y={23} width={1.5} height={1.5} fill="#3a3a3a" opacity={0.3} rx={0.2} />
                    <rect x={15} y={23} width={1.5} height={1.5} fill="#3a3a3a" opacity={0.3} rx={0.2} />
                    <rect x={19} y={23} width={1.5} height={1.5} fill="#3a3a3a" opacity={0.3} rx={0.2} />
                  </>
                )}
                {/* Left brazier — bowl sitting directly on the 2nd tier (y=27) */}
                <rect x={-1} y={26} width={6} height={1.5} fill={active ? '#5a5050' : '#333'} />
                <polygon points="-2,24 6,24 5,27 -1,27" fill={active ? '#6a5a5a' : '#3a3a3a'} />
                <line x1={-2} y1={24} x2={6} y2={24} stroke={active ? '#7a6a6a' : '#444'} strokeWidth={0.6} />
                {/* Left fire */}
                {active && (
                  <>
                    <ellipse cx={2} cy={23} rx={3} ry={1.5} fill="#ff4422" opacity={0.4 + Math.sin(Date.now() * 0.007) * 0.15} />
                    <ellipse cx={2} cy={21.5} rx={2.2} ry={2} fill="#ff6633" opacity={0.45 + Math.sin(Date.now() * 0.009 + 0.5) * 0.15} />
                    <ellipse cx={2} cy={20} rx={1.4} ry={2} fill="#ff8844" opacity={0.5 + Math.sin(Date.now() * 0.011 + 1) * 0.15} />
                    <ellipse cx={2} cy={19} rx={0.7} ry={1.2} fill="#ffcc66" opacity={0.5 + Math.sin(Date.now() * 0.013 + 1.5) * 0.2} />
                  </>
                )}
                {!active && <ellipse cx={2} cy={25} rx={2.5} ry={0.8} fill="#332222" opacity={0.3} />}
                {/* Right brazier — bowl sitting directly on the 2nd tier (y=27) */}
                <rect x={29} y={26} width={6} height={1.5} fill={active ? '#5a5050' : '#333'} />
                <polygon points="28,24 36,24 35,27 29,27" fill={active ? '#6a5a5a' : '#3a3a3a'} />
                <line x1={28} y1={24} x2={36} y2={24} stroke={active ? '#7a6a6a' : '#444'} strokeWidth={0.6} />
                {/* Right fire */}
                {active && (
                  <>
                    <ellipse cx={32} cy={23} rx={3} ry={1.5} fill="#ff4422" opacity={0.4 + Math.sin(Date.now() * 0.007 + 2) * 0.15} />
                    <ellipse cx={32} cy={21.5} rx={2.2} ry={2} fill="#ff6633" opacity={0.45 + Math.sin(Date.now() * 0.009 + 2.5) * 0.15} />
                    <ellipse cx={32} cy={20} rx={1.4} ry={2} fill="#ff8844" opacity={0.5 + Math.sin(Date.now() * 0.011 + 3) * 0.15} />
                    <ellipse cx={32} cy={19} rx={0.7} ry={1.2} fill="#ffcc66" opacity={0.5 + Math.sin(Date.now() * 0.013 + 3.5) * 0.2} />
                  </>
                )}
                {!active && <ellipse cx={32} cy={25} rx={2.5} ry={0.8} fill="#332222" opacity={0.3} />}
                {/* Red gem finial at roof peak */}
                <circle cx={17} cy={-3} r={2} fill={active ? '#bb2222' : '#3a2a2a'} />
                <circle cx={17} cy={-3} r={1.2} fill={active ? '#dd3333' : '#444'} />
                {active && <circle cx={16.5} cy={-3.5} r={0.5} fill="#ff8888" opacity={0.7} />}
                {/* Blood red ambient glow */}
                {active && <ellipse cx={17} cy={18} rx={10} ry={7} fill="#dd2222" opacity={0.04 + Math.sin(Date.now() * 0.002) * 0.025} />}
              </>
            )}

            {buildingType === 'farm' && (
              <>
                {/* === FARM — Rustic timber-framed barn with thatched roof, hay, crops === */}
                {/* Ground / dirt patch */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#6a5a3a' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#7a6a4a' : '#333'} opacity={0.4} />
                {/* Main barn body — warm wood */}
                <rect x={2} y={10} width={22} height={19} fill={active ? '#8b5e3c' : '#3a3a4a'} />
                {/* Timber frame — horizontal beams */}
                <line x1={2} y1={14} x2={24} y2={14} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.8} />
                <line x1={2} y1={20} x2={24} y2={20} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.8} />
                <line x1={2} y1={26} x2={24} y2={26} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.8} />
                {/* Timber frame — vertical beams */}
                <line x1={2} y1={10} x2={2} y2={29} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={1} />
                <line x1={24} y1={10} x2={24} y2={29} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={1} />
                <line x1={13} y1={10} x2={13} y2={20} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.6} />
                {/* Timber frame — diagonal braces */}
                <line x1={2} y1={14} x2={7} y2={10} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.5} />
                <line x1={24} y1={14} x2={19} y2={10} stroke={active ? '#5a3a1a' : '#2a2a2a'} strokeWidth={0.5} />
                {/* Plank texture */}
                <line x1={6} y1={14} x2={6} y2={29} stroke={active ? '#7a4e2c' : '#333'} strokeWidth={0.2} opacity={0.3} />
                <line x1={10} y1={14} x2={10} y2={29} stroke={active ? '#7a4e2c' : '#333'} strokeWidth={0.2} opacity={0.3} />
                <line x1={16} y1={20} x2={16} y2={29} stroke={active ? '#7a4e2c' : '#333'} strokeWidth={0.2} opacity={0.3} />
                <line x1={20} y1={14} x2={20} y2={29} stroke={active ? '#7a4e2c' : '#333'} strokeWidth={0.2} opacity={0.3} />
                {/* Thatched roof */}
                <polygon points="-1,10 13,-2 27,10" fill={active ? '#b8943a' : '#2a2a3a'} />
                <polygon points="-1,10 13,-2 13,0 1,10" fill={active ? '#c8a44a' : '#3a3a4a'} opacity={0.35} />
                <line x1={-1} y1={10} x2={27} y2={10} stroke={active ? '#8a6a2a' : '#1a1a1a'} strokeWidth={0.6} />
                {/* Thatch texture lines */}
                <line x1={1} y1={8} x2={6} y2={4} stroke={active ? '#a8843a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={3} y1={9} x2={9} y2={4} stroke={active ? '#a8843a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={20} y1={8} x2={17} y2={4} stroke={active ? '#a8843a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={23} y1={9} x2={19} y2={5} stroke={active ? '#a8843a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                {/* Roof overhang straw edge */}
                <line x1={-1} y1={10.3} x2={27} y2={10.3} stroke={active ? '#c8a44a' : '#333'} strokeWidth={0.4} opacity={0.5} />
                {/* Hay loft opening */}
                <rect x={9} y={11.5} width={8} height={5} fill={active ? '#2a1a0a' : '#1a1a1a'} />
                <rect x={9} y={11.5} width={8} height={0.5} fill={active ? '#5a3a1a' : '#222'} />
                {/* Hay visible in loft */}
                {active && (
                  <>
                    <rect x={10} y={14} width={6} height={2.5} fill="#cca844" opacity={0.7} />
                    <rect x={10.5} y={13.5} width={5} height={1} fill="#ddbb55" opacity={0.5} />
                  </>
                )}
                {!active && <rect x={10} y={14} width={6} height={2.5} fill="#3a3a3a" opacity={0.3} />}
                {/* Barn double doors */}
                <rect x={8} y={21} width={10} height={8} fill={active ? '#6a3a1a' : '#2a2a2a'} />
                <line x1={13} y1={21} x2={13} y2={29} stroke={active ? '#4a2a0a' : '#1a1a1a'} strokeWidth={0.6} />
                {/* Door cross braces */}
                <line x1={8} y1={24} x2={13} y2={21} stroke={active ? '#5a3a1a' : '#222'} strokeWidth={0.4} opacity={0.5} />
                <line x1={13} y1={24} x2={18} y2={21} stroke={active ? '#5a3a1a' : '#222'} strokeWidth={0.4} opacity={0.5} />
                {/* Door hinges */}
                <rect x={8.3} y={22.5} width={0.8} height={1} fill={active ? '#444' : '#222'} rx={0.2} />
                <rect x={8.3} y={26} width={0.8} height={1} fill={active ? '#444' : '#222'} rx={0.2} />
                <rect x={17} y={22.5} width={0.8} height={1} fill={active ? '#444' : '#222'} rx={0.2} />
                <rect x={17} y={26} width={0.8} height={1} fill={active ? '#444' : '#222'} rx={0.2} />
                {/* Warm glow from inside barn */}
                {active && <rect x={9} y={22} width={8} height={6} fill="#ffaa33" opacity={0.05 + Math.sin(Date.now() * 0.003) * 0.02} />}
                {/* Hay bales stacked outside (left) */}
                <rect x={-2} y={25} width={4} height={4} fill={active ? '#cca844' : '#444'} rx={0.3} />
                <rect x={-1.5} y={22} width={3} height={3.5} fill={active ? '#ddbb55' : '#4a4a4a'} rx={0.3} />
                <line x1={-1.5} y1={23.5} x2={1.5} y2={23.5} stroke={active ? '#aa8833' : '#333'} strokeWidth={0.3} opacity={0.5} />
                <line x1={-2} y1={27} x2={2} y2={27} stroke={active ? '#aa8833' : '#333'} strokeWidth={0.3} opacity={0.5} />
                {/* Wooden fence (right side) */}
                <line x1={26} y1={22} x2={26} y2={29} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.8} />
                <line x1={30} y1={22} x2={30} y2={29} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.8} />
                <line x1={34} y1={22} x2={34} y2={29} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.8} />
                <line x1={25} y1={24} x2={35} y2={24} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.7} />
                <line x1={25} y1={27} x2={35} y2={27} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.7} />
                {/* Fence post caps */}
                <rect x={25.3} y={21.5} width={1.4} height={1} fill={active ? '#9a8365' : '#4a4a4a'} rx={0.2} />
                <rect x={29.3} y={21.5} width={1.4} height={1} fill={active ? '#9a8365' : '#4a4a4a'} rx={0.2} />
                <rect x={33.3} y={21.5} width={1.4} height={1} fill={active ? '#9a8365' : '#4a4a4a'} rx={0.2} />
                {/* Crop rows behind fence — wheat with small grain ears */}
                {active && (
                  <>
                    {/* Stalk 1 */}
                    <line x1={27} y1={27} x2={27} y2={19} stroke="#6a9a3a" strokeWidth={0.4} />
                    <line x1={27} y1={19} x2={26.5} y2={17.5} stroke="#8ab844" strokeWidth={0.35} />
                    <line x1={26.5} y1={17.5} x2={26} y2={17} stroke="#bbaa44" strokeWidth={0.5} />
                    <line x1={26.5} y1={17.8} x2={25.8} y2={17.5} stroke="#bbaa44" strokeWidth={0.4} />
                    <line x1={26.5} y1={18.2} x2={25.9} y2={18} stroke="#bbaa44" strokeWidth={0.4} />
                    {/* Stalk 2 */}
                    <line x1={29} y1={27} x2={29} y2={18} stroke="#6a9a3a" strokeWidth={0.4} />
                    <line x1={29} y1={18} x2={29.5} y2={16.5} stroke="#8ab844" strokeWidth={0.35} />
                    <line x1={29.5} y1={16.5} x2={30} y2={16} stroke="#ccbb44" strokeWidth={0.5} />
                    <line x1={29.5} y1={16.8} x2={30.2} y2={16.5} stroke="#ccbb44" strokeWidth={0.4} />
                    <line x1={29.5} y1={17.2} x2={30.1} y2={17} stroke="#ccbb44" strokeWidth={0.4} />
                    {/* Stalk 3 */}
                    <line x1={31} y1={27} x2={31} y2={19.5} stroke="#6a9a3a" strokeWidth={0.4} />
                    <line x1={31} y1={19.5} x2={30.5} y2={18} stroke="#8ab844" strokeWidth={0.35} />
                    <line x1={30.5} y1={18} x2={30} y2={17.5} stroke="#ddcc55" strokeWidth={0.5} />
                    <line x1={30.5} y1={18.3} x2={29.8} y2={18} stroke="#ddcc55" strokeWidth={0.4} />
                    <line x1={30.5} y1={18.7} x2={29.9} y2={18.5} stroke="#ddcc55" strokeWidth={0.4} />
                    {/* Stalk 4 */}
                    <line x1={33} y1={27} x2={33} y2={18.5} stroke="#6a9a3a" strokeWidth={0.4} />
                    <line x1={33} y1={18.5} x2={33.5} y2={17} stroke="#8ab844" strokeWidth={0.35} />
                    <line x1={33.5} y1={17} x2={34} y2={16.5} stroke="#ccbb44" strokeWidth={0.5} />
                    <line x1={33.5} y1={17.3} x2={34.2} y2={17} stroke="#ccbb44" strokeWidth={0.4} />
                    <line x1={33.5} y1={17.7} x2={34.1} y2={17.5} stroke="#ccbb44" strokeWidth={0.4} />
                    {/* Small leaf on each stalk */}
                    <line x1={27} y1={23} x2={26} y2={22} stroke="#7aaa44" strokeWidth={0.3} />
                    <line x1={29} y1={22} x2={30} y2={21} stroke="#7aaa44" strokeWidth={0.3} />
                    <line x1={31} y1={23.5} x2={30} y2={22.5} stroke="#7aaa44" strokeWidth={0.3} />
                    <line x1={33} y1={22.5} x2={34} y2={21.5} stroke="#7aaa44" strokeWidth={0.3} />
                  </>
                )}
                {!active && (
                  <>
                    <line x1={27} y1={27} x2={27} y2={20} stroke="#3a4a3a" strokeWidth={0.4} />
                    <line x1={29} y1={27} x2={29} y2={19} stroke="#3a4a3a" strokeWidth={0.4} />
                    <line x1={31} y1={27} x2={31} y2={20.5} stroke="#3a4a3a" strokeWidth={0.4} />
                    <line x1={33} y1={27} x2={33} y2={19.5} stroke="#3a4a3a" strokeWidth={0.4} />
                  </>
                )}
                {/* Water trough */}
                <rect x={25} y={28} width={4} height={1.5} fill={active ? '#6a5a3a' : '#333'} rx={0.3} />
                <rect x={25.3} y={28.3} width={3.4} height={0.9} fill={active ? '#5588aa' : '#3a3a3a'} rx={0.2} />
                {/* Lantern on barn wall */}
                <rect x={5} y={20} width={1} height={1.5} fill={active ? '#555' : '#333'} />
                <rect x={4.5} y={21.5} width={2} height={2.5} fill={active ? '#444' : '#2a2a2a'} rx={0.3} />
                {active && <rect x={5} y={22} width={1} height={1.5} fill="#ffaa33" opacity={0.5 + Math.sin(Date.now() * 0.004) * 0.15} />}
                {active && <circle cx={5.5} cy={22.5} r={2.5} fill="#ffaa33" opacity={0.04 + Math.sin(Date.now() * 0.004) * 0.02} />}
              </>
            )}
            {buildingType === 'ruins' && (
              <>
                {/* === RUINS — Ancient crumbling stone temple with broken arch, columns, runes === */}
                {/* Overgrown ground / mossy foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#4a5a3a' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#5a6a4a' : '#333'} opacity={0.4} />
                {/* === Broken stone foundation platform === */}
                <rect x={0} y={27} width={34} height={2.5} fill={active ? '#8a8880' : '#3a3a40'} />
                <line x1={0} y1={27.8} x2={34} y2={27.8} stroke={active ? '#7a7870' : '#333'} strokeWidth={0.3} opacity={0.4} />
                {/* Cracked stone texture */}
                <line x1={8} y1={27} x2={9} y2={29.5} stroke={active ? '#6a6860' : '#2a2a30'} strokeWidth={0.2} opacity={0.5} />
                <line x1={20} y1={27} x2={19.5} y2={29.5} stroke={active ? '#6a6860' : '#2a2a30'} strokeWidth={0.2} opacity={0.5} />
                {/* === Broken archway between left and center columns (behind pillars) === */}
                <path d="M7,7.5 Q10.5,3 14,3.5" fill="none" stroke={active ? '#a0a098' : '#444'} strokeWidth={1.5} />
                {/* === Left column (tall, cracked top) === */}
                <rect x={2} y={8} width={5} height={19} fill={active ? '#a0a098' : '#444'} />
                {/* Column fluting lines */}
                <line x1={3.5} y1={8} x2={3.5} y2={27} stroke={active ? '#8a8a80' : '#3a3a3a'} strokeWidth={0.3} opacity={0.4} />
                <line x1={5.5} y1={8} x2={5.5} y2={27} stroke={active ? '#8a8a80' : '#3a3a3a'} strokeWidth={0.3} opacity={0.4} />
                {/* Capital (top piece) */}
                <rect x={1} y={7} width={7} height={1.5} fill={active ? '#b0b0a8' : '#4a4a4a'} />
                {/* Broken jagged top */}
                <polygon points="1,7 2,4 3.5,6 4.5,3 6,5.5 7,4.5 8,7" fill={active ? '#a0a098' : '#444'} />
                {/* Column base */}
                <rect x={1} y={26} width={7} height={1.5} fill={active ? '#b0b0a8' : '#4a4a4a'} />
                {/* === Center column (tallest, mostly intact) === */}
                <rect x={14} y={4} width={5} height={23} fill={active ? '#9a9a90' : '#3a3a40'} />
                {/* Column fluting */}
                <line x1={15.5} y1={4} x2={15.5} y2={27} stroke={active ? '#8a8a80' : '#333'} strokeWidth={0.3} opacity={0.4} />
                <line x1={17.5} y1={4} x2={17.5} y2={27} stroke={active ? '#8a8a80' : '#333'} strokeWidth={0.3} opacity={0.4} />
                {/* Capital */}
                <rect x={13} y={3} width={7} height={1.5} fill={active ? '#b0b0a8' : '#4a4a4a'} />
                {/* Broken top — less damaged */}
                <polygon points="13,3 14,1 15.5,2.5 16.5,0 18,2 19,1.5 20,3" fill={active ? '#9a9a90' : '#3a3a40'} />
                {/* Column base */}
                <rect x={13} y={26} width={7} height={1.5} fill={active ? '#b0b0a8' : '#4a4a4a'} />
                {/* === Right column (short, broken halfway) === */}
                <rect x={27} y={16} width={5} height={11} fill={active ? '#a8a8a0' : '#444'} />
                {/* Fluting */}
                <line x1={28.5} y1={16} x2={28.5} y2={27} stroke={active ? '#8a8a80' : '#3a3a3a'} strokeWidth={0.3} opacity={0.4} />
                <line x1={30.5} y1={16} x2={30.5} y2={27} stroke={active ? '#8a8a80' : '#3a3a3a'} strokeWidth={0.3} opacity={0.4} />
                {/* Jagged broken top */}
                <polygon points="27,16 28,14 29.5,15.5 30.5,13.5 32,16" fill={active ? '#a8a8a0' : '#444'} />
                {/* Column base */}
                <rect x={26} y={26} width={7} height={1.5} fill={active ? '#b0b0a8' : '#4a4a4a'} />
                {/* Fallen arch keystone on ground */}
                <polygon points="9,27 10,25.5 12,25.5 13,27" fill={active ? '#9a9a90' : '#3a3a40'} />
                <line x1={11} y1={25.5} x2={11} y2={27} stroke={active ? '#7a7a70' : '#333'} strokeWidth={0.2} />
                {/* === Scattered rubble and fallen stones === */}
                <rect x={21} y={27.5} width={3} height={1.5} fill={active ? '#8a8a80' : '#3a3a40'} rx={0.3} />
                <rect x={22} y={26.5} width={2} height={1.2} fill={active ? '#9a9a90' : '#3a3a40'} rx={0.3} />
                <rect x={34} y={28} width={2.5} height={1.5} fill={active ? '#8a8a80' : '#3a3a40'} rx={0.4} />
                <circle cx={-1} cy={28.5} r={0.8} fill={active ? '#8a8a80' : '#3a3a40'} />
                <rect x={10} y={28.5} width={2} height={0.8} fill={active ? '#7a7a70' : '#333'} rx={0.3} />
                {/* === Overgrown vines / moss === */}
                {/* Vine on left column */}
                <line x1={2.5} y1={10} x2={2} y2={15} stroke={active ? '#4a7a2a' : '#2a3a2a'} strokeWidth={0.5} />
                <line x1={2} y1={15} x2={3} y2={20} stroke={active ? '#4a7a2a' : '#2a3a2a'} strokeWidth={0.4} />
                <circle cx={2.2} cy={14} r={0.6} fill={active ? '#5a8a3a' : '#2a3a2a'} />
                <circle cx={2.5} cy={17.5} r={0.5} fill={active ? '#5a8a3a' : '#2a3a2a'} />
                {/* Vine on center column */}
                <line x1={19} y1={5} x2={20} y2={10} stroke={active ? '#4a7a2a' : '#2a3a2a'} strokeWidth={0.4} />
                <line x1={20} y1={10} x2={19} y2={14} stroke={active ? '#4a7a2a' : '#2a3a2a'} strokeWidth={0.4} />
                <circle cx={20} cy={9} r={0.5} fill={active ? '#5a8a3a' : '#2a3a2a'} />
                <circle cx={19.5} cy={12.5} r={0.5} fill={active ? '#5a8a3a' : '#2a3a2a'} />
                {/* Moss patches on ground */}
                <ellipse cx={5} cy={28.5} rx={2} ry={0.6} fill={active ? '#4a6a2a' : '#2a3a2a'} opacity={0.5} />
                <ellipse cx={24} cy={28.5} rx={1.5} ry={0.5} fill={active ? '#4a6a2a' : '#2a3a2a'} opacity={0.5} />
                {/* === Glowing rune on center column base === */}
                {active && (
                  <>
                    <circle cx={16.5} cy={20} r={2} fill="#aaaaff" opacity={0.08 + Math.sin(Date.now() * 0.002) * 0.04} />
                    <circle cx={16.5} cy={20} r={1} fill="none" stroke="#aabbff" strokeWidth={0.3} opacity={0.5 + Math.sin(Date.now() * 0.003) * 0.2} />
                    <line x1={16.5} y1={19} x2={16.5} y2={21} stroke="#aabbff" strokeWidth={0.3} opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.2} />
                    <line x1={15.5} y1={20} x2={17.5} y2={20} stroke="#aabbff" strokeWidth={0.3} opacity={0.4 + Math.sin(Date.now() * 0.003) * 0.2} />
                  </>
                )}
                {/* Ambient mystical glow */}
                {active && <circle cx={16.5} cy={16} r={8} fill="#aaaaff" opacity={0.05 + Math.sin(Date.now() * 0.002) * 0.025} />}
              </>
            )}
            {buildingType === 'forge' && (
              <>
                {/* === FORGE — Rugged stone smithy with open furnace, chimney, anvil, weapon display === */}
                {/* Stone foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#444' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#555' : '#333'} opacity={0.4} />
                {/* Main building — dark stone */}
                <rect x={2} y={10} width={24} height={19} fill={active ? '#555' : '#333'} />
                <rect x={3} y={11} width={22} height={0.8} fill={active ? '#666' : '#3a3a3a'} opacity={0.3} />
                {/* Stone texture */}
                <line x1={2} y1={15} x2={26} y2={15} stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={2} y1={20} x2={26} y2={20} stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={2} y1={25} x2={26} y2={25} stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.3} opacity={0.3} />
                <line x1={10} y1={10} x2={10} y2={29} stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.2} opacity={0.15} />
                <line x1={18} y1={10} x2={18} y2={29} stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.2} opacity={0.15} />
                {/* Roof — heavy slate */}
                <polygon points="0,10 14,0 28,10" fill={active ? '#444' : '#2a2a2a'} />
                <polygon points="0,10 14,0 14,2 2,10" fill={active ? '#555' : '#333'} opacity={0.3} />
                <line x1={0} y1={10} x2={28} y2={10} stroke={active ? '#333' : '#1a1a1a'} strokeWidth={0.5} />
                {/* Chimney — tall stone stack */}
                <rect x={20} y={-6} width={6} height={16} fill={active ? '#4a4a4a' : '#2a2a2a'} />
                <rect x={19.5} y={-8} width={7} height={3} fill={active ? '#555' : '#333'} />
                <rect x={19.5} y={-8} width={7} height={0.6} fill={active ? '#666' : '#3a3a3a'} opacity={0.5} />
                {/* Chimney brick lines */}
                <line x1={20} y1={-4} x2={26} y2={-4} stroke={active ? '#3a3a3a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={20} y1={0} x2={26} y2={0} stroke={active ? '#3a3a3a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={20} y1={4} x2={26} y2={4} stroke={active ? '#3a3a3a' : '#222'} strokeWidth={0.3} opacity={0.4} />
                {/* Smoke puffs */}
                {active && (
                  <>
                    <circle cx={23} cy={-12} r={2} fill="#777" opacity={0.15 + Math.sin(Date.now() * 0.003) * 0.08} />
                    <circle cx={25} cy={-16} r={1.8} fill="#888" opacity={0.12 + Math.sin(Date.now() * 0.0025 + 0.7) * 0.06} />
                    <circle cx={22} cy={-19} r={1.3} fill="#999" opacity={0.08 + Math.sin(Date.now() * 0.002 + 1.4) * 0.04} />
                  </>
                )}
                {/* Window — small with orange forge glow */}
                <rect x={5} y={14} width={4} height={4} fill={active ? '#1a1a1a' : '#222'} />
                <rect x={5} y={14} width={4} height={0.5} fill={active ? '#444' : '#333'} />
                {active && <rect x={5.5} y={14.5} width={3} height={3} fill="#ff6622" opacity={0.12 + Math.sin(Date.now() * 0.006) * 0.06} />}
                {/* Arched doorway */}
                <rect x={10} y={18} width={7} height={11} fill={active ? '#2a1a0a' : '#1a1a1a'} />
                <ellipse cx={13.5} cy={18} rx={3.5} ry={2.5} fill={active ? '#2a1a0a' : '#1a1a1a'} />
                <ellipse cx={13.5} cy={18} rx={3.8} ry={2.8} fill="none" stroke={active ? '#444' : '#2a2a2a'} strokeWidth={0.6} />
                {/* Interior forge glow spilling from door */}
                {active && <ellipse cx={13.5} cy={24} rx={3} ry={4} fill="#ff4422" opacity={0.06 + Math.sin(Date.now() * 0.005) * 0.03} />}
                {/* Open-air forge / furnace (right side) */}
                <rect x={28} y={18} width={8} height={11} fill={active ? '#555' : '#333'} />
                <rect x={28} y={18} width={8} height={1} fill={active ? '#666' : '#3a3a3a'} opacity={0.5} />
                {/* Furnace opening */}
                <rect x={29} y={21} width={6} height={5} fill={active ? '#1a0a0a' : '#1a1a1a'} />
                {/* Fire inside furnace */}
                {active && (
                  <>
                    <rect x={29.5} y={21.5} width={5} height={4} fill="#ff2200" opacity={0.5 + Math.sin(Date.now() * 0.008) * 0.15} />
                    <rect x={30} y={22} width={4} height={3} fill="#ff6633" opacity={0.6 + Math.sin(Date.now() * 0.01 + 0.5) * 0.15} />
                    <rect x={31} y={22.5} width={2} height={2} fill="#ffaa44" opacity={0.5 + Math.sin(Date.now() * 0.012 + 1) * 0.2} />
                    <rect x={31.5} y={23} width={1} height={1} fill="#ffdd88" opacity={0.4 + Math.sin(Date.now() * 0.015 + 1.5) * 0.2} />
                  </>
                )}
                {!active && <rect x={30} y={22} width={4} height={3} fill="#331111" opacity={0.4} />}
                {/* Furnace hood / chimney cap */}
                <polygon points="27,18 32,12 37,18" fill={active ? '#4a4a4a' : '#2a2a2a'} />
                <line x1={27} y1={18} x2={37} y2={18} stroke={active ? '#333' : '#1a1a1a'} strokeWidth={0.4} />
                {/* Anvil (foreground, left of furnace) */}
                <rect x={-2} y={26} width={6} height={3} fill={active ? '#777' : '#3a3a3a'} />
                <rect x={-1} y={24} width={4} height={2.5} fill={active ? '#888' : '#444'} />
                <rect x={-0.5} y={23.5} width={3} height={1} fill={active ? '#999' : '#555'} />
                {/* Hammer resting on anvil */}
                <line x1={0} y1={22} x2={2.5} y2={20} stroke={active ? '#8b7355' : '#444'} strokeWidth={0.7} />
                <rect x={2} y={19.5} width={1.5} height={1} fill={active ? '#888' : '#555'} rx={0.2} />
                {/* Weapon display — finished sword on wall */}
                <line x1={6} y1={12} x2={6} y2={22} stroke={active ? '#bbb' : '#555'} strokeWidth={0.8} />
                <rect x={5} y={11.5} width={2} height={1.5} fill={active ? '#cc9944' : '#555'} />
                <rect x={5.5} y={13} width={1} height={0.8} fill={active ? '#999' : '#444'} />
                {/* Water trough / quench bucket */}
                <rect x={27} y={27} width={4} height={2} fill={active ? '#5a4a3a' : '#333'} rx={0.5} />
                <rect x={27.5} y={27.5} width={3} height={1} fill={active ? '#4488aa' : '#444'} rx={0.3} />
                {/* Hot metal glow from furnace */}
                {active && <ellipse cx={32} cy={22} rx={5} ry={4} fill="#ff4422" opacity={0.04 + Math.sin(Date.now() * 0.004) * 0.02} />}
              </>
            )}

            {buildingType === 'leatherworks' && (
              <>
                {/* === LEATHERWORKS — Tanner's workshop with drying rack, hides, workbench === */}
                {/* Stone foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#5a5048' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#6a6058' : '#333'} opacity={0.4} />
                {/* Main building — weathered wood */}
                <rect x={2} y={10} width={22} height={19} fill={active ? '#7a5a38' : '#3a3a4a'} />
                {/* Plank texture */}
                <line x1={6} y1={10} x2={6} y2={29} stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.25} opacity={0.3} />
                <line x1={10} y1={10} x2={10} y2={29} stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.25} opacity={0.3} />
                <line x1={14} y1={10} x2={14} y2={29} stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.25} opacity={0.3} />
                <line x1={18} y1={10} x2={18} y2={29} stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.25} opacity={0.3} />
                <line x1={22} y1={10} x2={22} y2={29} stroke={active ? '#6a4a28' : '#2a2a2a'} strokeWidth={0.25} opacity={0.3} />
                {/* Horizontal beam */}
                <rect x={2} y={19} width={22} height={0.8} fill={active ? '#5a3a18' : '#2a2a2a'} />
                {/* Roof — low-pitched, dark shingles */}
                <polygon points="0,10 13,1 26,10" fill={active ? '#5a4030' : '#2a2a3a'} />
                <polygon points="0,10 13,1 13,3 2,10" fill={active ? '#6a5040' : '#333'} opacity={0.3} />
                <line x1={0} y1={10} x2={26} y2={10} stroke={active ? '#4a3020' : '#1a1a1a'} strokeWidth={0.6} />
                {/* Shingle texture lines (clipped to roof slopes) */}
                <line x1={2.89} y1={8} x2={23.11} y2={8} stroke={active ? '#4a3020' : '#222'} strokeWidth={0.25} opacity={0.35} />
                <line x1={5.78} y1={6} x2={20.22} y2={6} stroke={active ? '#4a3020' : '#222'} strokeWidth={0.25} opacity={0.35} />
                <line x1={8.67} y1={4} x2={17.33} y2={4} stroke={active ? '#4a3020' : '#222'} strokeWidth={0.25} opacity={0.35} />
                {/* Window with shutters */}
                <rect x={4} y={13} width={5} height={4} fill={active ? '#1a1a1a' : '#222'} />
                <rect x={4} y={13} width={5} height={0.5} fill={active ? '#5a3a18' : '#222'} />
                {active && <rect x={4.5} y={13.5} width={4} height={3} fill="#ddbb77" opacity={0.15} />}
                {/* Shutters */}
                <rect x={3.2} y={13} width={1} height={4} fill={active ? '#6a4a28' : '#2a2a2a'} />
                <rect x={8.8} y={13} width={1} height={4} fill={active ? '#6a4a28' : '#2a2a2a'} />
                {/* Arched doorway */}
                <rect x={13} y={20} width={7} height={9} fill={active ? '#3a2010' : '#1a1a1a'} />
                <ellipse cx={16.5} cy={20} rx={3.5} ry={2.5} fill={active ? '#3a2010' : '#1a1a1a'} />
                <ellipse cx={16.5} cy={20} rx={3.8} ry={2.8} fill="none" stroke={active ? '#5a3a18' : '#222'} strokeWidth={0.5} />
                {/* Interior warm glow */}
                {active && <rect x={14} y={22} width={5} height={5} fill="#cc8844" opacity={0.06 + Math.sin(Date.now() * 0.003) * 0.03} />}
                {/* === Drying rack (right side) — A-frame with hanging hides === */}
                {/* A-frame poles */}
                <line x1={27} y1={29} x2={30} y2={10} stroke={active ? '#7a6040' : '#444'} strokeWidth={0.8} />
                <line x1={37} y1={29} x2={34} y2={10} stroke={active ? '#7a6040' : '#444'} strokeWidth={0.8} />
                {/* Crossbar */}
                <line x1={30} y1={10} x2={34} y2={10} stroke={active ? '#8a7050' : '#4a4a4a'} strokeWidth={1} />
                {/* Middle support bar */}
                <line x1={28.5} y1={19} x2={35.5} y2={19} stroke={active ? '#7a6040' : '#3a3a3a'} strokeWidth={0.6} />
                {/* Hide 1 — large, hanging from crossbar */}
                <rect x={30.5} y={10.5} width={0.4} height={2} fill={active ? '#6a5030' : '#333'} />
                <path d="M29.5,12.5 Q29,13 29,16 Q29.5,18.5 31,18.5 Q32.5,18.5 32.5,16 Q32.5,13 32,12.5 Z" fill={active ? '#c4984a' : '#4a4a4a'} />
                <path d="M29.8,13 Q29.5,14 29.5,16 Q30,17.5 31,17.5 Q32,17.5 32,16 Q32,14 31.7,13 Z" fill={active ? '#d4a85a' : '#555'} opacity={0.4} />
                {/* Hide 2 — smaller, slightly different color */}
                <rect x={33} y={10.5} width={0.4} height={1.5} fill={active ? '#6a5030' : '#333'} />
                <path d="M32,12 Q31.5,13 31.8,15.5 Q32.5,17 33.5,17 Q34.5,17 34.5,15.5 Q34.8,13 34.2,12 Z" fill={active ? '#b8884a' : '#444'} />
                <path d="M32.5,12.5 Q32,13.5 32.3,15 Q33,16 33.5,16 Q34,16 34,15 Q34.2,13.5 33.8,12.5 Z" fill={active ? '#c8985a' : '#4a4a4a'} opacity={0.4} />
                {/* Hide 3 — on lower bar */}
                <rect x={31.5} y={19} width={0.4} height={1.5} fill={active ? '#6a5030' : '#333'} />
                <path d="M30,20.5 Q29.8,21 30,23.5 Q30.5,25 32,25 Q33.5,25 33.5,23.5 Q33.8,21 33.5,20.5 Z" fill={active ? '#aa7840' : '#3a3a3a'} />
                {/* Workbench (against left wall) */}
                <rect x={0} y={25} width={6} height={1} fill={active ? '#7a5a38' : '#3a3a3a'} />
                <rect x={0.5} y={26} width={1} height={3} fill={active ? '#6a4a28' : '#333'} />
                <rect x={5} y={26} width={1} height={3} fill={active ? '#6a4a28' : '#333'} />
                {/* Tools on workbench */}
                {/* Cutting knife */}
                <line x1={1} y1={24.5} x2={3} y2={24.5} stroke={active ? '#aaa' : '#555'} strokeWidth={0.4} />
                <rect x={3} y={24} width={1} height={1} fill={active ? '#6a4a28' : '#333'} rx={0.2} />
                {/* Awl / punch */}
                <line x1={4.5} y1={25} x2={4.5} y2={23} stroke={active ? '#888' : '#444'} strokeWidth={0.3} />
                <circle cx={4.5} cy={22.8} r={0.3} fill={active ? '#aaa' : '#555'} />
                {/* Leather scrap on bench */}
                <rect x={1.5} y={24.8} width={2} height={0.5} fill={active ? '#bb8844' : '#444'} rx={0.2} />
                {/* Barrel with tanning solution */}
                <rect x={-1} y={23} width={3} height={4} fill={active ? '#6a4a28' : '#2a2a2a'} rx={0.8} />
                <line x1={-1} y1={25} x2={2} y2={25} stroke={active ? '#7a5a38' : '#333'} strokeWidth={0.4} />
                <rect x={-0.5} y={23.2} width={2} height={0.8} fill={active ? '#5a885a' : '#3a3a3a'} rx={0.3} opacity={0.5} />
                {/* Hanging sign — leather hide shape */}
                <line x1={2} y1={8} x2={2} y2={12} stroke={active ? '#555' : '#333'} strokeWidth={0.4} />
                <rect x={0} y={9} width={4} height={3} fill={active ? '#bb8844' : '#444'} rx={0.5} />
              </>
            )}
            {buildingType === 'tavern' && (
              <>
                {/* === TAVERN — Cozy timber-frame inn with warm glow, barrel, hanging sign === */}
                {/* Stone foundation */}
                <rect x={-2} y={29} width={40} height={3} fill={active ? '#555' : '#2a2a3a'} />
                <rect x={-1} y={29} width={38} height={0.6} fill={active ? '#666' : '#333'} opacity={0.4} />
                {/* Main building — dark timber frame */}
                <rect x={1} y={6} width={30} height={23} fill={active ? '#6a4a2a' : '#3a2a20'} />
                {/* Timber frame beams (half-timbered look) */}
                <line x1={1} y1={6} x2={1} y2={29} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={1} />
                <line x1={31} y1={6} x2={31} y2={29} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={1} />
                <line x1={1} y1={6} x2={31} y2={6} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={1} />
                <line x1={1} y1={16} x2={31} y2={16} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.8} />
                {/* Diagonal bracing */}
                <line x1={1} y1={6} x2={7} y2={16} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} opacity={0.6} />
                <line x1={31} y1={6} x2={25} y2={16} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} opacity={0.6} />
                {/* Plaster fill between beams */}
                <rect x={2} y={7} width={12} height={8.5} fill={active ? '#c8b088' : '#4a4038'} opacity={0.3} />
                <rect x={18} y={7} width={12} height={8.5} fill={active ? '#c8b088' : '#4a4038'} opacity={0.3} />
                {/* === Roof — steep thatched/shingled === */}
                <polygon points="-1,6 16,-6 33,6" fill={active ? '#5a3a1a' : '#2a2018'} />
                {/* Roof highlight (left slope) */}
                <polygon points="-1,6 16,-6 16,-4 1,6" fill={active ? '#6a4a2a' : '#332820'} opacity={0.4} />
                {/* Shingle lines (clipped to roof slopes) */}
                <line x1={3.25} y1={3} x2={28.75} y2={3} stroke={active ? '#4a2a10' : '#1a1810'} strokeWidth={0.3} opacity={0.5} />
                <line x1={7.5} y1={0} x2={24.5} y2={0} stroke={active ? '#4a2a10' : '#1a1810'} strokeWidth={0.3} opacity={0.5} />
                <line x1={11.75} y1={-3} x2={20.25} y2={-3} stroke={active ? '#4a2a10' : '#1a1810'} strokeWidth={0.3} opacity={0.5} />
                {/* === Chimney — stone stack with smoke === */}
                <rect x={24} y={-8} width={5} height={12} fill={active ? '#555' : '#2a2a2a'} />
                <rect x={23.5} y={-9} width={6} height={2} fill={active ? '#666' : '#333'} />
                {/* Chimney brick lines */}
                <line x1={24} y1={-5} x2={29} y2={-5} stroke={active ? '#444' : '#222'} strokeWidth={0.3} opacity={0.4} />
                <line x1={24} y1={-2} x2={29} y2={-2} stroke={active ? '#444' : '#222'} strokeWidth={0.3} opacity={0.4} />
                {/* Smoke puffs */}
                {active && (
                  <>
                    <circle cx={26.5} cy={-11} r={1.2} fill="#888" opacity={0.15 + Math.sin(Date.now() * 0.002) * 0.08} />
                    <circle cx={25.5} cy={-13.5} r={1} fill="#888" opacity={0.1 + Math.sin(Date.now() * 0.002 + 1) * 0.06} />
                    <circle cx={27} cy={-15.5} r={0.7} fill="#888" opacity={0.06 + Math.sin(Date.now() * 0.002 + 2) * 0.04} />
                  </>
                )}
                {/* === Upper windows — warm glow === */}
                {/* Left window */}
                <rect x={4} y={8} width={6} height={5} fill={active ? '#ddaa33' : '#4a4040'} />
                <line x1={7} y1={8} x2={7} y2={13} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <line x1={4} y1={10.5} x2={10} y2={10.5} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <rect x={3.5} y={7.5} width={7} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                <rect x={3.5} y={13} width={7} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                {/* Right window */}
                <rect x={22} y={8} width={6} height={5} fill={active ? '#ddaa33' : '#4a4040'} />
                <line x1={25} y1={8} x2={25} y2={13} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <line x1={22} y1={10.5} x2={28} y2={10.5} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <rect x={21.5} y={7.5} width={7} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                <rect x={21.5} y={13} width={7} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                {/* Window glow */}
                {active && (
                  <>
                    <rect x={4} y={8} width={6} height={5} fill="#ffcc44" opacity={0.15 + Math.sin(Date.now() * 0.004) * 0.1} />
                    <rect x={22} y={8} width={6} height={5} fill="#ffcc44" opacity={0.15 + Math.sin(Date.now() * 0.004 + 1) * 0.1} />
                  </>
                )}
                {/* === Lower windows === */}
                <rect x={4} y={18} width={5} height={5} fill={active ? '#ddaa33' : '#4a4040'} />
                <line x1={6.5} y1={18} x2={6.5} y2={23} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <line x1={4} y1={20.5} x2={9} y2={20.5} stroke={active ? '#4a3018' : '#2a2018'} strokeWidth={0.5} />
                <rect x={3.5} y={17.5} width={6} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                <rect x={3.5} y={23} width={6} height={0.7} fill={active ? '#4a3018' : '#2a2018'} />
                {active && <rect x={4} y={18} width={5} height={5} fill="#ffcc44" opacity={0.12 + Math.sin(Date.now() * 0.004 + 2) * 0.08} />}
                {/* === Door — arched wooden entrance === */}
                <rect x={13} y={19} width={8} height={10} fill={active ? '#4a2a15' : '#2a2018'} />
                <path d="M13,19 Q17,14 21,19" fill={active ? '#4a2a15' : '#2a2018'} />
                {/* Door arch frame */}
                <path d="M13,19 Q17,14 21,19" fill="none" stroke={active ? '#5a3a20' : '#333'} strokeWidth={0.8} />
                {/* Door planks */}
                <line x1={15} y1={15.5} x2={15} y2={29} stroke={active ? '#3a2010' : '#1a1810'} strokeWidth={0.3} opacity={0.4} />
                <line x1={17} y1={14.5} x2={17} y2={29} stroke={active ? '#3a2010' : '#1a1810'} strokeWidth={0.3} opacity={0.4} />
                <line x1={19} y1={15.5} x2={19} y2={29} stroke={active ? '#3a2010' : '#1a1810'} strokeWidth={0.3} opacity={0.4} />
                {/* Door handle */}
                <circle cx={19.5} cy={24} r={0.6} fill={active ? '#aa8844' : '#555'} />
                {/* Door light spill when active */}
                {active && <rect x={13} y={19} width={8} height={10} fill="#ffcc44" opacity={0.06} />}
                {/* === Hanging tavern sign on bracket === */}
                {/* Wall bracket */}
                <line x1={32} y1={10} x2={32} y2={12} stroke={active ? '#555' : '#333'} strokeWidth={0.8} />
                <line x1={32} y1={12} x2={37} y2={12} stroke={active ? '#555' : '#333'} strokeWidth={0.8} />
                <line x1={32} y1={10} x2={35} y2={12} stroke={active ? '#555' : '#333'} strokeWidth={0.5} />
                {/* Sign chains */}
                <line x1={33.5} y1={12} x2={33.5} y2={13.5} stroke={active ? '#777' : '#444'} strokeWidth={0.3} />
                <line x1={36.5} y1={12} x2={36.5} y2={13.5} stroke={active ? '#777' : '#444'} strokeWidth={0.3} />
                {/* Sign board */}
                <rect x={32.5} y={13.5} width={5} height={4} fill={active ? '#5a3a1a' : '#2a2018'} rx={0.5} />
                {/* Mug icon on sign */}
                {active && (
                  <>
                    <rect x={34} y={14.5} width={2} height={2.2} fill="#ddaa33" rx={0.3} />
                    <line x1={36} y1={15} x2={36.8} y2={15} stroke="#ddaa33" strokeWidth={0.4} />
                  </>
                )}
                {/* === Barrel beside door (side view, upright) === */}
                {/* Barrel body — slightly wider in middle */}
                <path d="M22,24 Q21,26.5 22,29 L26,29 Q27,26.5 26,24 Z" fill={active ? '#503818' : '#2a2015'} />
                {/* Barrel top rim */}
                <rect x={21.8} y={23.5} width={4.4} height={1} fill={active ? '#5a4220' : '#3a2a18'} rx={0.3} />
                {/* Metal bands */}
                <line x1={21.3} y1={25.2} x2={26.7} y2={25.2} stroke={active ? '#555' : '#2a2a2a'} strokeWidth={0.6} />
                <line x1={21.3} y1={27.8} x2={26.7} y2={27.8} stroke={active ? '#555' : '#2a2a2a'} strokeWidth={0.6} />
                {/* Stave lines */}
                <line x1={24} y1={24} x2={24} y2={29} stroke={active ? '#5a3a15' : '#2a2015'} strokeWidth={0.3} opacity={0.35} />
                <line x1={22.5} y1={24.2} x2={22.2} y2={29} stroke={active ? '#5a3a15' : '#2a2015'} strokeWidth={0.2} opacity={0.3} />
                <line x1={25.5} y1={24.2} x2={25.8} y2={29} stroke={active ? '#5a3a15' : '#2a2015'} strokeWidth={0.2} opacity={0.3} />
                {/* === Small bench/stool outside === */}
                <rect x={28} y={27.5} width={4} height={0.6} fill={active ? '#6a4a2a' : '#3a2a18'} />
                <rect x={28.5} y={28} width={0.5} height={1.2} fill={active ? '#5a3a1a' : '#2a2018'} />
                <rect x={31} y={28} width={0.5} height={1.2} fill={active ? '#5a3a1a' : '#2a2018'} />
                {/* === Warm ambient glow from building === */}
                {active && <ellipse cx={16} cy={20} rx={18} ry={10} fill="#ffcc44" opacity={0.03 + Math.sin(Date.now() * 0.003) * 0.015} />}
              </>
            )}
          </g>
        </g>
      )}

      {/* === LAYER 2: Ground base — stone mound at pole foot === */}
      <g pointerEvents="none">
        <ellipse cx={2} cy={FLAG_HEIGHT + 2} rx={9} ry={3.5} fill="#2a2a22" opacity={0.5} />
        <ellipse cx={2} cy={FLAG_HEIGHT + 1} rx={7} ry={2.5} fill="#3a3a30" opacity={0.4} />
        <ellipse cx={2} cy={FLAG_HEIGHT} rx={5} ry={1.5} fill="#4a4a3a" opacity={0.35} />
        {/* Small stones */}
        <circle cx={-4} cy={FLAG_HEIGHT + 1} r={1.5} fill="#3a3a30" opacity={0.4} />
        <circle cx={7} cy={FLAG_HEIGHT + 2} r={1.2} fill="#2a2a22" opacity={0.35} />
      </g>

      {/* Capture/Corrupted zone indicators */}
      {!captured && !corrupted && (
        <ellipse cx={2} cy={FLAG_HEIGHT + 4} rx={20} ry={6}
                 fill={isBossFlag ? '#8a0a8a' : COLORS.flagEnemy} opacity={0.2} />
      )}
      {corrupted && (
        <ellipse cx={2} cy={FLAG_HEIGHT + 4} rx={20} ry={6}
                 fill="#6622aa" opacity={0.15 + Math.sin(Date.now() * 0.002) * 0.05} />
      )}

      {/* === LAYER 3: Pole — wood shaft with grain, finial, and binding rings === */}
      <g pointerEvents="none">
        {(() => {
          const poleMain = corrupted ? '#222' : isBossFlag ? '#5a3a1a' : COLORS.flagPole;
          const poleLight = corrupted ? '#333' : isBossFlag ? '#7a5a3a' : '#9b8365';
          const poleDark = corrupted ? '#111' : isBossFlag ? '#3a2a10' : '#5a4a30';
          const finialColor = corrupted ? '#333' : isBossFlag ? '#aa7722' : captured ? '#ddc040' : '#888';
          return (
            <>
              {/* Main shaft */}
              <rect x={0} y={2} width={4} height={FLAG_HEIGHT - 2} fill={poleMain} />
              {/* Highlight strip */}
              <rect x={0.5} y={2} width={1} height={FLAG_HEIGHT - 2} fill={poleLight} opacity={0.3} />
              {/* Dark edge */}
              <rect x={3} y={2} width={0.8} height={FLAG_HEIGHT - 2} fill={poleDark} opacity={0.25} />
              {/* Wood grain lines */}
              <line x1={2.5} y1={12} x2={2.5} y2={22} stroke={poleDark} strokeWidth={0.4} opacity={0.2} />
              <line x1={1.2} y1={30} x2={1.2} y2={42} stroke={poleDark} strokeWidth={0.3} opacity={0.15} />
              <line x1={2.8} y1={44} x2={2.8} y2={52} stroke={poleDark} strokeWidth={0.3} opacity={0.15} />
              {/* Binding rings where flag attaches */}
              <rect x={-0.5} y={3} width={5} height={1.8} fill={poleDark} opacity={0.5} rx={0.8} />
              <rect x={-0.5} y={27} width={5} height={1.8} fill={poleDark} opacity={0.5} rx={0.8} />
              {/* Finial — brass ball at top */}
              <circle cx={2} cy={-1} r={3.5} fill={finialColor} />
              <circle cx={1.2} cy={-2} r={1.2} fill="#fff" opacity={0.15} />
            </>
          );
        })()}
      </g>

      {/* === LAYER 4: Flag cloth — with folds and creases === */}
      <g pointerEvents="none">
        {(() => {
          const w = waveOffset;
          const clothColor = corrupted ? '#1a1a1a' : (isBossFlag && !captured) ? '#8a0a8a' : flagColor;
          const flagDark = isContesting ? '#cccccc' : corrupted ? '#0a0a0a' : captured ? '#2a9a2a' : '#aa2222';
          const flagLight = isContesting ? '#ffffff' : corrupted ? '#2a2a2a' : captured ? '#5aee5a' : '#ff5555';
          return (
            <>
              {/* Flag shadow (slightly offset) */}
              <polygon
                points={`5,5 ${35 + w},13 ${33 + w},21 5,29`}
                fill="#000" opacity={0.1}
              />
              {/* Main cloth body */}
              <polygon
                points={`4,4 ${34 + w},12 ${32 + w},20 4,28`}
                fill={clothColor}
              />
              {/* Top fold highlight */}
              <polygon
                points={`4,4 ${34 + w},12 ${33 + w},9 4,1`}
                fill={flagLight} opacity={0.15}
              />
              {/* Wavy fold creases */}
              <path d={`M${10 + w * 0.2},7 Q${12 + w * 0.25},${15 + w * 0.3} ${11 + w * 0.2},25`}
                    fill="none" stroke={flagDark} strokeWidth={0.5} opacity={0.1} />
              <path d={`M${20 + w * 0.5},${10 + w * 0.1} Q${21 + w * 0.55},${16 + w * 0.2} ${21 + w * 0.5},${22 + w * 0.05}`}
                    fill="none" stroke={flagDark} strokeWidth={0.4} opacity={0.08} />
              {/* Bottom fold shadow */}
              <polygon
                points={`4,26 ${32 + w},19 ${32 + w},20 4,28`}
                fill={flagDark} opacity={0.15}
              />
            </>
          );
        })()}
      </g>
      {/* Banner emblem on captured flags */}
      {captured && !corrupted && !isContesting && bannerId && (
        <g pointerEvents="none" transform={`translate(${14 + waveOffset * 0.4}, 10)`}>
          {bannerId === 'banner_dragon' && (
            <g>
              <path d="M4,0 Q8,2 6,6 Q4,8 2,6 Q0,4 2,2 Z" fill="#cc2222" opacity={0.85} />
              <circle cx={5} cy={3} r={0.6} fill="#ffd700" />
            </g>
          )}
          {bannerId === 'banner_skull' && (
            <g>
              <circle cx={4} cy={4} r={3.5} fill="#fff" opacity={0.9} />
              <rect x={2} y={2.5} width={1.5} height={1.5} fill="#000" />
              <rect x={4.5} y={2.5} width={1.5} height={1.5} fill="#000" />
              <rect x={2.5} y={6} width={3} height={0.8} fill="#000" />
            </g>
          )}
          {bannerId === 'banner_phoenix' && (
            <g>
              <ellipse cx={4} cy={5} rx={2.5} ry={3} fill="#ff6600" opacity={0.85} />
              <ellipse cx={4} cy={4} rx={1.5} ry={2} fill="#ffaa00" opacity={0.7} />
              <ellipse cx={4} cy={2} rx={1} ry={1.5} fill="#ffdd44" opacity={0.6} />
            </g>
          )}
        </g>
      )}

      {/* Corrupted: torn edge / cracks */}
      {corrupted && (
        <g pointerEvents="none">
          <line x1={10} y1={8} x2={20 + waveOffset * 0.3} y2={16}
                stroke="#6622aa" strokeWidth="1" opacity={0.6} />
          <line x1={15} y1={12} x2={25 + waveOffset * 0.3} y2={20}
                stroke="#6622aa" strokeWidth="0.8" opacity={0.4} />
          <circle cx={18 + waveOffset * 0.3} cy={14} r={2} fill="#8844cc" opacity={0.3 + Math.sin(Date.now() * 0.003) * 0.15} />
        </g>
      )}

      {/* Boss skull icon */}
      {isBossFlag && !captured && !corrupted && (
        <g transform={`translate(${12 + waveOffset * 0.5}, 8)`} pointerEvents="none">
          <circle cx={6} cy={6} r={5} fill="#fff" />
          <rect x={3} y={4} width={2} height={2} fill="#000" />
          <rect x={7} y={4} width={2} height={2} fill="#000" />
          <rect x={4} y={8} width={4} height={1} fill="#000" />
        </g>
      )}

      {/* === LAYER 5: Labels (on top of everything) === */}
      {isBossFlag && !captured && !corrupted && (
        <text x={2} y={-8} fill="#ff3333" fontSize="9" textAnchor="middle" fontWeight="bold">
          BOSS
        </text>
      )}
      {corrupted && (
        <text x={2} y={-8} fill="#8844cc" fontSize="8" textAnchor="middle" fontWeight="bold">
          💀
        </text>
      )}
      {isContesting && (
        <text x={2} y={-8} fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
          {Math.ceil((contestTimer || 0) / 60)}s
        </text>
      )}
    </g>
  );
}
