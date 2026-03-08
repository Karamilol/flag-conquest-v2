// SVG string generators for flag building sprites
// Converts old PixelFlag.tsx JSX buildings into cacheable SVG strings
// Each building is rendered to a bitmap once, then drawn with ctx.drawImage()

// ViewBox covers all building element coordinates with margin
export const BLDG_VB_X = -6;
export const BLDG_VB_Y = -15;
export const BLDG_VB_W = 50;
export const BLDG_VB_H = 50;
export const BLDG_SCALE = 3.4;
export const BLDG_IMG_W = BLDG_VB_W * BLDG_SCALE; // 170
export const BLDG_IMG_H = BLDG_VB_H * BLDG_SCALE; // 170

function wrap(elements: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BLDG_VB_X} ${BLDG_VB_Y} ${BLDG_VB_W} ${BLDG_VB_H}" width="${BLDG_IMG_W}" height="${BLDG_IMG_H}">${elements}</svg>`;
}

function barracksSVG(a: boolean): string {
  const m = a ? '#3a4a6a' : '#2a2a3a'; // foundation
  const ml = a ? '#4a5a7a' : '#3a3a4a';
  const body = a ? '#4a6a9f' : '#3a3a5a';
  const bl = a ? '#5a7aaf' : '#4a4a6a';
  const st = a ? '#3a5a8f' : '#2a2a4a';
  const tw = a ? '#3a5a8f' : '#2a2a4a';
  const twb = a ? '#4a6a9f' : '#3a3a5a';
  const mer = a ? '#2a4a7f' : '#1a1a3a';
  const win = a ? '#1a2a3a' : '#222';
  const door = a ? '#4a2a1a' : '#222';
  const dt = a ? '#3a1a0a' : '#1a1a1a';
  const rf = a ? '#3a5a8f' : '#2a2a4a';
  const rfl = a ? '#4a6a9f' : '#3a3a5a';
  const rfs = a ? '#2a4a7f' : '#1a1a3a';
  const wb = a ? '#6a9ab8' : '#333';
  const wf = a ? '#4a6a8a' : '#333';
  const df = a ? '#5a3a2a' : '#333';
  const dh = a ? '#cc9944' : '#555';
  const dr2 = a ? '#2a1a0a' : '#1a1a1a';
  return `
<rect x="2" y="29" width="28" height="3" fill="${m}"/>
<rect x="3" y="29" width="26" height="0.6" fill="${ml}" opacity="0.4"/>
<rect x="3" y="10" width="19" height="19" fill="${body}"/>
<rect x="4" y="11" width="17" height="0.8" fill="${bl}" opacity="0.3"/>
<line x1="3" y1="15" x2="22" y2="15" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="3" y1="20" x2="22" y2="20" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="3" y1="25" x2="22" y2="25" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="10" y1="10" x2="10" y2="29" stroke="${st}" stroke-width="0.2" opacity="0.15"/>
<line x1="17" y1="10" x2="17" y2="29" stroke="${st}" stroke-width="0.2" opacity="0.15"/>
<rect x="22" y="4" width="7" height="25" fill="${tw}"/>
<rect x="22.5" y="5" width="6" height="0.8" fill="${twb}" opacity="0.3"/>
<line x1="22" y1="10" x2="29" y2="10" stroke="${mer}" stroke-width="0.2" opacity="0.2"/>
<line x1="22" y1="16" x2="29" y2="16" stroke="${mer}" stroke-width="0.2" opacity="0.2"/>
<line x1="22" y1="22" x2="29" y2="22" stroke="${mer}" stroke-width="0.2" opacity="0.2"/>
<rect x="22" y="0" width="7" height="2.5" fill="${tw}"/>
<rect x="22" y="-2" width="2.5" height="2.5" fill="${mer}"/>
<rect x="26.5" y="-2" width="2.5" height="2.5" fill="${mer}"/>
<rect x="22" y="-2" width="2.5" height="0.5" fill="${twb}" opacity="0.4"/>
<rect x="26.5" y="-2" width="2.5" height="0.5" fill="${twb}" opacity="0.4"/>
<rect x="24.5" y="10" width="1.5" height="5" fill="${win}"/>
<rect x="24" y="12" width="2.5" height="1" fill="${win}"/>
<rect x="23" y="22" width="5" height="7" fill="${door}"/>
<rect x="23" y="22" width="5" height="1" fill="${dt}"/>
<polygon points="3,10 12.5,0 22,10" fill="${rf}"/>
<polygon points="3,10 12.5,0 12.5,2 5,10" fill="${rfl}" opacity="0.35"/>
<line x1="3" y1="10" x2="22" y2="10" stroke="${rfs}" stroke-width="0.5"/>
<line x1="5.85" y1="7" x2="19.15" y2="7" stroke="${rfs}" stroke-width="0.25" opacity="0.3"/>
<line x1="8.7" y1="4" x2="16.3" y2="4" stroke="${rfs}" stroke-width="0.25" opacity="0.3"/>
<rect x="5" y="14" width="4.5" height="5" fill="${win}"/>
<ellipse cx="7.25" cy="14" rx="2.25" ry="1.5" fill="${win}"/>
${a ? '<rect x="5.5" y="14.5" width="3.5" height="4" fill="#ddaa44" opacity="0.15"/>' : ''}
<rect x="5" y="16" width="4.5" height="0.5" fill="${wb}" opacity="0.4"/>
<line x1="7.25" y1="12.5" x2="7.25" y2="19" stroke="${wf}" stroke-width="0.4"/>
<rect x="15" y="14" width="4.5" height="5" fill="${win}"/>
<ellipse cx="17.25" cy="14" rx="2.25" ry="1.5" fill="${win}"/>
${a ? '<rect x="15.5" y="14.5" width="3.5" height="4" fill="#ddaa44" opacity="0.15"/>' : ''}
<rect x="15" y="16" width="4.5" height="0.5" fill="${wb}" opacity="0.4"/>
<line x1="17.25" y1="12.5" x2="17.25" y2="19" stroke="${wf}" stroke-width="0.4"/>
<rect x="10" y="18" width="6" height="11" fill="${dr2}"/>
<ellipse cx="13" cy="18" rx="3" ry="2.5" fill="${dr2}"/>
<rect x="9.5" y="18" width="0.8" height="11" fill="${df}"/>
<rect x="15.7" y="18" width="0.8" height="11" fill="${df}"/>
<ellipse cx="13" cy="18" rx="3.3" ry="2.8" fill="none" stroke="${df}" stroke-width="0.8"/>
<circle cx="14.5" cy="24" r="0.6" fill="${dh}"/>
<line x1="3.5" y1="18" x2="3.5" y2="29" stroke="${a ? '#6b4423' : '#333'}" stroke-width="0.5"/>
<line x1="4.5" y1="14" x2="4" y2="29" stroke="${a ? '#999' : '#444'}" stroke-width="0.4"/>
<polygon points="4.5,14 4,15 5,15" fill="${a ? '#aaa' : '#555'}"/>
<line x1="9" y1="18" x2="9" y2="22" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.6"/>
${a ? `<ellipse cx="9" cy="17" rx="1" ry="1.5" fill="#ff6633" opacity="0.5"/>
<ellipse cx="9" cy="16.5" rx="0.5" ry="1" fill="#ffcc66" opacity="0.4"/>
<line x1="28" y1="4" x2="28" y2="14" stroke="#8b7355" stroke-width="0.6"/>
<polygon points="28,5 22,7 22,11 28,9" fill="#cc3333" opacity="0.85"/>
<polygon points="28,5 22,7 22,8 28,6" fill="#dd4444" opacity="0.3"/>` : ''}`;
}

