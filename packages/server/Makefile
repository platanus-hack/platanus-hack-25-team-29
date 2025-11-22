.PHONY: start stop

API_PORT ?= 8000

start: ## Inicia la API y ngrok
	@cd api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port $(API_PORT) & \
	echo $$! > .api.pid; \
	sleep 3; \
	ngrok http $(API_PORT) & \
	echo $$! > .ngrok.pid; \
	echo "API: http://localhost:$(API_PORT)"; \
	echo "Docs: http://localhost:$(API_PORT)/docs"; \
	echo "ngrok dashboard: http://localhost:4040"; \
	wait

stop: ## Detiene la API y ngrok
	@pkill -f "uvicorn app.main:app" 2>/dev/null || true
	@pkill -f "ngrok http" 2>/dev/null || true
	@rm -f .api.pid .ngrok.pid
	@echo "Servicios detenidos"

