import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        image: "https://images.unsplash.com/photo-1571896349842-6e53ce41e86a?q=80&w=2670&auto=format&fit=crop",
        title: "Luxury Redefined.",
        subtitle: "Experience the finest collection of villas and resorts. Your journey to paradise starts here."
    },
    {
        image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2670&auto=format&fit=crop",
        title: "Escape to Paradise.",
        subtitle: "Discover hidden gems and breathtaking views. Unwind in style."
    },
    {
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2670&auto=format&fit=crop",
        title: "Unforgettable Moments.",
        subtitle: "Create memories that last a lifetime with our curated stays."
    }
];

export default function AuthLeftPanel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-black">
            {/* Background Carousel */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 z-10" />
                    <img
                        src={slides[currentIndex].image}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content Overlay */}
            <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white w-full">
                {/* BIG LOGO */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex justify-start"
                >
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl">
                        <img
                            src="/resortwala-logo.png"
                            alt="ResortWala"
                            className="w-48 h-auto drop-shadow-lg"
                        />
                    </div>
                </motion.div>

                {/* Text Content */}
                <div className="mb-12">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-7xl font-black leading-tight tracking-tight mb-6 drop-shadow-lg">
                                {slides[currentIndex].title.split(" ")[0]} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                                    {slides[currentIndex].title.split(" ").slice(1).join(" ")}
                                </span>
                            </h1>
                            <p className="text-xl text-gray-200 max-w-lg font-light leading-relaxed drop-shadow-md border-l-4 border-red-500 pl-6">
                                {slides[currentIndex].subtitle}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer/Social Proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="flex items-center gap-6"
                >
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-14 h-14 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                                <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                        </div>
                        <p className="text-white font-medium text-sm"><span className="font-bold">10,000+</span> Happy Travelers</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