function churchSVG(a: boolean): string {
  const fn = a ? '#6a6a6a' : '#2a2a3a';
  const fnl = a ? '#777' : '#333';
  const bt = a ? '#a09470' : '#2a2618';
  const bt2 = a ? '#b0a480' : '#302a20';
  const nave = a ? '#c4b898' : '#3a3828';
  const mort = a ? '#b0a480' : '#2a2a20';
  const twr = a ? '#c4b898' : '#3a3828';
  const bell = a ? '#c4a030' : '#444';
  const bellr = a ? '#d4b040' : '#555';
  const rf = a ? '#6a4a2a' : '#2a2520';
  const rfl = a ? '#7a5a3a' : '#333';
  const rfs = a ? '#5a3a1a' : '#1a1a18';
  const caprf = a ? '#6a4a2a' : '#2a2520';
  const cross = a ? '#ffd700' : '#555';
  const sg = a ? '#1a2240' : '#181818';
  const sgl = a ? '#aa8830' : '#333';
  const lw = a ? '#2a3555' : '#181818';
  const door = a ? '#3a2518' : '#1a1510';
  const df = a ? '#8a7a5a' : '#2a2a20';
  const dh = a ? '#daa520' : '#444';
  const cs = a ? '#555' : '#333';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${fnl}" opacity="0.4"/>
<polygon points="-1,29 -1,22 1,16 1,29" fill="${bt}"/>
<polygon points="1,29 1,16 3,10 3,29" fill="${bt2}"/>
<polygon points="27,29 27,16 25,10 25,29" fill="${bt2}"/>
<polygon points="29,29 29,22 27,16 27,29" fill="${bt}"/>
<rect x="3" y="10" width="22" height="19" fill="${nave}"/>
<line x1="3" y1="14" x2="25" y2="14" stroke="${mort}" stroke-width="0.3" opacity="0.35"/>
<line x1="3" y1="18" x2="25" y2="18" stroke="${mort}" stroke-width="0.3" opacity="0.35"/>
<line x1="3" y1="22" x2="25" y2="22" stroke="${mort}" stroke-width="0.3" opacity="0.35"/>
<line x1="3" y1="26" x2="25" y2="26" stroke="${mort}" stroke-width="0.3" opacity="0.35"/>
<line x1="9" y1="10" x2="9" y2="14" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="14" y1="10" x2="14" y2="14" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="19" y1="10" x2="19" y2="14" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="6" y1="14" x2="6" y2="18" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="11" y1="14" x2="11" y2="18" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="17" y1="14" x2="17" y2="18" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<line x1="22" y1="14" x2="22" y2="18" stroke="${mort}" stroke-width="0.2" opacity="0.25"/>
<rect x="10.5" y="-3" width="7" height="9" fill="${twr}"/>
<line x1="10.5" y1="0" x2="17.5" y2="0" stroke="${mort}" stroke-width="0.2" opacity="0.4"/>
<rect x="12.5" y="-2" width="3" height="2.5" fill="${a ? '#1a1515' : '#111'}"/>
<path d="M12.5,-2 Q14,-3.5 15.5,-2" fill="${a ? '#1a1515' : '#111'}"/>
<path d="M13,-0.5 Q13,-1.5 14,-1.5 Q15,-1.5 15,-0.5 Z" fill="${bell}"/>
<rect x="13.7" y="-2" width="0.6" height="0.8" fill="${bellr}"/>
<polygon points="1,10 14,1 27,10" fill="${rf}"/>
<polygon points="1,10 14,1 14,2.5 3,10" fill="${rfl}" opacity="0.35"/>
<line x1="1" y1="10" x2="27" y2="10" stroke="${rfs}" stroke-width="0.6"/>
<polygon points="9.5,-3 14,-9 18.5,-3" fill="${caprf}"/>
<polygon points="9.5,-3 14,-9 14,-7.5 11,-3" fill="${rfl}" opacity="0.3"/>
<rect x="13.3" y="-13" width="1.4" height="4.5" fill="${cross}"/>
<rect x="11.8" y="-11.5" width="4.4" height="1.4" fill="${cross}"/>
${a ? '<rect x="13.6" y="-12.5" width="0.8" height="1.8" fill="#ffee88" opacity="0.35"/>' : ''}
<circle cx="14" cy="5.5" r="2.5" fill="${sg}"/>
<line x1="14" y1="3" x2="14" y2="8" stroke="${sgl}" stroke-width="0.4"/>
<line x1="11.5" y1="5.5" x2="16.5" y2="5.5" stroke="${sgl}" stroke-width="0.4"/>
${a ? `<path d="M14,3 A2.5,2.5 0 0,0 11.5,5.5 L14,5.5 Z" fill="#4466aa" opacity="0.4"/>
<path d="M14,3 A2.5,2.5 0 0,1 16.5,5.5 L14,5.5 Z" fill="#aa3333" opacity="0.35"/>
<path d="M14,8 A2.5,2.5 0 0,1 11.5,5.5 L14,5.5 Z" fill="#cc9933" opacity="0.35"/>
<path d="M14,8 A2.5,2.5 0 0,0 16.5,5.5 L14,5.5 Z" fill="#338844" opacity="0.35"/>` : ''}
<circle cx="14" cy="5.5" r="2.5" fill="none" stroke="${sgl}" stroke-width="0.5"/>
<rect x="5" y="15" width="2" height="3.5" fill="${lw}"/>
<path d="M5,15 Q6,13.5 7,15" fill="${lw}"/>
${a ? '<rect x="5.2" y="15.5" width="1.6" height="2" fill="#4477aa" opacity="0.25"/>' : ''}
<rect x="21" y="15" width="2" height="3.5" fill="${lw}"/>
<path d="M21,15 Q22,13.5 23,15" fill="${lw}"/>
${a ? '<rect x="21.2" y="15.5" width="1.6" height="2" fill="#4477aa" opacity="0.25"/>' : ''}
<rect x="11" y="22" width="6" height="7" fill="${door}"/>
<path d="M11,22 Q14,17.5 17,22" fill="${door}"/>
<rect x="11" y="22" width="0.6" height="7" fill="${df}"/>
<rect x="16.4" y="22" width="0.6" height="7" fill="${df}"/>
<path d="M11,22 Q14,17.5 17,22" fill="none" stroke="${df}" stroke-width="0.5"/>
<line x1="14" y1="18" x2="14" y2="29" stroke="${a ? '#2a1a10' : '#111'}" stroke-width="0.3" opacity="0.5"/>
<circle cx="15.5" cy="25" r="0.4" fill="${dh}"/>
<line x1="9" y1="25" x2="9" y2="29" stroke="${cs}" stroke-width="0.4"/>
${a ? '<circle cx="9" cy="24.5" r="0.5" fill="#ffaa22" opacity="0.7"/>' : ''}
<line x1="19" y1="25" x2="19" y2="29" stroke="${cs}" stroke-width="0.4"/>
${a ? '<circle cx="19" cy="24.5" r="0.5" fill="#ffaa22" opacity="0.7"/>' : ''}
${a ? '<circle cx="14" cy="5.5" r="5" fill="#ffd700" opacity="0.05"/>' : ''}`;
}

function lumbercampSVG(a: boolean): string {
  const fn = a ? '#5a4a30' : '#2a2a3a';
  const body = a ? '#8a6538' : '#3a3a4a';
  const log = a ? '#5a3a18' : '#2a2a2a';
  const le = a ? '#8a6540' : '#3a3a3a';
  const ler = a ? '#6a4a28' : '#2a2a2a';
  const rf = a ? '#5a3a18' : '#2a2a3a';
  const rfl = a ? '#6a4a28' : '#333';
  const rfs = a ? '#4a2a10' : '#1a1a1a';
  const win = a ? '#1a1a1a' : '#222';
  const wf = a ? '#5a3a18' : '#2a2a2a';
  const door = a ? '#5a3518' : '#2a2a2a';
  const dd = a ? '#4a2a10' : '#1a1a1a';
  const df = a ? '#5a3a18' : '#222';
  const dh = a ? '#888' : '#444';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#6a5a40' : '#333'}" opacity="0.4"/>
<rect x="2" y="10" width="22" height="19" fill="${body}"/>
<line x1="2" y1="13" x2="24" y2="13" stroke="${log}" stroke-width="0.6"/>
<line x1="2" y1="16.5" x2="24" y2="16.5" stroke="${log}" stroke-width="0.6"/>
<line x1="2" y1="20" x2="24" y2="20" stroke="${log}" stroke-width="0.6"/>
<line x1="2" y1="23.5" x2="24" y2="23.5" stroke="${log}" stroke-width="0.6"/>
<line x1="2" y1="27" x2="24" y2="27" stroke="${log}" stroke-width="0.6"/>
<circle cx="2" cy="13" r="1.2" fill="${le}"/>
<circle cx="2" cy="16.5" r="1.2" fill="${le}"/>
<circle cx="2" cy="20" r="1.2" fill="${le}"/>
<circle cx="2" cy="23.5" r="1.2" fill="${le}"/>
<circle cx="2" cy="27" r="1.2" fill="${le}"/>
<circle cx="2" cy="13" r="0.5" fill="none" stroke="${ler}" stroke-width="0.2"/>
<circle cx="2" cy="16.5" r="0.5" fill="none" stroke="${ler}" stroke-width="0.2"/>
<circle cx="2" cy="20" r="0.5" fill="none" stroke="${ler}" stroke-width="0.2"/>
<polygon points="0,10 13,0 26,10" fill="${rf}"/>
<polygon points="0,10 13,0 13,2 2,10" fill="${rfl}" opacity="0.3"/>
<line x1="0" y1="10" x2="26" y2="10" stroke="${rfs}" stroke-width="0.6"/>
<line x1="3" y1="8" x2="7" y2="4" stroke="${rfs}" stroke-width="0.3" opacity="0.3"/>
<line x1="19" y1="8" x2="16" y2="5" stroke="${rfs}" stroke-width="0.3" opacity="0.3"/>
<line x1="23" y1="9" x2="20" y2="6" stroke="${rfs}" stroke-width="0.3" opacity="0.3"/>
<rect x="4" y="14" width="5" height="4.5" fill="${win}"/>
${a ? '<rect x="4.5" y="14.5" width="4" height="3.5" fill="#7799bb" opacity="0.25"/>' : ''}
<line x1="6.5" y1="14" x2="6.5" y2="18.5" stroke="${wf}" stroke-width="0.4"/>
<line x1="4" y1="16.2" x2="9" y2="16.2" stroke="${wf}" stroke-width="0.4"/>
<rect x="13" y="20" width="7" height="9" fill="${door}"/>
<line x1="16.5" y1="20" x2="16.5" y2="29" stroke="${dd}" stroke-width="0.4"/>
<rect x="18" y="24" width="0.8" height="1.5" fill="${dh}" rx="0.2"/>
<rect x="12.5" y="20" width="0.8" height="9" fill="${df}"/>
<rect x="19.7" y="20" width="0.8" height="9" fill="${df}"/>
<rect x="12.5" y="19.5" width="8" height="1" fill="${df}"/>
<line x1="26" y1="28.5" x2="25" y2="20" stroke="${a ? '#8b6840' : '#444'}" stroke-width="0.9" stroke-linecap="round"/>
<polygon points="25,20 27.5,18.5 27.5,21.5" fill="${a ? '#c0c0c0' : '#555'}"/>
<line x1="27.5" y1="18.5" x2="27.5" y2="21.5" stroke="${a ? '#ddd' : '#666'}" stroke-width="0.3"/>
<rect x="28" y="26" width="5" height="3" fill="${a ? '#7a5530' : '#3a3028'}" rx="1"/>
<ellipse cx="30.5" cy="26" rx="2.5" ry="1" fill="${a ? '#9a7550' : '#444'}"/>
<ellipse cx="30.5" cy="26" rx="1.5" ry="0.5" fill="${a ? '#aa8560' : '#4a4a4a'}"/>
<ellipse cx="30.5" cy="26" rx="0.5" ry="0.2" fill="${a ? '#6a4a28' : '#333'}"/>
<rect x="34" y="27.5" width="2" height="1.5" fill="${a ? '#aa8855' : '#3a3028'}" rx="0.4"/>
<rect x="36.5" y="28" width="1.8" height="1" fill="${a ? '#9a7550' : '#3a3028'}" rx="0.4"/>
<rect x="-1" y="27.5" width="4" height="1.8" fill="${a ? '#8a6540' : '#3a3028'}" rx="0.8"/>
<rect x="-0.5" y="27.5" width="3.5" height="1.8" fill="${a ? '#7a5a38' : '#3a3028'}" rx="0.8"/>
<rect x="-0.5" y="25.8" width="3.5" height="1.8" fill="${a ? '#9a7550' : '#4a3a2a'}" rx="0.8"/>
<circle cx="-1" cy="28.4" r="0.7" fill="${a ? '#aa8855' : '#444'}"/>
<circle cx="-0.5" cy="28.4" r="0.7" fill="${a ? '#9a7550' : '#3a3028'}"/>
<circle cx="-0.5" cy="26.7" r="0.7" fill="${a ? '#bb9965' : '#4a4a4a'}"/>
<circle cx="-0.5" cy="26.7" r="0.3" fill="none" stroke="${ler}" stroke-width="0.2"/>
<rect x="-2" y="28.8" width="1" height="0.4" fill="${a ? '#aa8855' : '#3a3a3a'}" opacity="0.5"/>
<rect x="26" y="28.8" width="0.8" height="0.4" fill="${a ? '#aa8855' : '#3a3a3a'}" opacity="0.4"/>
<line x1="24" y1="10" x2="24" y2="12" stroke="${a ? '#555' : '#333'}" stroke-width="0.3"/>
<rect x="23.3" y="12" width="1.5" height="2" fill="${a ? '#444' : '#2a2a2a'}" rx="0.3"/>
${a ? `<rect x="23.6" y="12.3" width="0.9" height="1.4" fill="#ffaa33" opacity="0.5"/>
<circle cx="24" cy="13" r="2" fill="#ffaa33" opacity="0.04"/>` : ''}`;
}

