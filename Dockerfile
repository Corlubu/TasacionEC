# 1. Usamos una imagen oficial de Node.js ligera pero completa
FROM node:20-bullseye-slim

# 2. Instalamos OpenSSL (para Prisma) y las librerías gráficas para Playwright
RUN apt-get update && apt-get install -y \
    openssl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 3. Establecemos el directorio de trabajo
WORKDIR /app

# 4. Instalamos pnpm globalmente
RUN npm install -g pnpm

# 5. Copiamos solo los archivos de dependencias primero (para optimizar caché)
COPY package.json pnpm-lock.yaml* ./

# 6. Instalamos todas las dependencias
RUN pnpm install

# 7. Copiamos el resto de tu código al contenedor
COPY . .

# 8. Generamos el cliente de la Base de Datos (Prisma)
RUN npx prisma generate

# 9. Descargamos el navegador invisible de Playwright (Chromium)
RUN npx playwright install chromium

# 10. Construimos la aplicación (Vite/Vinxi preparará el frontend y backend para producción)
RUN pnpm run build

# 11. Exponemos el puerto que usará Render
EXPOSE 3000

# 12. El comando que encenderá tu servidor
CMD ["pnpm", "start"]
