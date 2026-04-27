# TermPro — Spec de diseño UI/UX

> Interfaz de gestión multi-terminal con ergonomía de cliente de mensajería.
> Los terminales no son ventanas desechables, son conversaciones con tus proyectos.

## Concepto

TermPro convierte la experiencia de gestionar múltiples terminales (tipo Warp + Claude Code) en algo con la ergonomía visual de un cliente de mensajería. Cada terminal activo se comporta como un "chat" vivo: proyecto asociado, historial de comandos, estado (corriendo/idle/error), panel lateral con resumen.

Inspirado en: Warp (bloques comando+resultado), Slack (sidebar + search global), WhatsApp (unread badges + persistencia), Hyper (custom terminals).

## Estructura visual — 3 columnas

### Columna izquierda — Navegador (≈ 280px)

**Zona superior — Terminales activos (pinned)**
- Avatar/icono del proyecto (color o emoji, ej. 🐝 my-shop, 📊 analytics-pipeline)
- Nombre del proyecto + rama de Git activa en secundario
- Badge de estado: verde (idle), ámbar (corriendo), rojo (error/exit≠0), azul (esperando input)
- Contador de líneas no leídas (equivalente a "219 new")
- Checkmark azul si es el activo en vista central
- Botón "+ Nueva sesión"

**Zona inferior — Proyectos y buscador**
- Header "Proyectos" con contador + dropdown (recientes/favoritos/por carpeta)
- Buscador global `Cmd+K` que indexa: proyectos, historial de comandos, archivos tocados, outputs recientes
- Lista con metadata:
  - Último comando ejecutado
  - Indicador "typing..." cuando un comando corre en vivo
  - Timestamp de última actividad
  - Icono de tipo (Node, Python, Docker, etc.)
- Widget "LIVE" al fondo para procesos de larga duración (build, deploy, test) con tiempo transcurrido

### Columna central — Terminal activo (≈ flex, ~720px)

Terminal renderizado como conversación, no crudo monocromo.

**Header**
- Nombre proyecto + número de sesión ("Terminal 24")
- Acciones rápidas: limpiar (🧹), restart, kill, Claude bypass
- Avatares de colaboradores/agentes conectados (usuario + Claude Code u otro CLI agente)

**Flujo conversacional**
- Comandos del usuario → burbujas alineadas a la derecha
- Outputs del sistema → alineados izq con avatar del proyecto/agente
- Outputs largos (logs, stack traces) → bloques expandibles tipo acordeón
- Outputs multimedia = attachments:
  - Imagen generada → preview inline
  - Archivo nuevo → card con icono
  - JSON → syntax highlighting colapsable
  - Audios/grabaciones → voice message (waveform + play + duración)
- Reacciones con emoji por bloque: 👍 funcionó, 🔥 importante, 🐛 revisar, 📌 pin
- Timestamps relativos ("4m", "Today, 5 Jul")

**Input inferior (modo lectura — al scrollear arriba)**
- Textarea fijo con placeholder "Escribe tu mensaje" + Shift+Enter multilinea
- Indicador "1 unsaved draft" si comando a medio escribir
- Iconos: micrófono (dictar), attachment, enviar
- "Claude is typing..." cuando agente compone respuesta

### Columna derecha — Resumen de sesión (≈ 300px)

**Members**
- Usuario (rol "Creator")
- Agentes conectados (Claude Code, GPT-4o, etc.)
- Icono de voz para invocarlos

**Media**
- Grid de miniaturas: archivos, capturas, videos, outputs visuales
- Contador total + botón "ver todo"

**Tasks**
- Checklist auto-generada de tareas detectadas/asignadas
- Estados: por hacer / en progreso / completado / bloqueado
- Convertir cualquier mensaje del terminal en tarea con un click

**Resumen IA** (TL;DR)
- Generado por Claude Haiku cada N minutos (opt-in)
- Ejemplo: "En esta sesión: configuraste webhook X, corregiste bug en endpoint /users, desplegaste a staging. Pendiente: agregar tests."
- Exportar → Markdown, Notion, Google Doc

