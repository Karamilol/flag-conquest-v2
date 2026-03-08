import { COLORS } from '../../constants';
import { getSkillDef } from '../../skills';

const TYPE_COLORS: Record<string, string> = {
  active: '#4a9fff',
  passive: '#ffd700',
  triggered: '#ff88cc',
};

interface Props {
  skillIds: string[];
  onSelect: (skillId: string) => void;
}

export function SkillPicker({ skillIds, onSelect }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px 10px',
    }}>
      <div style={{ color: COLORS.gold, fontSize: '13px', marginBottom: '3px', textAlign: 'center' }}>
        {'\u2694\uFE0F'} NEW SKILL UNLOCKED!
      </div>
      <div style={{ color: COLORS.text, fontSize: '11px', marginBottom: '10px', textAlign: 'center' }}>
        Choose a skill:
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '480px' }}>
        {skillIds.map(id => {
          const skill = getSkillDef(id);
          if (!skill) return null;
          const borderColor = TYPE_COLORS[skill.type] || '#6a6a8e';
          const typeLabel = skill.type === 'active' ? 'Active' : skill.type === 'passive' ? 'Passive' : 'Triggered';
          return (
            <button key={id} onClick={() => onSelect(id)} style={{
              padding: '8px 6px', background: 'linear-gradient(180deg, rgba(40,20,65,0.95) 0%, rgba(25,12,45,0.95) 100%)',
              border: `2px solid ${borderColor}`, borderRadius: '10px', cursor: 'pointer',
              width: '145px', textAlign: 'center', fontFamily: 'inherit',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '5px' }}>{skill.icon}</div>
              <div style={{ color: COLORS.gold, fontSize: '10px', marginBottom: '3px' }}>{skill.name}</div>
              <div style={{ color: borderColor, fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {typeLabel}
              </div>
              <div style={{ color: COLORS.text, fontSize: '9px', lineHeight: '1.2' }}>{skill.desc}</div>
              {skill.cooldownFrames > 0 && (
                <div style={{ color: COLORS.textDim, fontSize: '8px', marginTop: '3px' }}>
                  CD: {skill.cooldownFrames / 60}s
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
