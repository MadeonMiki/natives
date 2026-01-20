# Usamos la imagen oficial de Bun (ligera, basada en Alpine)
FROM oven/bun:1.0-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias para aprovechar la caché de capas de Docker
COPY package.json ./

# Copiamos el lockfile si existe (no falla el build si no está en el contexto)
# y usamos una instalación condicional que respeta el lockfile cuando esté presente.
# Instalamos dependencias: si hay `bun.lockb` usamos --frozen-lockfile, sino
# hacemos una instalación normal que generará la lockfile dentro del contenedor.
RUN if [ -f bun.lockb ]; then \
			bun install --frozen-lockfile; \
		else \
			bun install; \
		fi

# Copiamos el resto del código de la API
COPY . .

# Exponemos el puerto que configuraste en tu código (ejemplo: 3000)
EXPOSE 3000

# Comando para arrancar la API
# Si usas TypeScript directamente, Bun lo corre sin compilar aparte
CMD ["bun", "run", "server.ts"]