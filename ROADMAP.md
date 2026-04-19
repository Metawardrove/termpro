# TermPro — Roadmap

## Decision pendiente · Modelo de distribucion + monetizacion

**Estado:** diagnosticado, pendiente decidir si ejecutar o dejar como asset interno.

### Modelo propuesto (si se monetiza)

**Freemium con repo publico MIT en GitHub:**

- `github.com/mateocampos/termpro` — codigo OSS
- Binarios firmados en Releases (`.exe` Windows, `.dmg` Mac)
- Landing `termpro.dev` (o similar) con signup Pro
- Pro se activa via auth contra API propia (Stripe + cuentas)

### Split Free / Pro

**Free (generoso, nunca capar el core):**
- Sesiones ilimitadas, todos los atajos, temas, rename, drag-drop imagenes
- Notifications Claude + integracion local
- Settings locales, snippets hasta 5-10

**Pro ($7-9/mo):**
- Cloud sync multi-device (config, snippets, historial)
- Resumenes IA automaticos por sesion (Haiku)
- Snippets/workflows ilimitados
- Historial cross-sesion 30-90 dias + busqueda global
- Exports premium (Markdown/Notion/PDF)
- Multi-LLM (Claude + GPT + Gemini)

**Team ($15-20/user/mo):**
- Workspaces compartidos + admin
- Sesiones pair-programming
- Snippets de equipo, SSO/SAML

### Pasos concretos para ship-ready

| Item | Tiempo | Costo |
|------|--------|-------|
| App empaquetada + auto-update (electron-builder) | 2-3 sem | $0 |
| Code signing Windows cert | — | $200-400/año |
| Cloud sync backend (Supabase/Firebase) | 1 mes | $25-100/mo |
| Auth + billing (Clerk + Stripe) | 2 sem | 3% + $0.30/txn |
| IA backend pool Haiku | 2 sem | $50-500/mo variable |
| Landing + docs + onboarding | 2-3 sem | $0-200 |
| Marketing inicial (HN, Reddit, Twitter) | ongoing | $0 |
| **Total** | **3-4 meses focused** | **~$200-800/mo fijo** |

### Benchmarks realistas año 1

- 1000 instalaciones free con marketing ligero
- 2-4% conversion a Pro → 20-40 paying
- MRR: $140-360/mo
- Break-even: meses 12-18 si todo sale bien

### Decision criteria

**Ejecutar si:**
- TermPro se queda como side-bet de largo plazo
- Traccion organica > 500 usuarios en 3 meses con version free
- Mateo quiere posicionarse como autoridad tecnica AI en LATAM

**NO ejecutar si:**
- Caseteja tiene prioridad absoluta (mejor ROI)
- Mejor opcion: dejar como asset open source sin monetizar (lead magnet + credencial)

### Plan de arranque si se aprueba

1. Limpiar repo (README, LICENSE MIT, CONTRIBUTING, CODE_OF_CONDUCT)
2. Publicar en GitHub publico
3. Configurar `electron-builder` + CI de releases via GitHub Actions
4. Landing estatica en `termpro.dev` (3 dias)
5. Launch en HN + Reddit r/commandline + Twitter dev LATAM
6. Medir traccion 3 meses antes de construir Pro backend

---

## Otros pendientes del producto (sin decidir SaaS)

### Bugs/UX conocidos
- Ninguno reportado al 2026-04-16

### Fase 3 — Block parsing (spec)
Agrupar comandos+outputs como bloques tipo Warp. ~4h.

### Fase 4 — Chat style bubbles
Burbujas izq/der por quien habla (user vs shell/claude), colores por exit code. ~3h.

### Fase 6 — Persistencia SQLite
Sesiones sobreviven cerrar la app. Buffer + cwd + historia en disco.

### Fase 7 — IA resumen on-demand
Boton "Generar resumen IA" en DetailsPanel → Haiku → prose TL;DR exportable.

### Fase 8 — Cmd+K global search
Busqueda cross-sesion + rich media + share link.
