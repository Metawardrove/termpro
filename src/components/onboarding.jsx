import React, { useState, useEffect } from 'react';
import { Monogram, Signature } from '../brand.jsx';
import { THEMES } from '../theme.js';

// ─── Icons ───
const I = {
  terminal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="m8 10 3 2-3 2M13 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  folder: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M4 7h5l2-2h9v14H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  bell: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  command: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M18 3a3 3 0 1 1-3 3V3h3ZM6 3a3 3 0 1 0 3 3V3H6Zm0 18a3 3 0 1 1 3-3v3H6Zm12 0a3 3 0 1 0-3-3v3h3ZM9 9h6v6H9V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  palette: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="13.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="6.5" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="2"/><path d="M12 2a10 10 0 1 0 0 20c.5 0 1-.5 1-1v-.6c0-.5-.4-.9-.8-1a2.2 2.2 0 0 1-1.2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4c0-5.5-3-9-7-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  alertTri: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="m12 2 11 20H1L12 2Zm0 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>,
  x: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevron: (p) => <svg {...p} viewBox="0 0 12 12" fill="none"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 17v5M9 3h6l1 2v6l2 2H7l2-2V5l1-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" stroke="currentColor" strokeWidth="2"/></svg>
};

// ─── Main ───
export default function Onboarding({ onDone, themeId, onSelectTheme }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  const steps = [
    { kind: 'welcome' },
    { kind: 'terminal', title: 'Tu terminal real', icon: I.terminal,
      body: 'No es una emulación ni un wrapper. Bash, zsh o PowerShell corriendo tal cual — con tu prompt, tu historial y todo lo que ya instalaste.' },
    { kind: 'projects', title: 'Una carpeta, un proyecto', icon: I.folder,
      body: 'Sin tabs que pelearse, sin splits escondidos. Cambias de proyecto y cambias de contexto. Fija los que usas a diario.' },
    { kind: 'notif', title: 'Notificaciones inteligentes', icon: I.bell,
      body: 'Cuando un build termina, un test falla o Claude pide permiso — llega un toast con un tono sutil. Sin robar el foco, sin popups, sin romperte el flujo.' },
    { kind: 'claude', title: 'Claude en la sesión', icon: I.command,
      body: 'Cada comando, cada archivo tocado, cada mensaje de Claude queda registrado. Scrolleá el timeline cuando quieras ver qué pasó.' },
    { kind: 'theme', title: 'Tu estilo', icon: I.palette,
      body: '7 apariencias incluidas, claro y oscuro. Elegí ahora — podés cambiarlo cuando quieras desde la barra superior.' },
    { kind: 'done' }
  ];

  const total = steps.length;
  const cur = steps[step];

  const go = (dir) => {
    const next = step + dir;
    if (next < 0 || next >= total) return;
    setDirection(dir);
    setStep(next);
    setAnimKey((k) => k + 1);
  };
  const finish = () => onDone();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (step === total - 1) finish(); else go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  return (
    <>
      <div
        onClick={finish}
        className="fixed inset-0 z-[4000]"
        style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(10px)',
          animation: 'tpFade 0.25s'
        }}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[4001] rounded-[16px] border overflow-hidden"
        style={{
          width: 'min(560px, 92vw)',
          background: 'linear-gradient(180deg, var(--tp-card-hi), var(--tp-card-lo))',
          borderColor: 'var(--tp-border-10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px var(--tp-border-06)',
          color: 'var(--tp-text)',
          animation: 'tpPaletteIn 0.32s cubic-bezier(0.2,0.9,0.3,1)'
        }}
      >
        <OnbHeader step={step} total={total} onSkip={finish} />
        <div
          key={animKey}
          className="px-[30px] pt-2 pb-[26px]"
          style={{
            animation: `${direction > 0 ? 'tpOnbInRight' : 'tpOnbInLeft'} 0.32s cubic-bezier(0.2,0.9,0.3,1)`
          }}
        >
          {cur.kind === 'welcome' && <OnbWelcome />}
          {cur.kind === 'terminal' && <OnbFeature step={cur}><DemoTerminal k={animKey} /></OnbFeature>}
          {cur.kind === 'projects' && <OnbFeature step={cur}><DemoProjects k={animKey} /></OnbFeature>}
          {cur.kind === 'notif' && <OnbFeature step={cur}><DemoNotif k={animKey} /></OnbFeature>}
          {cur.kind === 'claude' && <OnbFeature step={cur}><DemoClaude k={animKey} /></OnbFeature>}
          {cur.kind === 'theme' && <OnbFeature step={cur}><DemoTheme activeId={themeId} onSelect={onSelectTheme} /></OnbFeature>}
          {cur.kind === 'done' && <OnbDone />}
        </div>
        <OnbFooter
          step={step}
          total={total}
          onBack={() => go(-1)}
          onNext={() => (step === total - 1 ? finish() : go(1))}
        />
      </div>
    </>
  );
}

