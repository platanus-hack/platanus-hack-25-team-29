FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install ngrok
RUN apt-get update && apt-get install -y curl unzip && \
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
    tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
    tee /etc/apt/sources.list.d/ngrok.list && \
    apt-get update && apt-get install -y ngrok && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN uv sync --frozen

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Run uvicorn with streaming-optimized timeout settings, then ngrok
RUN echo '#!/bin/bash\n\
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 0 --timeout-graceful-shutdown 120 &\n\
sleep 3\n\
ngrok http $PORT --log stdout\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run both services
CMD ["/app/start.sh"]
