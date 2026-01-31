import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ValentineHearts = () => {
    const [hearts, setHearts] = useState([]);

    useEffect(() => {
        // Trigger only once per session
        const hasSeen = sessionStorage.getItem('has_seen_valentine_hearts_v2');
        if (hasSeen) return;

        const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#DB7093', '#FFF0F5', '#FF385C', '#E00B41']; // Pink/Rose/Red tones

        const createHearts = () => {
            return Array.from({ length: 30 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100, // Random horizontal position
                size: Math.random() * 30 + 15, // Larger size variance (15px to 45px)
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 5,
                duration: Math.random() * 5 + 7 // Duration between 7s and 12s
            }));
        };

        setHearts(createHearts());
        sessionStorage.setItem('has_seen_valentine_hearts_v2', 'true');

        // Clean up after animation
        const timer = setTimeout(() => setHearts([]), 20000); // clear after max duration
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[1999] overflow-hidden">
            <AnimatePresence>
                {hearts.map((h) => (
                    <motion.div
                        key={h.id}
                        initial={{ opacity: 0, scale: 0, y: "10vh" }} // Start slightly below/at bottom
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1, 1.2, 0.8],
                            y: "-120vh", // Float way up above the screen
                            x: (Math.random() - 0.5) * 200, // Drift horizontally
                            rotate: [0, (Math.random() - 0.5) * 90]
                        }}
                        transition={{
                            duration: h.duration,
                            delay: h.delay,
                            ease: "linear"
                        }}
                        style={{
                            position: 'absolute',
                            left: `${h.x}%`,
                            bottom: 0, // Anchor to bottom
                            color: h.color,
                            fontSize: h.size,
                            filter: 'blur(0.5px)',
                        }}
                    >
                        ❤️
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ValentineHearts;
