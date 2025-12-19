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
    { species: 'Mustard', emoji: '🌼', diff: 2, pref: BIOME.TERAI },
    { species: 'Maize', emoji: '🌽', diff: 2, pref: BIOME.HILLY },
    { species: 'Tea', emoji: '🍵', diff: 4, pref: BIOME.HILLY },
    { species: 'Millet', emoji: '🌿', diff: 3, pref: BIOME.MOUNTAIN },
    { species: 'Potato', emoji: '🥔', diff: 2, pref: BIOME.MOUNTAIN },
    { species: 'Apple', emoji: '🍎', diff: 4, pref: BIOME.MOUNTAIN },
];

const CROP_PROFILES = {
    Rice: { daysToMature: 120, waterEvery: 50, waterEveryDrought: 35, insecticideEveryDays: 14, pesticideEveryDays: 21 },
    Mustard: { daysToMature: 95, waterEvery: 220, waterEveryDrought: 140, insecticideEveryDays: 21, pesticideEveryDays: 28 },
    Maize: { daysToMature: 110, waterEvery: 160, waterEveryDrought: 110, insecticideEveryDays: 21, pesticideEveryDays: 28 },
    Tea: { daysToMature: 200, waterEvery: 140, waterEveryDrought: 90, insecticideEveryDays: 21, pesticideEveryDays: 28 },
    Millet: { daysToMature: 90, waterEvery: 260, waterEveryDrought: 160, insecticideEveryDays: 21, pesticideEveryDays: 28 },
    Potato: { daysToMature: 95, waterEvery: 140, waterEveryDrought: 90, insecticideEveryDays: 14, pesticideEveryDays: 21 },
    Apple: { daysToMature: 180, waterEvery: 420, waterEveryDrought: 260, insecticideEveryDays: 28, pesticideEveryDays: 35 },
};
const defaultCropProfile = { daysToMature: 100, waterEvery: 180, waterEveryDrought: 120, insecticideEveryDays: 21, pesticideEveryDays: 28 };
const cropProfileFor = (species) => CROP_PROFILES[species] || defaultCropProfile;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const stageFrom = (p) => (p < 35 ? STAGE.SEED : p < 75 ? STAGE.SPROUT : STAGE.MATURE);
const DAY_TICKS = 20; // Reduced from 101 for faster simulation (each day = 20 ticks)

function detectBiome(raw) {
    const q = String(raw || '').toLowerCase();
    if (['chitwan', 'lumbini', 'biratnagar', 'birgunj', 'janakpur', 'nepalgunj', 'dhangadhi', 'itahari'].some((k) => q.includes(k))) return BIOME.TERAI;
    if (['kathmandu', 'pokhara', 'ilam', 'dhulikhel', 'banepa', 'bhaktapur', 'lalitpur', 'gorkha', 'syangja'].some((k) => q.includes(k))) return BIOME.HILLY;
    if (['mustang', 'solukhumbu', 'manang', 'jumla', 'dolpa', 'humla', 'mugu', 'rasuwa'].some((k) => q.includes(k))) return BIOME.MOUNTAIN;
    return BIOME.HILLY;
}

