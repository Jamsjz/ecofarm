import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './Header'


function IconSpark(props) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
            <path d="M12 2l1.4 6.1L20 10l-6.6 1.9L12 18l-1.4-6.1L4 10l6.6-1.9L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    )
}

function IconArrowUpRight(props) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
            <path d="M7 17L17 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 7h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
}

const calloutVariants = {
    hidden: { opacity: 0, scale: 0 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 400, damping: 20 }
    },
}

const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.4 }
        }
    },
}

const rectVariants = {
    hidden: { scaleX: 0, opacity: 0, originX: 0.5 },
    show: {
        scaleX: 1,
        opacity: 1,
        transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.5 }
    },
}

const textVariants = {
    hidden: { opacity: 0, x: 10, filter: 'blur(4px)' },
    show: {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 25,
            delay: 0.8
        }
    },
}

export default function LandingPage({ onNavigate, onExplore, activePage }) {
    const bgUrl = new URL('../landingpage.png', import.meta.url).href

    const [currentIndex, setCurrentIndex] = useState(0)
    const [mobileOpen, setMobileOpen] = useState(false)

    const plants = [
        {
            url: new URL('../diseased_leaf_scan.png', import.meta.url).href,
            name: 'Tomato (Fungal)',
            callouts: [
                { label: 'Fungal Spot', cx: 35, cy: 40, d: "M 35 40 H -30 V -20", box: { x: -65, y: -35 }, text: { x: -30, y: -27 } },
                { label: 'Deficiency', cx: 55, cy: 20, d: "M 55 20 H 130 V -20", box: { x: 95, y: -35 }, text: { x: 130, y: -27 } },
                { label: 'Chlorosis', cx: 70, cy: 65, d: "M 70 65 H 130 V 125", box: { x: 95, y: 130 }, text: { x: 130, y: 138 } }
            ]
        },
        {
            url: new URL('../leaf_rust.png', import.meta.url).href,
            name: 'Corn (Rust)',
            callouts: [
                { label: 'Rust Pustules', cx: 50, cy: 30, d: "M 50 30 H -20 V -25", box: { x: -55, y: -40 }, text: { x: -20, y: -32 } },
                { label: 'Sporulation', cx: 45, cy: 60, d: "M 45 60 H 130 V 120", box: { x: 95, y: 125 }, text: { x: 130, y: 133 } },
                { label: 'Leaf Necrosis', cx: 60, cy: 45, d: "M 60 45 H 140 V 10", box: { x: 105, y: -5 }, text: { x: 140, y: 3 } }
            ]
        },
        {
            url: new URL('../leaf_mildew.png', import.meta.url).href,
            name: 'Cucumber (Mildew)',
            callouts: [
                { label: 'White Mildew', cx: 45, cy: 35, d: "M 45 35 H -15 V -20", box: { x: -50, y: -35 }, text: { x: -15, y: -27 } },
                { label: 'Spore Coating', cx: 65, cy: 45, d: "M 65 45 H 135 V 20", box: { x: 100, y: 5 }, text: { x: 135, y: 13 } },
                { label: 'Lobe Decay', cx: 50, cy: 75, d: "M 50 75 H 125 V 135", box: { x: 90, y: 140 }, text: { x: 125, y: 148 } }
            ]
        },
        {
            url: new URL('../leaf_miner.png', import.meta.url).href,
            name: 'Citrus (Miner)',
            callouts: [
                { label: 'Feeding Trail', cx: 35, cy: 55, d: "M 35 55 H -25 V 10", box: { x: -60, y: -5 }, text: { x: -25, y: 3 } },
                { label: 'Miner Larvae', cx: 55, cy: 25, d: "M 55 25 H 140 V -20", box: { x: 105, y: -35 }, text: { x: 140, y: -27 } },
                { label: 'Silvery Path', cx: 65, cy: 50, d: "M 65 50 H 135 V 120", box: { x: 100, y: 125 }, text: { x: 135, y: 133 } }
            ]
        }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % plants.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [plants.length])

    return (
        <div className="page">
            <motion.div
                className="device"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="deviceInner">
                    <div className="bg" style={{ backgroundImage: `url(${bgUrl})` }} />
                    <div className="overlay" />

                    <div className="content">
                        <Header onNavigate={onNavigate} activePage={activePage} />


                        <div className="layout">
                            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
                                <a
                                    href="http://localhost:3000"
                                    className="backBtn"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span>Back to EcoFarm</span>
                                </a>
                            </div>
                            <motion.section
                                className="hero"
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
                                    },
                                }}
                            >
                                <motion.h1 className="heroTitle" variants={fadeUp}>
                                    Part of the future
                                    <br />
                                    Plant Health
                                </motion.h1>

                                <motion.p className="heroSubtitle" variants={fadeUp}>
                                    Detect crop diseases early with AI-powered leaf analysis and get
                                    actionable treatment guidance within minutes.
                                </motion.p>

                                <motion.div className="heroActions" variants={fadeUp}>
                                    <a
                                        className="ghostBtn"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            const rect = e.currentTarget?.getBoundingClientRect?.()
                                            if (onExplore) {
                                                onExplore(rect)
                                                return
                                            }
                                            onNavigate('detect')
                                        }}
                                    >
                                        <span>Explore</span>
                                        <span className="ghostArrow" aria-hidden="true">
                                            <IconArrowUpRight />
                                        </span>
                                    </a>
                                </motion.div>
                            </motion.section>

                            <div className="bottomArea">
                                <div className="cardsWrap">
                                    <div className="cardsRow">
                                        <motion.div
                                            className="featureCard featureCardLeft"
                                        >
                                            <div className="featureMedia">
                                                <div className="mediaFrame" style={{ position: 'relative', overflow: 'visible' }}>
                                                    <AnimatePresence>
                                                        <motion.div
                                                            key={plants[(currentIndex + 1) % plants.length].url}
                                                            initial={{ x: -1133 }}
                                                            animate={{ x: 0, y: 0 }}
                                                            exit={{ x: 1133, y: -380 }}
                                                            transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
                                                            style={{ position: 'absolute', inset: 0 }}
                                                        >
                                                            <img
                                                                src={plants[(currentIndex + 1) % plants.length].url}
                                                                alt="Scan in progress"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '22px'
                                                                }}
                                                            />
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                            <div className="featureBody">
                                                <div className="featureTitle">Leaf Scan</div>
                                                <div className="featureDesc">
                                                    Upload a photo of a leaf to detect diseases, nutrient deficiencies,
                                                    and pest damage.
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="featureCard featureCardRight"
                                        >
                                            <div className="featureBody">
                                                <div className="featureTitle">Instant Diagnosis</div>
                                                <div className="featureDesc">
                                                    Confidence scoring, severity level, and suggested next steps for
                                                    healthier harvests.
                                                </div>
                                            </div>
                                            <div className="featureMediaRight" style={{ position: 'relative', overflow: 'visible' }}>
                                                <div className="diagnosisView" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    <AnimatePresence>
                                                        <motion.div
                                                            key={plants[currentIndex].url}
                                                            initial={{ x: -1133, y: 380 }}
                                                            animate={{ x: 0, y: 0 }}
                                                            exit={{ x: 1133 }}
                                                            transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
                                                            style={{ position: 'absolute', inset: 0 }}
                                                        >
                                                            <img
                                                                src={plants[currentIndex].url}
                                                                alt="Leaf analysis"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '22px'
                                                                }}
                                                            />
                                                        </motion.div>
                                                    </AnimatePresence>

                                                    <AnimatePresence>
                                                        <motion.div
                                                            key={currentIndex}
                                                            initial="hidden"
                                                            animate="show"
                                                            exit="hidden"
                                                            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                                                        >
                                                            <motion.svg
                                                                className="calloutsOverlay"
                                                                viewBox="0 0 100 100"
                                                                style={{
                                                                    position: 'absolute',
                                                                    inset: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    overflow: 'visible'
                                                                }}
                                                            >
                                                                {plants[currentIndex].callouts.map((c, i) => (
                                                                    <motion.g key={i} variants={calloutVariants} transition={{ delayChildren: 1.1 + i * 0.5 }}>
                                                                        {/* Sonar Ping Effect */}
                                                                        <motion.circle
                                                                            cx={c.cx} cy={c.cy} r="4"
                                                                            fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"
                                                                            variants={{
                                                                                hidden: { scale: 0.5, opacity: 0 },
                                                                                show: {
                                                                                    scale: [1, 2.5],
                                                                                    opacity: [0.8, 0],
                                                                                    transition: { duration: 1.2, repeat: Infinity, delay: 0.3 }
                                                                                }
                                                                            }}
                                                                        />
                                                                        <motion.circle
                                                                            cx={c.cx} cy={c.cy} r="3.5"
                                                                            fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"
                                                                            variants={lineVariants}
                                                                        />
                                                                        <motion.path
                                                                            d={c.d}
                                                                            fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6"
                                                                            variants={lineVariants}
                                                                        />
                                                                        <motion.circle cx={c.text.x} cy={c.text.y + (c.text.y > 50 ? -8 : 8)} r="1.2" fill="rgba(0,0,0,0.3)" variants={calloutVariants} />
                                                                        <motion.rect
                                                                            x={c.box.x} y={c.box.y} width="70" height="12" rx="2"
                                                                            fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"
                                                                            variants={rectVariants}
                                                                            style={{ backdropFilter: 'blur(8px)' }}
                                                                        />
                                                                        <motion.text
                                                                            x={c.text.x} y={c.text.y}
                                                                            fill="#1a1a1a" fontSize="6.5" fontWeight="700" textAnchor="middle"
                                                                            variants={textVariants}
                                                                        >
                                                                            {c.label}
                                                                        </motion.text>
                                                                    </motion.g>
                                                                ))}
                                                            </motion.svg>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
