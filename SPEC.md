# TermPro — Spec de diseño UI/UX

> Interfaz de gestion multi-terminal con ergonomia de cliente de mensajeria.
> Los terminales no son ventanas desechables, son conversaciones con tus proyectos.

## Concepto

TermPro convierte la experiencia de gestionar multiples terminales (tipo Warp + Claude Code) en algo con la ergonomia visual de un cliente de mensajeria. Cada terminal activo se comporta como un "chat" vivo: proyecto asociado, historial de comandos, estado (corriendo/idle/error), panel lateral con resumen.

Inspirado en: Warp (bloques comando+resultado), Slack (sidebar + search global), WhatsApp (unread badges + persistencia), Hyper (custom terminals).

## Estructura visual — 3 columnas

### Columna izquierda — Navegador (≈ 280px)

**Zona superior — Terminales activos (pinned)**
- Avatar/icono del proyecto (color o emoji, ej. 🐝 Caseteja, 📊 La Milenaria)
- Nombre del proyecto + rama de Git activa en secundario
- Badge de estado: verde (idle), ambar (corriendo), rojo (error/exit≠0), azul (esperando input)
- Contador de lineas no leidas (equivalente a "219 new")
- Checkmark azul si es el activo en vista central
- Boton "+ Nueva sesion"

**Zona inferior — Proyectos y buscador**
- Header "Proyectos" con contador + dropdown (recientes/favoritos/por carpeta)
- Buscador global `Cmd+K` que indexa: proyectos, historial de comandos, archivos tocados, outputs recientes
- Lista con metadata:
  - Ultimo comando ejecutado
  - Indicador "typing..." cuando un comando corre en vivo
  - Timestamp de ultima actividad
  - Icono de tipo (Node, Python, Docker, N8N)
- Widget "LIVE" al fondo para procesos de larga duracion (build, deploy, test) con tiempo transcurrido

### Columna central — Terminal activo (≈ flex, ~720px)

Terminal renderizado como conversacion, no crudo monocromo.

**Header**
- Nombre proyecto + numero de sesion ("Terminal 24")
- Acciones rapidas: grabar (📹), compartir output (🔗), snapshot (📸), limpiar (🧹)
- Avatares de colaboradores/agentes conectados (tu, Claude Code, agente Paperclip, etc.)

**Flujo conversacional**
- Comandos del usuario → burbujas azules alineadas a la derecha
- Outputs del sistema → alineados izq con avatar del proyecto/agente
- Outputs largos (logs, stack traces) → bloques expandibles tipo acordeon
- Outputs multimedia = attachments:
  - Imagen generada → preview inline
  - Archivo nuevo → card con icono
  - JSON → syntax highlighting colapsable
  - Audios/grabaciones → voice message (waveform + play + duracion)
- Reacciones con emoji por bloque: 👍 funciono, 🔥 importante, 🐛 revisar, 📌 pin
- Timestamps relativos ("4m", "Today, 5 Jul")

**Input inferior**
- Campo con placeholder "Your command..." + autocomplete contextual
- Indicador "1 unsaved draft" si comando a medio escribir
- Iconos: microfono (dictar), attachment, enviar
- "Claude is typing..." cuando agente compone respuesta

### Columna derecha — Resumen de sesion (≈ 300px)

**Members**
- Usuario (rol "Creator")
- Agentes conectados (Claude Code, GPT-4o, agente Paperclip especifico)
- Icono de voz para invocarlos

**Media**
- Grid de miniaturas: archivos, capturas, videos, outputs visuales
- Contador total + boton "ver todo"

**Tasks**
- Checklist auto-generada de tareas detectadas/asignadas
- Estados: por hacer / en progreso / completado / bloqueado
- Convertir cualquier mensaje del terminal en tarea con un click

**Resumen IA** (TL;DR)
- Generado por Claude Haiku cada N minutos
- Ejemplo: "En esta sesion: configuraste webhook N8N, corregiste bug .first() en Update row, desplegaste a VPS. Pendiente: CORS en Respond to Webhook."
- Exportar → Markdown, Notion, Google Doc

