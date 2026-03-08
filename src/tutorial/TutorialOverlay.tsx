import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import type { TutorialDialogue } from './tutorialData';

interface Props {
  dialogue: TutorialDialogue;
  dialogueIndex: number;
  playerName: string;
  darkOverlay: boolean;
  onAdvance: () => void;
  onNameSubmit: (name: string) => void;
}

export function TutorialOverlay({
  dialogue,
  dialogueIndex,
  playerName,
  darkOverlay,
  onAdvance,
  onNameSubmit,
}: Props) {
  const [nameInput, setNameInput] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger fade-in on each new dialogue
  useEffect(() => {
    setFadeIn(false);
    const t = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(t);
  }, [dialogueIndex]);

  // Focus input when name input appears
  useEffect(() => {
    if (dialogue.hasNameInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dialogue.hasNameInput]);

  const displayText = dialogue.text.replace(/\[Name\]/g, playerName || 'Commander');

  const handleNameConfirm = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length > 0) {
      onNameSubmit(trimmed);
    }
  };

  return (
    <div
      onClick={dialogue.hasNameInput ? undefined : onAdvance}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: darkOverlay
          ? 'rgba(0,0,0,0.85)'
          : 'rgba(0,0,0,0.45)',
        cursor: dialogue.hasNameInput ? 'default' : 'pointer',
        paddingBottom: '10px',
      }}
    >
      {/* Dialogue box */}
      <div
        style={{
          width: '92%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
          border: '2px solid #8a4adf',
          borderRadius: '6px',
          padding: '10px 12px',
          boxShadow: '0 0 20px rgba(138,74,223,0.4), 0 4px 16px rgba(0,0,0,0.6)',
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.3s ease-in',
        }}
      >
        {/* Speaker name */}
        <div style={{
          color: COLORS.gold,
          fontSize: '10px',
          fontFamily: 'inherit',
          marginBottom: '6px',
          textShadow: '0 0 6px rgba(255,215,0,0.4)',
        }}>
          {dialogue.speaker}
        </div>

        {/* Text */}
        <div style={{
          color: '#e0d8f0',
          fontSize: '11px',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          minHeight: '32px',
        }}>
          {displayText}
        </div>

        {/* Name input field (Step 1 only) */}
        {dialogue.hasNameInput && (
          <div style={{
            marginTop: '10px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameConfirm(); }}
              placeholder="Enter your name..."
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '11px',
                fontFamily: 'inherit',
                background: 'rgba(20,15,35,0.8)',
                color: '#fff',
                border: '1px solid #8a4adf',
                borderRadius: '4px',
                outline: 'none',
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleNameConfirm(); }}
              disabled={nameInput.trim().length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '10px',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                background: nameInput.trim().length > 0 ? COLORS.gold : '#444',
                color: nameInput.trim().length > 0 ? '#333' : '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: nameInput.trim().length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              CONFIRM
            </button>
          </div>
        )}

        {/* Tap to continue hint (non-name-input dialogues) */}
        {!dialogue.hasNameInput && (
          <div style={{
            color: '#666',
            fontSize: '8px',
            fontFamily: 'inherit',
            textAlign: 'right',
            marginTop: '6px',
          }}>
            Tap to continue
          </div>
        )}
      </div>
    </div>
  );
}
