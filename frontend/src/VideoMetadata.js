export const CORNERING_STEPS = [
    {
        id: 1,
        time: 5,
        title: "Step 1: Move Your Eyes",
        description: "Everything begins with your eyes. Look on your intended path of travel.",
        telemetry: { lean: 0.1, speed: 45, status: "Looking Ahead" }
    },
    {
        id: 2,
        time: 25,
        title: "Step 2: Setup Position",
        description: "Prepare to enter from the outside of the road for a better line.",
        telemetry: { lean: 0.2, speed: 40, status: "Adjusting Line" }
    },
    {
        id: 3,
        time: 45,
        title: "Step 3: Active Countersteering",
        description: "Consciously push the handlebar. Push left to go left.",
        telemetry: { lean: 1.2, speed: 35, status: "Leaning (COUNTERSTEER)" }
    },
    {
        id: 4,
        time: 75,
        title: "Step 4: Controlled Slowing",
        description: "Roll off throttle to 0% until you are comfortable.",
        telemetry: { lean: 1.4, speed: 25, status: "Apex (SLOWEST POINT)" }
    },
    {
        id: 5,
        time: 105,
        title: "Step 5: Smooth Acceleration",
        description: "As you see the exit, start to stand the bike up and roll on.",
        telemetry: { lean: 0.5, speed: 45, status: "Exiting (ROLL ON)" }
    }
];

export const CLUTCH_MISTAKE_STEPS = [
    {
        id: 1,
        time: 5,
        title: "The Dead Space Mistake",
        description: "Pulling the clutch in 100% creates 'Dead Space'. You lose time and smoothness.",
        telemetry: { lean: 0.0, speed: 15, status: "Dead Space (100% Pull)" }
    },
    {
        id: 2,
        time: 20,
        title: "Finding the Friction Zone",
        description: "The engine only needs about a half-inch of travel to disengage. Learn your bite point.",
        telemetry: { lean: 0.0, speed: 10, status: "Friction Zone Entry" }
    },
    {
        id: 3,
        time: 40,
        title: "The High-RPM Stall",
        description: "Dumping the clutch too fast while at high RPM causes a jerky, dangerous launch.",
        telemetry: { lean: 0.0, speed: 2, status: "DANGER: CLUTCH DUMP" }
    },
    {
        id: 4,
        time: 60,
        title: "Smooth Shifting Technique",
        description: "Pull just past the friction zone, shift, and ease back out while rolling on throttle.",
        telemetry: { lean: 0.0, speed: 25, status: "Proper Shift Sync" }
    }
];

export const SPEED_ANALYSIS_STEPS = [
    {
        id: 1,
        time: 2,
        title: "Initial Acceleration",
        description: "Checking for smooth power delivery and balanced start. Good helmet position noted.",
        telemetry: { lean: 0.0, speed: 12, status: "Controlled Start" }
    },
    {
        id: 2,
        time: 5,
        title: "Establishing Pace",
        description: "Rider is maintaining a steady 15-18 km/h. This is an ideal speed for balance control.",
        telemetry: { lean: 0.0, speed: 18, status: "Optimal Practice Pace" }
    },
    {
        id: 3,
        time: 8,
        title: "Scanning Ahead",
        description: "Visual analysis shows the rider looking 10 feet ahead. Good safety awareness.",
        telemetry: { lean: 0.0, speed: 15, status: "Safe Eye Position" }
    },
    {
        id: 4,
        time: 12,
        title: "Controlled Deceleration",
        description: "Gentle roll-off to a stop. No sudden jerky movements detected. Excellent finish.",
        telemetry: { lean: 0.0, speed: 5, status: "Smooth Stop" }
    }
];

export const THROTTLE_STEPS = [
    {
        id: 1,
        time: 5,
        title: "The Static Grip Error",
        description: "Holding a static grip while accelerating forces your wrist into a dangerous, over-bent angle.",
        telemetry: { lean: 0.0, speed: 20, status: "Static Wrist Position (Bad)" }
    },
    {
        id: 2,
        time: 25,
        title: "The Inchworm Technique",
        description: "Use your fingers to 'roll' the throttle back. This maintains a neutral, strong wrist position.",
        telemetry: { lean: 0.0, speed: 45, status: "Rolling Throttle (Good)" }
    },
    {
        id: 3,
        time: 55,
        title: "Repositioning for More Power",
        description: "Reposition your hand to keep your elbow and wrist in line even for high-acceleration bursts.",
        telemetry: { lean: 0.0, speed: 85, status: "High Power / Neutral Wrist" }
    },
    {
        id: 4,
        time: 85,
        title: "Smooth Roll-Off",
        description: "Never snap the throttle shut. Maintain contact and let it slide back through your fingers smoothly.",
        telemetry: { lean: 0.0, speed: 40, status: "Controlled Roll-Off" }
    }
];
