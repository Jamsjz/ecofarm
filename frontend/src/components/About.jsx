import React from 'react';
import Navbar from './Navbar';

export default function About() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden bg-black text-white"
            style={{
                backgroundImage: "url('/landingpage.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />

                <main className="flex-grow flex flex-col items-center justify-center px-4 py-20">
                    <div className="max-w-4xl w-full space-y-12">

                        {/* Header Section */}
                        <div className="text-center space-y-6">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl">
                                Reimagining <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Agriculture</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed">
                                EcoFarm combines advanced computer vision with expert agronomy to empower farmers with instant, accurate disease diagnosis.
                            </p>
                        </div>

                        {/* Content Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Mission Card */}
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/15 transition duration-300 shadow-xl">
                                <div className="h-12 w-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Our Mission</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    To reduce crop loss by 30% globally through accessible, high-precision AI diagnostics. We believe every farmer deserves world-class advice, right in their pocket.
                                </p>
                            </div>

                            {/* Tech Card */}
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/15 transition duration-300 shadow-xl">
                                <div className="h-12 w-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">The Tech</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Powered by <strong>Gemini Vision 2.5 Flash</strong>, our "Pathologer Prime" system performs forensic analysis on every leaf, detecting subtle signs invisible to the naked eye.
                                </p>
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="text-center pt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Built for the Future</h2>
                            <p className="text-gray-400 max-w-lg mx-auto">
                                EcoFarm is continuously evolving. With real-time learning and community feedback, we stay ahead of emerging plant health threats.
                            </p>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
