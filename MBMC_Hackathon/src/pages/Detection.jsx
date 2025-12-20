import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import MouseImageTrail from '../components/MouseImageTrail'
import Header from '../Header'

export default function Detection({ onNavigate, activePage }) {
    const innerRef = useRef(null)
    const fileInputRef = useRef(null)
    const recognitionRef = useRef(null)

    const [prompt, setPrompt] = useState('')
    const [promptImage, setPromptImage] = useState(null)
    const [isListening, setIsListening] = useState(false)
    const [interim, setInterim] = useState('')
    const [hasStarted, setHasStarted] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isHoveringPrompt, setIsHoveringPrompt] = useState(false)

    const previewUrl = useMemo(() => {
        if (!promptImage) return null
        return URL.createObjectURL(promptImage)
    }, [promptImage])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    useEffect(() => {
        return () => {
            try {
                recognitionRef.current?.stop?.()
            } catch {
                // ignore
            }
        }
    }, [])

    const trailImages = [
        'https://commons.wikimedia.org/wiki/Special:FilePath/Tomato_je.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/CarrotDaucusCarota.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Broccoli_and_cross_section_edit.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Cauliflower.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Zucchini_1.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mediterranean_cucumber.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Peppers.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Aubergine.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Onion_on_White.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Peeled_garlic.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Apple.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Cherry.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Blueberry.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Strawberry_fruit.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Kyoho-grape.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Banana_Fruit.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Mango.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Pineapple.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/WaterMelon.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Grapes_in_a_bowl.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Sunflower_2007.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Small_Red_Rose.JPG?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Tulips.jpg?width=512',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Flowers,_lily.JPG?width=512',
    ]

    const toggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return

        if (!recognitionRef.current) {
            const rec = new SpeechRecognition()
            rec.continuous = true
            rec.interimResults = true
            rec.lang = 'en-US'

            rec.onresult = (event) => {
                let finalText = ''
                let interimText = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const res = event.results[i]
                    const text = res?.[0]?.transcript ?? ''
                    if (res.isFinal) finalText += text
                    else interimText += text
                }

                if (finalText) {
                    setPrompt((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText.trim()))
                    setInterim('')
                } else {
                    setInterim(interimText.trim())
                }
            }

            rec.onerror = () => {
                setIsListening(false)
                setInterim('')
            }

            rec.onend = () => {
                setIsListening(false)
                setInterim('')
            }

            recognitionRef.current = rec
        }

        if (isListening) {
            recognitionRef.current.stop()
            return
        }

        setInterim('')
        setIsListening(true)
        recognitionRef.current.start()
    }

    return (
        <div className="device">
            <div className="deviceInner" ref={innerRef}>
                <div className="bg" style={{ background: '#07140b' }} />
                <div className="overlay" style={{ opacity: 0.85 }} />

                <MouseImageTrail
                    containerRef={innerRef}
                    images={trailImages}
                    enabled={!hasStarted && !isHoveringPrompt}
                    size={120}
                    lifeMs={950}
                    spawnIntervalMs={26}
                    distanceThreshold={16}
                    maxItems={20}
                />

                <motion.div
                    className="promptCenter"
                    initial={{ top: '50%', transform: 'translate(-50%, -50%)' }}
                    animate={{
                        top: hasStarted ? '95%' : '50%',
                        transform: hasStarted ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)'
                    }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', left: '50%', bottom: 'auto', right: 'auto', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 100 }}
                >
                    {!hasStarted && (
                        <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ color: 'white', marginBottom: '20px', fontSize: '24px', fontWeight: '500' }}
                        >
                            How can I help you today?
                        </motion.h2>
                    )}

                    {previewUrl ? (
                        <div className="promptChip" style={{ marginBottom: '10px' }}>
                            <img className="promptThumb" src={previewUrl} alt="Attached" />
                            <button type="button" className="promptChipX" onClick={() => setPromptImage(null)}>
                                ✕
                            </button>
                        </div>
                    ) : null}
                    <motion.div
                        className="promptCard promptBar"
                        animate={{
                            borderRadius: hasStarted ? '12px' : '999px',
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        style={{ width: '100%' }}
                        onMouseEnter={() => setIsHoveringPrompt(true)}
                        onMouseLeave={() => setIsHoveringPrompt(false)}
                    >


                        <div style={{ position: 'relative', flexGrow: 1, display: 'flex' }}>
                            <input
                                className="promptInput promptInputBar"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsSending(true)
                                        setTimeout(() => setHasStarted(true), 100)
                                        setTimeout(() => setIsSending(false), 600)
                                        setPrompt('')
                                        setPromptImage(null)
                                        setInterim('')
                                    }
                                }}
                                placeholder="Ask pathologer"
                                style={{ paddingRight: '40px', width: '100%' }}
                            />
                            <motion.button
                                type="button"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'white',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}
                                initial={{ y: "-50%" }}
                                whileHover={{ scale: 1.1, rotate: 10, y: "-50%" }}
                                whileTap={{ scale: 0.9, y: "-50%" }}
                                onClick={() => {
                                    setIsSending(true)
                                    setTimeout(() => setHasStarted(true), 100)
                                    setTimeout(() => setIsSending(false), 600)
                                    setPrompt('')
                                    setPromptImage(null)
                                    setInterim('')
                                }}
                            >
                                <motion.div
                                    variants={{
                                        sending: {
                                            x: 50,
                                            y: -50,
                                            opacity: 0,
                                            scale: 0.5,
                                            transition: { duration: 0.5, ease: "anticipate" }
                                        },
                                        idle: {
                                            x: 0,
                                            y: 0,
                                            opacity: 1,
                                            scale: 1,
                                            transition: { duration: 0.4, ease: "backOut" }
                                        }
                                    }}
                                    initial="idle"
                                    animate={isSending ? "sending" : "idle"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </motion.div>
                            </motion.button>
                        </div>

                        <button
                            type="button"
                            className="promptBtn"
                            onClick={() => fileInputRef.current?.click?.()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null
                                setPromptImage(f)
                            }}
                        />

                        <button
                            type="button"
                            className={`promptBtn ${isListening ? 'isOn' : ''}`}
                            onClick={toggleVoice}
                            disabled={!(window.SpeechRecognition || window.webkitSpeechRecognition)}
                            title={!(window.SpeechRecognition || window.webkitSpeechRecognition) ? 'Voice not supported in this browser' : ''}
                        >
                            {isListening ? (
                                <span className="animate-pulse">Listening...</span>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            )}
                        </button>


                    </motion.div>

                    {interim ? <div className="promptInterim promptInterimBar">{interim}</div> : null}
                </motion.div>

                <div className="content" style={{ overflowY: 'auto' }}>
                    <Header onNavigate={onNavigate} activePage={activePage} />

                    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 500 }}>
                        <button type="button" className="backBtn" onClick={() => onNavigate('home')}>
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
