# Usar Node.js 18 como imagen base
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Exponer el puerto
EXPOSE 5000

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]