function marketSVG(a: boolean): string {
  return `
<rect x="-1" y="29" width="36" height="3" fill="${a ? '#5a4a2a' : '#2a2a3a'}"/>
<rect x="2" y="12" width="30" height="20" fill="${a ? '#6a5a3a' : '#3a3a4a'}"/>
<rect x="3" y="13" width="28" height="1" fill="${a ? '#7a6a4a' : '#4a4a5a'}" opacity="0.3"/>
<line x1="2" y1="17" x2="32" y2="17" stroke="${a ? '#5a4a2a' : '#333'}" stroke-width="0.4" opacity="0.3"/>
<line x1="2" y1="22" x2="32" y2="22" stroke="${a ? '#5a4a2a' : '#333'}" stroke-width="0.4" opacity="0.3"/>
<line x1="2" y1="27" x2="32" y2="27" stroke="${a ? '#5a4a2a' : '#333'}" stroke-width="0.4" opacity="0.3"/>
<polygon points="-2,12 17,4 38,12" fill="${a ? '#cc3333' : '#2a2a3a'}"/>
<polygon points="-2,12 17,4 17,6 0,12" fill="${a ? '#dd4444' : '#3a3a4a'}" opacity="0.4"/>
<polygon points="2,11 8,6 11,8 5,12" fill="${a ? '#ddcc44' : '#333'}" opacity="0.7"/>
<polygon points="14,8 20,4 23,6 17,10" fill="${a ? '#ddcc44' : '#333'}" opacity="0.7"/>
<polygon points="26,9 32,6 34,7 29,11" fill="${a ? '#ddcc44' : '#333'}" opacity="0.7"/>
<path d="M-2,12 Q0,14 3,12 Q6,14 9,12 Q12,14 15,12 Q18,14 21,12 Q24,14 27,12 Q30,14 33,12 Q36,14 38,12" fill="none" stroke="${a ? '#aa2222' : '#222'}" stroke-width="0.8"/>
<rect x="0" y="10" width="1.5" height="22" fill="${a ? '#6b4423' : '#333'}"/>
<rect x="33" y="10" width="1.5" height="22" fill="${a ? '#6b4423' : '#333'}"/>
<rect x="2" y="23" width="30" height="3" fill="${a ? '#9b7b4b' : '#444'}"/>
<rect x="2" y="23" width="30" height="1" fill="${a ? '#ab8b5b' : '#555'}" opacity="0.5"/>
<rect x="2" y="25" width="30" height="0.5" fill="${a ? '#7a5a3a' : '#333'}" opacity="0.6"/>
<line x1="6" y1="15" x2="6" y2="22" stroke="${a ? '#aaa' : '#555'}" stroke-width="1"/>
<rect x="5" y="14.5" width="2" height="1.5" fill="${a ? '#ddd' : '#666'}"/>
<ellipse cx="9" cy="19" rx="2.5" ry="3" fill="${a ? '#6a88aa' : '#444'}"/>
<ellipse cx="9" cy="19" rx="1.5" ry="2" fill="${a ? '#7a99bb' : '#555'}" opacity="0.4"/>
<rect x="14" y="20" width="2" height="3" fill="${a ? '#cc3333' : '#444'}" rx="0.5"/>
<rect x="13.5" y="19.5" width="3" height="1" fill="${a ? '#dd4444' : '#555'}" rx="0.5"/>
<rect x="17" y="20.5" width="2" height="2.5" fill="${a ? '#4488cc' : '#444'}" rx="0.5"/>
<rect x="16.5" y="20" width="3" height="1" fill="${a ? '#5599dd' : '#555'}" rx="0.5"/>
<rect x="20" y="20" width="2" height="3" fill="${a ? '#44cc66' : '#444'}" rx="0.5"/>
<rect x="19.5" y="19.5" width="3" height="1" fill="${a ? '#55dd77' : '#555'}" rx="0.5"/>
<ellipse cx="26" cy="22.5" rx="2.5" ry="1" fill="${a ? '#ddcc99' : '#444'}"/>
<ellipse cx="26" cy="22.5" rx="2" ry="0.6" fill="${a ? '#eeddaa' : '#555'}" opacity="0.5"/>
<circle cx="24" cy="22.5" r="0.8" fill="${a ? '#bb9966' : '#3a3a3a'}"/>
<circle cx="28" cy="22.5" r="0.8" fill="${a ? '#bb9966' : '#3a3a3a'}"/>
<rect x="24" y="14" width="6" height="7" fill="${a ? '#777' : '#444'}" rx="1"/>
<rect x="25" y="15" width="4" height="5" fill="${a ? '#888' : '#555'}" rx="0.5"/>
<rect x="26" y="14" width="2" height="1" fill="${a ? '#999' : '#555'}"/>
<line x1="8" y1="12" x2="8" y2="15" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.5"/>
<rect x="6.5" y="14.5" width="3" height="2.5" fill="${a ? '#ffaa22' : '#444'}" rx="0.8"/>
${a ? '<rect x="7" y="15" width="2" height="1.5" fill="#ffdd66" opacity="0.4" rx="0.5"/>' : ''}
<line x1="26" y1="12" x2="26" y2="15" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.5"/>
<rect x="24.5" y="14.5" width="3" height="2.5" fill="${a ? '#ffaa22' : '#444'}" rx="0.8"/>
${a ? '<rect x="25" y="15" width="2" height="1.5" fill="#ffdd66" opacity="0.4" rx="0.5"/>' : ''}
<rect x="-4" y="26" width="6" height="6" fill="${a ? '#8b6840' : '#3a3a3a'}"/>
<line x1="-4" y1="29" x2="2" y2="29" stroke="${a ? '#7a5a30' : '#333'}" stroke-width="0.4"/>
<line x1="-1" y1="26" x2="-1" y2="32" stroke="${a ? '#7a5a30' : '#333'}" stroke-width="0.4"/>
<rect x="-3" y="22" width="5" height="4" fill="${a ? '#9b7850' : '#444'}"/>
<line x1="-0.5" y1="22" x2="-0.5" y2="26" stroke="${a ? '#8a6840' : '#3a3a3a'}" stroke-width="0.4"/>
<ellipse cx="36" cy="28" rx="3" ry="4" fill="${a ? '#6b4423' : '#333'}"/>
<ellipse cx="36" cy="28" rx="2.5" ry="3.5" fill="${a ? '#7b5433' : '#3a3a3a'}"/>
<line x1="33" y1="26" x2="39" y2="26" stroke="${a ? '#8b6443' : '#444'}" stroke-width="0.6"/>
<line x1="33" y1="30" x2="39" y2="30" stroke="${a ? '#8b6443' : '#444'}" stroke-width="0.6"/>
<line x1="34" y1="8" x2="34" y2="14" stroke="${a ? '#8b7355' : '#555'}" stroke-width="0.8"/>
<circle cx="37" cy="11" r="3" fill="${a ? '#ffd700' : '#555'}"/>
<circle cx="37" cy="11" r="2.2" fill="${a ? '#ffee44' : '#666'}"/>
${a ? '<text x="37" y="12.5" fill="#aa8800" font-size="3" text-anchor="middle" font-weight="bold">$</text>' : ''}
${a ? '<ellipse cx="17" cy="22" rx="14" ry="6" fill="#ffaa22" opacity="0.04"/>' : ''}`;
}

