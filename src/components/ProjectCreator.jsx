import React, { useState } from 'react';

export default function ProjectCreator({ projects, onCancel, onLaunch }) {
  const [step, setStep] = useState('form'); // form | analyzing | interview | confirm | error
  const [description, setDescription] = useState('');
  const [baseProjectId, setBaseProjectId] = useState(projects[0]?.id || '');
  const [customCwd, setCustomCwd] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [contextInfo, setContextInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [rawAnswer, setRawAnswer] = useState('');
  const [conversation, setConversation] = useState([]); // [{round, questions, answer}]
  const [error, setError] = useState('');
  const [raw, setRaw] = useState('');
  const [projectName, setProjectName] = useState('');
  const [draggingIdx, setDraggingIdx] = useState(null);

  const baseProject = projects.find((p) => p.id === baseProjectId);
  const effectiveCwd = baseProjectId === '__custom' ? customCwd : baseProject?.cwd;

  const sendToDecomposer = async (newAnswer) => {
    setStep('analyzing');
    setError('');
    // Si hay respuesta nueva, la agregamos a la conversacion
    const nextConversation = newAnswer
      ? [...conversation, { round: conversation.length + 1, questions, answer: newAnswer }]
      : conversation;
    try {
      const res = await window.termpro.decomposeProject(description, effectiveCwd, nextConversation);
      if (res?.error) {
        setError(res.error);
        setRaw(res.raw || '');
        setStep('error');
        return;
      }
      if (res.ready === false && res.questions?.length) {
        setQuestions(res.questions);
        setRawAnswer('');
        setConversation(nextConversation);
        setStep('interview');
        return;
      }
      if (res.ready === true) {
        setContextInfo(res.context || {});
        // Primero creamos los subtasks con IDs
        const base = Date.now();
        const withIds = res.subtasks.map((s, i) => ({
          id: `st-${base}-${i}`,
          title: s.title || `Subtarea ${i + 1}`,
          desc: s.desc || '',
          cwd: s.cwd || effectiveCwd,
          __depTitles: Array.isArray(s.dependsOn) ? s.dependsOn : [],
          deliverable: s.deliverable || ''
        }));
        // Ahora resolvemos titulos → IDs
        const byTitle = Object.fromEntries(withIds.map((s) => [s.title.toLowerCase().trim(), s.id]));
        const resolved = withIds.map(({ __depTitles, ...s }) => ({
          ...s,
          dependsOn: __depTitles
            .map((t) => byTitle[String(t).toLowerCase().trim()])
            .filter(Boolean)
        }));
        setSubtasks(resolved);
        if (!projectName) {
          const firstLine = description.split('\n')[0].slice(0, 40);
          setProjectName(firstLine || 'Proyecto sin nombre');
        }
        setStep('confirm');
        return;
      }
      setError('Respuesta inesperada del analizador');
      setStep('error');
    } catch (e) {
      setError(e.message);
      setStep('error');
    }
  };

  const updateSubtask = (idx, patch) => {
    setSubtasks((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const removeSubtask = (idx) => setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  const addSubtask = () => setSubtasks((prev) => [
    ...prev,
    { id: `st-${Date.now()}`, title: 'Nueva subtarea', desc: '', cwd: effectiveCwd, dependsOn: [], deliverable: '' }
  ]);
  const onDragStart = (idx) => setDraggingIdx(idx);
  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    setSubtasks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggingIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDraggingIdx(idx);
  };
  const onDragEnd = () => setDraggingIdx(null);

  const toggleDep = (subtaskIdx, targetIdx) => {
    const targetId = subtasks[targetIdx].id;
    updateSubtask(subtaskIdx, {
      dependsOn: subtasks[subtaskIdx].dependsOn.includes(targetId)
        ? subtasks[subtaskIdx].dependsOn.filter((d) => d !== targetId)
        : [...subtasks[subtaskIdx].dependsOn, targetId]
    });
  };

  const [conflicts, setConflicts] = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);

  const checkConflicts = () => {
    const issues = [];
    // Nota: 2+ subtareas en el mismo cwd es normal (trabajan en mismo modulo, archivos distintos).
    // Solo flageamos cwds anidados (parent/child) que son mas sospechosos.
    for (let i = 0; i < subtasks.length; i++) {
      for (let j = i + 1; j < subtasks.length; j++) {
        const a = (subtasks[i].cwd || '').replace(/[\\/]+$/, '').toLowerCase();
        const b = (subtasks[j].cwd || '').replace(/[\\/]+$/, '').toLowerCase();
        if (!a || !b || a === b) continue;
        if (a.startsWith(b + '/') || a.startsWith(b + '\\') || b.startsWith(a + '/') || b.startsWith(a + '\\')) {
          issues.push({ type: 'nested-cwd', severity: 'warn', msg: `"${subtasks[i].title}" trabaja dentro de "${subtasks[j].title}" — verifica que no toquen mismos archivos` });
        }
      }
    }
    // 2. Ciclos de dependencia
    const idToTitle = Object.fromEntries(subtasks.map((s) => [s.id, s.title]));
    const visited = {};
    const stack = {};
    const hasCycle = (id) => {
      if (stack[id]) return true;
      if (visited[id]) return false;
      visited[id] = true; stack[id] = true;
      const st = subtasks.find((s) => s.id === id);
      if (st) for (const dep of st.dependsOn) if (hasCycle(dep)) return true;
      stack[id] = false;
      return false;
    };
    for (const s of subtasks) {
      if (hasCycle(s.id)) {
        issues.push({ type: 'cycle', msg: `Ciclo de dependencia detectado en "${s.title}"` });
        break;
      }
    }
    // 3. Dependencias a IDs que no existen
    const allIds = new Set(subtasks.map((s) => s.id));
    for (const s of subtasks) {
      for (const dep of s.dependsOn) {
        if (!allIds.has(dep)) {
          issues.push({ type: 'missing-dep', msg: `"${s.title}" depende de un subtarea que no existe` });
        }
      }
    }
    // 4. Sin subtarea independiente (nadie puede arrancar)
    if (subtasks.length > 0 && !subtasks.some((s) => s.dependsOn.length === 0)) {
      issues.push({ type: 'no-root', msg: 'Ninguna subtarea puede arrancar (todas tienen dependencias)' });
    }
    return issues;
  };

  const tryLaunch = () => {
    if (subtasks.length === 0) return;
    const issues = checkConflicts();
    if (issues.length > 0) {
      setConflicts(issues);
      setShowConflicts(true);
      return;
    }
    doLaunch();
  };

  const doLaunch = () => {
    setShowConflicts(false);
    onLaunch({
      name: projectName || 'Proyecto sin nombre',
      description,
      cwd: effectiveCwd,
      context: contextInfo,
      subtasks
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <header className="px-4 py-3 border-b border-bg-600 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-accent-terra font-semibold">
            {step === 'form' && 'Nuevo proyecto · 1/3'}
            {step === 'analyzing' && 'Analizando...'}
            {step === 'interview' && 'Nuevo proyecto · 2/3'}
            {step === 'confirm' && 'Nuevo proyecto · 3/3'}
            {step === 'error' && 'Error'}
          </div>
          <div className="text-sm text-gray-200">
            {step === 'form' && 'Describe el proyecto'}
            {step === 'analyzing' && 'Claude esta analizando'}
            {step === 'interview' && 'Responde las preguntas'}
            {step === 'confirm' && 'Revisá la decomposicion'}
            {step === 'error' && 'No pudimos analizar'}
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-100 text-sm">✕</button>
      </header>

      {step === 'form' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Describe el proyecto</label>
            <textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={'Ej.\nCrear sistema de reportes con:\n- reporte publicitario\n- reporte parcial\n- reporte despacho\n- inventario en tiempo real'}
              rows={10}
              className="w-full bg-bg-900 border border-bg-600 rounded-lg px-3 py-2 text-xs text-gray-100 font-mono resize-none focus:border-accent-terra/60 outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">Claude preguntara lo que falte antes de decomponer</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nombre (opcional)</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Se infiere si lo dejas vacio"
              className="w-full bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-accent-terra/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Carpeta base</label>
            <select
              value={baseProjectId}
              onChange={(e) => setBaseProjectId(e.target.value)}
              className="w-full bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-sm text-gray-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.cwd}</option>
              ))}
              <option value="__custom">Custom...</option>
            </select>
            {baseProjectId === '__custom' && (
              <input
                value={customCwd}
                onChange={(e) => setCustomCwd(e.target.value)}
                placeholder="C:\\ruta\\completa"
                className="w-full mt-2 bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-xs font-mono text-gray-100 outline-none"
              />
            )}
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-[3px] border-accent-terra border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-sm text-gray-200 font-medium">Claude esta analizando...</div>
            <div className="text-[11px] text-gray-500 mt-1">10-60 segundos</div>
          </div>
        </div>
      )}

      {step === 'interview' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-accent-blue/10 border border-accent-blue/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🤔</span>
              <div className="text-[10px] uppercase tracking-wider text-accent-blue font-semibold">
                Claude pregunta {conversation.length > 0 && `· Ronda ${conversation.length + 1}`}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Respondé en prosa, todas en el mismo campo. Si queda algo poco claro despues, Claude va a preguntar de nuevo.
            </p>
          </div>

          <div className="bg-bg-900 border border-bg-600 rounded-lg p-3 space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <span className="text-accent-terra font-bold shrink-0">{i + 1}.</span>
                <span className="text-gray-200 leading-relaxed">{q}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tu respuesta</label>
            <textarea
              autoFocus
              value={rawAnswer}
              onChange={(e) => setRawAnswer(e.target.value)}
              placeholder="Escribi todas tus respuestas en prosa. No necesitas numerar ni separar por campos."
              rows={8}
              className="w-full bg-bg-900 border border-bg-600 rounded-lg px-3 py-2 text-xs text-gray-100 resize-none outline-none focus:border-accent-terra/60 font-mono"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Ej: "Stack Node+Express, va en operaciones/reportes/, se integra con el sheet 15Xf..., autoriza por service account existente de rosita-caseteja"
            </p>
          </div>

          {conversation.length > 0 && (
            <details className="text-[10px] text-gray-500">
              <summary className="cursor-pointer hover:text-gray-300">Rondas anteriores ({conversation.length})</summary>
              <div className="mt-2 space-y-2">
                {conversation.map((c, i) => (
                  <div key={i} className="bg-bg-900 border border-bg-700 rounded p-2">
                    <div className="text-accent-blue mb-1">Ronda {c.round}:</div>
                    {c.questions.map((q, j) => <div key={j} className="text-gray-400">• {q}</div>)}
                    <div className="text-gray-300 mt-1.5 font-mono whitespace-pre-wrap">{c.answer}</div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {step === 'error' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-accent-red/10 border border-accent-red/50 rounded-lg p-3 mb-3">
            <div className="text-xs font-semibold text-accent-red mb-1">Error al analizar</div>
            <div className="text-xs text-gray-200 font-mono whitespace-pre-wrap break-words">{error}</div>
          </div>
          {raw && (
            <details className="text-[10px] text-gray-500">
              <summary className="cursor-pointer hover:text-gray-300">Respuesta raw</summary>
              <pre className="mt-2 bg-bg-900 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">{raw}</pre>
            </details>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nombre</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-accent-terra/60"
            />
          </div>

          {contextInfo && Object.keys(contextInfo).length > 0 && (
            <details className="bg-bg-900 border border-bg-600 rounded-lg p-2.5" open>
              <summary className="text-xs font-semibold text-gray-300 cursor-pointer">📐 Contexto compartido</summary>
              <div className="mt-2 space-y-1 text-[11px]">
                {Object.entries(contextInfo).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-gray-500 uppercase tracking-wider text-[9px]">{k}:</span>{' '}
                    <span className="text-gray-200 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300">Subtareas ({subtasks.length})</span>
              <button onClick={addSubtask} className="text-[11px] text-accent-terra hover:text-accent-terra/80">+ Agregar</button>
            </div>
            <div className="space-y-2">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  className={`bg-bg-900 border rounded-lg p-2.5 ${draggingIdx === idx ? 'border-accent-terra opacity-50' : 'border-bg-600'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs mt-1 cursor-grab">⋮⋮</span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        value={st.title}
                        onChange={(e) => updateSubtask(idx, { title: e.target.value })}
                        className="w-full bg-transparent text-sm font-medium text-gray-100 outline-none focus:bg-bg-800 rounded px-1"
                      />
                      <textarea
                        value={st.desc}
                        onChange={(e) => updateSubtask(idx, { desc: e.target.value })}
                        rows={2}
                        className="w-full bg-transparent text-[11px] text-gray-300 outline-none focus:bg-bg-800 rounded px-1 resize-none font-mono"
                      />
                      {st.deliverable && (
                        <div className="text-[10px] text-gray-500">
                          <span className="uppercase tracking-wider">Entregable:</span> {st.deliverable}
                        </div>
                      )}
                      <input
                        value={st.cwd}
                        onChange={(e) => updateSubtask(idx, { cwd: e.target.value })}
                        className="w-full bg-transparent text-[10px] text-gray-500 font-mono outline-none focus:bg-bg-800 rounded px-1"
                      />
                      {subtasks.length > 1 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="text-[9px] text-gray-500 mr-1 uppercase tracking-wider">Depende:</span>
                          {subtasks.map((other, otherIdx) => (
                            otherIdx !== idx && (
                              <button
                                key={other.id}
                                onClick={() => toggleDep(idx, otherIdx)}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  st.dependsOn.includes(other.id)
                                    ? 'bg-accent-blue/30 text-accent-blue border border-accent-blue/60'
                                    : 'bg-bg-700 text-gray-500 border border-bg-600 hover:border-gray-600'
                                }`}
                              >
                                {other.title.slice(0, 20)}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeSubtask(idx)}
                      className="text-gray-500 hover:text-accent-red text-xs"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="px-4 py-3 border-t border-bg-600 flex gap-2">
        {step === 'form' && (
          <>
            <button onClick={onCancel} className="flex-1 text-xs text-gray-400 hover:text-gray-200">Cancelar</button>
            <button
              onClick={() => sendToDecomposer()}
              disabled={!description.trim() || !effectiveCwd}
              className="flex-1 px-4 py-2 rounded bg-accent-terra hover:bg-accent-terra/90 text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >Analizar</button>
          </>
        )}
        {step === 'interview' && (
          <>
            <button onClick={() => setStep('form')} className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200">← Editar desc</button>
            <button
              onClick={() => sendToDecomposer(rawAnswer)}
              disabled={!rawAnswer.trim()}
              className="flex-1 px-4 py-2 rounded bg-accent-terra hover:bg-accent-terra/90 text-black text-sm font-semibold disabled:opacity-40"
            >Enviar respuesta</button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <button onClick={() => setStep('form')} className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200">← Editar</button>
            <button
              onClick={tryLaunch}
              disabled={subtasks.length === 0}
              className="flex-1 px-4 py-2 rounded bg-accent-terra hover:bg-accent-terra/90 text-black text-sm font-semibold disabled:opacity-40"
            >🚀 Lanzar {subtasks.length} subtareas</button>
          </>
        )}
        {step === 'error' && (
          <>
            <button onClick={onCancel} className="flex-1 text-xs text-gray-400 hover:text-gray-200">Cancelar</button>
            <button onClick={() => setStep('form')} className="flex-1 px-4 py-2 rounded bg-accent-blue hover:bg-accent-blue/90 text-white text-sm">Volver</button>
          </>
        )}
      </footer>

      {showConflicts && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-bg-800 border border-accent-amber/60 rounded-xl shadow-2xl max-w-md w-full p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-bold text-accent-amber">Problemas detectados</div>
                <div className="text-[10px] text-gray-400">{conflicts.length} issue(s) antes de lanzar</div>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
              {conflicts.map((c, i) => (
                <li key={i} className="text-[11px] text-gray-200 bg-bg-900 px-2 py-1.5 rounded border border-bg-600">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 mr-2">{c.type}</span>
                  {c.msg}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => setShowConflicts(false)} className="flex-1 px-3 py-2 rounded bg-bg-700 hover:bg-bg-600 text-xs text-gray-200">Volver a editar</button>
              <button onClick={doLaunch} className="flex-1 px-3 py-2 rounded bg-accent-amber/80 hover:bg-accent-amber text-black text-xs font-semibold">Lanzar igualmente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
