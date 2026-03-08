import { useState, type DragEvent } from 'react';
import {
  Regalia, RegaliaSlot, RegaliaState, RegaliaRarity,
  RARITY_COLORS, SLOT_ICONS, LEVEL_MULTS,
  getUpgradeCost, getSalvageRewards, getMaxStars, getTotalStars,
  getEnhanceCost, MAX_ENHANCES, STAR_COST, MAX_STASH,
  getModDisplayText, getEffectiveModValue,
  enhanceModifier, addStar, levelUpRegalia,
} from '../../regalias';

interface Props {
  regaliaState: RegaliaState;
  onEquip: (regalia: Regalia) => void;
  onUnequip: (slot: RegaliaSlot) => void;
  onSalvage: (regaliaId: string) => void;
  onSalvageAllCommon: () => void;
  onUpgrade: (regaliaId: string) => void;
  onEnhance: (regaliaId: string, modIndex: number) => void;
  onAddStar: (regaliaId: string, modIndex: number) => void;
}

const RARITY_ORDER: Record<RegaliaRarity, number> = { common: 0, rare: 1, legendary: 2 };
const SLOT_LABELS: Record<RegaliaSlot, string> = { sword: 'Sword', shield: 'Shield', necklace: 'Necklace' };
const SLOTS: RegaliaSlot[] = ['sword', 'shield', 'necklace'];

function StarDisplay({ count, max, size = 13 }: { count: number; max: number; size?: number }) {
  return <span style={{ color: '#ffd700', fontSize: `${size}px`, letterSpacing: '1px' }}>{'*'.repeat(count)}<span style={{ color: '#555' }}>{'*'.repeat(Math.max(0, max - count))}</span></span>;
}

