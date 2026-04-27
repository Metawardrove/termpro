# TermPro — contexto para Claude Code u otro AI asistente

> Este archivo está pensado para que un AI asistente (Claude Code, Cursor, etc.) que clona el repo entienda el proyecto, ayude al usuario a instalarlo, y pueda contribuir cambios.

## Qué es

TermPro es una app de escritorio (Electron) que permite gestionar múltiples sesiones de terminal en paralelo con UX tipo cliente de mensajería: cada proyecto es una "conversación" en el sidebar, el centro es un terminal real (xterm + node-pty) corriendo bash, zsh, PowerShell, Git Bash o el shell que el usuario quiera. Pensada para orquestar varias instancias de Claude Code (u otro CLI agente) en distintas carpetas a la vez sin perder el hilo.

## Stack

- **Electron 33** — container desktop
- **Vite + React 18** — renderer
- **Tailwind CSS** — styling
- **xterm.js** — emulador de terminal en canvas
- **node-pty** (NAPI) — backend del shell

## Cómo instalar (lo que el usuario necesita correr)

Requisitos: Node.js 18+, Git. En Windows, también Git Bash (viene con el instalador de Git) si quiere usar `bash` como shell.

```bash
git clone https://github.com/Metawardrove/termpro.git
cd termpro
npm install
npm run dev
```

`npm run dev` levanta Vite (puerto 5173) + Electron apuntando a Vite. Hot reload funciona en el renderer; para cambios en `electron/main.js` o `preload.js` hay que reiniciar.

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
│   │   ├── TerminalView.jsx  # Wrapper de xterm + compose textarea + timeline rail
│   │   ├── DetailsPanel.jsx  # Panel derecho con timeline de eventos
│   │   ├── SettingsModal.jsx # Settings (font, shell, tema)
│   │   ├── v2.jsx            # WindowChrome, CenterHeader, CommandPalette, Toast, etc.
│   │   └── onboarding.jsx    # Tutorial 7 pasos
│   └── index.css
├── index.html
├── package.json
└── README.md
```

## Build .exe (opcional, solo Windows)

```bash
npm run dist       # genera release/TermPro-<version>-portable.exe + instalador NSIS
```

Notas:
- `npmRebuild: false` en electron-builder config (node-pty usa NAPI, no requiere rebuild para Electron)
- El `.exe` NO está firmado. Windows SmartScreen muestra warning pero permite bypass. Smart App Control de Win11 bloquea (requiere certificado de firma — ~$200-400/año).
- Por eso recomendamos a la comunidad el path `npm run dev` sobre `.exe` distribuido.

## Features actuales (v0.2.0)

**UX core:**
- 7 temas intercambiables con CSS variables (Claude Night, Midnight Ink, Forest Terminal, Solar Flare, Synthwave, etc.)
- Sidebar tipo chat con drag-drop de carpetas, filtros, pin, reorder
- Window chrome con búsqueda global ⌘K, theme picker, focus mode, settings
- CenterHeader con avatar de proyecto + status dot + cwd + acciones (clear / restart / kill / Claude bypass)
- StatusBar inferior con shell + PID + unread counter
- Panel derecho con timeline tipado (comando/error/Claude/notif)
- Command Palette fuzzy search sobre proyectos + sesiones + acciones
- Onboarding 7 pasos con animaciones
- AboutDialog accesible desde click al wordmark o ⌘K → "Acerca de"

**Terminal:**
- xterm.js con web-links, search, fit addons
- Bracketed paste — pegar texto multilinea se envía como **un solo paste** (no ejecuta cada `\n` como Enter), funciona con Claude Code, bash/readline, zsh, vim
- Chunking de pastes largas (2KB chunks, 10ms delay) para no saturar el input buffer del PTY

**Modo lectura/escritura cuando scrolleás arriba (v0.2.0):**
- Aparece un textarea fijo abajo para componer mensajes multilinea sin saltar el viewport
- Shift+Enter = nueva línea, Enter = envía, Esc = vuelve foco al terminal
- Compatible con dictado / Whispr / extensiones de teclado
- Auto-focus cuando el usuario scrollea arriba

**Timeline rail (v0.2.0):**
- Carril vertical con puntos a la derecha del terminal, uno por cada mensaje enviado
- Click en un punto salta a esa parte del scrollback
- Punto más reciente resaltado, anchors viejos se podan automáticamente

**Claude bypass button (v0.2.0):**
- Atajo en CenterHeader y Command Palette para lanzar `claude --dangerously-skip-permissions`
- Toast de advertencia rojo cuando se activa (recordatorio de que ejecuta sin pedir confirmación)

**Persistencia:**
- localStorage: proyectos, tema, settings, estado colapsado/widths de paneles, onboarding seen flag
- Drag-drop de carpetas desde el explorador del SO al sidebar

## Detección de Claude

- Auto-detect de prompts de Claude **desactivado por default** (evitaba falsos positivos). Activable con env `TERMPRO_AUTODETECT=1` en dev.

## Problemas conocidos

- En Electron 32+ la API `File.path` fue removida. Usamos `webUtils.getPathForFile()` vía preload. Requiere `sandbox: false` en webPreferences.
- Si el usuario tiene Smart App Control activo en Windows 11, el `.exe` distribuido no corre. Solución: clonar el repo y `npm run dev`.
- El parser JSON del (deprecated) decomposer fallaba en edge cases — ese feature fue removido.

## Para modificar (recetas comunes)

- **Agregar tema nuevo** → editar `src/theme.js`, agregar entry al objeto `THEMES`. El picker los lista automáticamente.
- **Cambiar firma/autor** → editar `BRAND` const en `src/brand.jsx`.
- **Agregar acción en Command Palette** → agregar entry en `actions` array en `src/components/v2.jsx` (función `CommandPalette`), y handler en `App.jsx` onAction.
- **Tocar el onboarding** → `src/components/onboarding.jsx` tiene los 7 pasos. Cada paso tiene una demo animada.
- **Cambiar comportamiento de paste** → bloque en `src/components/TerminalView.jsx` (búsca `bracketed-paste`).
- **Cambiar el textarea de compose** → mismo archivo, función `sendCompose` y bloque condicional `{scrolledUp && ...}`.

## Cómo ayudar al usuario (si sos un AI asistente)

1. Verificá `node --version` (≥18) y `git --version`. Si falta algo, sugerí instalación oficial (nodejs.org / git-scm.com).
2. Corré `npm install`. Si falla, probablemente sea node-pty — leé el error y sugerí `npm rebuild node-pty` o asegurate que el usuario tenga Git Bash en Windows.
3. `npm run dev` debe abrir la ventana en pocos segundos. Si la ventana sale en blanco, abrí DevTools (Ctrl+Shift+I) y revisá la consola.
4. Para el primer proyecto, el usuario puede arrastrar una carpeta al sidebar o clickear "+ Agregar proyecto".
5. Si el usuario quiere usar `claude` CLI dentro del terminal, asegurate que tenga Claude Code instalado globalmente (`npm i -g @anthropic-ai/claude-code` o el método que use).

## Licencia + autor

MIT. Hecho por [@mateo.camposv](https://github.com/Metawardrove).
