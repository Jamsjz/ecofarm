import React from 'react';
import { useNavigate } from 'react-router-dom';

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

            <div className="absolute left-6 top-6 z-10">
                <div
                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-2.5 text-white ring-1 ring-white/20 backdrop-blur-xl"
                    style={{ boxShadow: '0 16px 60px rgba(0,0,0,.20)' }}
                >
                    <div className="text-lg font-extrabold tracking-wide">EcoFarm</div>
                </div>
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
                            ECOFARM
                        </div>
                        <div className="mt-4 flex justify-center">
                            <div
                                className="inline-flex max-w-[740px] rounded-2xl bg-black/15 px-5 py-3 text-white/95 ring-1 ring-white/15 backdrop-blur-md"
                                style={{ boxShadow: '0 16px 60px rgba(0,0,0,.18)' }}
                            >
                                <div className="text-base font-medium leading-relaxed tracking-wide md:text-lg" style={{ textShadow: '0 8px 22px rgba(0,0,0,.30)' }}>
                                    Learn sustainable farming, manage crops, and grow your virtual farm.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={() => navigate('/game')}
                            className="group relative inline-flex items-center justify-center rounded-2xl px-8 py-3 text-sm font-bold tracking-wide text-white outline-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0 active:scale-[0.98]"
                        >
                            <span className="absolute -inset-10 rounded-[28px] bg-white/12 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <span className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-3xl backdrop-saturate-200 ring-1 ring-white/30 shadow-[0_22px_90px_rgba(0,0,0,0.40)] transition-all duration-400 group-hover:bg-white/14 group-hover:ring-white/45 group-hover:shadow-[0_30px_120px_rgba(0,0,0,0.46)]" />
                            <span className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/30 via-white/10 to-white/5 opacity-90" />
                            <span className="absolute inset-[1px] rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),rgba(255,255,255,0)_55%)] opacity-80 mix-blend-overlay" />
                            <span className="absolute inset-0 overflow-hidden rounded-2xl">
                                <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-sm" style={{ animation: 'lpShimmer 2.8s ease-in-out infinite' }} />
                            </span>
                            <span className="relative flex items-center gap-2 drop-shadow-[0_12px_34px_rgba(0,0,0,0.40)]">
                                ENTER GAME
                            </span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
