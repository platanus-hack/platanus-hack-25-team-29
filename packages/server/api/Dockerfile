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

# Run the app
CMD uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT