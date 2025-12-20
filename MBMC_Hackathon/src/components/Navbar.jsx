import { motion } from 'framer-motion'

export default function Navbar({ activePage, onNavigate }) {
    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'detect', label: 'Pathologer' },
        { id: 'about', label: 'About Us' },
    ]

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{
                position: 'absolute',
                top: 24,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 100
            }}
        >
            <div style={{
                pointerEvents: 'auto',
                display: 'flex',
                gap: 8,
                padding: '6px',
                borderRadius: 999,
                background: 'rgba(8, 20, 12, .45)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                {navItems.map((item) => {
                    const isActive = activePage === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            style={{
                                appearance: 'none',
                                border: 'none',
                                background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                                padding: '8px 16px',
                                borderRadius: 999,
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = '#fff'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                                    e.currentTarget.style.background = 'transparent'
                                }
                            }}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}
