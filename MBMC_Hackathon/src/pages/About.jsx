import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

export default function About({ onNavigate, activePage }) {
    const bgUrl = new URL('../landingpage.png', import.meta.url).href

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    }

    return (
        <div className="page">
            <motion.div
                className="device"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
            >
                <div className="deviceInner">
                    <div className="bg" style={{ backgroundImage: `url(${bgUrl})`, filter: 'brightness(0.4)' }} />
                    <div className="overlay" />

                    <div className="content" style={{ overflowY: 'auto', paddingBottom: 80 }}>
                        <Navbar onNavigate={onNavigate} activePage={activePage} />

                        <div style={{ marginTop: 80, maxWidth: 800, marginInline: 'auto', width: '100%', color: '#f3fff7' }}>
                            <motion.h1
                                initial="hidden"
                                animate="visible"
                                variants={fadeInUp}
                                style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}
                            >
                                Reimagining <span style={{ color: '#4ade80' }}>Agriculture</span>
                            </motion.h1>

                            <motion.p
                                initial="hidden"
                                animate="visible"
                                variants={fadeInUp}
                                style={{ fontSize: '1.2rem', lineHeight: 1.6, textAlign: 'center', opacity: 0.9, marginBottom: '3rem' }}
                            >
                                EcoFarm combines advanced computer vision with expert agronomy to empower farmers with instant, accurate disease diagnosis.
                            </motion.p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 24,
                                        padding: 32,
                                        backdropFilter: 'blur(12px)'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0, fontSize: '1.5rem', color: '#86efac' }}>Our Mission</h3>
                                    <p style={{ lineHeight: 1.6, opacity: 0.8 }}>
                                        To reduce crop loss by 30% globally through accessible, high-precision AI diagnostics. We believe every farmer deserves world-class advice.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 24,
                                        padding: 32,
                                        backdropFilter: 'blur(12px)'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0, fontSize: '1.5rem', color: '#60a5fa' }}>The Tech</h3>
                                    <p style={{ lineHeight: 1.6, opacity: 0.8 }}>
                                        Powered by Gemini Vision 2.5 Flash, our "Pathologer Prime" system performs forensic analysis on every leaf, detecting subtle signs invisible to the naked eye.
                                    </p>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                style={{ marginTop: 40, textAlign: 'center' }}
                            >
                                <h2 style={{ fontSize: '2rem', marginBottom: 20 }}>Built for the Future</h2>
                                <p style={{ maxWidth: 600, marginInline: 'auto', opacity: 0.8 }}>
                                    EcoFarm is continuously evolving. With real-time learning and community feedback, we stay ahead of emerging plant health threats.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
