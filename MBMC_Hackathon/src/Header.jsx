import { motion } from 'framer-motion'

export default function Header({ onNavigate, activePage }) {
    return (
        <motion.header
            className="topbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ zIndex: 100, position: 'relative' }}
        >
            <div className="brandPill">
                <span className="brandText">pathologer</span>
            </div>
        </motion.header>
    )
}
