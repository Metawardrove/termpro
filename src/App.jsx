import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TerminalView from './components/TerminalView.jsx';
import DetailsPanel from './components/DetailsPanel.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import {
  WindowChrome,
  CenterHeader,
  StatusBar,
  ThemePicker,
  CommandPalette,
  ToastStack,
  PermissionBanner
} from './components/v2.jsx';
import Onboarding from './components/onboarding.jsx';
import { AboutDialog } from './brand.jsx';
import { applyTheme, loadThemeId, saveThemeId } from './theme.js';

const DEFAULT_SETTINGS = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", Consolas, monospace',
  shell: '',
  theme: { name: 'TermPro Dark', bg: '#0a0a0b', fg: '#e8e8ea', cursor: '#b5483c' },
  mute: false,
  nativeNotif: true,
  autoDetectPrompts: false
};

function loadProjects() {
  try {
    const raw = localStorage.getItem('termpro_projects');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

const PROJECT_COLORS = ['#76b900', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#06b6d4', '#84cc16'];

function loadSettings() {
  try {
    const raw = localStorage.getItem('termpro_settings');
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

function playChime() {
  // SaaS-style two-tone chime (C5 + G5 perfect fifth, soft triangle wave)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);

    const voice = (freq, startOffset, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(1, now + startOffset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain).connect(master);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    // First note: C6 (1046Hz), second: G6 (1568Hz) — ascending perfect fifth
    voice(1046.5, 0, 0.35);
    voice(1567.98, 0.11, 0.45);

    setTimeout(() => ctx.close(), 700);
  } catch (e) { /* ignore */ }
}

const FILTERED_CMDS = /^(ls|cd|pwd|clear|cls|exit|history)(\s|$)/;

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sessionMeta, setSessionMeta] = useState({});
  const [lastNotif, setLastNotif] = useState(null);
  const lastActivityRef = useRef({}); // { sessionId: timestamp }
  const stuckAlertedRef = useRef({}); // { sessionId: timestamp del ultimo alerted }
  const [settings, setSettings] = useState(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userProjects, setUserProjects] = useState(loadProjects);
  const [leftCollapsed, setLeftCollapsed] = useState(() => localStorage.getItem('termpro:leftCol') === '1');
  const [rightCollapsed, setRightCollapsed] = useState(() => localStorage.getItem('termpro:rightCol') === '1');
  const [themeId, setThemeId] = useState(loadThemeId);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !localStorage.getItem('termpro:onboardingSeen:v3'));
  const [aboutOpen, setAboutOpen] = useState(false);

  const pushToast = useCallback((t) => {
    setToasts((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    applyTheme(themeId);
    saveThemeId(themeId);
  }, [themeId]);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); setCmdKOpen(true); }
      else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setLeftCollapsed((v) => !v); }
      else if (e.key === 'j' || e.key === 'J') { e.preventDefault(); setRightCollapsed((v) => !v); }
      else if (e.key === '.') { e.preventDefault(); setFocus((v) => !v); }
    };
    window.addEventListener('keydown', onKey);

    // Evitar navegacion default cuando se suelta una carpeta fuera del sidebar
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);
  const [leftWidth, setLeftWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('termpro:leftW') || '288', 10);
    return Number.isFinite(v) ? Math.min(520, Math.max(240, v)) : 288;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('termpro:rightW') || '320', 10);
    return Number.isFinite(v) ? Math.min(520, Math.max(240, v)) : 320;
  });

  useEffect(() => {
    localStorage.setItem('termpro_projects', JSON.stringify(userProjects));
  }, [userProjects]);
  useEffect(() => { localStorage.setItem('termpro:leftCol', leftCollapsed ? '1' : '0'); }, [leftCollapsed]);
  useEffect(() => { localStorage.setItem('termpro:rightCol', rightCollapsed ? '1' : '0'); }, [rightCollapsed]);
  useEffect(() => { localStorage.setItem('termpro:leftW', String(leftWidth)); }, [leftWidth]);
  useEffect(() => { localStorage.setItem('termpro:rightW', String(rightWidth)); }, [rightWidth]);

  const addProject = useCallback(({ name, cwd, color }) => {
    const newProject = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      cwd: cwd.trim(),
      color: color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
    };
    setUserProjects((prev) => [...prev, newProject]);
  }, []);

  const deleteProject = useCallback((id) => {
    setUserProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const togglePin = useCallback((id) => {
    setUserProjects((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  }, []);

  const reorderProjects = useCallback((dragId, dropId) => {
    setUserProjects((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((p) => p.id === dragId);
      const to = arr.findIndex((p) => p.id === dropId);
      if (from < 0 || to < 0) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  }, []);
  const activeIdRef = useRef(activeId);
  const settingsRef = useRef(settings);
  const sessionsRef = useRef(sessions);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem('termpro_settings', JSON.stringify(settings));
  }, [settings]);
  const setFontSize = (updater) => setSettings((s) => ({ ...s, fontSize: typeof updater === 'function' ? updater(s.fontSize) : updater }));

  const openSession = useCallback((project) => {
    const existing = sessions.find((s) => s.projectId === project.id);
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next = {
      id,
      projectId: project.id,
      project,
      status: 'idle',
      unread: 0,
      createdAt: Date.now()
    };
    setSessions((prev) => [...prev, next]);
    setSessionMeta((prev) => ({ ...prev, [id]: { commands: [], startedAt: Date.now() } }));
    setActiveId(id);
  }, [sessions]);

  const closeSession = useCallback((id) => {
    window.termpro?.kill(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        setActiveId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
    setSessionMeta((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, [activeId]);

  const updateSession = useCallback((id, patch) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const renameSession = useCallback((id, displayName) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, displayName: displayName?.trim() || null } : s)));
  }, []);

  const recordCommand = useCallback((id, entry) => {
    if (FILTERED_CMDS.test(entry.cmd)) return;
    setSessionMeta((prev) => {
      const meta = prev[id] || { commands: [], events: [], startedAt: Date.now() };
      const events = meta.events || [];
      return {
        ...prev,
        [id]: {
          ...meta,
          commands: [...meta.commands, entry],
          events: [...events, { type: 'command', label: entry.cmd, ts: entry.ts }]
        }
      };
    });
  }, []);

  const recordEvent = useCallback((id, event) => {
    setSessionMeta((prev) => {
      const meta = prev[id] || { commands: [], events: [], startedAt: Date.now() };
      const events = meta.events || [];
      return { ...prev, [id]: { ...meta, events: [...events, event] } };
    });
  }, []);

  useEffect(() => {
    const api = window.termpro;
    if (!api?.onNotify) return;
    const unsub = api.onNotify((n) => {
      const autoDetect = settingsRef.current.autoDetectPrompts;

      // Siempre registrar en events para el timeline (no hace ruido visual)
      recordEvent(n.id, { type: n.type === 'permission' ? 'claude' : 'notif', label: n.label, ts: n.ts || Date.now() });

      // Todo lo demas es opcional: requiere que el usuario active auto-detect en Settings
      if (!autoDetect) return;

      const isActiveSession = n.id === activeIdRef.current;
      const windowFocused = document.hasFocus();

      if (n.type === 'permission') {
        setSessions((prev) => prev.map((s) => (s.id === n.id ? { ...s, needsPermission: true, lastNotifLabel: n.label } : s)));
      }

      if (isActiveSession && windowFocused) return;
      if (!settingsRef.current.mute && !windowFocused) playChime();

      if (!isActiveSession) {
        setLastNotif(n);
        setTimeout(() => setLastNotif((cur) => (cur === n ? null : cur)), 6000);
        setSessions((prev) => prev.map((s) => (s.id === n.id ? { ...s, unread: (s.unread ?? 0) + 1 } : s)));

        if (n.type === 'permission') {
          pushToast({
            kind: 'permission',
            message: n.label || 'Claude solicita permiso',
            actions: [{ label: 'Ir al terminal', primary: true, onClick: () => setActiveId(n.id) }]
          });
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!activeId) return;
    // Al activar la sesion, clear unread + needsPermission (el usuario la esta mirando)
    setSessions((prev) => prev.map((s) =>
      s.id === activeId && (s.unread || s.needsPermission)
        ? { ...s, unread: 0, needsPermission: false, lastNotifLabel: null }
        : s
    ));
  }, [activeId]);

  // Auto-expire needsPermission despues de 45s (pudo haber sido falso positivo)
  useEffect(() => {
    const t = setInterval(() => {
      setSessions((prev) => prev.map((s) => {
        if (!s.needsPermission) return s;
        const lastAct = lastActivityRef.current[s.id] || s.createdAt || Date.now();
        if (Date.now() - lastAct > 45000) {
          return { ...s, needsPermission: false, lastNotifLabel: null };
        }
        return s;
      }));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // WhatsApp-style unread: bump counter once per output burst from non-active session
  useEffect(() => {
    const api = window.termpro;
    if (!api?.onData) return;
    const timers = {};
    const hadOutput = {};
    const BURST_IDLE_MS = 1500;

    const unsub = api.onData(({ id, data }) => {
      if (!data || id === activeIdRef.current) return;
      const clean = String(data).replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/[\r\n]/g, '');
      if (!clean.trim()) return;

      // Ignorar el output de startup (MOTD, bashrc, prompt inicial)
      const sess = sessionsRef.current.find((s) => s.id === id);
      if (sess && Date.now() - (sess.createdAt || 0) < 5000) return;

      hadOutput[id] = true;
      if (timers[id]) clearTimeout(timers[id]);
      timers[id] = setTimeout(() => {
        if (hadOutput[id] && id !== activeIdRef.current) {
          setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, unread: (s.unread ?? 0) + 1 } : s)));
        }
        delete timers[id];
        delete hadOutput[id];
      }, BURST_IDLE_MS);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Stuck detection: cada 30s revisa si alguna sesion running no emitio output hace >3min
  useEffect(() => {
    const STUCK_THRESHOLD = 3 * 60 * 1000; // 3 minutos
    const RECHECK_INTERVAL = 5 * 60 * 1000; // re-alertar cada 5 min si sigue stuck
    const id = setInterval(() => {
      const now = Date.now();
      sessions.forEach((s) => {
        if (s.status !== 'running') return;
        const last = lastActivityRef.current[s.id] || s.createdAt;
        const silent = now - last;
        const lastAlert = stuckAlertedRef.current[s.id] || 0;
        if (silent > STUCK_THRESHOLD && (now - lastAlert) > RECHECK_INTERVAL) {
          stuckAlertedRef.current[s.id] = now;
          const minutes = Math.floor(silent / 60000);
          const notif = {
            id: s.id,
            type: 'stuck',
            label: `⏸ Sin output hace ${minutes}min`,
            snippet: `${s.displayName || s.project.name} esta silenciosa. Quizas espera permiso.`,
            ts: now
          };
          recordEvent(s.id, { type: 'notif', label: `Stuck ${minutes}min`, ts: now });
          if (s.id !== activeIdRef.current) {
            setLastNotif(notif);
            setTimeout(() => setLastNotif((cur) => (cur === notif ? null : cur)), 6000);
            if (!settingsRef.current.mute && !document.hasFocus()) playChime();
            setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, unread: (x.unread ?? 0) + 1 } : x)));
          }
        }
      });
    }, 30000);
    return () => clearInterval(id);
  }, [sessions, recordEvent]);

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const inInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const list = sessions;
        if (list.length < 2) return;
        const cur = list.findIndex((s) => s.id === activeId);
        const next = e.shiftKey
          ? (cur - 1 + list.length) % list.length
          : (cur + 1) % list.length;
        setActiveId(list[next].id);
      } else if (!inInput && /^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10) - 1;
        if (sessions[n]) { e.preventDefault(); setActiveId(sessions[n].id); }
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setFontSize((v) => Math.min(v + 1, 28));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setFontSize((v) => Math.max(v - 1, 8));
      } else if (e.key === '0') {
        e.preventDefault();
        setFontSize(13);
      }
    };
    const onComma = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keydown', onComma);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keydown', onComma);
    };
  }, [sessions, activeId]);

  const activeSession = sessions.find((s) => s.id === activeId) || null;

  const runningCount = sessions.filter((s) => s.status === 'running').length;
  const activeProject = activeSession?.project || null;

  const launchClaudeBypass = useCallback(() => {
    if (!activeId) {
      pushToast({ kind: 'info', message: 'Abre un proyecto primero' });
      return;
    }
    window.termpro?.sendInput(activeId, 'claude --dangerously-skip-permissions\r');
    pushToast({
      kind: 'error',
      message: 'Claude corriendo en modo sin permisos — ejecutara todo sin confirmar',
      duration: 4500
    });
  }, [activeId, pushToast]);

  return (
    <div
      className="h-full w-full flex flex-col relative z-[1]"
      style={{ background: 'var(--tp-center)', color: 'var(--tp-text)' }}
    >
      <WindowChrome
        projectCount={userProjects.length}
        runningCount={runningCount}
        onCmdK={() => setCmdKOpen(true)}
        onOpenThemes={() => setThemePickerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onToggleFocus={() => setFocus((v) => !v)}
        focusActive={focus}
      />

      <div className="flex flex-1 min-h-0 w-full">
        {!focus && !leftCollapsed && (
          <>
            <div
              style={{ width: leftWidth, background: 'var(--tp-sidebar)' }}
              className="flex-shrink-0 flex relative"
            >
              <Sidebar
                projects={userProjects}
                sessions={sessions}
                sessionMeta={sessionMeta}
                activeId={activeId}
                onOpenProject={openSession}
                onSelectSession={setActiveId}
                onCloseSession={closeSession}
                onRenameSession={renameSession}
                onOpenSettings={() => setSettingsOpen(true)}
                onAddProject={addProject}
                onDeleteProject={deleteProject}
                onTogglePin={togglePin}
                onReorder={reorderProjects}
                onOpenCmdK={() => setCmdKOpen(true)}
              />
              <div className="absolute bottom-[72px] right-3 z-[6]">
                <MinimizeButton side="left" onClick={() => setLeftCollapsed(true)} title="Minimizar panel (⌘B)" />
              </div>
            </div>
            <Resizer
              side="left"
              onDrag={(_dx, x) => {
                const w = Math.max(180, Math.min(520, x));
                setLeftWidth(w);
                return w;
              }}
              onCollapse={() => setLeftCollapsed(true)}
            />
          </>
        )}
        {!focus && leftCollapsed && (
          <CollapsedLeftRail
            projects={userProjects}
            sessions={sessions}
            activeId={activeId}
            onSelectSession={setActiveId}
            onOpenProject={openSession}
            onExpand={() => setLeftCollapsed(false)}
          />
        )}

        <main
          className="flex-1 flex flex-col min-w-0 relative"
          style={{ background: 'var(--tp-center)' }}
        >
          {sessions.length === 0 ? (
            <EmptyState projects={userProjects} onOpen={openSession} onAddProject={addProject} />
          ) : (
            <>
              {activeSession && (
                <CenterHeader
                  project={activeProject}
                  session={activeSession}
                  onClear={() => pushToast({ kind: 'info', message: 'Sugerencia: usa `clear` dentro del terminal' })}
                  onRestart={() => pushToast({ kind: 'info', message: 'Reinicia manualmente cerrando y reabriendo el proyecto' })}
                  onKill={() => activeId && closeSession(activeId)}
                  onClaudeBypass={launchClaudeBypass}
                />
              )}
              {activeSession?.needsPermission && (
                <PermissionBanner
                  label={activeSession.lastNotifLabel}
                  onDismiss={() => updateSession(activeSession.id, { needsPermission: false })}
                />
              )}
              <div className="flex-1 flex flex-col min-h-0 relative">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={s.id === activeId ? 'flex-1 flex flex-col min-h-0' : 'hidden'}
                  >
                    <TerminalView
                      session={s}
                      active={s.id === activeId}
                      settings={settings}
                      onStatusChange={(status) => {
                        updateSession(s.id, { status });
                        if (status === 'error' || status === 'done') {
                          recordEvent(s.id, { type: 'status', label: status, ts: Date.now() });
                        }
                      }}
                      onCommand={(entry) => { recordCommand(s.id, entry); updateSession(s.id, { needsPermission: false }); }}
                      onEvent={(ev) => recordEvent(s.id, ev)}
                      onActivity={(ts) => { lastActivityRef.current[s.id] = ts; stuckAlertedRef.current[s.id] = 0; }}
                      onMeta={({ shell, pid }) => updateSession(s.id, { shell, pid })}
                    />
                  </div>
                ))}
              </div>
              {activeSession && <StatusBar session={activeSession} project={activeProject} />}
            </>
          )}
          {focus && (
            <button
              onClick={() => setFocus(false)}
              className="absolute top-3.5 right-3.5 z-[50] px-3 py-1.5 rounded-md text-[11px] cursor-pointer inline-flex items-center gap-1.5 border"
              style={{
                background: 'color-mix(in oklab, var(--tp-accent) 18%, transparent)',
                color: 'var(--tp-accent-soft)',
                borderColor: 'color-mix(in oklab, var(--tp-accent) 30%, transparent)'
              }}
            >
              Salir de enfoque ⌘.
            </button>
          )}
        </main>

        {!focus && !rightCollapsed && (
          <>
            <Resizer
              side="right"
              onDrag={(_dx, x) => {
                const w = Math.max(180, Math.min(520, window.innerWidth - x));
                setRightWidth(w);
                return w;
              }}
              onCollapse={() => setRightCollapsed(true)}
            />
            <div
              style={{ width: rightWidth, background: 'var(--tp-right)' }}
              className="flex-shrink-0 flex relative"
            >
              <RightPanel
                activeSession={activeSession}
                sessionMeta={activeSession ? sessionMeta[activeSession.id] : null}
              />
              <div className="absolute bottom-3 left-3 z-[6]">
                <MinimizeButton side="right" onClick={() => setRightCollapsed(true)} title="Minimizar panel (⌘J)" />
              </div>
            </div>
          </>
        )}
        {!focus && rightCollapsed && (
          <CollapsedRightRail
            activeSession={activeSession}
            sessionMeta={activeSession ? sessionMeta[activeSession.id] : null}
            onExpand={() => setRightCollapsed(false)}
          />
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <ThemePicker
        open={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
        activeId={themeId}
        onSelect={(id) => setThemeId(id)}
      />

      <CommandPalette
        open={cmdKOpen}
        onClose={() => setCmdKOpen(false)}
        projects={userProjects}
        sessions={sessions}
        onSelectProject={(p) => openSession(p)}
        onSelectSession={(id) => setActiveId(id)}
        onAction={(id) => {
          if (id === 'focus') setFocus((v) => !v);
          else if (id === 'toggle-left') setLeftCollapsed((v) => !v);
          else if (id === 'toggle-right') setRightCollapsed((v) => !v);
          else if (id === 'themes') setThemePickerOpen(true);
          else if (id === 'settings') setSettingsOpen(true);
          else if (id === 'onboarding') setOnboardingOpen(true);
          else if (id === 'about') setAboutOpen(true);
          else if (id === 'claude-bypass') launchClaudeBypass();
        }}
      />

      {onboardingOpen && (
        <Onboarding
          themeId={themeId}
          onSelectTheme={setThemeId}
          onDone={() => {
            setOnboardingOpen(false);
            localStorage.setItem('termpro:onboardingSeen:v3', '1');
          }}
        />
      )}

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}


function MinimizeButton({ side, onClick, title = 'Minimizar' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-[42px] px-3 rounded-[11px] cursor-pointer flex items-center justify-center gap-2 transition border"
      style={{
        background: 'color-mix(in oklab, var(--tp-accent) 18%, transparent)',
        color: 'var(--tp-accent-soft)',
        borderColor: 'color-mix(in oklab, var(--tp-accent) 32%, transparent)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        minWidth: 42
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in oklab, var(--tp-accent) 32%, transparent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'color-mix(in oklab, var(--tp-accent) 18%, transparent)'; }}
    >
      <span className={`inline-flex ${side === 'left' ? 'rotate-180' : ''}`}>
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

function Resizer({ onDrag, onCollapse, side }) {
  const [dragging, setDragging] = useState(false);
  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    let collapsed = false;
    const onMove = (ev) => {
      if (collapsed) return;
      const resultWidth = onDrag(ev.movementX, ev.clientX);
      if (typeof resultWidth === 'number' && resultWidth <= 180 && onCollapse) {
        collapsed = true;
        onCollapse();
      }
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  return (
    <div
      onMouseDown={onMouseDown}
      className="w-[8px] flex-shrink-0 flex items-center justify-center relative z-[5] transition-colors group"
      style={{
        cursor: 'col-resize',
        background: dragging ? 'color-mix(in oklab, var(--tp-accent) 45%, transparent)' : 'var(--tp-border-04)'
      }}
      onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.background = 'color-mix(in oklab, var(--tp-accent) 25%, transparent)'; }}
      onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.background = 'var(--tp-border-04)'; }}
    >
      <div
        className="w-[2px] h-10 rounded pointer-events-none"
        style={{ background: dragging ? 'var(--tp-accent-soft)' : 'var(--tp-border-15)' }}
      />
    </div>
  );
}

function CollapsedLeftRail({ projects, sessions, activeId, onSelectSession, onOpenProject, onExpand }) {
  return (
    <div
      className="w-[58px] flex-shrink-0 flex flex-col py-3.5 items-center gap-1.5"
      style={{ background: 'var(--tp-sidebar-rail)' }}
    >
      <button
        onClick={onExpand}
        title="Expandir (⌘B)"
        className="w-[34px] h-[34px] rounded-lg cursor-pointer flex items-center justify-center"
        style={{
          background: 'color-mix(in oklab, var(--tp-accent) 14%, transparent)',
          color: 'var(--tp-accent-soft)',
          border: 'none'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
      <div className="w-[34px] h-px my-1.5" style={{ background: 'var(--tp-border-06)' }} />
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 w-full items-center">
        {projects.map((p) => {
          const session = sessions.find((s) => s.projectId === p.id);
          const isCurrent = session?.id === activeId;
          const unread = session?.unread || 0;
          const thinking = session?.status === 'running';
          const err = session?.status === 'error';
          const initials = (p.name || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
          return (
            <button
              key={p.id}
              onClick={() => (session ? onSelectSession(session.id) : onOpenProject(p))}
              title={p.name}
              className="relative flex-shrink-0 cursor-pointer"
              style={{ width: 40, height: 40, border: 'none', padding: 0, background: 'transparent' }}
            >
              {isCurrent && (
                <div
                  className="absolute rounded-[2px]"
                  style={{
                    left: -10,
                    top: 8,
                    bottom: 8,
                    width: 2.5,
                    background: p.color
                  }}
                />
              )}
              <div
                className="w-10 h-10 flex items-center justify-center text-[14px] font-semibold"
                style={{
                  background: p.color,
                  color: 'var(--tp-text-strong)',
                  borderRadius: 'var(--tp-avatar-shape)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)'
                }}
              >
                {initials}
              </div>
              {unread > 0 && (
                <span
                  className="absolute inline-flex items-center justify-center font-bold"
                  style={{
                    top: -2,
                    right: -2,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    background: err ? '#ef5a4b' : '#7dd3a0',
                    color: err ? '#fff' : '#0a2918',
                    borderRadius: 8,
                    fontSize: 9.5,
                    border: '2px solid var(--tp-sidebar-rail)',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  {unread}
                </span>
              )}
              {thinking && unread === 0 && (
                <span
                  className="absolute rounded-full"
                  style={{
                    bottom: 0,
                    right: 0,
                    width: 11,
                    height: 11,
                    background: '#7dd3a0',
                    border: '2px solid var(--tp-sidebar-rail)',
                    animation: 'tpPulse 1.6s ease-in-out infinite'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollapsedRightRail({ activeSession, sessionMeta, onExpand }) {
  const events = sessionMeta?.events || [];
  const counts = events.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {});
  const types = [
    { k: 'command', label: 'Comandos', color: '#8ab4c9', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><polyline points="4 17 10 11 4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { k: 'claude', label: 'Claude', color: 'var(--tp-accent-soft)', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/></svg> },
    { k: 'error', label: 'Errores', color: '#ef5a4b', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { k: 'notif', label: 'Permisos', color: '#e5a547', icon: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="m12 2 11 20H1L12 2Zm0 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
  ];
  return (
    <div
      className="w-[52px] flex-shrink-0 flex flex-col items-center py-3 gap-2.5"
      style={{ background: 'var(--tp-right-rail)' }}
    >
      <button
        onClick={onExpand}
        title="Expandir (⌘J)"
        className="w-8 h-8 rounded-[7px] cursor-pointer flex items-center justify-center border-none"
        style={{
          background: 'color-mix(in oklab, var(--tp-accent) 14%, transparent)',
          color: 'var(--tp-accent-soft)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
      <div className="w-6 h-px my-0.5" style={{ background: 'var(--tp-border-06)' }} />
      {types.map((t) => {
        const count = counts[t.k] || 0;
        const IconComp = t.icon;
        return (
          <div
            key={t.k}
            title={`${t.label}: ${count}`}
            className="w-8 h-8 rounded-[7px] flex items-center justify-center relative"
            style={{
              background: `${t.color}14`,
              color: t.color
            }}
          >
            <IconComp width="13" height="13" />
            {count > 0 && (
              <span
                className="absolute inline-flex items-center justify-center font-bold font-mono"
                style={{
                  top: -3,
                  right: -3,
                  minWidth: 14,
                  height: 14,
                  padding: '0 3px',
                  background: t.color,
                  color: '#100d12',
                  borderRadius: 7,
                  fontSize: 9,
                  border: '2px solid var(--tp-right-rail)'
                }}
              >
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RightPanel({ activeSession, sessionMeta }) {
  return (
    <aside
      className="w-full flex flex-col h-full border-l"
      style={{
        background: 'var(--tp-right)',
        color: 'var(--tp-text)',
        borderColor: 'var(--tp-border-05)'
      }}
    >
      <DetailsPanel session={activeSession} meta={sessionMeta} />
    </aside>
  );
}

function EmptyState({ projects, onOpen, onAddProject }) {
  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <h1 className="text-3xl font-semibold text-gray-100 mb-2">TermPro</h1>
          <p className="text-gray-400 mb-6">
            Aun no tenes proyectos. Agrega tu primera carpeta para empezar.
          </p>
          <button
            onClick={async () => {
              const picked = await window.termpro?.pickFolder?.();
              if (!picked?.ok) return;
              const folderName = picked.path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'Proyecto';
              onAddProject?.({ name: folderName, cwd: picked.path });
            }}
            className="px-5 py-3 rounded-lg bg-accent-terra text-black font-semibold hover:bg-accent-terra/90 transition"
          >
            + Agregar proyecto
          </button>
          <p className="text-[11px] text-gray-500 mt-4">
            Tip: tambien podes agregar proyectos desde el sidebar izquierdo.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-gray-100 mb-2">TermPro</h1>
        <p className="text-gray-400 mb-6">Abre un proyecto para empezar</p>
        <div className="grid grid-cols-2 gap-2">
          {projects.slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="px-4 py-3 rounded-lg bg-bg-800 hover:bg-bg-700 border border-bg-600 text-left transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="font-medium">{p.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
