# Claude Agent Streaming Server

Minimal FastAPI server dedicated to Claude Agent SDK streaming, optimized for production deployment on Google Cloud Run.

## Architecture

This server is a **stripped-down, streaming-optimized** version of the main API server, containing ONLY:
- Claude Agent SDK streaming endpoint (`/api/agent`)
- Essential database tools for agent functionality
- Health check endpoint
- Optimized for Server-Sent Events (SSE) streaming

**Key Differences from Main Server:**
- ❌ No Fintoc integration
- ❌ No Supabase routes
- ❌ No token gatherer
- ❌ No movements endpoint
- ❌ No ngrok (was causing buffering issues)
- ✅ Only agent streaming with proper SSE configuration
- ✅ Uvicorn with `--timeout-keep-alive 0` for long streams
- ✅ Keepalive pings every 15 seconds
- ✅ Cloud Run optimized (60-minute timeout support)

## Why a Separate Server?

The original server had issues streaming SSE responses in production due to:
1. **ngrok buffering** - Proxies buffer HTTP responses, breaking real-time streaming
2. **Complex dependencies** - Fintoc and other routes added unnecessary complexity
3. **Cloud Run limitations** - Needed specific configuration for long-running streams

This minimal server solves all these issues by focusing solely on streaming.

## Local Development

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (fast Python package manager)

### Setup

1. **Clone and navigate:**
   ```bash
   cd packages/agent-streaming
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials
   ```

3. **Install dependencies:**
   ```bash
   uv sync
   ```

4. **Run development server:**
   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```

5. **Test streaming:**
   ```bash
   curl -X POST http://localhost:8000/api/agent \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, what is 2+2?", "system_prompt": "You are helpful", "max_turns": 10}' \
     --no-buffer
   ```

## Production Deployment on Google Cloud Run

### Why Cloud Run?

- ✅ **Native SSE streaming support** - No configuration needed
- ✅ **60-minute request timeout** - Sufficient for long agent interactions
- ✅ **Pay-per-use pricing** - Only pay when requests are being processed
- ✅ **Auto-scaling** - Scales from 0 to N instances automatically
- ✅ **Built-in HTTPS and load balancing** - No manual setup required
- ✅ **2nd gen environment** - Better network performance and full Linux compatibility

**Estimated Cost:**
- Low traffic (10k requests/month): $5-10
- Medium traffic (100k requests/month): $20-50
- High traffic (1M requests/month): $100-200

### Prerequisites

1. **Install Google Cloud SDK:**
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable required APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

### Deployment Steps

#### Option 1: Deploy from Source (Recommended)

This is the simplest method - Google Cloud Build creates the container for you.

```bash
cd packages/agent-streaming

gcloud run deploy agent-streaming-server \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --timeout 3600 \
    --execution-environment gen2 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars="ANTHROPIC_API_KEY=<your-api-key-here>,DATABASE_URL=<your-database-url-here>"
```

**Deployment Flags Explained:**
- `--source .` - Deploy from current directory (auto-builds container)
- `--region us-central1` - Choose region closest to your users
- `--allow-unauthenticated` - Public access (use `--no-allow-unauthenticated` to require auth)
- `--timeout 3600` - 60-minute max request timeout (maximum allowed by Cloud Run)
- `--execution-environment gen2` - Use 2nd generation for better performance
- `--cpu 2 --memory 2Gi` - Sufficient resources for Claude API calls
- `--min-instances 1` - Keep one instance warm (eliminates cold starts, ~$10/month)
- `--max-instances 10` - Maximum concurrent instances (adjust based on traffic)

#### Option 2: Using Google Secret Manager (Production-Recommended)

Store secrets securely instead of passing them directly:

```bash
# Create secrets
echo -n "your_anthropic_api_key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your_database_url" | gcloud secrets create database-url --data-file=-

# Deploy with secrets
gcloud run deploy agent-streaming-server \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --timeout 3600 \
    --execution-environment gen2 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 10 \
    --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest"
```

#### Option 3: Build and Deploy Container

For more control over the build process:

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/agent-streaming-server

# Deploy container
gcloud run deploy agent-streaming-server \
    --image gcr.io/YOUR_PROJECT_ID/agent-streaming-server \
    --region us-central1 \
    --allow-unauthenticated \
    --timeout 3600 \
    --execution-environment gen2 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 10 \
    --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest"
```

### Post-Deployment

#### 1. Get Service URL

```bash
gcloud run services describe agent-streaming-server \
    --region us-central1 \
    --format='value(status.url)'
```

Your service will be available at: `https://agent-streaming-server-RANDOM_HASH.run.app`

#### 2. Test Health Endpoint

```bash
curl https://YOUR_SERVICE_URL.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "anthropic_key_configured": true,
  "database_url_configured": true
}
```

#### 3. Test Streaming Endpoint

```bash
curl -X POST https://YOUR_SERVICE_URL.run.app/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is 2+2? Then tell me a joke.",
    "system_prompt": "You are a helpful assistant",
    "max_turns": 10
  }' \
  --no-buffer
```

You should see SSE events streaming in real-time:
```
data: {"type":"text","content":"2+2 equals 4"}

data: {"type":"text","content":"Here's a joke..."}

data: {"type":"done"}
```

### Update Deployment

