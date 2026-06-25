import time
from fastmcp import FastMCP

# ── Init ──────────────────────────────────────────────
mcp = FastMCP(
    name="MotorCycleCoach MCP Server",
    version="0.1.0"
)

# ── 1. Stopping Distance Calculator ───────────────────
@mcp.tool()
def calculate_stopping_distance(speed_mph: float, road_condition: str = "dry") -> dict:
    """
    Calculates the estimated stopping distance (in feet) based on speed and road surface.
    Useful for teaching space cushions, following distance, and collision avoidance.

    Args:
        speed_mph: Current speed of the motorcycle in mph.
        road_condition: Road surface type ('dry', 'wet', 'gravel', 'ice').
    """
    # 1.5 seconds typical perception time
    perception_distance = speed_mph * 1.467 * 1.5
    
    # 1.0 second typical reaction time
    reaction_distance = speed_mph * 1.467 * 1.0
    
    # Friction coefficients (mu)
    friction_factors = {
        "dry": 0.7,
        "wet": 0.4,
        "gravel": 0.35,
        "ice": 0.1
    }
    
    mu = friction_factors.get(road_condition.lower(), 0.7)
    
    # Braking distance formula: d = v^2 / (2 * g * mu)
    # v in ft/s, g = 32.2 ft/s^2
    velocity_fps = speed_mph * 1.467
    braking_distance = (velocity_fps ** 2) / (2 * 32.2 * mu)
    
    total_stopping_distance = perception_distance + reaction_distance + braking_distance
    
    return {
        "speed_mph": speed_mph,
        "road_condition": road_condition,
        "perception_distance_feet": round(perception_distance, 1),
        "reaction_distance_feet": round(reaction_distance, 1),
        "braking_distance_feet": round(braking_distance, 1),
        "total_stopping_distance_feet": round(total_stopping_distance, 1),
        "recommended_following_seconds": 3 if road_condition.lower() == "dry" else 5
    }

# ── 2. Helmet Certification Validator ─────────────────
@mcp.tool()
def check_helmet_certification(rating_agency: str, manufacturing_year: int) -> dict:
    """
    Validates if a helmet meets professional safety standards and checks its expiration status.
    Motorcycle helmets should generally be replaced every 5 years.

    Args:
        rating_agency: The safety rating certification ('DOT', 'ECE', 'SNELL').
        manufacturing_year: The year the helmet was manufactured.
    """
    current_year = 2026 # Sync with system time
    age = current_year - manufacturing_year
    expired = age >= 5
    
    rating = rating_agency.upper().strip()
    valid_agency = rating in ["DOT", "ECE", "SNELL"]
    
    status = "OK"
    recommendation = "Your helmet is certified and within its safe operational lifespan."
    
    if expired:
        status = "EXPIRED"
        recommendation = f"Your helmet is {age} years old. Helmets should be replaced every 5 years due to degradation of the protective EPS liner."
    elif not valid_agency:
        status = "INVALID"
        recommendation = "WARNING: Unrecognized certification. Helmets must meet DOT, ECE, or SNELL standards to be street legal."
        
    return {
        "rating_agency": rating,
        "manufacturing_year": manufacturing_year,
        "helmet_age_years": age,
        "status": status,
        "recommendation": recommendation,
        "legal_notice": "DOT certification is mandatory in the US. SNELL and ECE are voluntary but highly recommended safety ratings."
    }

# ── 3. MSF T-CLOCS Inspection Checklist ───────────────
@mcp.tool()
def get_t_clocs_checklist(category: str) -> dict:
    """
    Returns the pre-ride inspection checklist items for a given MSF T-CLOCS category.

    Args:
        category: The category to inspect ('Tires', 'Controls', 'Lights', 'Oils', 'Chassis', 'Stands').
    """
    checklists = {
        "tires": {
            "title": "Tires & Wheels",
            "items": [
                "Air Pressure: Check cold pressure matches manufacturer recommendations.",
                "Tread Depth: Verify sufficient tread; check for uneven wear.",
                "Cracks & Bulges: Inspect sidewalls and tread area for damage.",
                "Spokes & Rims: Check for bent rims or loose/broken spokes."
            ]
        },
        "controls": {
            "title": "Controls",
            "items": [
                "Handlebars: Turn full lock left and right to verify smooth movement.",
                "Levers & Pedals: Ensure pivot points are lubricated; verify cables aren't frayed.",
                "Hoses: Check throttle and brake lines for routing or leakage.",
                "Throttle: Verify throttle snaps back closed instantly from all steering positions."
            ]
        },
        "lights": {
            "title": "Lights & Electrics",
            "items": [
                "Battery: Check terminals for cleanliness and voltage level.",
                "Headlight: Test high and low beams.",
                "Tail/Brake Light: Verify operation using both front lever and rear pedal.",
                "Indicators: Check front and rear turn signals; test hazard lights.",
                "Mirrors: Clean and adjust mirrors for clear rear visibility."
            ]
        },
        "oils": {
            "title": "Oils & Fluids",
            "items": [
                "Engine Oil: Check oil level window or dipstick with bike upright.",
                "Gearbox Oil: Check levels if separate from engine.",
                "Brake Fluid: Check front and rear reservoir levels and fluid clarity.",
                "Coolant: Check reservoir level on liquid-cooled bikes."
            ]
        },
        "chassis": {
            "title": "Chassis & Frame",
            "items": [
                "Frame: Inspect welds, gussets, and look for visible cracks.",
                "Suspension: Check front forks for oil leaks; check rear shocks for damping.",
                "Drive Chain/Belt: Verify tension is within specifications; lubricate chain.",
                "Fasteners: Check critical nuts and bolts (axles, engine mounts) are tight."
            ]
        },
        "stands": {
            "title": "Stands",
            "items": [
                "Side Stand: Verify spring tension holds stand up; inspect safety cutoff switch.",
                "Center Stand: Check operation and spring tension (if equipped)."
            ]
        }
    }
    
    key = category.lower().strip()
    # Partial matching helper
    matched_key = None
    for k in checklists.keys():
        if k in key:
            matched_key = k
            break
            
    if not matched_key:
        return {
            "error": f"Category '{category}' not found.",
            "available_categories": list(checklists.keys())
        }
        
    return checklists[matched_key]

# ── Entry Point ───────────────────────────────────────
if __name__ == "__main__":
    mcp.run(transport="sse", host="0.0.0.0", port=8001)

