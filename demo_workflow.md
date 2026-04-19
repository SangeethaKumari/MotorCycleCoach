# 🏁 MotorCycleCoach: Technical Workflow

## 1. System Architecture Overview
MotorCycleCoach is a multi-layered AI platform that combines **NLP Classification**, **Retrieval Augmented Generation (RAG)**, and **Ride Telemetry Analysis** into a single educational interface.

### The Tech Stack:
*   **Frontend**: React (Vite) with Glassmorphism UI.
*   **Backend**: FastAPI + Google Agent Development Kit (ADK).
*   **Intelligence**: Gemini 2.5 Flash.
*   **Knowledge Base**: Qdrant Vector Database (loaded with CA DMV Handbooks).
*   **Tools**: FastMCP (Protocol-based tool management).

---

## 2. The User Query Journey (Step-by-Step)

### Phase 1: Input & Intent Recognition
1.  **Entry**: User asks, *"How was my last U-turn?"* via Text or Voice.
2.  **Classification**: A specialized **Gemini Classifier** maps the query into one of 10 official DMV categories (e.g., *Basic Vehicle Control*).
3.  **Context Loading**: The **InMemoryRunner** retrieves the conversation history (session) to ensure the Coach remembers the user's previous questions.

### Phase 2: Tool Execution (Agentic Reasoning)
1.  **Decision**: The Agent realizes it needs **real data**. It calls:
    *   `analyze_telemetry()`: To see the physics of the user's turn (Speed, Lean, Accel).
    *   `search_handbook()`: To find the legal requirement for a U-turn on Page 24.
2.  **RAG Retrieval**: Qdrant performs a vector similarity search and provides clinical handbook snippets to the Agent.

### Phase 3: Synthesizing the Response
1.  **Comparison**: The Agent compares the **Telemetry (Evidence)** against the **Handbook (Law)**.
2.  **Instruction**: It generates a natural language response: *"Observation: You braked too early. The Handbook says... The Fix: Try this drill..."*
3.  **Block Generation**: The Agent wraps specialized data in tags:
    *   `[QUIZ]`: A 4-question challenge on U-turns.
    *   `[TELEMETRY]`: The raw physics data for the UI charts.
    *   `[MASTERCLASS]`: The specific U-turn demonstration video.

---

## 3. The Interactive Masterclass (Synchronized Learning)
Unlike standard video players, the Masterclass is **Data-Driven**:

*   **Mapping**: The Backend serves a stored `.mp4` file + a **Metadata JSON**.
*   **Sync**: As the video plays, the Frontend monitors the `currentTime`.
*   **Annotation**: When the video hits a "Technical Milestone" (e.g., 45s: Countersteering), the UI automatically pops up a **Lean Indicator** and **Safety Alert**.
*   **Advantage**: This creates a "Video Lesson with X-Ray Vision," showing the invisible forces (telemetry) during the visual demonstration.

---

## 4. Progress & Persistence
*   **Mastery Tracking**: Every correct quiz answer updates the **Learning Path** sidebar (e.g., `12/50 questions mastered`).
*   **Persistence**: Progress is saved via **LocalStorage** in the browser, and the **In-Memory Runner** in the backend maintains the conversational thread, ensuring a seamless experience across page refreshes.
