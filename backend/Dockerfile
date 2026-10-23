FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install dependencies into .venv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Activate virtualenv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

# Copy application and migration assets
COPY app/ ./app/
COPY migrations/ ./migrations/
COPY seed/ ./seed/
COPY scripts/ ./scripts/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
