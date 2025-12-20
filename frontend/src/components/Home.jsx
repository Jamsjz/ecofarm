import React from 'react';
import { CloudRain, Droplets, FlaskConical, Leaf, MapPin, Moon, Skull, Sun, Trash2, Wind, Grid3X3 } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Backend API URL
const API_URL = 'http://localhost:8000';

const BIOME = { TERAI: 'Terai', HILLY: 'Hilly', MOUNTAIN: 'Mountain' };
const STAGE = { SEED: 'Seed', SPROUT: 'Sprout', MATURE: 'Mature' };
const ACTION = { WATER: 'Water', INSECTICIDE: 'Insecticide', PESTICIDE: 'Pesticide' };
const NURSERY = [
    { species: 'Rice', emoji: '🌾', diff: 3, pref: BIOME.TERAI },
    { species: 'Maize', emoji: '🌽', diff: 2, pref: BIOME.HILLY },
    { species: 'Banana', emoji: '🍌', diff: 3, pref: BIOME.TERAI },
    { species: 'Mango', emoji: '🥭', diff: 3, pref: BIOME.TERAI },
    { species: 'Apple', emoji: '🍎', diff: 4, pref: BIOME.MOUNTAIN },
    { species: 'Jute', emoji: '🌿', diff: 3, pref: BIOME.TERAI },
    { species: 'Papaya', emoji: '🍈', diff: 3, pref: BIOME.TERAI },
    { species: 'Lentil', emoji: '🫘', diff: 2, pref: BIOME.HILLY },
    { species: 'Orange', emoji: '🍊', diff: 3, pref: BIOME.HILLY },
    { species: 'Cotton', emoji: '☁️', diff: 3, pref: BIOME.TERAI },
];

const CROP_PROFILES = {
    Rice: { daysToMature: 12, waterEvery: 50, waterEveryDrought: 35, insecticideEveryDays: 4, pesticideEveryDays: 6 },
    Maize: { daysToMature: 10, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 4, pesticideEveryDays: 6 },
    Banana: { daysToMature: 18, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 6, pesticideEveryDays: 8 },
    Mango: { daysToMature: 18, waterEvery: 80, waterEveryDrought: 50, insecticideEveryDays: 6, pesticideEveryDays: 8 },
    Apple: { daysToMature: 20, waterEvery: 80, waterEveryDrought: 50, insecticideEveryDays: 7, pesticideEveryDays: 9 },
    Jute: { daysToMature: 14, waterEvery: 50, waterEveryDrought: 35, insecticideEveryDays: 5, pesticideEveryDays: 7 },
    Papaya: { daysToMature: 16, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 5, pesticideEveryDays: 7 },
    Lentil: { daysToMature: 11, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 4, pesticideEveryDays: 6 },
    Orange: { daysToMature: 18, waterEvery: 80, waterEveryDrought: 50, insecticideEveryDays: 6, pesticideEveryDays: 8 },
    Cotton: { daysToMature: 15, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 5, pesticideEveryDays: 7 },
};
const defaultCropProfile = { daysToMature: 12, waterEvery: 60, waterEveryDrought: 40, insecticideEveryDays: 5, pesticideEveryDays: 7 };
const cropProfileFor = (species) => CROP_PROFILES[species] || defaultCropProfile;

const BACKEND_ACTIONS = {
    "manual_plough": {
        "name": "Manual Ploughing",
        "cost": { "Terai": 30, "Hilly": 35, "Himalayan": 40 },
        "effect": { "moisture": -2 },
        "desc": "Traditional ploughing using oxen or hand tools.",
        "duration": "High (12h)",
        "durationTicks": 10,
        "icon": "🐂"
    },
    "plough": {
        "name": "Tractor Ploughing",
        "cost": { "Terai": 90, "Hilly": 110, "Himalayan": 130 },
        "effect": { "moisture": -5 },
        "desc": "Primary tillage using tractor or power tiller.",
        "duration": "Medium (6h)",
        "durationTicks": 5,
        "icon": "🚜"
    },
    "irrigate": {
        "name": "Canal / Tube-well Irrigation",
        "cost": { "Terai": 70, "Hilly": 90, "Himalayan": 110 },
        "effect": { "moisture": 20, "temperature": -1 },
        "desc": "Flood or furrow irrigation.",
        "duration": "Low (4h)",
        "durationTicks": 4,
        "icon": "💧"
    },
    "fertilizer/chemical/nitrogen": {
        "name": "Urea (46% N)",
        "cost": { "Terai": 60, "Hilly": 65, "Himalayan": 70 },
        "effect": { "n": 30, "p": 0, "k": 0, "ph": -0.1 },
        "desc": "Common nitrogen fertilizer.",
        "duration": "Low (2h)",
        "durationTicks": 2,
        "icon": "🧪"
    },
    "fertilizer/chemical/phosphorus": {
        "name": "DAP (18-46-0)",
        "cost": { "Terai": 70, "Hilly": 75, "Himalayan": 80 },
        "effect": { "n": 10, "p": 25, "k": 0, "ph": -0.05 },
        "desc": "Diammonium phosphate.",
        "duration": "Low (2h)",
        "durationTicks": 2,
        "icon": "🧪"
    },
    "fertilizer/chemical/potassium": {
        "name": "MOP (0-0-60)",
        "cost": { "Terai": 65, "Hilly": 70, "Himalayan": 75 },
        "effect": { "n": 0, "p": 0, "k": 25 },
        "desc": "Muriate of potash.",
        "duration": "Low (2h)",
        "durationTicks": 2,
        "icon": "🧪"
    },
    "fertilizer/organic/fym": {
        "name": "Farmyard Manure",
        "cost": { "Terai": 50, "Hilly": 55, "Himalayan": 60 },
        "effect": { "n": 5, "p": 5, "k": 5, "ph": 0.05 },
        "desc": "Cattle/buffalo manure and compost.",
        "duration": "Medium (8h)",
        "durationTicks": 7,
        "icon": "💩"
    },
    "mulch": {
        "name": "Mulching",
        "cost": { "Terai": 40, "Hilly": 45, "Himalayan": 50 },
        "effect": { "moisture": 10 },
        "desc": "Use of crop residue to conserve moisture.",
        "duration": "Medium (6h)",
        "durationTicks": 5,
        "icon": "🍂"
    },
    "harvest": {
        "name": "Harvest & Thresh",
        "cost": { "Terai": 100, "Hilly": 110, "Himalayan": 130 },
        "effect": {},
        "desc": "Cutting, collecting, and threshing.",
        "duration": "High (15h)",
        "durationTicks": 13,
        "icon": "🌾"
    },
    "remove_crop": {
        "name": "Remove Crop",
        "cost": { "Terai": 20, "Hilly": 25, "Himalayan": 30 },
        "effect": {},
        "desc": "Remove unwanted crops from the field.",
        "duration": "Low (1h)",
        "durationTicks": 2,
        "icon": "🗑️"
    },
};

