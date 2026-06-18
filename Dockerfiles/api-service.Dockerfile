# ============================================================
# DeepBlue – API Service (FastAPI)
# Multi-stage production Dockerfile
# ============================================================

FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================================
FROM python:3.12-slim AS runtime
# ============================================================

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="DeepBlue API Service" \
      org.opencontainers.image.description="FastAPI REST and GraphQL service for oceanographic data access" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

RUN groupadd --gid 1000 deepblue \
    && useradd --uid 1000 --gid deepblue --shell /bin/false --no-create-home deepblue

WORKDIR /app
COPY --chown=deepblue:deepblue . .

USER deepblue

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Gunicorn with Uvicorn workers for production
CMD ["gunicorn", "src.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8080", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "--timeout", "60", \
     "--graceful-timeout", "30", \
     "--keep-alive", "5"]
