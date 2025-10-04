# Usar Node.js 18 como imagen base
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar ownership de archivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer el puerto
EXPOSE 5000

# Variable de entorno para producción
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]
