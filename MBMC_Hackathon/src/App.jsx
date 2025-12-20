import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './LandingPage'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'
import Detection from './pages/Detection'

// Navigation Component (shared or unique per page)
// For simplicity and since LandingPage 'is perfect', we'll let each page handle its own header
// but manage the state here.

const cubeVariants = {
    enter: (dir) => ({
        rotateX: dir > 0 ? 90 : -90,
        opacity: 0,
        y: dir > 0 ? '50%' : '-50%',
    }),
    center: {
        rotateX: 0,
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    exit: (dir) => ({
        rotateX: dir > 0 ? -90 : 90,
        opacity: 0,
        y: dir > 0 ? '-50%' : '50%',
        transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    })
}

const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

const revealVariants = {
    enter: {
        opacity: 0,
        scale: 0.96,
        y: 30
    },
    center: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1]
        }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
}


const pageOrder = ['home', 'how', 'contact', 'detect']

const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '')
    return pageOrder.includes(hash) ? hash : 'home'
}

export default function App() {
    const [activePage, setActivePage] = useState(getPageFromHash)
    const [prevPage, setPrevPage] = useState(getPageFromHash)
    const [direction, setDirection] = useState(0)
    const [exploreTransition, setExploreTransition] = useState(null)
    const [isFirstReveal, setIsFirstReveal] = useState(true)

    useEffect(() => {
        const handleHashChange = () => {
            const page = getPageFromHash()
            if (page !== activePage) {
                handleNavigate(page)
            }
        }
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [activePage])

    const handleNavigate = (page) => {
        if (page === activePage) return
        if (isFirstReveal) setIsFirstReveal(false)
        window.location.hash = page
        const currentIndex = pageOrder.indexOf(activePage)
        const nextIndex = pageOrder.indexOf(page)
        setDirection(nextIndex > currentIndex ? 1 : -1)
        setPrevPage(activePage)
        setActivePage(page)
    }

    const handleExplore = (rect) => {
        if (!rect) {
            handleNavigate('detect')
            return
        }

        const target = {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        }

        setExploreTransition({ rect, target, phase: 'expand' })
    }


    const renderPage = () => {
        switch (activePage) {
            case 'home': return <LandingPage onNavigate={handleNavigate} onExplore={handleExplore} activePage={activePage} />
            case 'how': return <HowItWorks onNavigate={handleNavigate} activePage={activePage} />
            case 'contact': return <Contact onNavigate={handleNavigate} activePage={activePage} />
            case 'detect': return <Detection onNavigate={handleNavigate} activePage={activePage} />
            default: return <LandingPage onNavigate={handleNavigate} onExplore={handleExplore} activePage={activePage} />
        }
    }

    return (
        <div className="cube-wrap">
            <AnimatePresence>
                {exploreTransition && (
                    <motion.div
                        key="explore-transition"
                        initial={{
                            left: exploreTransition.rect.left,
                            top: exploreTransition.rect.top,
                            width: exploreTransition.rect.width,
                            height: exploreTransition.rect.height,
                            borderRadius: 999,
                            opacity: 1,
                        }}
                        animate={
                            exploreTransition.phase === 'expand'
                                ? {
                                    left: exploreTransition.target.left,
                                    top: exploreTransition.target.top,
                                    width: exploreTransition.target.width,
                                    height: exploreTransition.target.height,
                                    borderRadius: 0,
                                    opacity: 1,
                                }
                                : {
                                    left: exploreTransition.target.left,
                                    top: exploreTransition.target.top,
                                    width: exploreTransition.target.width,
                                    height: exploreTransition.target.height,
                                    borderRadius: 0,
                                    opacity: 0,
                                }
                        }
                        exit={{ opacity: 0 }}
                        transition={{ duration: exploreTransition.phase === 'expand' ? 0.55 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                        onAnimationComplete={() => {
                            if (!exploreTransition) return
                            if (exploreTransition.phase === 'expand') {
                                handleNavigate('detect')
                                setExploreTransition((prev) => prev ? { ...prev, phase: 'reveal' } : prev)
                                return
                            }
                            setExploreTransition(null)
                        }}
                        style={{
                            position: 'fixed',
                            zIndex: 9999,
                            background: 'rgba(7, 20, 11, 0.96)',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            boxShadow: '0 50px 140px rgba(0,0,0,0.62)',
                            backdropFilter: 'blur(10px)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence custom={direction} mode="wait">
                <motion.div
                    key={activePage}
                    custom={direction}
                    variants={isFirstReveal ? revealVariants : (exploreTransition ? fadeVariants : cubeVariants)}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="cube-page"
                    onAnimationComplete={() => {
                        if (isFirstReveal) setIsFirstReveal(false)
                    }}
                >
                    {renderPage()}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
