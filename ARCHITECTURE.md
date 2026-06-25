# MotorCycleCoach Architecture

This document describes the architecture, component hierarchy, and the operational flows of the MotorCycleCoach system.

## System Component Diagram

The following flowchart illustrates the system component architecture and the flow of query orchestration:

```mermaid
graph TD
    classDef default fill:#F0EEFF,stroke:#9E8CFE,stroke-width:1px,color:#2A2359;
    classDef storage fill:#EAE6FF,stroke:#8B75FF,stroke-width:1.5px,color:#2A2359;

    React[Vite/React Dashboard]:::default
    FastAPI[FastAPI Backend main.py]:::default
    Agent[ADK Root Agent agent.py]:::default
    
    Qdrant[(Qdrant DB motorcycle_dmv_handbook)]:::storage
    Telemetry[TelemetryAdvisor]:::default
    Dataset[(reckless_rider_dataset.csv)]:::storage
    MCPServer[FastMCP Tool Server]:::default
    Gemini[Google GenAI API]:::default

    React -- "API Requests" --> FastAPI
    FastAPI -- "Triggers Session" --> Agent

    Agent -- "RAG search_handbook()" --> Qdrant
    Agent -- "analyze_telemetry()" --> Telemetry
    Agent -- "add_numbers()" --> MCPServer
    Agent -- "Gemini Model Call" --> Gemini

    Telemetry -- "Reads Ride Physics" --> Dataset
```

---

## Process Block Flow Diagram

The following block flow diagram outlines the pipeline steps a query traverses: from input ingestion, curriculum categorization, reasoning loops, retrieval-augmented database checks, FastAPI structural parsing, and final modular frontend rendering.

```mermaid
graph TD
    classDef default fill:#F0EEFF,stroke:#9E8CFE,stroke-width:1px,color:#2A2359;
    classDef storage fill:#EAE6FF,stroke:#8B75FF,stroke-width:1.5px,color:#2A2359;

    Input[User Input: Text or Voice Audio]:::default
    Classifier[NLP Classifier: Categorize DMV Topic]:::default
    Agent[Gemini ADK Agent: Formulate Action Plan]:::default
    Qdrant[(Qdrant DB: Retrieve Handbook Context)]:::storage
    Parser[FastAPI Parser: Extract Quiz, Telemetry, and Video tags]:::default
    UI[Interactive UI: Render synchronized dials & advice panels]:::default

    Input --> Classifier
    Classifier --> Agent
    Agent --> Qdrant
    Qdrant --> Agent
    Agent --> Parser
    Parser --> UI
```

---

## Component Communication Diagram

The following communication diagram illustrates the network relations and numbered call sequences occurring between modules (like UI, API Gateway, Agent, and Storage clusters) to handle and fulfill client queries.

```mermaid
graph TD
    classDef default fill:#F0EEFF,stroke:#9E8CFE,stroke-width:1px,color:#2A2359;
    classDef storage fill:#EAE6FF,stroke:#8B75FF,stroke-width:1.5px,color:#2A2359;

    React[React App - App.jsx]:::default
    FastAPI[FastAPI Backend - main.py]:::default
    Gemini[Gemini LLM Agent]:::default
    Qdrant[(Qdrant Vector DB)]:::storage
    LocalDocs[(Local Datasets & Handbooks)]:::storage

    React -- "1: POST /chat {prompt}" --> FastAPI
    FastAPI -- "2: Process Query" --> Gemini
    Gemini -- "3: Processed Advice text" --> FastAPI
    FastAPI -- "4: JSON {text, quiz, telemetry}" --> React

    FastAPI -- "5: Query Vector Search" --> Qdrant
    Qdrant -- "6: Similarity Matches" --> FastAPI

    FastAPI -- "7: Read Raw Data" --> LocalDocs
    LocalDocs -- "8: Sensor CSV Rows / PDF text" --> FastAPI
```

---

## Operational Workflows

### 1. Main Chat & RAG Flow (Text Query)

