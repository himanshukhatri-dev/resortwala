import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ValentineHearts = () => {
    const [hearts, setHearts] = useState([]);

    useEffect(() => {
        // Trigger only once per session
        const hasSeen = sessionStorage.getItem('has_seen_valentine_hearts');
        if (hasSeen) return;

        const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#DB7093', '#FFF0F5']; // Pink/Rose tones

        const createHearts = () => {
            return Array.from({ length: 25 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 60 + 20, // Start from lower-middle
                size: Math.random() * 20 + 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 4,
                duration: Math.random() * 4 + 3
            }));
        };

        setHearts(createHearts());
        sessionStorage.setItem('has_seen_valentine_hearts', 'true');

        // Clean up after animation
        const timer = setTimeout(() => setHearts([]), 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[1999] overflow-hidden">
            <AnimatePresence>
                {hearts.map((h) => (
                    <motion.div
                        key={h.id}
                        initial={{ opacity: 0, scale: 0, y: 100 }}
                        animate={{
                            opacity: [0, 0.6, 0.4, 0],
                            scale: [0.5, 1, 1.2, 0.8],
                            y: [-50, -200 - Math.random() * 300],
                            x: (Math.random() - 0.5) * 100,
                            rotate: [0, (Math.random() - 0.5) * 45]
                        }}
                        transition={{
                            duration: h.duration,
                            delay: h.delay,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            left: `${h.x}%`,
                            bottom: `${h.y}%`,
                            color: h.color,
                            fontSize: h.size,
                            filter: 'blur(1px)',
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
