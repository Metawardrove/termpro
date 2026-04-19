import React, { useState, useMemo } from 'react';
import { Avatar } from './v2.jsx';
import { Signature } from '../brand.jsx';

const PROJECT_COLORS = ['#76b900', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#06b6d4', '#84cc16'];

// ─── Helpers ───
function chatTime(ts) {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toTimeString().slice(0, 5);
  }
  const yest = new Date(today.getTime() - 86400000);
  if (d.toDateString() === yest.toDateString()) return 'ayer';
  const dayDiff = Math.floor((today - d) / 86400000);
  if (dayDiff < 7) return ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()];
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function previewOf(session, lastEvent) {
  if (!session) return { text: 'Sin abrir', tone: 'dim' };
  if (session.needsPermission) {
    return { text: 'Esperando confirmación', tone: 'warn' };
  }
  if (session.status === 'error') {
    return { text: lastEvent?.label || 'Error en la sesión', tone: 'error' };
  }
  if (!lastEvent) {
    return { text: 'Sesión lista', tone: 'dim' };
  }
  const recent = Date.now() - (lastEvent.ts || 0) < 10000;
  if (lastEvent.type === 'error') return { text: lastEvent.label, tone: 'error' };
  if (lastEvent.type === 'claude') {
    if (recent) return { text: lastEvent.label + '…', tone: 'typing' };
    return { prefix: '⏺ ', text: lastEvent.label, tone: 'claude' };
  }
  if (lastEvent.type === 'notif') return { text: lastEvent.label, tone: 'warn' };
  // Ya no echoamos el comando del usuario — mostramos que algo está corriendo
  if (lastEvent.type === 'command') {
    if (recent) return { text: 'Ejecutando…', tone: 'typing' };
    return { text: 'En espera', tone: 'dim' };
  }
  return { text: lastEvent.label, tone: 'plain' };
}

// ─── Icons ───
const Icon = {
  plus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  pin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 17v5M9 3h6l1 2v6l2 2H7l2-2V5l1-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  folder: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M4 7h5l2-2h9v14H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  alert: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="m12 2 11 20H1L12 2Zm0 7v6m0 3v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" stroke="currentColor" strokeWidth="2"/></svg>,
  command: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M18 3a3 3 0 1 1-3 3V3h3ZM6 3a3 3 0 1 0 3 3V3H6Zm0 18a3 3 0 1 1 3-3v3H6Zm12 0a3 3 0 1 0-3-3v3h3ZM9 9h6v6H9V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  folderOpen: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3V7Zm0 3h18l-2 8a2 2 0 0 1-2 1H5a2 2 0 0 1-2-1l-2-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
};

function TypingDots({ color }) {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 3.5,
            height: 3.5,
            background: color,
            animation: 'tpTyping 1.1s infinite',
            animationDelay: `${delay}s`
          }}
        />
      ))}
    </span>
  );
}

