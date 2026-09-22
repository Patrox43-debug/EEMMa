FROM python:3.11-slim

# Evitar escritura de bytecode y habilitar salida en tiempo real de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para Pillow, ReportLab y comprobaciones de salud
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente completo
COPY . .

# Crear directorios para datos y archivos subidos
RUN mkdir -p /app/uploads /app/static /app/data

# Variables de entorno por defecto para persistencia fuera del contenedor efímero
ENV DB_PATH=/app/data/eemm.db
ENV UPLOADS_DIR=/app/uploads

# Declarar volúmenes persistentes para la base de datos y archivos subidos
VOLUME ["/app/data", "/app/uploads"]

# Puerto oficial de la aplicación en el contenedor
EXPOSE 8000

# Verificación de salud nativa de Docker para Coolify
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Iniciar servidor Uvicorn con soporte de proxy inverso (Traefik/Caddy en Coolify)
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips=*"]
