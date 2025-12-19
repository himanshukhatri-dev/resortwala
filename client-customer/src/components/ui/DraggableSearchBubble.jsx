import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';

export default function DraggableSearchBubble({ onClick }) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Constraints set by parent usually, or we use window? 
            // Better to let it drag freely but snap back or bounded by window.
            // Using constraintsRef in parent is better, but for now let's just allow dragging.
            // Actually, if we want it "move anywhere", we rarely want strict constraints, but we don't want it lost.
            // Let's use logic to keep it in view.
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-24 right-6 z-[900] cursor-grab active:cursor-grabbing"

            onClick={onClick}
            style={{ touchAction: 'none' }} // Prevent scrolling while dragging
        >
            <div className="bg-brand-primary text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 backdrop-blur-sm bg-gradient-to-r from-pink-500 to-rose-600">
                <FaSearch size={24} />
            </div>
            {/* Optional Label */}
            {/* <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-black/50 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                Search
            </span> */}
        </motion.div>
    );
}