function OnbHeader({ step, total, onSkip }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="relative">
      <div className="h-[2px] w-full" style={{ background: 'var(--tp-border-06)' }}>
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--tp-accent), var(--tp-accent-soft))',
            transition: 'width 0.32s cubic-bezier(0.2,0.9,0.3,1)'
          }}
        />
      </div>
      <div className="flex items-center justify-between pt-3.5 px-7">
        <div
          className="text-[11px] font-mono uppercase tracking-[0.14em]"
          style={{ color: 'var(--tp-text-40)' }}
        >
          Paso <span style={{ color: 'var(--tp-text-70)' }}>{String(step + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
        </div>
        <button
          onClick={onSkip}
          className="px-2.5 py-1 text-[11px] cursor-pointer border-none"
          style={{ background: 'transparent', color: 'var(--tp-text-40)', letterSpacing: '0.04em' }}
        >
          Saltar tour ·{' '}
          <kbd className="font-mono text-[10px]">esc</kbd>
        </button>
      </div>
    </div>
  );
}

function OnbFeature({ step, children }) {
  const Icon = step.icon;
  return (
    <div className="py-2">
      <div
        className="w-[54px] h-[54px] rounded-[13px] flex items-center justify-center mb-4"
        style={{
          background: 'color-mix(in oklab, var(--tp-accent) 16%, transparent)',
          color: 'var(--tp-accent-soft)',
          boxShadow: '0 0 0 1px color-mix(in oklab, var(--tp-accent) 20%, transparent)'
        }}
      >
        <Icon width="26" height="26" />
      </div>
      <div
        className="text-[23px] font-semibold tracking-[-0.025em] mb-2 leading-[1.2]"
        style={{ color: 'var(--tp-text-strong)' }}
      >
        {step.title}
      </div>
      <div
        className="text-[13.5px] leading-[1.55] mb-4"
        style={{ color: 'var(--tp-text-70)' }}
      >
        {step.body}
      </div>
      {children}
    </div>
  );
}

// ─── Welcome ───
function OnbWelcome() {
  return (
    <div className="pt-3.5 pb-1 text-center">
      <div className="inline-flex relative mb-5">
        <div
          className="absolute"
          style={{
            inset: -16,
            background: 'radial-gradient(circle, color-mix(in oklab, var(--tp-accent) 36%, transparent), transparent 70%)',
            filter: 'blur(14px)',
            borderRadius: '50%',
            animation: 'tpOnbGlow 3.2s ease-in-out infinite'
          }}
        />
        <div className="relative">
          <Monogram size={72} radius={18} />
        </div>
      </div>
      <div
        className="text-[12px] font-mono uppercase tracking-[0.14em] mb-2"
        style={{ color: 'var(--tp-text-45)' }}
      >
        Bienvenido a
      </div>
      <div
        className="text-[36px] font-semibold tracking-[-0.025em] mb-3"
        style={{ color: 'var(--tp-text-strong)' }}
      >
        Term<span style={{ color: 'var(--tp-accent-soft)' }}>Pro</span>
      </div>
      <div
        className="text-[15px] leading-[1.6] mx-auto mb-[22px]"
        style={{ color: 'var(--tp-text-70)', maxWidth: 380 }}
      >
        Un manager para tus sesiones con Claude. Una terminal por proyecto, cero fricción, todo registrado.
      </div>
      <div
        className="px-[18px] py-3 rounded-[10px] inline-flex border"
        style={{
          background: 'color-mix(in oklab, var(--tp-border-06) 100%, transparent)',
          borderColor: 'var(--tp-border-06)'
        }}
      >
        <Signature size="sm" />
      </div>
    </div>
  );
}

