import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import MouseImageTrail from '../components/MouseImageTrail'
import Header from '../Header'

// Typewriter component for animated text reveal
function TypewriterText({ text, speed = 15 }) {
    const [displayedText, setDisplayedText] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!text) return
        setDisplayedText('')
        setIsComplete(false)
        let index = 0
        const timer = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1))
                index++
            } else {
                setIsComplete(true)
                clearInterval(timer)
            }
        }, speed)
        return () => clearInterval(timer)
    }, [text, speed])

    return (
        <div className="markdown-content">
            <ReactMarkdown>{displayedText}</ReactMarkdown>
            {!isComplete && <span className="cursor-blink">▌</span>}
        </div>
    )
}

export default function Detection({ onNavigate, activePage }) {
    const innerRef = useRef(null)
    const fileInputRef = useRef(null)
    const recognitionRef = useRef(null)
    const chatContainerRef = useRef(null)

    const [prompt, setPrompt] = useState('')
    const [promptImage, setPromptImage] = useState(null)
    const [isListening, setIsListening] = useState(false)
    const [interim, setInterim] = useState('')
    const [hasStarted, setHasStarted] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isHoveringPrompt, setIsHoveringPrompt] = useState(false)
    const [messages, setMessages] = useState([])
    const [isLoadingAI, setIsLoadingAI] = useState(false)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (innerRef.current && hasStarted) {
            innerRef.current.scrollTop = innerRef.current.scrollHeight
        }
    }, [messages, isLoadingAI, hasStarted])

    const sendMessage = async () => {
        const currentPrompt = prompt.trim()
        const currentImage = promptImage

        if (!currentPrompt && !currentImage) return

        // Animation states
        setIsSending(true)
        setTimeout(() => setHasStarted(true), 100)
        setTimeout(() => setIsSending(false), 600)

        // Clear inputs
        setPrompt('')
        setPromptImage(null)
        setInterim('')

        // Add user message with image if present
        const imageUrl = currentImage ? URL.createObjectURL(currentImage) : null
        const userMessage = { role: 'user', content: currentPrompt || '', imageUrl }
        setMessages(prev => [...prev, userMessage])

        // Call API
        setIsLoadingAI(true)
        try {
            const formData = new FormData()
            if (currentImage) {
                formData.append('image', currentImage)
            } else {
                // API requires an image, use a placeholder if none provided
                const placeholderBlob = new Blob([''], { type: 'image/png' })
                formData.append('image', placeholderBlob, 'placeholder.png')
            }

            const messageParam = encodeURIComponent(currentPrompt || '')
            const response = await fetch(`http://localhost:8000/dpredict?message=${messageParam}`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                const aiMessage = { role: 'ai', content: data.chatres || 'No response from AI' }
                setMessages(prev => [...prev, aiMessage])
            } else {
                const aiMessage = { role: 'ai', content: 'Error: Could not get AI response' }
                setMessages(prev => [...prev, aiMessage])
            }
        } catch (error) {
            const aiMessage = { role: 'ai', content: `Error: ${error.message}` }
            setMessages(prev => [...prev, aiMessage])
        } finally {
            setIsLoadingAI(false)
        }
    }

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
            <div className="deviceInner" ref={innerRef} style={{ position: 'relative', overflow: 'hidden' }}>
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
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        overflowY: hasStarted ? 'auto' : 'hidden', // Only scroll when active
                        overflowX: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 100,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        scrollBehavior: 'smooth',
                        pointerEvents: hasStarted ? 'auto' : 'none' // Critical for scrolling
                    }}
                >
                    {/* Top Spacer pushes content down, shrinking if needed */}
                    <motion.div
                        style={{ width: '100%', minHeight: '20px', flexGrow: 1, flexShrink: 1 }}
                    />

                    {/* Content Wrapper */}
                    <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingBottom: '20px' }}>
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

                        {hasStarted && messages.length > 0 && (
                            <div
                                ref={chatContainerRef}
                                style={{
                                    width: '100%',
                                    marginBottom: '15px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    padding: '10px'
                                }}>
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: msg.role === 'user'
                                                ? 'rgba(255, 255, 255, 0.15)'
                                                : 'rgba(34, 197, 94, 0.2)',
                                            color: 'white',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            backdropFilter: 'blur(10px)',
                                            border: msg.role === 'user'
                                                ? '1px solid rgba(255, 255, 255, 0.2)'
                                                : '1px solid rgba(34, 197, 94, 0.3)',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}
                                    >
                                        {msg.imageUrl && (
                                            <img
                                                src={msg.imageUrl}
                                                alt="Uploaded"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '200px',
                                                    borderRadius: '8px',
                                                    marginBottom: msg.content ? '8px' : 0,
                                                    display: 'block'
                                                }}
                                            />
                                        )}
                                        {msg.role === 'ai' ? (
                                            <TypewriterText text={msg.content} speed={10} />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                ))}
                                {isLoadingAI && (
                                    <div style={{
                                        alignSelf: 'flex-start',
                                        padding: '12px 16px',
                                        borderRadius: '16px 16px 16px 4px',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        color: 'white',
                                        fontSize: '14px',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                    }}>
                                        Thinking...
                                    </div>
                                )}
                            </div>
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
                                            sendMessage()
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
                                        sendMessage()
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
                    </div>

                    {/* Bottom Spacer animates size to effectively move content from Center -> Bottom */}
                    <motion.div
                        initial={{ flexGrow: 1 }}
                        animate={{ flexGrow: hasStarted ? 0 : 1 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{ width: '100%', minHeight: '20px', flexShrink: 1 }}
                    />
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
