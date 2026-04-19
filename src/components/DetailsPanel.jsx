import React, { useEffect, useState } from 'react';

const TYPE_CONF = {
  command: { color: '#8ab4c9', label: 'Comando', mono: true },
  error: { color: '#ef5a4b', label: 'Error', mono: true },
  status: { color: '#7dd3a0', label: 'Estado' },
  claude: { color: 'var(--tp-accent-soft)', label: 'Claude' },
  notif: { color: '#e5a547', label: 'Permiso' },
  file: { color: 'var(--tp-text-65)', label: 'Archivo', mono: true }
};

const GLYPH = {
  command: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><polyline points="4 17 10 11 4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  error: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  status: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  claude: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/></svg>,
  notif: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="m12 2 11 20H1L12 2Zm0 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  file: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
};

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

export default function DetailsPanel({ session, meta }) {
  const [filter, setFilter] = useState('all');
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs" style={{ color: 'var(--tp-text-40)' }}>
          Sin sesión activa. Abre un proyecto del sidebar.
        </p>
      </div>
    );
  }

  const commands = meta?.commands ?? [];
  const events = meta?.events ?? [];
  const startedAt = meta?.startedAt ?? session.createdAt;

  const counts = events.reduce((a, e) => {
    a[e.type] = (a[e.type] || 0) + 1;
    return a;
  }, {});
  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 pt-[18px] pb-2.5">
        <div
          className="text-[11px] font-semibold tracking-[0.14em] uppercase font-mono"
          style={{ color: 'var(--tp-text-40)' }}
        >
          ACTIVIDAD
        </div>
        <div
          className="text-[19px] font-semibold mt-0.5 tracking-[-0.02em] truncate"
          style={{ color: 'var(--tp-text-strong)' }}
          title={session.project.name}
        >
          {session.displayName || session.project.name}
        </div>
        <div
          className="text-[11.5px] mt-0.5 font-mono"
          style={{ color: 'var(--tp-text-50)' }}
        >
          sesión iniciada hace {ago(startedAt)}
        </div>
      </header>

      <div
        className="mx-3.5 mb-3 p-3 rounded-[10px] border grid grid-cols-2 gap-2.5"
        style={{
          background: 'var(--tp-hover)',
          borderColor: 'var(--tp-border-05)'
        }}
      >
        <Stat label="Comandos" value={commands.length} />
        <Stat
          label="Errores"
          value={counts.error || 0}
          tone={counts.error ? 'error' : 'dim'}
        />
        <Stat label="Claude" value={counts.claude || 0} />
        <Stat label="Eventos" value={events.length} />
      </div>

      <div className="px-3 mb-1.5 flex gap-[3px] flex-wrap">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="Todo"
          count={events.length}
        />
        {Object.keys(counts).map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            label={TYPE_CONF[t]?.label || t}
            count={counts[t]}
            color={TYPE_CONF[t]?.color}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1.5">
        {filtered.length === 0 && (
          <div
            className="py-7 text-center text-xs"
            style={{ color: 'var(--tp-text-30)' }}
          >
            Sin eventos {filter !== 'all' ? 'de este tipo' : 'todavía'}
          </div>
        )}
        {[...filtered]
          .reverse()
          .slice(0, 80)
          .map((ev, i, arr) => {
            const conf = TYPE_CONF[ev.type] || TYPE_CONF.command;
            const IconComp = GLYPH[ev.type] || GLYPH.command;
            const isLast = i === arr.length - 1;
            return (
              <div
                key={i}
                className="flex gap-2.5 relative"
                style={{ paddingBottom: isLast ? 0 : 12 }}
              >
                <div className="relative w-[22px] flex-shrink-0 flex justify-center">
                  {!isLast && (
                    <div
                      className="absolute left-1/2 w-px"
                      style={{
                        top: 22,
                        bottom: -4,
                        background: 'var(--tp-border-06)'
                      }}
                    />
                  )}
                  <div
                    className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 z-[1]"
                    style={{
                      background: `${conf.color}1f`,
                      color: conf.color
                    }}
                  >
                    <IconComp width="12" height="12" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-px">
                  <div
                    className="text-xs break-words"
                    style={{
                      color: 'var(--tp-text)',
                      fontFamily: conf.mono ? 'JetBrains Mono, monospace' : 'inherit'
                    }}
                  >
                    {ev.label}
                  </div>
                  <div
                    className="text-[10.5px] mt-0.5 font-mono"
                    style={{ color: 'var(--tp-text-40)' }}
                  >
                    hace {ago(ev.ts)}
                  </div>
                </div>
              </div>
            );
          })}
        {filtered.length > 80 && (
          <p
            className="pt-3 text-[10px] text-center font-mono"
            style={{ color: 'var(--tp-text-35)' }}
          >
            + {filtered.length - 80} eventos más
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'error'
    ? '#ef5a4b'
    : tone === 'dim'
    ? 'var(--tp-text-40)'
    : 'var(--tp-text)';
  return (
    <div>
      <div
        className="text-[18px] font-semibold font-mono tracking-[-0.02em]"
        style={{ color }}
      >
        {value}
      </div>
      <div
        className="text-[10.5px] mt-px uppercase tracking-[0.08em] font-mono"
        style={{ color: 'var(--tp-text-40)' }}
      >
        {label}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, count, color }) {
  const bg = active
    ? color
      ? `${color}22`
      : 'color-mix(in oklab, var(--tp-accent) 18%, transparent)'
    : 'var(--tp-hover)';
  const fg = active
    ? color || 'var(--tp-accent-soft)'
    : 'var(--tp-text-55)';
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer inline-flex items-center gap-1.5 border-none"
      style={{ background: bg, color: fg }}
    >
      {label}
      <span
        className="text-[9.5px] font-mono"
        style={{ opacity: 0.7 }}
      >
        {count}
      </span>
    </button>
  );
}