function surveySiteSVG(a: boolean): string {
  const tent = a ? '#7a7aaa' : '#3a3a5a';
  const tentl = a ? '#8a8abb' : '#4a4a6a';
  const tents = a ? '#6a6a99' : '#333';
  const pole = a ? '#6a5030' : '#333';
  const interior = a ? '#2a2a3a' : '#1a1a2a';
  const rope = a ? '#8a7a5a' : '#444';
  const table = a ? '#6a5030' : '#333';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${a ? '#5a4a30' : '#2a2a3a'}"/>
<polygon points="-1,29 17,6 35,29" fill="${tent}"/>
<polygon points="-1,29 17,6 17,8 2,29" fill="${tentl}" opacity="0.4"/>
<line x1="4" y1="24" x2="10" y2="12" stroke="${tents}" stroke-width="0.3" opacity="0.4"/>
<line x1="24" y1="22" x2="20" y2="12" stroke="${tents}" stroke-width="0.3" opacity="0.4"/>
<line x1="28" y1="26" x2="22" y2="14" stroke="${tents}" stroke-width="0.3" opacity="0.4"/>
<line x1="15" y1="6" x2="19" y2="6" stroke="${pole}" stroke-width="0.8"/>
<polygon points="10,29 17,14 24,29" fill="${interior}"/>
<line x1="10" y1="29" x2="17" y2="14" stroke="${tents}" stroke-width="0.4"/>
<line x1="24" y1="29" x2="17" y2="14" stroke="${tents}" stroke-width="0.4"/>
<line x1="-1" y1="29" x2="-1" y2="31" stroke="${pole}" stroke-width="0.8"/>
<line x1="35" y1="29" x2="35" y2="31" stroke="${pole}" stroke-width="0.8"/>
<line x1="17" y1="6" x2="17" y2="29" stroke="${a ? '#5a4020' : '#2a2a2a'}" stroke-width="0.6"/>
<line x1="17" y1="6" x2="-4" y2="31" stroke="${rope}" stroke-width="0.3" opacity="0.5"/>
<line x1="17" y1="6" x2="38" y2="31" stroke="${rope}" stroke-width="0.3" opacity="0.5"/>
<line x1="-4" y1="30" x2="-4" y2="32" stroke="${pole}" stroke-width="0.7"/>
<line x1="38" y1="30" x2="38" y2="32" stroke="${pole}" stroke-width="0.7"/>
<line x1="0" y1="26" x2="0" y2="29" stroke="${table}" stroke-width="0.6"/>
<line x1="7" y1="26" x2="7" y2="29" stroke="${table}" stroke-width="0.6"/>
<rect x="-1" y="25" width="9" height="1.2" fill="${table}" rx="0.3"/>
<rect x="0" y="24.5" width="6" height="1" fill="${a ? '#d4c8a0' : '#555'}" rx="0.4"/>
<circle cx="0" cy="25" r="0.5" fill="${a ? '#c4b890' : '#4a4a4a'}"/>
<circle cx="6" cy="25" r="0.5" fill="${a ? '#c4b890' : '#4a4a4a'}"/>
<circle cx="2.5" cy="24.8" r="0.8" fill="${a ? '#888' : '#444'}"/>
<circle cx="2.5" cy="24.8" r="0.5" fill="${a ? '#ddd' : '#555'}"/>
<line x1="2.5" y1="24.3" x2="2.5" y2="24.8" stroke="${a ? '#c33' : '#555'}" stroke-width="0.3"/>
<line x1="32" y1="29" x2="33" y2="22" stroke="${table}" stroke-width="0.5"/>
<line x1="36" y1="29" x2="34" y2="22" stroke="${table}" stroke-width="0.5"/>
<line x1="30" y1="29" x2="33" y2="23" stroke="${table}" stroke-width="0.5"/>
<rect x="31" y="20.5" width="5" height="1.5" fill="${a ? '#8a7a5a' : '#444'}" rx="0.5"/>
<circle cx="36" cy="21.3" r="0.9" fill="${a ? '#6a6a99' : '#3a3a5a'}"/>
<circle cx="36" cy="21.3" r="0.5" fill="${a ? '#9a9acc' : '#4a4a6a'}"/>
${a ? '<circle cx="36.3" cy="21" r="0.3" fill="#ccccff" opacity="0.6"/>' : ''}
<rect x="25" y="26.5" width="3" height="2.5" fill="${a ? '#6a5535' : '#333'}"/>
<line x1="25" y1="27.7" x2="28" y2="27.7" stroke="${a ? '#5a4525' : '#2a2a2a'}" stroke-width="0.3"/>
<rect x="25.8" y="27" width="1.4" height="0.5" fill="${a ? '#888' : '#444'}" rx="0.2"/>
<line x1="7" y1="28" x2="7" y2="30" stroke="${rope}" stroke-width="0.4"/>
<line x1="9" y1="28" x2="9" y2="30" stroke="${rope}" stroke-width="0.4"/>
<line x1="7" y1="28.5" x2="9" y2="28.5" stroke="${a ? '#aa9960' : '#555'}" stroke-width="0.2"/>
${a ? '<circle cx="17" cy="16" r="6" fill="#8888ff" opacity="0.06"/>' : ''}`;
}

function recruitmentCenterSVG(a: boolean): string {
  const fn = a ? '#5a5a5a' : '#2a2a3a';
  const body = a ? '#5a6a8a' : '#3a3a4a';
  const st = a ? '#4a5a7a' : '#2a2a3a';
  const tw = a ? '#4a5a7a' : '#2a2a3a';
  const tws = a ? '#3a4a6a' : '#222';
  const twl = a ? '#5a6a8a' : '#333';
  const mer = a ? '#6a7a9a' : '#444';
  const rf = a ? '#3a4a6a' : '#222a3a';
  const rfl = a ? '#4a5a7a' : '#2a3040';
  const rfs = a ? '#2a3a5a' : '#1a1a2a';
  const win = a ? '#222' : '#111';
  const wf = a ? '#6a7a9a' : '#333';
  const door = a ? '#3a2518' : '#1a1510';
  const df = a ? '#6a7a9a' : '#333';
  return `
<rect x="2" y="29" width="28" height="3" fill="${fn}"/>
<rect x="3" y="29" width="26" height="0.6" fill="${a ? '#666' : '#333'}" opacity="0.4"/>
<rect x="3" y="8" width="19" height="21" fill="${body}"/>
<line x1="3" y1="12" x2="22" y2="12" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="3" y1="16" x2="22" y2="16" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="3" y1="20" x2="22" y2="20" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="3" y1="24" x2="22" y2="24" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="8" y1="8" x2="8" y2="12" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="13" y1="8" x2="13" y2="12" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="18" y1="8" x2="18" y2="12" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="6" y1="12" x2="6" y2="16" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="11" y1="12" x2="11" y2="16" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="16" y1="12" x2="16" y2="16" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<rect x="22" y="2" width="7" height="27" fill="${tw}"/>
<line x1="22" y1="6" x2="29" y2="6" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<line x1="22" y1="10" x2="29" y2="10" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<line x1="22" y1="14" x2="29" y2="14" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<line x1="22" y1="18" x2="29" y2="18" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<line x1="22" y1="22" x2="29" y2="22" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<line x1="22" y1="26" x2="29" y2="26" stroke="${tws}" stroke-width="0.3" opacity="0.4"/>
<rect x="22" y="0" width="7" height="2.5" fill="${tw}"/>
<rect x="22" y="-2" width="2" height="2.5" fill="${twl}"/>
<rect x="25.5" y="-2" width="2" height="2.5" fill="${twl}"/>
<rect x="22" y="-2" width="2" height="0.5" fill="${mer}" opacity="0.5"/>
<rect x="25.5" y="-2" width="2" height="0.5" fill="${mer}" opacity="0.5"/>
<rect x="24.5" y="8" width="1" height="3" fill="${win}"/>
<rect x="24.5" y="16" width="1" height="3" fill="${win}"/>
<line x1="25.5" y1="23" x2="25.5" y2="27" stroke="${mer}" stroke-width="0.5"/>
<line x1="24" y1="25" x2="27" y2="25" stroke="${mer}" stroke-width="0.5"/>
<polygon points="3,8 12.5,-4 22,8" fill="${rf}"/>
<polygon points="3,8 12.5,-4 12.5,-2 5,8" fill="${rfl}" opacity="0.4"/>
<line x1="3" y1="8" x2="22" y2="8" stroke="${rfs}" stroke-width="0.6"/>
<line x1="5.63" y1="4" x2="19.37" y2="4" stroke="${rfs}" stroke-width="0.3" opacity="0.3"/>
<line x1="7.94" y1="1" x2="17.06" y2="1" stroke="${rfs}" stroke-width="0.3" opacity="0.3"/>
<rect x="5" y="13" width="5" height="5" fill="${win}"/>
<path d="M5,13 Q7.5,10 10,13" fill="${win}"/>
${a ? '<rect x="5.5" y="13.5" width="4" height="4" fill="#3a5a8a" opacity="0.3"/>' : ''}
<rect x="5" y="13" width="0.5" height="5" fill="${wf}"/>
<rect x="9.5" y="13" width="0.5" height="5" fill="${wf}"/>
<path d="M5,13 Q7.5,10 10,13" fill="none" stroke="${wf}" stroke-width="0.5"/>
<line x1="7.5" y1="10.5" x2="7.5" y2="18" stroke="${wf}" stroke-width="0.3"/>
<line x1="5" y1="15.5" x2="10" y2="15.5" stroke="${wf}" stroke-width="0.3"/>
<rect x="14" y="13" width="5" height="5" fill="${win}"/>
<path d="M14,13 Q16.5,10 19,13" fill="${win}"/>
${a ? '<rect x="14.5" y="13.5" width="4" height="4" fill="#3a5a8a" opacity="0.3"/>' : ''}
<rect x="14" y="13" width="0.5" height="5" fill="${wf}"/>
<rect x="18.5" y="13" width="0.5" height="5" fill="${wf}"/>
<path d="M14,13 Q16.5,10 19,13" fill="none" stroke="${wf}" stroke-width="0.5"/>
<line x1="16.5" y1="10.5" x2="16.5" y2="18" stroke="${wf}" stroke-width="0.3"/>
<line x1="14" y1="15.5" x2="19" y2="15.5" stroke="${wf}" stroke-width="0.3"/>
<rect x="9" y="21" width="7" height="8" fill="${door}"/>
<path d="M9,21 Q12.5,16.5 16,21" fill="${door}"/>
<rect x="9" y="21" width="0.6" height="8" fill="${df}"/>
<rect x="15.4" y="21" width="0.6" height="8" fill="${df}"/>
<path d="M9,21 Q12.5,16.5 16,21" fill="none" stroke="${df}" stroke-width="0.5"/>
<line x1="12.5" y1="17.5" x2="12.5" y2="29" stroke="${a ? '#2a1a10' : '#111'}" stroke-width="0.4"/>
<circle cx="10.5" cy="23" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="14.5" cy="23" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="10.5" cy="26" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="14.5" cy="26" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="11.7" cy="25" r="0.4" fill="none" stroke="${a ? '#666' : '#444'}" stroke-width="0.3"/>
<circle cx="13.3" cy="25" r="0.4" fill="none" stroke="${a ? '#666' : '#444'}" stroke-width="0.3"/>
<rect x="4" y="21" width="4" height="4.5" fill="${a ? '#5a4a2a' : '#2a2018'}"/>
<rect x="4.3" y="21.3" width="3.4" height="3.9" fill="${a ? '#ddc' : '#555'}"/>
<rect x="4.6" y="21.6" width="1.3" height="1.5" fill="${a ? '#eee' : '#666'}"/>
<rect x="6.2" y="21.8" width="1.2" height="1.2" fill="${a ? '#e8d8a0' : '#555'}"/>
<rect x="4.8" y="23.5" width="1.5" height="0.8" fill="${a ? '#ddd' : '#666'}"/>
<circle cx="5.2" cy="21.7" r="0.2" fill="${a ? '#cc4444' : '#444'}"/>
<circle cx="6.7" cy="21.9" r="0.2" fill="${a ? '#cc4444' : '#444'}"/>
<line x1="18" y1="13" x2="18.5" y2="29" stroke="${a ? '#777' : '#444'}" stroke-width="0.3"/>
<polygon points="18,13 17.5,14.2 18.5,14.2" fill="${a ? '#888' : '#555'}"/>
${a ? '<ellipse cx="15" cy="18" rx="12" ry="10" fill="#5a6a8a" opacity="0.04"/>' : ''}`;
}

function guardPostSVG(a: boolean): string {
  const fn = a ? '#5a5a5a' : '#2a2a3a';
  const body = a ? '#8a7a5a' : '#3a3020';
  const st = a ? '#7a6a4a' : '#2a2818';
  const plat = a ? '#7a6a4a' : '#2a2818';
  const platl = a ? '#8a7a5a' : '#333';
  const brac = a ? '#6a5a3a' : '#222';
  const mer = a ? '#8a7a5a' : '#3a3020';
  const merl = a ? '#9a8a6a' : '#444';
  const win = a ? '#222' : '#111';
  const shield = a ? '#cc9944' : '#4a4030';
  const shieldl = a ? '#ddb055' : '#555';
  const shieldc = a ? '#aa7722' : '#3a3020';
  const door = a ? '#3a2518' : '#1a1510';
  const df = a ? '#6a5a3a' : '#2a2a20';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#666' : '#333'}" opacity="0.4"/>
<rect x="6" y="5" width="16" height="24" fill="${body}"/>
<line x1="6" y1="9" x2="22" y2="9" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="6" y1="13" x2="22" y2="13" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="6" y1="17" x2="22" y2="17" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="6" y1="21" x2="22" y2="21" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="6" y1="25" x2="22" y2="25" stroke="${st}" stroke-width="0.3" opacity="0.4"/>
<line x1="10" y1="5" x2="10" y2="9" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="14" y1="5" x2="14" y2="9" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="18" y1="5" x2="18" y2="9" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="8" y1="9" x2="8" y2="13" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="12" y1="9" x2="12" y2="13" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="16" y1="9" x2="16" y2="13" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<line x1="20" y1="9" x2="20" y2="13" stroke="${st}" stroke-width="0.2" opacity="0.3"/>
<rect x="4" y="1" width="20" height="4.5" fill="${plat}"/>
<rect x="4" y="1" width="20" height="0.8" fill="${platl}" opacity="0.4"/>
<polygon points="4,5.5 4,3.5 6,5.5" fill="${brac}"/>
<polygon points="24,5.5 24,3.5 22,5.5" fill="${brac}"/>
<rect x="4" y="-2" width="3.5" height="3.5" fill="${mer}"/>
<rect x="10" y="-2" width="3.5" height="3.5" fill="${mer}"/>
<rect x="14.5" y="-2" width="3.5" height="3.5" fill="${mer}"/>
<rect x="20.5" y="-2" width="3.5" height="3.5" fill="${mer}"/>
<rect x="4" y="-2" width="3.5" height="0.5" fill="${merl}" opacity="0.5"/>
<rect x="10" y="-2" width="3.5" height="0.5" fill="${merl}" opacity="0.5"/>
<rect x="14.5" y="-2" width="3.5" height="0.5" fill="${merl}" opacity="0.5"/>
<rect x="20.5" y="-2" width="3.5" height="0.5" fill="${merl}" opacity="0.5"/>
<rect x="9" y="8" width="1" height="3" fill="${win}"/>
<rect x="18" y="8" width="1" height="3" fill="${win}"/>
<path d="M14,14 L17.5,15.5 L16.5,19 L14,20 L11.5,19 L10.5,15.5 Z" fill="${shield}"/>
<path d="M14,14.8 L16.8,16 L16,19 L14,19.5 L12,19 L11.2,16 Z" fill="${shieldl}"/>
<line x1="14" y1="14.8" x2="14" y2="19.5" stroke="${shieldc}" stroke-width="0.4"/>
<line x1="11.2" y1="17" x2="16.8" y2="17" stroke="${shieldc}" stroke-width="0.4"/>
<rect x="11" y="22" width="6" height="7" fill="${door}"/>
<path d="M11,22 Q14,18 17,22" fill="${door}"/>
<rect x="11" y="22" width="0.6" height="7" fill="${df}"/>
<rect x="16.4" y="22" width="0.6" height="7" fill="${df}"/>
<path d="M11,22 Q14,18 17,22" fill="none" stroke="${df}" stroke-width="0.5"/>
<line x1="14" y1="18.5" x2="14" y2="29" stroke="${a ? '#2a1a10' : '#111'}" stroke-width="0.3" opacity="0.5"/>
<circle cx="12.5" cy="24" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="15.5" cy="24" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="12.5" cy="27" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="15.5" cy="27" r="0.3" fill="${a ? '#555' : '#333'}"/>
<circle cx="15.8" cy="25.5" r="0.5" fill="none" stroke="${a ? '#666' : '#444'}" stroke-width="0.3"/>
<line x1="6" y1="16" x2="3.5" y2="16" stroke="${a ? '#555' : '#333'}" stroke-width="0.5"/>
<line x1="3.5" y1="14" x2="3.5" y2="16" stroke="${a ? '#5a4a2a' : '#333'}" stroke-width="0.4"/>
${a ? `<circle cx="3.5" cy="13.5" r="0.7" fill="#ffaa22" opacity="0.8"/>
<circle cx="3.5" cy="12.5" r="0.4" fill="#ff6600" opacity="0.4"/>` : ''}
<line x1="23" y1="18" x2="23" y2="29" stroke="${a ? '#5a4a2a' : '#2a2018'}" stroke-width="0.5"/>
<line x1="22.2" y1="20" x2="23.8" y2="20" stroke="${a ? '#5a4a2a' : '#2a2018'}" stroke-width="0.4"/>
<line x1="22.2" y1="24" x2="23.8" y2="24" stroke="${a ? '#5a4a2a' : '#2a2018'}" stroke-width="0.4"/>
<line x1="24" y1="12" x2="24.5" y2="29" stroke="${a ? '#777' : '#444'}" stroke-width="0.3"/>
<polygon points="24,12 23.5,13.2 24.5,13.2" fill="${a ? '#888' : '#555'}"/>
<line x1="25" y1="18" x2="25.3" y2="29" stroke="${a ? '#888' : '#555'}" stroke-width="0.3"/>
<rect x="24.5" y="24.5" width="1" height="0.5" fill="${a ? '#aa8833' : '#444'}"/>
${a ? '<ellipse cx="14" cy="15" rx="12" ry="8" fill="#cc9944" opacity="0.04"/>' : ''}`;
}

