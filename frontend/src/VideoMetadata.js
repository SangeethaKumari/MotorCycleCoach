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

export const FOOT_PLACEMENT_STEPS = [
    {
        id: 1,
        time: 10,
        title: "The Balls-of-Feet Neutral",
        description: "The primary safety position. Keep the balls of your feet on the pegs at all times.",
        telemetry: { lean: 0.0, speed: 45, status: "Neutral Toes-on-Peg" }
    },
    {
        id: 2,
        time: 35,
        title: "The 'Hanging Heel' Danger",
        description: "Resting your heels on the pegs risks catching your toes on road debris or during a lean.",
        telemetry: { lean: 0.5, speed: 60, status: "DANGER: Heel Riding" }
    },
    {
        id: 3,
        time: 65,
        title: "Shift and Return",
        description: "Move forward to shift, then immediately return to the toes-on-peg neutral position.",
        telemetry: { lean: 0.0, speed: 55, status: "Effective Shifting Lock" }
    },
    {
        id: 4,
        time: 95,
        title: "Tucking in for Corners",
        description: "Ensure your feet are tucked tight against the bike to act as the feeler, not your boots.",
        telemetry: { lean: 0.8, speed: 40, status: "Cornering Setup" }
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

export const LANE_PLACEMENT_STEPS = [
    {
        id: 1,
        time: 5,
        title: "The Vision Gap",
        description: "Position yourself where you can see through the gap of the car ahead to spot cross-traffic early.",
        telemetry: { lean: 0.0, speed: 45, status: "Establishing Sightline" }
    },
    {
        id: 2,
        time: 25,
        title: "Intersection Offset",
        description: "Move to the far side of your lane when approaching an intersection with a left-turning car. Make it impossible for them to miss you.",
        telemetry: { lean: 0.2, speed: 35, status: "Maximizing Visibility" }
    },
    {
        id: 3,
        time: 55,
        title: "Scanning the Hazard",
        description: "Roll off the throttle and 'cover' your brakes. Assume the car hasn't seen you until they stop.",
        telemetry: { lean: 0.0, speed: 30, status: "Ready to React" }
    },
    {
        id: 4,
        time: 85,
        title: "The Clean Lane Exit",
        description: "Once clear of the intersection, return to your preferred wheel track to avoid debris in the center of the lane.",
        telemetry: { lean: 0.1, speed: 40, status: "Lane Recovery" }
    }
];

export const ANATOMY_PARTS_STEPS = [
    {
        id: 1,
        time: 10,
        title: "The Right Handlebar: Go & Stop",
        description: "Your right hand controls both acceleration (Throttle) and primary stopping power (Front Brake).",
        telemetry: { lean: 0.0, speed: 0, status: "Right Control Group" }
    },
    {
        id: 2,
        time: 35,
        title: "The Left Handlebar: Power Flow",
        description: "Your left hand manages the Clutch, which acts as the gatekeeper between the engine and the wheels.",
        telemetry: { lean: 0.0, speed: 0, status: "Left Control Group" }
    },
    {
        id: 3,
        time: 65,
        title: "Foot Controls: Shifting & Rear Brake",
        description: "Your left foot handles gears. Your right foot manages the rear brake for low-speed stability.",
        telemetry: { lean: 0.0, speed: 0, status: "Foot Control Group" }
    },
    {
        id: 4,
        time: 95,
        title: "Safety Essentials: Kill Switch",
        description: "The red switch on the right is your emergency shutoff. Know its location by heart.",
        telemetry: { lean: 0.0, speed: 0, status: "Safety Readiness" }
    }
];