// ─── Done ───
function OnbDone() {
  return (
    <div className="pt-[18px] pb-2.5 text-center">
      <div
        className="w-16 h-16 rounded-full inline-flex items-center justify-center mb-5 relative"
        style={{
          background: 'color-mix(in oklab, var(--tp-accent) 18%, transparent)',
          color: 'var(--tp-accent-soft)',
          animation: 'tpOnbPop 0.42s cubic-bezier(0.35,1.5,0.5,1)'
        }}
      >
        <div
          className="absolute"
          style={{
            inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in oklab, var(--tp-accent) 32%, transparent), transparent 70%)',
            filter: 'blur(10px)',
            animation: 'tpOnbGlow 2.4s ease-in-out infinite'
          }}
        />
        <I.check width="28" height="28" style={{ position: 'relative' }} />
      </div>
      <div
        className="text-[26px] font-semibold tracking-[-0.025em] mb-2.5 leading-[1.2]"
        style={{ color: 'var(--tp-text-strong)' }}
      >
        Todo listo
      </div>
      <div
        className="text-sm leading-[1.6] mx-auto mb-5"
        style={{ color: 'var(--tp-text-70)', maxWidth: 380 }}
      >
        Agregá una carpeta desde el sidebar izquierdo. Podés reabrir este tutorial desde la búsqueda global (⌘K → "Ver tutorial").
      </div>
    </div>
  );
}

