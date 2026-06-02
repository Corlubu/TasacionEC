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

# 5. Copiamos los archivos de dependencias y Prisma
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# 6. Instalamos dependencias IGNORANDO los scripts automáticos (para que tsr no falle)
RUN pnpm install --ignore-scripts

# 7. Ahora sí, copiamos el resto de tu código al contenedor (incluyendo src/routes)
COPY . .

# 8. Ejecutamos los generadores manualmente, ahora que todo el código ya existe
RUN npx prisma generate
RUN npx tsr generate

# 9. Descargamos el navegador invisible de Playwright (Chromium)
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# --- NUEVO: VARIABLES TEMPORALES PARA PASAR LA VALIDACIÓN DE ZOD ---
ENV NODE_ENV="production"
ENV ADMIN_PASSWORD="dummy_password_temporal"
ENV JWT_SECRET="dummy_secret_temporal"
ENV GEMINI_API_KEY="dummy_key_temporal"
# (Añade esta también por si la pide: )
ENV DATABASE_URL="postgresql://postgres:dummy@dummy:5432/dummy"
# ------------------------------------------------------------------

# 10. Construimos la aplicación
RUN pnpm run build

# 11. Exponemos el puerto que usará Render
EXPOSE 3000

# 12. El comando que encenderá tu servidor
CMD ["pnpm", "start"]
