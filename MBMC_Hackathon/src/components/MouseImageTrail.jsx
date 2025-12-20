import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function MouseImageTrail({
    containerRef,
    images,
    enabled = true,
    size = 110,
    lifeMs = 900,
    spawnIntervalMs = 28,
    distanceThreshold = 18,
    maxItems = 18,
}) {
    const [items, setItems] = useState([])
    const [readyUrls, setReadyUrls] = useState([])
    const seq = useRef(0)
    const last = useRef({ x: 0, y: 0, t: 0, ready: false })
    const timeouts = useRef(new Map())

    const urls = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images])
    const usableUrls = readyUrls.length ? readyUrls : []

    useEffect(() => {
        if (!enabled) return
        if (urls.length === 0) return

        let alive = true
        setReadyUrls([])

        const preload = []
        const addReady = (src) => {
            if (!alive) return
            setReadyUrls((prev) => (prev.includes(src) ? prev : [...prev, src]))
        }

        for (const src of urls) {
            const img = new Image()
            img.decoding = 'async'
            img.loading = 'eager'
            img.onload = () => addReady(src)
            img.onerror = () => {
                // ignore broken images
            }
            img.src = src
            preload.push(img)
        }

        return () => {
            alive = false
            for (const img of preload) {
                img.src = ''
            }
        }
    }, [enabled, urls])

    useEffect(() => {
        if (!enabled) return
        const el = containerRef?.current
        if (!el) return
        if (usableUrls.length === 0) return

        const spawn = (clientX, clientY) => {
            const rect = el.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top

            const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
            const src = usableUrls[seq.current % usableUrls.length]
            seq.current += 1

            const rotate = (Math.random() * 18 - 9).toFixed(2)

            const item = {
                id,
                x,
                y,
                src,
                rotate: Number(rotate),
            }

            setItems((prev) => {
                const next = prev.length >= maxItems ? prev.slice(prev.length - (maxItems - 1)) : prev
                return [...next, item]
            })

            const timeoutId = window.setTimeout(() => {
                setItems((prev) => prev.filter((p) => p.id !== id))
                timeouts.current.delete(id)
            }, lifeMs)

            timeouts.current.set(id, timeoutId)
        }

        const onMove = (e) => {
            const now = performance.now()
            const { clientX, clientY } = e

            if (!last.current.ready) {
                last.current = { x: clientX, y: clientY, t: now, ready: true }
                spawn(clientX, clientY)
                return
            }

            const dx = clientX - last.current.x
            const dy = clientY - last.current.y
            const dist = Math.hypot(dx, dy)

            if (dist < distanceThreshold) return
            if (now - last.current.t < spawnIntervalMs) return

            last.current = { x: clientX, y: clientY, t: now, ready: true }
            spawn(clientX, clientY)
        }

        el.addEventListener('pointermove', onMove)

        return () => {
            el.removeEventListener('pointermove', onMove)
            for (const [, timeoutId] of timeouts.current) {
                window.clearTimeout(timeoutId)
            }
            timeouts.current.clear()
            setItems([])
        }
    }, [containerRef, distanceThreshold, enabled, lifeMs, maxItems, spawnIntervalMs, usableUrls])

    return (
        <div className="trailLayer" aria-hidden="true">
            <AnimatePresence>
                {items.map((it) => (
                    <motion.div
                        key={it.id}
                        className="trailItem"
                        initial={{ opacity: 0, scale: 0.65, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.15, filter: 'blur(8px)' }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            left: it.x - size / 2,
                            top: it.y - size / 2,
                            width: size,
                            height: size,
                            rotate: it.rotate,
                        }}
                    >
                        <img className="trailImg" src={it.src} alt="" draggable={false} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
