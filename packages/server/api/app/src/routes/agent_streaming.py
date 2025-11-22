from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, TextBlock, ToolUseBlock, ToolResultBlock
from typing import AsyncIterator

router = APIRouter()

class AgentRequest(BaseModel):
    prompt: str
    system_prompt: str = "You are a helpful AI assistant."
    max_turns: int = 10

async def agent_stream(prompt: str, system_prompt: str, max_turns: int) -> AsyncIterator[str]:
    """Generator that yields SSE formatted messages from Claude Agent"""
    # IMPORT HERE or integrate properly the agent.py functions and/or related/needed code    

@router.get("/api/agent")
async def agent_endpoint(request: AgentRequest):
    """Main endpoint for streaming agent responses"""
    return StreamingResponse(
        agent_stream(request.prompt, request.system_prompt, request.max_turns),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable proxy buffering
        }
    )
