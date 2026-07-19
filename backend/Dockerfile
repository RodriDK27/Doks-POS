# Etapa de compilación
FROM node:22-alpine AS builder

WORKDIR /app

# Definir URL ficticia para pasar validaciones de Prisma 7 durante la compilación
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias para compilar
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma y compilar NestJS
RUN npx prisma generate
RUN npm run build

# Etapa de producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Copiar package.json y prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar los archivos generados de Prisma y la carpeta dist compilada
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Comando para ejecutar migraciones y levantar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
