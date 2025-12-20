import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import LabChat from './LabChat';


// Fix Leaflet icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = "http://localhost:8000";

const GamePage = () => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [meta, setMeta] = useState({ crops: {}, actions: {} });
    const [selection, setSelection] = useState(new Set());
    const [logs, setLogs] = useState([]);
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- NEW SUMMARY & PAUSE STATE ---
    const [paused, setPaused] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [aiHistory, setAiHistory] = useState([]); // List of {human: str, ai: str}
    const [lastSummaryIndex, setLastSummaryIndex] = useState(0);
    const [summaryText, setSummaryText] = useState("");
    const [generatingSummary, setGeneratingSummary] = useState(false);

    // Initial Fetch
    useEffect(() => {
        axios.get(`${API_URL}/meta`).then(res => setMeta(res.data));
    }, []);

    // Heartbeat - Only tick if started AND NOT PAUSED
    useEffect(() => {
        if (!started || paused) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_URL}/tick`);
                syncState(res.data);
            } catch (e) { console.error(e); }
        }, 1000);
        return () => clearInterval(interval);
    }, [started, paused]);

    const startGame = async (region) => {
        try {
            const res = await axios.post(`${API_URL}/init`, { region });
            syncState(res.data);
            setStarted(true);
            addLog(`Started in ${region}`);
        } catch (e) { console.error(e); }
    };

    const startByLocation = async (lat, lng) => {
        try {
            const res = await axios.post(`${API_URL}/init_by_location`, { lat, lng });
            syncState(res.data);
            setStarted(true);
            addLog(`Started based on location (Alt: ${res.data.elevation}m -> ${res.data.region})`);
        } catch (e) {
            console.error(e);
            addLog("Error starting from location");
        }
    };

    const syncState = (data) => {
        setGameState(prev => ({
            ...prev,
            grid: data.grid || prev?.grid,
            gold: data.gold,
            day: data.day,
            crops: data.crops || [],
            events: data.events || []
        }));
        if (data.events && data.events.length > 0) {
            data.events.forEach(e => addLog(e));
        }
    };

    const addLog = (msg) => {
        setLogs(prev => [`[Day ${gameState?.day || 0}] ${msg}`, ...prev.slice(0, 5)]);
    };

    // --- SELECTION LOGIC ---
    const toggleSelection = (id) => {
        setSelection(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectRow = (rowIndex) => {
        const next = new Set(selection);
        for (let c = 0; c < 4; c++) next.add(rowIndex * 4 + c);
        setSelection(next);
    };

    const selectCol = (colIndex) => {
        const next = new Set(selection);
        for (let r = 0; r < 4; r++) next.add(r * 4 + colIndex);
        setSelection(next);
    };

    const selectAll = () => {
        const next = new Set();
        for (let i = 0; i < 16; i++) next.add(i);
        setSelection(next);
    };

    const clearSelection = () => setSelection(new Set());

    // --- ACTION LOGIC ---
    const handleAction = async (key) => {
        if (selection.size === 0) return addLog("Select a plot first!");
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/action`, {
                action: key,
                indices: Array.from(selection)
            });
            addLog(res.data.msg);
            // LabChat will automatically detect the log change and trigger advice
        } catch (err) {
            addLog(err.response?.data?.error || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePlant = async (cropName) => {
        if (selection.size === 0) return addLog("Select a plot first!");
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/plant`, {
                crop: cropName,
                indices: Array.from(selection)
            });
            addLog(res.data.msg);
        } catch (err) {
            addLog(err.response?.data?.error || "Planting failed");
        } finally {
            setLoading(false);
        }
    };

    const handleNewChatMessage = (msg) => {
        // msg is { sender: 'user'|'ai', text: '...' }
        // We want to group them into { human: ..., ai: ... } for the summary
        // This is a bit tricky since they come in one by one.
        // For simplicity, we'll just log them as individual interactions or try to pair them.
        
        setAiHistory(prev => {
            const last = prev[prev.length - 1];
            if (msg.sender === 'user') {
                // Start a new interaction
                return [...prev, { human: msg.text, ai: "..." }];
            } else if (msg.sender === 'ai') {
                // If the last one has a pending AI response, update it
                if (last && last.ai === "...") {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].ai = msg.text;
                    return newHistory;
                } else {
                    // It's an unsolicited AI message (auto-response)
                    return [...prev, { human: "(Auto-Analysis)", ai: msg.text }];
                }
            }
            return prev;
        });
    };

    // --- SUMMARY LOGIC ---
    const handleOpenSummary = async () => {
        setPaused(true);
        setShowSummary(true);
        setGeneratingSummary(true);

        const newInteractions = aiHistory.slice(lastSummaryIndex);

        try {
            if (newInteractions.length === 0) {
                setSummaryText("No new AI interactions since last summary.");
                setGeneratingSummary(false);
                return;
            }

            // Using Mock data if API is failing (user request to ignore actual summary for now)
            // But we still attempt call, if it fails we show a nice message instead of raw error.
            try {
                const res = await axios.post(`${API_URL}/summarize`, { interactions: newInteractions });
                setSummaryText(res.data.summary);
            } catch (apiError) {
                // Fallback for visual testing as per user request
                setSummaryText(
                    "Note: AI Quota Exceeded.\n\n" +
                    "Here is a simulated summary of your recent actions:\n" +
                    "--------------------------------------------------\n" +
                    newInteractions.map(i => `• Action: ${i.human}\n  Advice: ${i.ai}`).join('\n\n')
                );
            }

            setLastSummaryIndex(aiHistory.length);
        } catch (e) {
            setSummaryText("An error occurred while preparing the summary.");
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleCloseSummary = () => {
        setShowSummary(false);
        setPaused(false);
    };

    if (!started) return <StartScreen onStart={startGame} onStartLocation={startByLocation} onBack={() => navigate('/')} />;

    return (
        <div className="layout">
            {/* 1. LEFT: ACTIONS */}
            <aside className="panel left-panel">
                <div className="header-box">
                    <h2>🌱 EcoFarm</h2>
                    <div className="stats">
                        <div>📅 Day {gameState?.day}</div>
                        <div>💰 {gameState?.gold}g</div>
                    </div>
                    <button className="small-btn" onClick={() => navigate('/')}>Exit</button>
                </div>

                <div className="selection-controls">
                    <h3>Selection ({selection.size})</h3>
                    <div className="mini-btn-row">
                        <button onClick={selectAll}>All</button>
                        <button onClick={clearSelection}>None</button>
                    </div>
                </div>

                {selection.size === 1 && (() => {
                    const idx = Array.from(selection)[0];
                    const cell = gameState?.grid?.[idx];
                    if (!cell) return null;
                    return (
                        <div className="action-group">
                            <h3>Field Analysis</h3>
                            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Temp:</span> <span>{cell.temperature?.toFixed(1)}°C</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rain:</span> <span>{cell.rainfall?.toFixed(1)}mm</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Wind:</span> <span>{cell.wind_speed?.toFixed(1)}km/h</span></div>
                                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>pH:</span> <span>{cell.ph?.toFixed(2)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>N:</span> <span>{cell.n?.toFixed(1)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>P:</span> <span>{cell.p?.toFixed(1)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>K:</span> <span>{cell.k?.toFixed(1)}</span></div>
                            </div>
                        </div>
                    );
                })()}

                <div className="action-group">
                    <h3>Tools</h3>
                    {Object.entries(meta.actions).map(([key, act]) => (
                        key !== "harvest" &&
                        <button key={key} className="tool-btn" onClick={() => handleAction(key)} disabled={loading}>
                            {act.name} <small>({act.cost}g)</small>
                        </button>
                    ))}
                    <button className="tool-btn harvest" onClick={() => handleAction('harvest')} disabled={loading}>
                        Harvest (0g)
                    </button>
                </div>

                <div className="action-group">
                    <h3>Plant Seeds</h3>
                    {Object.entries(meta.crops).map(([key, crop]) => (
                        <button key={key} className="seed-btn" onClick={() => handlePlant(key)} disabled={loading}>
                            {key} <small>({crop.cost}g)</small>
                        </button>
                    ))}
                </div>
            </aside>

            {/* 2. CENTER: GRID */}
            <main className="grid-container">
                <div className="farm-grid">
                    {gameState?.grid?.map((cell, i) => (
                        <Cell
                            key={cell.id}
                            cell={cell}
                            selected={selection.has(cell.id)}
                            onClick={() => toggleSelection(cell.id)}
                        />
                    ))}
                </div>
                <div className="grid-helpers">
                    <small>Quick Select: </small>
                    {[0, 1, 2, 3].map(i => <button key={`r${i}`} onClick={() => selectRow(i)}>Row {i + 1}</button>)}
                    <span> | </span>
                    {[0, 1, 2, 3].map(i => <button key={`c${i}`} onClick={() => selectCol(i)}>Col {i + 1}</button>)}
                </div>
            </main>

            {/* 3. RIGHT: INFO & CHAT */}
            <aside className="panel right-panel">
                <div style={{ marginBottom: '10px' }}>
                    <button onClick={handleOpenSummary} className="small-btn" style={{ background: '#8e44ad', color: 'white', width: '100%' }}>View Session Summary</button>
                </div>
                <LabChat gameState={gameState} logs={logs} onNewMessage={handleNewChatMessage} />

                <div className="info-box">
                    <h3>Top Recommendations</h3>
                    <ul>
                        {gameState?.crops?.map(c => <li key={c}>{c}</li>)}
                    </ul>
                </div>

                <div className="logs-box">
                    <h3>Log</h3>
                    {logs.map((l, i) => <div key={i} className="log-entry">{l}</div>)}
                </div>
            </aside>

            {/* SUMMARY MODAL */}
            {showSummary && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>⏸️ Game Paused: AI Summary</h2>
                            <button className="close-cross-btn" onClick={handleCloseSummary}>✖</button>
                        </div>
                        <div className="summary-text">
                            {generatingSummary ? "Generating summary..." : summaryText}
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCloseSummary} className="primary-btn">
                                Close & Resume Game
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Cell = ({ cell, selected, onClick }) => {
    const moistureColor = `rgba(52, 152, 219, ${cell.moisture / 100})`;
    const weedOverlay = cell.weed > 30 ? `rgba(39, 174, 96, ${cell.weed / 200})` : 'transparent';
    
    const title = `Temp: ${cell.temperature?.toFixed(1)}°C\nRain: ${cell.rainfall?.toFixed(1)}mm\nWind: ${cell.wind_speed?.toFixed(1)}km/h\nMoisture: ${Math.round(cell.moisture)}%`;

    let content = "";
    if (cell.crop) {
        const progress = cell.stage / cell.max_stage;
        if (progress < 0.3) content = "🌱";
        else if (progress < 0.6) content = "🌿";
        else if (progress < 1) content = "🌾";
        else content = "💰";
    }

    return (
        <div
            className={`cell ${selected ? 'selected' : ''}`}
            onClick={onClick}
            title={title}
            style={{
                backgroundColor: '#e67e22',
                backgroundImage: `linear-gradient(${moistureColor}, ${moistureColor}), linear-gradient(${weedOverlay}, ${weedOverlay})`
            }}
        >
            <div className="cell-overlay">
                {content}
                {cell.crop && <div className="crop-name">{cell.crop}</div>}
            </div>
            <div className="cell-stats">
                💧{Math.round(cell.moisture)}%
            </div>
        </div>
    );
};

// UI CLEANUP: Removed Quick Start buttons
const StartScreen = ({ onStart, onStartLocation, onBack }) => {
    const [showMap, setShowMap] = useState(false);
    const [selectedPos, setSelectedPos] = useState(null);

    function LocationMarker() {
        useMapEvents({
            click(e) { setSelectedPos(e.latlng); },
        });
        return selectedPos ? <Marker position={selectedPos}><Popup>Selected Location</Popup></Marker> : null;
    }

    const handleConfirm = () => {
        if (selectedPos) onStartLocation(selectedPos.lat, selectedPos.lng);
    };

    if (showMap) {
        return (
            <div className="start-screen">
                <h1>📍 Select Your Farm Location</h1>
                <p>Click on the map to choose your region</p>
                <div className="map-container" style={{ height: '400px', width: '100%', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer center={[28.3949, 84.1240]} zoom={7} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                        <LocationMarker />
                    </MapContainer>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <span style={{ marginRight: '10px' }}>{selectedPos ? `Selected: ${selectedPos.lat.toFixed(4)}, ${selectedPos.lng.toFixed(4)}` : "Click map to select"}</span>
                    <button className="primary-btn" onClick={handleConfirm} disabled={!selectedPos}>Confirm Location</button>
                    <button onClick={() => setShowMap(false)} style={{ marginLeft: '10px' }}>Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="start-screen">
            <h1>🌱 EcoFarm Grid</h1>
            <div className="region-select">
                <button className="primary-btn" onClick={() => setShowMap(true)} style={{ fontSize: '1.2rem', padding: '20px' }}>🗺️ Select Location on Map</button>
                <div style={{ marginTop: '20px' }}>
                    <button onClick={onBack} className="secondary-btn">Back to Home</button>
                </div>
            </div>
        </div>
    );
};

export default GamePage;
