import React from 'react';

const STATUS_ICON = {
  pending: '⏳',
  waiting: '🔒',
  running: '🟡',
  done: '✅',
  failed: '❌'
};

const STATUS_LABEL = {
  pending: 'Pendiente',
  waiting: 'Esperando dependencias',
  running: 'Corriendo',
  done: 'Finalizada',
  failed: 'Fallo'
};

export default function ProjectControl({ project, activeSessionId, onSelectSubtask, onFinalizeSubtask, onGenerateReport }) {
  if (!project) return null;

  const done = project.subtasks.filter((s) => s.status === 'done').length;
  const total = project.subtasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const activeSubtask = project.subtasks.find((s) => s.sessionId === activeSessionId);
  const allDone = done === total;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 py-3 border-b border-bg-600">
        <div className="flex items-center gap-2">
          <span>🎯</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-100 truncate">{project.name}</div>
            <div className="text-[10px] text-gray-500 truncate">{project.cwd}</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span>{done}/{total} finalizadas</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-1.5 bg-bg-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-terra transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {project.subtasks.map((st) => {
          const isActive = st.sessionId === activeSessionId;
          const canStart = st.status === 'waiting' && st.dependsOn.every((depId) => {
            const dep = project.subtasks.find((d) => d.id === depId);
            return dep?.status === 'done';
          });
          return (
            <button
              key={st.id}
              onClick={() => st.sessionId && onSelectSubtask?.(st.sessionId)}
              disabled={!st.sessionId}
              className={`w-full text-left p-2.5 rounded-lg border transition ${
                isActive
                  ? 'bg-accent-blue/15 border-accent-blue/60'
                  : 'bg-bg-900 border-bg-600 hover:border-bg-500'
              } ${!st.sessionId ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{STATUS_ICON[st.status] || '⏳'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-100 truncate">{st.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{st.desc}</div>
                  <div className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider">
                    {STATUS_LABEL[st.status]}
                    {canStart && ' · lista para arrancar'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <footer className="px-4 py-3 border-t border-bg-600 space-y-2">
        {activeSubtask && activeSubtask.status === 'running' && (
          <button
            onClick={() => onFinalizeSubtask(project.id, activeSubtask.id)}
            className="w-full px-4 py-2.5 rounded bg-accent-terra hover:bg-accent-terra/90 text-black text-sm font-bold shadow-lg"
          >
            ✅ Finalizar "{activeSubtask.title}"
          </button>
        )}
        {allDone && (
          <button
            onClick={() => onGenerateReport(project.id)}
            className="w-full px-4 py-2 rounded bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold"
          >
            📋 Generar reporte final
          </button>
        )}
        {!activeSubtask && !allDone && (
          <p className="text-[11px] text-gray-500 text-center">Seleccioná una subtarea para gestionarla</p>
        )}
      </footer>
    </div>
  );
}
