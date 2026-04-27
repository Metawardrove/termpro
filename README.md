# TermPro

> Un terminal manager para gestionar múltiples sesiones de Claude Code (u otro CLI) en paralelo, con UX tipo cliente de mensajería.

Pensado para quienes orquestan varios agentes/terminales a la vez y se perdían entre pestañas. Cada proyecto es una "conversación" en el sidebar tipo WhatsApp. El centro es un terminal real (xterm + node-pty) — bash, zsh, Git Bash o PowerShell, corriendo tal cual.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform: Windows | macOS | Linux](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-lightgrey)

## Instalación recomendada (todas las plataformas)

```bash
git clone https://github.com/Metawardrove/termpro.git
cd termpro
npm install
npm run dev
```

Eso abre la ventana de TermPro. Al primer arranque sale un tutorial de 7 pasos — si lo saltás, lo reabrís con ⌘K → "Ver tutorial".

Para agregar tu primer proyecto: click "+ Agregar proyecto" o arrastrá una carpeta desde tu explorador al sidebar.

### Si usás Claude Code u otro AI asistente

Después de clonar, podés simplemente abrir una sesión de Claude Code (u otro AI CLI) en la carpeta del repo y pedirle:

> "Instalá TermPro siguiendo CLAUDE.md y ayudame a abrirlo"

El archivo `CLAUDE.md` tiene contexto pensado específicamente para que un AI asistente entienda el proyecto y guíe la instalación.

## Descarga directa (Windows)

Si preferís no compilar, podés bajar el binario de la última Release:

- [TermPro-x.y.z-x64.exe](https://github.com/Metawardrove/termpro/releases/latest) — instalador NSIS (crea accesos directos)
- [TermPro-x.y.z-portable.exe](https://github.com/Metawardrove/termpro/releases/latest) — portable, no instala nada

El `.exe` no está firmado, así que Windows SmartScreen muestra el warning **"Windows protegió tu PC"**. Click en **Más información → Ejecutar de todos modos**. Si tenés **Smart App Control** activo (Windows 11), Windows lo va a bloquear sin posibilidad de bypass — en ese caso usá el path `npm run dev` de arriba.

## Requisitos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com) (en Windows viene con Git Bash, recomendado para usar bash dentro de TermPro)
- Windows 10/11, macOS, o Linux

## Qué tiene

- **Terminal real** — corre `claude` CLI, `vim`, `htop`, dev servers, git. No es un wrapper.
- **Multi-sesión** paralela con atajos rápidos (Ctrl+1..9, Ctrl+Tab)
- **Sidebar tipo chat** — proyectos persistentes, drag-drop de carpetas, filtros, fijar favoritos
- **7 temas** intercambiables (Claude Night, Midnight Ink, Forest Terminal, Solar Flare, Synthwave, etc.)
- **Command Palette** ⌘K para saltar entre proyectos/sesiones/acciones
- **Modo enfoque** ⌘. para ocultar paneles y quedarte solo con el terminal
- **Bracketed paste** — pegar texto multilinea se trata como un solo paste (no ejecuta cada línea)
- **Compose textarea** cuando scrolleás arriba — escribí mensajes multilinea sin que el viewport te tire abajo (Shift+Enter)
- **Timeline rail** — puntos en el borde derecho del terminal, uno por cada mensaje, click para saltar al historial
- **Botón Claude bypass** — atajo a `claude --dangerously-skip-permissions` (con toast de advertencia)

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
| `Shift+Enter` | Nueva línea en compose textarea (modo escritura) |
| `Esc` | Volver foco al terminal desde compose textarea |

## Build .exe vos mismo (opcional)

```bash
npm run dist       # genera release/TermPro-<version>-x64.exe + portable + instalador NSIS
```

## Problemas comunes

**`node-pty` falla al instalar** → corré `npm rebuild node-pty`. En Windows, asegurate de tener Git Bash instalado.

**El terminal se ve negro** → click adentro y tipea. Si no hay prompt, abrí DevTools con Ctrl+Shift+I y revisá la consola.

**Windows Smart App Control bloquea el .exe** → no te pasa con `npm run dev` (corre bajo Electron firmado por Microsoft). Solo bloquea binarios distribuidos sin firma.

**Pegar texto largo se "ejecuta línea por línea"** → resuelto en v0.2.0 con bracketed paste. Si te pasa, asegurate que tu shell soporte bracketed paste (bash/zsh/PowerShell modernos sí).

## Contribuir

Fork + PR. Para bugs, abrí un issue con:
- Sistema operativo + versión
- Versión de Node.js (`node --version`)
- Screenshot o log de DevTools Console

## Licencia

MIT — usalo, modificalo, lo que quieras.

---

Hecho con cariño por [@mateo.camposv](https://github.com/Metawardrove) para la comunidad de devs LATAM.