const BACKEND_CROPS = {
    "Rice": {
        harvest_gold: 220,
        ideal: { moisture: 80, temperature: 24, n: 80, p: 48, k: 40, humidity: 82, ph: 6, rainfall: 236 },
    },
    "Maize": {
        harvest_gold: 190,
        ideal: { moisture: 55, temperature: 22, n: 78, p: 48, k: 20, humidity: 65, ph: 6, rainfall: 85 },
    },
    "Banana": {
        harvest_gold: 320,
        ideal: { moisture: 70, temperature: 27, n: 100, p: 82, k: 50, humidity: 80, ph: 6, rainfall: 105 },
    },
    "Mango": {
        harvest_gold: 340,
        ideal: { moisture: 60, temperature: 31, n: 20, p: 27, k: 30, humidity: 50, ph: 6, rainfall: 95 },
    },
    "Apple": {
        harvest_gold: 360,
        ideal: { moisture: 50, temperature: 23, n: 21, p: 134, k: 200, humidity: 92, ph: 6, rainfall: 113 },
    },
    "Jute": {
        harvest_gold: 230,
        ideal: { moisture: 65, temperature: 25, n: 78, p: 47, k: 40, humidity: 80, ph: 7, rainfall: 175 },
    },
    "Papaya": {
        harvest_gold: 310,
        ideal: { moisture: 65, temperature: 34, n: 50, p: 59, k: 50, humidity: 92, ph: 7, rainfall: 143 },
    },
    "Lentil": {
        harvest_gold: 200,
        ideal: { moisture: 45, temperature: 25, n: 19, p: 68, k: 19, humidity: 65, ph: 7, rainfall: 46 },
    },
    "Orange": {
        harvest_gold: 330,
        ideal: { moisture: 55, temperature: 23, n: 20, p: 17, k: 10, humidity: 92, ph: 7, rainfall: 110 },
    },
    "Cotton": {
        harvest_gold: 240,
        ideal: { moisture: 55, temperature: 24, n: 118, p: 46, k: 20, humidity: 80, ph: 7, rainfall: 80 },
    },
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const stageFrom = (p) => (p < 35 ? STAGE.SEED : p < 75 ? STAGE.SPROUT : STAGE.MATURE);
const DAY_TICKS = 100; // Synced with tod loop (0-99) for correct globalTick calculation

function soilStyle(b) {
    if (b === BIOME.TERAI)
        return {
            backgroundColor: '#2a160a',
            backgroundImage:
                'repeating-linear-gradient(45deg, rgba(0,0,0,.25) 0 1px, transparent 1px 12px), radial-gradient(circle at 15% 25%, rgba(255,255,255,.05) 0 2px, transparent 3px)',
        };
    if (b === BIOME.MOUNTAIN)
        return {
            backgroundColor: '#2a2f35',
            backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 14px), radial-gradient(circle at 65% 55%, rgba(255,255,255,.06) 0 2px, transparent 4px)',
        };
    return {
        backgroundColor: '#23140d',
        backgroundImage:
            'repeating-linear-gradient(90deg, rgba(0,0,0,.22) 0 1px, transparent 1px 18px), radial-gradient(circle at 25% 35%, rgba(255,255,255,.05) 0 2px, transparent 3px)',
    };
}

function MapRecenter({ center, zoom }) {
    const map = useMap();
    React.useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, map, zoom]);
    return null;
}