function defaultsFor(b) {
    if (b === BIOME.TERAI) return { t: 32, sun: 78, rain: 58, wind: 28 };
    if (b === BIOME.MOUNTAIN) return { t: 9, sun: 56, rain: 34, wind: 42 };
    return { t: 22, sun: 64, rain: 48, wind: 34 };
}

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

    // Moved State Definitions to Top to fix ReferenceError
    const [carePrompt, setCarePrompt] = React.useState(null);
    const [careNow, setCareNow] = React.useState(0);
    const [sliderValue, setSliderValue] = React.useState(-1);

    const carePromptRef = React.useRef(carePrompt);
    React.useEffect(() => {
        carePromptRef.current = carePrompt;
    }, [carePrompt]);

    const dayRef = React.useRef(day);
    React.useEffect(() => {
        dayRef.current = day;
    }, [day]);
    const todRef = React.useRef(tod);
    React.useEffect(() => {
        todRef.current = tod;
    }, [tod]);

    // Care prompt timer - pauses simulation for 20 seconds, then auto-resumes
    React.useEffect(() => {
        if (!carePrompt) return;
        setCareNow(Date.now());
        const timer = setInterval(() => {
            const now = Date.now();
            setCareNow(now);
            // When 20sec timer expires, clear prompt and resume simulation
            const dueAt = Number(carePrompt?.dueAtMs) || 0;
            if (now >= dueAt) {
                setCarePrompt(null);
                setSliderValue(-1);
                // Auto-resume simulation after 20 seconds
                setRunning(true);
                setToast('Care time expired - simulation resumed. Plant may suffer!');
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [carePrompt?.plantIndex, carePrompt?.dueAtMs]);

    const applyCare = React.useCallback(() => {
        if (!carePrompt) return;
        const val = sliderValue;
        if (val === -1) return;

        const isMedium = val >= 40 && val <= 60;
        const targetIdx = carePrompt.plantIndex;
        const actionKey = String(carePrompt.action || '').toLowerCase();
        const globalTick = dayRef.current * DAY_TICKS + todRef.current;

        let killed = false;
        let strikeCount = 0;
        setGrid((g) => {
            const ng = [...g];
            const p = ng[targetIdx];
            if (!p || p.isDead) return g;

            if (isMedium) {
                ng[targetIdx] = {
                    ...p,
                    health: clamp(p.health + 15, 0, 100),
                    requiredAction: '',
                    careDueAtMs: 0,
                    lastCareTick: { ...(p.lastCareTick || {}), [actionKey]: globalTick },
                    stressStrikes: 0,
                };
                return ng;
            }

            const newStrikes = (p.stressStrikes || 0) + 1;
            strikeCount = newStrikes;
            const dmg = val < 40 ? 30 : 40;
            const nextHealth = clamp(p.health - dmg, 0, 100);
            if (newStrikes >= 2 || nextHealth <= 0) {
                killed = true;
                ng[targetIdx] = { ...p, isDead: true, health: 0, deathCharged: true };
                return ng;
            }

            ng[targetIdx] = {
                ...p,
                health: nextHealth,
                requiredAction: '',
                careDueAtMs: 0,
                lastCareTick: { ...(p.lastCareTick || {}), [actionKey]: globalTick },
                stressStrikes: newStrikes,
            };
            return ng;
        });

        if (isMedium) {
            setToast(`✓ Perfect! Medium ${carePrompt.action} applied. Plant is thriving!`);
        } else if (killed) {
            setToast(`✗ Plant died! Too many care errors. Choice: ${val}%.`);
            setCoins((c) => Math.max(0, c - 5));
        } else {
            const type = val < 40 ? 'Under-care' : 'Over-care';
            setToast(`⚠️ ${type} warning! Plant stressed (${val}%). Strike ${strikeCount}/2.`);
        }

        setCarePrompt(null);
        setSliderValue(-1);
        if (carePrompt.resumeRunning) setRunning(true);
    }, [carePrompt, sliderValue]);

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
    const gridRef = React.useRef(grid);
    React.useEffect(() => {
        gridRef.current = grid;
    }, [grid]);
    const speedIdxRef = React.useRef(speedIdx);
    React.useEffect(() => {
        speedIdxRef.current = speedIdx;
    }, [speedIdx]);
    const [toast, setToast] = React.useState('Drag crops from Nursery into the 4x4 field.');
    const [coins, setCoins] = React.useState(1000);
    const coinsRef = React.useRef(1000);
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
    const [selectedCrop, setSelectedCrop] = React.useState('');
    const [nurseryOpen, setNurseryOpen] = React.useState(false);
    const nurseryRef = React.useRef(null);

    // Grid selection state
    const [selection, setSelection] = React.useState(new Set());

    // Crop recommendations from ML model
    const [recommendations, setRecommendations] = React.useState([]);
    const [recsLoading, setRecsLoading] = React.useState(false);

    // Grid selection functions
    const toggleCellSelection = React.useCallback((idx) => {
        setSelection(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }, []);

    const selectRow = React.useCallback((rowIndex) => {
        setSelection(prev => {
            const next = new Set(prev);
            for (let c = 0; c < 4; c++) next.add(rowIndex * 4 + c);
            return next;
        });
    }, []);

    const selectCol = React.useCallback((colIndex) => {
        setSelection(prev => {
            const next = new Set(prev);
            for (let r = 0; r < 4; r++) next.add(r * 4 + colIndex);
            return next;
        });
    }, []);

    const selectAll = React.useCallback(() => {
        const next = new Set();
        for (let i = 0; i < 16; i++) next.add(i);
        setSelection(next);
    }, []);

    const clearSelection = React.useCallback(() => setSelection(new Set()), []);

    // Fetch crop recommendations from backend
    const fetchRecommendations = React.useCallback(async () => {
        setRecsLoading(true);
        try {
            // Build average soil params from environment
            const defaults = defaultsFor(biome);
            const reqBody = {
                n: 40 + (rain / 10),
                p: 40,
                k: 40,
                temperature: temp,
                humidity: defaults.sun,
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

    const WEATHER_API_KEY = import.meta?.env?.VITE_WEATHER_API_KEY;
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

    const syncFromWeather = React.useCallback((wxData, forceTime = false) => {
        const cur = wxData?.current;
        if (!cur) return;

        const tempC = Number(cur?.temp_c);
        const windKph = Number(cur?.wind_kph);
        const precipMm = Number(cur?.precip_mm);
        const humidity = Number(cur?.humidity);
        const cloud = Number(cur?.cloud);
        const uv = Number(cur?.uv);
        const isDayWx = Boolean(cur?.is_day);
        const conditionText = String(cur?.condition?.text || '').trim();
        const lastUpdated = String(cur?.last_updated || '').trim();

        setWx({ tempC, windKph, precipMm, humidity, cloud, uv, isDay: isDayWx, conditionText, lastUpdated });

        if (Number.isFinite(tempC)) setTemp(Math.round(tempC));

        if (!windManualRef.current && Number.isFinite(windKph)) {
            setWind(clamp(Math.round((windKph / 45) * 100), 0, 100));
        }

        const rainingText = /rain|drizzle|shower|thunder/i.test(conditionText);
        setRainHint(Boolean(rainingText));
        if (!rainManualRef.current && Number.isFinite(precipMm)) {
            const base = clamp(Math.round(precipMm * 18), 0, 100);
            const boosted = rainingText ? Math.max(base, 55) : base;
            setRain(boosted);
        }

        if (!sunManualRef.current) {
            if (Number.isFinite(cloud)) {
                const s = isDayWx ? clamp(Math.round(100 - cloud), 10, 100) : clamp(Math.round(20 - cloud / 5), 0, 25);
                setSun(s);
            } else if (Number.isFinite(uv) && isDayWx) {
                setSun(clamp(Math.round(40 + uv * 7), 0, 100));
            }
        }

        const localtime = String(wxData?.location?.localtime || '').trim();
        const m = localtime.match(/\b(\d{1,2}):(\d{2})\b/);
        if ((forceTime || !running) && m) {
            const hh = Number(m[1]);
            const mm = Number(m[2]);
            if (Number.isFinite(hh) && Number.isFinite(mm)) {
                const todNext = clamp(Math.round(((hh * 60 + mm) / (24 * 60)) * 100), 0, 100);
                setTod(todNext);
            }
        }
    }, [running]);

    const applyLoc = React.useCallback((text) => {
        sunManualRef.current = false;
        rainManualRef.current = false;
        windManualRef.current = false;

        const b = detectBiome(text);
        const d = defaultsFor(b);
        setBiome(b);
        setTemp(d.t);
        setSun(d.sun);
        setRain(d.rain);
        setWind(d.wind);
        setToast(`Biome updated to ${b}.`);

        try {
            if (geoAbortRef.current) geoAbortRef.current.abort();
        } catch { }
        const controller = new AbortController();
        geoAbortRef.current = controller;

        const q = String(text || '').trim();
        if (!q) return;
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
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
                wxCoordsRef.current = { lat, lon };
                const resolvedLabel = hit?.display_name || q;
                setMapCenter([lat, lon]);
                setMapZoom(12);
                setMapLabel(resolvedLabel);

                const b2 = detectBiome(resolvedLabel);
                const d2 = defaultsFor(b2);
                setBiome(b2);
                setTemp(d2.t);
                setSun(d2.sun);
                setRain(d2.rain);
                setWind(d2.wind);

                const k = String(WEATHER_API_KEY || '').trim();
                if (!k) {
                    setWx(null);
                    return;
                }

                try {
                    if (wxAbortRef.current) wxAbortRef.current.abort();
                } catch { }
                const wxController = new AbortController();
                wxAbortRef.current = wxController;
                setWxBusy(true);
                try {
                    const wxUrl = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(k)}&q=${lat},${lon}&aqi=no`;
                    const wxRes = await fetch(wxUrl, { method: 'GET', signal: wxController.signal });
                    if (!wxRes.ok) return;
                    const wxData = await wxRes.json();
                    syncFromWeather(wxData, true);
                } catch (e) {
                    if (e?.name === 'AbortError') return;
                } finally {
                    setWxBusy(false);
                }
            } catch (e) {
                if (e?.name === 'AbortError') return;
                setToast('Map search failed — check your internet connection or try a clearer location name.');
            }
        })();
    }, [WEATHER_API_KEY, syncFromWeather]);

    React.useEffect(() => {
        applyLoc(loc);
    }, []);

    React.useEffect(() => {
        const k = String(WEATHER_API_KEY || '').trim();
        if (!k) return;
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
                    const wxUrl = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(k)}&q=${coords.lat},${coords.lon}&aqi=no`;
                    const wxRes = await fetch(wxUrl, { method: 'GET', signal: controller.signal });
                    if (!wxRes.ok) return;
                    const wxData = await wxRes.json();
                    syncFromWeather(wxData, false);
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
    }, [WEATHER_API_KEY, syncFromWeather]);

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

    React.useEffect(() => {
        if (!running) return;
        const interval = setInterval(() => {
            // Simulation continues even with care prompts - no longer pausing

            const { sun: s, rain: r, biome: b, temp: tt, wx: wxx } = envRef.current;
            const drought = s > 80 && r < 20;

            const humidity = Number(wxx?.humidity);
            const humidPct = Number.isFinite(humidity) ? clamp(humidity, 0, 100) : clamp(Math.round(r + (r >= 55 ? 18 : 0)), 0, 100);
            const humid = humidPct >= 70;

            const globalTick = dayRef.current * DAY_TICKS + todRef.current;

            // Check for care needs and mark plants (but don't pause simulation)
            let newCareNeeded = null;
            for (let plantIndex = 0; plantIndex < gridRef.current.length; plantIndex += 1) {
                const p = gridRef.current[plantIndex];
                if (!p || p.isDead) continue;
                // Skip if already has a pending action
                if (String(p.requiredAction || '')) continue;

                const profile = cropProfileFor(p.species);
                const lastCareTick = p.lastCareTick || {};

                const gp = Number.isFinite(p.growthProgress) ? p.growthProgress : 0;
                const waterEvery = drought ? profile.waterEveryDrought : profile.waterEvery;
                const lastWater = Number.isFinite(lastCareTick.water) ? lastCareTick.water : globalTick;
                if (r < 70 && globalTick - lastWater >= waterEvery) {
                    newCareNeeded = { plantIndex, action: ACTION.WATER };
                    break;
                }

                const insectEvery = Math.round(profile.insecticideEveryDays * DAY_TICKS * (humid ? 0.85 : 1));
                const lastInsect = Number.isFinite(lastCareTick.insecticide) ? lastCareTick.insecticide : globalTick;
                if (gp >= 35 && globalTick - lastInsect >= insectEvery) {
                    newCareNeeded = { plantIndex, action: ACTION.INSECTICIDE };
                    break;
                }

                const pestEvery = Math.round(profile.pesticideEveryDays * DAY_TICKS * (humid ? 0.85 : 1));
                const lastPest = Number.isFinite(lastCareTick.pesticide) ? lastCareTick.pesticide : globalTick;
                if (gp >= 65 && globalTick - lastPest >= pestEvery) {
                    newCareNeeded = { plantIndex, action: ACTION.PESTICIDE };
                    break;
                }
            }

            // If new care is needed and no current prompt, pause simulation for 20 seconds
            if (newCareNeeded && !carePromptRef.current) {
                const expiresAtMs = Date.now() + 20000; // 20 second timer
                setGrid((prev) =>
                    prev.map((p, idx) => {
                        if (idx !== newCareNeeded.plantIndex) return p;
                        if (!p || p.isDead) return p;
                        return { ...p, requiredAction: newCareNeeded.action, careDueAtMs: expiresAtMs };
                    }),
                );
                setCarePrompt({ ...newCareNeeded, dueAtMs: expiresAtMs, resumeRunning: false });
                setToast(`⚠️ Care needed: ${newCareNeeded.action}! Crops continue growing but with penalties.`);
                setSliderValue(-1);
                // DON'T pause simulation - let plants grow with penalty
                // setRunning(false);
            }

            let rolled = false;
            let deaths = 0;
            let pendingAny = false;
            let matureAll = true;
            let aliveAny = false;

            setTod((prev) => {
                const next = prev + 1;

                if (next > 100) {
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

                    // Plants with pending care continue growing but with penalties
                    const hasPendingCare = String(p.requiredAction || '');
                    let careNeglectPenalty = 1; // growth rate multiplier
                    let careHealthDamage = 0; // per-tick health loss
                    if (hasPendingCare) {
                        pendingAny = true;
                        careNeglectPenalty = 0.3; // 70% slower growth when neglected
                        careHealthDamage = 0.5; // lose health per tick when care is neglected
                    }

                    const profile = cropProfileFor(p.species);
                    const baseGrowthDays = Number.isFinite(p.growthDays)
                        ? p.growthDays
                        : Number.isFinite(p.growthProgress)
                            ? (p.growthProgress / 100) * profile.daysToMature
                            : 0;

                    let growthDays = baseGrowthDays;
                    const deltaDays = 1 / DAY_TICKS;
                    // Speed multiplier: Fast=30x, Medium=15x, Slow=5x (much faster growth)
                    const speedMultiplier = speedIdxRef.current === 2 ? 30 : speedIdxRef.current === 1 ? 15 : 5;
                    let rate = 1.5 * speedMultiplier * careNeglectPenalty; // Base rate 1.5x
                    if (p.preferredBiome === b2) rate *= 1.3;
                    if (tt2 <= 8) rate *= 0.8;
                    const healthFactor = 0.7 + (health / 100) * 0.3; // Min 70% growth even at low health
                    growthDays = clamp(growthDays + deltaDays * rate * healthFactor, 0, profile.daysToMature);
                    const gp = clamp((growthDays / profile.daysToMature) * 100, 0, 100);

                    // Apply care neglect damage
                    health -= careHealthDamage;
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
                        // Keep pending care action, only clear if no pending care
                        requiredAction: hasPendingCare ? p.requiredAction : '',
                        careDueAtMs: hasPendingCare ? p.careDueAtMs : 0,
                        deathCharged,
                    };
                });
            });

            if (deaths > 0) {
                setCoins((c) => c - deaths * 5);
                setToast(`Crops died (-${deaths * 5} coins).`);
            }



            if (!pendingAny && aliveAny && matureAll && !matureStopRef.current) {
                matureStopRef.current = true;
                setRunning(false);
                setToast('All crops are fully grown — harvest now to earn coins.');
            }
        }, tickMs);

        return () => clearInterval(interval);
    }, [dailyAdvice, running, tickMs]);

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
                    health: meta.pref === biome ? 82 : 74,
                    isDead: false,
                    preferredBiome: meta.pref,
                    emoji: meta.emoji,
                    requiredAction: '',
                    careDueAtMs: 0,
                    lastCareTick: { water: globalTick, insecticide: globalTick, pesticide: globalTick },
                    deathCharged: false,
                    stressStrikes: 0,
                };
                return next;
            });
            setToast(`${meta.emoji} ${meta.species} planted (-2 coins).`);
        },
        [biome],
    );

    const waterAll = React.useCallback(() => {
        // Check if any cells are selected
        if (selection.size === 0) {
            setToast('⚠️ Select cells first! Use row/column buttons or click cells.');
            return;
        }

        const costPerCell = 10;
        const totalCost = selection.size * costPerCell;

        // Check if enough coins
        if (coinsRef.current < totalCost) {
            setToast(`❌ Not enough coins! Need ${totalCost}g, have ${coinsRef.current}g`);
            return;
        }

        rainManualRef.current = true;
        setRain((r) => clamp(r + 20, 0, 100));
        const globalTick = dayRef.current * DAY_TICKS + todRef.current;

        let affected = 0;
        setGrid((prev) =>
            prev.map((p, idx) => {
                // Only apply to selected cells
                if (!selection.has(idx)) return p;
                if (!p || p.isDead) return p;

                affected++;
                const clears = String(p.requiredAction || '') === ACTION.WATER;
                return {
                    ...p,
                    health: clamp(p.health + 10, 0, 100),
                    requiredAction: clears ? '' : p.requiredAction,
                    careDueAtMs: clears ? 0 : p.careDueAtMs,
                    lastCareTick: { ...(p.lastCareTick || {}), water: globalTick },
                };
            }),
        );

        // Decrement coins
        const actualCost = affected * costPerCell;
        coinsRef.current = coinsRef.current - actualCost;
        setCoins(coinsRef.current);

        setToast(`💧 Watered ${affected} cells (-${actualCost}g)`);
        const cp = carePromptRef.current;
        if (cp?.action === ACTION.WATER) {
            setCarePrompt(null);
            setSliderValue(-1);
            if (cp?.resumeRunning) setRunning(true);
        }
    }, [selection]);

    const insecticideAll = React.useCallback(() => {
        // Check if any cells are selected
        if (selection.size === 0) {
            setToast('⚠️ Select cells first! Use row/column buttons or click cells.');
            return;
        }

        const costPerCell = 15;
        const totalCost = selection.size * costPerCell;

        // Check if enough coins
        if (coinsRef.current < totalCost) {
            setToast(`❌ Not enough coins! Need ${totalCost}g, have ${coinsRef.current}g`);
            return;
        }

        const globalTick = dayRef.current * DAY_TICKS + todRef.current;

        let affected = 0;
        setGrid((prev) =>
            prev.map((p, idx) => {
                // Only apply to selected cells
                if (!selection.has(idx)) return p;
                if (!p || p.isDead) return p;

                affected++;
                const clears = String(p.requiredAction || '') === ACTION.INSECTICIDE;
                return {
                    ...p,
                    requiredAction: clears ? '' : p.requiredAction,
                    careDueAtMs: clears ? 0 : p.careDueAtMs,
                    lastCareTick: { ...(p.lastCareTick || {}), insecticide: globalTick },
                };
            }),
        );

        // Decrement coins
        const actualCost = affected * costPerCell;
        coinsRef.current = coinsRef.current - actualCost;
        setCoins(coinsRef.current);

        setToast(`🧪 Insecticide applied to ${affected} cells (-${actualCost}g)`);
        const cp = carePromptRef.current;
        if (cp?.action === ACTION.INSECTICIDE) {
            setCarePrompt(null);
            setSliderValue(-1);
            if (cp?.resumeRunning) setRunning(true);
        }
    }, [selection]);

    const pesticideAll = React.useCallback(() => {
        // Check if any cells are selected
        if (selection.size === 0) {
            setToast('⚠️ Select cells first! Use row/column buttons or click cells.');
            return;
        }

        const costPerCell = 15;
        const totalCost = selection.size * costPerCell;

        // Check if enough coins
        if (coinsRef.current < totalCost) {
            setToast(`❌ Not enough coins! Need ${totalCost}g, have ${coinsRef.current}g`);
            return;
        }

        const globalTick = dayRef.current * DAY_TICKS + todRef.current;

        let affected = 0;
        setGrid((prev) =>
            prev.map((p, idx) => {
                // Only apply to selected cells
                if (!selection.has(idx)) return p;
                if (!p || p.isDead) return p;

                affected++;
                const clears = String(p.requiredAction || '') === ACTION.PESTICIDE;
                return {
                    ...p,
                    requiredAction: clears ? '' : p.requiredAction,
                    careDueAtMs: clears ? 0 : p.careDueAtMs,
                    lastCareTick: { ...(p.lastCareTick || {}), pesticide: globalTick },
                };
            }),
        );

        // Decrement coins
        const actualCost = affected * costPerCell;
        coinsRef.current = coinsRef.current - actualCost;
        setCoins(coinsRef.current);

        setToast(`🧫 Pesticide applied to ${affected} cells (-${actualCost}g)`);
        const cp = carePromptRef.current;
        if (cp?.action === ACTION.PESTICIDE) {
            setCarePrompt(null);
            setSliderValue(-1);
            if (cp?.resumeRunning) setRunning(true);
        }
    }, [selection]);

    const harvestAll = React.useCallback(() => {
        // Check if any cells are selected
        if (selection.size === 0) {
            setToast('⚠️ Select cells first! Use row/column buttons or click cells.');
            return;
        }

        // Use mutable refs to track harvest results inside setGrid
        const harvestResults = { count: 0, cells: [], species: new Map() };

        setGrid((prev) => {
            const next = prev.map((p, idx) => {
                // Only harvest from selected cells
                if (!selection.has(idx)) return p;
                if (!p || p.isDead) return p;

                // Check if mature (growthProgress >= 75 = MATURE)
                const gp = Number.isFinite(p.growthProgress) ? p.growthProgress : 0;
                const isMature = gp >= 75;

                if (isMature) {
                    harvestResults.count += 1;
                    harvestResults.cells.push(idx);
                    const k = p.species;
                    const cur = harvestResults.species.get(k) || { species: p.species, emoji: p.emoji, count: 0 };
                    cur.count += 1;
                    harvestResults.species.set(k, cur);
                    return null; // Remove harvested crop
                }
                return p;
            });
            return next;
        });

        // Check results after a microtask to allow setGrid to complete
        setTimeout(() => {
            if (harvestResults.count === 0) {
                setToast('🌱 No mature crops in selected cells.');
                return;
            }

            // Earn coins for harvest (50g per crop)
            const earnedCoins = harvestResults.count * 50;
            coinsRef.current = coinsRef.current + earnedCoins;
            setCoins(coinsRef.current);

            const parts = Array.from(harvestResults.species.values()).map((x) => `${x.emoji} ${x.species} ×${x.count}`);
            setToast(`🌾 Harvested ${harvestResults.count} crops (+${earnedCoins}g): ${parts.join(' · ')}`);

            const box = coinBoxRef.current?.getBoundingClientRect?.();
            if (box) {
                const toX = box.left + box.width / 2;
                const toY = box.top + box.height / 2;
                const now = Date.now();
                const bursts = harvestResults.cells
                    .map((i) => {
                        const el = cellRefs.current?.[i];
                        const r = el?.getBoundingClientRect?.();
                        if (!r) return null;
                        return {
                            id: uid(),
                            fromX: r.left + r.width / 2,
                            fromY: r.top + r.height / 2,
                            toX,
                            toY,
                            phase: 0,
                            t0: now,
                        };
                    })
                    .filter(Boolean);
                if (bursts.length) setCoinBursts((prev) => [...prev, ...bursts]);
            }
        }, 0);
    }, [selection]);

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

    const careSecondsLeft = React.useMemo(() => {
        const dueAt = Number(carePrompt?.dueAtMs) || 0;
        if (!dueAt) return 0;
        return Math.max(0, Math.ceil((dueAt - careNow) / 1000));
    }, [careNow, carePrompt?.dueAtMs]);

    const sendChat = React.useCallback(async () => {
        const text = String(chatInput || '').trim();
        if (!text || chatBusy) return;
        setChatInput('');
        setChatMsgs((prev) => [...prev, { id: uid(), role: 'user', text }]);
        setChatBusy(true);

        const drought = sun > 80 && rain < 20;
        const drowning = rain > 80;
        const fallback = () => {
            const t = text.toLowerCase();
            if (t.includes('stats') || t.includes('health')) {
                return `Field Stats → Avg health ${Math.round(avgHealth)}. Alive ${alive}/${total}. Sun ${Math.round(sun)} Rain ${Math.round(rain)} Wind ${Math.round(wind)}.`;
            }
            if (t.includes('biome') || t.includes('location')) {
                return `Current biome is ${biome}. Matching-biome crops grow 1.5x faster. Try keywords: Kathmandu/Pokhara/Ilam (Hilly), Chitwan/Lumbini/Biratnagar (Terai), Mustang/Manang/Solukhumbu (Mountain).`;
            }
            if (t.includes('advice') || t.includes('help') || t.includes('how')) {
                if (drought) return 'Drought risk detected. Increase Rain (or Water All) and reduce Sun below 80 to prevent health loss.';
                if (drowning) return 'Drowning risk detected. Reduce Rain below 80; add Wind to lean rain and help canopy drying.';
                return `Stable conditions. Keep Sun ~55–75, Rain ~35–70. In ${biome}, matching crops get 1.5x growth speed.`;
            }
            return 'Ask for “advice”, “stats”, or “biome”.';
        };

        try {
            const proxyUrl = import.meta?.env?.VITE_GEMINI_PROXY_URL;
            if (proxyUrl) {
                const res = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        biome,
                        day,
                        timeOfDay: tod,
                        env: { sun, rain, wind, temperature: temp },
                        field: { avgHealth, alive, total },
                    }),
                });
                const data = await res.json();
                const reply = data?.reply || data?.advice || data?.text || '';
                setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: reply || fallback() }]);
            } else {
                await new Promise((r) => setTimeout(r, 250));
                setChatMsgs((prev) => [...prev, { id: uid(), role: 'assistant', text: fallback() }]);
            }
        } catch {
            setChatMsgs((prev) => [
                ...prev,
                {
                    id: uid(),
                    role: 'assistant',
                    text: 'Lab network issue. Set VITE_GEMINI_PROXY_URL to enable Gemini, otherwise use offline advice.',
                },
            ]);
        } finally {
            setChatBusy(false);
        }
    }, [alive, avgHealth, biome, chatBusy, chatInput, day, rain, sun, temp, tod, total, wind]);

    return (
        <div className="relative h-full w-full text-white" style={{ background: bgDay }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: bgNight, opacity: nightBlend, transition: 'opacity 1200ms ease' }} />
            <style>{`@keyframes j{0%{transform:translate(0,0)}25%{transform:translate(1px,-1px)}50%{transform:translate(-1px,1px)}75%{transform:translate(1px,1px)}100%{transform:translate(0,0)}} .wj{animation:j .22s infinite} .leaflet-container{background:rgba(0,0,0,.12)} .leaflet-container img{max-width:none!important} .leaflet-control-attribution{background:rgba(0,0,0,.35)!important;color:rgba(255,255,255,.75)!important} .leaflet-control-attribution a{color:rgba(255,255,255,.85)!important}`}</style>
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
            <div className="mx-auto h-full w-full max-w-[1920px] p-3">
                <div className="grid h-full grid-cols-[360px_1fr_360px] grid-rows-[1fr_auto] gap-4">
                    <aside className={`flex min-h-0 flex-col gap-3 rounded-2xl p-3 ${glass}`}>
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center gap-2 text-sm font-semibold"><Leaf className="h-5 w-5" />Field Stats</div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Avg health</div><div className="mt-1 text-xl font-semibold">{Math.round(avgHealth)}</div></div>
                                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10"><div className="text-[11px] opacity-70">Plants</div><div className="mt-1 text-xl font-semibold">{alive}/{total}</div></div>
                            </div>
                            <div className="mt-3 rounded-xl bg-white/10 p-3 text-[12px] ring-1 ring-white/10">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{biome}</div><div className="font-semibold">{temp}°C</div></div>
                            </div>
                        </div>

                        <div className={`flex min-h-0 flex-1 flex-col rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide"><FlaskConical className="h-5 w-5" />Laboratory Chat</div>
                                <div className="text-[11px] opacity-70">Gemini-ready</div>
                            </div>
                            <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                                <div className="h-full space-y-2 overflow-y-auto p-3">
                                    {chatMsgs.map((m) => (
                                        <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                                            <div
                                                className={`inline-block max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-snug ${m.role === 'user'
                                                    ? 'bg-emerald-500/25 ring-1 ring-emerald-300/20'
                                                    : 'bg-white/10 ring-1 ring-white/10'
                                                    }`}
                                            >
                                                {m.text}
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

                    <main className={`relative overflow-hidden rounded-2xl p-4 ${glass}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10">Day <span className="font-semibold">{day}</span> · {clock} · {tod}/100</div>
                                <div className={`rounded-xl px-3 py-2 text-sm ring-1 ring-white/10 ${isNight ? 'bg-indigo-500/20' : 'bg-amber-400/15'}`}>{isNight ? 'Night Mode' : 'Daylight'}</div>
                                <div className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10">Speed: <span className="font-semibold">{speedLabel}</span></div>
                            </div>

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
                                            {NURSERY.map((n) => (
                                                <div
                                                    key={`pick-${n.species}`}
                                                    role="button"
                                                    tabIndex={0}
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', n.species)}
                                                    onClick={() => {
                                                        setSelectedCrop(n.species);
                                                        setNurseryOpen(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setSelectedCrop(n.species);
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
                                        <div className="mt-2 text-[11px] opacity-70">Select then click a cell, or drag into the field.</div>
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
                                        if (!running && carePromptRef.current) {
                                            setToast('Care required — complete the required action before starting simulation.');
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
                                {grid.map((p, i) => (
                                    <div
                                        key={i}
                                        ref={(el) => {
                                            cellRefs.current[i] = el;
                                        }}
                                        className={`relative aspect-square select-none rounded-xl bg-black/20 ring-1 transition-all cursor-pointer ${selection.has(i) ? 'ring-2 ring-emerald-400 bg-emerald-500/20' : 'ring-white/10 hover:ring-white/30'}`}
                                        onClick={() => {
                                            if (!p && selectedCrop) dropToCell(i, selectedCrop);
                                            else toggleCellSelection(i);
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            dropToCell(i, e.dataTransfer.getData('text/plain'));
                                        }}
                                    >
                                        <div className="absolute left-2 top-2 text-[10px] opacity-70">{i + 1}</div>
                                        {!p ? (
                                            <div className="flex h-full items-center justify-center text-xs opacity-70">Drop</div>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center gap-1">
                                                <div className={`${p.isDead ? 'text-stone-300 opacity-70' : 'text-white'} ${jitter(p) ? 'wj' : ''}`} style={{ transform: `scale(${scale(p)}) rotate(${p.isDead ? -14 : 0}deg)`, transition: 'transform 350ms ease, filter 400ms ease', filter: matureGlow(p) ? 'drop-shadow(0 0 10px rgba(16,185,129,.55))' : 'none' }}>
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
                                                <div className="text-[10px] opacity-80">{p.growthStage} · {Math.round(p.growthProgress)}%</div>
                                                {!!String(p.requiredAction || '') && !p.isDead && (
                                                    <div className="mt-1 rounded-lg bg-rose-500/15 px-2 py-1 text-[10px] font-semibold ring-1 ring-rose-200/20">
                                                        {p.requiredAction} in {Math.max(1, Math.ceil(((Number(p.careDueAtMs) || 0) - careNow) / 1000))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[12px] ring-1 ring-white/10">{toast}</div>
                    </main>

                    <aside className={`flex flex-col gap-3 rounded-2xl p-3 ${glass}`}>
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-5 w-5" />Map & Weather</div>
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
                            <div className="mt-2 rounded-xl bg-white/10 p-2 text-[11px] ring-1 ring-white/10">
                                {!WEATHER_API_KEY ? (
                                    <div className="opacity-80">Set <span className="font-mono">VITE_WEATHER_API_KEY</span> to enable real-time weather.</div>
                                ) : wxBusy ? (
                                    <div className="opacity-80">Fetching live weather…</div>
                                ) : wx ? (
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        <div className="col-span-2 font-semibold">{wx.conditionText || 'Current conditions'}</div>
                                        <div>Temp: <span className="font-semibold">{Number.isFinite(wx.tempC) ? `${Math.round(wx.tempC)}°C` : `${temp}°C`}</span></div>
                                        <div>Wind: <span className="font-semibold">{Number.isFinite(wx.windKph) ? `${Math.round(wx.windKph)} km/h` : `${Math.round(wind)}`}</span></div>
                                        <div>Precip: <span className="font-semibold">{Number.isFinite(wx.precipMm) ? `${wx.precipMm} mm` : '-'}</span></div>
                                        <div>Humidity: <span className="font-semibold">{Number.isFinite(wx.humidity) ? `${Math.round(wx.humidity)}%` : '-'}</span></div>
                                    </div>
                                ) : (
                                    <div className="opacity-80">No live weather yet — type a location and press Apply.</div>
                                )}
                            </div>
                        </div>
                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="text-sm font-semibold tracking-wide">Environment</div>
                            <div className="mt-3 space-y-3 text-xs">
                                <label className="block">
                                    <div className="mb-1 flex items-center justify-between">
                                        <div className="font-semibold">Simulation speed</div>
                                        <div className="font-semibold">{speedLabel}</div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="1"
                                        value={speedIdx}
                                        onChange={(e) => setSpeedIdx(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="mt-1 flex justify-between text-[11px] opacity-80">
                                        <span>Slow</span>
                                        <span>Medium</span>
                                        <span>Fast</span>
                                    </div>
                                </label>
                                <label className="block">
                                    <div className="mb-1 flex items-center justify-between"><div className="flex items-center gap-2"><Sun className="h-4 w-4" />Sun</div><div className="font-semibold">{Math.round(sun)}</div></div>
                                    <input type="range" min="0" max="100" value={sun} onChange={(e) => { sunManualRef.current = true; setSun(Number(e.target.value)); }} className="w-full" />
                                </label>
                                <label className="block">
                                    <div className="mb-1 flex items-center justify-between"><div className="flex items-center gap-2"><CloudRain className="h-4 w-4" />Rain</div><div className="font-semibold">{Math.round(rain)}</div></div>
                                    <input type="range" min="0" max="100" value={rain} onChange={(e) => { rainManualRef.current = true; setRain(Number(e.target.value)); }} className="w-full" />
                                </label>
                                <label className="block">
                                    <div className="mb-1 flex items-center justify-between"><div className="flex items-center gap-2"><Wind className="h-4 w-4" />Wind</div><div className="font-semibold">{Math.round(wind)}</div></div>
                                    <input type="range" min="0" max="100" value={wind} onChange={(e) => { windManualRef.current = true; setWind(Number(e.target.value)); }} className="w-full" />
                                </label>
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
                                            {typeof rec.score === 'number' ? `${Math.round(rec.score)}g` : rec.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-[10px] opacity-50">Based on current soil & weather conditions</div>
                        </div>

                        <div className={`rounded-2xl p-3 ${glass}`}>
                            <div className="text-sm font-semibold tracking-wide">Actions</div>
                            {carePrompt && (
                                <div className="mt-3 rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-200/20">
                                    <div className="flex items-center justify-between text-[12px]">
                                        <div className="font-semibold">Care Required</div>
                                        <div className="font-extrabold text-rose-200">{careSecondsLeft}s</div>
                                    </div>
                                    <div className="mt-1 text-[11px] opacity-80">
                                        Plant #{carePrompt.plantIndex + 1} needs <span className="font-semibold">{carePrompt.action}</span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="mb-1 flex justify-between text-[10px] opacity-70">
                                            <span>Low</span>
                                            <span>Medium (Safe)</span>
                                            <span>High</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={sliderValue}
                                            onChange={(e) => setSliderValue(Number(e.target.value))}
                                            className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        {sliderValue !== -1 && (
                                            <div className={`mt-1 text-[11px] font-bold ${sliderValue >= 40 && sliderValue <= 60 ? 'text-emerald-400' : 'text-rose-300'}`}>
                                                {sliderValue < 40 ? 'Too Low!' : sliderValue > 60 ? 'Too High!' : 'Perfect Range'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        disabled={sliderValue === -1}
                                        onClick={applyCare}
                                        className="mt-3 w-full rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Apply {carePrompt.action}
                                    </button>
                                </div>
                            )}
                            <div className="mt-3 space-y-2">
                                <button onClick={waterAll} className="w-full rounded-xl bg-emerald-500/25 px-3 py-2 text-sm font-semibold ring-1 ring-emerald-300/20 hover:bg-emerald-500/35"><div className="flex items-center justify-center gap-2"><Droplets className="h-4 w-4" />Water All</div></button>
                                <button onClick={insecticideAll} className="w-full rounded-xl bg-sky-500/20 px-3 py-2 text-sm font-semibold ring-1 ring-sky-200/20 hover:bg-sky-500/30"><div className="flex items-center justify-center gap-2"><FlaskConical className="h-4 w-4" />Insecticide</div></button>
                                <button onClick={pesticideAll} className="w-full rounded-xl bg-violet-500/20 px-3 py-2 text-sm font-semibold ring-1 ring-violet-200/20 hover:bg-violet-500/30"><div className="flex items-center justify-center gap-2"><FlaskConical className="h-4 w-4" />Pesticide</div></button>
                                <button onClick={harvestAll} className="w-full rounded-xl bg-amber-400/20 px-3 py-2 text-sm font-semibold ring-1 ring-amber-200/20 hover:bg-amber-400/30"><div className="flex items-center justify-center gap-2"><Leaf className="h-4 w-4" />Harvest All</div></button>
                                <button onClick={clearDead} className="w-full rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-semibold ring-1 ring-rose-200/20 hover:bg-rose-500/30"><div className="flex items-center justify-center gap-2"><Trash2 className="h-4 w-4" />Clear Dead Crops</div></button>
                            </div>
                            <div className="mt-3 rounded-xl bg-white/10 p-3 text-[12px] ring-1 ring-white/10">
                                <div className="flex items-center gap-2"><Skull className="h-4 w-4" />Death rules</div>
                                <div className="mt-1 opacity-80">Drought: Sun&gt;80 & Rain&lt;20. Drowning: Rain&gt;80.</div>
                            </div>
                            <div ref={coinBoxRef} className="relative mt-3 overflow-hidden rounded-xl px-3 py-2 text-[12px] ring-1 ring-amber-200/25" style={{ background: 'linear-gradient(180deg, rgba(253,230,138,.22) 0%, rgba(245,158,11,.14) 100%)' }}>
                                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-300/10" />
                                <div className="absolute -right-6 -bottom-10 h-24 w-24 rounded-full bg-yellow-200/10" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-amber-50">
                                        <img src="/coin_deck.png" alt="Coins" className="h-6 w-6 object-contain" />
                                        Coins
                                    </div>
                                    <div className="text-sm font-extrabold text-amber-100" style={{ textShadow: '0 0 14px rgba(245,158,11,.22)' }}>{coins}</div>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
}
