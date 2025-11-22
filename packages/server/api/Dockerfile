FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN uv sync --frozen

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Run uvicorn with streaming-optimized settings
# --timeout-keep-alive 0: Disable keepalive timeout for long-running SSE streams
# --timeout-graceful-shutdown 120: Allow 120s for graceful shutdown
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --timeout-keep-alive 0 --timeout-graceful-shutdown 120"]
