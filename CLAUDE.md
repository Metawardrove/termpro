# TermPro — contexto para AI asistente

## Qué es

TermPro es una app Electron que permite gestionar múltiples sesiones de terminal en paralelo con UX tipo cliente de mensajería (WhatsApp-style sidebar de proyectos). Pensada principalmente para orquestar múltiples instancias de Claude Code en distintas carpetas.

## Stack

- **Electron 33** — container desktop
- **Vite + React 18** — renderer
- **Tailwind CSS** — styling
- **xterm.js** — emulador de terminal en canvas
- **node-pty** (oficial Microsoft, NAPI) — backend del shell

## Estructura

```
termpro/
├── electron/
│   ├── main.js           # Main process: PTY spawn, IPC, dialog picker
│   └── preload.js        # Expone window.termpro API al renderer
├── src/
│   ├── App.jsx           # Root: layout, state global, keyboard shortcuts
│   ├── theme.js          # 7 temas con CSS variables
│   ├── brand.jsx         # Monogram, Signature, AboutDialog
│   ├── components/
│   │   ├── Sidebar.jsx       # Lista de proyectos estilo chat
│   │   ├── TerminalView.jsx  # Wrapper de xterm
│   │   ├── DetailsPanel.jsx  # Panel derecho con timeline
│   │   ├── SettingsModal.jsx # Settings (font, shell, tema)
│   │   ├── v2.jsx            # WindowChrome, CenterHeader, Toast, etc.
│   │   └── onboarding.jsx    # Tutorial 7-step
│   └── index.css
├── index.html
├── package.json
└── README.md
```

## Cómo correr

```bash
npm install
npm run dev
```

Eso levanta Vite (puerto 5173) + Electron (apunta al vite server). Hot reload funciona en el renderer (cambios en src/). Para cambios en `electron/main.js` o `preload.js` hay que reiniciar (`Ctrl+C` + `npm run dev`).

## Build .exe

```bash
npm run dist       # genera release/TermPro-<version>-portable.exe + instalador NSIS
```

**Notas:**
- `npmRebuild: false` en electron-builder config (node-pty usa NAPI, no requiere rebuild para Electron)
- El .exe NO está firmado. Windows SmartScreen muestra warning pero permite bypass. Smart App Control de Win11 bloquea (requiere certificado de firma).
- Por esto recomendamos a la comunidad el path `npm run dev` sobre `.exe`.

## Estado actual (último deploy)

- Sistema de 7 temas con CSS vars (cambio en vivo)
- Sidebar WhatsApp-style con drag-drop folders, filtros, pin, reorder
- Chrome superior con BrandCompact + buscar (⌘K) + theme picker + focus + settings
- CenterHeader con avatar + status dot + cwd + acciones (clear/restart/kill)
- StatusBar inferior con shell + PID + unread
- Panel derecho con timeline de eventos tipado (comando/error/claude/notif)
- Command Palette fuzzy search (proyectos + sesiones + acciones)
- Onboarding 7 pasos con animaciones (Welcome, Terminal, Projects, Notif, Claude, Theme, Done)
- AboutDialog accesible desde click al wordmark o ⌘K → "Acerca de"
- Auto-detect de prompts de Claude **desactivado por default** (evita falsos positivos). Activable con env `TERMPRO_AUTODETECT=1` en dev, o settings en prod (próximo)
- Drag-drop folders desde Windows Explorer al sidebar
- Persistencia en localStorage: proyectos, tema, settings, estado colapsado/widths de paneles, onboarding seen flag

## Problemas conocidos

- En Electron 32+ la API `File.path` fue removida. Usamos `webUtils.getPathForFile()` vía preload. Requiere `sandbox: false` en webPreferences.
- Si el usuario tiene Smart App Control activo en Windows 11, el .exe no sirve. Solución: cloning desde git.
- El parser JSON del (deprecated) decomposer fallaba en edge cases — ese feature fue removido.

## Para modificar

- **Agregar tema nuevo** → editar `src/theme.js`, agregar entry al objeto `THEMES`. El picker los lista automáticamente.
- **Cambiar firma/autor** → editar `BRAND` const en `src/brand.jsx`.
- **Agregar acción en Command Palette** → agregar entry en `actions` array en `src/components/v2.jsx` (función `CommandPalette`), y handler en `App.jsx` onAction.
- **Tocar el onboarding** → `src/components/onboarding.jsx` tiene los 7 pasos. Cada paso tiene una demo animada.

## Autor

[@mateo.camposv](https://github.com/Metawardrove)
