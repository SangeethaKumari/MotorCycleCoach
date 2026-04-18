import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# The Official Class Labels from the USER
CATEGORIES = [
    "License & Legal Requirements",
    "Preparing to Ride",
    "Basic Vehicle Control",
    "Space Cushion",
    "SEE Strategy",
    "Collision Avoidance & Emergencies",
    "Handling Dangerous Surfaces",
    "Passengers & Cargo",
    "Group Riding",
    "Rider State & Safety"
]

RUBRIC = """
Classify the following motorcycle query into EXACTLY one of these categories:
1. License & Legal Requirements (Permits, CMSP training, age requirements)
2. Preparing to Ride (Gear, T-CLOCS, pre-ride checks, controls location)
3. Basic Vehicle Control (Shifting, braking operation, turning, U-turns)
4. Space Cushion (Lane positions, follow distance, lane splitting)
5. SEE Strategy (Search, Evaluate, Execute, situational awareness, intersections)
6. Collision Avoidance & Emergencies (Quick stops, swerving, mechanical failures, wobble)
7. Handling Dangerous Surfaces (Slippery roads, grooves, gratings, tracks)
8. Passengers & Cargo (Carrying weight, instructing passengers, loads)
9. Group Riding (Formations, communication)
10. Rider State & Safety (Alcohol, fatigue, drugs, insurance, BAC)

If it truly doesn't fit any, used "General".
Query: {query}

OUTPUT: Just the name of the category.
"""

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def classify_query(query: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=RUBRIC.format(query=query),
            config=types.GenerateContentConfig(
                temperature=0.0
            )
        )
        prediction = response.text.strip()
        # Verify it's in our list
        for cat in CATEGORIES:
            if cat.lower() in prediction.lower():
                return cat
        return "General"
    except Exception as e:
        print(f"⚠️ [CLASSIFIER ERROR] {e}")
        return "General"