This flow illustrates how the system handles text queries, specifically highlighting how the agent evaluates user intent between basic identification/anatomy (e.g. *"What is throttle?"*) and hands-on skill learning (e.g. *"Teach me throttle technique"*):

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React UI (App.jsx)
    participant Backend as FastAPI (main.py)
    participant Classifier as Classifier (classifier.py)
    participant Agent as ADK Agent (agent.py)
    participant Tool as RAG Tool (rag.py)
    participant DB as Qdrant (Docker)

    User->>Frontend: Types query ("What is throttle" OR "Teach me throttle")
    Frontend->>Backend: POST /chat {prompt: "..."}
    Backend->>Classifier: classify_query(prompt)
    Classifier-->>Backend: Returns Category (e.g. "Basic Vehicle Control")
    Backend->>Agent: runner.run(agent, prompt)
    
    alt Intent: "What is throttle" (Anatomy Lookup)
        Agent->>Agent: Identify 'anatomy' intent & locate Right Handlebar illustration path
        Agent->>Tool: search_handbook("throttle location / basic controls")
        Tool->>DB: Similarity Search
        DB-->>Tool: Basic Handbook Page Snippets
        Tool-->>Agent: Returns text context
        Agent->>Agent: Generate response with Right Handlebar GIF path & Definition
    else Intent: "Teach me throttle" (Technique Masterclass)
        Agent->>Tool: search_handbook("throttle roll-on technique, wrist position")
        Tool->>DB: Similarity Search
        DB-->>Tool: Technical Handbook Snippets
        Tool-->>Agent: Returns text context
        Agent->>Agent: Generate response with [MASTERCLASS] JSON block (type: "throttle")
    end

    Agent-->>Backend: Final response string containing tags
    Backend->>Backend: Extract blocks (Anatomy Image path vs. [MASTERCLASS] JSON)
    Backend-->>Frontend: JSON response { response, videoAnalysis, quiz }
    
    alt Render: Anatomy Question
        Frontend-->>User: Display Right Handlebar Control GIF + definition table + text
    else Render: Masterclass Question
        Frontend-->>User: Load interactive VideoPlayer with throttle_technique.mp4 + synchronized telemetry
    end
```

### 2. Voice Input & Transcription Flow

This flow occurs when a user clicks the microphone button to record and ask a question via voice.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React UI (App.jsx)
    participant Backend as FastAPI (main.py)
    participant Gemini as Gemini API (2.0-flash)

    User->>Frontend: Speaks into microphone (clicks mic button)
    Frontend->>Frontend: Records audio chunks (audio/webm)
    User->>Frontend: Stops recording
    Frontend->>Backend: POST /transcribe {audio_data: "base64..."}
    Backend->>Gemini: Models.generate_content (audio bytes + transcription instructions)
    Gemini-->>Backend: Transcription text
    Backend-->>Frontend: {transcription: "..."}
    Frontend->>Frontend: Automatically calls sendMessage(transcription)
    Note over Frontend, Backend: Standard Chat & RAG Sequence begins
```

### 3. Video Player & Telemetry Synchronization Flow

This flow drives the interactive masterclass where the telemetry gauges and safety warnings change dynamically as the video plays.

```mermaid
sequenceDiagram
    participant User
    participant Player as Video Player (<video>)
    participant UI as VideoCoach Component
    participant Meta as VideoMetadata.js

    User->>Player: Plays Video (e.g. throttle_technique.mp4)
    loop Every 250ms (onTimeUpdate)
        Player->>UI: Emits currentTime
        UI->>Meta: Find step matching currentTime (e.g. time >= 25s)
        Meta-->>UI: Returns step telemetry & description
        UI->>UI: Update currentStep state
        UI->>UI: Render gauges (Speed, Smooth Roll, Lean)
        UI->>UI: Update Status box (e.g. "Rolling Throttle (Good)")
        UI->>UI: Update Coach advice panel text
    end
```

### 4. Ride Telemetry Analysis Flow

This sequence flow describes the initialization, sliding-window calculations, safety anomaly checks, and simulated data advancement within the telemetry evaluation module:

