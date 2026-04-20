# TermPro

> Un terminal manager para gestionar múltiples sesiones de Claude Code en paralelo.

Pensado para quienes orquestan varios agentes/terminales a la vez y se perdían entre pestañas. Cada proyecto es una "conversación" en el sidebar, tipo cliente de mensajería. El centro es un terminal real (xterm + node-pty) — bash, zsh o PowerShell, corriendo tal cual.

## Descargar

**Windows 10/11** — bajá el instalador de la última Release:

- [TermPro-0.1.0-x64.exe](https://github.com/Metawardrove/termpro/releases/latest) — instalador NSIS (crea accesos directos)
- [TermPro-0.1.0-portable.exe](https://github.com/Metawardrove/termpro/releases/latest) — portable, no instala nada

El `.exe` no está firmado todavía, así que Windows SmartScreen muestra el warning "Windows protegió tu PC". Click en **Más información → Ejecutar de todos modos**. Si tenés Smart App Control activo (Win11), el Windows lo va a bloquear sin bypass — en ese caso usá la opción de correrlo desde código (más abajo).

**macOS / Linux** — por ahora solo desde código (`npm run dev`).

## Qué tiene

- **Terminal real** — corre `claude` CLI, `vim`, `htop`, dev servers, git. No es un wrapper.
- **Multi-sesión** paralela con atajos rápidos (Ctrl+1..9, Ctrl+Tab)
- **Sidebar estilo chat** — proyectos persistentes, drag-drop de carpetas, filtros, fijar favoritos
- **7 temas** intercambiables (Claude Night, Midnight Ink, Forest Terminal, Solar Flare, Synthwave, etc.)
- **Command Palette** ⌘K para saltar entre proyectos/sesiones/acciones
- **Modo enfoque** ⌘. para ocultar paneles y quedarte solo con el terminal
- **Atajos completos** — ⌘B (sidebar), ⌘J (panel derecho), Ctrl+= (zoom)

## Requisitos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com) (en Windows viene con Git Bash, necesario para bash)
- Windows 10/11, macOS, o Linux

## Instalación desde código (dev / macOS / Linux)

```bash
git clone https://github.com/Metawardrove/termpro.git
cd termpro
npm install
npm run dev
```

Se abre la ventana de TermPro sola. Al primer arranque sale un tutorial de 7 pasos — si lo saltás, lo reabrís con ⌘K → "Ver tutorial".

Para agregar tu primer proyecto: click en "+ Agregar proyecto" o arrastrá una carpeta desde tu explorador al sidebar.

## Para Claude Code u otro AI asistente

Si usás Claude Code, Cursor u otro AI para ayudarte a instalarlo, leé el archivo `CLAUDE.md` — tiene el contexto mínimo del proyecto.

## Problemas comunes

**"node-pty failed to load"** → corré `npm rebuild @homebridge/node-pty-prebuilt-multiarch` (o la versión actual de node-pty). Si persiste, asegurate de tener Git Bash instalado (Windows).

**El terminal se ve negro** → click adentro y tipea. Si no hay prompt, es porque el shell no arrancó bien. Abrí DevTools con Ctrl+Shift+I y revisá la consola.

**Windows Smart App Control bloquea** → no te pasa con `npm run dev` (corre bajo electron firmado por Microsoft). Solo bloquea .exe distribuidos sin firma.

## Atajos esenciales

| Atajo | Acción |
|-------|--------|
| `⌘K` / `Ctrl+K` | Búsqueda global (proyectos + sesiones + acciones) |
| `⌘B` | Toggle panel izquierdo |
| `⌘J` | Toggle panel derecho |
| `⌘.` | Modo enfoque (solo terminal) |
| `⌘,` | Ajustes |
| `Ctrl+Tab` | Ciclar sesiones |
| `Ctrl+1..9` | Ir a sesión N |
| `Ctrl+F` | Buscar en el terminal |
| `Ctrl+= / -` | Zoom del terminal |

## Contribuir

Fork + PR. Para bugs, abrí un issue con:
- Sistema operativo + versión
- Versión de Node.js (`node --version`)
- Screenshot o log de DevTools Console

## Licencia

MIT — usalo, modificalo, lo que quieras.

---

Hecho con cariño por [@mateo.camposv](https://github.com/Metawardrove) para la comunidad de ecommerce latam.
