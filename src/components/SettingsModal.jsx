import React from 'react';

const FONT_OPTIONS = [
  '"JetBrains Mono", Consolas, monospace',
  '"Fira Code", Consolas, monospace',
  '"Cascadia Code", Consolas, monospace',
  '"Geist Mono", Consolas, monospace',
  'Consolas, monospace',
  'Menlo, Monaco, monospace'
];

const SHELL_OPTIONS_WIN = [
  { label: 'Git Bash', value: 'C:\\Program Files\\Git\\bin\\bash.exe' },
  { label: 'PowerShell', value: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
  { label: 'CMD', value: 'C:\\Windows\\System32\\cmd.exe' }
];

const THEME_PRESETS = [
  { name: 'TermPro Dark', bg: '#0b0d12', fg: '#e4e7eb', cursor: '#76b900' },
  { name: 'One Dark',     bg: '#282c34', fg: '#abb2bf', cursor: '#61afef' },
  { name: 'Solarized',    bg: '#002b36', fg: '#839496', cursor: '#93a1a1' },
  { name: 'Monokai',      bg: '#272822', fg: '#f8f8f2', cursor: '#f92672' },
  { name: 'Nord',         bg: '#2e3440', fg: '#d8dee9', cursor: '#88c0d0' }
];

export default function SettingsModal({ open, settings, onChange, onClose }) {
  if (!open) return null;

  const update = (patch) => onChange({ ...settings, ...patch });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-bg-800 border border-bg-600 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        <header className="px-5 py-4 border-b border-bg-600 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Configuracion</h2>
            <p className="text-[11px] text-gray-500">Se guarda en localStorage · persiste entre sesiones</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-lg">✕</button>
        </header>

        <div className="px-5 py-4 space-y-5 overflow-y-auto">
          <Field label="Font size">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="8" max="28" value={settings.fontSize}
                onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
                className="flex-1"
              />
              <span className="text-xs font-mono text-gray-300 w-8 text-right">{settings.fontSize}px</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Tambien: Ctrl+= / Ctrl+- / Ctrl+0 (reset)</p>
          </Field>

          <Field label="Font family">
            <select
              value={settings.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-sm text-gray-100"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f.split(',')[0].replace(/"/g, '')}</option>
              ))}
            </select>
          </Field>

          <Field label="Shell por defecto (Windows)">
            <select
              value={settings.shell}
              onChange={(e) => update({ shell: e.target.value })}
              className="w-full bg-bg-900 border border-bg-600 rounded px-2 py-1.5 text-sm text-gray-100"
            >
              {SHELL_OPTIONS_WIN.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">Aplica a nuevas sesiones</p>
          </Field>

          <Field label="Tema">
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => update({ theme: t })}
                  className={`p-2 rounded border text-left transition ${
                    settings.theme?.name === t.name
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-bg-600 hover:border-bg-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded" style={{ background: t.bg, border: `1px solid ${t.fg}` }} />
                    <span className="text-xs font-medium">{t.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ background: t.bg }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: t.fg }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: t.cursor }} />
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notificaciones">
            <Toggle
              value={!settings.mute}
              onChange={(on) => update({ mute: !on })}
              label="Sonido al detectar Claude / BEL"
            />
            <Toggle
              value={settings.nativeNotif !== false}
              onChange={(on) => update({ nativeNotif: on })}
              label="Notificaciones nativas Windows (cuando la app no esta en foco)"
            />
          </Field>

          <div className="pt-2 border-t border-bg-600">
            <p className="text-[11px] text-gray-500 mb-2">Atajos</p>
            <ul className="text-[11px] text-gray-400 space-y-0.5 font-mono">
              <li>Ctrl+Tab · sesion siguiente</li>
              <li>Ctrl+1..9 · salto directo</li>
              <li>Ctrl+C / Ctrl+V · copiar si hay seleccion / pegar</li>
              <li>Ctrl+F · buscar en buffer</li>
              <li>Ctrl+= / Ctrl+- / Ctrl+0 · font size</li>
              <li>Doble click nombre sesion · renombrar</li>
            </ul>
          </div>
        </div>

        <footer className="px-5 py-3 border-t border-bg-600 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-accent-blue hover:bg-accent-blue/90 text-white text-sm">Cerrar</button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      <span className="text-xs text-gray-300">{label}</span>
    </label>
  );
}