export function RegaliaPanel({
  regaliaState, onEquip, onUnequip, onSalvage, onSalvageAllCommon,
  onUpgrade, onEnhance, onAddStar,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModIdx, setSelectedModIdx] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<RegaliaSlot | null>(null);

  const { equipped, stash, essence, stardust } = regaliaState;

  // All regalias for lookup
  const allRegalias: Regalia[] = [
    ...(Object.values(equipped).filter(Boolean) as Regalia[]),
    ...stash,
  ];
  const selected = selectedId ? allRegalias.find(r => r.id === selectedId) || null : null;
  const isSelectedEquipped = selected ? Object.values(equipped).some(r => r?.id === selected.id) : false;

  const handleSelect = (id: string) => {
    if (selectedId === id) { setSelectedId(null); setSelectedModIdx(null); }
    else { setSelectedId(id); setSelectedModIdx(null); }
  };

  // Sort stash: legendary > rare > common, then zone desc
  const sortedStash = [...stash].sort((a, b) => {
    const rd = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
    return rd !== 0 ? rd : b.zone - a.zone;
  });

  const hasCommons = stash.some(r => r.rarity === 'common');

  // Drag handlers
  const handleDragStart = (e: DragEvent, regalia: Regalia) => {
    e.dataTransfer.setData('text/plain', regalia.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, slot: RegaliaSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  };

  const handleDragLeave = () => setDragOverSlot(null);

  const handleDrop = (e: DragEvent, slot: RegaliaSlot) => {
    e.preventDefault();
    setDragOverSlot(null);
    const id = e.dataTransfer.getData('text/plain');
    const item = stash.find(r => r.id === id);
    if (item && item.slot === slot) {
      onEquip(item);
      setSelectedId(null);
    }
  };

  const handleDoubleClick = (regalia: Regalia) => {
    onEquip(regalia);
    setSelectedId(null);
  };

  return (
    <div style={{ padding: '8px', fontFamily: '"Press Start 2P", "Courier New", monospace' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#ff88cc', fontSize: '16px', fontWeight: 'bold' }}>{'\u{1F451}'} REGALIA</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ color: '#cc88ff', fontSize: '13px' }}>{'\u{1F9FF}'} {essence}</span>
          <span style={{ color: '#ffd700', fontSize: '13px' }}>{'\u2728'} {stardust}</span>
        </div>
      </div>

      {/* Equip Slots — always full width */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {SLOTS.map(slot => {
          const item = equipped[slot];
          const isDragTarget = dragOverSlot === slot;
          const isSlotSelected = selected && isSelectedEquipped && selected.slot === slot;
          const borderColor = isDragTarget ? '#4aff4a' : isSlotSelected ? '#ffd700' : item ? RARITY_COLORS[item.rarity] : '#444';
          const glowColor = isDragTarget ? 'rgba(74,255,74,0.3)' : isSlotSelected ? 'rgba(255,215,0,0.3)' : item ? `${RARITY_COLORS[item.rarity]}33` : 'none';

          return (
            <div
              key={slot}
              onClick={() => item && handleSelect(item.id)}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slot)}
              style={{
                flex: 1,
                background: isDragTarget ? 'rgba(74,255,74,0.08)' : isSlotSelected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${borderColor}`,
                borderRadius: '6px',
                padding: '8px 6px',
                cursor: item ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                boxShadow: glowColor !== 'none' ? `0 0 10px ${glowColor}` : 'none',
              }}
            >
              <span style={{ color: '#888', fontSize: '9px', fontWeight: 'bold', marginBottom: '3px', letterSpacing: '1px' }}>{SLOT_LABELS[slot].toUpperCase()}</span>
              <span style={{ fontSize: '26px', lineHeight: 1 }}>{SLOT_ICONS[slot]}</span>
              {item ? (
                <>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ color: RARITY_COLORS[item.rarity], fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.rarity[0]}</span>
                    <span style={{ color: '#aaa', fontSize: '9px' }}>Z{item.zone}</span>
                    {item.level > 0 && <span style={{ color: '#4aff4a', fontSize: '9px' }}>+{item.level}</span>}
                  </div>
                  {getTotalStars(item) > 0 && (
                    <div style={{ marginTop: '2px' }}>
                      <StarDisplay count={getTotalStars(item)} max={getMaxStars(item.rarity)} />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#555', fontSize: '10px', fontStyle: 'italic', marginTop: '4px' }}>Empty</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Two-column layout: stash left, detail right */}
      <div style={{ display: 'flex', gap: '8px' }}>

        {/* === LEFT: Stash === */}
        <div style={{ flex: '1 1 0%', minWidth: 0 }}>

          {/* Stash header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: '#ff88cc', fontSize: '13px', fontWeight: 'bold' }}>STASH ({stash.length}/{MAX_STASH})</span>
            {hasCommons && (
              <button onClick={onSalvageAllCommon} style={{
                padding: '2px 6px', fontSize: '8px', fontFamily: 'inherit',
                background: '#553333', color: '#ff8888', border: '1px solid #774444',
                borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>SALVAGE COMMON</button>
            )}
          </div>

          {/* Stash grid */}
          {stash.length === 0 ? (
            <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
              No regalia in stash. Defeat bosses and enemies to find them!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '4px' }}>
              {sortedStash.map(regalia => {
                const isItemSelected = selectedId === regalia.id;
                const rarityColor = RARITY_COLORS[regalia.rarity];
                const totalStars = getTotalStars(regalia);
                return (
                  <div
                    key={regalia.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, regalia)}
                    onClick={() => handleSelect(regalia.id)}
                    onDoubleClick={() => handleDoubleClick(regalia)}
                    title={`${regalia.name} (${regalia.rarity} Z${regalia.zone})`}
                    style={{
                      background: isItemSelected ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${isItemSelected ? '#ffd700' : rarityColor}`,
                      borderRadius: '4px',
                      padding: '3px',
                      cursor: 'grab',
                      userSelect: 'none',
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isItemSelected ? '0 0 8px rgba(255,215,0,0.3)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{SLOT_ICONS[regalia.slot]}</span>
                    <span style={{ color: '#aaa', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>Z{regalia.zone}</span>
                    {(regalia.level > 0 || totalStars > 0) && (
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginTop: '1px' }}>
                        {regalia.level > 0 && <span style={{ color: '#4aff4a', fontSize: '8px' }}>+{regalia.level}</span>}
                        {totalStars > 0 && <span style={{ color: '#ffd700', fontSize: '9px' }}>{'*'.repeat(totalStars)}</span>}
                      </div>
                    )}
                    <span style={{
                      position: 'absolute', top: '1px', right: '2px',
                      color: rarityColor, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                      textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    }}>{regalia.rarity[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* === RIGHT: Detail Panel */}
        <div style={{
          width: '190px',
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}>
          {selected ? (
            <div style={{
              background: 'rgba(10,5,15,0.98)',
              border: `1.5px solid ${RARITY_COLORS[selected.rarity]}`,
              borderRadius: '6px',
              padding: '8px',
              boxShadow: `0 0 12px ${RARITY_COLORS[selected.rarity]}22`,
            }}>
              {/* Item icon + name */}
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '28px', display: 'block' }}>{SLOT_ICONS[selected.slot]}</span>
                <div style={{ color: RARITY_COLORS[selected.rarity], fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>{selected.name}</div>
                <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>
                  {selected.rarity.toUpperCase()} {'\u2022'} Zone {selected.zone}
                  {selected.level > 0 ? ` \u2022 +${selected.level}` : ''}
                </div>
                {getTotalStars(selected) > 0 && (
                  <div style={{ marginTop: '2px' }}>
                    <StarDisplay count={getTotalStars(selected)} max={getMaxStars(selected.rarity)} />
                  </div>
                )}
                {isSelectedEquipped && (
                  <div style={{ color: '#4aff4a', fontSize: '9px', background: 'rgba(74,255,74,0.12)', padding: '1px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '4px' }}>EQUIPPED</div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

              {/* Modifiers — click to select, then actions appear */}
              <div style={{ marginBottom: '6px' }}>
                <div style={{ color: '#999', fontSize: '9px', marginBottom: '4px', letterSpacing: '1px' }}>STATS {isSelectedEquipped && <span style={{ color: '#666' }}>(click to modify)</span>}</div>
                {selected.modifiers.map((mod, i) => {
                  const tier = mod.enhances || 0;
                  const isModSelected = selectedModIdx === i;
                  const tierBg = isModSelected ? 'rgba(255,215,0,0.2)'
                    : tier === 2 ? 'rgba(160,80,255,0.25)'
                    : tier === 1 ? 'rgba(60,120,255,0.2)'
                    : 'rgba(255,255,255,0.04)';
                  const tierBorder = isModSelected ? '1px solid rgba(255,215,0,0.5)'
                    : tier === 2 ? '1px solid rgba(160,80,255,0.5)'
                    : tier === 1 ? '1px solid rgba(60,120,255,0.4)'
                    : '1px solid transparent';
                  return (
                    <div key={i}>
                      <div
                        onClick={isSelectedEquipped ? (e) => {
                          e.stopPropagation();
                          setSelectedModIdx(isModSelected ? null : i);
                        } : undefined}
                        style={{
                          color: tier === 2 ? '#cc88ff' : tier === 1 ? '#88bbff' : '#ddd', fontSize: '10px',
                          background: tierBg,
                          padding: '3px 5px', borderRadius: '3px',
                          marginBottom: isModSelected ? '0' : '2px',
                          cursor: isSelectedEquipped ? 'pointer' : 'default',
                          border: tierBorder,
                          lineHeight: '1.4',
                          borderBottomLeftRadius: isModSelected ? 0 : '3px',
                          borderBottomRightRadius: isModSelected ? 0 : '3px',
                        }}
                      >
                        {getModDisplayText(mod, selected.level)}
                        {mod.stars > 0 && <span style={{ color: '#ffd700' }}> {'*'.repeat(mod.stars)}</span>}
                      </div>
                      {/* Inline actions for selected mod */}
                      {isModSelected && isSelectedEquipped && (
                        <div style={{
                          display: 'flex', gap: '3px', padding: '3px 4px',
                          background: 'rgba(255,215,0,0.08)',
                          border: '1px solid rgba(255,215,0,0.3)', borderTop: 'none',
                          borderRadius: '0 0 3px 3px', marginBottom: '2px',
                        }}>
                          {(() => {
                            const cost = getEnhanceCost(mod);
                            if (!cost) return <span style={{ color: '#555', fontSize: '9px' }}>MAXED</span>;
                            const canAfford = essence >= cost.essence && stardust >= cost.stardust;
                            const label = cost.stardust > 0 ? `ENHANCE ${cost.essence}e+${cost.stardust}\u2728` : `ENHANCE ${cost.essence}e`;
                            return (
                              <button onClick={(e) => { e.stopPropagation(); onEnhance(selected.id, i); }} disabled={!canAfford} style={{
                                padding: '2px 6px', fontSize: '9px', fontFamily: 'inherit',
                                background: canAfford ? '#334455' : '#333',
                                color: canAfford ? '#88bbff' : '#555',
                                border: `1px solid ${canAfford ? '#445566' : '#444'}`,
                                borderRadius: '3px', cursor: canAfford ? 'pointer' : 'not-allowed', flex: 1,
                              }}>{label}</button>
                            );
                          })()}
                          {(() => {
                            const maxStars = getMaxStars(selected.rarity);
                            const totalSt = getTotalStars(selected);
                            if (totalSt >= maxStars) return null;
                            const canAfford = stardust >= STAR_COST;
                            return (
                              <button onClick={(e) => { e.stopPropagation(); onAddStar(selected.id, i); }} disabled={!canAfford} style={{
                                padding: '2px 6px', fontSize: '9px', fontFamily: 'inherit',
                                background: canAfford ? '#443355' : '#333',
                                color: canAfford ? '#cc88ff' : '#555',
                                border: `1px solid ${canAfford ? '#554466' : '#444'}`,
                                borderRadius: '3px', cursor: canAfford ? 'pointer' : 'not-allowed', flex: 1,
                              }}>ADD * {STAR_COST}{'\u2728'}</button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

              {/* Comparison with equipped item */}
              {!isSelectedEquipped && equipped[selected.slot] && (() => {
                const eq = equipped[selected.slot]!;
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,136,68,0.3)' }} />
                      <span style={{ color: '#ff8844', fontSize: '8px', letterSpacing: '1px' }}>VS EQUIPPED</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,136,68,0.3)' }} />
                    </div>
                    <div style={{ background: 'rgba(255,136,68,0.06)', borderRadius: '4px', padding: '5px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{SLOT_ICONS[eq.slot]}</span>
                        <div>
                          <div style={{ color: RARITY_COLORS[eq.rarity], fontSize: '9px', fontWeight: 'bold' }}>{eq.name}</div>
                          <div style={{ color: '#666', fontSize: '8px' }}>
                            {eq.rarity.toUpperCase()} Z{eq.zone}{eq.level > 0 ? ` +${eq.level}` : ''}
                            {getTotalStars(eq) > 0 && <span style={{ color: '#ffd700' }}> {'*'.repeat(getTotalStars(eq))}</span>}
                          </div>
                        </div>
                      </div>
                      {eq.modifiers.map((mod, i) => {
                        const tier = mod.enhances || 0;
                        return (
                          <div key={i} style={{
                            color: tier === 2 ? '#cc88ff' : tier === 1 ? '#88bbff' : '#aaa',
                            fontSize: '9px', padding: '1px 3px', lineHeight: '1.4',
                          }}>
                            {getModDisplayText(mod, eq.level)}
                            {mod.stars > 0 && <span style={{ color: '#ffd700' }}> {'*'.repeat(mod.stars)}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {isSelectedEquipped ? (
                  <>
                    <button onClick={() => { onUnequip(selected.slot); setSelectedId(null); setSelectedModIdx(null); }} style={{
                      padding: '4px 8px', fontSize: '10px', fontFamily: 'inherit',
                      background: '#553333', color: '#ff8888', border: '1px solid #774444',
                      borderRadius: '3px', cursor: 'pointer', width: '100%',
                    }}>UNEQUIP</button>

                    {(() => {
                      const cost = getUpgradeCost(selected.level);
                      if (cost === null) return null;
                      const canAfford = essence >= cost;
                      return (
                        <button onClick={() => canAfford && onUpgrade(selected.id)} disabled={!canAfford} style={{
                          padding: '4px 8px', fontSize: '10px', fontFamily: 'inherit',
                          background: canAfford ? '#335533' : '#333',
                          color: canAfford ? '#88ff88' : '#555',
                          border: `1px solid ${canAfford ? '#447744' : '#444'}`,
                          borderRadius: '3px', cursor: canAfford ? 'pointer' : 'not-allowed', width: '100%',
                        }}>UPGRADE {cost}e</button>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <button onClick={() => { onEquip(selected); setSelectedId(null); setSelectedModIdx(null); }} style={{
                      padding: '4px 8px', fontSize: '10px', fontFamily: 'inherit',
                      background: '#335533', color: '#88ff88', border: '1px solid #447744',
                      borderRadius: '3px', cursor: 'pointer', width: '100%',
                    }}>
                      EQUIP {SLOT_ICONS[selected.slot]}
                      {equipped[selected.slot] && <span style={{ color: '#ffaa44' }}> (SWAP)</span>}
                    </button>

                    <button onClick={() => { onSalvage(selected.id); setSelectedId(null); }} style={{
                      padding: '4px 8px', fontSize: '10px', fontFamily: 'inherit',
                      background: '#553333', color: '#ff8888', border: '1px solid #774444',
                      borderRadius: '3px', cursor: 'pointer', width: '100%',
                    }}>
                      SALVAGE ({(() => {
                        const r = getSalvageRewards(selected.rarity);
                        const parts = [];
                        if (r.essence > 0) parts.push(`${r.essence}e`);
                        if (r.stardust > 0) parts.push(`${r.stardust}\u2728`);
                        return parts.join(' ');
                      })()})
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1.5px solid #333',
              borderRadius: '6px',
              padding: '16px 8px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#555', fontSize: '11px', lineHeight: '1.6' }}>
                Select an item to view stats
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
