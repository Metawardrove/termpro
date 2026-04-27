import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';

const DEFAULT_THEME = { bg: '#0a0a0c', fg: '#e8e8ea', cursor: '#b5483c' };

function readThemeFromCss() {
  try {
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue('--tp-term-bg').trim() || cs.getPropertyValue('--tp-center').trim();
    const fg = cs.getPropertyValue('--tp-term-fg').trim() || cs.getPropertyValue('--tp-text').trim();
    const cursor = cs.getPropertyValue('--tp-term-cursor').trim() || cs.getPropertyValue('--tp-accent').trim();
    if (bg && fg && cursor) return { bg, fg, cursor };
  } catch {}
  return null;
}

function toXtermTheme(t) {
  const fromCss = readThemeFromCss();
  const th = fromCss || t || DEFAULT_THEME;
  return {
    background: th.bg,
    foreground: th.fg,
    cursor: th.cursor,
    cursorAccent: th.bg,
    selectionBackground: '#3b82f644'
  };
}

export default function TerminalView({ session, active = true, settings = {}, onStatusChange, onCommand, onEvent, onActivity, onMeta }) {
  const { fontSize = 13, fontFamily = '"JetBrains Mono", Consolas, monospace', theme, shell } = settings;
  const onEventRef = useRef(onEvent);
  const onActivityRef = useRef(onActivity);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onActivityRef.current = onActivity; }, [onActivity]);
  const lastErrorRef = useRef(0);
  const hostRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const searchRef = useRef(null);
  const inputBufRef = useRef('');
  const onCommandRef = useRef(onCommand);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [attachToast, setAttachToast] = useState(null);
  const [livePreview, setLivePreview] = useState('');
  const [composeText, setComposeText] = useState('');
  const [anchors, setAnchors] = useState([]); // { id, label, bufferY, ts }
  const [bufferTick, setBufferTick] = useState(0);
  const composeRef = useRef(null);
  const lastTickRef = useRef(0);

  const pushAnchor = (label, bufferY) => {
    setAnchors((prev) => {
      const next = [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: (label || '').slice(0, 80),
        bufferY,
        ts: Date.now()
      }];
      if (next.length > 60) next.splice(0, next.length - 60);
      return next;
    });
  };

  const showToast = (msg) => {
    setAttachToast(msg);
    setTimeout(() => setAttachToast((cur) => (cur === msg ? null : cur)), 2600);
  };

  const quotePath = (p) => (/\s/.test(p) ? `"${p}"` : p);

  const attachImageFromBlob = async (blob) => {
    try {
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const buf = await blob.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const res = await window.termpro.saveImage(base64, ext);
      if (res?.ok) {
        window.termpro.sendInput(session.id, quotePath(res.path) + ' ');
        showToast(`📎 Imagen adjuntada · ${res.path.split(/[\\/]/).pop()}`);
      } else {
        showToast(`❌ ${res?.error || 'No se pudo guardar'}`);
      }
    } catch (e) {
      showToast(`❌ ${e.message}`);
    }
  };

  useEffect(() => {
    if (!hostRef.current) return;

    const term = new Terminal({
      theme: toXtermTheme(theme),
      fontFamily,
      fontSize,
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 10000,
      scrollOnUserInput: false
    });
    const fit = new FitAddon();
    const search = new SearchAddon();
    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(new WebLinksAddon());
    term.open(hostRef.current);
    termRef.current = term;
    fitRef.current = fit;
    searchRef.current = search;

    // Copy / paste / search — intercept before xterm (Warp-style)
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== 'keydown') return true;
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+C: copia si hay seleccion, sino deja pasar (SIGINT)
      if (ctrl && key === 'c' && !e.altKey) {
        const sel = term.getSelection();
        if (sel) {
          e.preventDefault();
          navigator.clipboard.writeText(sel).catch(() => {});
          term.clearSelection();
          return false;
        }
      }
      // Ctrl+V: paste (imagen si clipboard tiene imagen, sino texto)
      if (ctrl && key === 'v' && !e.altKey) {
        e.preventDefault();
        (async () => {
          try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
              const imgType = item.types.find((t) => t.startsWith('image/'));
              if (imgType) {
                const blob = await item.getType(imgType);
                await attachImageFromBlob(blob);
                return;
              }
            }
          } catch { /* fallback a texto */ }
          try {
            const raw = await navigator.clipboard.readText();
            if (raw) {
              // Normaliza CRLF y elimina cualquier marcador de bracketed-paste embebido
              // (de lo contrario el usuario podria romper el wrapping pegando texto malicioso)
              const clean = raw.replace(/\r\n?/g, '\n').replace(/\x1b\[20[01]~/g, '');
              // Wrap en bracketed-paste: Claude Code, bash/readline, zsh, vim, etc. lo tratan
              // como UN solo paste. Sin esto, cada \n se ejecuta como Enter y solo queda
              // visible la ultima linea (el shell fue ejecutando las anteriores una a una).
              const payload = `\x1b[200~${clean}\x1b[201~`;
              const CHUNK = 2048;
              const DELAY_MS = 10;
              if (payload.length <= CHUNK) {
                window.termpro?.sendInput(session.id, payload);
              } else {
                // Pastes largas: chunking para no saturar el input buffer del shell
                let i = 0;
                const sendNext = () => {
                  if (i >= payload.length) return;
                  const chunk = payload.slice(i, i + CHUNK);
                  i += CHUNK;
                  window.termpro?.sendInput(session.id, chunk);
                  if (i < payload.length) setTimeout(sendNext, DELAY_MS);
                };
                sendNext();
              }
              const lines = clean.split('\n').length;
              if (clean.length > 500 || lines > 5) {
                showToast(`📋 ${clean.length.toLocaleString()} chars · ${lines} lineas pegadas`);
              }
            }
          } catch { /* ignore */ }
        })();
        return false;
      }
      // Ctrl+Shift+C: copy tambien (por si user prefiere el de GNOME Terminal)
      if (ctrl && e.shiftKey && key === 'c') {
        const sel = term.getSelection();
        if (sel) {
          e.preventDefault();
          navigator.clipboard.writeText(sel).catch(() => {});
          return false;
        }
      }
      // Ctrl+F: search
      if (ctrl && key === 'f' && !e.shiftKey) {
        e.preventDefault();
        setSearchOpen(true);
        return false;
      }
      // Shift+Enter: nueva linea (envia Alt+Enter / ESC+CR que Claude Code acepta)
      if (e.shiftKey && key === 'enter') {
        e.preventDefault();
        window.termpro?.sendInput(session.id, '\x1b\r');
        return false;
      }
      return true;
    });

    try { fit.fit(); } catch (e) { console.warn('fit failed', e); }
    const cols = term.cols;
    const rows = term.rows;

    const api = window.termpro;
    if (!api) {
      term.writeln('\x1b[31m[error] IPC bridge missing\x1b[0m');
      return;
    }

    let disposed = false;
    let onDataUnsub = () => {};
    let onExitUnsub = () => {};

    api.createSession({ id: session.id, cwd: session.project.cwd, shell }).then((res) => {
      if (disposed) return;
      if (res?.error) {
        term.writeln(`\x1b[31m[spawn error]\x1b[0m ${res.error}`);
        onStatusChange?.('error');
        return;
      }
      onStatusChange?.('idle');
      if (res?.shell || res?.pid) onMeta?.({ shell: res.shell, pid: res.pid });
      api.resize(session.id, cols, rows);
      term.focus();
      // Auto-start claude + inyectar prompt tipado (newlines via Alt+Enter que Claude acepta)
      if (session.initialPrompt) {
        setTimeout(() => {
          if (!disposed) api.sendInput(session.id, 'claude\r');
        }, 600);
        setTimeout(() => {
          if (!disposed) {
            const typed = session.initialPrompt.replace(/\n/g, '\x1b\r');
            api.sendInput(session.id, typed + '\r');
          }
        }, 3500);
      }
    });

    onDataUnsub = api.onData(({ id, data }) => {
      if (id === session.id && !disposed) {
        term.write(data);
        onActivityRef.current?.(Date.now());
        // Throttle tick — reposiciona dots del timeline sin saturar React
        const tickNow = Date.now();
        if (tickNow - lastTickRef.current > 500) {
          lastTickRef.current = tickNow;
          setBufferTick((t) => t + 1);
        }
        // Error detection con throttle (max 1 cada 3s para evitar spam)
        const clean = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        const now = Date.now();
        if (now - lastErrorRef.current > 3000) {
          const errMatch = clean.match(/(error[:\s]|ERR![\s:]|FAIL(?:ED)?[:\s]|exception[:\s]|cannot\s+find|permission denied|not found)/i);
          if (errMatch) {
            lastErrorRef.current = now;
            const snippet = clean.slice(Math.max(0, clean.indexOf(errMatch[0]) - 10), clean.indexOf(errMatch[0]) + 80).trim();
            onEventRef.current?.({ type: 'error', label: snippet.slice(0, 90), ts: now });
          }
          const fileMatch = clean.match(/(created|modified|writing|saved)\s+([\w./\\-]+\.\w+)/i);
          if (fileMatch) {
            onEventRef.current?.({ type: 'file', label: `${fileMatch[1]} ${fileMatch[2]}`, ts: now });
          }
        }
      }
    });

    onExitUnsub = api.onExit(({ id, exitCode }) => {
      if (id === session.id && !disposed) {
        term.writeln(`\r\n\x1b[90m[exit ${exitCode ?? 0}]\x1b[0m`);
        onStatusChange?.(exitCode ? 'error' : 'done');
      }
    });

    const onTypeDispose = term.onData((data) => {
      api.sendInput(session.id, data);
      onActivityRef.current?.(Date.now());

      if (data === '\r' || data === '\n') {
        const cmd = inputBufRef.current.trim();
        inputBufRef.current = '';
        setLivePreview('');
        if (cmd) {
          const buf = term.buffer.active;
          pushAnchor(cmd, buf.baseY + buf.cursorY);
          onCommandRef.current?.({ cmd, ts: Date.now() });
        }
      } else if (data === '\x7f' || data === '\b') {
        inputBufRef.current = inputBufRef.current.slice(0, -1);
        setLivePreview(inputBufRef.current);
      } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
        inputBufRef.current += data;
        setLivePreview(inputBufRef.current);
      } else if (data.startsWith('\x1b[200~')) {
        const end = data.indexOf('\x1b[201~');
        if (end !== -1) {
          inputBufRef.current += data.slice(6, end);
          setLivePreview(inputBufRef.current);
        }
      } else if (data === '\x15' /* Ctrl+U */ || data === '\x0b' /* Ctrl+K */) {
        inputBufRef.current = '';
        setLivePreview('');
      }
    });

    // Scroll lock indicator (onScroll + native scroll del viewport DOM para respuesta inmediata)
    const checkScroll = () => {
      const buf = term.buffer.active;
      setScrolledUp(buf.viewportY < buf.baseY);
    };
    const scrollDispose = term.onScroll(checkScroll);
    const viewportEl = hostRef.current.querySelector('.xterm-viewport');
    viewportEl?.addEventListener('scroll', checkScroll);

    // Alt+click → posicionar cursor en la linea de input (best-effort)
    const onAltClick = (e) => {
      if (!e.altKey) return;
      e.preventDefault();
      try {
        const rect = term.element.getBoundingClientRect();
        const charWidth = rect.width / term.cols;
        const charHeight = rect.height / term.rows;
        const clickCol = Math.floor((e.clientX - rect.left) / charWidth);
        const clickRow = Math.floor((e.clientY - rect.top) / charHeight);
        const buf = term.buffer.active;
        const bufRow = clickRow + buf.viewportY;
        const cursorBufRow = buf.cursorY + buf.baseY;
        if (bufRow !== cursorBufRow) {
          showToast('⚠ Alt+click solo en la linea de input');
          return;
        }
        const delta = clickCol - buf.cursorX;
        if (delta === 0) return;
        const arrow = delta > 0 ? '\x1b[C' : '\x1b[D';
        const seq = arrow.repeat(Math.abs(delta));
        api.sendInput(session.id, seq);
      } catch (err) {
        console.warn('alt+click failed', err);
      }
    };
    hostRef.current.addEventListener('mousedown', onAltClick);

    const handleResize = () => {
      try {
        fit.fit();
        api.resize(session.id, term.cols, term.rows);
      } catch (e) { /* ignore */ }
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(hostRef.current);

    return () => {
      disposed = true;
      ro.disconnect();
      scrollDispose.dispose();
      viewportEl?.removeEventListener('scroll', checkScroll);
      hostRef.current?.removeEventListener('mousedown', onAltClick);
      onTypeDispose.dispose();
      onDataUnsub();
      onExitUnsub();
      term.dispose();
    };
  }, [session.id, session.project.cwd]);

  // Font + theme live update
  useEffect(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    term.options.fontSize = fontSize;
    term.options.fontFamily = fontFamily;
    term.options.theme = toXtermTheme(theme);
    try { fit.fit(); window.termpro?.resize(session.id, term.cols, term.rows); } catch (e) { /* ignore */ }
  }, [fontSize, fontFamily, theme, session.id]);

  // React to global theme changes
  useEffect(() => {
    const onThemeChange = () => {
      const term = termRef.current;
      if (!term) return;
      term.options.theme = toXtermTheme(theme);
    };
    window.addEventListener('termpro:theme-changed', onThemeChange);
    return () => window.removeEventListener('termpro:theme-changed', onThemeChange);
  }, [theme]);

  // Refit + focus when session becomes active
  useEffect(() => {
    if (!active) return;
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    requestAnimationFrame(() => {
      try {
        fit.fit();
        window.termpro?.resize(session.id, term.cols, term.rows);
      } catch (e) { /* ignore */ }
      term.focus();
    });
  }, [active, session.id]);

  const jumpToBottom = () => {
    const term = termRef.current;
    if (term) { term.scrollToBottom(); term.focus(); }
  };

  const jumpToAnchor = (bufferY) => {
    const term = termRef.current;
    if (!term) return;
    try {
      const buf = term.buffer.active;
      // scrollToLine espera un offset relativo al baseY del viewport
      const offset = bufferY - buf.viewportY;
      term.scrollLines(offset);
    } catch (e) { /* ignore */ }
  };

  const sendCompose = () => {
    const text = composeText;
    if (!text.trim()) return;
    const clean = text.replace(/\r\n?/g, '\n').replace(/\x1b\[20[01]~/g, '');
    // bracketed-paste + \r final para que Claude/bash lo trate como UN mensaje multilinea
    const payload = `\x1b[200~${clean}\x1b[201~\r`;
    const CHUNK = 2048;
    if (payload.length <= CHUNK) {
      window.termpro?.sendInput(session.id, payload);
    } else {
      let i = 0;
      const sendNext = () => {
        if (i >= payload.length) return;
        window.termpro?.sendInput(session.id, payload.slice(i, i + CHUNK));
        i += CHUNK;
        if (i < payload.length) setTimeout(sendNext, 10);
      };
      sendNext();
    }
    const term = termRef.current;
    if (term) {
      const buf = term.buffer.active;
      pushAnchor(clean.split('\n')[0] || clean, buf.baseY + buf.cursorY);
    }
    setComposeText('');
    requestAnimationFrame(() => {
      term?.scrollToBottom();
      term?.focus();
    });
    onCommandRef.current?.({ cmd: clean.split('\n')[0] || clean, ts: Date.now() });
  };

  // Auto-focus textarea cuando el usuario scrollea arriba
  useEffect(() => {
    if (scrolledUp && composeRef.current) {
      requestAnimationFrame(() => composeRef.current?.focus());
    }
  }, [scrolledUp]);

  // Podar anchors cuando xterm descarta lineas viejas del scrollback
  useEffect(() => {
    const term = termRef.current;
    if (!term || anchors.length === 0) return;
    const buf = term.buffer.active;
    const minY = Math.max(0, buf.baseY - 10000);
    const stale = anchors.some((a) => a.bufferY < minY);
    if (stale) {
      setAnchors((prev) => prev.filter((a) => a.bufferY >= minY));
    }
  }, [bufferTick, anchors.length]);

  const runSearch = (q, dir = 'next') => {
    const s = searchRef.current;
    if (!s || !q) return;
    if (dir === 'next') s.findNext(q, { caseSensitive: false });
    else s.findPrevious(q, { caseSensitive: false });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-4 py-2 border-b border-bg-600 flex items-center gap-3 bg-bg-800">
        <span className="w-2 h-2 rounded-full" style={{ background: session.project.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{session.displayName || session.project.name}</div>
          <div className="text-[10px] text-gray-500 truncate">{session.project.cwd}</div>
        </div>
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className="text-[10px] text-gray-500 hover:text-gray-200 px-2 py-1 rounded hover:bg-bg-700"
          title="Buscar (Ctrl+F)"
        >🔍</button>
      </header>

      {searchOpen && (
        <div className="px-3 py-2 border-b border-bg-600 bg-bg-800 flex items-center gap-2">
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch(searchQuery, e.shiftKey ? 'prev' : 'next');
              else if (e.key === 'Escape') { setSearchOpen(false); termRef.current?.focus(); }
            }}
            placeholder="Buscar en buffer..."
            className="flex-1 bg-bg-900 border border-bg-600 rounded px-2 py-1 text-xs text-gray-100 outline-none focus:border-accent-blue/60"
          />
          <button onClick={() => runSearch(searchQuery, 'prev')} className="text-xs text-gray-400 hover:text-gray-100 px-2 py-1 rounded hover:bg-bg-700">↑</button>
          <button onClick={() => runSearch(searchQuery, 'next')} className="text-xs text-gray-400 hover:text-gray-100 px-2 py-1 rounded hover:bg-bg-700">↓</button>
          <button onClick={() => { setSearchOpen(false); termRef.current?.focus(); }} className="text-xs text-gray-500 hover:text-gray-200 px-2">✕</button>
        </div>
      )}

      <div
        className="flex-1 relative"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); if (e.currentTarget === e.target) setDragOver(false); }}
        onDrop={async (e) => {
          e.preventDefault(); e.stopPropagation(); setDragOver(false);
          const files = Array.from(e.dataTransfer.files || []);
          const images = files.filter((f) => /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(f.name) || f.type.startsWith('image/'));
          if (images.length === 0 && files.length > 0) {
            // cualquier archivo → insertar path
            const paths = files.map((f) => quotePath(f.path)).join(' ');
            window.termpro?.sendInput(session.id, paths + ' ');
            showToast(`📎 ${files.length} archivo(s) adjuntado(s)`);
            return;
          }
          for (const f of images) {
            if (f.path) {
              window.termpro?.sendInput(session.id, quotePath(f.path) + ' ');
              showToast(`🖼 ${f.name}`);
            } else {
              await attachImageFromBlob(f);
            }
          }
        }}
      >
        <div
          ref={hostRef}
          onClick={() => termRef.current?.focus()}
          className="absolute inset-0 overflow-hidden bg-black cursor-text"
          style={{ padding: '8px' }}
        />
        {dragOver && (
          <div className="absolute inset-2 border-2 border-dashed border-accent-blue rounded-lg bg-accent-blue/10 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-3xl mb-1">🖼</div>
              <div className="text-sm text-accent-blue font-semibold">Solta la imagen aqui</div>
              <div className="text-[11px] text-gray-400 mt-1">Se insertara el path en el terminal</div>
            </div>
          </div>
        )}
        {attachToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-bg-800/95 border border-accent-terra/60 text-sm text-gray-100 shadow-xl backdrop-blur-sm">
            {attachToast}
          </div>
        )}
        {scrolledUp && (
          <>
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-900 via-bg-900/90 to-transparent h-24 pointer-events-none"
              style={{ zIndex: 40 }}
            />
            <div
              className="absolute bottom-3 left-3 right-16 bg-bg-800/95 backdrop-blur-md border border-bg-600 rounded-lg shadow-xl px-3 py-2"
              style={{ zIndex: 45 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-terra animate-pulse" />
                <span className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-semibold">
                  Modo escritura · scroll arriba
                </span>
                <span className="text-[9px] text-gray-600 ml-auto">
                  Shift+Enter nueva linea · Enter envia · Esc foco terminal
                </span>
              </div>
              <textarea
                ref={composeRef}
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendCompose();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    termRef.current?.focus();
                  }
                }}
                placeholder="Escribe tu mensaje — Whispr y dictado funcionan aqui"
                rows={Math.min(8, Math.max(1, composeText.split('\n').length))}
                className="w-full bg-transparent text-[13px] font-mono text-gray-100 outline-none border-none resize-none leading-relaxed placeholder:text-gray-600 placeholder:italic"
                style={{ caretColor: 'var(--tp-accent)' }}
              />
            </div>
            <button
              onClick={jumpToBottom}
              title="Volver al final"
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent-terra/90 text-black shadow-xl hover:bg-accent-terra hover:scale-105 transition-transform flex items-center justify-center"
              style={{ zIndex: 50 }}
            >
              <span className="text-lg font-bold leading-none">↓</span>
            </button>
          </>
        )}
        {/* Timeline rail — puntos en cada mensaje enviado */}
        {anchors.length > 0 && (() => {
          const term = termRef.current;
          if (!term) return null;
          // bufferTick referenced to re-render on buffer growth
          void bufferTick;
          const buf = term.buffer.active;
          const total = Math.max(buf.length, buf.baseY + buf.cursorY + 1, 1);
          return (
            <div
              className="absolute top-2 bottom-2 right-[3px] pointer-events-none"
              style={{ width: 12, zIndex: 35 }}
              title="Timeline · click en un punto salta a ese mensaje"
            >
              {anchors.map((a, i) => {
                const pct = Math.min(100, Math.max(0, (a.bufferY / total) * 100));
                const isLatest = i === anchors.length - 1;
                return (
                  <button
                    key={a.id}
                    onClick={() => jumpToAnchor(a.bufferY)}
                    title={`${a.label}\n${new Date(a.ts).toLocaleTimeString()}`}
                    className="absolute left-1/2 rounded-full pointer-events-auto transition-transform hover:scale-150"
                    style={{
                      top: `${pct}%`,
                      width: isLatest ? 8 : 5,
                      height: isLatest ? 8 : 5,
                      marginLeft: isLatest ? -4 : -2.5,
                      marginTop: isLatest ? -4 : -2.5,
                      background: isLatest ? 'var(--tp-accent)' : 'var(--tp-accent-soft, #8ab4c9)',
                      boxShadow: isLatest ? '0 0 10px var(--tp-accent)' : '0 0 3px rgba(0,0,0,0.5)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  />
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
