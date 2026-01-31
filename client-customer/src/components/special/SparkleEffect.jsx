import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SparkleEffect = () => {
    const [sparkles, setSparkles] = useState([]);

    useEffect(() => {
        // Check if seen this session
        const hasSeen = sessionStorage.getItem('has_seen_sparkles');
        if (hasSeen) return;

        const colors = ['#FF9933', '#FFFFFF', '#138808', '#FFD700', '#FFDF00']; // Saffron, White, Green, Gold, Bright Gold

        // Initial burst
        const createSparkles = () => {
            return Array.from({ length: 40 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 80 + 10,
                size: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 3,
                duration: Math.random() * 3 + 2,
                type: Math.random() > 0.5 ? 'star' : 'circle'
            }));
        };

        setSparkles(createSparkles());
        sessionStorage.setItem('has_seen_sparkles', 'true');

        const timer = setTimeout(() => setSparkles([]), 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
            <AnimatePresence>
                {sparkles.map((s) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0, y: 100 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.2, 1, 0],
                            y: [-20, -150 - Math.random() * 300],
                            x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 100],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: s.duration,
                            delay: s.delay,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            left: `${s.x}%`,
                            bottom: `${s.y}%`,
                            width: s.size,
                            height: s.size,
                            backgroundColor: s.color,
                            borderRadius: s.type === 'circle' ? '50%' : '2px',
                            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                            filter: 'blur(0.5px)',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SparkleEffect;