function warShrineSVG(a: boolean): string {
  const base1 = a ? '#4a4a4a' : '#2a2a3a';
  const base2 = a ? '#555' : '#333';
  const base3 = a ? '#5a5a5a' : '#2a2a3a';
  const altar = a ? '#5a4a4a' : '#333';
  const altarl = a ? '#6a5a5a' : '#3a3a4a';
  const sts = a ? '#4a3a3a' : '#2a2a2a';
  const rf = a ? '#4a3a3a' : '#2a2a3a';
  const rfl = a ? '#5a4a4a' : '#333';
  const rfs = a ? '#3a2a2a' : '#1a1a2a';
  const pil = a ? '#6a5a5a' : '#3a3a3a';
  const pilc = a ? '#7a6a6a' : '#444';
  const emb = a ? '#882222' : '#3a2a2a';
  const embl = a ? '#aa3333' : '#444';
  const braz = a ? '#6a5a5a' : '#3a3a3a';
  const brazl = a ? '#7a6a6a' : '#444';
  const gem = a ? '#bb2222' : '#3a2a2a';
  const geml = a ? '#dd3333' : '#444';
  return `
<rect x="-2" y="29" width="38" height="3" fill="${base1}"/>
<rect x="0" y="27" width="34" height="3" fill="${base2}"/>
<rect x="2" y="25" width="30" height="3" fill="${base3}"/>
<rect x="0" y="27" width="34" height="0.6" fill="${a ? '#666' : '#3a3a3a'}" opacity="0.4"/>
<rect x="9" y="12" width="16" height="13" fill="${altar}"/>
<rect x="10" y="13" width="14" height="0.8" fill="${altarl}" opacity="0.3"/>
<line x1="9" y1="16" x2="25" y2="16" stroke="${sts}" stroke-width="0.3" opacity="0.3"/>
<line x1="9" y1="20" x2="25" y2="20" stroke="${sts}" stroke-width="0.3" opacity="0.3"/>
<polygon points="7,12 17,-2 27,12" fill="${rf}"/>
<polygon points="7,12 17,-2 17,0 9,12" fill="${rfl}" opacity="0.3"/>
<line x1="7" y1="12" x2="27" y2="12" stroke="${rfs}" stroke-width="0.6"/>
<rect x="7" y="12" width="3" height="13" fill="${pil}"/>
<rect x="24" y="12" width="3" height="13" fill="${pil}"/>
<rect x="6" y="11" width="5" height="2" fill="${pilc}"/>
<rect x="23" y="11" width="5" height="2" fill="${pilc}"/>
<rect x="6" y="24" width="5" height="1.5" fill="${pilc}"/>
<rect x="23" y="24" width="5" height="1.5" fill="${pilc}"/>
<polygon points="17,14 21,18 17,22 13,18" fill="${emb}"/>
<polygon points="17,15 20,18 17,21 14,18" fill="${embl}"/>
${a ? '<polygon points="17,16 19,18 17,20 15,18" fill="#cc4444" opacity="0.5"/>' : ''}
${a ? `<rect x="11" y="23" width="1.5" height="1.5" fill="#dd4444" opacity="0.4" rx="0.2"/>
<rect x="15" y="23" width="1.5" height="1.5" fill="#dd4444" opacity="0.4" rx="0.2"/>
<rect x="19" y="23" width="1.5" height="1.5" fill="#dd4444" opacity="0.4" rx="0.2"/>` : `<rect x="11" y="23" width="1.5" height="1.5" fill="#3a3a3a" opacity="0.3" rx="0.2"/>
<rect x="15" y="23" width="1.5" height="1.5" fill="#3a3a3a" opacity="0.3" rx="0.2"/>
<rect x="19" y="23" width="1.5" height="1.5" fill="#3a3a3a" opacity="0.3" rx="0.2"/>`}
<rect x="-1" y="26" width="6" height="1.5" fill="${a ? '#5a5050' : '#333'}"/>
<polygon points="-2,24 6,24 5,27 -1,27" fill="${braz}"/>
<line x1="-2" y1="24" x2="6" y2="24" stroke="${brazl}" stroke-width="0.6"/>
${a ? `<ellipse cx="2" cy="23" rx="3" ry="1.5" fill="#ff4422" opacity="0.4"/>
<ellipse cx="2" cy="21.5" rx="2.2" ry="2" fill="#ff6633" opacity="0.45"/>
<ellipse cx="2" cy="20" rx="1.4" ry="2" fill="#ff8844" opacity="0.5"/>
<ellipse cx="2" cy="19" rx="0.7" ry="1.2" fill="#ffcc66" opacity="0.5"/>` : '<ellipse cx="2" cy="25" rx="2.5" ry="0.8" fill="#332222" opacity="0.3"/>'}
<rect x="29" y="26" width="6" height="1.5" fill="${a ? '#5a5050' : '#333'}"/>
<polygon points="28,24 36,24 35,27 29,27" fill="${braz}"/>
<line x1="28" y1="24" x2="36" y2="24" stroke="${brazl}" stroke-width="0.6"/>
${a ? `<ellipse cx="32" cy="23" rx="3" ry="1.5" fill="#ff4422" opacity="0.4"/>
<ellipse cx="32" cy="21.5" rx="2.2" ry="2" fill="#ff6633" opacity="0.45"/>
<ellipse cx="32" cy="20" rx="1.4" ry="2" fill="#ff8844" opacity="0.5"/>
<ellipse cx="32" cy="19" rx="0.7" ry="1.2" fill="#ffcc66" opacity="0.5"/>` : '<ellipse cx="32" cy="25" rx="2.5" ry="0.8" fill="#332222" opacity="0.3"/>'}
<circle cx="17" cy="-3" r="2" fill="${gem}"/>
<circle cx="17" cy="-3" r="1.2" fill="${geml}"/>
${a ? '<circle cx="16.5" cy="-3.5" r="0.5" fill="#ff8888" opacity="0.7"/>' : ''}
${a ? '<ellipse cx="17" cy="18" rx="10" ry="7" fill="#dd2222" opacity="0.04"/>' : ''}`;
}

