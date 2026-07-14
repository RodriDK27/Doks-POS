# Dok's POS - Punto de Venta Familiar (Tablet-First)

Dok's POS es un sistema de punto de venta moderno, responsivo y táctil diseñado específicamente para ejecutarse en **tablets** y PCs. Cuenta con una interfaz intuitiva con tipografías legibles y colores cómodos, adaptada para personas mayores o sin experiencia técnica.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está dividido en dos partes principales que se comunican vía API REST:

1. **Frontend (Next.js 16 - App Router)**:
   - **Estilos**: Vanilla CSS y Tailwind CSS con una paleta clara en tonos Zinc/Slate y acentos en **Azul Índigo** y Emerald. Sin emojis en textos funcionales.
   - **Layout**: Diseño de Progressive Web App (PWA) con una barra de navegación inferior flotante (Floating Capsule Dock) de tamaño táctil XL.
   - **Estado Local**: Carrito de compras y multi-carritos reactivos gestionados en memoria mediante **Zustand**.
2. **Backend (NestJS + TypeScript)**:
   - **ORM**: Prisma Client.
   - **Base de Datos**: SQLite (`dev.db`), ligera y portable.
3. **Comunicación**: Axios con interceptores de errores.

---

## 📦 Módulos Funcionales del Sistema

### 1. Punto de Venta Táctil (POS) - `/pos`
- **Pestañas Táctiles**: Para tablets en formato vertical, el POS se divide en dos pestañas (`[Catálogo]` y `[Carrito]`) para optimizar espacio. En pantallas de PC se muestra en dos columnas automáticas.
- **Catálogo Táctil**: Cuadrícula de botones grandes con categorías autogeneradas.
- **Teclado Numérico en Pantalla**: Permite registrar "ventas libres" ingresando el costo directamente en la pantalla táctil (artículos genéricos sin código de barras).
- **Checkout**: Cálculo automático de cambio y selector rápido de métodos de pago.

### 2. Ventas en Espera (Multi-carrito)
- Permite "suspender" el carrito de compras actual asignándole un nombre (ej. *"Don Juan"*) para liberar la pantalla y atender al siguiente cliente.
- Muestra un botón indicador ámbar `"Espera (N)"` en el header cuando hay carritos retenidos.
- Modal de recuperación que lista las ventas en espera con sus desgloses de artículos y totales para reanudarlas o eliminarlas. Gestionado localmente en Zustand.

### 3. Arqueo y Control de Caja - `/register`
- Control de aperturas y cierres de turno de caja chica (captura de efectivo real en cajón).
- Registra discrepancias financieras (alertas de faltantes o sobrantes al cerrar).
- Permite registrar ingresos y egresos de efectivo manuales detallados (movimientos de caja).

### 4. Inventarios y Catálogo - `/inventory`
- Tabla responsiva con buscador rápido (nombre/código de barras) y filtro por stock crítico o categorías.
- Formulario de creación/edición de productos con cálculo automático del margen de utilidad antes de guardar.
- Oculta información sensible como precios de compra y márgenes ROI en viewports de móvil/tablet para mayor privacidad.

### 5. Compras y Proveedores (Integrado en Inventario)
- Catálogo de proveedores registrados (Bimbo, Coca-Cola, Sabritas, etc.).
- **Registrar Facturas de Compra**: Permite agregar productos del catálogo indicando costo unitario y cantidad recibida.
- **Acciones automáticas**:
  - Incrementa el stock de inventario.
  - Actualiza el precio de costo del producto en el catálogo al valor más reciente.
  - Si se paga desde caja chica, deduce el monto del balance del turno activo y genera un **EGRESO** en la bitácora financiera de forma transaccional en la base de datos.

### 6. Clientes y Fiados - `/customers`
- Directorio telefónico de clientes deudores.
- Indicador de consumo de línea de crédito (progreso visual de deuda activa vs límite).
- Estado de cuenta cronológico con historial completo de cargos y abonos.
- Formulario rápido de abonos de efectivo que liquida o disminuye la deuda.

### 7. Reporte de Utilidades y Utilidad Neta - `/reports`
- Rango de fechas rápido (Hoy, Últimos 7 días, Este mes, Personalizado).
- Calcula la **ganancia neta limpia** del negocio (Ingresos por ventas menos el costo real de adquisición de los productos vendidos).
- Muestra la distribución de ingresos por métodos de pago y el Top 5 de productos más rentables.

### 8. Tickets e Impresión Térmica - `/tickets`
- Bitácora completa de tickets vendidos históricamente.
- Visualizador de ticket digital simulando el papel de una miniprinter de recibos.
- **Impresión Térmica Aislada (`window.print`)**: Estilos CSS `@media print` que ocultan toda la aplicación (menús, botones, fondos) e imprimen únicamente el recibo ajustado a un ancho estándar de `80mm` o `58mm`.

### 9. Bloqueo por PIN de Seguridad (Control de Acceso)
- Intercepta las pantallas críticas (**Inventario, Reportes, Clientes**) bajo un protector de pantalla.
- Muestra un teclado numérico táctil de botones gigantes exigiendo el PIN de Administrador.
- **PINs Configurados**:
  - **Administrador**: `1234` (Acceso total).
  - **Cajero**: `0000` (Acceso exclusivo a POS y Caja).
- Botón **"Bloquear"** en la barra superior para cerrar la sesión de administrador rápidamente cuando el dueño se retira del mostrador.

---

## 📂 Estructura del Código

```text
Doks-venta/
├── backend/
│   ├── src/
│   │   ├── prisma/             # Conexión Prisma
│   │   ├── modules/
│   │   │   ├── auth/           # Validación de PINs de seguridad
│   │   │   ├── products/       # Catálogo de productos y categorías
│   │   │   ├── suppliers/      # CRUD de marcas/proveedores
│   │   │   ├── purchases/      # Facturas de adquisición y abasto
│   │   │   ├── customers/      # Líneas de crédito y abonos
│   │   │   ├── register/       # Arqueos e ingresos/egresos de caja
│   │   │   └── sales/          # Checkout de ventas y reportes de ganancias
│   │   └── app.module.ts       # Registro global de módulos
│   └── prisma/
│       └── schema.prisma       # Modelos del dominio SQL
└── frontend/
    ├── src/
    │   ├── app/
    │   │   └── (dashboard)/    # Vistas de la aplicación PWA
    │   │       ├── page.tsx    # Dashboard / Inicio
    │   │       ├── pos/        # Punto de Venta táctil
    │   │       ├── inventory/  # Inventario y Compras de Proveedores
    │   │       ├── customers/  # Libreta de deudores (Fiados)
    │   │       ├── register/   # Caja chica y Arqueos
    │   │       ├── reports/    # Reportes de ganancias netas
    │   │       └── tickets/    # Historial de recibos e impresión
    │   ├── components/
    │   │   └── PinLockGuard.tsx # Protector por teclado PIN
    │   └── store/
    │       ├── useCartStore.ts # Carrito activo y ventas suspendidas (Zustand)
    │       └── useAuthStore.ts # Rol de seguridad activo (Zustand persistido)
```

---

## 🚀 Instrucciones para Arrancar el Sistema

### 1. Iniciar el Backend
```bash
cd backend
npm install
npx prisma db push # Sincronizar DB en la primera ejecución
npm run start:dev
```
El servidor backend escuchará en `http://localhost:3001`.

### 2. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
```
El Punto de Venta abrirá en tu navegador en `http://localhost:3000`.
