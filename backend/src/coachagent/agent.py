import os
from google.adk.agents.llm_agent import Agent
from coachagent.rag import search_handbook
from coachagent.telemetry_advisor import analyze_telemetry, advance_ride
from coachagent.server import check_helmet_certification, calculate_stopping_distance, get_t_clocs_checklist

# Load system prompt from file
prompt_path = os.path.join(os.path.dirname(__file__), "../../motorcycle_coach_prompt.txt")
with open(prompt_path, "r") as f:
    system_instruction = f.read()
print(f"🧠 [DEBUG] Loaded System Instruction (first 100 chars): {system_instruction[:100]}...")

# Define the root agent for MotorCycleCoach
root_agent = Agent(
    model='gemini-2.5-flash',
    name='motorcycle_coach',
    description='An expert motorcycle coach helping riders with technique, gear, and maintenance.',
    instruction=system_instruction,
    tools=[
        search_handbook, 
        analyze_telemetry, 
        advance_ride,
        check_helmet_certification,
        calculate_stopping_distance,
        get_t_clocs_checklist
    ]
)
