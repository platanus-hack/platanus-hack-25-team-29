Run with

```bash
uv run uvicorn main:app --reload
```


Deploy with (requires credentials)

```bash
gcloud run deploy platanus-grupo29 \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_URL=your_database_url_here,FINTOC_SECRET_KEY=your_fintoc_secret_key,FINTOC_PUBLIC_KEY=your_fintoc_public_key,LINK_TOKEN=your_link_token"
```
