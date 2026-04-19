// TermPro — 7 temas predefinidos con CSS variables aplicadas a :root
// Cada tema re-pinta sidebar, centro, right panel, acento

export const THEMES = {
  'claude-night': {
    name: 'Claude Night',
    subtitle: 'Oscuro, tibio, con acento ladrillo',
    bgChrome: '#08080a',
    bgSidebar: '#111114',
    bgSidebarRail: '#0e0e11',
    bgCenter: '#0a0a0c',
    bgRight: '#141116',
    bgRightRail: '#100d12',
    accent: '#b5483c',
    accentSoft: '#d6938a',
    text: '#e8e8ea',
    cardBg: '#1a1a1f',
    avatarShape: 'circle',
    previewBg: 'linear-gradient(135deg, #141116 0%, #0a0a0c 50%, #111114 100%)'
  },
  'midnight-ink': {
    name: 'Midnight Ink',
    subtitle: 'Azul profundo, tipo Notion nocturno',
    bgChrome: '#0b0e16',
    bgSidebar: '#10131d',
    bgSidebarRail: '#0c0f18',
    bgCenter: '#0a0d14',
    bgRight: '#11141f',
    bgRightRail: '#0d1018',
    accent: '#6b8cce',
    accentSoft: '#9ab3e3',
    text: '#e4e8f1',
    cardBg: '#161a26',
    avatarShape: 'circle',
    previewBg: 'linear-gradient(135deg, #11141f 0%, #0a0d14 50%, #10131d 100%)'
  },
  'mocha-dusk': {
    name: 'Mocha Dusk',
    subtitle: 'Tonos café, cálido y envolvente',
    bgChrome: '#141010',
    bgSidebar: '#1c1715',
    bgSidebarRail: '#171311',
    bgCenter: '#15110f',
    bgRight: '#1f1916',
    bgRightRail: '#1a1513',
    accent: '#c98a66',
    accentSoft: '#d9a884',
    text: '#ece4db',
    cardBg: '#26201d',
    avatarShape: 'circle',
    previewBg: 'linear-gradient(135deg, #1f1916 0%, #15110f 50%, #1c1715 100%)'
  },
  'forest-terminal': {
    name: 'Forest Terminal',
    subtitle: 'Verde musgo sobre carbón, estilo retro hacker',
    bgChrome: '#0a0d0a',
    bgSidebar: '#0f1410',
    bgSidebarRail: '#0c100d',
    bgCenter: '#080b08',
    bgRight: '#0f1510',
    bgRightRail: '#0c110d',
    accent: '#6fb07a',
    accentSoft: '#9bcba3',
    text: '#dceadf',
    cardBg: '#141c16',
    avatarShape: 'square',
    previewBg: 'linear-gradient(135deg, #0f1510 0%, #080b08 50%, #0f1410 100%)'
  },
  'solar-flare': {
    name: 'Solar Flare',
    subtitle: 'Claro, papel cálido, tipo Solarized Light',
    bgChrome: '#e4dcc4',
    bgSidebar: '#f2ead3',
    bgSidebarRail: '#e8dfc4',
    bgCenter: '#fbf5e1',
    bgRight: '#ede4c9',
    bgRightRail: '#e1d7b9',
    accent: '#a8432d',
    accentSoft: '#c25a3f',
    text: '#2a2620',
    cardBg: '#fffbed',
    avatarShape: 'circle',
    previewBg: 'linear-gradient(135deg, #ede4c9 0%, #fbf5e1 50%, #f2ead3 100%)',
    light: true
  },
  'carbon-mono': {
    name: 'Carbon Mono',
    subtitle: 'Grayscale puro, acento cian metálico',
    bgChrome: '#0a0a0a',
    bgSidebar: '#131313',
    bgSidebarRail: '#0f0f0f',
    bgCenter: '#0b0b0b',
    bgRight: '#121212',
    bgRightRail: '#0e0e0e',
    accent: '#8ab4c9',
    accentSoft: '#b0cfde',
    text: '#e5e5e5',
    cardBg: '#1c1c1c',
    avatarShape: 'square',
    previewBg: 'linear-gradient(135deg, #121212 0%, #0b0b0b 50%, #131313 100%)'
  },
  'synthwave': {
    name: 'Synthwave',
    subtitle: 'Púrpura neón, para largas noches de código',
    bgChrome: '#13091c',
    bgSidebar: '#1a0f26',
    bgSidebarRail: '#160c21',
    bgCenter: '#0f0817',
    bgRight: '#1d1029',
    bgRightRail: '#180d23',
    accent: '#c97bd6',
    accentSoft: '#dea4e7',
    text: '#ede0f5',
    cardBg: '#241636',
    avatarShape: 'circle',
    previewBg: 'linear-gradient(135deg, #1d1029 0%, #0f0817 50%, #1a0f26 100%)'
  }
};

export function applyTheme(themeId) {
  const t = THEMES[themeId] || THEMES['claude-night'];
  const light = !!t.light;
  const textRgb = light ? '42,38,32' : '232,232,234';
  const borderTone = light ? '70,52,28' : '255,255,255';
  const borderMul = light ? 1.4 : 1;
  const hoverTone = light ? 'rgba(70,52,28,0.055)' : 'rgba(255,255,255,0.03)';
  const cardHi = light ? '#fffbed' : '#1a1a1f';
  const cardLo = light ? t.bgSidebar : '#0e0e11';

  const r = document.documentElement.style;
  r.setProperty('--tp-chrome', t.bgChrome);
  r.setProperty('--tp-sidebar', t.bgSidebar);
  r.setProperty('--tp-sidebar-rail', t.bgSidebarRail);
  r.setProperty('--tp-center', t.bgCenter);
  r.setProperty('--tp-right', t.bgRight);
  r.setProperty('--tp-right-rail', t.bgRightRail);
  r.setProperty('--tp-status', light ? t.bgSidebarRail : '#070708');
  r.setProperty('--tp-card', t.cardBg);
  r.setProperty('--tp-card-hi', cardHi);
  r.setProperty('--tp-card-lo', cardLo);
  r.setProperty('--tp-accent', t.accent);
  r.setProperty('--tp-accent-soft', t.accentSoft);
  r.setProperty('--tp-text', t.text);
  r.setProperty('--tp-text-strong', light ? '#1d1a15' : '#ffffff');
  r.setProperty('--tp-avatar-shape', t.avatarShape === 'circle' ? '50%' : '7px');

  [22, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80].forEach((a) => {
    r.setProperty(`--tp-text-${a}`, `rgba(${textRgb},${a / 100})`);
  });
  [4, 5, 6, 8, 10, 12, 15].forEach((a) => {
    const alpha = Math.min(0.5, (a / 100) * borderMul);
    r.setProperty(`--tp-border-${String(a).padStart(2, '0')}`, `rgba(${borderTone},${alpha})`);
  });
  r.setProperty('--tp-hover', hoverTone);
  r.setProperty('--tp-is-light', light ? '1' : '0');

  // xterm palette derivative
  r.setProperty('--tp-term-bg', t.bgCenter);
  r.setProperty('--tp-term-fg', t.text);
  r.setProperty('--tp-term-cursor', t.accent);

  document.body.style.background = t.bgCenter;
  document.body.style.color = t.text;

  window.dispatchEvent(new CustomEvent('termpro:theme-changed', { detail: { themeId, theme: t } }));
}

export function loadThemeId() {
  return localStorage.getItem('termpro:theme') || 'claude-night';
}

export function saveThemeId(id) {
  localStorage.setItem('termpro:theme', id);
}