// ─── Main Sidebar ───
export default function Sidebar({
  projects,
  sessions,
  activeId,
  sessionMeta = {},
  onOpenProject,
  onSelectSession,
  onCloseSession,
  onRenameSession,
  onOpenSettings,
  onAddProject,
  onDeleteProject,
  onTogglePin,
  onReorder,
  onOpenCmdK
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [dragId, setDragId] = useState(null);
  const [dropId, setDropId] = useState(null);
  const [addingProject, setAddingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', cwd: '', color: PROJECT_COLORS[0] });
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFolderDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const getPath = window.termpro?.getPathForFile;
    console.log('[drop] getPathForFile exists?', typeof getPath);
    const resolvePath = (file) => {
      if (!file) return null;
      if (getPath) {
        try {
          const p = getPath(file);
          console.log('[drop] getPath result:', p, 'for file:', file?.name);
          if (p) return p;
        } catch (err) {
          console.warn('[drop] getPath error', err);
        }
      }
      const fp = file.path || null;
      console.log('[drop] file.path fallback:', fp);
      return fp;
    };

    const items = Array.from(e.dataTransfer?.items || []);
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      const file = item.getAsFile?.();
      const folderPath = resolvePath(file);
      const folderName =
        (entry?.name) ||
        (folderPath || '').split(/[\\/]/).filter(Boolean).pop() ||
        (file?.name) ||
        'Proyecto';
      if (folderPath && (entry?.isDirectory || !file?.type)) {
        onAddProject?.({
          name: folderName,
          cwd: folderPath,
          color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
        });
        return;
      }
    }
    // Fallback: primer archivo de files
    const files = Array.from(e.dataTransfer?.files || []);
    for (const f of files) {
      const p = resolvePath(f);
      if (p) {
        const name = (p || '').split(/[\\/]/).filter(Boolean).pop() || f.name || 'Proyecto';
        onAddProject?.({
          name,
          cwd: p,
          color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
        });
        return;
      }
    }
    console.warn('[sidebar] drop sin ruta resoluble', e.dataTransfer?.items, e.dataTransfer?.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const sessionFor = (pid) => sessions.find((s) => s.projectId === pid);
  const lastEventFor = (pid) => {
    const s = sessionFor(pid);
    if (!s) return null;
    const events = sessionMeta[s.id]?.events || [];
    if (events.length === 0) return null;
    // Preferimos el ultimo mensaje de Claude/notif/error sobre el comando del usuario
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (ev.type === 'claude' || ev.type === 'notif' || ev.type === 'error') {
        return ev;
      }
    }
    // Si no hay respuesta de Claude todavia, muestra el ultimo evento (puede ser command)
    return events[events.length - 1];
  };

  const counts = useMemo(() => ({
    todos: projects.length,
    activos: projects.filter((p) => {
      const s = sessionFor(p.id);
      return s && s.status === 'running';
    }).length,
    atencion: projects.filter((p) => {
      const s = sessionFor(p.id);
      return s && (s.status === 'error' || (s.unread || 0) > 0);
    }).length
  }), [projects, sessions]);

  const matchQuery = (p) => !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.cwd || '').toLowerCase().includes(query.toLowerCase());
  const matchFilter = (p) => {
    if (filter === 'todos') return true;
    const s = sessionFor(p.id);
    if (!s) return false;
    if (filter === 'activos') return s.status === 'running';
    if (filter === 'atencion') return s.status === 'error' || (s.unread || 0) > 0;
    return true;
  };

  const sortByRecent = (a, b) => {
    const ea = lastEventFor(a.id);
    const eb = lastEventFor(b.id);
    const ta = ea?.ts || sessionFor(a.id)?.createdAt || 0;
    const tb = eb?.ts || sessionFor(b.id)?.createdAt || 0;
    return tb - ta;
  };

  const filtered = projects.filter((p) => matchQuery(p) && matchFilter(p));
  const pinned = filtered.filter((p) => p.pinned).sort(sortByRecent);
  const rest = filtered.filter((p) => !p.pinned).sort(sortByRecent);

  const resetForm = () => {
    setAddingProject(false);
    setProjectForm({ name: '', cwd: '', color: PROJECT_COLORS[0] });
  };

  const pickFolder = async () => {
    const res = await window.termpro?.pickFolder?.();
    if (!res?.ok) return;
    const folderName = res.path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || '';
    setProjectForm((f) => ({ ...f, cwd: res.path, name: f.name || folderName }));
  };

  const submitForm = (e) => {
    e?.preventDefault();
    if (!projectForm.name.trim() || !projectForm.cwd.trim()) return;
    onAddProject?.(projectForm);
    resetForm();
  };

  return (
    <aside
      className="w-full flex flex-col h-full relative"
      style={{ background: 'var(--tp-sidebar)', color: 'var(--tp-text)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleFolderDrop}
    >
      {isDragOver && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{
            background: 'color-mix(in oklab, var(--tp-accent) 18%, transparent)',
            border: '2.5px dashed var(--tp-accent-soft)',
            borderRadius: 0
          }}
        >
          <div
            className="text-center px-6 py-4 rounded-xl"
            style={{
              background: 'var(--tp-card)',
              border: '1px solid var(--tp-accent-soft)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
            }}
          >
            <div className="mb-1.5 flex justify-center" style={{ color: 'var(--tp-accent-soft)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div
              className="text-[14px] font-semibold"
              style={{ color: 'var(--tp-text-strong)' }}
            >
              Suelta la carpeta
            </div>
            <div
              className="text-[11.5px] mt-0.5"
              style={{ color: 'var(--tp-text-60)' }}
            >
              para agregarla como proyecto
            </div>
          </div>
        </div>
      )}
      <header className="px-4 pt-[18px] pb-3">
        <div className="mb-3.5">
          <div
            className="text-[11px] font-semibold tracking-[0.14em] uppercase font-mono"
            style={{ color: 'var(--tp-text-40)' }}
          >
            TERMPRO
          </div>
          <div
            className="text-[19px] font-semibold tracking-[-0.02em] mt-0.5"
            style={{ color: 'var(--tp-text-strong)' }}
          >
            Proyectos
          </div>
        </div>

        <div
          className="flex items-center gap-2 py-[7px] px-[11px] rounded-[18px] border"
          style={{
            background: 'var(--tp-hover)',
            borderColor: 'var(--tp-border-05)'
          }}
        >
          <Icon.search width="13" height="13" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proyectos…"
            className="flex-1 bg-transparent border-none outline-none text-[12.5px]"
            style={{ color: 'var(--tp-text)' }}
          />
          <kbd
            className="text-[10px] px-1.5 py-px rounded font-mono"
            style={{ background: 'var(--tp-border-06)', color: 'var(--tp-text-50)' }}
          >
            ⌘K
          </kbd>
        </div>

        <div className="flex gap-0.5 mt-3 text-[11.5px]">
          {[['todos', 'Todos'], ['activos', 'Activos'], ['atencion', 'Atención']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="px-2.5 py-1 rounded-[14px] border-none cursor-pointer inline-flex items-center gap-1.5 font-medium"
              style={{
                background: filter === k ? 'color-mix(in oklab, var(--tp-accent) 14%, transparent)' : 'transparent',
                color: filter === k ? 'var(--tp-accent-soft)' : 'var(--tp-text-50)'
              }}
            >
              {l}
              <span className="text-[10px] font-mono" style={{ color: 'var(--tp-text-35)' }}>
                {counts[k]}
              </span>
            </button>
          ))}
        </div>

        {!addingProject && (
          <button
            onClick={() => setAddingProject(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] cursor-pointer border font-semibold text-[13px] transition"
            style={{
              background: 'color-mix(in oklab, var(--tp-accent) 16%, transparent)',
              color: 'var(--tp-accent-soft)',
              borderColor: 'color-mix(in oklab, var(--tp-accent) 30%, transparent)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--tp-accent) 28%, transparent)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'color-mix(in oklab, var(--tp-accent) 16%, transparent)')}
          >
            <Icon.plus width="16" height="16" />
            Agregar proyecto
          </button>
        )}
        {!addingProject && projects.length === 0 && (
          <p
            className="mt-2 text-[11px] text-center leading-relaxed"
            style={{ color: 'var(--tp-text-45)' }}
          >
            o arrastrá una carpeta aquí
          </p>
        )}
      </header>

      {addingProject && (
        <form
          onSubmit={submitForm}
          className="mx-3 mb-2 p-3 rounded-lg border space-y-2"
          style={{
            background: 'var(--tp-hover)',
            borderColor: 'var(--tp-border-08)'
          }}
        >
          <input
            autoFocus
            value={projectForm.name}
            onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nombre (ej: Mi Proyecto)"
            className="w-full border rounded px-2 py-1.5 text-xs outline-none"
            style={{
              background: 'var(--tp-sidebar-rail)',
              color: 'var(--tp-text)',
              borderColor: 'var(--tp-border-08)'
            }}
          />
          <div className="flex gap-1">
            <input
              value={projectForm.cwd}
              onChange={(e) => setProjectForm((f) => ({ ...f, cwd: e.target.value }))}
              placeholder="C:\\ruta\\a\\carpeta"
              className="flex-1 min-w-0 border rounded px-2 py-1.5 text-xs font-mono outline-none"
              style={{
                background: 'var(--tp-sidebar-rail)',
                color: 'var(--tp-text)',
                borderColor: 'var(--tp-border-08)'
              }}
            />
            <button
              type="button"
              onClick={pickFolder}
              className="px-2 py-1.5 rounded cursor-pointer"
              style={{ background: 'var(--tp-border-06)', color: 'var(--tp-text)' }}
              title="Seleccionar carpeta"
            >
              <Icon.folderOpen width="12" height="12" />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setProjectForm((f) => ({ ...f, color: c }))}
                className="w-5 h-5 rounded-full border-2 transition"
                style={{
                  background: c,
                  borderColor: projectForm.color === c ? 'var(--tp-text)' : 'transparent'
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!projectForm.name.trim() || !projectForm.cwd.trim()}
              className="flex-1 px-2 py-1.5 rounded text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--tp-accent)',
                color: 'var(--tp-text-strong)',
                border: 'none'
              }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-2 py-1.5 rounded text-xs cursor-pointer border-none"
              style={{ background: 'var(--tp-border-06)', color: 'var(--tp-text-70)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-1.5 pt-1 pb-3.5">
        {pinned.length > 0 && <SectionLabel label="Fijados" Icon={Icon.pin} />}
        {pinned.map((p) => (
          <ChatRow
            key={p.id}
            project={p}
            session={sessionFor(p.id)}
            lastEvent={lastEventFor(p.id)}
            active={sessionFor(p.id)?.id === activeId}
            onClick={() => {
              const s = sessionFor(p.id);
              if (s) onSelectSession(s.id);
              else onOpenProject(p);
            }}
            onTogglePin={() => onTogglePin?.(p.id)}
            onDelete={() => onDeleteProject?.(p.id)}
            onCloseSession={() => { const s = sessionFor(p.id); if (s) onCloseSession(s.id); }}
            dragging={dragId === p.id}
            dropBefore={dropId === p.id && dragId !== p.id}
            onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => { e.preventDefault(); setDropId(p.id); }}
            onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== p.id) onReorder?.(dragId, p.id); setDragId(null); setDropId(null); }}
            onDragEnd={() => { setDragId(null); setDropId(null); }}
          />
        ))}
        {pinned.length > 0 && rest.length > 0 && (
          <div className="mx-3.5 my-2.5 h-px" style={{ background: 'var(--tp-border-05)' }} />
        )}
        {rest.length > 0 && <SectionLabel label="Proyectos" />}
        {rest.map((p) => (
          <ChatRow
            key={p.id}
            project={p}
            session={sessionFor(p.id)}
            lastEvent={lastEventFor(p.id)}
            active={sessionFor(p.id)?.id === activeId}
            onClick={() => {
              const s = sessionFor(p.id);
              if (s) onSelectSession(s.id);
              else onOpenProject(p);
            }}
            onTogglePin={() => onTogglePin?.(p.id)}
            onDelete={() => onDeleteProject?.(p.id)}
            onCloseSession={() => { const s = sessionFor(p.id); if (s) onCloseSession(s.id); }}
            dragging={dragId === p.id}
            dropBefore={dropId === p.id && dragId !== p.id}
            onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => { e.preventDefault(); setDropId(p.id); }}
            onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== p.id) onReorder?.(dragId, p.id); setDragId(null); setDropId(null); }}
            onDragEnd={() => { setDragId(null); setDropId(null); }}
          />
        ))}
        {filtered.length === 0 && (
          <p
            className="px-4 py-3 text-[11px] leading-relaxed text-center"
            style={{ color: 'var(--tp-text-40)' }}
          >
            {query || filter !== 'todos'
              ? 'Sin resultados para este filtro'
              : 'Sin proyectos. Click en "+" para agregar.'}
          </p>
        )}
      </div>

      <footer
        className="border-t"
        style={{
          background: 'var(--tp-hover)',
          borderColor: 'var(--tp-border-05)'
        }}
      >
        <div className="px-3.5 py-2 flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            title="Ajustes (Ctrl+,)"
            className="w-7 h-7 rounded-md border-none cursor-pointer flex items-center justify-center"
            style={{ background: 'transparent', color: 'var(--tp-text-55)' }}
          >
            <Icon.settings width="14" height="14" />
          </button>
          <button
            onClick={onOpenCmdK}
            title="Command Palette (⌘K)"
            className="w-7 h-7 rounded-md border-none cursor-pointer flex items-center justify-center"
            style={{ background: 'transparent', color: 'var(--tp-text-55)' }}
          >
            <Icon.command width="14" height="14" />
          </button>
          <div className="flex-1" />
          <span className="text-[10.5px] font-mono" style={{ color: 'var(--tp-text-35)' }}>
            v0.1.0
          </span>
        </div>
        <div
          className="px-3.5 pb-2.5 pt-0.5 border-t flex items-center justify-center"
          style={{ borderColor: 'var(--tp-border-04)' }}
        >
          <Signature size="xs" />
        </div>
      </footer>
    </aside>
  );
}

