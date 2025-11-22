Run with

```bash
uv run uvicorn app.main:app --reload
```


Deploy with (requires credentials)

```bash
gcloud run deploy platanus-grupo29 \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --timeout 3600 \
    --cpu 2 \
    --memory 2Gi \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars="DATABASE_URL=your_database_url,FINTOC_SECRET_KEY=your_fintoc_secret_key,FINTOC_PUBLIC_KEY=your_fintoc_public_key,LINK_TOKEN=your_link_token"
```

**Deployment flags explained:**
- `--timeout 3600`: 1 hour max request timeout (for long-running SSE streams)
- `--cpu 2 --memory 2Gi`: Better performance for Claude API calls
- `--min-instances 1`: Keep at least one instance warm (avoids cold starts)
- `--max-instances 10`: Allow scaling up to 10 concurrent instances

**Note:** ngrok has been removed from the production container as Cloud Run already provides a public URL. If you need ngrok for local development, run it separately:
```bash
# Terminal 1: Run the API server
uv run uvicorn app.main:app --reload

# Terminal 2 (optional): Run ngrok for tunneling
ngrok http 8000
```
