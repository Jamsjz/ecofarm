import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";

const LabChat = ({ gameState, logs, onNewMessage }) => {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Welcome to the Agricultural Lab! I'm your AI assistant. I can analyze your soil, predict crop suitability, and give advice on your farming actions. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(true); // Assume connected initially
    const messagesEndRef = useRef(null);
    const lastLogRef = useRef(logs?.[0]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check connection on mount
    useEffect(() => {
        axios.get(`${API_URL}/docs`) // Simple check if backend is reachable
            .then(() => setConnected(true))
            .catch(() => setConnected(false));
    }, []);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
        if (onNewMessage) onNewMessage(msg);
    };

    // Auto-response logic for game actions
    useEffect(() => {
        if (!logs || logs.length === 0) return;
        if (logs[0] === lastLogRef.current) return;

        lastLogRef.current = logs[0];

        // Debounce: Wait 2.5s after the last action to give a summary response
        const timer = setTimeout(() => {
            triggerAutoResponse();
        }, 2500);

        return () => clearTimeout(timer);
    }, [logs]);

    const triggerAutoResponse = async () => {
        // Don't trigger if we are already waiting for a response or if the user is typing (optional check)
        if (loading) return;

        setLoading(true);
        try {
            const recentActions = logs.slice(0, 5);
            
            // Build game state payload for backend
            const gameStatePayload = gameState ? {
                location: gameState.location || 'Unknown',
                region: gameState.region || 'Hilly',
                gold: gameState.gold || 1000,
                day: gameState.day || 1,
                grid: gameState.grid?.map(cell => ({
                    n: cell.n || 40,
                    p: cell.p || 40,
                    k: cell.k || 40,
                    rainfall: cell.rainfall || 100,
                    ph: cell.ph || 6.5,
                    humidity: cell.humidity || 60,
                    temperature: cell.temperature || 25,
                    moisture: cell.moisture || 50,
                    crop: cell.crop || null,
                    stage: cell.stage || 0,
                    max_stage: cell.max_stage || 100,
                    weed: cell.weed || 0,
                    health: cell.health || 100
                })) || []
            } : null;

            const res = await axios.post(`${API_URL}/chat`, {
                message: null, // Signal for auto-analysis
                recent_actions: recentActions,
                game_state: gameStatePayload
            });

            const aiMsg = { sender: 'ai', text: res.data.response };
            addMessage(aiMsg);
            setConnected(true);
        } catch (error) {
            console.error("Auto-response error:", error);
            // Don't show error for auto-response to avoid annoyance, just log it
            if (error.code === "ERR_NETWORK") setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        addMessage(userMsg);
        setInput("");
        setLoading(true);

        try {
            // Extract recent actions from logs (assuming logs are strings like "[Day 1] Action...")
            // We'll take the last 5 logs
            const recentActions = logs.slice(0, 5);

            // Build game state payload for backend
            const gameStatePayload = gameState ? {
                location: gameState.location || 'Unknown',
                region: gameState.region || 'Hilly',
                gold: gameState.gold || 1000,
                day: gameState.day || 1,
                grid: gameState.grid?.map(cell => ({
                    n: cell.n || 40,
                    p: cell.p || 40,
                    k: cell.k || 40,
                    rainfall: cell.rainfall || 100,
                    ph: cell.ph || 6.5,
                    humidity: cell.humidity || 60,
                    temperature: cell.temperature || 25,
                    moisture: cell.moisture || 50,
                    crop: cell.crop || null,
                    stage: cell.stage || 0,
                    max_stage: cell.max_stage || 100,
                    weed: cell.weed || 0,
                    health: cell.health || 100
                })) || []
            } : null;

            const res = await axios.post(`${API_URL}/chat`, {
                message: userMsg.text,
                recent_actions: recentActions,
                game_state: gameStatePayload
            });

            const aiMsg = { sender: 'ai', text: res.data.response };
            addMessage(aiMsg);
            setConnected(true);
        } catch (error) {
            console.error("Chat error:", error);
            let errorText = "Sorry, I encountered an error analyzing the data. Please try again.";
            if (error.code === "ERR_NETWORK") {
                errorText = "Network Error: Cannot connect to the Laboratory Server. Please ensure the backend is running on port 8000.";
                setConnected(false);
            }
            addMessage({ sender: 'ai', text: errorText });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-bold text-green-800">EcoBot</h2>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-gray-500">{connected ? 'Online' : 'Offline'}</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2" style={{ minHeight: '300px', maxHeight: '500px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'user' 
                                ? 'bg-green-600 text-white rounded-br-none' 
                                : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                        }`}>
                            {msg.sender === 'ai' && window.markdown ? (
                                <div 
                                    className="text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: window.markdown.toHTML(msg.text) }}
                                />
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none border border-gray-200">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about soil, crops, or actions..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${
                        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default LabChat;