function SectionLabel({ label, Icon: IconComp }) {
  return (
    <div
      className="flex items-center gap-1.5 px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] font-mono"
      style={{ color: 'var(--tp-text-35)' }}
    >
      {IconComp && <IconComp width="10" height="10" />}
      {label}
    </div>
  );
}

function ChatRow({
  project,
  session,
  lastEvent,
  active,
  onClick,
  onTogglePin,
  onDelete,
  onCloseSession,
  dragging,
  dropBefore,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [hover, setHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const status = session?.status || 'idle';
  const unread = session?.unread || 0;
  const running = status === 'running';
  const err = status === 'error';
  const preview = previewOf(session, lastEvent);
  const lastTs = lastEvent?.ts || session?.createdAt;

  const toneColors = {
    cmd: 'var(--tp-accent-soft)',
    claude: 'var(--tp-accent-soft)',
    error: '#ef5a4b',
    warn: '#e5a547',
    typing: 'var(--tp-accent-soft)',
    dim: 'var(--tp-text-40)',
    plain: 'var(--tp-text-60)'
  };
  const previewColor = toneColors[preview.tone] || toneColors.plain;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowMenu(false); }}
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      className="relative rounded-[10px] cursor-pointer flex items-center gap-3 my-px mx-0"
      style={{
        padding: '11px 14px',
        background: active
          ? 'color-mix(in oklab, var(--tp-accent) 12%, transparent)'
          : hover
          ? 'var(--tp-hover)'
          : 'transparent',
        opacity: dragging ? 0.4 : 1
      }}
    >
      {active && (
        <div
          className="absolute left-0 rounded-[2px]"
          style={{
            top: 12,
            bottom: 12,
            width: 2.5,
            background: project.color
          }}
        />
      )}
      {dropBefore && (
        <div
          className="absolute left-1.5 right-1.5 rounded"
          style={{ top: -2, height: 2, background: 'var(--tp-accent)' }}
        />
      )}

      <div className="relative flex-shrink-0">
        <Avatar project={project} size={44} />
        {running && (
          <span
            className="absolute rounded-full"
            style={{
              bottom: -1,
              right: -1,
              width: 12,
              height: 12,
              background: '#7dd3a0',
              border: '2.5px solid var(--tp-sidebar)',
              animation: 'tpPulse 1.8s ease-in-out infinite'
            }}
          />
        )}
        {err && (
          <span
            className="absolute rounded-full"
            style={{
              bottom: -1,
              right: -1,
              width: 12,
              height: 12,
              background: '#ef5a4b',
              border: '2.5px solid var(--tp-sidebar)'
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span
            className="text-[14px] font-semibold tracking-[-0.01em] truncate flex-1 min-w-0"
            style={{ color: active ? 'var(--tp-text-strong)' : 'var(--tp-text)' }}
          >
            {session?.displayName || project.name}
          </span>
          {project.pinned && (
            <span style={{ color: 'var(--tp-text-35)', transform: 'translateY(1px)' }}>
              <Icon.pin width="10" height="10" />
            </span>
          )}
          <span
            className="text-[10.5px] font-mono whitespace-nowrap"
            style={{
              color: unread > 0 ? (err ? '#ef8478' : 'var(--tp-accent-soft)') : 'var(--tp-text-40)',
              fontWeight: unread > 0 ? 600 : 400
            }}
          >
            {chatTime(lastTs)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex-1 min-w-0 text-[12.5px] truncate flex items-center"
            style={{
              color: previewColor,
              fontFamily: preview.tone === 'cmd' || preview.tone === 'error' ? 'JetBrains Mono, monospace' : 'inherit'
            }}
          >
            {preview.tone === 'cmd' && (
              <span className="mr-0.5" style={{ color: 'var(--tp-text-30)' }}>✓✓</span>
            )}
            {preview.prefix && (
              <span style={{ opacity: 0.6 }}>{preview.prefix}</span>
            )}
            <span className="truncate">{preview.text}</span>
            {preview.tone === 'typing' && <TypingDots color={previewColor} />}
          </div>
          {unread > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-[10px] text-[11px] font-bold flex-shrink-0"
              style={{
                minWidth: 20,
                height: 20,
                padding: '0 7px',
                background: err ? '#ef5a4b' : '#7dd3a0',
                color: err ? '#fff' : '#0a2918',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {unread}
            </span>
          )}
        </div>
      </div>

      {hover && !showMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          title={project.pinned ? 'Desfijar' : 'Fijar'}
          className="absolute top-2 right-2 w-6 h-6 rounded cursor-pointer flex items-center justify-center"
          style={{ background: 'var(--tp-border-06)', color: 'var(--tp-text-55)' }}
        >
          <Icon.pin width="11" height="11" />
        </button>
      )}

      {showMenu && (
        <div
          className="absolute right-2 top-8 z-10 rounded-md border shadow-lg py-1 min-w-[160px]"
          style={{
            background: 'var(--tp-card)',
            borderColor: 'var(--tp-border-08)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onTogglePin?.(); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-[12px] text-left flex items-center gap-2 cursor-pointer"
            style={{ background: 'transparent', color: 'var(--tp-text)', border: 'none' }}
          >
            <Icon.pin width="12" height="12" />
            {project.pinned ? 'Desfijar' : 'Fijar arriba'}
          </button>
          {session && (
            <button
              onClick={() => { onCloseSession?.(); setShowMenu(false); }}
              className="w-full px-3 py-1.5 text-[12px] text-left flex items-center gap-2 cursor-pointer"
              style={{ background: 'transparent', color: 'var(--tp-text)', border: 'none' }}
            >
              <Icon.x width="12" height="12" />
              Cerrar sesión
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Eliminar "${project.name}" del sidebar? (No borra archivos)`)) {
                onDelete?.();
              }
              setShowMenu(false);
            }}
            className="w-full px-3 py-1.5 text-[12px] text-left flex items-center gap-2 cursor-pointer"
            style={{ background: 'transparent', color: '#ef5a4b', border: 'none' }}
          >
            <Icon.trash width="12" height="12" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