## Decisiones UX clave

1. **Estado persistente por terminal** — cerrar la app no mata sesiones. Corren en daemon local/VPS y al abrir ves el diff (como WhatsApp)
2. **Unread counters reales** — badge rojo si un build termino o test fallo mientras mirabas otro terminal
3. **Busqueda universal tipo Slack** — `Cmd+K` encuentra comando/output/error/archivo en cualquier sesion, proyecto, fecha
4. **Pinned messages / comandos favoritos** — `docker exec openclaw-xam7-openclaw-1 ...` pineable al tope como snippet
5. **Multi-agente en la misma sesion** — usuario + Claude Code + agente Paperclip especializado, cada uno con avatar y color de burbuja
6. **Dark mode por defecto** — palette grises azulados + acentos azul electrico y naranja para alertas
7. **Responsive colapsable** — cols izq/der colapsan a iconos o se ocultan (modo foco)

## Flujos principales

1. **Onboarding** — conectar carpeta/proyecto, autorizar shell local o VPS remoto via SSH
2. **Nueva sesion** — seleccionar proyecto → elegir shell (bash, PowerShell, Warp, Claude Code) → listo
3. **Cambiar entre terminales** — un click, estado preservado
4. **Invocar agente** — `@claude` en input abre menu de agentes disponibles
5. **Generar resumen** — automatico cada X min o manual, exportable
6. **Compartir sesion** — link publico solo lectura con replay de la conversacion

## Notas visuales

- **Tipografia terminal central** — monoespaciada (JetBrains Mono / Fira Code / Geist Mono) para outputs, sans-serif para metadata de burbuja (timestamps, nombres)
- **Semantica de color** — verde exito, rojo error, ambar warning, azul info, aplicado a bordes de burbuja segun exit code
- **Diff viewer inline** — cuando un comando modifica archivos, mostrar diff como card colapsable dentro del flujo

## Mapeo spec → fases

| Fase | Entregable | Spec cubierto |
|------|-----------|---------------|
| 0 — Scaffold | Electron + 3 columnas Tailwind | **Hecho** (bones visuales) |
| 1 — Shell Core | bash real con xterm.js + node-pty | **En progreso** (bug: terminal no acepta input tras relanzar) |
| 2 — Multi-sesion | Sidebar con tabs, switch preserva estado | **En progreso** (sidebar basico existe) |
| 3 — Block parsing | Outputs agrupados como bloques comando+resultado tipo Warp | Falta |
| 4 — Chat style | Burbujas der/izq, timestamps, colores por exit code | Falta (core del spec) |
| 5 — Proyectos + metadata | Auto-detecta proyecto por CWD, icono, unread counter | Falta |
| 6 — Persistencia | SQLite, sesiones sobreviven cerrar app | Falta |
| 7 — IA integrations | `@claude` en input + resumen auto + agent multi-color | Falta |
| 8 — Search + polish | `Cmd+K` global, toast nativos, rich media | Falta |

### No cubierto aun por fases (agregar)

- Voice messages / grabacion de sesiones
- Reacciones emoji por bloque
- Pinned commands / snippets favoritos
- Compartir sesion via link publico read-only
- Diff viewer inline para comandos que modifican archivos
- Media grid en panel derecho
- Shell remoto via SSH (VPS)

## Stack

- **Electron** — ventana nativa Windows, proven para terminales
- **xterm.js** — estandar de facto (VS Code, Hyper, Warp)
- **@homebridge/node-pty-prebuilt-multiarch** — PTY sin build tools
- **Vite + React** — UI reactiva
- **Tailwind CSS** — estilos sin friccion
- **better-sqlite3** — persistencia (fase 6+)
- **Claude Haiku** — resumenes IA (fase 7, ~$1-2/mes)

## Costo

- Desarrollo: $0 (subscription Claude)
- Dependencias: $0 (OSS)
- Hosting: $0 (local)
- IA base: $0 (reusa CLI claude)
- IA API directa (opcional): ~$1-2/mes
- Code signing (solo si distribuyes): $200-400/año

**Uso personal: $0**
