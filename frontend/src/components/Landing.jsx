import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Landing() {
    const navigate = useNavigate();

    const windPath = React.useCallback((y, amp = 28) => {
        const a1 = Math.max(10, Math.round(amp));
        const a2 = Math.max(10, Math.round(amp * 0.8));
        return `M0,${y} C160,${y - a1} 240,${y + a1} 400,${y} C560,${y - a2} 640,${y + a2} 800,${y} C960,${y - a1} 1040,${y + a1} 1200,${y}`;
    }, []);

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundImage: "url('/landingpage.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <Navbar />
            <style>{`
        @keyframes lpWindA { 0% { transform: translate3d(-28%, 0px, 0); } 50% { transform: translate3d(-14%, -5px, 0); } 100% { transform: translate3d(0%, 0px, 0); } }
        @keyframes lpWindB { 0% { transform: translate3d(-34%, 0px, 0); } 50% { transform: translate3d(-17%, 6px, 0); } 100% { transform: translate3d(0%, 0px, 0); } }
        @keyframes lpWindC { 0% { transform: translate3d(-22%, 0px, 0); } 50% { transform: translate3d(-11%, 4px, 0); } 100% { transform: translate3d(0%, 0px, 0); } }
        @keyframes lpFlow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -240; } }
        @keyframes lpShimmer { 0% { transform: translateX(-140%) rotate(10deg); opacity: .0; } 20% { opacity: .75; } 50% { opacity: .0; transform: translateX(140%) rotate(10deg); } 100% { opacity: .0; transform: translateX(140%) rotate(10deg); } }
        @keyframes lpPop { 0% { opacity: 0; transform: translate3d(0,10px,0) scale(.98); } 100% { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
        .lp-wind-a { animation: lpWindA 11s linear infinite; }
        .lp-wind-b { animation: lpWindB 17s linear infinite; }
        .lp-wind-c { animation: lpWindC 13s linear infinite; }
        .lp-flow { animation: lpFlow 2.8s linear infinite; }
        .lp-pop { animation: lpPop 520ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .lp-wind-a, .lp-wind-b, .lp-wind-c, .lp-flow, .lp-pop { animation: none !important; }
        }
      `}</style>

            <div className="absolute inset-0 bg-black/10" />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <svg className="lp-wind-a absolute inset-0 h-full w-[220%] opacity-45 mix-blend-overlay" viewBox="0 0 1200 800" preserveAspectRatio="none">
                    {[80, 140, 210, 280, 360, 440, 520, 600, 680, 740].map((y, i) => (
                        <path
                            key={`a-${y}`}
                            d={windPath(y, 34 - (i % 3) * 6)}
                            fill="none"
                            stroke={`rgba(255,255,255,${0.22 - (i % 4) * 0.03})`}
                            strokeWidth={i % 3 === 0 ? 3.5 : 2.2}
                            strokeLinecap="round"
                            strokeDasharray={i % 2 === 0 ? '18 26' : '12 22'}
                            className="lp-flow"
                            style={{ animationDuration: `${2.8 + (i % 5) * 0.6}s` }}
                        />
                    ))}
                </svg>

                <svg className="lp-wind-b absolute inset-0 h-full w-[240%] opacity-35 mix-blend-overlay" viewBox="0 0 1200 800" preserveAspectRatio="none">
                    {[110, 180, 250, 330, 410, 490, 570, 650, 710].map((y, i) => (
                        <path
                            key={`b-${y}`}
                            d={windPath(y, 26 - (i % 3) * 4)}
                            fill="none"
                            stroke={`rgba(255,255,255,${0.18 - (i % 4) * 0.025})`}
                            strokeWidth={i % 3 === 1 ? 3 : 1.8}
                            strokeLinecap="round"
                            strokeDasharray={i % 2 === 0 ? '16 28' : '10 20'}
                            className="lp-flow"
                            style={{ animationDuration: `${3.4 + (i % 6) * 0.7}s` }}
                        />
                    ))}
                </svg>

                <svg className="lp-wind-c absolute inset-0 h-full w-[210%] opacity-30 mix-blend-overlay" viewBox="0 0 1200 800" preserveAspectRatio="none">
                    {[60, 160, 300, 460, 620, 760].map((y, i) => (
                        <path
                            key={`c-${y}`}
                            d={windPath(y, 18 - (i % 2) * 3)}
                            fill="none"
                            stroke="rgba(255,255,255,0.14)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeDasharray="14 30"
                            className="lp-flow"
                            style={{ animationDuration: `${4.6 + i * 0.9}s` }}
                        />
                    ))}
                </svg>
            </div>

            <div className="absolute left-6 top-[18px] z-10">
                <img
                    src="/logo.png"
                    alt="EcoFarm Logo"
                    className="h-24 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
                />
            </div>

            <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <div className="lp-pop w-full max-w-[920px] text-center">
                    <div className="mt-8">
                        <div className="text-white/95 text-4xl font-extrabold md:text-6xl" style={{ textShadow: '0 10px 34px rgba(0,0,0,.40)' }}>
                            WELCOME TO
                        </div>
                        <div
                            className="mt-2 text-white text-6xl font-black md:text-8xl"
                            style={{
                                letterSpacing: '0.06em',
                                textShadow: '0 14px 50px rgba(0,0,0,.48)',
                            }}
                        >
                            ECOFARMA
                        </div>
                        <div className="mt-4 flex justify-center">
                            <div
                                className="inline-flex max-w-[740px] rounded-2xl bg-black/15 px-5 py-3 text-white/95 ring-1 ring-white/15 backdrop-blur-md"
                                style={{ boxShadow: '0 16px 60px rgba(0,0,0,.18)' }}
                            >
                                <div className="text-base font-medium leading-relaxed tracking-wide md:text-lg" style={{ textShadow: '0 8px 22px rgba(0,0,0,.30)' }}>
                                    Experience the future of agriculture-master sustainable farming in our immersive game, or instantly diagnose crop health with our advanced AI detection.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => navigate('/game')}
                            className="group relative inline-flex min-w-[200px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-4 text-sm font-black tracking-widest text-white uppercase shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(245,158,11,0.3)] active:translate-y-0 active:scale-95"
                        >
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <span className="relative flex items-center gap-3">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ENTER GAME
                            </span>
                        </button>

                        <a
                            href="http://localhost:5173"
                            className="group relative inline-flex min-w-[200px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-4 text-sm font-black tracking-widest text-white uppercase shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:translate-y-0 active:scale-95"
                        >
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <span className="relative flex items-center gap-3">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                DETECT
                            </span>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
