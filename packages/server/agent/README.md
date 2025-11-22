# Financial Agent - Supabase Integration

A Claude-based financial assistant agent that connects directly to Supabase for real-time financial data analysis.

## Architecture Overview

This agent uses a **direct Supabase connection** approach instead of going through an API layer:

```
Agent → Supabase Python Client → Supabase REST API → PostgreSQL
```

### Benefits:
- **Lower latency**: Direct database connection eliminates HTTP layer overhead
- **Token optimization**: ~47% reduction using Pydantic models and compact JSON responses
- **Type safety**: Runtime validation with Pydantic schemas
- **Simpler deployment**: No need to maintain separate API server for agent

## Setup

### 1. Install Dependencies

```bash
cd packages/server/agent
pip install -e .
```

This installs:
- `supabase-py` - Supabase Python client
- `pydantic` - Data validation and serialization
- `python-dotenv` - Environment variable management
- `claude-agent-sdk` - Claude Agent SDK

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Important**: The agent uses the **service role key** to bypass Row-Level Security (RLS). Keep this key secure and never commit it to version control.

### 3. Test the Connection

Before running the agent, verify your Supabase connection:

```bash
python test_db_connection.py
```

This will test:
- Environment variables
- Supabase client initialization
- Database connectivity
- Query methods (fetch, aggregate)
- Pydantic models

You should see output like:
```
✓ Environment variables loaded: PASS
✓ Supabase client created: PASS
✓ Query movements table: PASS
✓ Fetch movements (no filters): PASS
...
✅ All core tests passed!
```

If any tests fail, check the error messages for troubleshooting.

### 4. Run the Agent

Once tests pass, start the agent:

```bash
python agent.py
```

## Tools Available

### 1. `fetch_movements`
Retrieves movements from Supabase with filtering and pagination.

**Parameters:**
- `since` (optional): ISO 8601 date (YYYY-MM-DD) - movements >= this date
- `until` (optional): ISO 8601 date (YYYY-MM-DD) - movements <= this date
- `per_page` (optional): Results per page (default: 30, max: 300)
- `page` (optional): Page number (starts from 1)
- `confirmed_only` (optional): Show only confirmed movements (default: true)

**Returns:** Compact JSON with movement details

### 2. `aggregate_by_description`
Groups movements by description to analyze spending patterns.

**Parameters:**
- `since`, `until`, `confirmed_only` (same as above)
- `min_count` (optional): Minimum occurrences to show (default: 1)

**Returns:** JSON with aggregated spending by description

### 3. `aggregate_transfers_by_holder`
Groups transfer movements by recipient/sender.

**Parameters:**
- `since`, `until`, `confirmed_only` (same as above)
- `min_count` (optional): Minimum occurrences to show (default: 1)

**Returns:** JSON with aggregated transfers by holder

### 4. `get_date`
Returns current date and time in ISO 8601 format.

### 5. `calculate` & `compound_interest`
Mathematical calculation tools.

## Token Optimization

The agent uses several strategies to minimize token usage:

### Before (JSON file approach):
```
Movement 1:
  ID: mov_123
  Account ID: acc_456
  Amount: -15000
  Currency: CLP
  Description: Compra supermercado
  ...
```
**~150 characters per movement**

### After (Pydantic + Supabase):
```json
{
  "id": "mov_123",
  "account_id": "acc_456",
  "amount": -15000.0,
  "currency": "CLP",
  "description": "Compra supermercado",
  ...
}
```
**~80 characters per movement** (~47% reduction)

Additional optimizations:
- Exclude `null` fields with `model_dump(exclude_none=True)`
- Select only necessary columns in database queries
- Use compact aggregation responses

## Database Schema

The agent connects to these Supabase tables:

- `movements` - Financial transactions
- `fintoc_accounts` - Bank accounts
- `fintoc_links` - Bank connections
- `counterparties` - Transaction counterparties
- `users` - User accounts

See `packages/server/db/init/init.sql` for full schema.

## Migration from JSON

The old `list_movements` tool is **deprecated** but kept for backwards compatibility. It still reads from `example_data.json`.

The new `fetch_movements` tool replaces it with real-time Supabase data.

## File Structure

```
packages/server/agent/
├── agent.py                 # Main agent with tools
├── db_client.py             # Supabase client singleton
├── models.py                # Pydantic schemas
├── test_db_connection.py    # Connection test script
├── pyproject.toml           # Dependencies
├── .env.example             # Environment template
├── .env                     # Your credentials (gitignored)
└── README.md                # This file
```

## Troubleshooting

**First step:** Always run the test script to diagnose issues:
```bash
python test_db_connection.py
```

### "Missing SUPABASE_URL" error
- Ensure `.env` file exists in `packages/server/agent/`
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Run test script to verify environment variables

### "Database connection error"
- Verify Supabase credentials are correct
- Check that your Supabase project is running
- Ensure the service role key has proper permissions
- Test with: `python test_db_connection.py`

### "No movements found"
- Check that movements exist in your Supabase database
- Verify date filters are correct (use ISO 8601 format: YYYY-MM-DD)
- Try without filters first to ensure data exists
- Run test script to see sample data

### ImportError: No module named 'supabase'
- Install dependencies: `pip install -e .`
- Or manually: `pip install supabase pydantic python-dotenv`

## Development

### Adding New Tools

1. Create tool function in `agent.py`:
```python
@tool("tool_name", "description", {"param": str})
async def my_tool(args: dict[str, Any]) -> dict[str, Any]:
    # Implementation
    pass
```

2. Add to tools list:
```python
calculator_tools = create_sdk_mcp_server(
    tools=[..., my_tool]
)
```

3. Add to allowed_tools:
```python
allowed_tools=["mcp__Tools__my_tool", ...]
```

### Adding Database Queries

Add query methods to `SupabaseClient` in `db_client.py`:

```python
async def my_query(self, param: str) -> Dict[str, Any]:
    query = self.client.table("table_name").select("*")
    # Add filters...
    response = query.execute()
    return response.data
```

## Security Notes

- **Service Role Key**: Has full database access, bypasses RLS
- **Never commit** `.env` files to version control
- In production, consider implementing user-level authentication
- Rotate service keys regularly
- Monitor database access logs

## Performance Tips

- Use pagination for large result sets (`per_page`, `page`)
- Select only needed columns in queries
- Add database indexes for frequently filtered fields
- Use aggregation tools instead of fetching all movements for analysis

## Next Steps

Potential enhancements:
- Add user authentication (JWT tokens)
- Implement caching for frequent queries
- Add more aggregation tools (by category, by month, etc.)
- Create dashboard visualization tool
- Add budget tracking and alerts