To deploy updates:

```bash
# From packages/agent-streaming directory
gcloud run deploy agent-streaming-server \
    --source . \
    --region us-central1
```

Cloud Run will automatically build and deploy the new version with zero downtime.

### Cost Optimization

**Option 1: Always-On (Recommended for Production)**
- `--min-instances 1` - Keep one instance warm
- Cost: ~$7-15/month for idle instance
- Benefit: Zero cold start latency

**Option 2: Scale to Zero (Cost-Optimized)**
- `--min-instances 0` - Scale to zero when idle
- Cost: Only pay for active requests
- Tradeoff: 1-3 second cold start on first request

**Switch between options:**
```bash
# Scale to zero
gcloud run services update agent-streaming-server \
    --region us-central1 \
    --min-instances 0

# Always-on
gcloud run services update agent-streaming-server \
    --region us-central1 \
    --min-instances 1
```

## Monitoring and Debugging

### View Logs

```bash
# Stream logs in real-time
gcloud run services logs tail agent-streaming-server --region us-central1

# View recent logs
gcloud run services logs read agent-streaming-server --region us-central1 --limit 100

# Filter by severity
gcloud run services logs read agent-streaming-server --region us-central1 --severity ERROR
```

### Cloud Console

Navigate to: [Google Cloud Console → Cloud Run](https://console.cloud.google.com/run)

View metrics:
- Request count
- Request latency
- Error rate
- CPU and memory usage
- Active instances

### Common Issues

#### Issue: "Connection error" in client

**Cause:** Buffering or timeout issues

**Solution:**
1. Verify Cloud Run timeout is set to 3600s: `gcloud run services describe agent-streaming-server --region us-central1 --format='value(spec.template.spec.timeoutSeconds)'`
2. Check that client is using `--no-buffer` flag (for curl) or `signal: controller.signal` (for fetch)
3. Ensure keepalive pings are working (check logs for `:` comments every 15s)

#### Issue: Cold start latency

**Cause:** First request to a cold instance takes 1-3 seconds

**Solution:**
- Set `--min-instances 1` to keep instance warm
- Alternative: Use [Cloud Scheduler](https://cloud.google.com/scheduler) to ping health endpoint every 5 minutes

#### Issue: Out of memory

**Cause:** Agent conversations with large context

**Solution:**
- Increase memory: `gcloud run services update agent-streaming-server --region us-central1 --memory 4Gi`
- Or switch to higher CPU tier: `--cpu 4 --memory 4Gi`

#### Issue: Timeout after 60 minutes

**Cause:** Cloud Run maximum timeout is 3600 seconds (60 minutes)

**Solution:**
- For streams >60 minutes, consider Google Compute Engine or Kubernetes
- Or implement conversation chunking (break long sessions into multiple requests)

## Configuration Options

### Environment Variables

- `ANTHROPIC_API_KEY` (required) - Your Anthropic Claude API key
- `DATABASE_URL` (required) - PostgreSQL connection string for agent tools
- `PORT` (auto-set by Cloud Run) - Server port (defaults to 8080 locally)

### CORS Configuration

Default allows all origins. For production, edit `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ],  # Restrict to your frontend domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

## API Endpoints

### `POST /api/agent`

Stream agent responses using Server-Sent Events (SSE).

**Request:**
```json
{
  "prompt": "Your question or instruction",
  "system_prompt": "Optional system prompt (default: pre-configured)",
  "max_turns": 10
}
```

**Response:** SSE stream with events:

```
data: {"type":"text","content":"Response text chunk"}

data: {"type":"tool_use","name":"tool_name","input":{...},"id":"tool_id"}

data: {"type":"done"}
```

### `GET /`

Service information.

**Response:**
```json
{
  "service": "Claude Agent Streaming API",
  "status": "healthy",
  "version": "1.0.0"
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "anthropic_key_configured": true,
  "database_url_configured": true
}
```

## Architecture Details

### Streaming Implementation

The server uses **Server-Sent Events (SSE)** for real-time streaming:

1. **FastAPI StreamingResponse** - Yields events as they arrive from Claude
2. **Uvicorn with `--timeout-keep-alive 0`** - Disables keepalive timeout for long streams
3. **Keepalive pings every 15 seconds** - Prevents connection timeout during tool execution
4. **Proper SSE format** - `data: {json}\n\n` for each event

### Why SSE over WebSockets?

- **Simpler protocol** - One-way server → client (perfect for agent streaming)
- **Better compatibility** - Works over standard HTTP/HTTPS
- **Automatic reconnection** - Browsers handle reconnection automatically
- **Firewall-friendly** - No issues with corporate proxies

### Key Optimizations

1. **No ngrok** - Direct uvicorn → Cloud Run removes buffering proxy
2. **Minimal dependencies** - Only what's needed for agent streaming
3. **Streaming-specific uvicorn flags** - `--timeout-keep-alive 0`
4. **Cloud Run 2nd gen** - Better network performance
5. **Keepalive pings** - Prevents timeout during long tool execution

## Support

For issues or questions:
1. Check logs: `gcloud run services logs read agent-streaming-server --region us-central1 --severity ERROR`
2. Test locally first to isolate Cloud Run issues
3. Verify environment variables are set correctly
4. Check Cloud Run metrics in console

## License

Same as parent project.
