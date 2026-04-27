# TermPro — Roadmap

## Estado actual (v0.2.0)

✅ Shell core funcionando con node-pty + xterm.js
✅ Multi-sesión con sidebar tipo chat
✅ 7 temas intercambiables
✅ Command Palette ⌘K
✅ Onboarding 7 pasos
✅ Bracketed paste (multilinea seguro)
✅ Compose textarea cuando scrolleás arriba (Shift+Enter)
✅ Timeline rail con puntos clickables por mensaje enviado
✅ Botón Claude bypass (`claude --dangerously-skip-permissions`)
✅ Drag-drop de carpetas desde el explorador del SO

## Próximas fases

### Fase 3 — Block parsing
Agrupar comandos+outputs como bloques tipo Warp (header con comando + body con output + footer con duración/exit code). Permite colapsar bloques largos y exportarlos individualmente.

### Fase 4 — Chat style bubbles
Burbujas izquierda/derecha por quien habla (usuario vs shell vs Claude), colores de borde por exit code, timestamps inline.

### Fase 5 — Proyectos + metadata enriquecida
Auto-detectar tipo de proyecto por CWD (Node / Python / Docker / Rust / Go), icono automático, unread counter persistente.

### Fase 6 — Persistencia SQLite
Sesiones sobreviven cerrar la app. Buffer + cwd + historial en disco. Re-attach al reabrir.

### Fase 7 — IA resumen on-demand
Botón "Generar resumen" en DetailsPanel → Claude Haiku → prose TL;DR exportable a Markdown/Notion.

### Fase 8 — Cmd+K global
Búsqueda cross-sesión en historial de comandos + outputs + archivos tocados. Replay de comandos viejos.

## Ideas exploratorias

- Voice messages / grabación de sesiones (snapshot exportable)
- Reacciones emoji por bloque para marcar comandos importantes
- Pinned commands favoritos como snippets reutilizables
- Compartir sesión via link público read-only (replay)
- Diff viewer inline para comandos que modifican archivos
- Shell remoto via SSH a VPS
- macOS / Linux builds firmados
- Auto-update (electron-builder + GitHub Releases)

## Filosofía de distribución

TermPro es **open source MIT**. Esto se queda así.

La forma recomendada de instalar es `git clone + npm run dev` — funciona en Windows, macOS y Linux, evita el problema de Smart App Control de Win11 (que bloquea ejecutables sin certificado de firma), y deja al usuario ver/auditar el código.

Los binarios `.exe` (NSIS + portable) están disponibles en cada Release de GitHub para usuarios Windows que prefieren no compilar — pero están sin firmar, así que Windows muestra warning de SmartScreen.

## Cómo contribuir

Fork → branch → PR. Para bugs:
- Sistema operativo + versión
- Versión de Node.js (`node --version`)
- Screenshot o log de DevTools Console
