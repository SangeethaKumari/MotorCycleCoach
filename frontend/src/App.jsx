import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./index.css";
import { CORNERING_STEPS, CLUTCH_MISTAKE_STEPS, THROTTLE_STEPS, SPEED_ANALYSIS_STEPS, FOOT_PLACEMENT_STEPS, LANE_PLACEMENT_STEPS, ANATOMY_PARTS_STEPS } from "./VideoMetadata";

const API_BASE = "http://localhost:8000";
const AUTH_TOKEN = "your-secret-token";

const CURRICULUM = [
    { name: "License & Legal Requirements", icon: "🪪" },
    { name: "Preparing to Ride", icon: "🧤" },
    { name: "Basic Vehicle Control", icon: "🕹️" },
    { name: "Space Cushion", icon: "🛡️" },
    { name: "SEE Strategy", icon: "👁️" },
    { name: "Collision Avoidance & Emergencies", icon: "🚨" },
    { name: "Handling Dangerous Surfaces", icon: "⛈️" },
    { name: "Passengers & Cargo", icon: "🎒" },
    { name: "Group Riding", icon: "🏍️🏍️" },
    { name: "Rider State & Safety", icon: "🧠" }
];

export default function App() {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem("mtc_messages");
        return saved ? JSON.parse(saved) : [
            { role: "agent", text: "Welcome to MotorCycleCoach! I'm here to help you master the road. What's on your mind today?" }
        ];
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [performance, setPerformance] = useState(() => {
        const saved = localStorage.getItem("mtc_performance");
        return saved ? JSON.parse(saved) : {};
    });
    
    // Add logic to extract telemetry from messages
    const extractTelemetry = (text) => {
        const match = text.match(/\[TELEMETRY\]([\s\S]*?)\[\/TELEMETRY\]/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                console.error("Telemetry parse error:", e);
                return null;
            }
        }
        return null;
    };

    const chatEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    useEffect(() => {
        localStorage.setItem("mtc_messages", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem("mtc_performance", JSON.stringify(performance));
    }, [performance]);

    // Auto scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const updatePerformance = (category, correct, total) => {
        const catName = category || "General";
        setPerformance(prev => {
            const current = prev[catName] || { correct: 0, total: 0 };
            return {
                ...prev,
                [catName]: {
                    correct: current.correct + correct,
                    total: current.total + total
                }
            };
        });
    };

    const sendMessage = async (textOverride) => {
        const text = textOverride || input;
        if (!text.trim()) return;

        const userMsg = { role: "user", text: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ prompt: text })
            });

            const data = await response.json();
            const agentText = data.response;
            const sources = data.sources || [];
            const quiz = data.quiz;
            const telemetry = data.telemetry;
            const videoAnalysis = data.videoAnalysis;
            
            setMessages(prev => [...prev, {
                role: "agent",
                text: agentText,
                sources: sources,
                quiz: quiz,
                telemetry: telemetry,
                videoAnalysis: videoAnalysis
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: "agent",
                text: "⚠️ Sorry, I'm having trouble connecting to the garage. Please check if the backend is running."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                await handleAudioUpload(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is required for voice mode.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioUpload = async (blob) => {
        setLoading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                const response = await fetch(`${API_BASE}/transcribe`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${AUTH_TOKEN}`
                    },
                    body: JSON.stringify({ audio_data: base64Audio })
                });
                const data = await response.json();
                if (data.transcription) {
                    sendMessage(data.transcription);
                }
            };
        } catch (error) {
            console.error("Transcription failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text) => {
        window.speechSynthesis.cancel();
        // Truncate to prevent browser hang from massive strings
        const safeText = (text || "").substring(0, 300).replace(/[#*`]/g, '');
        const utterance = new SpeechSynthesisUtterance(safeText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const toggleVoice = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const lastAgentMsg = [...messages].reverse().find(m => m.role === "agent");
            if (lastAgentMsg) speak(lastAgentMsg.text);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h1>MotorCycleCoach</h1>
                <div className="status-badge">
                    <div className="status-dot"></div>
                    Coach Online
                </div>
            </header>

            <div className="main-layout">
                <Sidebar curriculum={CURRICULUM} performance={performance} />
                
                <div className="content-area">
                    <main className="chat-window">
                        <div className="chat-container">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.role}`}>
                                    <div className="label">{msg.role === "user" ? "Rider" : "Coach"}</div>
                                    <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {msg.role === "agent" && msg.quiz && (
                                        <Quiz 
                                            quiz={msg.quiz} 
                                            onResult={(correct, total) => updatePerformance(msg.quiz.category, correct, total)} 
                                        />
                                    )}
                                    
                                    {msg.role === "agent" && msg.telemetry && (
                                        <div className="telemetry-card animate-slide-up">
                                            <div className="card-header">
                                                <h3>Performance Analysis</h3>
                                                <span className="source-badge">KAGGLE DATASET</span>
                                            </div>
                                            <div className="telemetry-grid">
                                                <TelemetryViz data={msg.telemetry} />
                                            </div>
                                        </div>
                                    )}

                                    {msg.role === "agent" && msg.videoAnalysis && (
                                        <VideoCoach type={msg.videoAnalysis.type} />
                                    )}
                                    
                                    {msg.role === "agent" && msg.sources && msg.sources.length > 0 && (
                                        <div className="sources-container">
                                            <div className="sources-label">HANDBOOK SOURCES:</div>
                                            <div className="sources-list">
                                                {[...new Set(msg.sources.map(s => `${s.source} (Page ${s.page})`))].map((sourceStr, idx) => (
                                                    <div key={idx} className="source-badge">
                                                        📖 {sourceStr}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {msg.role === "agent" && (
                                        <button 
                                            onClick={() => speak(msg.text)} 
                                            className="speak-btn"
                                        >
                                            🔊 Hear advice
                                        </button>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="message agent">
                                    <div className="label">Coach</div>
                                    <div className="typing-indicator">
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </main>

                    <footer className="input-area">
                        <div className="input-row">
                            <button
                                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={loading}
                                title={isRecording ? "Stop Recording" : "Voice Input"}
                            >
                                {isRecording ? "🛑" : "🎤"}
                            </button>
                            
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about technique, gear, or maintenance..."
                                disabled={loading || isRecording}
                            />
                            
                            <button 
                                className="send-btn" 
                                onClick={() => sendMessage()} 
                                disabled={loading || isRecording || !input.trim()}
                            >
                                {loading ? "..." : "SEND"}
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

function Sidebar({ curriculum, performance }) {
    const TARGET_QUESTIONS = 50;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>LEARNING PATH</h3>
                <p>Goal: 50 Questions per Topic</p>
            </div>
            <nav className="category-list">
                {curriculum.map((cat, i) => {
                    const stats = performance[cat.name] || { correct: 0, total: 0 };
                    const percent = Math.min(Math.round((stats.correct / TARGET_QUESTIONS) * 100), 100);
                    const isFocus = stats.total > 0 && (stats.correct / stats.total) < 0.7;

                    return (
                        <div key={i} className={`category-item ${isFocus ? 'focus-needed' : stats.total > 0 ? 'active' : ''}`}>
                            <div className="cat-icon">{cat.icon}</div>
                            <div className="cat-info">
                                <div className="cat-name">{cat.name}</div>
                                <div className="cat-progress-bg">
                                    <div className="cat-progress-fill" style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="cat-meta">
                                    <span>{percent}% Mastery</span>
                                    <span>{stats.correct}/{TARGET_QUESTIONS}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}

/* Video Analysis Sync Component */
function VideoCoach({ type }) {
    const videoRef = useRef(null);
    let steps, url, label;
    
    const lessonType = (type || "").toLowerCase();
    
    if (lessonType === "clutch") {
        steps = CLUTCH_MISTAKE_STEPS;
        url = "/videos/clutch_mistake.mp4";
        label = "CLUTCH ENGAGEMENT";
    } else if (lessonType === "throttle") {
        steps = THROTTLE_STEPS;
        url = "/videos/throttle_technique.mp4";
        label = "THROTTLE SMOOTHNESS";
    } else if (lessonType === "speed") {
        steps = SPEED_ANALYSIS_STEPS;
        url = "/videos/realvideo_kids.mp4";
        label = "PACE CONSISTENCY";
    } else if (lessonType === "footwork") {
        steps = FOOT_PLACEMENT_STEPS;
        url = "/videos/foot_placement.mp4";
        label = "CONTROL READINESS";
    } else if (lessonType === "traffic") {
        steps = LANE_PLACEMENT_STEPS;
        url = "/videos/lane_placement.mp4";
        label = "SITUATIONAL SCANNING";
    } else if (lessonType === "anatomy") {
        steps = ANATOMY_PARTS_STEPS;
        url = "/videos/motorcycle_parts.mp4";
        label = "PART IDENTIFICATION";
    } else {
        steps = CORNERING_STEPS;
        url = "/videos/cornering_mastery.mp4";
        label = "LEAN FORCE";
    }
    
    const [currentStep, setCurrentStep] = useState(steps[0]);

    const lastUpdate = useRef(0);
    const handleTimeUpdate = () => {
        const time = videoRef.current.currentTime;
        // Only update every 250ms to save CPU
        if (Date.now() - lastUpdate.current < 250) return;
        lastUpdate.current = Date.now();

        const step = [...steps].reverse().find(s => time >= s.time);
        if (step && step.id !== currentStep?.id) {
            setCurrentStep(step);
        }
    };

    const metricValue = type === "clutch" ? 0.8 : 
                        type === "throttle" ? ((currentStep?.telemetry?.speed || 0) / 100) + 0.2 : 
                        (currentStep?.telemetry?.lean || 0);
    
    const metricPercent = Math.min((metricValue / 2.0) * 100, 100);
    const safeValue = isFinite(metricValue) ? metricValue.toFixed(1) : "0.0";

    return (
        <div className={`video-coach-container animate-fade-in ${type === 'speed' ? 'personal-review' : ''}`}>
            <div className="video-header">
                <span className={type === 'speed' ? "personal-tag" : "live-tag"}>
                    {type === 'speed' ? "HOME RIDER REVIEW" : "LIVE ANALYSIS"}
                </span>
                <span className="step-title">{currentStep?.title || "Evaluating Technique..."}</span>
            </div>
            
            <div className="video-main">
                <div className="video-player-wrapper">
                    <video 
                        ref={videoRef}
                        src={url} 
                        controls 
                        className="player"
                        onTimeUpdate={handleTimeUpdate}
                        preload="none"
                    />
                </div>
                
                <div className="telemetry-aside">
                    <div className="mini-gauge">
                        <div className="label">{label}</div>
                        <div className="gauge-track">
                             <div className="gauge-fill" style={{ width: `${metricPercent}%`, background: metricValue > 1.0 ? '#ff453a' : 'var(--accent)' }}></div>
                        </div>
                        <div className="val">
                            {lessonType === "clutch" ? "FRICTION ZONE" : 
                             lessonType === "throttle" ? "SMOOTH ROLL" : 
                             lessonType === "speed" ? "TARGET PARE" :
                             lessonType === "footwork" ? "NEUTRAL LOCK" :
                             lessonType === "traffic" ? "VISIBILITY SCORE" :
                             lessonType === "anatomy" ? "CONTROL MASTERY" :
                             `${safeValue} rad`}
                        </div>
                    </div>

                    <div className="mini-gauge">
                        <div className="label">SPEED (v)</div>
                        <div className="val">{currentStep.telemetry.speed} <small>km/h</small></div>
                    </div>

                    <div className="status-box">
                        <div className="label">COACH STATUS</div>
                        <div className="status-text">{currentStep.telemetry.status}</div>
                    </div>
                </div>
            </div>

            <div className="coach-advice-card">
                <p>{currentStep.description}</p>
            </div>
        </div>
    );
}

function TelemetryViz({ data }) {
    if (!data || !data.history) return null;

    const maxLean = Math.abs(Number(data.max_lean) || 0);
    const leanPercent = Math.min((maxLean / 2.0) * 100, 100);
    const currentSpeed = Number(data.current_speed) || 0;

    return (
        <div className={`telemetry-card ${data.is_dangerous ? 'danger-pulse' : ''}`}>
            <div className="telemetry-header">
                <span>📊 RIDE DYNAMICS ANALYSIS</span>
                <span className="source-tag">KAGGLE DATASET</span>
                <span className="timestamp">T+{data.timestamp || 0}s</span>
            </div>
            
            <div className="metrics-grid">
                <div className="metric-item">
                    <div className="metric-label">PEAK LEAN</div>
                    <div className="gauge-container">
                        <div className="gauge-track"></div>
                        <div className="gauge-fill" style={{ width: `${leanPercent}%`, background: maxLean > 1.2 ? '#ff453a' : 'var(--accent)' }}></div>
                    </div>
                    <div className="metric-value">{maxLean.toFixed(3)} <small>rad</small></div>
                </div>
                
                <div className="metric-item">
                    <div className="metric-label">SPEED</div>
                    <div className="metric-value">{currentSpeed.toFixed(1)} <small>km/h</small></div>
                </div>
            </div>

            <div className="sparkline-container">
                <div className="sparkline-label">PHYSICS TIMELINE (KAGGLE DATA)</div>
                <div className="sparkline">
                    {(data.history || []).map((h, i) => {
                        const s = Number(h.speed) || 0;
                        const l = Math.abs(Number(h.lean) || 0);
                        return (
                            <div key={i} className="spark-bar" style={{ height: `${Math.min(s, 100)}%` }}>
                                <div className="lean-dot" style={{ bottom: `${Math.min((l / 2.0) * 100, 100)}%` }}></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {(data.alerts || []).map((alert, i) => (
                <div key={i} className="telemetry-alert">
                    ⚠️ {alert}
                </div>
            ))}
        </div>
    );
}

function Quiz({ quiz, onResult }) {
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    if (!quiz || !quiz.questions) return null;

    const handleSubmit = () => {
        setSubmitted(true);
        const correctCount = quiz.questions.reduce((acc, q) => {
            return acc + (selectedAnswers[q.id] === q.correct ? 1 : 0);
        }, 0);
        if (onResult) onResult(correctCount, quiz.questions.length);
    };

    return (
        <div className="quiz-card">
            <div className="quiz-header">🏍️ KNOWLEDGE CHECK</div>
            <div className="quiz-scroll-area">
                {quiz.questions.map((q, idx) => (
                    <div key={idx} className="quiz-question-item">
                        <div className="quiz-q-text">{idx + 1}. {q.question}</div>
                        <div className="quiz-options">
                            {q.options.map((opt, oIdx) => {
                                const isSelected = selectedAnswers[q.id] === opt;
                                const isCorrect = q.correct === opt;
                                let classes = "option-btn";
                                if (isSelected) classes += " selected";
                                if (submitted && isCorrect) classes += " correct";
                                if (submitted && isSelected && !isCorrect) classes += " wrong";

                                return (
                                    <button
                                        key={oIdx}
                                        className={classes}
                                        onClick={() => !submitted && setSelectedAnswers(prev => ({...prev, [q.id]: opt}))}
                                        disabled={submitted}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {submitted && (
                            <div className={`explanation ${selectedAnswers[q.id] === q.correct ? 'success' : 'fail'}`}>
                                {selectedAnswers[q.id] === q.correct ? "✅ Spot on! " : "❌ Not quite. "}
                                {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {!submitted && (
                <button 
                    className="submit-quiz-btn" 
                    onClick={handleSubmit}
                    disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                >
                    CHECK MY ANSWERS
                </button>
            )}
        </div>
    );
}