```mermaid
sequenceDiagram
    participant Agent as ADK Root Agent (agent.py)
    participant Advisor as Telemetry Advisor (telemetry_advisor.py)
    participant DB as CSV File (reckless_rider_dataset.csv)

    Note over Agent, Advisor: 1. Initialization (Singleton Setup)
    Agent->>Advisor: get_advisor() / analyze_telemetry()
    alt Advisor Instance not created yet
        Advisor->>DB: pd.read_csv("data/reckless_rider_dataset.csv")
        DB-->>Advisor: Load dataframe (df)
    end

    Note over Agent, Advisor: 2. Analysis Retrieval
    Advisor->>Advisor: Identify CURRENT_INDEX (e.g. 500)
    Advisor->>Advisor: Slice sliding window [index-20 : index]
    
    Note over Advisor: 3. Physics & Safety Assessment
    Advisor->>Advisor: Convert Speed (m/s -> km/h)
    Advisor->>Advisor: Calculate max lean angle (gyroscope y)
    Advisor->>Advisor: Check label_code (e.g., DA, AA)
    opt Danger Detected (e.g. Deceleration & Lean > 1.2 rad)
        Advisor->>Advisor: Append safety alerts (e.g. Aggressive Braking)
    end

    Advisor-->>Agent: Returns JSON-formatted analysis context

    Note over Agent, Advisor: 4. Simulation Advancement (Optional)
    Agent->>Advisor: advance_ride()
    Advisor->>Advisor: Increment CURRENT_INDEX by 200
    Advisor-->>Agent: "Simulation advanced to new index"
```

---

## Component Breakdown

### 1. Frontend (`/frontend`)
- **App.jsx**: The main control board. It coordinates the chat stream, holds local state (chat history, user input, loading status), and handles media recording for the microphone utility.
- **VideoCoach.jsx**: Coordinates play/pause states of the video demonstration and matches the playback time against known milestones to update telemetry cards.
- **TelemetryViz.jsx**: A specialized visualization card that renders a history chart and gauges using historical rider physics.
- **Quiz.jsx**: Handles interactive question-answering, displaying correct/wrong feedback, explanation banners, and scoring metrics.
- **Sidebar.jsx**: Displays the CA DMV-aligned learning path, updates mastery trackers out of 50 questions, and flags problem areas requiring focus.
- **index.css**: Houses the custom styling, grid layout, glassmorphism design, and animations.

### 2. Backend API Orchestration (`backend/src/coachagent/main.py`)
- **FastAPI**: Declares routing endpoints, handles CORS, logs timing data, and enforces token-based HTTP Bearer authentication.
- **InMemoryRunner**: Maintains Gemini session/context states across client requests.
- **Block Parsers**: Regexp-free tokenizers that split the raw Gemini output into modular fields (`response`, `sources`, `quiz`, `telemetry`, `videoAnalysis`).

### 3. AI Agent Logic (`backend/src/coachagent/agent.py`)
- **Google ADK Agent**: Instantiates a specialized agent using the instructions listed in `backend/motorcycle_coach_prompt.txt`.
- **Tools**: Binds RAG search capabilities (`search_handbook`), telemetry assessment (`analyze_telemetry`), and simulation steps (`advance_ride`) to the model execution context.

### 4. Semantic Classifier (`backend/src/coachagent/classifier.py`)
- **Gemini Query Classifier**: Takes incoming queries and maps them to one of the 10 official CA DMV curriculum topics. Used to dynamically route and attribute quiz scores to progress buckets.

### 5. RAG Intelligence (`backend/src/coachagent/rag.py`)
- **Vector Store**: Connects to the Qdrant instance.
- **Search Logic**: Runs vector similarity search via `GoogleGenerativeAIEmbeddings` using `models/gemini-embedding-001`.

### 6. Ride Telemetry Advisor (`backend/src/coachagent/telemetry_advisor.py`)
- **Data Source**: Parses `data/reckless_rider_dataset.csv`.
- **Analysis**: Calculates lean angles and speeds, detects aggressive acceleration/deceleration thresholds, and generates JSON blocks detailing safety violations (e.g., mid-corner braking).

### 7. Vector Database (Qdrant)
- **Mode**: Run via Docker container exposing port `6333`.
- **Index**: Stores embedded CA DMV Motorcycle Handbook chunks.