// ─── Demo: Terminal lines typing ───
function DemoTerminal({ k }) {
  const lines = [
    { t: '$', cmd: 'pnpm test', d: 0 },
    { p: '  ', txt: 'Test Files', val: '12 passed', valColor: '#7dd3a0', d: 900 },
    { p: '  ', txt: '     Tests', val: '84 passed', valColor: '#7dd3a0', d: 1050 },
    { p: '  ', txt: '  Duration', val: '2.41s', valColor: 'var(--tp-text-50)', d: 1200 },
    { blank: true, d: 1350 },
    { t: '$', cmd: 'claude', d: 1500 },
    { p: '● ', txt: 'Claude Code v2.1', color: 'var(--tp-accent-soft)', d: 2500 },
    { p: '  ', txt: 'Leyendo src/...', color: 'var(--tp-text-50)', d: 2700 },
    { p: '> ', txt: '_', color: 'var(--tp-text-strong)', blink: true, d: 2900 }
  ];
  return (
    <div
      className="px-4 py-3.5 rounded-[10px] border font-mono text-[11.5px] leading-[1.65] overflow-hidden"
      style={{
        background: 'var(--tp-center)',
        borderColor: 'var(--tp-border-08)',
        minHeight: 176
      }}
    >
      {lines.map((l, i) => {
        if (l.blank) return <div key={i} style={{ height: 8 }} />;
        return (
          <div
            key={i}
            className="flex items-center gap-1.5"
            style={{
              opacity: 0,
              animation: `tpFade 0.2s ${l.d}ms forwards`
            }}
          >
            {l.t && <span style={{ color: 'var(--tp-accent-soft)' }}>{l.t}</span>}
            {l.p && <span style={{ color: l.color || 'var(--tp-text)' }}>{l.p}</span>}
            {l.cmd ? (
              <Typing text={l.cmd} delay={l.d} speed={55} />
            ) : (
              <>
                <span
                  style={{
                    color: l.color || 'var(--tp-text)',
                    animation: l.blink ? 'tpBlink 1s step-end infinite' : 'none'
                  }}
                >
                  {l.txt}
                </span>
                {l.val && (
                  <>
                    <span
                      style={{
                        flex: 1,
                        borderBottom: '1px dotted var(--tp-border-08)',
                        margin: '0 6px',
                        alignSelf: 'end',
                        marginBottom: 5
                      }}
                    />
                    <span style={{ color: l.valColor }}>{l.val}</span>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Typing({ text, delay = 0, speed = 60 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = [];
    timers.push(
      setTimeout(() => {
        for (let i = 0; i <= text.length; i++) {
          timers.push(setTimeout(() => setShown(i), i * speed));
        }
      }, delay)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [text, delay, speed]);
  return (
    <span style={{ color: 'var(--tp-text-strong)' }}>
      {text.slice(0, shown)}
      <span
        style={{
          opacity: shown < text.length ? 1 : 0,
          animation: 'tpBlink 0.9s step-end infinite'
        }}
      >
        ▌
      </span>
    </span>
  );
}

// ─── Demo: Projects reorder + pin + unread ───
function DemoProjects({ k }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1700),
      setTimeout(() => setPhase(3), 2500)
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, [k]);

  const items = [
    { id: 'termpro', name: 'termpro', cwd: '~/code/termpro', color: 'var(--tp-accent)', initials: 'TE', active: true },
    { id: 'landing', name: 'landing-beta', cwd: '~/work/landing', color: '#7c9cbf', initials: 'LA' },
    { id: 'api', name: 'api-pagos', cwd: '~/work/api', color: '#8e7ab5', initials: 'AP' },
    { id: 'dot', name: 'dotfiles', cwd: '~/dotfiles', color: '#7a9b7a', initials: 'DO' }
  ];
  const order = phase >= 2
    ? ['termpro', 'landing', 'api', 'dot']
    : phase >= 1
    ? ['landing', 'termpro', 'api', 'dot']
    : ['api', 'termpro', 'landing', 'dot'];
  const ROW_H = 42;

  return (
    <div
      className="px-2 py-2.5 rounded-[10px] border relative"
      style={{
        background: 'var(--tp-hover)',
        borderColor: 'var(--tp-border-06)',
        minHeight: 4 * ROW_H + 24
      }}
    >
      {phase >= 2 && (
        <div
          className="px-2 pb-1 text-[9.5px] font-semibold tracking-[0.12em] font-mono"
          style={{ color: 'var(--tp-text-45)', animation: 'tpFade 0.3s' }}
        >
          FIJADOS
        </div>
      )}
      <div className="relative" style={{ height: 4 * ROW_H + (phase >= 2 ? 14 : 0) }}>
        {items.map((p) => {
          const idx = order.indexOf(p.id);
          const yOffset = idx * ROW_H + (phase >= 2 && idx > 0 ? 14 : 0);
          const showBadge = phase >= 3 && p.id === 'landing';
          const showPin = phase >= 2 && p.id === 'termpro';
          return (
            <div
              key={p.id}
              className="absolute left-0 right-0 flex items-center gap-2.5 rounded-lg mx-0.5"
              style={{
                top: 0,
                transform: `translateY(${yOffset}px)`,
                transition: 'transform 0.55s cubic-bezier(0.35,1.1,0.5,1)',
                padding: '7px 10px',
                paddingLeft: 8,
                height: ROW_H - 4,
                background: p.active
                  ? 'color-mix(in oklab, var(--tp-accent) 10%, transparent)'
                  : 'transparent',
                borderLeft: p.active ? '2px solid var(--tp-accent)' : '2px solid transparent'
              }}
            >
              <div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                style={{ background: p.color, color: '#fff' }}
              >
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-medium flex items-center gap-1.5"
                  style={{ color: 'var(--tp-text)' }}
                >
                  {p.name}
                  {showPin && (
                    <span
                      style={{
                        color: 'var(--tp-accent-soft)',
                        animation: 'tpOnbPop 0.4s cubic-bezier(0.35,1.5,0.5,1)'
                      }}
                    >
                      <I.pin width="10" height="10" />
                    </span>
                  )}
                </div>
                <div
                  className="text-[10.5px] font-mono"
                  style={{ color: 'var(--tp-text-45)' }}
                >
                  {p.cwd}
                </div>
              </div>
              {showBadge && (
                <span
                  className="inline-flex items-center justify-center font-bold"
                  style={{
                    minWidth: 16,
                    height: 16,
                    padding: '0 5px',
                    borderRadius: 8,
                    background: 'var(--tp-accent)',
                    color: '#fff',
                    fontSize: 10,
                    animation: 'tpOnbPop 0.4s cubic-bezier(0.35,1.5,0.5,1), tpPulse 1.6s ease-in-out 0.4s infinite'
                  }}
                >
                  3
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Demo: Notifications (toasts stack + bell waves) ───
function DemoNotif({ k }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 1250),
      setTimeout(() => setPhase(3), 2250)
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, [k]);

  const toasts = [
    { title: 'Build completo', sub: 'landing-beta · 2.4s', accent: '#7dd3a0', icon: I.check },
    { title: 'Claude pide permiso', sub: 'rm -rf node_modules', accent: 'var(--tp-accent-soft)', icon: I.alertTri, mono: true },
    { title: 'Test falló', sub: 'api-pagos · checkout.spec.ts', accent: '#ef5a4b', icon: I.x }
  ];

  return (
    <div
      className="rounded-[10px] border relative overflow-hidden p-3.5"
      style={{
        background: 'var(--tp-hover)',
        borderColor: 'var(--tp-border-06)',
        minHeight: 210
      }}
    >
      <div
        className="absolute flex flex-col gap-1.5 items-end"
        style={{ top: 14, right: 14, left: 120 }}
      >
        {toasts.map((t, i) => {
          const visible = phase > i;
          const IconT = t.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-[9px] border"
              style={{
                width: '100%',
                maxWidth: 244,
                padding: '9px 11px',
                background: 'var(--tp-card)',
                borderColor: `color-mix(in oklab, ${t.accent} 35%, var(--tp-border-10))`,
                boxShadow: visible
                  ? `0 8px 20px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in oklab, ${t.accent} 10%, transparent)`
                  : 'none',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.96)',
                transition: 'all 0.42s cubic-bezier(0.25,1.2,0.4,1)'
              }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: `color-mix(in oklab, ${t.accent} 22%, transparent)`,
                  color: t.accent
                }}
              >
                <IconT width="14" height="14" />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-[11.5px]"
                  style={{ color: 'var(--tp-text)' }}
                >
                  {t.title}
                </div>
                <div
                  className="text-[10.5px] truncate"
                  style={{
                    color: 'var(--tp-text-50)',
                    fontFamily: t.mono ? 'JetBrains Mono, monospace' : 'inherit'
                  }}
                >
                  {t.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="absolute flex items-center justify-center"
        style={{ left: 28, bottom: 62, width: 56, height: 56 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: 0,
              border: '1.5px solid color-mix(in oklab, var(--tp-accent) 60%, transparent)',
              opacity: 0,
              animation: phase > 0 ? `tpPingWave 1s ease-out ${i * 0.9}s infinite` : 'none'
            }}
          />
        ))}
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center relative z-[1]"
          style={{
            background: 'linear-gradient(180deg, color-mix(in oklab, var(--tp-accent) 28%, var(--tp-card)), var(--tp-card))',
            border: '1px solid color-mix(in oklab, var(--tp-accent) 40%, var(--tp-border-10))',
            color: 'var(--tp-accent-soft)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            animation: phase > 0 ? 'tpBellShake 0.6s cubic-bezier(0.36,0,0.64,1) 0s' : 'none'
          }}
        >
          <I.bell width="20" height="20" />
        </div>
      </div>

      <div
        className="absolute flex items-center gap-2 rounded-[7px] text-[10.5px]"
        style={{
          left: 14,
          right: 14,
          bottom: 12,
          padding: '8px 10px',
          background: 'color-mix(in oklab, var(--tp-accent) 8%, var(--tp-card))',
          border: '1px dashed color-mix(in oklab, var(--tp-accent) 35%, var(--tp-border-10))',
          color: 'var(--tp-text-70)'
        }}
      >
        <span style={{ color: 'var(--tp-accent-soft)' }} className="flex">
          <I.settings width="13" height="13" />
        </span>
        <span>
          Realiza ajustes en{' '}
          <span style={{ color: 'var(--tp-text)', fontWeight: 600 }}>Configuración</span>
          {' '}→ Notificaciones: eventos, tonos, horario silencio.
        </span>
      </div>
    </div>
  );
}

// ─── Demo: Claude bubble → timeline ───
function DemoClaude({ k }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2100)
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, [k]);

  return (
    <div
      className="rounded-[10px] border p-3.5 grid grid-cols-2 gap-3.5"
      style={{
        background: 'var(--tp-hover)',
        borderColor: 'var(--tp-border-06)',
        minHeight: 168
      }}
    >
      <div>
        <div
          className="text-[9.5px] font-mono tracking-[0.12em] mb-2 font-semibold"
          style={{ color: 'var(--tp-text-40)' }}
        >
          CLAUDE
        </div>
        <div
          className="rounded-[10px] border text-[11.5px] leading-[1.45]"
          style={{
            padding: '9px 11px',
            background: 'color-mix(in oklab, var(--tp-accent) 10%, var(--tp-card))',
            borderColor: 'color-mix(in oklab, var(--tp-accent) 18%, transparent)',
            color: 'var(--tp-text)',
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.3s'
          }}
        >
          {phase < 3 ? (
            <>
              {phase >= 2 ? 'Voy a analizar src/terminal.tsx' : 'Claro, déjame revisar el código'}
              <span className="inline-flex gap-[2px] ml-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 3,
                      height: 3,
                      background: 'var(--tp-accent-soft)',
                      animation: `tpTyping 1.1s ease-in-out ${i * 0.16}s infinite`
                    }}
                  />
                ))}
              </span>
            </>
          ) : (
            <>Listo. Encontré 3 mejoras. Ver timeline →</>
          )}
        </div>
      </div>

      <div>
        <div
          className="text-[9.5px] font-mono tracking-[0.12em] mb-2 font-semibold"
          style={{ color: 'var(--tp-text-40)' }}
        >
          TIMELINE
        </div>
        <div className="flex flex-col gap-[7px]">
          {[
            { icon: '●', label: 'Leyendo src/...', time: 'ahora', color: 'var(--tp-accent-soft)' },
            { icon: '$', label: 'git diff', time: '4s', color: '#8ab4c9' },
            { icon: '✓', label: 'pnpm test', time: '12s', color: '#7dd3a0' }
          ].map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-[7px]"
              style={{
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateX(0)' : 'translateX(-6px)',
                transition: `all 0.32s ${i * 0.09}s`
              }}
            >
              <div
                className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold"
                style={{
                  background: `color-mix(in oklab, ${e.color} 18%, transparent)`,
                  color: e.color
                }}
              >
                {e.icon}
              </div>
              <span
                className="flex-1 text-[11px] truncate"
                style={{ color: 'var(--tp-text-80)' }}
              >
                {e.label}
              </span>
              <span
                className="text-[9.5px] font-mono"
                style={{ color: 'var(--tp-text-40)' }}
              >
                {e.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Demo: Theme grid ───
function DemoTheme({ activeId, onSelect }) {
  const themes = Object.entries(THEMES);
  return (
    <div className="grid grid-cols-4 gap-2">
      {themes.map(([id, t], i) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            onClick={() => onSelect?.(id)}
            className="p-0 border-none cursor-pointer rounded-[9px] overflow-hidden relative"
            style={{
              background: 'transparent',
              animation: `tpOnbSlideIn 0.32s ${i * 0.04}s backwards`,
              outline: active ? '2px solid var(--tp-accent)' : `1px solid var(--tp-border-08)`,
              outlineOffset: active ? 1 : 0
            }}
          >
            <div className="relative" style={{ height: 46, background: t.previewBg || t.bgCenter }}>
              <div
                className="absolute rounded-full"
                style={{
                  bottom: 5,
                  right: 5,
                  width: 9,
                  height: 9,
                  background: t.accent,
                  boxShadow: `0 0 8px ${t.accent}aa`
                }}
              />
              {active && (
                <div
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    top: 4,
                    right: 4,
                    width: 14,
                    height: 14,
                    background: 'var(--tp-accent)',
                    color: '#fff'
                  }}
                >
                  <I.check width="8" height="8" />
                </div>
              )}
            </div>
            <div
              className="border-t"
              style={{
                padding: '5px 6px 6px',
                background: 'var(--tp-hover)',
                borderColor: 'var(--tp-border-06)'
              }}
            >
              <div
                className="text-[9.5px] font-semibold truncate text-left"
                style={{ color: 'var(--tp-text-80)' }}
              >
                {t.name}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OnbFooter({ step, total, onBack, onNext }) {
  const last = step === total - 1;
  const first = step === 0;
  return (
    <div
      className="flex items-center gap-2 border-t"
      style={{
        padding: '14px 22px 18px',
        borderColor: 'var(--tp-border-06)',
        background: 'var(--tp-hover)'
      }}
    >
      <button
        onClick={onBack}
        disabled={first}
        className="px-3 py-2 border-none inline-flex items-center gap-1 text-[12px]"
        style={{
          cursor: first ? 'default' : 'pointer',
          background: 'transparent',
          color: first ? 'var(--tp-text-30)' : 'var(--tp-text-60)'
        }}
      >
        <span className="inline-flex rotate-180">
          <I.chevron width="11" height="11" />
        </span>
        Atrás
      </button>
      <div className="flex-1 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded"
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              background:
                i === step
                  ? 'var(--tp-accent-soft)'
                  : i < step
                  ? 'var(--tp-border-15)'
                  : 'var(--tp-border-08)',
              transition: 'all 0.28s cubic-bezier(0.2,0.9,0.3,1)'
            }}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        className="rounded-[8px] border-none cursor-pointer text-[12.5px] font-semibold inline-flex items-center gap-1.5"
        style={{
          padding: '9px 18px',
          background: 'var(--tp-accent)',
          color: 'var(--tp-text-strong)',
          boxShadow: '0 2px 8px color-mix(in oklab, var(--tp-accent) 40%, transparent)'
        }}
      >
        {last ? 'Empezar' : 'Siguiente'}
        <I.chevron width="11" height="11" />
      </button>
    </div>
  );
}
