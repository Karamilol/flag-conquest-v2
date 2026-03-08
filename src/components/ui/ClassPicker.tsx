import { COLORS } from '../../constants';
import { CLASS_DEFS } from '../../classes';
import type { HeroClassId } from '../../classes';

interface Props {
  onSelect: (classId: HeroClassId) => void;
  highestZone?: number;
}

export function ClassPicker({ onSelect, highestZone = 0 }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '20px', borderRadius: '8px',
    }}>
      <div style={{ color: COLORS.gold, fontSize: '17px', marginBottom: '6px', textAlign: 'center' }}>
        {'\u2694\uFE0F'} CHOOSE YOUR CLASS
      </div>
      <div style={{ color: COLORS.text, fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>
        Select a hero to begin your conquest:
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '500px' }}>
        {CLASS_DEFS.map(cls => {
          const atkLabel = cls.attackType === 'melee' ? 'MELEE' : 'RANGED';
          const locked = (cls.id === 'ranger' && highestZone < 2) || (cls.id === 'mage' && highestZone < 4);
          return (
            <button key={cls.id} onClick={() => !locked && onSelect(cls.id)} disabled={locked} style={{
              padding: '16px 14px', background: 'linear-gradient(180deg, rgba(40,20,65,0.95) 0%, rgba(25,12,45,0.95) 100%)',
              border: `3px solid ${cls.colors.primary}`, borderRadius: '10px', cursor: 'pointer',
              width: '180px', textAlign: 'center', fontFamily: 'inherit',
            }}>
              <div style={{ fontSize: '33px', marginBottom: '8px' }}>{locked ? '\u{1F512}' : cls.icon}</div>
              <div style={{ color: locked ? '#555' : COLORS.gold, fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>{cls.name}</div>
              <div style={{ color: cls.colors.primary, fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {atkLabel}
              </div>
              <div style={{ color: locked ? '#555' : COLORS.text, fontSize: '11px', lineHeight: '1.4', marginBottom: '10px' }}>
                {locked ? (cls.id === 'mage' ? 'Defeat the Necrolord to unlock' : 'Defeat the Wild Huntsman to unlock') : cls.description}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: '#ff6666' }}>{'\u2764'} {cls.baseStats.hp}</span>
                <span style={{ color: '#ffaa44' }}>{'\u2694'} {cls.baseStats.dmg}</span>
                <span style={{ color: '#66aaff' }}>{'\u{1F6E1}'} {cls.baseStats.def}</span>
                <span style={{ color: '#44dd88' }}>{'\u{1F3C3}'} {cls.baseStats.speed}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