## Decisiones UX clave

1. **Estado persistente por terminal** — cerrar la app no mata sesiones (objetivo). Corren en daemon local y al abrir ves el diff (como WhatsApp)
2. **Unread counters reales** — badge rojo si un build terminó o test falló mientras mirabas otro terminal
3. **Búsqueda universal tipo Slack** — `Cmd+K` encuentra comando/output/error/archivo en cualquier sesión, proyecto, fecha
4. **Pinned messages / comandos favoritos** — comandos largos pineables al tope como snippet
5. **Multi-agente en la misma sesión** — usuario + Claude Code + otro agente, cada uno con avatar y color de burbuja
6. **Dark mode por defecto** — múltiples paletas, todas con buen contraste
7. **Responsive colapsable** — cols izq/der colapsan a iconos o se ocultan (modo enfoque)

## Flujos principales

1. **Onboarding** — conectar carpeta/proyecto, autorizar shell local
2. **Nueva sesión** — seleccionar proyecto → elegir shell (bash, PowerShell, zsh, Git Bash) → listo
3. **Cambiar entre terminales** — un click, estado preservado
4. **Invocar agente** — abrir Claude Code u otro CLI dentro del terminal
5. **Generar resumen** — automático cada X min o manual, exportable
6. **Compartir sesión** — link público sólo lectura con replay de la conversación (futuro)

## Notas visuales

- **Tipografía terminal central** — monoespaciada (JetBrains Mono / Fira Code / Geist Mono) para outputs, sans-serif para metadata de burbuja (timestamps, nombres)
- **Semántica de color** — verde éxito, rojo error, ámbar warning, azul info, aplicado a bordes de burbuja según exit code
- **Diff viewer inline** — cuando un comando modifica archivos, mostrar diff como card colapsable dentro del flujo

## Mapeo spec → fases

| Fase | Entregable | Estado |
|------|-----------|--------|
| 0 — Scaffold | Electron + 3 columnas Tailwind | ✅ Hecho |
| 1 — Shell Core | bash real con xterm.js + node-pty | ✅ Hecho |
| 2 — Multi-sesión | Sidebar con tabs, switch preserva estado | ✅ Hecho |
| 3 — Block parsing | Outputs agrupados como bloques tipo Warp | ⏳ Falta |
| 4 — Chat style | Burbujas izq/der, timestamps, colores por exit code | ⏳ Falta |
| 5 — Proyectos + metadata | Auto-detecta proyecto por CWD, icono, unread counter | ✅ Parcial |
| 6 — Persistencia | SQLite, sesiones sobreviven cerrar app | ⏳ Falta |
| 7 — IA integrations | Resumen auto + agent multi-color | ⏳ Falta |
| 8 — Search + polish | `Cmd+K` global, toast nativos, rich media | ✅ Parcial |

### No cubierto aún

- Voice messages / grabación de sesiones
- Reacciones emoji por bloque
- Pinned commands / snippets favoritos
- Compartir sesión via link público read-only
- Diff viewer inline para comandos que modifican archivos
- Media grid en panel derecho
- Shell remoto via SSH

## Stack

- **Electron** — ventana nativa multiplataforma, proven para terminales
- **xterm.js** — estándar de facto (VS Code, Hyper, Warp)
- **node-pty** — PTY (NAPI, sin build tools)
- **Vite + React** — UI reactiva
- **Tailwind CSS** — estilos sin fricción
- **better-sqlite3** — persistencia (fase 6+)
- **Claude Haiku** (opt-in) — resúmenes IA (fase 7)

## Costo de ejecutar TermPro

- Desarrollo / uso personal: **$0** (todo OSS, reutiliza el shell del SO)
- IA opcional (Haiku para resúmenes): ~$1-2/mes con uso ligero
- Code signing (solo si distribuyes binarios firmados): $200-400/año
