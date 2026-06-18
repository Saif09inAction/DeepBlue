# ============================================================
# DeepBlue – Ingestion Service
# Multi-stage production Dockerfile
# ============================================================

# Stage 1: Builder – install dependencies and compile
FROM python:3.12-slim AS builder

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

WORKDIR /build

# Install build tools needed for native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies into a prefix directory
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: Runtime – minimal production image
# ============================================================
FROM python:3.12-slim AS runtime

ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="DeepBlue Ingestion Service" \
      org.opencontainers.image.description="Kafka-based sensor data ingestion microservice" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/deepblue-research/deepblue-platform" \
      org.opencontainers.image.vendor="DeepBlue Research Institute" \
      maintainer="platform-team@deepblue.org"

# Install only runtime native library dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy pre-installed packages from builder
COPY --from=builder /install /usr/local

# Create non-root user and group
RUN groupadd --gid 1000 deepblue \
    && useradd --uid 1000 --gid deepblue \
       --shell /bin/false \
       --no-create-home \
       deepblue

WORKDIR /app

# Copy application code – owned by non-root user
COPY --chown=deepblue:deepblue src/ ./src/
COPY --chown=deepblue:deepblue alembic/ ./alembic/
COPY --chown=deepblue:deepblue alembic.ini .

# Create directories the app needs at runtime
RUN mkdir -p /tmp/deepblue && chown deepblue:deepblue /tmp/deepblue

USER deepblue

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8080 \
    METRICS_PORT=9090

EXPOSE 8080 9090

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health/live || exit 1

CMD ["python", "-m", "src.main"]
