# MotorCycleCoach

MotorCycleCoach is an AI-powered assistant designed to help motorcyclists improve their riding skills, choose the right gear, and maintain their bikes. The project uses the Google Agent Development Kit (ADK) for agentic logic and Model Context Protocol (MCP) for tool integration.

## Project Structure

- `backend/src/coachagent/`: Core backend logic.
  - `agent.py`: Google ADK Agent definition (using Gemini 2.5 Flash).
  - `main.py`: FastAPI server that integrates the agent and proxies tool calls.
  - `server.py`: FastMCP server exposing tools (e.g., math utilities).
- `frontend/`: (Work in progress) Vite-based frontend.

## Prerequisites

- [uv](https://github.com/astral-sh/uv) (for Python package management)
- Python 3.13+
- A Google Gemini API Key

## Setup

1. **Clone the repository** (if not already done).
2. **Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   API_SECRET_TOKEN=your-secret-token
   MCP_SERVER_URL=http://localhost:8001
   ```
3. **Install Dependencies**:
   ```bash
   uv sync
   ```

## Running the Application

The application consists of two server components that need to be running simultaneously.

### 1. Start the MCP Server
The MCP server provides tools that the AI agent can use.
```bash
PYTHONPATH=backend/src uv run python -m coachagent.server
```
*Port: 8001*

### 2. Start the FastAPI Server
The FastAPI server is the main entry point for the application.
```bash
PYTHONPATH=backend/src uv run python -m coachagent.main
```
*Port: 8000*

## API Usage

### Chat with the Coach
Send a message to the MotorCycleCoach agent.

```bash
curl -X POST http://localhost:8000/chat \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"message": "How do I perform a low-speed U-turn?"}'
```

### Call a Tool (Proxy)
Directly call a tool exposed via the MCP server.

```bash
curl -X POST http://localhost:8000/tools/add \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"a": 10, "b": 20}'
```

## Development

- The backend uses `uvicorn` with hot-reload enabled in `dev` mode.
- To change the agent's behavior, edit `backend/src/coachagent/agent.py`.
- To add new tools, edit `backend/src/coachagent/server.py`.


## Issues when creating and integrating frontend and the backend .

The frontend wasn't loading initially because of two main reasons that we fixed:

1.  **Missing Entry Point (`index.html`)**: The `frontend` folder was missing the `index.html` file. In a Vite-based project, this file is the essential entry point that tells the browser how to load your React code. Without it, the server was simply returning a **404 Not Found** error.
2.  **Incomplete Project Initialization**: The `package.json` file was empty, which meant the essential tools like `vite`, `react-markdown`, and `remark-gfm` weren't installed or configured. I properly initialized the project and installed these dependencies so the development server could actually start and serve the application.

There was also a small backend hiccup where the `InMemoryRunner` was being initialized with an argument it didn't like, but that is also resolved now. 

You're all set to go! You can see everything is working perfectly in the current session.