function farmSVG(a: boolean): string {
  const fn = a ? '#6a5a3a' : '#2a2a3a';
  const body = a ? '#8b5e3c' : '#3a3a4a';
  const beam = a ? '#5a3a1a' : '#2a2a2a';
  const plank = a ? '#7a4e2c' : '#333';
  const rf = a ? '#b8943a' : '#2a2a3a';
  const rfl = a ? '#c8a44a' : '#3a3a4a';
  const rfs = a ? '#8a6a2a' : '#1a1a1a';
  const door = a ? '#6a3a1a' : '#2a2a2a';
  const dd = a ? '#4a2a0a' : '#1a1a1a';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#7a6a4a' : '#333'}" opacity="0.4"/>
<rect x="2" y="10" width="22" height="19" fill="${body}"/>
<line x1="2" y1="14" x2="24" y2="14" stroke="${beam}" stroke-width="0.8"/>
<line x1="2" y1="20" x2="24" y2="20" stroke="${beam}" stroke-width="0.8"/>
<line x1="2" y1="26" x2="24" y2="26" stroke="${beam}" stroke-width="0.8"/>
<line x1="2" y1="10" x2="2" y2="29" stroke="${beam}" stroke-width="1"/>
<line x1="24" y1="10" x2="24" y2="29" stroke="${beam}" stroke-width="1"/>
<line x1="13" y1="10" x2="13" y2="20" stroke="${beam}" stroke-width="0.6"/>
<line x1="2" y1="14" x2="7" y2="10" stroke="${beam}" stroke-width="0.5"/>
<line x1="24" y1="14" x2="19" y2="10" stroke="${beam}" stroke-width="0.5"/>
<line x1="6" y1="14" x2="6" y2="29" stroke="${plank}" stroke-width="0.2" opacity="0.3"/>
<line x1="10" y1="14" x2="10" y2="29" stroke="${plank}" stroke-width="0.2" opacity="0.3"/>
<line x1="16" y1="20" x2="16" y2="29" stroke="${plank}" stroke-width="0.2" opacity="0.3"/>
<line x1="20" y1="14" x2="20" y2="29" stroke="${plank}" stroke-width="0.2" opacity="0.3"/>
<polygon points="-1,10 13,-2 27,10" fill="${rf}"/>
<polygon points="-1,10 13,-2 13,0 1,10" fill="${rfl}" opacity="0.35"/>
<line x1="-1" y1="10" x2="27" y2="10" stroke="${rfs}" stroke-width="0.6"/>
<line x1="1" y1="8" x2="6" y2="4" stroke="${a ? '#a8843a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="3" y1="9" x2="9" y2="4" stroke="${a ? '#a8843a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="20" y1="8" x2="17" y2="4" stroke="${a ? '#a8843a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="23" y1="9" x2="19" y2="5" stroke="${a ? '#a8843a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="-1" y1="10.3" x2="27" y2="10.3" stroke="${rfl}" stroke-width="0.4" opacity="0.5"/>
<rect x="9" y="11.5" width="8" height="5" fill="${a ? '#2a1a0a' : '#1a1a1a'}"/>
<rect x="9" y="11.5" width="8" height="0.5" fill="${beam}"/>
${a ? `<rect x="10" y="14" width="6" height="2.5" fill="#cca844" opacity="0.7"/>
<rect x="10.5" y="13.5" width="5" height="1" fill="#ddbb55" opacity="0.5"/>` : '<rect x="10" y="14" width="6" height="2.5" fill="#3a3a3a" opacity="0.3"/>'}
<rect x="8" y="21" width="10" height="8" fill="${door}"/>
<line x1="13" y1="21" x2="13" y2="29" stroke="${dd}" stroke-width="0.6"/>
<line x1="8" y1="24" x2="13" y2="21" stroke="${beam}" stroke-width="0.4" opacity="0.5"/>
<line x1="13" y1="24" x2="18" y2="21" stroke="${beam}" stroke-width="0.4" opacity="0.5"/>
<rect x="8.3" y="22.5" width="0.8" height="1" fill="${a ? '#444' : '#222'}" rx="0.2"/>
<rect x="8.3" y="26" width="0.8" height="1" fill="${a ? '#444' : '#222'}" rx="0.2"/>
<rect x="17" y="22.5" width="0.8" height="1" fill="${a ? '#444' : '#222'}" rx="0.2"/>
<rect x="17" y="26" width="0.8" height="1" fill="${a ? '#444' : '#222'}" rx="0.2"/>
${a ? '<rect x="9" y="22" width="8" height="6" fill="#ffaa33" opacity="0.05"/>' : ''}
<rect x="-2" y="25" width="4" height="4" fill="${a ? '#cca844' : '#444'}" rx="0.3"/>
<rect x="-1.5" y="22" width="3" height="3.5" fill="${a ? '#ddbb55' : '#4a4a4a'}" rx="0.3"/>
<line x1="-1.5" y1="23.5" x2="1.5" y2="23.5" stroke="${a ? '#aa8833' : '#333'}" stroke-width="0.3" opacity="0.5"/>
<line x1="-2" y1="27" x2="2" y2="27" stroke="${a ? '#aa8833' : '#333'}" stroke-width="0.3" opacity="0.5"/>
<line x1="26" y1="22" x2="26" y2="29" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.8"/>
<line x1="30" y1="22" x2="30" y2="29" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.8"/>
<line x1="34" y1="22" x2="34" y2="29" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.8"/>
<line x1="25" y1="24" x2="35" y2="24" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.7"/>
<line x1="25" y1="27" x2="35" y2="27" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.7"/>
<rect x="25.3" y="21.5" width="1.4" height="1" fill="${a ? '#9a8365' : '#4a4a4a'}" rx="0.2"/>
<rect x="29.3" y="21.5" width="1.4" height="1" fill="${a ? '#9a8365' : '#4a4a4a'}" rx="0.2"/>
<rect x="33.3" y="21.5" width="1.4" height="1" fill="${a ? '#9a8365' : '#4a4a4a'}" rx="0.2"/>
${a ? `<line x1="27" y1="27" x2="27" y2="19" stroke="#6a9a3a" stroke-width="0.4"/>
<line x1="27" y1="19" x2="26.5" y2="17.5" stroke="#8ab844" stroke-width="0.35"/>
<line x1="26.5" y1="17.5" x2="26" y2="17" stroke="#bbaa44" stroke-width="0.5"/>
<line x1="29" y1="27" x2="29" y2="18" stroke="#6a9a3a" stroke-width="0.4"/>
<line x1="29" y1="18" x2="29.5" y2="16.5" stroke="#8ab844" stroke-width="0.35"/>
<line x1="29.5" y1="16.5" x2="30" y2="16" stroke="#ccbb44" stroke-width="0.5"/>
<line x1="31" y1="27" x2="31" y2="19.5" stroke="#6a9a3a" stroke-width="0.4"/>
<line x1="31" y1="19.5" x2="30.5" y2="18" stroke="#8ab844" stroke-width="0.35"/>
<line x1="33" y1="27" x2="33" y2="18.5" stroke="#6a9a3a" stroke-width="0.4"/>
<line x1="33" y1="18.5" x2="33.5" y2="17" stroke="#8ab844" stroke-width="0.35"/>` : `<line x1="27" y1="27" x2="27" y2="20" stroke="#3a4a3a" stroke-width="0.4"/>
<line x1="29" y1="27" x2="29" y2="19" stroke="#3a4a3a" stroke-width="0.4"/>
<line x1="31" y1="27" x2="31" y2="20.5" stroke="#3a4a3a" stroke-width="0.4"/>
<line x1="33" y1="27" x2="33" y2="19.5" stroke="#3a4a3a" stroke-width="0.4"/>`}
<rect x="25" y="28" width="4" height="1.5" fill="${a ? '#6a5a3a' : '#333'}" rx="0.3"/>
<rect x="25.3" y="28.3" width="3.4" height="0.9" fill="${a ? '#5588aa' : '#3a3a3a'}" rx="0.2"/>
<rect x="5" y="20" width="1" height="1.5" fill="${a ? '#555' : '#333'}"/>
<rect x="4.5" y="21.5" width="2" height="2.5" fill="${a ? '#444' : '#2a2a2a'}" rx="0.3"/>
${a ? `<rect x="5" y="22" width="1" height="1.5" fill="#ffaa33" opacity="0.5"/>
<circle cx="5.5" cy="22.5" r="2.5" fill="#ffaa33" opacity="0.04"/>` : ''}`;
}

function ruinsSVG(a: boolean): string {
  const fn = a ? '#4a5a3a' : '#2a2a3a';
  const base = a ? '#8a8880' : '#3a3a40';
  const col = a ? '#a0a098' : '#444';
  const coll = a ? '#8a8a80' : '#3a3a3a';
  const cap = a ? '#b0b0a8' : '#4a4a4a';
  const col2 = a ? '#9a9a90' : '#3a3a40';
  const col3 = a ? '#a8a8a0' : '#444';
  const vine = a ? '#4a7a2a' : '#2a3a2a';
  const vinel = a ? '#5a8a3a' : '#2a3a2a';
  const moss = a ? '#4a6a2a' : '#2a3a2a';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#5a6a4a' : '#333'}" opacity="0.4"/>
<rect x="0" y="27" width="34" height="2.5" fill="${base}"/>
<line x1="0" y1="27.8" x2="34" y2="27.8" stroke="${a ? '#7a7870' : '#333'}" stroke-width="0.3" opacity="0.4"/>
<line x1="8" y1="27" x2="9" y2="29.5" stroke="${a ? '#6a6860' : '#2a2a30'}" stroke-width="0.2" opacity="0.5"/>
<line x1="20" y1="27" x2="19.5" y2="29.5" stroke="${a ? '#6a6860' : '#2a2a30'}" stroke-width="0.2" opacity="0.5"/>
<path d="M7,7.5 Q10.5,3 14,3.5" fill="none" stroke="${col}" stroke-width="1.5"/>
<rect x="2" y="8" width="5" height="19" fill="${col}"/>
<line x1="3.5" y1="8" x2="3.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<line x1="5.5" y1="8" x2="5.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<rect x="1" y="7" width="7" height="1.5" fill="${cap}"/>
<polygon points="1,7 2,4 3.5,6 4.5,3 6,5.5 7,4.5 8,7" fill="${col}"/>
<rect x="1" y="26" width="7" height="1.5" fill="${cap}"/>
<rect x="14" y="4" width="5" height="23" fill="${col2}"/>
<line x1="15.5" y1="4" x2="15.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<line x1="17.5" y1="4" x2="17.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<rect x="13" y="3" width="7" height="1.5" fill="${cap}"/>
<polygon points="13,3 14,1 15.5,2.5 16.5,0 18,2 19,1.5 20,3" fill="${col2}"/>
<rect x="13" y="26" width="7" height="1.5" fill="${cap}"/>
<rect x="27" y="16" width="5" height="11" fill="${col3}"/>
<line x1="28.5" y1="16" x2="28.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<line x1="30.5" y1="16" x2="30.5" y2="27" stroke="${coll}" stroke-width="0.3" opacity="0.4"/>
<polygon points="27,16 28,14 29.5,15.5 30.5,13.5 32,16" fill="${col3}"/>
<rect x="26" y="26" width="7" height="1.5" fill="${cap}"/>
<polygon points="9,27 10,25.5 12,25.5 13,27" fill="${col2}"/>
<line x1="11" y1="25.5" x2="11" y2="27" stroke="${a ? '#7a7a70' : '#333'}" stroke-width="0.2"/>
<rect x="21" y="27.5" width="3" height="1.5" fill="${a ? '#8a8a80' : '#3a3a40'}" rx="0.3"/>
<rect x="22" y="26.5" width="2" height="1.2" fill="${col2}" rx="0.3"/>
<rect x="34" y="28" width="2.5" height="1.5" fill="${a ? '#8a8a80' : '#3a3a40'}" rx="0.4"/>
<circle cx="-1" cy="28.5" r="0.8" fill="${a ? '#8a8a80' : '#3a3a40'}"/>
<rect x="10" y="28.5" width="2" height="0.8" fill="${a ? '#7a7a70' : '#333'}" rx="0.3"/>
<line x1="2.5" y1="10" x2="2" y2="15" stroke="${vine}" stroke-width="0.5"/>
<line x1="2" y1="15" x2="3" y2="20" stroke="${vine}" stroke-width="0.4"/>
<circle cx="2.2" cy="14" r="0.6" fill="${vinel}"/>
<circle cx="2.5" cy="17.5" r="0.5" fill="${vinel}"/>
<line x1="19" y1="5" x2="20" y2="10" stroke="${vine}" stroke-width="0.4"/>
<line x1="20" y1="10" x2="19" y2="14" stroke="${vine}" stroke-width="0.4"/>
<circle cx="20" cy="9" r="0.5" fill="${vinel}"/>
<circle cx="19.5" cy="12.5" r="0.5" fill="${vinel}"/>
<ellipse cx="5" cy="28.5" rx="2" ry="0.6" fill="${moss}" opacity="0.5"/>
<ellipse cx="24" cy="28.5" rx="1.5" ry="0.5" fill="${moss}" opacity="0.5"/>
${a ? `<circle cx="16.5" cy="20" r="2" fill="#aaaaff" opacity="0.08"/>
<circle cx="16.5" cy="20" r="1" fill="none" stroke="#aabbff" stroke-width="0.3" opacity="0.5"/>
<line x1="16.5" y1="19" x2="16.5" y2="21" stroke="#aabbff" stroke-width="0.3" opacity="0.4"/>
<line x1="15.5" y1="20" x2="17.5" y2="20" stroke="#aabbff" stroke-width="0.3" opacity="0.4"/>
<circle cx="16.5" cy="16" r="8" fill="#aaaaff" opacity="0.05"/>` : ''}`;
}

function forgeSVG(a: boolean): string {
  const fn = a ? '#444' : '#2a2a3a';
  const body = a ? '#555' : '#333';
  const st = a ? '#444' : '#2a2a2a';
  const rf = a ? '#444' : '#2a2a2a';
  const rfl = a ? '#555' : '#333';
  const chim = a ? '#4a4a4a' : '#2a2a2a';
  const chimcap = a ? '#555' : '#333';
  const chimcapl = a ? '#666' : '#3a3a3a';
  const win = a ? '#1a1a1a' : '#222';
  const door = a ? '#2a1a0a' : '#1a1a1a';
  const furn = a ? '#555' : '#333';
  const furnl = a ? '#666' : '#3a3a3a';
  const furno = a ? '#1a0a0a' : '#1a1a1a';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#555' : '#333'}" opacity="0.4"/>
<rect x="2" y="10" width="24" height="19" fill="${body}"/>
<rect x="3" y="11" width="22" height="0.8" fill="${a ? '#666' : '#3a3a3a'}" opacity="0.3"/>
<line x1="2" y1="15" x2="26" y2="15" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="2" y1="20" x2="26" y2="20" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="2" y1="25" x2="26" y2="25" stroke="${st}" stroke-width="0.3" opacity="0.3"/>
<line x1="10" y1="10" x2="10" y2="29" stroke="${st}" stroke-width="0.2" opacity="0.15"/>
<line x1="18" y1="10" x2="18" y2="29" stroke="${st}" stroke-width="0.2" opacity="0.15"/>
<polygon points="0,10 14,0 28,10" fill="${rf}"/>
<polygon points="0,10 14,0 14,2 2,10" fill="${rfl}" opacity="0.3"/>
<line x1="0" y1="10" x2="28" y2="10" stroke="${a ? '#333' : '#1a1a1a'}" stroke-width="0.5"/>
<rect x="20" y="-6" width="6" height="16" fill="${chim}"/>
<rect x="19.5" y="-8" width="7" height="3" fill="${chimcap}"/>
<rect x="19.5" y="-8" width="7" height="0.6" fill="${chimcapl}" opacity="0.5"/>
<line x1="20" y1="-4" x2="26" y2="-4" stroke="${a ? '#3a3a3a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="20" y1="0" x2="26" y2="0" stroke="${a ? '#3a3a3a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="20" y1="4" x2="26" y2="4" stroke="${a ? '#3a3a3a' : '#222'}" stroke-width="0.3" opacity="0.4"/>
${a ? `<circle cx="23" cy="-12" r="2" fill="#777" opacity="0.15"/>
<circle cx="25" cy="-14" r="1.8" fill="#888" opacity="0.12"/>
<circle cx="22" cy="-16" r="1.3" fill="#999" opacity="0.08"/>` : ''}
<rect x="5" y="14" width="4" height="4" fill="${win}"/>
<rect x="5" y="14" width="4" height="0.5" fill="${a ? '#444' : '#333'}"/>
${a ? '<rect x="5.5" y="14.5" width="3" height="3" fill="#ff6622" opacity="0.12"/>' : ''}
<rect x="10" y="18" width="7" height="11" fill="${door}"/>
<ellipse cx="13.5" cy="18" rx="3.5" ry="2.5" fill="${door}"/>
<ellipse cx="13.5" cy="18" rx="3.8" ry="2.8" fill="none" stroke="${a ? '#444' : '#2a2a2a'}" stroke-width="0.6"/>
${a ? '<ellipse cx="13.5" cy="24" rx="3" ry="4" fill="#ff4422" opacity="0.06"/>' : ''}
<rect x="28" y="18" width="8" height="11" fill="${furn}"/>
<rect x="28" y="18" width="8" height="1" fill="${furnl}" opacity="0.5"/>
<rect x="29" y="21" width="6" height="5" fill="${furno}"/>
${a ? `<rect x="29.5" y="21.5" width="5" height="4" fill="#ff2200" opacity="0.5"/>
<rect x="30" y="22" width="4" height="3" fill="#ff6633" opacity="0.6"/>
<rect x="31" y="22.5" width="2" height="2" fill="#ffaa44" opacity="0.5"/>
<rect x="31.5" y="23" width="1" height="1" fill="#ffdd88" opacity="0.4"/>` : '<rect x="30" y="22" width="4" height="3" fill="#331111" opacity="0.4"/>'}
<polygon points="27,18 32,12 37,18" fill="${a ? '#4a4a4a' : '#2a2a2a'}"/>
<line x1="27" y1="18" x2="37" y2="18" stroke="${a ? '#333' : '#1a1a1a'}" stroke-width="0.4"/>
<rect x="-2" y="26" width="6" height="3" fill="${a ? '#777' : '#3a3a3a'}"/>
<rect x="-1" y="24" width="4" height="2.5" fill="${a ? '#888' : '#444'}"/>
<rect x="-0.5" y="23.5" width="3" height="1" fill="${a ? '#999' : '#555'}"/>
<line x1="0" y1="22" x2="2.5" y2="20" stroke="${a ? '#8b7355' : '#444'}" stroke-width="0.7"/>
<rect x="2" y="19.5" width="1.5" height="1" fill="${a ? '#888' : '#555'}" rx="0.2"/>
<line x1="6" y1="12" x2="6" y2="22" stroke="${a ? '#bbb' : '#555'}" stroke-width="0.8"/>
<rect x="5" y="11.5" width="2" height="1.5" fill="${a ? '#cc9944' : '#555'}"/>
<rect x="5.5" y="13" width="1" height="0.8" fill="${a ? '#999' : '#444'}"/>
<rect x="27" y="27" width="4" height="2" fill="${a ? '#5a4a3a' : '#333'}" rx="0.5"/>
<rect x="27.5" y="27.5" width="3" height="1" fill="${a ? '#4488aa' : '#444'}" rx="0.3"/>
${a ? '<ellipse cx="32" cy="22" rx="5" ry="4" fill="#ff4422" opacity="0.04"/>' : ''}`;
}

function leatherworksSVG(a: boolean): string {
  const fn = a ? '#5a5048' : '#2a2a3a';
  const body = a ? '#7a5a38' : '#3a3a4a';
  const plank = a ? '#6a4a28' : '#2a2a2a';
  const beam = a ? '#5a3a18' : '#2a2a2a';
  const rf = a ? '#5a4030' : '#2a2a3a';
  const rfl = a ? '#6a5040' : '#333';
  const rfs = a ? '#4a3020' : '#1a1a1a';
  const win = a ? '#1a1a1a' : '#222';
  const shut = a ? '#6a4a28' : '#2a2a2a';
  const door = a ? '#3a2010' : '#1a1a1a';
  const doorf = a ? '#5a3a18' : '#222';
  const rack = a ? '#7a6040' : '#444';
  const rackl = a ? '#8a7050' : '#4a4a4a';
  const hide1 = a ? '#c4984a' : '#4a4a4a';
  const hide2 = a ? '#b8884a' : '#444';
  const hide3 = a ? '#aa7840' : '#3a3a3a';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#6a6058' : '#333'}" opacity="0.4"/>
<rect x="2" y="10" width="22" height="19" fill="${body}"/>
<line x1="6" y1="10" x2="6" y2="29" stroke="${plank}" stroke-width="0.25" opacity="0.3"/>
<line x1="10" y1="10" x2="10" y2="29" stroke="${plank}" stroke-width="0.25" opacity="0.3"/>
<line x1="14" y1="10" x2="14" y2="29" stroke="${plank}" stroke-width="0.25" opacity="0.3"/>
<line x1="18" y1="10" x2="18" y2="29" stroke="${plank}" stroke-width="0.25" opacity="0.3"/>
<line x1="22" y1="10" x2="22" y2="29" stroke="${plank}" stroke-width="0.25" opacity="0.3"/>
<rect x="2" y="19" width="22" height="0.8" fill="${beam}"/>
<polygon points="0,10 13,1 26,10" fill="${rf}"/>
<polygon points="0,10 13,1 13,3 2,10" fill="${rfl}" opacity="0.3"/>
<line x1="0" y1="10" x2="26" y2="10" stroke="${rfs}" stroke-width="0.6"/>
<line x1="2.89" y1="8" x2="23.11" y2="8" stroke="${rfs}" stroke-width="0.25" opacity="0.35"/>
<line x1="5.78" y1="6" x2="20.22" y2="6" stroke="${rfs}" stroke-width="0.25" opacity="0.35"/>
<line x1="8.67" y1="4" x2="17.33" y2="4" stroke="${rfs}" stroke-width="0.25" opacity="0.35"/>
<rect x="4" y="13" width="5" height="4" fill="${win}"/>
<rect x="4" y="13" width="5" height="0.5" fill="${beam}"/>
${a ? '<rect x="4.5" y="13.5" width="4" height="3" fill="#ddbb77" opacity="0.15"/>' : ''}
<rect x="3.2" y="13" width="1" height="4" fill="${shut}"/>
<rect x="8.8" y="13" width="1" height="4" fill="${shut}"/>
<rect x="13" y="20" width="7" height="9" fill="${door}"/>
<ellipse cx="16.5" cy="20" rx="3.5" ry="2.5" fill="${door}"/>
<ellipse cx="16.5" cy="20" rx="3.8" ry="2.8" fill="none" stroke="${doorf}" stroke-width="0.5"/>
${a ? '<rect x="14" y="22" width="5" height="5" fill="#cc8844" opacity="0.06"/>' : ''}
<line x1="27" y1="29" x2="30" y2="10" stroke="${rack}" stroke-width="0.8"/>
<line x1="37" y1="29" x2="34" y2="10" stroke="${rack}" stroke-width="0.8"/>
<line x1="30" y1="10" x2="34" y2="10" stroke="${rackl}" stroke-width="1"/>
<line x1="28.5" y1="19" x2="35.5" y2="19" stroke="${rack}" stroke-width="0.6"/>
<rect x="30.5" y="10.5" width="0.4" height="2" fill="${a ? '#6a5030' : '#333'}"/>
<path d="M29.5,12.5 Q29,13 29,16 Q29.5,18.5 31,18.5 Q32.5,18.5 32.5,16 Q32.5,13 32,12.5 Z" fill="${hide1}"/>
<path d="M29.8,13 Q29.5,14 29.5,16 Q30,17.5 31,17.5 Q32,17.5 32,16 Q32,14 31.7,13 Z" fill="${a ? '#d4a85a' : '#555'}" opacity="0.4"/>
<rect x="33" y="10.5" width="0.4" height="1.5" fill="${a ? '#6a5030' : '#333'}"/>
<path d="M32,12 Q31.5,13 31.8,15.5 Q32.5,17 33.5,17 Q34.5,17 34.5,15.5 Q34.8,13 34.2,12 Z" fill="${hide2}"/>
<path d="M32.5,12.5 Q32,13.5 32.3,15 Q33,16 33.5,16 Q34,16 34,15 Q34.2,13.5 33.8,12.5 Z" fill="${a ? '#c8985a' : '#4a4a4a'}" opacity="0.4"/>
<rect x="31.5" y="19" width="0.4" height="1.5" fill="${a ? '#6a5030' : '#333'}"/>
<path d="M30,20.5 Q29.8,21 30,23.5 Q30.5,25 32,25 Q33.5,25 33.5,23.5 Q33.8,21 33.5,20.5 Z" fill="${hide3}"/>
<rect x="0" y="25" width="6" height="1" fill="${a ? '#7a5a38' : '#3a3a3a'}"/>
<rect x="0.5" y="26" width="1" height="3" fill="${plank}"/>
<rect x="5" y="26" width="1" height="3" fill="${plank}"/>
<line x1="1" y1="24.5" x2="3" y2="24.5" stroke="${a ? '#aaa' : '#555'}" stroke-width="0.4"/>
<rect x="3" y="24" width="1" height="1" fill="${plank}" rx="0.2"/>
<line x1="4.5" y1="25" x2="4.5" y2="23" stroke="${a ? '#888' : '#444'}" stroke-width="0.3"/>
<circle cx="4.5" cy="22.8" r="0.3" fill="${a ? '#aaa' : '#555'}"/>
<rect x="1.5" y="24.8" width="2" height="0.5" fill="${a ? '#bb8844' : '#444'}" rx="0.2"/>
<rect x="-1" y="23" width="3" height="4" fill="${plank}" rx="0.8"/>
<line x1="-1" y1="25" x2="2" y2="25" stroke="${a ? '#7a5a38' : '#333'}" stroke-width="0.4"/>
<rect x="-0.5" y="23.2" width="2" height="0.8" fill="${a ? '#5a885a' : '#3a3a3a'}" rx="0.3" opacity="0.5"/>
<line x1="2" y1="8" x2="2" y2="12" stroke="${a ? '#555' : '#333'}" stroke-width="0.4"/>
<rect x="0" y="9" width="4" height="3" fill="${a ? '#bb8844' : '#444'}" rx="0.5"/>`;
}

function tavernSVG(a: boolean): string {
  const fn = a ? '#555' : '#2a2a3a';
  const body = a ? '#6a4a2a' : '#3a2a20';
  const beam = a ? '#4a3018' : '#2a2018';
  const plaster = a ? '#c8b088' : '#4a4038';
  const rf = a ? '#5a3a1a' : '#2a2018';
  const rfl = a ? '#6a4a2a' : '#332820';
  const rfs = a ? '#4a2a10' : '#1a1810';
  const chim = a ? '#555' : '#2a2a2a';
  const chimcap = a ? '#666' : '#333';
  const winc = a ? '#ddaa33' : '#4a4040';
  const door = a ? '#4a2a15' : '#2a2018';
  const doors = a ? '#5a3a20' : '#333';
  const doorl = a ? '#3a2010' : '#1a1810';
  return `
<rect x="-2" y="29" width="40" height="3" fill="${fn}"/>
<rect x="-1" y="29" width="38" height="0.6" fill="${a ? '#666' : '#333'}" opacity="0.4"/>
<rect x="1" y="6" width="30" height="23" fill="${body}"/>
<line x1="1" y1="6" x2="1" y2="29" stroke="${beam}" stroke-width="1"/>
<line x1="31" y1="6" x2="31" y2="29" stroke="${beam}" stroke-width="1"/>
<line x1="1" y1="6" x2="31" y2="6" stroke="${beam}" stroke-width="1"/>
<line x1="1" y1="16" x2="31" y2="16" stroke="${beam}" stroke-width="0.8"/>
<line x1="1" y1="6" x2="7" y2="16" stroke="${beam}" stroke-width="0.5" opacity="0.6"/>
<line x1="31" y1="6" x2="25" y2="16" stroke="${beam}" stroke-width="0.5" opacity="0.6"/>
<rect x="2" y="7" width="12" height="8.5" fill="${plaster}" opacity="0.3"/>
<rect x="18" y="7" width="12" height="8.5" fill="${plaster}" opacity="0.3"/>
<polygon points="-1,6 16,-6 33,6" fill="${rf}"/>
<polygon points="-1,6 16,-6 16,-4 1,6" fill="${rfl}" opacity="0.4"/>
<line x1="3.25" y1="3" x2="28.75" y2="3" stroke="${rfs}" stroke-width="0.3" opacity="0.5"/>
<line x1="7.5" y1="0" x2="24.5" y2="0" stroke="${rfs}" stroke-width="0.3" opacity="0.5"/>
<line x1="11.75" y1="-3" x2="20.25" y2="-3" stroke="${rfs}" stroke-width="0.3" opacity="0.5"/>
<rect x="24" y="-8" width="5" height="12" fill="${chim}"/>
<rect x="23.5" y="-9" width="6" height="2" fill="${chimcap}"/>
<line x1="24" y1="-5" x2="29" y2="-5" stroke="${a ? '#444' : '#222'}" stroke-width="0.3" opacity="0.4"/>
<line x1="24" y1="-2" x2="29" y2="-2" stroke="${a ? '#444' : '#222'}" stroke-width="0.3" opacity="0.4"/>
${a ? `<circle cx="26.5" cy="-11" r="1.2" fill="#888" opacity="0.15"/>
<circle cx="25.5" cy="-13.5" r="1" fill="#888" opacity="0.1"/>` : ''}
<rect x="4" y="8" width="6" height="5" fill="${winc}"/>
<line x1="7" y1="8" x2="7" y2="13" stroke="${beam}" stroke-width="0.5"/>
<line x1="4" y1="10.5" x2="10" y2="10.5" stroke="${beam}" stroke-width="0.5"/>
<rect x="3.5" y="7.5" width="7" height="0.7" fill="${beam}"/>
<rect x="3.5" y="13" width="7" height="0.7" fill="${beam}"/>
<rect x="22" y="8" width="6" height="5" fill="${winc}"/>
<line x1="25" y1="8" x2="25" y2="13" stroke="${beam}" stroke-width="0.5"/>
<line x1="22" y1="10.5" x2="28" y2="10.5" stroke="${beam}" stroke-width="0.5"/>
<rect x="21.5" y="7.5" width="7" height="0.7" fill="${beam}"/>
<rect x="21.5" y="13" width="7" height="0.7" fill="${beam}"/>
${a ? `<rect x="4" y="8" width="6" height="5" fill="#ffcc44" opacity="0.15"/>
<rect x="22" y="8" width="6" height="5" fill="#ffcc44" opacity="0.15"/>` : ''}
<rect x="4" y="18" width="5" height="5" fill="${winc}"/>
<line x1="6.5" y1="18" x2="6.5" y2="23" stroke="${beam}" stroke-width="0.5"/>
<line x1="4" y1="20.5" x2="9" y2="20.5" stroke="${beam}" stroke-width="0.5"/>
<rect x="3.5" y="17.5" width="6" height="0.7" fill="${beam}"/>
<rect x="3.5" y="23" width="6" height="0.7" fill="${beam}"/>
${a ? '<rect x="4" y="18" width="5" height="5" fill="#ffcc44" opacity="0.12"/>' : ''}
<rect x="13" y="19" width="8" height="10" fill="${door}"/>
<path d="M13,19 Q17,14 21,19" fill="${door}"/>
<path d="M13,19 Q17,14 21,19" fill="none" stroke="${doors}" stroke-width="0.8"/>
<line x1="15" y1="15.5" x2="15" y2="29" stroke="${doorl}" stroke-width="0.3" opacity="0.4"/>
<line x1="17" y1="14.5" x2="17" y2="29" stroke="${doorl}" stroke-width="0.3" opacity="0.4"/>
<line x1="19" y1="15.5" x2="19" y2="29" stroke="${doorl}" stroke-width="0.3" opacity="0.4"/>
<circle cx="19.5" cy="24" r="0.6" fill="${a ? '#aa8844' : '#555'}"/>
${a ? '<rect x="13" y="19" width="8" height="10" fill="#ffcc44" opacity="0.06"/>' : ''}
<line x1="32" y1="10" x2="32" y2="12" stroke="${a ? '#555' : '#333'}" stroke-width="0.8"/>
<line x1="32" y1="12" x2="37" y2="12" stroke="${a ? '#555' : '#333'}" stroke-width="0.8"/>
<line x1="32" y1="10" x2="35" y2="12" stroke="${a ? '#555' : '#333'}" stroke-width="0.5"/>
<line x1="33.5" y1="12" x2="33.5" y2="13.5" stroke="${a ? '#777' : '#444'}" stroke-width="0.3"/>
<line x1="36.5" y1="12" x2="36.5" y2="13.5" stroke="${a ? '#777' : '#444'}" stroke-width="0.3"/>
<rect x="32.5" y="13.5" width="5" height="4" fill="${a ? '#5a3a1a' : '#2a2018'}" rx="0.5"/>
${a ? `<rect x="34" y="14.5" width="2" height="2.2" fill="#ddaa33" rx="0.3"/>
<line x1="36" y1="15" x2="36.8" y2="15" stroke="#ddaa33" stroke-width="0.4"/>` : ''}
<path d="M22,24 Q21,26.5 22,29 L26,29 Q27,26.5 26,24 Z" fill="${a ? '#503818' : '#2a2015'}"/>
<rect x="21.8" y="23.5" width="4.4" height="1" fill="${a ? '#5a4220' : '#3a2a18'}" rx="0.3"/>
<line x1="21.3" y1="25.2" x2="26.7" y2="25.2" stroke="${a ? '#555' : '#2a2a2a'}" stroke-width="0.6"/>
<line x1="21.3" y1="27.8" x2="26.7" y2="27.8" stroke="${a ? '#555' : '#2a2a2a'}" stroke-width="0.6"/>
<line x1="24" y1="24" x2="24" y2="29" stroke="${a ? '#5a3a15' : '#2a2015'}" stroke-width="0.3" opacity="0.35"/>
<rect x="28" y="27.5" width="4" height="0.6" fill="${a ? '#6a4a2a' : '#3a2a18'}"/>
<rect x="28.5" y="28" width="0.5" height="1.2" fill="${a ? '#5a3a1a' : '#2a2018'}"/>
<rect x="31" y="28" width="0.5" height="1.2" fill="${a ? '#5a3a1a' : '#2a2018'}"/>
${a ? '<ellipse cx="16" cy="20" rx="18" ry="10" fill="#ffcc44" opacity="0.03"/>' : ''}`;
}

// ── Master dispatcher ────────────────────────────────────────────
const builders: Record<string, (a: boolean) => string> = {
  barracks: barracksSVG,
  church: churchSVG,
  lumbercamp: lumbercampSVG,
  market: marketSVG,
  surveySite: surveySiteSVG,
  recruitmentCenter: recruitmentCenterSVG,
  guardPost: guardPostSVG,
  warShrine: warShrineSVG,
  farm: farmSVG,
  ruins: ruinsSVG,
  forge: forgeSVG,
  leatherworks: leatherworksSVG,
  tavern: tavernSVG,
};

export function buildingSVG(type: string, active: boolean): string | null {
  const fn = builders[type];
  if (!fn) return null;
  return wrap(fn(active));
}
