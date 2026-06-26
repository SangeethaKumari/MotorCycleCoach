import pandas as pd
import os
import json

# Global simulation state
CURRENT_INDEX = 500  # Starting point in the master CSV

class TelemetryAdvisor:
    def __init__(self, csv_path="data/reckless_rider_dataset.csv"):
        self.csv_path = csv_path
        self.df = None
        self._load_data()

    def _load_data(self):
        # Resolve backup paths if the directory structure shifts (e.g. running from backend/ or on Render)
        if not os.path.exists(self.csv_path):
            for path in ["../data/reckless_rider_dataset.csv", "../../data/reckless_rider_dataset.csv", "backend/data/reckless_rider_dataset.csv"]:
                if os.path.exists(path):
                    self.csv_path = path
                    break

        if os.path.exists(self.csv_path):
            self.df = pd.read_csv(self.csv_path)
            print(f"✅ TelemetryAdvisor loaded {len(self.df)} rows from {self.csv_path}.")
        else:
            print(f"❌ TelemetryAdvisor: File not found at {self.csv_path}")

    def get_ride_context(self, index=None):
        """
        Analyzes a window of telemetry data around the given index.
        """
        if self.df is None:
            return "No telemetry data available."

        if index is None:
            global CURRENT_INDEX
            index = CURRENT_INDEX
        
        # Ensure index is within bounds
        index = max(20, min(index, len(self.df) - 1))
        
        # Get the previous 20 rows for context
        window = self.df.iloc[index-20:index+1].fillna(0)
        
        # Identify key events
        last_row = window.iloc[-1]
        label = last_row.get('label_desc', 'Unknown')
        label_code = last_row.get('label_code', '')
        
        # Physics sequence for charts
        history = []
        for _, row in window.iterrows():
            history.append({
                "t": round(float(row.get('Time (s)', 0)) - float(window.iloc[0].get('Time (s)', 0)), 2),
                "speed": round(float(row.get('Speed (m/s)', 0)) * 3.6, 1),
                "lean": round(float(row.get('gyroscope y', 0)), 3),
                "accel": round(float(row.get('Absolute acceleration', 0)), 2)
            })

        # Physics Assessment
        # Ensure we are working with finite numbers
        max_lean = float(window['gyroscope y'].abs().max())
        if not (0 <= max_lean < 100): # Sanity check for sensor spikes
            max_lean = 0.0
            
        is_braking_mid_corner = (label_code == 'DA') and (max_lean > 1.2)
        
        analysis = {
            "timestamp": round(float(last_row.get('Time (s)', 0)), 2),
            "status": label,
            "max_lean": max_lean,
            "current_speed": round(float(last_row.get('Speed (m/s)', 0)) * 3.6, 1),
            "is_dangerous": bool(is_braking_mid_corner or label_code in ['DA', 'AA']),
            "alerts": [],
            "history": history,
            "data_source": "Simulated Practice Ride"
        }
        
        if is_braking_mid_corner:
            analysis["alerts"].append("DANGER: Aggressive braking while leaned! High risk of low-side crash.")
        elif label_code == 'DA':
            analysis["alerts"].append("NOTICE: Aggressive deceleration detected. Ensure you are looking ahead.")
        elif label_code == 'AA':
            analysis["alerts"].append("NOTICE: Aggressive acceleration. Smooth throttle control is key.")

        return json.dumps(analysis)

# Singleton instance to avoid re-loading the CSV on every call
_advisor_instance = None

def get_advisor():
    global _advisor_instance
    if _advisor_instance is None:
        _advisor_instance = TelemetryAdvisor()
    return _advisor_instance

def analyze_telemetry():
    """
    Retrieves the physics context and safety alerts for the current moment in the ride.
    """
    advisor = get_advisor()
    return advisor.get_ride_context()

def advance_ride():
    """
    Advances the ride simulation to the next sequence of events.
    """
    global CURRENT_INDEX
    CURRENT_INDEX += 200 
    return f"Simulation advanced. You are now at a new point in the ride. Ask 'How is my performance now?' to see the updated data."
