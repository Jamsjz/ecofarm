import { motion } from 'framer-motion'
import Header from '../Header'

const NeuralNetwork = () => {
    // Generate nodes and connections for the network
    const nodes = [
        { x: 20, y: 30 }, { x: 40, y: 20 }, { x: 60, y: 35 }, { x: 80, y: 25 },
        { x: 30, y: 55 }, { x: 50, y: 50 }, { x: 70, y: 60 }, { x: 90, y: 50 },
        { x: 25, y: 80 }, { x: 55, y: 85 }, { x: 85, y: 75 }
    ]

    const connections = [
        [0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [8, 9], [9, 10],
        [0, 4], [1, 5], [2, 6], [3, 7], [4, 8], [5, 9], [6, 10]
    ]

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
            opacity: 0.3
        }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {connections.map(([a, b], i) => (
                    <motion.line
                        key={`line-${i}`}
                        x1={nodes[a].x} y1={nodes[a].y}
                        x2={nodes[b].x} y2={nodes[b].y}
                        stroke="#7cffb6"
                        strokeWidth="0.1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                        filter="url(#glow)"
                    />
                ))}

                {nodes.map((node, i) => (
                    <motion.circle
                        key={`node-${i}`}
                        cx={node.x} cy={node.y}
                        r="0.4"
                        fill="#7cffb6"
                        animate={{
                            r: [0.3, 0.6, 0.3],
                            opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        filter="url(#glow)"
                    />
                ))}
            </svg>
        </div>
    )
}

export default function HowItWorks({ onNavigate, activePage }) {
    return (
        <div className="device">
            <div className="deviceInner">
                {/* Reusing the dark background aesthetic */}
                <div className="bg" style={{ background: '#07140b' }} />
                <div className="overlay" style={{ opacity: 0.85 }} />

                <NeuralNetwork />

                <Header onNavigate={onNavigate} activePage={activePage} />

                <div className="content" style={{ overflowY: 'auto', position: 'relative', zIndex: 10, flex: 1, height: 'auto', minHeight: 0 }}>
                    <div className="sub-page-content">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="sub-hero"
                        >
                            <h1 className="heroTitle" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', textAlign: 'center' }}>
                                Our Process
                            </h1>
                            <p className="heroSubtitle" style={{ textAlign: 'center', margin: '20px auto' }}>
                                pathologer uses state-of-the-art computer vision to identify plant pathogens in real-time.
                            </p>
                        </motion.div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', padding: '40px 0' }}>
                            {[
                                { title: '1. Scan', desc: 'Point your camera at a leaf. Our AI detects signs of stress before they are visible to the naked eye.' },
                                { title: '2. Process', desc: 'Over 12,000 data points are analyzed against our global agricultural database.' },
                                { title: '3. Heal', desc: 'Receive a step-by-step treatment plan using organic or chemical solutions as per your preference.' }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="section-glass"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>{item.title}</h3>
                                    <p style={{ opacity: 0.8, lineHeight: 1.6 }}>{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
