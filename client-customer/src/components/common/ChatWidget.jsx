import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { useRef } from 'react';

export default function ChatWidget() {
    const phoneNumber = "919870646548"; // Admin Number
    const message = "Hi ResortWala, I need help with a booking.";
    const isDragging = useRef(false);

    // WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 200); }}
            onTap={() => {
                if (!isDragging.current) {
                    window.open(whatsappUrl, '_blank');
                }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-24 right-4 z-[9999] bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing"
            aria-label="Chat with us"
            title="Chat with Us (Drag to move)"
        >
            <FaWhatsapp size={24} />
        </motion.div>
    );
}
