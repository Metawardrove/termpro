import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../theme.js';
import { BrandCompact, Monogram } from '../brand.jsx';

// ─── Avatar con iniciales 2 letras sobre color del proyecto ───
export function Avatar({ project, size = 36, ring = false, ringColor }) {
  const initials = (project?.name || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--tp-avatar-shape)',
        background: project?.color || '#666',
        color: 'var(--tp-text-strong)',
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.02em',
        boxShadow: ring
          ? `0 0 0 2px ${ringColor || project?.color}`
          : 'inset 0 1px 0 rgba(255,255,255,0.14)',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)'
      }}
      className="flex items-center justify-center flex-shrink-0"
    >
      {initials}
    </div>
  );
}

// ─── Status dot: idle/running/error/done ───
export function StatusDot({ status, size = 8 }) {
  const color = {
    running: '#c06b60',
    error: '#ef5a4b',
    done: '#7dd3a0',
    idle: 'var(--tp-text-30)'
  }[status] || 'var(--tp-text-30)';
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        animation: status === 'running' ? 'tpPulse 1.6s ease-in-out infinite' : 'none'
      }}
      className="inline-block flex-shrink-0"
    />
  );
}

function ago(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── WindowChrome — barra superior con brand, counts, search, themes ───
export function WindowChrome({ projectCount, runningCount, onCmdK, onOpenThemes, onOpenSettings, onOpenAbout, onToggleFocus, focusActive }) {
  return (
    <div
      className="h-[38px] flex items-center px-3 select-none border-b"
      style={{
        background: 'var(--tp-chrome)',
        borderColor: 'var(--tp-border-05)'
      }}
    >
      <BrandCompact onClick={onOpenAbout} />
      <div className="w-px h-4 mx-3.5" style={{ background: 'var(--tp-border-08)' }} />
      <div className="flex gap-2.5 text-[11px]" style={{ color: 'var(--tp-text-50)' }}>
        <span>{projectCount} proyectos</span>
        {runningCount > 0 && (
          <span className="inline-flex items-center gap-1.5" style={{ color: '#c06b60' }}>
            <StatusDot status="running" size={6} />
            {runningCount} activos
          </span>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={onCmdK}
        className="px-2.5 py-1 rounded-md text-[11px] cursor-pointer inline-flex items-center gap-1.5 border"
        style={{
          background: 'var(--tp-hover)',
          color: 'var(--tp-text-70)',
          borderColor: 'var(--tp-border-08)'
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        Buscar
        <kbd className="text-[9.5px] px-1 py-px rounded font-mono" style={{ background: 'var(--tp-border-06)' }}>⌘K</kbd>
      </button>
      <button
        onClick={onToggleFocus}
        title={focusActive ? 'Salir de enfoque (⌘.)' : 'Colapsar paneles (⌘.)'}
        className="ml-1.5 w-[30px] h-[26px] rounded-md border cursor-pointer inline-flex items-center justify-center"
        style={{
          background: focusActive ? 'color-mix(in oklab, var(--tp-accent) 18%, transparent)' : 'var(--tp-hover)',
          color: focusActive ? 'var(--tp-accent-soft)' : 'var(--tp-text-70)',
          borderColor: focusActive ? 'color-mix(in oklab, var(--tp-accent) 30%, transparent)' : 'var(--tp-border-08)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.4"/><line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.4"/></svg>
      </button>
      <button
        onClick={onOpenThemes}
        title="Apariencia"
        className="ml-1.5 w-[30px] h-[26px] rounded-md border cursor-pointer inline-flex items-center justify-center"
        style={{
          background: 'var(--tp-hover)',
          color: 'var(--tp-text-70)',
          borderColor: 'var(--tp-border-08)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="13.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="6.5" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="2"/><path d="M12 2a10 10 0 1 0 0 20c.5 0 1-.5 1-1v-.6c0-.5-.4-.9-.8-1a2.2 2.2 0 0 1-1.2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4c0-5.5-3-9-7-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
      </button>
      <button
        onClick={onOpenSettings}
        title="Ajustes (Ctrl+,)"
        className="ml-1.5 w-[30px] h-[26px] rounded-md border cursor-pointer inline-flex items-center justify-center"
        style={{
          background: 'var(--tp-hover)',
          color: 'var(--tp-text-70)',
          borderColor: 'var(--tp-border-08)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
    </div>
  );
}

// ─── CenterHeader — info del proyecto activo arriba del terminal ───
export function CenterHeader({ project, session, onKill, onClear, onRestart, onClaudeBypass }) {
  if (!project) {
    return (
      <div
        className="px-4 py-3 border-b flex items-center"
        style={{ background: 'var(--tp-center)', borderColor: 'var(--tp-border-05)' }}
      >
        <div className="text-xs" style={{ color: 'var(--tp-text-50)' }}>
          Sin sesión activa
        </div>
      </div>
    );
  }
  const status = session?.status || 'idle';
  const statusLabel = { idle: 'idle', running: 'activo', error: 'error', done: 'listo' }[status] || status;
  const statusColor = status === 'error' ? '#ef8478' : status === 'running' ? '#c06b60' : 'var(--tp-text-50)';
  return (
    <div
      className="px-[18px] py-3 border-b flex items-center gap-3.5"
      style={{ background: 'var(--tp-center)', borderColor: 'var(--tp-border-05)' }}
    >
      <Avatar project={project} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[15px] font-semibold tracking-[-0.01em] truncate"
            style={{ color: 'var(--tp-text-strong)' }}
          >
            {session?.displayName || project.name}
          </span>
          <StatusDot status={status} size={7} />
          <span className="text-[11px] font-mono" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <div
          className="text-[11px] font-mono mt-0.5 flex items-center gap-2 flex-wrap"
          style={{ color: 'var(--tp-text-45)' }}
        >
          <span className="inline-flex items-center gap-1 truncate">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M4 7h5l2-2h9v14H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            <span className="truncate max-w-[380px]">{project.cwd}</span>
          </span>
          {session?.createdAt && (
            <>
              <span style={{ color: 'var(--tp-text-22)' }}>·</span>
              <span>{ago(session.createdAt)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {onClaudeBypass && (
          <button
            onClick={onClaudeBypass}
            title="Claude sin permisos (--dangerously-skip-permissions). Ejecuta sin pedir confirmacion. Usar con cuidado."
            className="w-7 h-7 rounded-md cursor-pointer inline-flex items-center justify-center border"
            style={{
              background: 'rgba(229,90,75,0.12)',
              color: '#ef8478',
              borderColor: 'rgba(239,132,120,0.35)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229,90,75,0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(229,90,75,0.12)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="m9 11 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0"/>
              <line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="15.5" r="1" fill="currentColor"/>
            </svg>
          </button>
        )}
        <button
          onClick={onClear}
          title="Limpiar"
          className="w-7 h-7 rounded-md cursor-pointer inline-flex items-center justify-center"
          style={{ background: 'var(--tp-hover)', color: 'var(--tp-text-55)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <button
          onClick={onRestart}
          title="Reiniciar"
          className="w-7 h-7 rounded-md cursor-pointer inline-flex items-center justify-center"
          style={{ background: 'var(--tp-hover)', color: 'var(--tp-text-55)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
        </button>
        <button
          onClick={onKill}
          title="Terminar"
          className="w-7 h-7 rounded-md cursor-pointer inline-flex items-center justify-center"
          style={{ background: 'var(--tp-hover)', color: 'var(--tp-text-55)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── StatusBar — 24px abajo del terminal ───
export function StatusBar({ session, project }) {
  if (!session) return null;
  const status = session.status || 'idle';
  const color = status === 'error' ? '#ef5a4b' : status === 'running' ? '#c06b60' : 'var(--tp-text-50)';
  return (
    <div
      className="h-6 px-4 flex items-center gap-3.5 border-t text-[10.5px] font-mono"
      style={{
        background: 'var(--tp-status)',
        borderColor: 'var(--tp-border-04)',
        color: 'var(--tp-text-45)'
      }}
    >
      <span className="inline-flex items-center gap-1.5" style={{ color }}>
        <StatusDot status={status} size={6} />
        {status}
      </span>
      <span>UTF-8</span>
      {session.shell && <span style={{ color: 'var(--tp-text-55)' }}>{session.shell}</span>}
      {session.pid && <span style={{ color: 'var(--tp-text-40)' }}>PID {session.pid}</span>}
      <span style={{ color: 'var(--tp-text-50)' }} className="truncate">{project?.cwd || ''}</span>
      <div className="flex-1" />
      {session.needsPermission && (
        <span style={{ color: '#e5a547' }} className="inline-flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="m12 2 11 20H1L12 2Zm0 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          permiso pendiente
        </span>
      )}
      {session.unread > 0 && !session.needsPermission && (
        <span style={{ color: 'var(--tp-accent-soft)' }}>{session.unread} sin leer</span>
      )}
    </div>
  );
}

// ─── Toast + Stack ───
export function Toast({ toast, onDismiss }) {
  const kindConf = {
    permission: { color: '#e5a547', title: 'Necesita permiso' },
    done: { color: '#7dd3a0', title: 'Tarea completada' },
    error: { color: '#ef5a4b', title: 'Error en sesión' },
    info: { color: 'var(--tp-accent-soft)', title: 'Info' }
  }[toast.kind] || { color: '#888', title: 'Notificación' };
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration || 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="rounded-[10px] shadow-xl flex gap-3 items-start px-4 py-3.5 border"
      style={{
        minWidth: 320,
        maxWidth: 380,
        background: 'linear-gradient(180deg, var(--tp-card-hi), var(--tp-card-lo))',
        borderColor: 'var(--tp-border-08)',
        borderLeftColor: kindConf.color,
        borderLeftWidth: '3px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        animation: 'tpSlideIn 0.3s cubic-bezier(0.2,0.9,0.3,1)',
        color: 'var(--tp-text)'
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-text-strong)' }}>
          {kindConf.title}
        </div>
        <div className="text-xs leading-snug" style={{ color: 'var(--tp-text-65)' }}>
          {toast.message}
        </div>
        {toast.actions && toast.actions.length > 0 && (
          <div className="flex gap-1.5 mt-2.5">
            {toast.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => { a.onClick?.(); onDismiss(); }}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer border-none"
                style={{
                  background: a.primary ? kindConf.color : 'var(--tp-border-06)',
                  color: a.primary ? '#fff' : 'var(--tp-text-80)',
                  fontFamily: 'inherit'
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="w-5 h-5 rounded cursor-pointer inline-flex items-center justify-center"
        style={{ background: 'transparent', color: 'var(--tp-text-40)' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

// ─── PermissionBanner — inline arriba del terminal cuando Claude pide permiso ───
export function PermissionBanner({ label, onDismiss }) {
  return (
    <div
      className="mx-4 mt-3 mb-2 px-3 py-2.5 rounded-lg border flex items-start gap-2.5"
      style={{
        background: 'rgba(229,165,71,0.08)',
        borderColor: 'rgba(229,165,71,0.25)',
        color: 'var(--tp-text)'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#e5a547', flexShrink: 0, marginTop: 1 }}>
        <path d="m12 2 11 20H1L12 2Zm0 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="18" r="1" fill="currentColor"/>
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold" style={{ color: '#e5a547' }}>
          Claude solicita permiso
        </div>
        <div className="text-[11.5px] mt-0.5 truncate" style={{ color: 'var(--tp-text-70)' }} title={label}>
          {label || 'Responde en el terminal (y/N)'}
        </div>
      </div>
      <button
        onClick={onDismiss}
        title="Cerrar aviso"
        className="w-5 h-5 rounded cursor-pointer inline-flex items-center justify-center flex-shrink-0"
        style={{ background: 'transparent', color: 'var(--tp-text-40)', border: 'none' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      className="fixed top-[46px] right-3.5 flex flex-col gap-2.5 z-[2000]"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── ThemePicker — grid de 7 temas ───
export function ThemePicker({ open, onClose, activeId, onSelect }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[2500]"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          animation: 'tpFade 0.15s'
        }}
      />
      <div
        className="fixed top-[52px] right-3.5 z-[2501] rounded-xl overflow-hidden border"
        style={{
          width: 'min(520px, 94vw)',
          background: '#151518',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          animation: 'tpPaletteIn 0.18s cubic-bezier(0.2,0.9,0.3,1)',
          color: '#e8e8ea'
        }}
      >
        <div
          className="px-[18px] py-2.5 border-b flex items-center gap-2.5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">Apariencia</div>
            <div className="text-[11.5px]" style={{ color: 'rgba(232,232,234,0.5)' }}>
              Escoge cómo se ve tu TermPro
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded cursor-pointer inline-flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div
          className="p-3.5 grid grid-cols-2 gap-2.5"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {Object.entries(THEMES).map(([id, t]) => (
            <ThemeCard key={id} id={id} theme={t} active={id === activeId} onClick={() => onSelect(id)} />
          ))}
        </div>
      </div>
    </>
  );
}

function ThemeCard({ theme, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="text-left rounded-[10px] overflow-hidden cursor-pointer transition-all"
      style={{
        padding: 0,
        border: active ? `1.5px solid ${theme.accent}` : '1px solid rgba(255,255,255,0.08)',
        background: '#0e0e11',
        boxShadow: active
          ? `0 0 0 3px ${theme.accent}22`
          : hover
          ? '0 4px 14px rgba(0,0,0,0.4)'
          : 'none'
      }}
    >
      <div className="flex relative" style={{ height: 78 }}>
        <div
          className="flex flex-col gap-1 p-1.5"
          style={{ width: '32%', background: theme.bgSidebar }}
        >
          {[0.7, 0.4, 0.3].map((op, i) => (
            <div key={i} className="flex gap-1 items-center">
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: theme.avatarShape === 'circle' ? '50%' : 2,
                  background: i === 0 ? theme.accent : i === 1 ? theme.accentSoft : theme.text,
                  opacity: i === 0 ? 1 : i === 1 ? 0.75 : 0.6
                }}
              />
              <div
                className="flex-1 rounded-sm"
                style={{ height: 3, background: theme.text, opacity: op }}
              />
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-1 p-1.5" style={{ background: theme.bgCenter }}>
          <div className="rounded-sm" style={{ height: 3, width: '70%', background: theme.accent, opacity: 0.9 }} />
          <div className="rounded-sm" style={{ height: 3, width: '45%', background: theme.text, opacity: 0.5 }} />
          <div className="rounded-sm" style={{ height: 3, width: '60%', background: theme.text, opacity: 0.3 }} />
          <div className="rounded-sm" style={{ height: 3, width: '35%', background: theme.accentSoft, opacity: 0.6 }} />
        </div>
        <div className="flex flex-col gap-1 p-1.5" style={{ width: '26%', background: theme.bgRight }}>
          <div className="rounded-sm" style={{ height: 3, width: '80%', background: theme.text, opacity: 0.5 }} />
          <div className="rounded-sm" style={{ height: 8, background: theme.accent, opacity: 0.25 }} />
          <div className="rounded-sm" style={{ height: 3, width: '60%', background: theme.text, opacity: 0.35 }} />
        </div>
        {active && (
          <div
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: theme.accent, color: '#fff' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3" style={{ background: '#0e0e11' }}>
        <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: '#e8e8ea' }}>
          {theme.name}
          {theme.light && (
            <span
              className="text-[9px] px-1.5 py-px rounded font-mono font-medium"
              style={{ background: 'rgba(255,220,100,0.12)', color: '#e5c547' }}
            >
              LIGHT
            </span>
          )}
        </div>
        <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(232,232,234,0.5)' }}>
          {theme.subtitle}
        </div>
      </div>
    </button>
  );
}

// ─── Command Palette — Cmd+K buscar proyectos/sesiones/acciones ───
export function CommandPalette({ open, onClose, projects, sessions, onSelectProject, onSelectSession, onAction }) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    if (open) {
      setQuery('');
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const actions = [
    { id: 'claude-bypass', label: '⚠ Claude bypass — modo sin permisos', hint: 'dangerous' },
    { id: 'focus', label: 'Modo enfoque', hint: '⌘.' },
    { id: 'toggle-left', label: 'Toggle panel izquierdo', hint: '⌘B' },
    { id: 'toggle-right', label: 'Toggle panel derecho', hint: '⌘J' },
    { id: 'themes', label: 'Cambiar tema', hint: '' },
    { id: 'onboarding', label: 'Ver tutorial de bienvenida', hint: '' },
    { id: 'about', label: 'Acerca de TermPro', hint: '' },
    { id: 'settings', label: 'Ajustes', hint: '⌘,' }
  ];

  const filter = (s) => !query || (s || '').toLowerCase().includes(query.toLowerCase());
  const items = [
    ...actions.filter((a) => filter(a.label)).map((a) => ({ kind: 'action', ...a, section: 'Acciones' })),
    ...projects
      .filter((p) => filter(p.name) || filter(p.cwd))
      .map((p) => ({ kind: 'project', project: p, section: 'Proyectos', label: p.name, hint: p.cwd })),
    ...sessions
      .filter((s) => {
        const p = projects.find((pp) => pp.id === s.projectId);
        return filter(s.displayName || p?.name || '');
      })
      .map((s) => {
        const p = projects.find((pp) => pp.id === s.projectId);
        return {
          kind: 'session',
          session: s,
          project: p,
          section: 'Sesiones',
          label: `${p?.name || '?'} · ${s.displayName || 'sesión'}`,
          hint: s.status
        };
      })
  ];

  const pick = (it) => {
    if (it.kind === 'project') onSelectProject(it.project);
    else if (it.kind === 'session') onSelectSession(it.session.id);
    else if (it.kind === 'action') onAction(it.id);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[idx]) pick(items[idx]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, idx, items]);

  if (!open) return null;
  let lastSection = null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[3000]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'tpFade 0.15s' }}
      />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[3001] rounded-xl overflow-hidden border"
        style={{
          top: '15%',
          width: 'min(600px, 90vw)',
          background: 'linear-gradient(180deg, var(--tp-card-hi), var(--tp-card-lo))',
          borderColor: 'var(--tp-border-08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          animation: 'tpPaletteIn 0.2s cubic-bezier(0.2,0.9,0.3,1)'
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-3 border-b"
          style={{ borderColor: 'var(--tp-border-06)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--tp-text-50)' }}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIdx(0); }}
            placeholder="Buscar proyectos, sesiones o acciones…"
            className="flex-1 bg-transparent border-none outline-none text-[15px]"
            style={{ color: 'var(--tp-text)' }}
          />
          <kbd
            className="text-[10.5px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--tp-border-06)', color: 'var(--tp-text-50)' }}
          >
            esc
          </kbd>
        </div>
        <div className="py-1.5" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--tp-text-35)' }}>
              Sin resultados
            </div>
          )}
          {items.map((it, i) => {
            const showSection = it.section !== lastSection;
            lastSection = it.section;
            const selected = i === idx;
            return (
              <React.Fragment key={i}>
                {showSection && (
                  <div
                    className="px-5 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] font-mono"
                    style={{ color: 'var(--tp-text-35)' }}
                  >
                    {it.section}
                  </div>
                )}
                <div
                  onClick={() => pick(it)}
                  onMouseEnter={() => setIdx(i)}
                  className="px-5 py-2 cursor-pointer flex items-center gap-3"
                  style={{
                    background: selected
                      ? 'color-mix(in oklab, var(--tp-accent) 12%, transparent)'
                      : 'transparent',
                    borderLeft: selected ? '2px solid var(--tp-accent)' : '2px solid transparent',
                    color: selected ? 'var(--tp-text)' : 'var(--tp-text-80)'
                  }}
                >
                  {it.kind === 'project' ? (
                    <Avatar project={it.project} size={22} />
                  ) : it.kind === 'session' ? (
                    <StatusDot status={it.session.status} size={10} />
                  ) : (
                    <span className="w-[22px] flex items-center justify-center" style={{ color: 'var(--tp-text-50)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                    </span>
                  )}
                  <span className="flex-1 text-[13px]">{it.label}</span>
                  <span className="text-[11px] font-mono truncate max-w-[240px]" style={{ color: 'var(--tp-text-40)' }}>
                    {it.hint}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Onboarding — 3-step modal para primera apertura ───
export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Un proyecto, una terminal',
      body: 'Cada carpeta es un proyecto. Abri el proyecto y estas en el terminal real — bash, PowerShell o el que configures. Agrega tus carpetas desde el sidebar.'
    },
    {
      title: 'La terminal es real',
      body: 'El centro es xterm puro. Todo lo que corras (claude, dev server, git, tests) funciona como en cualquier shell. Arriba, la info; abajo, el status.'
    },
    {
      title: 'Atajos clave',
      body: '⌘K abre la búsqueda global. ⌘B / ⌘J colapsan paneles. ⌘. activa modo enfoque (solo terminal). Ctrl+1..9 cambia de sesión.'
    }
  ];
  const s = steps[step];
  return (
    <>
      <div
        className="fixed inset-0 z-[4000]"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[4001] rounded-[14px] border"
        style={{
          width: 'min(460px, 90vw)',
          background: 'linear-gradient(180deg, var(--tp-card-hi), var(--tp-card-lo))',
          borderColor: 'var(--tp-border-08)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.6)',
          padding: 28,
          color: 'var(--tp-text)'
        }}
      >
        <div
          className="w-[54px] h-[54px] rounded-[13px] flex items-center justify-center mb-4"
          style={{
            background: 'color-mix(in oklab, var(--tp-accent) 14%, transparent)',
            color: 'var(--tp-accent-soft)'
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="m8 10 3 2-3 2M13 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div
          className="text-[11.5px] font-mono tracking-[0.1em] uppercase mb-1.5"
          style={{ color: 'var(--tp-text-40)' }}
        >
          {step + 1} / {steps.length}
        </div>
        <div
          className="text-[22px] font-semibold tracking-[-0.02em] mb-2.5"
          style={{ color: 'var(--tp-text-strong)' }}
        >
          {s.title}
        </div>
        <div className="text-sm leading-[1.55]" style={{ color: 'var(--tp-text-70)' }}>
          {s.body}
        </div>
        <div className="flex items-center gap-1.5 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded"
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                background: i === step ? 'var(--tp-accent-soft)' : 'var(--tp-border-15)',
                transition: 'all 0.2s'
              }}
            />
          ))}
          <div className="flex-1" />
          <button
            onClick={onDone}
            className="px-3 py-2 text-xs cursor-pointer"
            style={{ background: 'transparent', color: 'var(--tp-text-50)', border: 'none' }}
          >
            Saltar
          </button>
          <button
            onClick={() => (step === steps.length - 1 ? onDone() : setStep(step + 1))}
            className="px-4 py-2 rounded-[7px] text-xs font-semibold cursor-pointer border-none"
            style={{ background: 'var(--tp-accent)', color: 'var(--tp-text-strong)' }}
          >
            {step === steps.length - 1 ? 'Empezar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
}
