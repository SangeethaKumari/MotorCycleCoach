import uvicorn
import asyncio
import logging
import os
import httpx
import time
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
from dotenv import load_dotenv

import google.adk.agents.llm_agent as llm_agent
from google.adk.runners import InMemoryRunner
from google.genai import types

# Import our root agent
from coachagent.agent import root_agent
from coachagent.rag import get_last_sources
from coachagent.classifier import classify_query

load_dotenv()

# ── Logging ───────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────
MCP_SERVER_URL  = os.getenv("MCP_SERVER_URL", "http://localhost:8001")
API_SECRET_TOKEN = os.getenv("API_SECRET_TOKEN", "your-secret-token")

security = HTTPBearer()

# ── Auth ──────────────────────────────────────────────
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != API_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return credentials.credentials

# ── Lifespan ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 MotorCycleCoach API starting up...")
    yield
    logger.info("🛑 MotorCycleCoach API shutting down...")

# ── App Init ──────────────────────────────────────────
app = FastAPI(
    title="MotorCycleCoach API",
    version="0.1.0",
    description="FastAPI service powering MotorCycleCoach — backed by Google ADK + MCP",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Logging ───────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response

# ── Global Error Handler ──────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# ── Pydantic Models ───────────────────────────────────
class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    message: Optional[str] = None # Support both
    user_id: str = "default_user"
    session_id: str = "default_session"

class TranscribeRequest(BaseModel):
    audio_data: str # Base64 audio data
    user_id: str = "default_user"
    session_id: str = "default_session"

class AddRequest(BaseModel):
    a: float
    b: float

class AddResponse(BaseModel):
    result: float
    operation: str

# ── Routes ────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "MotorCycleCoach API"}

@app.post("/chat")
async def chat(request_body: ChatRequest, token: str = Depends(verify_token)):
    message = request_body.prompt or request_body.message
    if not message:
        raise HTTPException(status_code=400, detail="No message or prompt provided")
    
    try:
        runner = InMemoryRunner(agent=root_agent)
        runner.auto_create_session = True
        new_message = types.Content(role="user", parts=[types.Part(text=message)])
        events = runner.run(user_id=request_body.user_id, session_id=request_body.session_id, new_message=new_message)
        
        full_response_text = ""
        for event in events:
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if part.text:
                        full_response_text += part.text
        
        # Extract Quiz Data if present
        quiz_data = None
        import re
        import json
        quiz_match = re.search(r'\[QUIZ\]\s*(.*?)\s*\[/QUIZ\]', full_response_text, re.DOTALL)
        if quiz_match:
            try:
                quiz_json_str = quiz_match.group(1).strip()
                quiz_data = json.loads(quiz_json_str)
                # FORCE THE CATEGORY FROM OUR HARD CLASSIFIER
                detected_category = classify_query(message)
                logger.info(f"📊 [BACKEND] Classifier results: {detected_category}")
                quiz_data["category"] = detected_category
                # Remove the quiz block from the text response
                full_response_text = re.sub(r'\[QUIZ\].*?\[/QUIZ\]', '', full_response_text, flags=re.DOTALL).strip()
            except Exception as parse_err:
                logger.warning(f"Failed to parse quiz JSON: {parse_err}")
        
        sources = get_last_sources()
        return {
            "response": full_response_text or "No response from agent",
            "sources": sources,
            "quiz": quiz_data
        }
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe(request: TranscribeRequest, token: str = Depends(verify_token)):
    """
    Transcribes audio data using Gemini.
    """
    try:
        import base64
        # Remove the data URL prefix if present
        if "," in request.audio_data:
            base64_data = request.audio_data.split(",")[1]
        else:
            base64_data = request.audio_data
        
        audio_bytes = base64.b64decode(base64_data)
        
        # We can use the agent's model to transcribe
        # Or just use the genai client directly for efficiency
        from google.genai import Client
        client = Client(api_key=os.getenv("GOOGLE_API_KEY"))
        
        audio_part = types.Part.from_bytes(
            data=audio_bytes,
            mime_type="audio/webm" # Frontend sends webm
        )
        
        response = client.models.generate_content(
            model="gemini-2.0-flash", # Use a model that supports audio
            contents=[types.Content(role="user", parts=[
                audio_part,
                types.Part(text="Please transcribe this audio exactly as spoken. Return ONLY the transcription.")
            ])]
        )
        
        transcription = response.text.strip()
        return {"transcription": transcription}
        
    except Exception as e:
        logger.error(f"Transcription Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tools/add", response_model=AddResponse)
async def call_add_tool(
    payload: AddRequest,
    token: str = Depends(verify_token)
):
    try:
        async with httpx.AsyncClient() as client:
            # We assume the MCP server is using HTTP or SSE and exposed at /mcp or similar.
            # However, for a simple proxy test, we'll try to follow the likely FastMCP structure.
            mcp_rpc_payload = {
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "add_numbers",
                    "arguments": {"a": payload.a, "b": payload.b}
                },
                "id": 1
            }
            # Note: The exact path depends on how FastMCP is running. 
            # If it's pure SSE, it might be different. 
            # For now, we'll point to /mcp which is the default for HTTP transport.
            response = await client.post(
                f"{MCP_SERVER_URL}/mcp",
                json=mcp_rpc_payload,
                timeout=10.0
            )
            
            if response.status_code == 404:
                # Try fallback or just report 404
                raise HTTPException(status_code=503, detail="MCP tool endpoint /mcp not found. Check transport/path.")
                
            response.raise_for_status()
            rpc_result = response.json()
            
            # Extract the result from JSON-RPC response
            if "error" in rpc_result:
                raise HTTPException(status_code=400, detail=str(rpc_result["error"]))
            
            # FastMCP tools usually return a list of content items.
            # We expect a dict with "result" and "operation".
            content = rpc_result.get("result", {}).get("content", [])
            if content and isinstance(content, list) and len(content) > 0:
                # Try to parse the text as JSON or just return it
                import json
                try:
                    return json.loads(content[0].get("text", "{}"))
                except:
                    return {"result": 0.0, "operation": content[0].get("text", "unknown")}
            
            return rpc_result.get("result", {})

    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="MCP server unreachable")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="MCP server timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Entry Point ───────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    ENV = os.getenv("APP_ENV", "dev")

    if ENV == "dev":
        logger.info("🔧 Running in DEV mode — hot reload enabled")
        # Note: using "coachagent.main:app" because of the package structure
        uvicorn.run("coachagent.main:app", host="0.0.0.0", port=8000, reload=True, workers=1, log_level="debug")
    else:
        logger.info("🚀 Running in PROD mode")
        uvicorn.run("coachagent.main:app", host="0.0.0.0", port=8000, reload=False, workers=4, log_level="warning")
