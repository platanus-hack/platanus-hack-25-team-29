Run with

```bash
uv run uvicorn main:app --reload
```


Deploy with (requires credentials)

```bash
gcloud run deploy platanus-grupo29 \    
     --source . \                                           
     --region us-central1 \                                                      
     --allow-unauthenticated 
```
