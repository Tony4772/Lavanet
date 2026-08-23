# LAVANET — POS/ERP para Lavandería

## Problem Statement
Sistema web completo POS/ERP para gestión integral de una lavandería en Perú (LAVANET). SPA moderna con 12 módulos funcionales, flujo end-to-end desde cliente → POS → orden → procesamiento → entrega → caja → reportes. Español, moneda PEN (S/), Yape/Plin.

## Architecture
- **Frontend-only** SPA (React + Tailwind + Shadcn UI + Recharts + Lucide + Sonner + react-router)
- Persistencia en **LocalStorage** (llaves: `lavanet_data_v1`, `lavanet_auth_v1`)
- Sin backend — todos los datos y auth son cliente-side (demo)

## User Personas
1. **Administrador** — Ve todo, gestiona usuarios/config
2. **Cajero** — POS, cierres de caja
3. **Recepción** — Recibe órdenes, gestiona clientes
4. **Operador** — Cambia estados de orden en el flujo de lavado

## Credentials (demo)
- admin / admin123
- cajero / cajero123
- recepcion / recepcion123
- operador / operador123

## Implemented Modules (Feb 2026)
1. Login con roles + acceso rápido demo
2. Dashboard con KPIs (ventas hoy/mes, pendientes, listas, ticket promedio) + 4 gráficos (área, pie, barras horizontales, barras verticales) + tabla de órdenes recientes
3. POS split izquierda (catálogo con búsqueda + filtro por categoría) / derecha (carrito, cliente, descuento, IGV, pago, **canje de puntos de fidelidad**) + creación rápida cliente + modal confirmación + ticket 80mm imprimible
4. Órdenes con tabla filtrable + vista detalle con timeline interactivo (8 pasos) para cambiar estado + **botón WhatsApp** para notificar cuando la orden esté lista
5. Clientes CRM con estadísticas por cliente (órdenes, gastado, promedio, última visita, **puntos de fidelidad**) + historial
6. Servicios (14 seed) CRUD por categorías (11)
7. Productos (7 seed) CRUD con alertas de stock bajo
8. Inventario con movimientos (entrada/salida/ajuste) + KPIs
9. Entregas — órdenes listas + confirmación + **link WhatsApp por fila**
10. **Modo Turno (nuevo)** — panel operativo Kanban con 7 columnas por etapa, filtro Mi turno / Ver todas, avance rápido de tarjetas
11. Caja — apertura, movimientos, cierre, KPIs por método de pago
12. Reportes — filtros por fecha, 6 gráficos, rentabilidad estimada + **Exportar CSV** + **Imprimir / PDF**
13. Usuarios — CRUD con roles + toggle activo
14. Configuración — Tabs (Negocio, Pagos, Impuestos, Estados, Notificaciones, Apariencia) + Restaurar demo

## Loyalty program
- 1 punto por cada S/ gastado (config: `loyalty.pointsPerSol`)
- 20 puntos = S/1 de descuento (config: `loyalty.pointsToSol`)
- Migración retroactiva: en primera carga, se calculan los puntos históricos de cada cliente
- Canjeable en el POS antes del IGV

## WhatsApp integration
- Deep-link `https://wa.me/51<phone>?text=<encoded msg>` (formato PE)
- Botón visible en detalle de Orden (estados "Lista para entregar" / "Entregada") y en cada fila de Entregas
- Mensaje pre-formateado con orden, total y fecha de entrega

## Design System
- Font headings: Manrope; body: IBM Plex Sans; ticket: JetBrains Mono
- Sidebar navy (#0F172A), primary #1A56DB, cards flat con border-slate-200
- Status badges: 9 estados con colores distintos según design_guidelines.json

## Backlog / Next Steps
- P1: PWA installable + notification permission for the daily-report reminder
- P1: Real backend + Resend integration for automatic daily emails
- P2: Modo oscuro
- P2: QR code on coupons for scan-based redemption
