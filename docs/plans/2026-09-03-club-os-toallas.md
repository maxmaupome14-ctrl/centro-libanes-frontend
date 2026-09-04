# Club OS — Control de Toallas (y lo que sigue)

**Fecha:** 2026-09-03
**Estado:** Implementado en ramas `feat/toallas` (frontend + backend), pendiente de merge a `main`.
**Dirección de Max:** "que de aquí muevan TODO: control de toallas, todo". Cada operación del club pasa por la app.

---

## Por qué toallas primero

Las toallas son el proceso más frecuente del club (decenas de entregas al día, en dos sedes) y hoy no dejan rastro: nadie sabe cuántas hay, cuántas se pierden ni quién no las regresa. Es la forma más rápida de que vestidores use la app todos los días, y conecta con la tesis del **Wallet**: cada toalla que no regresa se convierte en un cargo al estado de cuenta, sin discusiones en el mostrador.

## Qué hace el módulo

### Vestidores (panel de empleado → pestaña **Toallas**)
- Identifica al socio por **QR** (`CL-MEMBER:{id}`), **número de socio** (`31505`, `CL-0001`) o **apellido**.
- Muestra la familia completa: se eligen toallas para el hijo, el cónyuge o el titular con un toque.
- **Entregar** 1–N toallas (máximo por persona configurable). Bloquea si la membresía está suspendida, si ya tiene el máximo o si no hay toallas limpias.
- **Recibir** toallas por préstamo, desde la ficha del socio o desde la lista "Sin devolver en {sede}".
- Stock en vivo de la sede: limpias / en uso / lavandería. Botón "Regresaron de lavandería".
- Acceso rápido desde el inicio del empleado (`/employee?tab=toallas`).

### Socio (inicio → **Toallas**, ruta `/towels`)
- Tarjeta con las toallas en su poder y la hora límite de devolución (rojo si ya venció).
- Toallas de su familia, reglas del club, historial y cargos por toallas no devueltas (con liga al estado de cuenta).
- Notificaciones in-app al recibir, al devolver, al vencer y al cobrar.

### Administración (Centro de Control → **Control Toallas**)
- Métricas: en uso, vencidas, perdidas del mes y cargos del mes.
- Inventario por sede con ajustes (lavadas → limpias, compra de nuevas).
- Tabla de todo lo que sigue afuera, con acciones **Recibir** y **Cobrar**.
- Botón "Procesar vencidas ahora" (corre el mismo proceso que el cron).

### Reglas (SystemConfig, editables en BD)
| Campo | Default | Significado |
|---|---|---|
| `towel_max_per_profile` | 2 | Toallas por persona al mismo tiempo |
| `towel_cutoff_hour` | 22:00 | Hora límite de devolución del mismo día |
| `towel_grace_days` | 1 | Días de gracia después del corte antes de cobrar |
| `towel_fee_lost` | $150 | Cargo por toalla no devuelta (tipo de pago `toalla`) |

### Ciclo de vida
`prestada` → `devuelta` | `vencida` (pasó el corte) → `devuelta` (regresó tarde, sin cargo) | `cobrada` (agotó la gracia → cargo al estado de cuenta y la toalla pasa a "perdidas"). Cron cada 30 min.

## Backend
- Modelos `TowelStock` (por sede) y `TowelLoan` (por préstamo). Migración `20260904003304_add_towel_control`.
- Rutas `/api/towels`: `my`, `resolve`, `issue`, `:id/return`, `:id/charge`, `open`, `stock`, `stock/:unitId`, `summary`, `process-overdue`, `config`.
- El estado de cuenta ya agrupa pagos por tipo, así que los cargos `toalla` aparecen solos; el front agrega el filtro "Toallas".
- Seed: stock Hermes 300 / Fredy Atala 200 y staff "Toallas Hermes" / "Toallas Atala" (rol `vestidores`, password dev `1234`).

---

## Roadmap "todo desde la app" (candidatos, en orden sugerido)

| # | Módulo | Quién lo usa | Qué digitaliza | Esfuerzo |
|---|---|---|---|---|
| 1 | **Toallas** ✅ | Vestidores, socio, admin | Préstamo, devolución, stock, cargos | Hecho |
| 2 | **Caja / kiosco** | Señoras de caja | Confirmar pagos en efectivo/terminal desde la app, corte de caja diario | Medio |
| 3 | **Estacionamiento** | El del estacionamiento | Entrada/salida por QR o placa, cupo por sede, cargo a socios/invitados | Medio |
| 4 | **Préstamo de equipo** | Vestidores / canchas | Raquetas, pelotas, tablas — mismo motor que toallas (préstamo + cargo) | Bajo |
| 5 | **Incidencias y mantenimiento** | Todo el staff | Reporte con foto (regadera rota, cancha mojada), seguimiento, historial | Bajo |
| 6 | **Objetos perdidos** | Recepción / socio | Alta con foto, búsqueda, entrega registrada | Bajo |
| 7 | **Lista de asistencia a clases** | Instructores | Pase de lista por QR, aviso a padres de menores | Medio |
| 8 | **Encuestas / NPS** | Socio | Calificación post-visita (ya hay ratings de staff/servicios) | Bajo |

Los módulos 4, 5 y 6 reutilizan casi todo lo construido para toallas (identificar socio, préstamo, cargo, notificación). El motor de "préstamo + cargo" es la pieza que vuelve a la app indispensable.
