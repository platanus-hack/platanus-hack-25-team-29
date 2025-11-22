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

# Create startup script that runs ngrok in background and uvicorn in foreground
RUN echo '#!/bin/bash\n\
# Start ngrok in the background if NGROK_AUTHTOKEN is set\n\
if [ ! -z "$NGROK_AUTHTOKEN" ]; then\n\
  ngrok config add-authtoken $NGROK_AUTHTOKEN\n\
  ngrok http $PORT --log=stdout > /tmp/ngrok.log 2>&1 &\n\
  echo "ngrok started in background"\n\
fi\n\
\n\
# Start uvicorn in the foreground (main process)\n\
exec uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script
CMD ["/app/start.sh"]
