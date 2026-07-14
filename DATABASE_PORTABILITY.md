# Portabilidad y Escalabilidad de Base de Datos (Dok's POS)

Este documento detalla el diseño de portabilidad de base de datos implementado en Dok's POS, el cual permite alternar fluidamente entre una base de datos local SQLite y motores en red de nivel empresarial como PostgreSQL o MySQL.

---

## 🛠️ Arquitectura Database-Agnostic

1.  **Cero Consultas Nativas (SQL Raw)**: El código del backend NestJS utiliza exclusivamente el Query Builder de Prisma Client (`this.prisma.product.findMany`, etc.). No se utiliza ninguna consulta nativa o sintaxis exclusiva de SQLite, lo que garantiza que todo el backend compilará y funcionará sin cambios en cualquier base de datos compatible con Prisma.
2.  **Detección de Conexión Dinámica**: La clase `PrismaService` inspecciona la variable de entorno `DATABASE_URL` al iniciar:
    *   Si detecta cadenas que inicien con `postgresql:`, `postgres:` o `mysql:`, desactiva el adaptador SQLite de forma automática y conecta a través del driver TCP nativo de Prisma.
    *   Si detecta un esquema `file:` o no hay valor, utiliza el adaptador local de alto rendimiento `@prisma/adapter-better-sqlite3`.

---

## 🚀 Cómo cambiar de SQLite a PostgreSQL / MySQL

Sigue estos sencillos pasos para escalar el almacenamiento de la aplicación:

### Paso 1: Cambiar el proveedor en Prisma
Ejecuta el script automatizado desde la raíz del proyecto para actualizar `schema.prisma`:
```bash
# Para cambiar a PostgreSQL:
node scripts/switch-database.js postgresql

# Para cambiar a MySQL:
node scripts/switch-database.js mysql

# Para regresar a SQLite:
node scripts/switch-database.js sqlite
```

### Paso 2: Actualizar las variables de entorno
Edita el archivo **[backend/.env](file:///c:/Users/Admin/Desktop/Proyectos/Doks-venta/backend/.env)** y modifica la variable `DATABASE_URL` con los accesos del nuevo motor:
```env
# Ejemplo PostgreSQL:
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/doks_db?schema=public"

# Ejemplo MySQL:
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/doks_db"
```

### Paso 3: Sincronizar y generar tipos
Navega a la carpeta de backend y ejecuta la generación de Prisma y la inserción de tablas:
```bash
cd backend
npx prisma generate
npx prisma db push
```

¡Eso es todo! El backend detectará la nueva cadena de conexión al iniciar y operará inmediatamente sobre tu base de datos centralizada, permitiendo que múltiples cajas registradoras y terminales compartan el mismo catálogo, inventarios y clientes en tiempo real.
