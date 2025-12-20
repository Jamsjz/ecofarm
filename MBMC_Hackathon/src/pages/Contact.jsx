import { motion } from 'framer-motion'
import Header from '../Header'

export default function Contact({ onNavigate, activePage }) {
    return (
        <div className="device">
            <div className="deviceInner">
                <div className="bg" style={{ background: '#0b1a0e' }} />
                <Header onNavigate={onNavigate} activePage={activePage} />

                <div className="content" style={{ overflowY: 'auto' }}>
                    <div className="sub-page-content">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sub-hero"
                        >
                            <h1 className="heroTitle" style={{ textAlign: 'center' }}>Connect with Us</h1>
                            <p className="heroSubtitle" style={{ textAlign: 'center', margin: '20px auto' }}>
                                Reach out for enterprise solutions, partnership inquiries, or general support.
                            </p>
                        </motion.div>

                        <div className="section-glass" style={{ maxWidth: '600px', margin: '60px auto', padding: '50px' }}>
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} onSubmit={(e) => e.preventDefault()}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Email Address</label>
                                    <input
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '16px' }}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Message</label>
                                    <textarea
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '16px', minHeight: '150px', resize: 'vertical' }}
                                        placeholder="How can we help your harvest thrive?"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: '#a0ffd0' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ background: '#7cffb6', color: '#0b3f1c', border: 'none', borderRadius: '12px', padding: '18px', fontWeight: 950, cursor: 'pointer', fontSize: '16px', transition: 'box-shadow 0.3s' }}
                                >
                                    SEND ENQUIRY
                                </motion.button>
                            </form>
                        </div>

                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5, fontSize: '14px' }}>
                            pathologer HQ • 128 Innovation Way • Silicon Valley, CA
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
