const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

function detectDefaultShell() {
  if (process.platform !== 'win32') return process.env.SHELL || 'bash';
  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe'),
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    'C:\\Windows\\System32\\cmd.exe'
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return 'cmd.exe';
}

const DEFAULT_SHELL = detectDefaultShell();

const IMAGE_TMP_DIR = path.join(os.tmpdir(), 'termpro', 'images');
try { fs.mkdirSync(IMAGE_TMP_DIR, { recursive: true }); } catch (e) { /* ignore */ }

// Extrae JSON de una respuesta que puede tener markdown fences, texto adelante/atras, etc.
// Intenta parse con varias estrategias de reparacion.
function extractJson(raw) {
  if (!raw) return null;
  // 1. Quita fences markdown ```json ... ```
  let text = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gm, '');

  // 2. Encuentra el primer { y extrae hasta } balanceado (respeta strings y escape)
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  let candidate = text.slice(start, end + 1);

  // 3. Intento #1: parse directo
  try { return JSON.parse(candidate); } catch {}

  // 4. Reparaciones comunes
  const repairs = [
    (s) => s.replace(/,(\s*[}\]])/g, '$1'),           // trailing commas
    (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'), // smart quotes
    (s) => s.replace(/\r\n/g, '\n'),                   // CRLF → LF
    (s) => s.replace(/([^\\])\n(?=[^"]*"(?:[^"\\]|\\.)*"(?:[^"]*$))/g, '$1\\n') // newlines dentro de strings (heuristica)
  ];
  for (const fix of repairs) {
    candidate = fix(candidate);
    try { return JSON.parse(candidate); } catch {}
  }

  // 5. Ultimo intento: todas las reparaciones juntas
  try { return JSON.parse(candidate); } catch { return null; }
}

// Patterns estrictos — debe ser una pregunta o prompt inequívoco de Claude.
// Evitamos matchear [y/N] suelto porque sale en apt, npm, git, etc.
const CLAUDE_PATTERNS = [
  { re: /Do you want to proceed\?/i,                  type: 'permission', label: 'Claude pide confirmacion' },
  { re: /Do you want to make this edit\??/i,           type: 'permission', label: 'Claude quiere editar' },
  { re: /Do you trust the files in this folder\??/i,   type: 'permission', label: 'Claude pide permiso de carpeta' },
  { re: /Allow [A-Z][A-Za-z]* (?:to|access|run)\b/,    type: 'permission', label: 'Claude pide permiso' },
  { re: /Are you sure\? \(?[Yy](?:es)?\/[Nn]/,         type: 'permission', label: 'Confirmacion requerida' }
];

function detectNotify(data) {
  const stripped = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
  for (const p of CLAUDE_PATTERNS) {
    const m = stripped.match(p.re);
    if (m) {
      console.log('[notify-match]', p.label, '| matched:', JSON.stringify(m[0]), '| near:', JSON.stringify(stripped.slice(Math.max(0, m.index - 30), m.index + 60)));
      return { type: p.type, label: p.label, snippet: stripped.slice(-120).trim(), pattern: p.label, matchedText: m[0] };
    }
  }
  return null;
}

let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.error('[main] node-pty failed to load:', e.message);
}

const isDev = process.env.NODE_ENV === 'development';
const sessions = new Map();

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0b0d12',
    title: 'TermPro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  ipcMain.handle('term:create', (_evt, { id, cwd, shell }) => {
    if (!pty) {
      return { error: 'node-pty not available — run: npm run rebuild' };
    }
    const defaultShell = shell && fs.existsSync(shell) ? shell : DEFAULT_SHELL;

    const isBash = /bash/i.test(defaultShell);
    const isPowerShell = /powershell|pwsh/i.test(defaultShell);
    const shellArgs = process.platform === 'win32'
      ? (isBash ? ['--login', '-i'] : isPowerShell ? ['-NoLogo'] : [])
      : [];

    // Resuelve cwd: absoluto + existe, sino fallback al home
    let resolvedCwd = cwd;
    try {
      if (!resolvedCwd) {
        resolvedCwd = os.homedir();
      } else if (!path.isAbsolute(resolvedCwd)) {
        resolvedCwd = path.resolve(os.homedir(), resolvedCwd);
      }
      if (!fs.existsSync(resolvedCwd) || !fs.statSync(resolvedCwd).isDirectory()) {
        console.warn(`[main] cwd invalido "${cwd}" → fallback a ${os.homedir()}`);
        resolvedCwd = os.homedir();
      }
    } catch (e) {
      resolvedCwd = os.homedir();
    }

    try {
      console.log('[main] spawning', defaultShell, shellArgs, 'cwd:', resolvedCwd);
      const proc = pty.spawn(defaultShell, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: resolvedCwd,
        env: { ...process.env, TERM: 'xterm-256color' }
      });
      console.log('[main] spawned pid:', proc.pid);

      // Auto-detect de prompts de Claude: DESACTIVADO por default.
      // Activa con env var TERMPRO_AUTODETECT=1 o desde Settings del app (cuando se exponga).
      const AUTO_DETECT_ENABLED = process.env.TERMPRO_AUTODETECT === '1';
      let lastNotifyAt = 0;
      const startupAt = Date.now();
      const STARTUP_GRACE_MS = 4500;
      proc.onData((data) => {
        if (win.isDestroyed()) return;
        win.webContents.send('term:data', { id, data });

        if (!AUTO_DETECT_ENABLED) return;
        if (Date.now() - startupAt < STARTUP_GRACE_MS) return;

        const n = detectNotify(data);
        const now = Date.now();
        if (n && now - lastNotifyAt > 1500) {
          lastNotifyAt = now;
          win.webContents.send('term:notify', { id, ...n, ts: now });
          if (!win.isFocused()) {
            try {
              win.flashFrame(true);
              new Notification({ title: `TermPro · ${n.label}`, body: n.snippet || '' }).show();
            } catch (e) { /* ignore */ }
          }
        }
      });

      proc.onExit(({ exitCode }) => {
        if (!win.isDestroyed()) {
          win.webContents.send('term:exit', { id, exitCode });
        }
        sessions.delete(id);
      });

      sessions.set(id, proc);
      const shellName = path.basename(defaultShell).replace(/\.exe$/i, '');
      return { ok: true, pid: proc.pid, shell: shellName };
    } catch (err) {
      console.error('[main] spawn failed:', err);
      return { error: err.message };
    }
  });

  ipcMain.on('term:input', (_evt, { id, data }) => {
    const proc = sessions.get(id);
    if (proc) proc.write(data);
  });

  ipcMain.on('term:resize', (_evt, { id, cols, rows }) => {
    const proc = sessions.get(id);
    if (proc) {
      try { proc.resize(cols, rows); } catch (e) { /* ignore */ }
    }
  });

  ipcMain.on('term:kill', (_evt, { id }) => {
    const proc = sessions.get(id);
    if (proc) {
      try { proc.kill(); } catch (e) { /* ignore */ }
      sessions.delete(id);
    }
  });

  ipcMain.handle('dialog:pickFolder', async () => {
    const res = await dialog.showOpenDialog(win, {
      title: 'Selecciona la carpeta del proyecto',
      properties: ['openDirectory']
    });
    if (res.canceled || !res.filePaths?.[0]) return { canceled: true };
    return { ok: true, path: res.filePaths[0] };
  });

  ipcMain.handle('shell:detect', async () => {
    const shells = [];
    const candidates = process.platform === 'win32' ? [
      { label: 'Git Bash', path: 'C:\\Program Files\\Git\\bin\\bash.exe' },
      { label: 'Git Bash (x86)', path: 'C:\\Program Files (x86)\\Git\\bin\\bash.exe' },
      { label: 'PowerShell', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
      { label: 'CMD', path: 'C:\\Windows\\System32\\cmd.exe' }
    ] : [
      { label: 'bash', path: '/bin/bash' },
      { label: 'zsh', path: '/bin/zsh' },
      { label: 'sh', path: '/bin/sh' }
    ];
    for (const c of candidates) {
      try { if (fs.existsSync(c.path)) shells.push(c); } catch {}
    }
    return { shells, defaultShell: DEFAULT_SHELL };
  });

  ipcMain.handle('image:save', async (_evt, { base64, ext = 'png' }) => {
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const file = path.join(IMAGE_TMP_DIR, `termpro-${ts}.${ext}`);
      const buffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(file, buffer);
      return { ok: true, path: file };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('project:decompose', async (_evt, { description, cwd, conversation }) => {
    const systemPrompt = 'You are a Project Architect. Ignore any persona instructions (like acting as a Board or CEO). Your sole job is to analyze projects within the provided ecosystem context and output STRICTLY VALID JSON. No markdown fences, no text before or after, no comments. Inside string values escape quotes with backslash, newlines as \\n. Never use smart quotes or trailing commas. Test that your output parses with JSON.parse before sending.';

    // ─── CONTEXTO COMPLETO DEL ECOSISTEMA ───
    const { execSync } = require('child_process');
    const truncate = (s, n) => (s.length > n ? s.slice(0, n) + `\n... [truncado ${s.length - n} chars mas]` : s);

    // 1. CLAUDE.md (local o parent)
    let claudeMd = '';
    try {
      const candidates = [path.join(cwd, 'CLAUDE.md'), path.join(cwd, '..', 'CLAUDE.md')];
      for (const p of candidates) {
        if (fs.existsSync(p)) { claudeMd = fs.readFileSync(p, 'utf8'); break; }
      }
    } catch {}

    // 2. Notas de modulos Obsidian
    let modulesNotes = '';
    try {
      const modulosDir = path.join(cwd, '_docs', 'modulos');
      if (fs.existsSync(modulosDir)) {
        const files = fs.readdirSync(modulosDir).filter((f) => f.endsWith('.md'));
        for (const f of files) {
          const content = fs.readFileSync(path.join(modulosDir, f), 'utf8');
          modulesNotes += `\n--- _docs/modulos/${f} ---\n${truncate(content, 1500)}\n`;
        }
      }
      // Nota MOC principal si existe
      const mocPath = path.join(cwd, '_docs', 'Ecosistema IA - Caseteja.md');
      if (fs.existsSync(mocPath)) {
        modulesNotes += `\n--- _docs/Ecosistema IA - Caseteja.md ---\n${truncate(fs.readFileSync(mocPath, 'utf8'), 1500)}\n`;
      }
    } catch {}

    // 3. Subdirs del cwd (modulos reales)
    let dirListing = '';
    try {
      const entries = fs.readdirSync(cwd, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules').map((e) => e.name);
      if (dirs.length) dirListing = dirs.join(', ');
    } catch {}

    // 4. package.json (root + principales subdirs)
    let packageInfo = '';
    try {
      const rootPkg = path.join(cwd, 'package.json');
      if (fs.existsSync(rootPkg)) {
        const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        packageInfo += `\nROOT package.json: ${pkg.name}@${pkg.version}\nDeps: ${Object.keys(deps).slice(0, 30).join(', ')}`;
      }
    } catch {}

    // 5. Git state
    let gitState = '';
    try {
      const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const dirty = execSync('git status --porcelain', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const recentCommits = execSync('git log --oneline -8', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      gitState = `\nGit branch: ${branch || '(detached)'}\nDirty files (${dirty.split('\n').filter(Boolean).length}):\n${truncate(dirty, 800)}\n\nUltimos commits:\n${recentCommits}`;
    } catch {}

    const ecosystemContext = [
      claudeMd && `# CLAUDE.md\n${truncate(claudeMd, 6000)}`,
      modulesNotes && `# NOTAS DE MODULOS (_docs/modulos/)\n${truncate(modulesNotes, 8000)}`,
      packageInfo && `# DEPS INSTALADAS\n${packageInfo}`,
      gitState && `# GIT STATE\n${gitState}`
    ].filter(Boolean).join('\n\n');

    const conversationBlock = Array.isArray(conversation) && conversation.length
      ? `\n\nCONVERSATION HISTORY (past rounds of Q&A with user):\n${conversation.map((c) =>
          `[Round ${c.round}]\nYou asked:\n${(c.questions || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nUser answered (prose, may not address questions in order):\n${c.answer}`
        ).join('\n\n---\n\n')}\n\nIMPORTANT: Read the user's prose carefully and extract answers even if they don't map 1:1 to your questions. Only ask MORE questions if truly critical info is still missing.`
      : '';

    const contextBlock = ecosystemContext
      ? `\n\n=== ECOSYSTEM CONTEXT (CLAUDE.md del proyecto) ===\n${ecosystemContext}\n=== END ECOSYSTEM CONTEXT ===\n`
      : '';

    const dirBlock = dirListing
      ? `\n\nCARPETAS EXISTENTES EN ${cwd}: ${dirListing}\n`
      : '';

    const userMessage = `You analyze project descriptions and either:
A) Ask clarifying questions if info is insufficient
B) Return decomposition if info is complete
${contextBlock}${dirBlock}
USE THE ECOSYSTEM CONTEXT to: identify existing tools/conventions/modules, reference real paths, avoid duplicating work that already exists, ensure the new subtasks integrate with what's already there.

PROJECT DESCRIPTION:
${description}

BASE FOLDER: ${cwd}${conversationBlock}

DECISION RULES:
- If you DON'T know: tech stack, target paths, project type (new/existing), or any critical detail → ask questions
- Ask ONLY what you need. Max 6 questions per round. Prefer 3-4.
- If you have ALL the info needed → return the decomposition

OUTPUT FORMAT (strict JSON, nothing else):

If need more info:
{"ready": false, "questions": ["Question 1?", "Question 2?", ...]}

If ready to decompose:
{
  "ready": true,
  "context": {
    "stack": "short description of tech stack",
    "basePath": "absolute path where project lives",
    "conventions": "naming and structure conventions",
    "shared": "any shared config/deps/state all subtasks must respect"
  },
  "subtasks": [
    {
      "title": "4-6 words",
      "desc": "1-3 actionable sentences",
      "cwd": "absolute or relative path under basePath",
      "dependsOn": [],
      "deliverable": "what files/outputs this subtask produces"
    }
  ]
}

RULES FOR SUBTASKS (when ready):
- Subtasks MUST touch DIFFERENT files/folders (no merge conflicts)
- 2-6 subtasks max
- Each subtask is self-contained
- dependsOn uses subtask titles
- cwd preferably absolute under basePath

Output ONLY the JSON object. Nothing else.`;

    // Usa tmpdir para evitar que claude cargue el CLAUDE.md del proyecto
    const spawnCwd = path.join(os.tmpdir(), 'termpro-decomposer');
    try { fs.mkdirSync(spawnCwd, { recursive: true }); } catch {}

    // Escribe el system prompt a archivo para evitar problemas de escape en Windows
    const sysFile = path.join(spawnCwd, `sysprompt-${Date.now()}.txt`);
    fs.writeFileSync(sysFile, systemPrompt, 'utf8');

    return new Promise((resolve) => {
      // shell: true + quoting manual para evitar EINVAL de Node 18+ con .cmd
      // El systemPrompt se pasa como arg (single-line). El userMessage por stdin (multi-line OK).
      const quote = (s) => `"${String(s).replace(/"/g, '""')}"`;
      const sysOneLine = systemPrompt.replace(/\n+/g, ' ').trim();
      const cmdLine = `claude -p --append-system-prompt ${quote(sysOneLine)}`;
      const proc = spawn(cmdLine, [], {
        cwd: spawnCwd,
        shell: true,
        windowsHide: true
      });
      proc.stdin.write(userMessage);
      proc.stdin.end();

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', (err) => resolve({ error: `spawn error: ${err.message}` }));
      proc.on('close', (code) => {
        try { fs.unlinkSync(sysFile); } catch {}
        if (code !== 0) {
          return resolve({ error: stderr.trim() || `claude exit code ${code}`, raw: stdout });
        }
        try {
          const parsed = extractJson(stdout);
          if (!parsed) return resolve({ error: 'No se encontro JSON valido en la respuesta', raw: stdout });
          if (parsed.ready === false && Array.isArray(parsed.questions)) {
            return resolve({ ok: true, ready: false, questions: parsed.questions });
          }
          if (parsed.ready === true && Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0) {
            return resolve({ ok: true, ready: true, context: parsed.context || {}, subtasks: parsed.subtasks });
          }
          resolve({ error: 'JSON recibido pero con estructura invalida (falta ready o subtasks)', raw: stdout });
        } catch (e) {
          resolve({ error: `parse error: ${e.message}`, raw: stdout });
        }
      });
      setTimeout(() => { try { proc.kill(); } catch {} }, 120000);
    });
  });

  ipcMain.handle('project:saveReport', async (_evt, { targetDir, slug, markdown }) => {
    try {
      const dir = targetDir;
      fs.mkdirSync(dir, { recursive: true });
      const date = new Date().toISOString().slice(0, 10);
      const file = path.join(dir, `proyecto-${slug}-${date}.md`);
      fs.writeFileSync(file, markdown, 'utf8');
      return { ok: true, path: file };
    } catch (err) {
      return { error: err.message };
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  for (const proc of sessions.values()) {
    try { proc.kill(); } catch (e) { /* ignore */ }
  }
  sessions.clear();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