export default function Home() {
    const [day, setDay] = React.useState(1);
    const [tod, setTod] = React.useState(20);
    const [running, setRunning] = React.useState(false);
    const [speedIdx, setSpeedIdx] = React.useState(1);

    const dayRef = React.useRef(day);
    React.useEffect(() => {
        dayRef.current = day;
    }, [day]);
    const todRef = React.useRef(tod);
    React.useEffect(() => {
        todRef.current = tod;
    }, [tod]);

    const [loc, setLoc] = React.useState('Kathmandu');
    const [biome, setBiome] = React.useState(BIOME.HILLY);
    const [temp, setTemp] = React.useState(22);

    const [sun, setSun] = React.useState(64);
    const [rain, setRain] = React.useState(48);
    const [wind, setWind] = React.useState(34);

    const sunManualRef = React.useRef(false);
    const rainManualRef = React.useRef(false);
    const windManualRef = React.useRef(false);

    const [mapCenter, setMapCenter] = React.useState([27.7172, 85.3240]);
    const [mapZoom, setMapZoom] = React.useState(11);
    const [mapLabel, setMapLabel] = React.useState('Kathmandu');
    const [wx, setWx] = React.useState(null);
    const [wxBusy, setWxBusy] = React.useState(false);
    const [rainHint, setRainHint] = React.useState(false);

    const [grid, setGrid] = React.useState(() => Array.from({ length: 16 }, () => null));
    const [soilState, setSoilState] = React.useState(() => Array.from({ length: 16 }, () => ({ ploughed: false })));
    const gridRef = React.useRef(grid);
    const soilStateRef = React.useRef(soilState);

    React.useEffect(() => {
        gridRef.current = grid;
    }, [grid]);
    React.useEffect(() => {
        soilStateRef.current = soilState;
    }, [soilState]);

    // Helpers for soil suitability
    const getSoilParams = React.useCallback(() => {
        return {
            n: 40 + (rain / 10),
            p: 40,
            k: 40,
            temperature: temp,
            humidity: sun, // Using sun as proxy for humidity matches fetchRecommendations
            ph: 6.5,
            rainfall: rain * 2.5
        };
    }, [rain, temp, sun]);

    const getSuitabilityScore = React.useCallback((species) => {
        const cropDef = BACKEND_CROPS[species];
        if (!cropDef || !cropDef.ideal) return 100; // Default safe if no data

        const currentParams = getSoilParams();
        const ideal = cropDef.ideal;
        const vecCurrent = [currentParams.n, currentParams.p, currentParams.k, currentParams.temperature, currentParams.humidity, currentParams.ph, currentParams.rainfall];
        const vecIdeal = [ideal.n, ideal.p, ideal.k, ideal.temperature, ideal.humidity, ideal.ph, ideal.rainfall];

        let sumSq = 0;
        for (let i = 0; i < vecCurrent.length; i++) {
            sumSq += Math.pow(vecCurrent[i] - vecIdeal[i], 2);
        }
        const dist = Math.sqrt(sumSq);

        // Model formula: score = alpha / distance * goldunit. (Alpha=100, Unit=10 -> 1000/dist)
        if (dist === 0) return 999;
        // Relaxed scoring: (300 / dist) * 10 to allow growth in default conditions despite unit variances
        return (300 / dist) * 10;
    }, [getSoilParams]);
    const speedIdxRef = React.useRef(speedIdx);
    React.useEffect(() => {
        speedIdxRef.current = speedIdx;
    }, [speedIdx]);
    const [toast, setToastState] = React.useState(null);
    const toastTimeoutRef = React.useRef(null);

    const setToast = React.useCallback((msg) => {
        setToastState(msg);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
            setToastState(null);
        }, 3000);
    }, []);

    React.useEffect(() => {
        setToast('Drag crops from Nursery into the 4x4 field.');
    }, [setToast]);

    const [coins, setCoins] = React.useState(2000);
    const coinsRef = React.useRef(2000);
    React.useEffect(() => {
        coinsRef.current = coins;
    }, [coins]);
    const coinBoxRef = React.useRef(null);
    const [coinBursts, setCoinBursts] = React.useState([]);
    const cellRefs = React.useRef(Array.from({ length: 16 }, () => null));
    const actionToastRef = React.useRef({ key: '', at: 0 });
    const matureStopRef = React.useRef(false);
    const coinAnimRef = React.useRef({ raf: 0, tid: 0 });
    React.useEffect(() => {
        return () => {
            try {
                if (coinAnimRef.current.raf) cancelAnimationFrame(coinAnimRef.current.raf);
            } catch { }
            try {
                if (coinAnimRef.current.tid) clearTimeout(coinAnimRef.current.tid);
            } catch { }
        };
    }, []);
    React.useEffect(() => {
        if (!coinBursts.some((b) => b.phase === 0)) return;
        try {
            if (coinAnimRef.current.raf) cancelAnimationFrame(coinAnimRef.current.raf);
        } catch { }
        coinAnimRef.current.raf = requestAnimationFrame(() => {
            setCoinBursts((prev) => prev.map((b) => (b.phase === 0 ? { ...b, phase: 1 } : b)));
        });
        try {
            if (coinAnimRef.current.tid) clearTimeout(coinAnimRef.current.tid);
        } catch { }
        coinAnimRef.current.tid = setTimeout(() => {
            const now = Date.now();
            setCoinBursts((prev) => prev.filter((b) => now - (b.t0 || now) < 900));
        }, 900);
    }, [coinBursts]);


    const [chatMsgs, setChatMsgs] = React.useState(() => [
        {
            id: uid(),
            role: 'assistant',
            text: 'Eco-Lab online. Try: “advice”, “stats”, or “biome”. Drag crops from the Nursery into the field.',
        },
    ]);
    const [chatInput, setChatInput] = React.useState('');
    const [chatBusy, setChatBusy] = React.useState(false);
    const [recentActions, setRecentActions] = React.useState([]);
    const recentActionsRef = React.useRef([]);
    const [selectedCrop, setSelectedCrop] = React.useState('');
    const [nurseryOpen, setNurseryOpen] = React.useState(false);
    const nurseryRef = React.useRef(null);

    // Grid selection state
    // Refactored to allow toggle logic intersection
    const [selectedRows, setSelectedRows] = React.useState(new Set());
    const [selectedCols, setSelectedCols] = React.useState(new Set());
    const [selectedCells, setSelectedCells] = React.useState(new Set());

    // Crop recommendations from ML model
    const [recommendations, setRecommendations] = React.useState([]);
    const [recsLoading, setRecsLoading] = React.useState(false);

    // Blocking Action State
    const [actionBusy, setActionBusy] = React.useState(null); // { name, progress, total }

    const selection = React.useMemo(() => {
        const next = new Set(selectedCells);
        for (const r of selectedRows) {
            for (let c = 0; c < 4; c++) next.add(r * 4 + c);
        }
        for (const c of selectedCols) {
            for (let r = 0; r < 4; r++) next.add(r * 4 + c);
        }
        return next;
    }, [selectedRows, selectedCols, selectedCells]);

    // Grid selection functions
    const toggleCellSelection = React.useCallback((idx) => {
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }, []);

    const selectRow = React.useCallback((rowIndex) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(rowIndex)) next.delete(rowIndex);
            else next.add(rowIndex);
            return next;
        });
    }, []);

    const selectCol = React.useCallback((colIndex) => {
        setSelectedCols(prev => {
            const next = new Set(prev);
            if (next.has(colIndex)) next.delete(colIndex);
            else next.add(colIndex);
            return next;
        });
    }, []);

    const selectAll = React.useCallback(() => {
        setSelectedRows(new Set([0, 1, 2, 3]));
        setSelectedCols(new Set());
        setSelectedCells(new Set());
    }, []);

    const clearSelection = React.useCallback(() => {
        setSelectedRows(new Set());
        setSelectedCols(new Set());
        setSelectedCells(new Set());
    }, []);

    // Fetch crop recommendations from backend
    const fetchRecommendations = React.useCallback(async () => {
        setRecsLoading(true);
        try {
            // Build average soil params from environment
            const reqBody = {
                n: 40 + (rain / 10),
                p: 40,
                k: 40,
                temperature: temp,
                humidity: sun,
                ph: 6.5,
                rainfall: rain * 2.5
            };
            const res = await fetch(`${API_URL}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data.recommendations || []);
            }
        } catch (e) {
            console.log('Recommendations fetch failed:', e);
            // Fallback to mock recommendations
            setRecommendations([
                { crop: 'Rice', score: 85 },
                { crop: 'Maize', score: 72 },
                { crop: 'Banana', score: 65 }
            ]);
        } finally {
            setRecsLoading(false);
        }
    }, [biome, temp, rain]);

    // Fetch recommendations on mount and when environment changes
    React.useEffect(() => {
        fetchRecommendations();
    }, [biome, temp]);

    const clockInfo = React.useMemo(() => {
        const mins = Math.round((clamp(tod, 0, 100) / 100) * 24 * 60);
        const hh24 = Math.floor(mins / 60) % 24;
        const mm = mins % 60;
        const ampm = hh24 >= 12 ? 'PM' : 'AM';
        const hh12 = ((hh24 + 11) % 12) + 1;
        return { hh24, text: `${hh12}:${String(mm).padStart(2, '0')} ${ampm}` };
    }, [tod]);

    const smoothstep = React.useCallback((a, b, x) => {
        const t = clamp((x - a) / (b - a), 0, 1);
        return t * t * (3 - 2 * t);
    }, []);

    const hourFloat = React.useMemo(() => (clamp(tod, 0, 100) / 100) * 24, [tod]);
    const nightBlend = React.useMemo(() => {
        const dawn = 1 - smoothstep(5.5, 6.5, hourFloat);
        const dusk = smoothstep(17.5, 18.5, hourFloat);
        return Math.max(dawn, dusk);
    }, [hourFloat, smoothstep]);

    const isNight = nightBlend >= 0.6;
    const glass = isNight
        ? 'bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-colors duration-700'
        : 'bg-black/30 backdrop-blur-2xl border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-colors duration-700';
    const bgNight = 'linear-gradient(180deg, rgba(5,12,25,1) 0%, rgba(6,18,35,1) 55%, rgba(3,10,18,1) 100%)';
    const bgDay = [
        'radial-gradient(circle at 18% 12%, rgba(253,230,138,0.45) 0%, rgba(253,230,138,0) 55%)',
        'radial-gradient(circle at 82% 8%, rgba(252,211,77,0.30) 0%, rgba(252,211,77,0) 52%)',
        'repeating-linear-gradient(112deg, rgba(255,255,255,0.06) 0 2px, rgba(255,255,255,0) 2px 18px)',
        'linear-gradient(180deg, rgba(250,204,21,0.22) 0%, rgba(125,211,252,0.10) 32%, rgba(167,243,208,0.12) 62%, rgba(6,78,59,1) 100%)',
    ].join(',');

    const SPEEDS = React.useMemo(() => [
        { label: 'Slow', tickMs: 500 },    // Relaxed pace - visible progress
        { label: 'Medium', tickMs: 200 },   // Balanced - good for normal play
        { label: 'Fast', tickMs: 80 },      // Quick results - still smooth
    ], []);
    const tickMs = SPEEDS[clamp(speedIdx, 0, 2)]?.tickMs ?? 200;
    const speedLabel = SPEEDS[clamp(speedIdx, 0, 2)]?.label ?? 'Medium';

    const clock = clockInfo.text;

    const avgHealth = React.useMemo(() => {
        const p = grid.filter(Boolean);
        if (!p.length) return 0;
        return p.reduce((a, x) => a + x.health, 0) / p.length;
    }, [grid]);
    const total = React.useMemo(() => grid.filter(Boolean).length, [grid]);
    const alive = React.useMemo(() => grid.filter((p) => p && !p.isDead).length, [grid]);

    const envRef = React.useRef({ sun, rain, wind, biome, isNight, rainHint, temp, wx });
    React.useEffect(() => {
        envRef.current = { sun, rain, wind, biome, isNight, rainHint, temp, wx };
    }, [sun, rain, wind, biome, isNight, rainHint, temp, wx]);


    const geoAbortRef = React.useRef(null);
    const wxAbortRef = React.useRef(null);
    const wxRefreshAbortRef = React.useRef(null);
    const wxCoordsRef = React.useRef(null);
    const mapMarkerIcon = React.useMemo(
        () =>
            L.icon({
                iconUrl: markerIcon,
                iconRetinaUrl: markerIcon2x,
                shadowUrl: markerShadow,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            }),
        [],
    );
    React.useEffect(() => {
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIcon2x,
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
        });
    }, []);

    React.useEffect(() => {
        const onUnhandled = (e) => {
            const msg = String(e?.reason?.message || e?.reason || '');
            if (msg.includes('A listener indicated an asynchronous response')) {
                if (typeof e?.preventDefault === 'function') e.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', onUnhandled);
        return () => window.removeEventListener('unhandledrejection', onUnhandled);
    }, []);

    React.useEffect(() => {
        const onDown = (e) => {
            const el = nurseryRef.current;
            if (!el) return;
            if (el.contains(e.target)) return;
            setNurseryOpen(false);
        };
        window.addEventListener('pointerdown', onDown);
        return () => window.removeEventListener('pointerdown', onDown);
    }, []);

    const wrapRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const particlesRef = React.useRef([]);
    const rafRef = React.useRef(null);



    const applyLoc = React.useCallback((text) => {
        sunManualRef.current = false;
        rainManualRef.current = false;
        windManualRef.current = false;

        try {
            if (geoAbortRef.current) geoAbortRef.current.abort();
        } catch { }
        const controller = new AbortController();
        geoAbortRef.current = controller;

        const q = String(text || '').trim();
        if (!q) return;

        setToast(`Searching for ${q}...`);

        void (async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=np&q=${encodeURIComponent(q)}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                const hit = Array.isArray(data) ? data[0] : null;
                const lat = hit?.lat ? Number(hit.lat) : NaN;
                const lon = hit?.lon ? Number(hit.lon) : NaN;
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                    setToast('Location not found.');
                    return;
                }
                wxCoordsRef.current = { lat, lon };
                const resolvedLabel = hit?.display_name || q;
                setMapCenter([lat, lon]);
                setMapZoom(12);
                setMapLabel(resolvedLabel);

                try {
                    if (wxAbortRef.current) wxAbortRef.current.abort();
                } catch { }
                const wxController = new AbortController();
                wxAbortRef.current = wxController;
                setWxBusy(true);
                try {
                    const wxUrl = `${API_URL}/weather?lat=${lat}&lng=${lon}`;
                    const wxRes = await fetch(wxUrl, { method: 'GET', signal: wxController.signal });
                    if (!wxRes.ok) throw new Error('Backend weather fetch failed');
                    const wxData = await wxRes.json();

                    if (wxData.region) setBiome(wxData.region);
                    if (wxData.weather) {
                        setTemp(Math.round(wxData.weather.temperature));
                        setRain(Math.round(wxData.weather.rain));
                        setWind(Math.round(wxData.weather.wind_speed));
                        const cloud = wxData.weather.cloud_cover || 0;
                        setSun(Math.round(100 - cloud));
                        setToast(`Updated weather for ${wxData.location || resolvedLabel}`);
                    }
                } catch (e) {
                    if (e?.name === 'AbortError') return;
                    console.error(e);
                    setToast('Failed to fetch weather data from backend.');
                } finally {
                    setWxBusy(false);
                }
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setToast('Map search failed — check your internet connection or try a clearer location name.');
            }
        })();
    }, []);

    React.useEffect(() => {
        applyLoc(loc);
    }, []);

    React.useEffect(() => {
        const tick = () => {
            const coords = wxCoordsRef.current;
            if (!coords?.lat || !coords?.lon) return;
            try {
                if (wxRefreshAbortRef.current) wxRefreshAbortRef.current.abort();
            } catch { }
            const controller = new AbortController();
            wxRefreshAbortRef.current = controller;
            void (async () => {
                try {
                    const wxUrl = `${API_URL}/weather?lat=${coords.lat}&lng=${coords.lon}`;
                    const wxRes = await fetch(wxUrl, { method: 'GET', signal: controller.signal });
                    if (!wxRes.ok) return;
                    const wxData = await wxRes.json();

                    if (wxData.weather) {
                        setTemp(Math.round(wxData.weather.temperature));
                        setRain(Math.round(wxData.weather.rain));
                        setWind(Math.round(wxData.weather.wind_speed));
                        const cloud = wxData.weather.cloud_cover || 0;
                        setSun(Math.round(100 - cloud));
                    }
                } catch (e) {
                    if (e?.name === 'AbortError') return;
                }
            })();
        };

        const id = setInterval(tick, 60000);
        return () => {
            clearInterval(id);
            try {
                if (wxRefreshAbortRef.current) wxRefreshAbortRef.current.abort();
            } catch { }
        };
    }, []);

    const dailyAdviceRef = React.useRef({ day: 0, lastWarnAt: 0, lastKey: '' });

    const dailyAdvice = React.useCallback(() => {
        const { sun: s, rain: r, wind: w } = envRef.current;
        if (r >= 80) return 'Heavy rain today — skip watering and watch for waterlogging.';
        if (r >= 55) return 'Light rain expected — reduce irrigation and monitor soil moisture.';
        if (s > 80 && r < 25) return 'Hot & dry today — watering recommended to prevent wilting.';
        if (w >= 70) return 'Strong winds today — seedlings may stress; avoid spraying and secure supports.';
        if (biome === BIOME.MOUNTAIN && temp <= 12) return 'Cold mountain morning — growth slows; avoid overwatering.';
        return 'Stable field conditions — maintain regular watering and monitor plant health.';
    }, [biome, temp]);

    const advanceSimulationStep = React.useCallback(() => {
        const { sun: s, rain: r, biome: b, temp: tt, wx: wxx } = envRef.current;
        const drought = s > 80 && r < 20;

        let rolled = false;
        let deaths = 0;
        let matureAll = true;
        let aliveAny = false;

        setTod((prev) => {
            const next = prev + 1;

            if (next >= 100) {
                rolled = true;
                setDay((d) => d + 1);
                return 0;
            }
            return next;
        });

        if (rolled) {
            setToast(dailyAdvice());
        }

        setGrid((prev) => {
            const { sun: s2, rain: r2, biome: b2, temp: tt2 } = envRef.current;
            const drought2 = s2 > 80 && r2 < 20;
            const drowning2 = r2 > 80;

            return prev.map((p) => {
                if (!p) return null;
                if (p.isDead) return p;

                let deathCharged = Boolean(p.deathCharged);
                let health = p.health;

                const profile = cropProfileFor(p.species);
                const baseGrowthDays = Number.isFinite(p.growthDays)
                    ? p.growthDays
                    : Number.isFinite(p.growthProgress)
                        ? (p.growthProgress / 100) * profile.daysToMature
                        : 0;

                let growthDays = baseGrowthDays;
                const deltaDays = 1 / DAY_TICKS;
                // Rate 1.0 means 1 growth day per 1 simulation day.
                let rate = 1.0;

                // Pure time-based growth
                growthDays = clamp(growthDays + deltaDays * rate, 0, profile.daysToMature);
                const gp = clamp((growthDays / profile.daysToMature) * 100, 0, 100);

                // Apply environmental effects
                if (drought2) health -= 0.45;
                else if (drowning2) health -= 0.35;
                else health += 0.12;
                health = clamp(health, 0, 100);
                const isDead = health <= 0;

                if (isDead && !deathCharged) {
                    deaths += 1;
                    deathCharged = true;
                }

                const stage = stageFrom(gp);
                if (!isDead) {
                    aliveAny = true;
                    if (stage !== STAGE.MATURE) matureAll = false;
                }

                return {
                    ...p,
                    health,
                    isDead,
                    growthDays,
                    growthProgress: gp,
                    growthStage: stage,
                    deathCharged,
                };
            });
        });

        if (deaths > 0) {
            setCoins((c) => c - deaths * 5);
            setToast(`Crops died (-${deaths * 5} coins).`);
        }

        if (aliveAny && matureAll && !matureStopRef.current) {
            matureStopRef.current = true;
            setRunning(false);
            setToast('All crops are fully grown — harvest now to earn coins.');
        }
    }, [dailyAdvice]);

    React.useEffect(() => {
        if (!running || actionBusy) return;
        const interval = setInterval(advanceSimulationStep, tickMs);
        return () => clearInterval(interval);
    }, [running, actionBusy, tickMs, advanceSimulationStep]);

    React.useEffect(() => {
        if (!running) return;
        const now = Date.now();
        const drought = sun > 80 && rain < 20;
        const drowning = rain > 80;
        const key = drought ? 'drought' : drowning ? 'drowning' : wind >= 75 ? 'windy' : '';
        if (!key) return;
        if (dailyAdviceRef.current.lastKey === key && now - dailyAdviceRef.current.lastWarnAt < 6000) return;
        dailyAdviceRef.current.lastKey = key;
        dailyAdviceRef.current.lastWarnAt = now;

        if (key === 'drought') setToast('Alert: drought conditions — Water All or increase Rain to protect crops.');
        else if (key === 'drowning') setToast('Alert: waterlogging risk — reduce Rain and add Wind to dry.');
        else if (key === 'windy') setToast('Alert: high wind — seedlings may stress; avoid heavy watering.');
    }, [rain, running, sun, wind]);

    React.useEffect(() => {
        const el = wrapRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const rect = el.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        const loop = () => {
            const rect = el.getBoundingClientRect();
            const { rain: rr, wind: ww, isNight: night, rainHint: hint } = envRef.current;
            const baseIntensity = rr < 70 ? 0 : clamp((rr - 70) / 30, 0, 1);
            const hinted = hint ? 0.45 : 0;
            const intensity = Math.max(baseIntensity, hinted);
            const lean = ww > 50 ? ((ww - 50) / 50) * 4.2 : 0;
            ctx.clearRect(0, 0, rect.width, rect.height);

            const target = Math.floor(intensity * 120);
            const parts = particlesRef.current;
            while (parts.length < target) parts.push({ x: Math.random() * rect.width, y: Math.random() * rect.height, v: 5 + Math.random() * 6 });
            if (parts.length > target) parts.splice(target);

            if (intensity > 0) {
                ctx.globalAlpha = night ? 0.55 : 0.7;
                ctx.strokeStyle = night ? 'rgba(150,220,255,.55)' : 'rgba(185,240,255,.55)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (const p of parts) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + lean, p.y + 14);
                    p.y += p.v + intensity * 6;
                    p.x += lean * 0.2;
                    if (p.y > rect.height + 20 || p.x < -30 || p.x > rect.width + 30) {
                        p.y = -20;
                        p.x = Math.random() * rect.width;
                    }
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            ro.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const dropToCell = React.useCallback(
        (idxCell, species) => {
            const meta = NURSERY.find((n) => n.species === species);
            if (!meta) return;
            if (coinsRef.current < 2) {
                setToast('Not enough coins to plant. Need 2 coins per seed.');
                return;
            }
            matureStopRef.current = false;

            // Check if cell is occupied first
            if (gridRef.current[idxCell]) {
                setToast('That cell is already occupied.');
                return;
            }

            // Deduct coins IMMEDIATELY before placing plant
            coinsRef.current = coinsRef.current - 2;
            setCoins(coinsRef.current);

            // Check soil conditions
            const suitabilityScore = getSuitabilityScore(species);
            const isSuitable = suitabilityScore >= 15;
            const isPloughed = soilStateRef.current[idxCell]?.ploughed;
            let dead = false;
            // Immediate death logic
            // Immediate death logic
            if (!isSuitable) dead = true;

            const globalTick = dayRef.current * DAY_TICKS + todRef.current;
            setGrid((prev) => {
                const next = [...prev];
                if (next[idxCell]) return prev; // Double check
                next[idxCell] = {
                    id: uid(),
                    species: meta.species,
                    growthStage: STAGE.SEED,
                    growthDays: 0,
                    growthProgress: 0,
                    health: dead ? 0 : (meta.pref === biome ? 82 : 74),
                    isDead: dead,
                    preferredBiome: meta.pref,
                    emoji: meta.emoji,
                    deathCharged: false,
                    stressStrikes: 0, // Reset strikes
                };
                return next;
            });

            // Consume plough state if successful
            if (!dead && isPloughed) {
                setSoilState(prev => {
                    const next = [...prev];
                    if (next[idxCell]) next[idxCell] = { ...next[idxCell], ploughed: false };
                    return next;
                });
            }

            if (dead) {
                if (!isSuitable) setToast(`⚠️ Poor conditions. Seed died immediately. (-2g)`);
            } else {
                setToast(`${meta.emoji} ${meta.species} planted (-2 coins).`);
            }
        },
        [biome, getSuitabilityScore],
    );

    // Plant a crop in all selected cells
    const plantInSelection = React.useCallback(
        (species) => {
            const meta = NURSERY.find((n) => n.species === species);
            if (!meta) return;

            // If no cells are selected, show a message
            if (selection.size === 0) {
                setToast('⚠️ Select cells first, then click a crop to plant!');
                return;
            }

            // Count how many empty cells are selected
            const currentGrid = gridRef.current;
            let emptyCount = 0;
            for (const idx of selection) {
                if (!currentGrid[idx]) emptyCount += 1;
            }

            if (emptyCount === 0) {
                setToast('❌ All selected cells are already occupied.');
                return;
            }

            const costPerPlant = 2;
            const totalCost = emptyCount * costPerPlant;

            if (coinsRef.current < totalCost) {
                setToast(`❌ Not enough coins! Need ${totalCost}g for ${emptyCount} seeds, have ${coinsRef.current}g`);
                return;
            }

            matureStopRef.current = false;
            const globalTick = dayRef.current * DAY_TICKS + todRef.current;

            // Check suitability
            const suitabilityScore = getSuitabilityScore(species);
            const isSuitable = suitabilityScore >= 15;
            const currentSoil = soilStateRef.current;

            let planted = 0;
            let died = 0;

            setGrid((prev) => {
                const next = [...prev];
                for (const idx of selection) {
                    if (next[idx]) continue; // Skip occupied cells

                    const isPloughed = currentSoil[idx].ploughed;
                    let dead = false;
                    if (!isSuitable) dead = true;

                    if (dead) died++;
                    else planted++;

                    next[idx] = {
                        id: uid(),
                        species: meta.species,
                        growthStage: STAGE.SEED,
                        growthDays: 0,
                        growthProgress: 0,
                        health: dead ? 0 : (meta.pref === biome ? 82 : 74),
                        isDead: dead,
                        preferredBiome: meta.pref,
                        emoji: meta.emoji,
                        deathCharged: false, // Will be charged next tick if dead? Or effectively dead now.
                        stressStrikes: 0,
                    };
                }
                return next;
            });

            // Consume plough state for used cells
            setSoilState(prev => prev.map((s, i) => selection.has(i) && !gridRef.current[i] ? { ...s, ploughed: false } : s));

            // Deduct coins for all planted (even dead ones cost money)
            const actualCost = (planted + died) * costPerPlant;
            coinsRef.current = coinsRef.current - actualCost;
            setCoins(coinsRef.current);

            if (died > 0) {
                if (!isSuitable) setToast(`⚠️ Poor conditions (Score ${Math.round(suitabilityScore)}). ${died} crops died immediately. (-${actualCost}g)`);
            } else {
                setToast(`${meta.emoji} Planted ${planted} ${meta.species} seeds (-${actualCost}g). Score: ${Math.round(suitabilityScore)}`);
            }
        },
        [biome, selection, getSuitabilityScore],
    );

    // Build game state for backend chat
    const buildGameState = React.useCallback(() => {
        return {
            location: loc || biome,
            region: biome,
            gold: coins,
            day: day,
            grid: grid.map((p, i) => ({
                n: 40 + (rain / 10),
                p: 40,
                k: 40,
                rainfall: rain * 2.5,
                ph: 6.5,
                humidity: sun,
                temperature: temp,
                moisture: rain,
                crop: p?.species || null,
                stage: p?.growthProgress || 0,
                max_stage: 100,
                weed: 0,
                health: p?.health || 100
            }))
        };
    }, [loc, biome, coins, day, grid, rain, sun, temp]);

    // Trigger auto chat after actions
    const triggerAutoChat = React.useCallback(async (actionLog) => {
        if (chatBusy) return;
        setChatBusy(true);

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: null,
                    recent_actions: [actionLog, ...recentActionsRef.current.slice(0, 4)],
                    game_state: buildGameState()
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const reply = data?.response || '';
                if (reply) {
                    setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: reply }]);
                }
            } else {
                console.error('Auto-chat API error:', res.status);
            }
        } catch (err) {
            console.error('Auto-chat fetch error:', err);
        } finally {
            setChatBusy(false);
        }
    }, [chatBusy, buildGameState]);

    const handleBackendAction = React.useCallback(async (actionKey) => {
        if (!running) {
            setToast('⚠️ Start simulation to perform actions.');
            return;
        }
        const actionDef = BACKEND_ACTIONS[actionKey];
        if (!actionDef) return;
        if (actionBusy) return;

        // Check if any cells are selected
        if (selection.size === 0) {
            setToast('⚠️ Select cells first! use row/column buttons or click cells.');
            return;
        }

        // Calculate operational cost
        const costPerCell = actionDef.cost[biome] || 0;
        const totalOperationalCost = selection.size * costPerCell;

        // Check coins
        if (coinsRef.current < totalOperationalCost) {
            setToast(`❌ Not enough coins! Need ${totalOperationalCost}g, have ${coinsRef.current}g`);
            return;
        }

        // START BLOCKING ACTION
        const duration = actionDef.durationTicks || 5;
        setActionBusy({ name: actionDef.name, icon: actionDef.icon, progress: 0, total: duration });

        // Run simulation loop (Time Skip)
        for (let i = 0; i < duration; i++) {
            advanceSimulationStep();
            // Wait for tick animation
            await new Promise((resolve) => setTimeout(resolve, 100));
            setActionBusy((prev) => (prev ? { ...prev, progress: i + 1 } : null));
        }

        const globalTick = dayRef.current * DAY_TICKS + todRef.current;

        // Track results (CALCULATE SYNC TO AVOID RACE CONDITIONS)
        const result = {
            affected: 0,
            harvestCount: 0,
            harvestEarnings: 0,
            harvestDetails: new Map(),
            harvestedIndices: [],
        };

        // Special side-effects for specific actions
        if (actionKey === 'irrigate') {
            rainManualRef.current = true;
            setRain((r) => clamp(r + 20, 0, 100));
        }

        // PRE-CALCULATE UPDATES
        const currentGrid = gridRef.current;
        const nextGrid = [...currentGrid];

        for (const idx of selection) {
            const p = nextGrid[idx];

            // If cell is empty (p is null)
            if (!p) {
                if (!['harvest', 'irrigate', 'remove_crop'].includes(actionKey)) {
                    result.affected++;
                }
                continue;
            }

            // --- Remove Crop ---
            if (actionKey === 'remove_crop') {
                nextGrid[idx] = null;
                result.affected++;
                continue;
            }

            if (p.isDead) continue;

            // --- Harvesting ---
            if (actionKey === 'harvest') {
                const gp = Number.isFinite(p.growthProgress) ? p.growthProgress : 0;
                if (gp >= 75) {
                    result.harvestCount++;
                    result.harvestedIndices.push(idx);

                    // Calculate earnings with backend data
                    const cropDef = BACKEND_CROPS[p.species];
                    const yieldGold = cropDef ? cropDef.harvest_gold : 50;
                    result.harvestEarnings += yieldGold;

                    const cur = result.harvestDetails.get(p.species) || { emoji: p.emoji, count: 0 };
                    cur.count++;
                    result.harvestDetails.set(p.species, cur);

                    nextGrid[idx] = null; // Remove crop in next state
                }
                continue;
            }

            // --- Irrigation (Watering) ---
            if (actionKey === 'irrigate') {
                result.affected++;
                nextGrid[idx] = {
                    ...p,
                    health: clamp(p.health + 10, 0, 100),
                };
                continue;
            }

            // --- Other Actions ---
            result.affected++;
        }

        // Apply grid changes
        setGrid(nextGrid);

        // --- Ploughing State Update ---
        if (['plough', 'manual_plough'].includes(actionKey)) {
            setSoilState(prev => prev.map((s, i) => {
                if (selection.has(i)) return { ...s, ploughed: true };
                return s;
            }));
            result.affected = selection.size;
        }

        // Post-update logic (Coins, Toast, Bursts)
        if (actionKey === 'harvest') {
            if (result.harvestCount === 0) {
                setToast('🌱 No mature crops to harvest in selected cells.');
                setActionBusy(null);
                return;
            }

            const finalCost = totalOperationalCost;
            const netChange = result.harvestEarnings - finalCost;

            coinsRef.current = coinsRef.current + netChange;
            setCoins(coinsRef.current);

            const parts = Array.from(result.harvestDetails.entries()).map(([k, v]) => `${v.emoji} ${k} ×${v.count}`);
            setToast(`🌾 Harvested ${result.harvestCount} crops (+${result.harvestEarnings}g - ${finalCost}g cost): ${parts.join(' · ')}`);

            // Bursts
            const box = coinBoxRef.current?.getBoundingClientRect?.();
            if (box) {
                const toX = box.left + box.width / 2;
                const toY = box.top + box.height / 2;
                const now = Date.now();
                const bursts = result.harvestedIndices.map((i) => {
                    const el = cellRefs.current?.[i];
                    const r = el?.getBoundingClientRect?.();
                    if (!r) return null;
                    return { id: uid(), fromX: r.left + r.width / 2, fromY: r.top + r.height / 2, toX, toY, phase: 0, t0: now };
                }).filter(Boolean);
                if (bursts.length) setCoinBursts(prev => [...prev, ...bursts]);
            }

        } else {
            coinsRef.current = coinsRef.current - totalOperationalCost;
            setCoins(coinsRef.current);

            setToast(`${actionDef.icon} ${actionDef.name} applied (-${totalOperationalCost}g)`);
        }
        setActionBusy(null);
        void fetchRecommendations(); // Auto-refresh recommendations

        // Log action for chat context and trigger auto-response
        const actionLog = `${actionDef.name} applied to ${selection.size} cells (Day ${dayRef.current})`;
        recentActionsRef.current = [actionLog, ...recentActionsRef.current.slice(0, 9)];
        setRecentActions(recentActionsRef.current);
        triggerAutoChat(actionLog);

    }, [biome, selection, advanceSimulationStep, actionBusy, fetchRecommendations, running, triggerAutoChat]);

    const clearDead = React.useCallback(() => {
        let cleared = 0;
        setGrid((prev) =>
            prev.map((p) => {
                if (p && p.isDead) {
                    cleared += 1;
                    return null;
                }
                return p;
            }),
        );
        setToast(cleared ? `Cleared ${cleared} dead crops.` : 'No dead crops found.');
    }, []);

    const t = clamp(tod / 100, 0, 1);
    const arc = 1 - 4 * Math.pow(t - 0.5, 2);
    const celestialLeft = `${t * 100}%`;
    const celestialTop = `${80 - clamp(arc, 0, 1) * 55}%`;

    const matureGlow = (p) => isNight && p?.growthStage === STAGE.MATURE && p && !p.isDead;
    const jitter = (p) => wind > 50 && rain > 70 && p && !p.isDead;
    const scale = (p) => (p?.growthStage === STAGE.SEED ? 0.9 : p?.growthStage === STAGE.SPROUT ? 1.02 : 1.18);

    const sendChat = React.useCallback(async () => {
        const text = String(chatInput || '').trim();
        if (!text || chatBusy) return;
        setChatInput('');
        setChatMsgs((prev) => [...prev, { id: uid(), role: 'user', text }]);
        setChatBusy(true);

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    recent_actions: recentActionsRef.current.slice(0, 5),
                    game_state: buildGameState()
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const reply = data?.response || '';
                setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: reply || 'No response from lab assistant.' }]);
            } else {
                const errText = await res.text();
                console.error('Chat API error:', res.status, errText);
                setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: `Error: Backend returned ${res.status}. Check if backend is running.` }]);
            }
        } catch (err) {
            console.error('Chat fetch error:', err);
            setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: `Error: Could not connect to backend. Make sure the server is running on ${API_URL}` }]);
        } finally {
            setChatBusy(false);
        }
    }, [chatBusy, chatInput, buildGameState]);

    return (
        <div className="relative h-screen flex flex-col w-full text-white overflow-hidden" style={{ background: bgDay }}>
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'url(/game-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
            <div className="pointer-events-none absolute inset-0" style={{ background: bgNight, opacity: nightBlend, transition: 'opacity 1200ms ease' }} />
            <style>{`@keyframes j{0%{transform:translate(0,0)}25%{transform:translate(1px,-1px)}50%{transform:translate(-1px,1px)}75%{transform:translate(1px,1px)}100%{transform:translate(0,0)}} .wj{animation:j .22s infinite} .leaflet-container{background:rgba(0,0,0,.12)} .leaflet-container img{max-width:none!important} .leaflet-control-attribution{background:rgba(0,0,0,.35)!important;color:rgba(255,255,255,.75)!important} .leaflet-control-attribution a{color:rgba(255,255,255,.85)!important} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:rgba(255,255,255,0.05)} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:10px} ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3)} *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.2) rgba(255,255,255,0.05)}`}</style>
            {coinBursts.map((b) => (
                <div
                    key={b.id}
                    className="pointer-events-none fixed left-0 top-0 z-[60]"
                    style={{
                        transform: `translate(${b.phase === 0 ? b.fromX : b.toX}px, ${b.phase === 0 ? b.fromY : b.toY}px) translate(-50%,-50%)`,
                        transition: b.phase === 0 ? 'none' : 'transform 850ms cubic-bezier(.2,.85,.2,1), opacity 850ms ease',
                        opacity: b.phase === 0 ? 0.95 : 0,
                    }}
                >
                    <div className="rounded-full bg-amber-300/15 p-2 ring-1 ring-amber-200/25" style={{ filter: 'drop-shadow(0 0 10px rgba(253,230,138,.35))' }}>
                        <img src="/coin_deck.png" alt="Coin" className="h-4 w-4 object-contain" />
                    </div>
                </div>
            ))}
            <div className="mx-auto flex-1 min-h-0 w-full max-w-[1920px] p-3 flex flex-col">
                <div className="grid min-h-0 flex-1 w-full gap-4 grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[280px_1fr_280px] lg:grid-rows-1 xl:grid-cols-[360px_1fr_360px]">
                    <aside className={`flex min-h-0 flex-col gap-3 rounded-2xl p-3 overflow-y-auto ${glass}`}>
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center gap-2 text-sm font-semibold"><Leaf className="h-5 w-5" />Field Stats</div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Avg health</div><div className="mt-1 text-xl font-semibold">{Math.round(avgHealth)}</div></div>
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Temp</div><div className="mt-1 text-xl font-semibold">{Math.round(temp)}°C</div></div>
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Rain</div><div className="mt-1 text-xl font-semibold">{Math.round(rain)}mm</div></div>
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Wind</div><div className="mt-1 text-xl font-semibold">{Math.round(wind)}km/h</div></div>
                            </div>
                        </div>

                        <div className={`flex min-h-0 flex-1 flex-col rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide"><FlaskConical className="h-5 w-5" />EcoBot</div>
                                <div className="text-[11px] opacity-70"></div>
                            </div>
                            <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                                <div className="h-full space-y-2 overflow-y-auto p-3">
                                    {chatMsgs.map((m) => (
                                        <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                                            <div
                                                className={`inline-block max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === 'user'
                                                    ? 'bg-emerald-500/25 ring-1 ring-emerald-300/20'
                                                    : 'bg-white/10 ring-1 ring-white/10'
                                                    }`}
                                            >
                                                {m.role === 'assistant' && window.markdown ? (
                                                    <div className="[&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3 [&>li]:ml-4 [&>li]:list-disc last:[&>*]:mb-0 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>strong]:text-emerald-200" dangerouslySetInnerHTML={{ __html: window.markdown.toHTML(m.text) }} />
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{m.text}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') sendChat();
                                    }}
                                    placeholder="Ask for advice / stats / biome"
                                    className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-300/30"
                                />
                                <button
                                    onClick={sendChat}
                                    disabled={chatBusy}
                                    className="rounded-xl bg-emerald-500/25 px-3 py-2 text-sm font-semibold ring-1 ring-emerald-300/20 hover:bg-emerald-500/35 disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                            <div className="mt-2 text-[11px] opacity-70">Set <span className="font-mono">VITE_GEMINI_PROXY_URL</span> for real Gemini responses.</div>
                        </div>
                    </aside>

                    <main className={`relative min-h-0 overflow-auto rounded-2xl p-4 ${glass}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10">Day <span className="font-semibold">{day}</span> · {clock} · {tod}/100</div>
                                <div className={`rounded-xl px-3 py-2 text-sm ring-1 ring-white/10 ${isNight ? 'bg-indigo-500/20' : 'bg-amber-400/15'}`}>{isNight ? 'Night Mode' : 'Daylight'}</div>
                                <select
                                    value={speedIdx}
                                    onChange={(e) => setSpeedIdx(Number(e.target.value))}
                                    className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 outline-none hover:bg-white/15 focus:ring-emerald-400/50 cursor-pointer"
                                >
                                    <option value={0} className="bg-slate-900 text-white">Speed: Slow</option>
                                    <option value={1} className="bg-slate-900 text-white">Speed: Medium</option>
                                    <option value={2} className="bg-slate-900 text-white">Speed: Fast</option>
                                </select>
                                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-500/20 select-none">
                                    <div className="text-lg leading-none">💰</div>
                                    {coins}g
                                </div>
                            </div>

                            {/* Toast removed from here */}

                            <div className="relative" ref={nurseryRef}>
                                <button
                                    type="button"
                                    onClick={() => setNurseryOpen((v) => !v)}
                                    className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
                                >
                                    Nursery: <span className="font-semibold">{selectedCrop || 'Select'}</span>
                                </button>
                                {nurseryOpen && (
                                    <div className="absolute left-0 top-full z-20 mt-2 w-[280px] rounded-2xl bg-white/10 p-2 backdrop-blur-2xl ring-1 ring-white/20 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
                                        <div className="space-y-1">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    setSelectedCrop('');
                                                    setNurseryOpen(false);
                                                }}
                                                className="flex cursor-pointer select-none items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="text-lg leading-none">🚫</div>
                                                    <div className="font-semibold">None</div>
                                                </div>
                                            </div>
                                            {NURSERY.map((n) => (
                                                <div
                                                    key={`pick-${n.species}`}
                                                    role="button"
                                                    tabIndex={0}
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', n.species)}
                                                    onClick={() => {
                                                        if (selection.size > 0) {
                                                            // Plant in all selected cells
                                                            plantInSelection(n.species);
                                                        } else {
                                                            // No selection - just select crop for cell click
                                                            setSelectedCrop(n.species);
                                                        }
                                                        setNurseryOpen(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            if (selection.size > 0) {
                                                                plantInSelection(n.species);
                                                            } else {
                                                                setSelectedCrop(n.species);
                                                            }
                                                            setNurseryOpen(false);
                                                        }
                                                    }}

                                                    className="flex cursor-pointer select-none items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
                                                    title={`Drag or select: ${n.species} (prefers ${n.pref})`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-lg leading-none">{n.emoji}</div>
                                                        <div className="font-semibold">{n.species}</div>
                                                    </div>
                                                    <div className="text-[11px] opacity-70">Diff {n.diff}/5</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-[11px] opacity-70">Select cells → click a crop to plant, or drag into cells.</div>
                                    </div>
                                )}
                            </div>

                            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); applyLoc(loc); }}>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 opacity-70" />
                                    <input value={loc} onChange={(e) => setLoc(e.target.value)} className="w-[240px] rounded-xl bg-black/30 py-2 pl-9 pr-3 text-sm outline-none ring-1 ring-white/10 focus:ring-emerald-300/30" placeholder="Kathmandu / Chitwan / Mustang..." />
                                </div>
                                <button type="submit" className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">Apply</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const canStart = grid.some(Boolean) && String(loc || '').trim().length > 0;
                                        if (!running && !canStart) {
                                            setToast('Setup first: enter a location and plant at least one crop before starting simulation.');
                                            return;
                                        }
                                        setRunning((v) => {
                                            const next = !v;
                                            setToast(next ? `Simulation started (${speedLabel}). ${dailyAdvice()}` : 'Simulation paused. You can adjust environment and plant more crops.');
                                            return next;
                                        });
                                    }}
                                    className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 ${running ? 'bg-rose-500/25 hover:bg-rose-500/35' : 'bg-emerald-500/25 hover:bg-emerald-500/35'}`}
                                >
                                    {running ? 'Pause Simulation' : 'Start Simulation'}
                                </button>
                            </form>
                        </div>

                        <div className="pointer-events-none absolute left-0 top-0 h-44 w-full">
                            <div className="absolute" style={{ left: celestialLeft, top: celestialTop, transform: 'translate(-50%, -50%)', transition: 'left 120ms linear, top 120ms linear' }}>
                                <div className="relative">
                                    <div style={{ opacity: 1 - nightBlend, transition: 'opacity 900ms ease' }}>
                                        <div className="rounded-full bg-amber-300/10 p-2 ring-1 ring-amber-200/20" style={{ filter: `drop-shadow(0 0 12px rgba(253,230,138,${0.42 * (1 - nightBlend)}))` }}><Sun className="h-6 w-6 text-amber-100" /></div>
                                    </div>
                                    <div className="absolute inset-0" style={{ opacity: nightBlend, transition: 'opacity 900ms ease' }}>
                                        <div className="rounded-full bg-indigo-300/10 p-2 ring-1 ring-indigo-200/20" style={{ filter: `drop-shadow(0 0 12px rgba(147,197,253,${0.35 * nightBlend}))` }}><Moon className="h-6 w-6 text-indigo-100" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div ref={wrapRef} className="relative mt-4 rounded-2xl p-4 ring-1 ring-white/10" style={{ background: '#064e3b' }}>
                            <div className="absolute inset-0 rounded-2xl opacity-95" style={soilStyle(biome)} />
                            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

                            {/* Grid Selection Controls */}
                            <div className="relative mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-black/30 p-2">
                                <div className="flex items-center gap-1 text-xs opacity-80">
                                    <Grid3X3 className="h-4 w-4" />
                                    <span>Select:</span>
                                </div>
                                {[0, 1, 2, 3].map(i => (
                                    <button
                                        key={`row-${i}`}
                                        onClick={() => selectRow(i)}
                                        className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium ring-1 ring-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        Row {i + 1}
                                    </button>
                                ))}
                                <span className="opacity-40">|</span>
                                {[0, 1, 2, 3].map(i => (
                                    <button
                                        key={`col-${i}`}
                                        onClick={() => selectCol(i)}
                                        className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium ring-1 ring-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        Col {i + 1}
                                    </button>
                                ))}
                                <span className="opacity-40">|</span>
                                <button
                                    onClick={selectAll}
                                    className="rounded-lg bg-emerald-500/25 px-2 py-1 text-[11px] font-semibold ring-1 ring-emerald-300/20 hover:bg-emerald-500/40 transition-colors"
                                >
                                    All
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="rounded-lg bg-rose-500/25 px-2 py-1 text-[11px] font-semibold ring-1 ring-rose-300/20 hover:bg-rose-500/40 transition-colors"
                                >
                                    Clear ({selection.size})
                                </button>
                            </div>

                            <div className="relative grid grid-cols-4 gap-3">
                                {grid.map((p, i) => {
                                    const isPloughed = soilState[i]?.ploughed;
                                    const isDead = p?.isDead;
                                    const isDying = p && !isDead && (p.health < 40 || (p.stressStrikes || 0) > 0);

                                    return (
                                        <div
                                            key={i}
                                            ref={(el) => {
                                                cellRefs.current[i] = el;
                                            }}
                                            className={`relative aspect-square select-none rounded-xl bg-black/20 ring-1 transition-all cursor-pointer 
                                                ${selection.has(i) ? 'ring-2 ring-emerald-400 bg-emerald-500/20' :
                                                    isDead ? 'ring-red-900/50 bg-red-950/30 grayscale' :
                                                        isDying ? 'ring-2 ring-orange-500/50 bg-orange-500/10' :
                                                            'ring-white/10 hover:ring-white/30'
                                                }`}
                                            onClick={() => {
                                                if (!p && selectedCrop) {
                                                    // If selecting multiple cells, try to plant in all of them
                                                    if (selection.has(i)) {
                                                        plantInSelection(selectedCrop);
                                                    } else {
                                                        dropToCell(i, selectedCrop);
                                                    }
                                                }
                                                else toggleCellSelection(i);
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                dropToCell(i, e.dataTransfer.getData('text/plain'));
                                            }}
                                        >
                                            <div className="absolute left-2 top-2 text-[10px] opacity-70">{i + 1}</div>
                                            {!p && isPloughed && (
                                                <div className="absolute inset-0 m-1 rounded-lg bg-[#3e2723]/60 mix-blend-overlay ring-1 ring-[#5d4037]/50 flex items-center justify-center pointer-events-none">
                                                    <span className="opacity-40 text-xs text-white drop-shadow-md">🐂</span>
                                                </div>
                                            )}
                                            {isDead && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                    <Skull className="w-8 h-8 text-stone-300/60 drop-shadow-lg" />
                                                </div>
                                            )}
                                            {isDying && (
                                                <div className="absolute top-2 right-2 flex h-2 w-2 pointer-events-none z-10">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                </div>
                                            )}
                                            {!p ? (
                                                <div className="flex h-full items-center justify-center text-xs opacity-70">Drop</div>
                                            ) : (
                                                <div className={`flex h-full flex-col items-center justify-center gap-1 ${isDead ? 'opacity-40 blur-[1px]' : ''}`}>
                                                    <div className={`${p.isDead ? 'text-stone-300' : 'text-white'} ${jitter(p) ? 'wj' : ''}`} style={{ transform: `scale(${scale(p)}) rotate(${p.isDead ? -14 : 0}deg)`, transition: 'transform 350ms ease, filter 400ms ease', filter: matureGlow(p) ? 'drop-shadow(0 0 10px rgba(16,185,129,.55))' : 'none' }}>
                                                        {p.species === 'Potato' ? (
                                                            <div className="relative h-12 w-12">
                                                                <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 text-3xl" style={{ opacity: p.growthStage === STAGE.MATURE ? 1 : p.growthStage === STAGE.SPROUT ? 0.45 : 0.15 }}>
                                                                    🥔
                                                                </div>
                                                                <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-2xl" style={{ opacity: p.growthStage === STAGE.SEED ? 0 : 1 }}>
                                                                    {p.growthStage === STAGE.SPROUT ? '🌱' : '🌿'}
                                                                </div>
                                                            </div>
                                                        ) : p.growthStage === STAGE.SEED ? (
                                                            <div className="flex items-center justify-center">
                                                                <div className="h-2.5 w-2.5 rounded-full bg-amber-200/40 ring-1 ring-amber-100/20" />
                                                            </div>
                                                        ) : p.growthStage === STAGE.SPROUT ? (
                                                            <div className="text-3xl">🌱</div>
                                                        ) : (
                                                            <div className="text-3xl">{p.emoji}</div>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-semibold">{p.species}</div>
                                                    <div className="text-[10px] opacity-80">{p.isDead ? 'Dead' : `${p.growthStage} · ${Math.round(p.growthProgress)}%`}</div>
                                                </div>
                                            )}
                                            {actionBusy && selection.has(i) && (
                                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                                                    <div className="text-xl animate-bounce filter drop-shadow-lg">{actionBusy.icon}</div>
                                                    <div className="h-1.5 w-10 mt-2 rounded-full bg-white/20 ring-1 ring-white/10 overflow-hidden">
                                                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-75 ease-linear" style={{ width: `${(actionBusy.progress / actionBusy.total) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Overlay removed as per user request to move busy state to cells */}
                    </main>

                    <aside className={`flex min-h-0 flex-col gap-3 rounded-2xl p-3 overflow-y-auto ${glass}`}>
                        <div className={`rounded-2xl p-3 ${glass} relative`}>
                            {toast && (
                                <>
                                    <style>{`@keyframes slideIn{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}} .toast-anim{animation:slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)}`}</style>
                                    <div className="absolute top-2 right-2 z-[9999] max-w-[240px] toast-anim">
                                        <div className="relative rounded-xl bg-[#21170F] px-3 py-2 pr-8 text-xs font-medium text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md leading-snug">
                                            {toast}
                                            <button
                                                onClick={() => setToast(null)}
                                                className="absolute right-1 top-1 rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-5 w-5" />Location Map</div>
                            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-white/10">
                                <div className="h-44 w-full">
                                    <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} className="h-full w-full">
                                        <TileLayer
                                            attribution='&copy; OpenStreetMap contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={mapCenter} icon={mapMarkerIcon} />
                                        <MapRecenter center={mapCenter} zoom={mapZoom} />
                                    </MapContainer>
                                </div>
                            </div>
                            <div className="mt-2 text-[11px] opacity-70 break-words">{mapLabel}</div>
                        </div>



                        {/* Actions Section */}
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="text-sm font-semibold tracking-wide">Actions</div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {Object.entries(BACKEND_ACTIONS).map(([key, action]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleBackendAction(key)}
                                        disabled={!!actionBusy}
                                        className={`w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/10 transition-all text-left ${actionBusy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/15 active:scale-95'}`}
                                        title={action.desc}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{action.icon}</span>
                                            <div className="flex flex-col leading-none overflow-hidden w-full">
                                                <span className="truncate w-full">{action.name}</span>
                                                <div className="flex justify-between items-center w-full mt-1">
                                                    <span className="text-[10px] opacity-60 font-mono">{action.cost[biome]}💰</span>
                                                    <span className="text-[9px] opacity-50">{action.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                <button onClick={clearDead} className="col-span-2 w-full rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-semibold ring-1 ring-rose-200/20 hover:bg-rose-500/30"><div className="flex items-center justify-center gap-2"><Trash2 className="h-4 w-4" />Clear Dead Crops</div></button>
                            </div>
                        </div>

                        {/* Crop Recommendations Section */}
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold">🌱 Top 3 Recommended Crops</div>
                                <button
                                    onClick={fetchRecommendations}
                                    disabled={recsLoading}
                                    className="text-[10px] opacity-70 hover:opacity-100 disabled:opacity-40"
                                >
                                    {recsLoading ? '...' : '↻'}
                                </button>
                            </div>
                            <div className="mt-3 space-y-2">
                                {recommendations.length === 0 && !recsLoading && (
                                    <div className="text-[11px] opacity-60">No recommendations yet. Start the backend server.</div>
                                )}
                                {recommendations.map((rec, i) => (
                                    <div
                                        key={rec.crop}
                                        className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 ${i === 0 ? 'bg-emerald-500/20 ring-emerald-300/20' :
                                            i === 1 ? 'bg-amber-500/15 ring-amber-300/15' :
                                                'bg-white/10 ring-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-bold opacity-60">#{i + 1}</span>
                                            <span className="font-semibold text-sm">{rec.crop}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-amber-400' : 'text-white/70'}`}>
                                            {typeof rec.score === 'number' ? `${Math.round(rec.score)}💰` : rec.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-[10px] opacity-50">Based on current soil & weather conditions</div>
                        </div>
                    </aside>

                </div>
            </div >
        </div >
    );
}
