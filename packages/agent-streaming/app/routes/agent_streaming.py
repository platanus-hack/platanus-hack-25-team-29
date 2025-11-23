from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, TextBlock, ToolUseBlock
from typing import AsyncIterator
import json
import time
import logging

from app.tools import lucas_tools, SYSTEM_PROMPT, ALLOWED_TOOLS

logger = logging.getLogger(__name__)
router = APIRouter()


class AgentRequest(BaseModel):
    prompt: str
    system_prompt: str | None = None
    max_turns: int = 10


class AgentResponse(BaseModel):
    messages: list[dict]
    error: str | None = None


async def agent_stream(
    prompt: str, system_prompt: str | None, max_turns: int
) -> AsyncIterator[str]:
    """Generator that yields SSE formatted messages from Claude Agent"""
    try:
        logger.info(f"Starting agent stream for prompt: {prompt[:50]}...")

        # Create agent options with shared tools
        logger.info("Creating ClaudeAgentOptions...")
        options = ClaudeAgentOptions(
            model="claude-haiku-4-5",
            mcp_servers={"Tools": lucas_tools},
            permission_mode="bypassPermissions",
            continue_conversation=False,
            allowed_tools=ALLOWED_TOOLS,
            system_prompt=system_prompt or SYSTEM_PROMPT,
        )

        # Use async context manager for proper connection handling
        logger.info("Entering ClaudeSDKClient context...")
        async with ClaudeSDKClient(options=options) as client:
            logger.info("ClaudeSDKClient initialized successfully")
            # Send the user's query
            logger.info("Sending query to Claude...")
            await client.query(prompt)
            logger.info("Query sent, starting to receive responses...")

            # Track last activity time for keepalive pings
            last_ping = time.time()

            # Stream responses from Claude
            async for message in client.receive_response():
                # Send keepalive ping every 15 seconds to prevent connection timeout
                if time.time() - last_ping > 15:
                    yield ":\n\n"  # SSE comment (keepalive ping)
                    last_ping = time.time()

                if isinstance(message, AssistantMessage):
                    if message.content:
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                # Stream text content
                                event_data = {"type": "text", "content": block.text}
                                yield f"data: {json.dumps(event_data)}\n\n"
                                last_ping = time.time()  # Reset ping timer on activity

                            elif isinstance(block, ToolUseBlock):
                                # Stream tool usage information with metadata
                                event_data = {
                                    "type": "tool_use",
                                    "name": block.name,
                                    "input": block.input,
                                    "id": block.id,  # Include tool ID for tracking
                                }
                                yield f"data: {json.dumps(event_data)}\n\n"
                                last_ping = time.time()  # Reset ping timer on activity

            # Send completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        # Send error event
        error_event = {"type": "error", "message": str(e)}
        yield f"data: {json.dumps(error_event)}\n\n"


@router.post("/api/agent")
async def agent_endpoint(request: AgentRequest):
    """Main endpoint for streaming agent responses via SSE"""
    return StreamingResponse(
        agent_stream(request.prompt, request.system_prompt, request.max_turns),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )


@router.post("/api/agent/complete", response_model=AgentResponse)
async def agent_complete_endpoint(request: AgentRequest):
    """Non-streaming endpoint that returns complete agent response"""
    messages = []

    try:
        # Create agent options with shared tools
        options = ClaudeAgentOptions(
            model="claude-haiku-4-5",
            mcp_servers={"Tools": lucas_tools},
            permission_mode="bypassPermissions",
            continue_conversation=False,
            allowed_tools=ALLOWED_TOOLS,
            system_prompt=request.system_prompt or SYSTEM_PROMPT,
        )

        # Use async context manager for proper connection handling
        async with ClaudeSDKClient(options=options) as client:
            # Send the user's query
            await client.query(request.prompt)

            # Collect all responses from Claude
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    if message.content:
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                # Collect text content
                                messages.append({"type": "text", "content": block.text})

                            elif isinstance(block, ToolUseBlock):
                                # Collect tool usage information
                                messages.append(
                                    {
                                        "type": "tool_use",
                                        "name": block.name,
                                        "input": block.input,
                                        "id": block.id,
                                    }
                                )

        return AgentResponse(messages=messages, error=None)

    except Exception as e:
        # Return error in response
        return AgentResponse(messages=messages, error=str(e))
