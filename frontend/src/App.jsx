import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./index.css";

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
    const [messages, setMessages] = useState([
        { role: "agent", text: "Welcome to MotorCycleCoach! I'm here to help you master the road. What's on your mind today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [performance, setPerformance] = useState({});
    
    const chatEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    useEffect(() => {
        const savedPerf = localStorage.getItem("mtc_performance");
        if (savedPerf) setPerformance(JSON.parse(savedPerf));
    }, []);

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
            
            setMessages(prev => [...prev, {
                role: "agent",
                text: agentText,
                sources: sources,
                quiz: quiz
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
        const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
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
            {quiz.questions.map((q, idx) => (
                <div key={idx} className="quiz-question-item">
                    <div className="quiz-q-text">{q.question}</div>
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


